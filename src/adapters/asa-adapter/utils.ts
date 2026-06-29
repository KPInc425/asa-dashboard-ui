import type { ServiceStatus } from "../../types/inventory";
import type { CanonicalError } from "../types";

export function normalizeStatus(raw: string | boolean | undefined): ServiceStatus {
  if (raw === undefined || raw === null) return "unknown";
  if (typeof raw === "boolean") return raw ? "running" : "stopped";
  const lower = raw.toLowerCase();
  if (lower === "running" || lower === "true") return "running";
  if (lower === "stopped" || lower === "exited" || lower === "false") return "stopped";
  if (lower === "restarting" || lower === "paused") return "degraded";
  if (lower === "updating") return "updating";
  return "unknown";
}

export function normalizeError(error: unknown): CanonicalError {
  if (!error || typeof error !== "object") return "unknown";
  const err = error as { status?: number; response?: { status?: number }; message?: string; code?: string };
  const status = err.status ?? err.response?.status ?? 0;
  if (status === 401) return "auth_expired";
  if (status === 403) return "auth_required";
  if (status === 404) return "not_found";
  if (status === 409) {
    const msg = err.message?.toLowerCase() ?? "";
    if (msg.includes("running")) return "already_running";
    if (msg.includes("stopped")) return "already_stopped";
    return "action_in_progress";
  }
  if (status === 429) return "rate_limited";
  if (status === 0 || err.code === "ECONNABORTED") return "timeout";
  return "unknown";
}
