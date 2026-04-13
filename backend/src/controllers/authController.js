const mongoose = require("mongoose");
const User = require("../models/UserModel");
const Log = require("../models/LogModel");
const jwt = require("jsonwebtoken");
const { getJWTSecret } = require("../config/jwt");
const { recordLoginAttempt } = require("../services/loginAttemptService");
const { generateHash } = require("../services/hashService");
const { getClientIp } = require("../utils/requestIp");

function dbReady() {
  return mongoose.connection.readyState === 1;
}

function issueToken(user) {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.isAdmin ? "admin" : "user",
    },
    getJWTSecret(),
    { expiresIn: "1h" }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    isAdmin: Boolean(user.isAdmin),
  };
}

async function createLoginEventLog({
  user,
  usernameAttempted,
  ip,
  success,
  attemptCount,
}) {
  const ts = new Date();
  const msg = success
    ? `Login success for ${usernameAttempted}`
    : `Login failed for ${usernameAttempted}`;
  const hash = generateHash({
    message: msg,
    ip,
    timestamp: ts,
    userId: user?._id || user?.id || "",
  });

  await Log.create({
    user: user?._id || null,
    username: usernameAttempted,
    eventType: "login",
    status: success ? "success" : "failed",
    attemptCount: Number(attemptCount) || 0,
    message: msg,
    ip,
    timestamp: ts,
    hash,
    verified: true,
  });
}

exports.register = async (req, res) => {
  try {
    if (!dbReady()) {
      console.error(
        "[register] MongoDB not ready, readyState=",
        mongoose.connection.readyState
      );
      return res.status(503).json({
        error:
          "Database is not connected. Start MongoDB (see npm run mongo:local on Windows) and check MONGO_URI in .env.",
      });
    }

    let { username, password } = req.body || {};
    username = typeof username === "string" ? username.trim() : "";
    password = typeof password === "string" ? password : String(password ?? "");

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    if (username.length < 3 || username.length > 64) {
      return res.status(400).json({ error: "Username must be between 3 and 64 characters" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ username }).lean();
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const bootstrap = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim();
    const isAdmin = Boolean(bootstrap && username === bootstrap);

    const user = new User({ username, password, isAdmin });
    await user.save();

    console.log("[register] user saved:", user._id.toString(), user.username, isAdmin ? "(admin)" : "");

    const token = issueToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("[register] save or token error:", error);

    if (error.code === 11000) {
      return res.status(400).json({ error: "User already exists" });
    }
    if (error.message && error.message.includes("JWT_SECRET")) {
      return res.status(503).json({ error: "Server auth is not configured." });
    }
    if (error.name === "ValidationError") {
      const msgs = Object.values(error.errors || {}).map((e) => e.message);
      return res.status(400).json({ error: msgs.join(", ") || "Validation failed" });
    }

    return res.status(500).json({
      error: error.message || "Registration failed",
    });
  }
};

exports.login = async (req, res) => {
  try {
    if (!dbReady()) {
      console.error(
        "[login] MongoDB not ready, readyState=",
        mongoose.connection.readyState
      );
      return res.status(503).json({
        error:
          "Database is not connected. Start MongoDB and verify MONGO_URI.",
      });
    }

    let { username, password } = req.body || {};
    username = typeof username === "string" ? username.trim() : "";
    password = typeof password === "string" ? password : String(password ?? "");

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const ip = getClientIp(req);
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      const attempt = await recordLoginAttempt({
        userId: user?._id,
        usernameAttempted: username,
        ip,
        success: false,
        anchorOnChain: false,
      });
      await createLoginEventLog({
        user,
        usernameAttempted: username,
        ip,
        success: false,
        attemptCount: attempt.attemptCount,
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const attempt = await recordLoginAttempt({
      userId: user._id,
      usernameAttempted: username,
      ip,
      success: true,
      anchorOnChain: true,
    });
    await createLoginEventLog({
      user,
      usernameAttempted: username,
      ip,
      success: true,
      attemptCount: attempt.attemptCount,
    });

    const token = issueToken(user);

    return res.json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("[login] error:", error);
    if (error.message && error.message.includes("JWT_SECRET")) {
      return res.status(503).json({ error: "Server auth is not configured." });
    }
    return res.status(500).json({ error: error.message || "Login failed" });
  }
};
