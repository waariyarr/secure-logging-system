import { useMemo } from "react";
import Card from "../components/ui/Card";
import AlertPanel from "../components/AlertPanel";
import Spinner from "../components/ui/Spinner";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useLogsData } from "../hooks/useLogsData";

export default function Dashboard() {
  const { logs, threatAlerts, systemStatus, loading, error, refresh } =
    useLogsData();

  const anchoredCount = useMemo(
    () =>
      logs.filter(
        (l) =>
          l?.chainLogIndex != null ||
          (l?.blockchainTxHash && l.blockchainTxHash.length > 0)
      ).length,
    [logs]
  );

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">
        Overview of forensic logs, on-chain anchors, and automated threat
        signals (same rules as the API).
      </p>

      {loading && (
        <div className="flex gap-1 items-center page-sub">
          <Spinner />
          Loading…
        </div>
      )}
      {error && !loading && (
        <div className="card" style={{ borderColor: "rgba(239,68,68,0.4)" }}>
          <p style={{ margin: 0 }}>{error}</p>
          <Button className="mt-1" type="button" onClick={refresh}>
            Retry
          </Button>
        </div>
      )}

      <div className="grid-stats">
        <Card title="Total logs" value={String(logs.length)} />
        <Card
          title="Anchored on-chain"
          value={String(anchoredCount)}
          footer="Logs with tx or chain index"
        />
        <Card
          title="Active threat signals"
          value={String(threatAlerts.length)}
          footer="IPs with &gt;5 failed login lines"
        />
        <Card title="System status">
          <p className="card__value">
            {systemStatus === "warning" ? "Warning" : "Secure"}
          </p>
          <div className="card__footer" style={{ marginTop: "0.5rem" }}>
            <Badge variant={systemStatus === "warning" ? "warn" : "success"}>
              {systemStatus === "warning" ? "Review alerts" : "All clear"}
            </Badge>
          </div>
        </Card>
      </div>

      <AlertPanel alerts={threatAlerts} />
    </div>
  );
}
