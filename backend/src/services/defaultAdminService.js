const User = require("../models/UserModel");

const DEFAULT_ADMIN_USERNAME = "waariya.raj@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "Waariyar@123";

/**
 * Ensures a fixed default admin account exists in DB.
 * If account exists, force admin flag + reset password to requested default.
 */
async function ensureDefaultAdmin() {
  let user = await User.findOne({ username: DEFAULT_ADMIN_USERNAME });

  if (!user) {
    user = new User({
      username: DEFAULT_ADMIN_USERNAME,
      password: DEFAULT_ADMIN_PASSWORD,
      isAdmin: true,
    });
    await user.save();
    console.log("[default-admin] created:", DEFAULT_ADMIN_USERNAME);
    return;
  }

  let changed = false;
  if (!user.isAdmin) {
    user.isAdmin = true;
    changed = true;
  }

  const passwordMatches = await user.comparePassword(DEFAULT_ADMIN_PASSWORD);
  if (!passwordMatches) {
    user.password = DEFAULT_ADMIN_PASSWORD;
    changed = true;
  }

  if (changed) {
    await user.save();
    console.log("[default-admin] updated:", DEFAULT_ADMIN_USERNAME);
  } else {
    console.log("[default-admin] already synced:", DEFAULT_ADMIN_USERNAME);
  }
}

module.exports = { ensureDefaultAdmin };
