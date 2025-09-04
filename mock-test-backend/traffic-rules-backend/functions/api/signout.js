const { onRequest } = require("firebase-functions/v2/https");
const { FieldValue } = require("firebase-admin/firestore");
const { admin, db } = require("../utils/firebase");
const { requireAuth } = require("../utils/auth");
const { setCors } = require("../utils/http");

exports.apiSignOut = onRequest(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const decoded = await requireAuth(req, res);
  if (!decoded) return;

  try {
    await admin.auth().revokeRefreshTokens(decoded.uid);
    await db.collection("users").doc(decoded.uid).set({
      signOutAt: FieldValue.serverTimestamp()
    }, { merge: true });
    return res.json({ ok: true, message: "Signed out everywhere" });
  } catch (e) {
    console.error("apiSignOut error:", e);
    return res.status(500).json({ error: "Sign out failed", detail: e.message });
  }
});
