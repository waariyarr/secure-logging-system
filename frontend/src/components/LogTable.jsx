import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { safeDate, shortenHash } from "../utils/format";
import { getBlockchainUiStatus } from "../utils/chainStatus";

export default function LogTable({
  logs,
  verifyCache,
  onVerify,
  loading,
  busyId,
}) {
  const rows = Array.isArray(logs) ? logs : [];

  if (loading && rows.length === 0) {
    return <p className="page-sub">Loading logs…</p>;
  }

  if (!rows.length) {
    return <p className="page-sub">No logs yet.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Message</th>
            <th>IP</th>
            <th>Time</th>
            <th>Status</th>
            <th>Hash</th>
            <th>Chain</th>
            <th>Tx</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((log, idx) => {
            const id = log?._id;
            const cache = id ? verifyCache?.[id] : undefined;
            const chain = getBlockchainUiStatus(log, cache);
            const localOk = log?.verified !== false;
            return (
              <tr key={id ? String(id) : `row-${idx}`}>
                <td>{log?.username || log?.user?.username || "—"}</td>
                <td>{log?.message || "—"}</td>
                <td className="mono">{log?.ip || "—"}</td>
                <td className="mono">{safeDate(log?.timestamp)}</td>
                <td>
                  {log?.status ? (
                    <Badge variant={log.status === "success" ? "success" : "danger"}>
                      {log.status}
                      {log?.attemptCount != null ? ` #${log.attemptCount}` : ""}
                    </Badge>
                  ) : (
                    <Badge variant="neutral">action</Badge>
                  )}
                </td>
                <td className="mono">{shortenHash(log?.hash, 8, 6)}</td>
                <td>
                  <div className="flex gap-1 items-center" style={{ flexWrap: "wrap" }}>
                    <Badge variant={localOk ? "success" : "danger"}>
                      {localOk ? "OK" : "Flag"}
                    </Badge>
                    <Badge variant={chain.variant}>{chain.label}</Badge>
                  </div>
                </td>
                <td className="mono">
                  {log?.blockchainTxHash
                    ? shortenHash(log.blockchainTxHash, 8, 6)
                    : "—"}
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    loading={busyId === id}
                    disabled={busyId && busyId !== id}
                    onClick={() => onVerify?.(log)}
                  >
                    Verify
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
