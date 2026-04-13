import Modal from "./ui/Modal";
import Badge from "./ui/Badge";
import { safeDate, shortenHash } from "../utils/format";

function Row({ label, value }) {
  return (
    <div className="modal__row">
      <span>{label}</span>
      <span className="mono" style={{ textAlign: "right" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function VerificationModal({ open, onClose, log, result }) {
  if (!open || !log || !result) return null;

  const chainOk = result.blockchainVerified === true;
  const chainBad = result.blockchainVerified === false;
  const chainPending = result.blockchainVerified == null;

  return (
    <Modal title="Verification result" onClose={onClose}>
      <div className="flex gap-1 items-center" style={{ marginBottom: "1rem" }}>
        <Badge variant={result.localIntegrity ? "success" : "danger"}>
          Local: {result.localIntegrity ? "OK" : "Tamper suspected"}
        </Badge>
        <Badge
          variant={
            chainOk ? "success" : chainBad ? "danger" : chainPending ? "warn" : "neutral"
          }
        >
          Chain:{" "}
          {chainOk ? "Verified" : chainBad ? "Mismatch" : chainPending ? "N/A" : "—"}
        </Badge>
      </div>
      <Row label="Message" value={log.message} />
      <Row label="IP" value={log.ip} />
      <Row label="Timestamp" value={safeDate(log.timestamp)} />
      <Row label="Stored hash" value={shortenHash(result.storedHash || log.hash, 16, 16)} />
      <Row
        label="On-chain hash"
        value={
          result.onChainHash
            ? shortenHash(result.onChainHash, 16, 16)
            : result.chainLogIndex == null
              ? "No anchor"
              : "Unavailable (RPC)"
        }
      />
      <Row label="Chain index" value={result.chainLogIndex ?? "—"} />
      <Row
        label="Tx hash"
        value={
          result.blockchainTxHash || log.blockchainTxHash
            ? shortenHash(
                result.blockchainTxHash || log.blockchainTxHash,
                14,
                14
              )
            : "—"
        }
      />
    </Modal>
  );
}
