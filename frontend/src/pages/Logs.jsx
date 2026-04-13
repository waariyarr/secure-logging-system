import LogTable from "../components/LogTable";
import LogItem from "../components/LogItem";
import VerificationModal from "../components/VerificationModal";
import Button from "../components/ui/Button";
import { useLogsData } from "../hooks/useLogsData";
import { useVerifyLog } from "../hooks/useVerifyLog";

export default function Logs() {
  const { logs, loading, error, refresh } = useLogsData({ pollMs: 5000 });
  const { verifyCache, busyId, modal, runVerify, closeModal } = useVerifyLog();

  return (
    <div>
      <div
        className="flex items-center"
        style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}
      >
        <div>
          <h1 className="page-title">Logs</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            Real backend events only (login attempts + user actions), auto-refresh
            every 5 seconds.
          </p>
        </div>
        <Button type="button" variant="ghost" loading={loading} onClick={refresh}>
          Refresh
        </Button>
      </div>

      {error && (
        <p className="page-sub" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <div className="table-wrap" style={{ display: "block" }} aria-hidden={false}>
        <div className="desktop-only">
          <LogTable
            logs={logs}
            verifyCache={verifyCache}
            onVerify={runVerify}
            loading={loading}
            busyId={busyId}
          />
        </div>
        <div className="mobile-only" style={{ marginTop: "1rem" }}>
          {loading && !logs.length ? (
            <p className="page-sub">Loading…</p>
          ) : (
            logs.map((log) => (
              <LogItem
                key={log._id}
                log={log}
                verifyCache={verifyCache}
                busyId={busyId}
                onVerify={(l) => runVerify(l)}
              />
            ))
          )}
        </div>
      </div>

      <VerificationModal
        open={!!modal}
        onClose={closeModal}
        log={modal?.log}
        result={modal?.result}
      />

      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: block !important; }
        }
        @media (min-width: 769px) {
          .desktop-only { display: block !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}
