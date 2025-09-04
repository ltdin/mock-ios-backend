const { LEVEL_IDS } = require("./constants");

function isBetterScore(newScore, currentBest) {
  if (currentBest == null) return true;
  return newScore > currentBest;
}

function calcTotalScore(bestScores) {
  if (!bestScores) return 0;
  return Object.values(bestScores).reduce((a, b) => a + (b || 0), 0);
}

function nextUnlockedLevel(currentUnlocked, bestScores) {
  const startIndex = Math.max(0, LEVEL_IDS.indexOf(currentUnlocked || "e1"));
  let i = startIndex;
  while (i < LEVEL_IDS.length && (bestScores?.[LEVEL_IDS[i]] ?? 0) > 0) i++;
  return LEVEL_IDS[Math.min(i, LEVEL_IDS.length - 1)];
}

module.exports = { isBetterScore, calcTotalScore, nextUnlockedLevel };
