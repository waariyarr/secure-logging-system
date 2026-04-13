export function shortenHash(hex, left = 10, right = 8) {
  if (!hex || typeof hex !== "string") return "—";
  if (hex.length <= left + right + 3) return hex;
  return `${hex.slice(0, left)}…${hex.slice(-right)}`;
}

export function safeDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
