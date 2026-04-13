export default function Card({
  title,
  value,
  footer,
  children,
  className = "",
}) {
  return (
    <div className={`card ${className}`.trim()}>
      {title != null && <p className="card__title">{title}</p>}
      {value != null && <p className="card__value">{value}</p>}
      {children}
      {footer != null && <div className="card__footer">{footer}</div>}
    </div>
  );
}
