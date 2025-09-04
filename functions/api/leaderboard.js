const { onRequest } = require("firebase-functions/v2/https");
const { db } = require("../utils/firebase");
const { LEVEL_IDS } = require("../utils/constants");

exports.apiLeaderboardTotal = onRequest({ invoker: "public" }, async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  try {
    const qs = await db.collection("leaderboards_total")
      .orderBy("totalScore", "desc").limit(limit).get();
    return res.json({ items: qs.docs.map(d => d.data()) });
  } catch (e) {
    console.error("apiLeaderboardTotal error:", e);
    return res.status(500).json({ error: "Failed to load total leaderboard" });
  }
});

exports.apiLeaderboardLevel = onRequest({ invoker: "public" }, async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");
  const levelId = String(req.query.levelId || "");
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  if (!LEVEL_IDS.includes(levelId)) {
    return res.status(400).json({ error: "Invalid levelId" });
  }
  try {
    const qs = await db.collection("leaderboards_level")
      .doc(levelId).collection("entries")
      .orderBy("bestScore", "desc").limit(limit).get();
    return res.json({ items: qs.docs.map(d => d.data()) });
  } catch (e) {
    console.error("apiLeaderboardLevel error:", e);
    return res.status(500).json({ error: "Failed to load level leaderboard" });
  }
});