const crypto = require("crypto");

function toIsoTimestamp(ts) {
  if (ts == null) {
    throw new Error("timestamp is required for hashing");
  }
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid timestamp for hashing");
  }
  return d.toISOString();
}

/**
 * Stable JSON: key order message → ip → timestamp → optional userId
 * (matches earlier hashes for logs without userId).
 */
exports.generateHash = (logData) => {
  const message = logData?.message;
  const ip = logData?.ip;
  const timestamp = logData?.timestamp;

  if (message == null || ip == null) {
    throw new Error("message and ip are required for hashing");
  }

  const payload = {
    message: String(message),
    ip: String(ip),
    timestamp: toIsoTimestamp(timestamp),
  };

  if (logData.userId != null && logData.userId !== "") {
    payload.userId = String(logData.userId);
  }

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
};
