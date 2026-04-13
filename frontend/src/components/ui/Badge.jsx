export default function Badge({ variant = "neutral", children }) {
  const cls = [
    "badge",
    variant === "success" && "badge--success",
    variant === "danger" && "badge--danger",
    variant === "warn" && "badge--warn",
    variant === "neutral" && "badge--neutral",
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={cls}>{children}</span>;
}
