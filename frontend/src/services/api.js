import axios from "axios";
import toast from "react-hot-toast";

const rawBase =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const baseURL = rawBase.replace(/\/$/, "");

export const api = axios.create({
  baseURL,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function isAuthPath(url) {
  return typeof url === "string" && url.includes("/auth/");
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const msg =
      err.response?.data?.error ||
      (err.code === "ECONNABORTED"
        ? "Request timed out. Try again."
        : err.message || "Something went wrong");

    if (status === 401 && !isAuthPath(err.config?.url || "")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.error("Session expired. Please sign in again.");
      window.location.assign("/login");
      return Promise.reject(err);
    }

    if (!err.config?.silent && !isAuthPath(err.config?.url || "")) {
      if (!status || status >= 500) {
        toast.error(msg);
      }
    }

    return Promise.reject(err);
  }
);

/**
 * Normalizes GET /logs — supports legacy array-only responses.
 */
export function normalizeLogsPayload(data) {
  if (Array.isArray(data)) {
    return {
      logs: data,
      threatAlerts: [],
      systemStatus: "secure",
    };
  }
  return {
    logs: Array.isArray(data?.logs) ? data.logs : [],
    threatAlerts: Array.isArray(data?.threatAlerts) ? data.threatAlerts : [],
    systemStatus: data?.systemStatus === "warning" ? "warning" : "secure",
  };
}

export async function fetchLogsPayload() {
  const res = await api.get("/logs");
  return normalizeLogsPayload(res.data);
}

export const getLogs = () => api.get("/logs");
export const createLog = (data) => api.post("/log", data);
export const verifyLog = (id) => api.get(`/verify/${id}`);
export const loginUser = (data) =>
  api.post("/auth/login", data, { silent: true });
export const registerUser = (data) =>
  api.post("/auth/register", data, { silent: true });

export const getAdminUsers = () => api.get("/admin/users");
export const getAdminLoginAttempts = () => api.get("/admin/login-attempts");
export const getAdminThreats = () => api.get("/admin/threats");
export const getAdminLogs = () => api.get("/admin/logs");
