export default function TextField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  disabled,
}) {
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={name}>
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        className="field__input"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error ? <div className="field__error">{error}</div> : null}
    </div>
  );
}
