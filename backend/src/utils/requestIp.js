function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) {
    return String(xf).split(",")[0].trim();
  }
  return (
    req.socket?.remoteAddress ||
    req.ip ||
    req.connection?.remoteAddress ||
    "unknown"
  );
}

module.exports = { getClientIp };
