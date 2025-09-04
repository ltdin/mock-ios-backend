const { onRequest } = require("firebase-functions/v2/https");
const { FieldValue } = require("firebase-admin/firestore");
const { admin, db } = require("../utils/firebase");
const { requireAuth } = require("../utils/auth");
const { setCors } = require("../utils/http");
const { buildDownloadUrl } = require("../utils/storage");

const os = require("os");
const path = require("path");
const fs = require("fs");
const Busboy = require("busboy");
const { randomBytes } = require("crypto");

exports.apiUpdateProfile = onRequest(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const decoded = await requireAuth(req, res);
  if (!decoded) return;
  const uid = decoded.uid;

  const bucket = admin.storage().bucket();
  const bucketName = bucket.name;

  let displayName = null;
  let tmpFilePath = null;
  let uploadFileName = null;
  let mimeType = null;

  const contentType = req.headers["content-type"] || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return res.status(400).json({ error: "Content-Type must be multipart/form-data" });
  }

  const busboy = Busboy({
    headers: req.headers,
    limits: { files: 1, fileSize: 5 * 1024 * 1024 }
  });

  const parsePromise = new Promise((resolve, reject) => {
    busboy.on("field", (name, val) => {
      if (name === "displayName") displayName = String(val || "").trim();
    });

    busboy.on("file", (name, file, info) => {
      if (name !== "avatar") { file.resume(); return; }
      uploadFileName = info.filename;
      mimeType = info.mimeType || "application/octet-stream";
      const tempPath = path.join(os.tmpdir(), `${uid}-${Date.now()}-${uploadFileName}`);
      tmpFilePath = tempPath;
      const ws = fs.createWriteStream(tempPath);
      file.pipe(ws);
      ws.on("error", reject);
      file.on("limit", () => reject(new Error("File too large")));
    });

    busboy.on("finish", resolve);
    busboy.on("error", reject);
  });

  try {
    if (req.rawBody && req.rawBody.length) busboy.end(req.rawBody);
    else req.pipe(busboy);
    await parsePromise;

    const userRef = db.collection("users").doc(uid);
    const updates = { updatedAt: FieldValue.serverTimestamp() };

    if (displayName && displayName.length > 0) {
      updates.displayName = displayName;
      try { await admin.auth().updateUser(uid, { displayName }); } catch {}
    }

    if (tmpFilePath && fs.existsSync(tmpFilePath)) {
      const ext = path.extname(uploadFileName || "").replace(".", "") || "jpg";
      const destPath = `avatar/${uid}/${Date.now()}.${ext}`;
      const token = (global.crypto?.randomUUID?.() || randomBytes(16).toString("hex"));

      await bucket.upload(tmpFilePath, {
        destination: destPath,
        metadata: {
          contentType: mimeType,
          metadata: { firebaseStorageDownloadTokens: token }
        }
      });
      try { fs.unlinkSync(tmpFilePath); } catch {}

      const avatarUrl = buildDownloadUrl(bucketName, destPath, token);
      updates.avatarUrl = avatarUrl;
      try { await admin.auth().updateUser(uid, { photoURL: avatarUrl }); } catch {}
    }

    if (!("displayName" in updates) && !("avatarUrl" in updates)) {
      return res.status(400).json({ error: "Nothing to update. Provide displayName and/or avatar file." });
    }

    await userRef.set(updates, { merge: true });
    const snap = await userRef.get();
    return res.json({ ok: true, profile: snap.data() });
  } catch (e) {
    console.error("apiUpdateProfile error:", e);
    return res.status(500).json({ error: "Update failed", detail: e.message });
  }
});
