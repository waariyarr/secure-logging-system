import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { safeDate } from "../utils/format";
import { getBlockchainUiStatus } from "../utils/chainStatus";

export default function LogItem({ log, verifyCache, onVerify, busyId }) {
  const chain = getBlockchainUiStatus(log, verifyCache?.[log._id]);
  const localOk = log?.verified !== false;

  return (
    <article className="log-item">
      <div className="log-item__row">
        <span>{log?.username || log?.user?.username || "—"}</span>
        <span className="mono">{log?.ip || "—"}</span>
        <span className="mono">{safeDate(log?.timestamp)}</span>
      </div>
      <p className="log-item__msg">{log?.message || "—"}</p>
      <div className="flex gap-1 items-center mt-1" style={{ flexWrap: "wrap" }}>
        {log?.status ? (
          <Badge variant={log.status === "success" ? "success" : "danger"}>
            {log.status}
            {log?.attemptCount != null ? ` #${log.attemptCount}` : ""}
          </Badge>
        ) : null}
        <Badge variant={localOk ? "success" : "danger"}>
          {localOk ? "DB integrity OK" : "DB flag"}
        </Badge>
        <Badge variant={chain.variant}>{chain.label}</Badge>
      </div>
      <div className="mt-1">
        <Button
          size="sm"
          variant="ghost"
          type="button"
          loading={busyId === log?._id}
          disabled={busyId && busyId !== log?._id}
          onClick={() => onVerify?.(log)}
        >
          Verify
        </Button>
      </div>
    </article>
  );
}
