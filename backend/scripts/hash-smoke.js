/**
 * Offline check: canonical hash matches legacy JSON.stringify({..., timestamp: Date}).
 * Run: node backend/scripts/hash-smoke.js
 */
const crypto = require("crypto");
const { generateHash } = require("../src/services/hashService");

const d = new Date("2024-01-15T08:00:00.789Z");
const payload = { message: "audit", ip: "192.168.0.1", timestamp: d };
const legacy = crypto
  .createHash("sha256")
  .update(JSON.stringify(payload))
  .digest("hex");
const next = generateHash(payload);

if (legacy !== next) {
  console.error("FAIL: hash drift", { legacy, next });
  process.exit(1);
}

const withUser = generateHash({
  ...payload,
  userId: "507f1f77bcf86cd799439011",
});
if (withUser === next) {
  console.error("FAIL: userId should change hash");
  process.exit(1);
}

console.log("OK: legacy hash stable; userId changes digest.");
