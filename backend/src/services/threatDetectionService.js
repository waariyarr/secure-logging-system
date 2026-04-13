const mongoose = require("mongoose");
const LoginAttempt = require("../models/LoginAttemptModel");
const Threat = require("../models/ThreatModel");

const BRUTE_THRESHOLD = 5;
const WINDOW_MINUTES = 15;
let indexesReady = false;

async function ensureThreatIndexes() {
  if (indexesReady) return;
  try {
    // Old builds used this unique index and it breaks per-user+ip threats.
    await Threat.collection.dropIndex("sourceIp_1_type_1");
  } catch (_) {
    // ignore "index not found"
  }
  try {
    await Threat.syncIndexes();
  } catch (e) {
    console.warn("[threatDetection] syncIndexes warning:", e.message);
  }
  indexesReady = true;
}

function windowStartDate() {
  return new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
}

/**
 * Brute-force: > BRUTE_THRESHOLD failed attempts for (user + IP) in rolling WINDOW_MINUTES.
 */
exports.persistThreatForIp = async ({
  ip,
  failedCount,
  relatedUserId,
  usernameAttempted,
}) => {
  await ensureThreatIndexes();
  const key = {
    sourceIp: ip,
    type: "BruteForce",
    relatedUserId: relatedUserId || null,
    usernameAttempted: usernameAttempted || null,
  };

  if (!ip || failedCount <= BRUTE_THRESHOLD) {
    if (failedCount <= BRUTE_THRESHOLD) {
      await Threat.deleteOne(key).catch(() => {});
    }
    return;
  }

  await Threat.findOneAndUpdate(
    key,
    {
      $set: {
        failedAttemptCount: failedCount,
        windowMinutes: WINDOW_MINUTES,
        lastSeenAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
};

/**
 * Threats relevant to this user account (failed attempts tied to their userId, grouped by IP).
 */
exports.getThreatAlertsForUser = async (userId) => {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const since = windowStartDate();
  const rows = await LoginAttempt.aggregate([
    { $match: { userId: uid, success: false, timestamp: { $gte: since } } },
    { $group: { _id: "$ip", attempts: { $sum: 1 } } },
    { $match: { attempts: { $gt: BRUTE_THRESHOLD } } },
  ]);

  return rows.map((r) => ({
    type: "Brute Force Attack",
    ip: r._id,
    attempts: r.attempts,
    windowMinutes: WINDOW_MINUTES,
  }));
};

exports.getThreatStateForUser = async (userId) => {
  const threatAlerts = await exports.getThreatAlertsForUser(userId);
  return {
    threatAlerts,
    systemStatus: threatAlerts.length > 0 ? "warning" : "secure",
  };
};

exports.listThreatsForAdmin = async () => {
  return Threat.find().sort({ lastSeenAt: -1 }).lean();
};
