const { onRequest } = require("firebase-functions/v2/https");
const { db } = require("../utils/firebase");
const { requireAuth } = require("../utils/auth");

exports.apiProfile = onRequest(async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");
  const decoded = await requireAuth(req, res);
  if (!decoded) return;

  try {
    const snap = await db.collection("users").doc(decoded.uid).get();
    if (!snap.exists) {
      return res.json({
        exists: false,
        profile: {
          displayName: decoded.name || "",
          avatarUrl: decoded.picture || "",
          unlockedLevel: "e1",
          bestScores: {},
          totalScore: 0
        }
      });
    }
    return res.json({ exists: true, profile: snap.data() });
  } catch (e) {
    console.error("Profile API Error:", e);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});
