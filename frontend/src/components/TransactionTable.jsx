import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { safeDate, shortenHash } from "../utils/format";
import { getBlockchainUiStatus } from "../utils/chainStatus";

/**
 * Blockchain / anchoring view — same underlying logs, columns tuned for audit.
 */
export default function TransactionTable({
  logs,
  verifyCache,
  onVerifyOnChain,
  loading,
  busyId,
}) {
  const rows = Array.isArray(logs) ? logs : [];

  if (loading && rows.length === 0) {
    return <p className="page-sub">Loading blockchain records…</p>;
  }

  if (!rows.length) {
    return <p className="page-sub">No records to display.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Tx hash</th>
            <th>Log hash</th>
            <th>Chain index</th>
            <th>Timestamp</th>
            <th>Verification</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((log, idx) => {
            const id = log?._id;
            const cache = id ? verifyCache?.[id] : undefined;
            const chain = getBlockchainUiStatus(log, cache);
            const verifiedOnChain =
              cache?.chainMatch === true
                ? true
                : cache?.chainMatch === false
                  ? false
                  : null;

            let verifyLabel = "Not verified";
            let verifyVariant = "neutral";
            if (verifiedOnChain === true) {
              verifyLabel = "Verified on-chain";
              verifyVariant = "success";
            } else if (verifiedOnChain === false) {
              verifyLabel = "Failed verification";
              verifyVariant = "danger";
            } else if (log?.chainLogIndex != null || log?.blockchainTxHash) {
              verifyLabel = "Pending check";
              verifyVariant = "warn";
            }

            return (
              <tr key={id ? String(id) : `tx-${idx}`}>
                <td className="mono" title={log?.blockchainTxHash || ""}>
                  {log?.blockchainTxHash
                    ? shortenHash(log.blockchainTxHash, 12, 10)
                    : "—"}
                </td>
                <td className="mono" title={log?.hash || ""}>
                  {log?.hash ? shortenHash(log.hash, 12, 10) : "—"}
                </td>
                <td className="mono">
                  {log?.chainLogIndex != null ? String(log.chainLogIndex) : "—"}
                </td>
                <td className="mono">{safeDate(log?.timestamp)}</td>
                <td>
                  <Badge variant={verifyVariant}>{verifyLabel}</Badge>
                  <div className="mt-1" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {chain.detail}
                  </div>
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="primary"
                    type="button"
                    loading={busyId === id}
                    disabled={busyId && busyId !== id}
                    onClick={() => onVerifyOnChain?.(log)}
                  >
                    Verify on blockchain
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
