export default function AlertPanel({ alerts }) {
  const list = Array.isArray(alerts) ? alerts : [];

  return (
    <div className="card">
      <p className="card__title">Threat alerts</p>
      {list.length === 0 ? (
        <p className="page-sub" style={{ margin: 0 }}>
          No brute-force signals from stored logs.
        </p>
      ) : (
        <div className="alert-list">
          {list.map((a, i) => (
            <div key={`${a.ip}-${i}`} className="alert-item">
              <p className="alert-item__title">{a.type || "Alert"}</p>
              <p className="alert-item__meta">
                IP: {a.ip || "—"}
                {a.attempts != null ? ` · ${a.attempts} failed login events` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
