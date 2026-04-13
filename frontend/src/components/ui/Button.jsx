import Spinner from "./Spinner";

export default function Button({
  children,
  variant = "primary",
  size,
  loading,
  disabled,
  type = "button",
  className = "",
  ...rest
}) {
  const cls = [
    "btn",
    variant === "primary" && "btn--primary",
    variant === "ghost" && "btn--ghost",
    variant === "danger" && "btn--danger",
    size === "sm" && "btn--sm",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
