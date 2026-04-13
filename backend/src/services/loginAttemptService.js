const mongoose = require("mongoose");
const LoginAttempt = require("../models/LoginAttemptModel");
const { persistThreatForIp } = require("./threatDetectionService");
const { anchorLoginAttemptPayload } = require("./blockchainService");
const WINDOW_MINUTES = 15;

function getWindowStart() {
  return new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
}

function toObjectId(id) {
  if (!id) return null;
  try {
    return new mongoose.Types.ObjectId(String(id));
  } catch {
    return null;
  }
}

/**
 * Record a login attempt and update brute-force threat state for this IP.
 */
exports.recordLoginAttempt = async ({
  userId,
  usernameAttempted,
  ip,
  success,
  anchorOnChain = false,
}) => {
  const uid = toObjectId(userId);
  const ts = new Date();
  const cleanIp = String(ip || "unknown").trim();
  const isSuccess = Boolean(success);
  const cleanUsername =
    String(usernameAttempted || "").trim().toLowerCase() || "unknown";

  let attemptCount = 0;
  if (!isSuccess) {
    const since = getWindowStart();
    const scopeQuery = uid
      ? { userId: uid }
      : { usernameAttempted: cleanUsername };
    attemptCount = await LoginAttempt.countDocuments({
      ...scopeQuery,
      ip: cleanIp,
      success: false,
      timestamp: { $gte: since },
    });
    attemptCount += 1; // include this new failed event
  }

  const doc = await LoginAttempt.create({
    userId: uid,
    usernameAttempted: cleanUsername,
    ip: cleanIp,
    success: isSuccess,
    attemptCount,
    timestamp: ts,
  });

  if (!isSuccess) {
    await persistThreatForIp({
      ip: doc.ip,
      failedCount: attemptCount,
      relatedUserId: uid,
      usernameAttempted: cleanUsername,
    });
  }

  if (isSuccess && anchorOnChain && uid) {
    try {
      const chain = await anchorLoginAttemptPayload({
        userId: uid,
        ip: doc.ip,
        timestamp: ts,
      });
      if (chain?.receipt) {
        doc.blockchainTxHash = chain.receipt.transactionHash;
        doc.chainLogIndex = chain.chainLogIndex;
        await doc.save();
      }
    } catch (e) {
      console.warn("[loginAttempt] chain anchor skipped:", e.message);
    }
  }

  return doc;
};
