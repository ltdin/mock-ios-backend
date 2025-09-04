const { admin } = require("./firebase");

async function requireAuth(req, res, { checkRevoked = true } = {}) {
  const authHeader = req.headers.authorization || "";
  const m = authHeader.match(/^Bearer (.+)$/);
  if (!m) {
    res.status(401).json({ error: "Missing Authorization Bearer token" });
    return null;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(m[1], checkRevoked);
    return decoded;
  } catch (e) {
    res.status(401).json({ error: "Invalid or revoked token" });
    return null;
  }
}

module.exports = { requireAuth };
