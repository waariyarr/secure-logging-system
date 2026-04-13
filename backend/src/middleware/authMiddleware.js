const jwt = require("jsonwebtoken");
const { getJWTSecret } = require("../config/jwt");

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = header.split(" ")[1];
  let secret;
  try {
    secret = getJWTSecret();
  } catch {
    return res.status(503).json({ error: "Server auth is not configured." });
  }

  try {
    const payload = jwt.verify(token, secret);
    if (!payload.role) {
      payload.role = "user";
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
