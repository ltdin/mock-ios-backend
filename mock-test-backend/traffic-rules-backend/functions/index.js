const { setGlobalOptions } = require("firebase-functions/v2");
setGlobalOptions({ region: "asia-southeast1", memory: "256MiB" });

// Profile
exports.apiUpdateProfile     = require("./api/updateProfile").apiUpdateProfile;

// Score / Me
exports.apiSubmitScore       = require("./api/score").apiSubmitScore;
exports.apiProfile           = require("./api/getProfile.js").apiProfile;

// Leaderboards
exports.apiLeaderboardTotal  = require("./api/leaderboard").apiLeaderboardTotal;
exports.apiLeaderboardLevel  = require("./api/leaderboard").apiLeaderboardLevel;

// Auth management
exports.apiSignOut           = require("./api/signout").apiSignOut;
