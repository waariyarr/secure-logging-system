const User = require("../models/UserModel");
const Log = require("../models/LogModel");
const LoginAttempt = require("../models/LoginAttemptModel");
const { listThreatsForAdmin } = require("../services/threatDetectionService");

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (e) {
    console.error("[admin listUsers]", e);
    res.status(500).json({ error: e.message });
  }
};

exports.listLoginAttempts = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 1000);
    const attempts = await LoginAttempt.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("userId", "username")
      .lean();
    res.json(attempts);
  } catch (e) {
    console.error("[admin listLoginAttempts]", e);
    res.status(500).json({ error: e.message });
  }
};

exports.listThreats = async (req, res) => {
  try {
    const threats = await listThreatsForAdmin();
    res.json(threats);
  } catch (e) {
    console.error("[admin listThreats]", e);
    res.status(500).json({ error: e.message });
  }
};

exports.listAllLogs = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 300, 1), 2000);
    const logs = await Log.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("user", "username isAdmin")
      .lean();
    res.json(logs);
  } catch (e) {
    console.error("[admin listAllLogs]", e);
    res.status(500).json({ error: e.message });
  }
};
