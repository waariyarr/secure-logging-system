/**
 * Central JWT secret — never hardcode fallbacks in auth code.
 * Set JWT_SECRET in .env (long random string).
 */
function getJWTSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || typeof s !== "string" || s.trim().length < 16) {
    throw new Error(
      "JWT_SECRET must be set in .env and be at least 16 characters."
    );
  }
  return s.trim();
}

module.exports = { getJWTSecret };
