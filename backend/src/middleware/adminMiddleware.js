const User = require("../models/UserModel");

/**
 * Must run after authMiddleware. Authorizes only users with isAdmin in DB.
 */
module.exports = async function requireAdmin(req, res, next) {
  try {
    const uid = req.user?.id;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const u = await User.findById(uid).select("isAdmin").lean();
    if (!u?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (e) {
    console.error("[adminMiddleware]", e);
    return res.status(500).json({ error: "Admin check failed" });
  }
};
