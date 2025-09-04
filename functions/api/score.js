const { onRequest } = require("firebase-functions/v2/https");
const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../utils/firebase");
const { requireAuth } = require("../utils/auth");
const { LEVEL_IDS } = require("../utils/constants");
const { isBetterScore, calcTotalScore, nextUnlockedLevel } = require("../utils/scoring");

exports.apiSubmitScore = onRequest({ invoker: "public" }, async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const decoded = await requireAuth(req, res);
  if (!decoded) return;

  const { levelId, score } = req.body || {};
  if (typeof levelId !== "string" || !LEVEL_IDS.includes(levelId) ||
      typeof score !== "number" || score < 0) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const uid = decoded.uid;
  const userRef = db.collection("users").doc(uid);
  const levelEntryRef = db.collection("leaderboards_level").doc(levelId).collection("entries").doc(uid);
  const totalRef = db.collection("leaderboards_total").doc(uid);

  try {
    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      let userData = userSnap.exists ? userSnap.data() : {
        displayName: decoded.name || "",
        avatarUrl: decoded.picture || "",
        createdAt: FieldValue.serverTimestamp(),
        unlockedLevel: "e1",
        bestScores: {},
        totalScore: 0
      };

      const unlocked = userData.unlockedLevel || "e1";
      if (LEVEL_IDS.indexOf(levelId) > LEVEL_IDS.indexOf(unlocked)) {
        throw new Error(`Level ${levelId} is locked. Current unlocked: ${unlocked}`);
      }

      const currentBest = userData.bestScores?.[levelId] ?? null;
      if (isBetterScore(score, currentBest)) {
        userData.bestScores = userData.bestScores || {};
        userData.bestScores[levelId] = score;
      }

      userData.totalScore = calcTotalScore(userData.bestScores);
      userData.unlockedLevel = nextUnlockedLevel(userData.unlockedLevel, userData.bestScores);

      tx.set(userRef, userData, { merge: true });

      tx.set(levelEntryRef, {
        uid,
        displayName: userData.displayName || decoded.name || "",
        avatarUrl: userData.avatarUrl || decoded.picture || "",
        levelId,
        bestScore: userData.bestScores[levelId] || 0,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      tx.set(totalRef, {
        uid,
        displayName: userData.displayName || decoded.name || "",
        avatarUrl: userData.avatarUrl || decoded.picture || "",
        totalScore: userData.totalScore,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("apiSubmitScore error:", e);
    return res.status(400).json({ error: e.message || "Submit failed" });
  }
});
