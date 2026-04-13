import TransactionTable from "../components/TransactionTable";
import VerificationModal from "../components/VerificationModal";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import { useLogsData } from "../hooks/useLogsData";
import { useVerifyLog } from "../hooks/useVerifyLog";

export default function Blockchain() {
  const { logs, loading, error, refresh, systemStatus } = useLogsData();
  const { verifyCache, busyId, modal, runVerify, closeModal } = useVerifyLog();

  const anchored = logs.filter(
    (l) =>
      l?.chainLogIndex != null ||
      (l?.blockchainTxHash && String(l.blockchainTxHash).length > 0)
  );

  const verifiedCount = logs.filter((l) => {
    const id = l?._id;
    return id && verifyCache[id]?.blockchainVerified === true;
  }).length;

  return (
    <div>
      <div
        className="flex items-center"
        style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}
      >
        <div>
          <h1 className="page-title">Blockchain</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            Transaction hashes, integrity hashes, and live contract checks via
            your configured RPC.
          </p>
        </div>
        <Button type="button" variant="ghost" loading={loading} onClick={refresh}>
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex gap-1 items-center page-sub">
          <Spinner />
          Syncing…
        </div>
      )}
      {error && (
        <p className="page-sub" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <div className="grid-stats">
        <Card title="Anchored entries" value={String(anchored.length)} />
        <Card title="Verified (this session)" value={String(verifiedCount)} />
        <Card title="RPC status">
          <p className="card__value" style={{ fontSize: "1.1rem" }}>
            {error ? "Degraded" : "Connected"}
          </p>
          <p className="card__footer" style={{ margin: 0 }}>
            <Badge variant={systemStatus === "warning" ? "warn" : "success"}>
              System: {systemStatus === "warning" ? "Warning" : "Secure"}
            </Badge>
          </p>
        </Card>
      </div>

      <TransactionTable
        logs={logs}
        verifyCache={verifyCache}
        onVerifyOnChain={runVerify}
        loading={loading}
        busyId={busyId}
      />

      <VerificationModal
        open={!!modal}
        onClose={closeModal}
        log={modal?.log}
        result={modal?.result}
      />
    </div>
  );
}
