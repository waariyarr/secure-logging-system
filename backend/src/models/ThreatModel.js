const mongoose = require("mongoose");

/** Persistent brute-force / abuse signals (admin + aggregated views). */
const ThreatSchema = new mongoose.Schema({
  sourceIp: { type: String, required: true, trim: true },
  type: { type: String, default: "BruteForce" },
  usernameAttempted: { type: String, default: null, index: true },
  failedAttemptCount: { type: Number, required: true, min: 0 },
  windowMinutes: { type: Number, default: 15 },
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  lastSeenAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

ThreatSchema.index(
  { sourceIp: 1, type: 1, relatedUserId: 1, usernameAttempted: 1 },
  { unique: true }
);

module.exports = mongoose.model("Threat", ThreatSchema);
