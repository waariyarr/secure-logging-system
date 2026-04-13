const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Log = require("../src/models/LogModel");
const LoginAttempt = require("../src/models/LoginAttemptModel");
const Threat = require("../src/models/ThreatModel");

async function run() {
  await mongoose.connect(process.env.MONGO_URI.trim());

  const qLogs = {
    $or: [
      { message: /failed login for user admin \(attempt/i },
      { ip: /^203\.0\.113\./ },
      { username: /^sim_/i },
    ],
  };
  const qAttempts = {
    $or: [{ usernameAttempted: /^sim_/i }, { ip: /^203\.0\.113\./ }],
  };
  const qThreat = { sourceIp: /^203\.0\.113\./ };

  const r1 = await Log.deleteMany(qLogs);
  const r2 = await LoginAttempt.deleteMany(qAttempts);
  const r3 = await Threat.deleteMany(qThreat);

  console.log(
    JSON.stringify(
      {
        deletedLogs: r1.deletedCount,
        deletedLoginAttempts: r2.deletedCount,
        deletedThreats: r3.deletedCount,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
