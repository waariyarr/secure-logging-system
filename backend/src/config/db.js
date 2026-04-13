const mongoose = require("mongoose");

/**
 * Connect to MongoDB and verify with a ping.
 * Call once before app.listen so no request hits the API without a DB.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri || typeof uri !== "string" || !uri.trim()) {
    console.error("FATAL: MONGO_URI is missing or empty in .env");
    process.exit(1);
  }

  try {
    const trimmed = uri.trim();
    if (/mongodb(\+srv)?:\/\/.+\.net\/\?/i.test(trimmed)) {
      console.warn(
        "[MONGO_URI] No database name before ? — collections may land in the default `test` DB. Prefer: ...mongodb.net/secure-logs?retryWrites=true&w=majority"
      );
    }

    await mongoose.connect(trimmed, { serverSelectionTimeoutMS: 15000 });
    await mongoose.connection.db.admin().command({ ping: 1 });
    const safeUri = trimmed.replace(/:([^:@/]+)@/, ":****@");
    console.log("MongoDB connected and ping OK:", safeUri);
    console.log("MongoDB database name in use:", mongoose.connection.name);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    if (String(error.message).includes("ECONNREFUSED")) {
      console.error(
        "Hint: mongod is not accepting connections. On Windows, default \\data\\db often does not exist."
      );
      console.error(
        "  Run from repo root:  npm run mongo:local   (starts mongod with --dbpath .\\data\\db)"
      );
    }
    if (String(error.message).includes("bad auth") || String(error.message).includes("authentication failed")) {
      console.error("Hint: Check Atlas username/password and that the user has read/write on the target database.");
    }
    if (String(error.message).includes("querySrv") || String(error.message).includes("ENOTFOUND")) {
      console.error("Hint: Check internet/DNS and Atlas cluster hostname in MONGO_URI.");
    }
    process.exit(1);
  }
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

connectDB.isMongoConnected = isMongoConnected;
module.exports = connectDB;
