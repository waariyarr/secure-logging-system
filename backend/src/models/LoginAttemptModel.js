const mongoose = require("mongoose");

const LoginAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true,
  },
  usernameAttempted: { type: String, required: true, trim: true },
  ip: { type: String, required: true, trim: true, index: true },
  success: { type: Boolean, required: true },
  attemptCount: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now, index: true },
  blockchainTxHash: { type: String, default: null },
  chainLogIndex: { type: Number, default: null },
});

LoginAttemptSchema.index({ userId: 1, ip: 1, success: 1, timestamp: -1 });

module.exports = mongoose.model("LoginAttempt", LoginAttemptSchema);
