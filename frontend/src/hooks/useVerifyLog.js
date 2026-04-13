import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { verifyLog } from "../services/api";

/**
 * Tracks per-log verify responses and optional modal payload.
 */
export function useVerifyLog() {
  const [verifyCache, setVerifyCache] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null);

  const runVerify = useCallback(async (log) => {
    const id = log?._id;
    if (!id) {
      toast.error("Invalid log.");
      return;
    }
    setBusyId(id);
    try {
      const res = await verifyLog(id);
      const result = res.data || {};
      setVerifyCache((prev) => ({ ...prev, [id]: result }));
      setModal({ log, result });
      if (result.blockchainVerified === true) {
        toast.success("On-chain hash matches.");
      } else if (result.blockchainVerified === false) {
        toast.error("On-chain verification failed.");
      } else if (result.localIntegrity === false) {
        toast.error("Local integrity check failed.");
      } else {
        toast.success("Verification finished.");
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Verify failed.";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }, []);

  const closeModal = useCallback(() => setModal(null), []);

  return { verifyCache, busyId, modal, runVerify, closeModal };
}
