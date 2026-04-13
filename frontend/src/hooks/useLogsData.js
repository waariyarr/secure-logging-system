import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchLogsPayload } from "../services/api";

export function useLogsData(options = {}) {
  const pollMs = Number(options.pollMs) || 0;
  const [logs, setLogs] = useState([]);
  const [threatAlerts, setThreatAlerts] = useState([]);
  const [systemStatus, setSystemStatus] = useState("secure");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (opts = {}) => {
    const silent = Boolean(opts.silent);
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await fetchLogsPayload();
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setThreatAlerts(
        Array.isArray(data.threatAlerts) ? data.threatAlerts : []
      );
      setSystemStatus(
        data.systemStatus === "warning" ? "warning" : "secure"
      );
    } catch (e) {
      const msg =
        e.response?.data?.error || e.message || "Could not load logs.";
      setError(msg);
      toast.error(msg);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!pollMs || pollMs < 1000) return undefined;
    const t = setInterval(() => {
      refresh({ silent: true });
    }, pollMs);
    return () => clearInterval(t);
  }, [pollMs, refresh]);

  return {
    logs,
    threatAlerts,
    systemStatus,
    loading,
    error,
    refresh,
  };
}
