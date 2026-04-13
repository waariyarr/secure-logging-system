const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true,
  },
  username: { type: String, default: null, index: true },
  eventType: { type: String, default: "action", index: true }, // action | login
  status: { type: String, default: null }, // success | failed for login events
  attemptCount: { type: Number, default: null },
  message: { type: String, required: true },
  ip: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  hash: { type: String, required: true },
  verified: { type: Boolean, default: true },
  chainLogIndex: { type: Number, default: null },
  blockchainTxHash: { type: String, default: null },
});

LogSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model("Log", LogSchema);
