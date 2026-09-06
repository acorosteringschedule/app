import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("aco_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(undefined, async (error) => {
  const cfg = error.config;
  const status = error.response?.status;
  const transient = !error.response || status === 502 || status === 503 || status === 504;
  const retryable = cfg && cfg.method?.toLowerCase() === "get" && transient;

  if (!retryable) throw error;

  cfg._retryCount = cfg._retryCount || 0;
  if (cfg._retryCount >= 2) throw error;

  cfg._retryCount += 1;
  await new Promise((resolve) => setTimeout(resolve, cfg._retryCount * 1500));
  return api.request(cfg);
});

export function formatApiError(e) {
  const d = e?.response?.data?.detail;
  if (!d) return e.message || "Terjadi kesalahan";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join("; ");
  return typeof d === "object" ? d.msg || JSON.stringify(d) : String(d);
}
