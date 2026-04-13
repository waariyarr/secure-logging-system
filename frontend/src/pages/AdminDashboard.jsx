import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getAdminUsers,
  getAdminLoginAttempts,
  getAdminThreats,
  getAdminLogs,
} from "../services/api";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { safeDate, shortenHash } from "../utils/format";

function parseUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function AdminDashboard() {
  const me = parseUser();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [threats, setThreats] = useState([]);
  const [logs, setLogs] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [u, a, t, l] = await Promise.all([
        getAdminUsers(),
        getAdminLoginAttempts(),
        getAdminThreats(),
        getAdminLogs(),
      ]);
      setUsers(Array.isArray(u.data) ? u.data : []);
      setAttempts(Array.isArray(a.data) ? a.data : []);
      setThreats(Array.isArray(t.data) ? t.data : []);
      setLogs(Array.isArray(l.data) ? l.data : []);
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!me?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const suspiciousIps = new Set(threats.map((x) => x.sourceIp));

  return (
    <div>
      <div
        className="flex items-center"
        style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}
      >
        <div>
          <h1 className="page-title">Admin</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            All users, login attempts, threats, and forensic logs across the
            system.
          </p>
        </div>
        <Button type="button" variant="ghost" loading={loading} onClick={load}>
          Refresh
        </Button>
      </div>

      <h2 className="page-title" style={{ fontSize: "1.15rem", marginTop: "1.5rem" }}>
        Users
      </h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Admin</th>
              <th>Created</th>
              <th>Id</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.isAdmin ? <Badge variant="warn">Admin</Badge> : "—"}</td>
                <td className="mono">{safeDate(u.createdAt)}</td>
                <td className="mono">{shortenHash(String(u._id), 8, 6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="page-title" style={{ fontSize: "1.15rem", marginTop: "1.5rem" }}>
        Login attempts
      </h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Username</th>
              <th>User id</th>
              <th>IP</th>
              <th>Status</th>
              <th>Threat IP</th>
              <th>Chain tx</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((row) => {
              const badIp = suspiciousIps.has(row.ip);
              return (
                <tr key={row._id}>
                  <td className="mono">{safeDate(row.timestamp)}</td>
                  <td>{row.usernameAttempted}</td>
                  <td className="mono">
                    {row.userId?.username || (row.userId ? "—" : "n/a")}
                  </td>
                  <td className="mono">{row.ip}</td>
                  <td>
                    <Badge variant={row.success ? "success" : "danger"}>
                      {row.success ? "success" : "failed"}
                    </Badge>
                  </td>
                  <td>
                    {badIp ? (
                      <Badge variant="danger">Suspicious</Badge>
                    ) : (
                      <Badge variant="neutral">—</Badge>
                    )}
                  </td>
                  <td className="mono">
                    {row.blockchainTxHash
                      ? shortenHash(row.blockchainTxHash, 8, 6)
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="page-title" style={{ fontSize: "1.15rem", marginTop: "1.5rem" }}>
        Stored threats
      </h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>IP</th>
              <th>User</th>
              <th>Type</th>
              <th>Window</th>
              <th>Failed count</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {threats.length === 0 ? (
              <tr>
                <td colSpan={6} className="page-sub">
                  No persistent threat rows.
                </td>
              </tr>
            ) : (
              threats.map((t) => (
                <tr key={`${t.sourceIp}-${t.type}-${t.relatedUserId || t.usernameAttempted || "na"}`}>
                  <td className="mono">{t.sourceIp}</td>
                  <td>{t.usernameAttempted || "unknown"}</td>
                  <td>{t.type}</td>
                  <td>{t.windowMinutes ? `${t.windowMinutes}m` : "—"}</td>
                  <td>{t.failedAttemptCount}</td>
                  <td className="mono">{safeDate(t.lastSeenAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="page-title" style={{ fontSize: "1.15rem", marginTop: "1.5rem" }}>
        All logs
      </h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Message</th>
              <th>IP</th>
              <th>Time</th>
              <th>Tx</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{log.user?.username || "—"}</td>
                <td>{log.message}</td>
                <td className="mono">{log.ip}</td>
                <td className="mono">{safeDate(log.timestamp)}</td>
                <td className="mono">
                  {log.blockchainTxHash
                    ? shortenHash(log.blockchainTxHash, 8, 6)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
