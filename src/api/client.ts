import { SERVER_URL } from "../config";

export interface Account {
  id: string;
  email: string;
  username: string;
  age: number;
  role: "player" | "developer" | "moderator" | "admin";
  blocked: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  targetUsername: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  changedBy: string | null;
  changedByUsername: string | null;
  changedAt: string;
}

export interface ConnectionsSummary {
  totalUsers: number;
  byRole: { role: string; count: number }[];
  connectionsToday: number;
  byCountry: { country: string; count: number }[];
  topByTotalTime: { userId: string; username: string; seconds: number }[];
}

export interface CountrySession {
  id: string;
  userId: string;
  username: string;
  role: string | null;
  ip: string | null;
  connectedAt: string;
  disconnectedAt: string | null;
  durationSec: number | null;
}

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserConnections {
  totalSec: number;
  byDay: { day: string; seconds: number }[];
  sessions: {
    id: string;
    ip: string | null;
    country: string | null;
    countryCode: string | null;
    connectedAt: string;
    disconnectedAt: string | null;
    durationSec: number | null;
  }[];
}

const TOKEN_KEY = "geovs_control_token_v1";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<{ status: number; body: T }> {
  const token = loadToken();
  const res = await fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, body };
}

export const api = {
  login: (username: string, password: string) =>
    request<{ ok: boolean; token?: string; user?: Account; error?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ ok: boolean; user?: Account; error?: string }>("/auth/me"),

  listUsers: (params: { search?: string; role?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.role) qs.set("role", params.role);
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<{ ok: boolean; users?: Account[]; error?: string }>(`/admin/users${suffix}`);
  },
  createUser: (input: { email: string; username: string; password: string; age: number; role: string }) =>
    request<{ ok: boolean; user?: Account; error?: string }>("/admin/users", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateUser: (
    id: string,
    input: Partial<{ email: string; username: string; age: number; password: string; role: string; blocked: boolean; reason: string }>
  ) =>
    request<{ ok: boolean; user?: Account; error?: string }>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteUser: (id: string, reason?: string) =>
    request<{ ok: boolean; error?: string }>(`/admin/users/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    }),

  auditLogs: (params: { userId?: string; username?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.userId) qs.set("userId", params.userId);
    if (params.username) qs.set("username", params.username);
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<{ ok: boolean; logs?: AuditLogEntry[]; error?: string }>(`/admin/audit-logs${suffix}`);
  },

  connectionsSummary: () => request<{ ok: boolean } & Partial<ConnectionsSummary> & { error?: string }>("/admin/connections/summary"),
  userConnections: (id: string) => request<{ ok: boolean } & Partial<UserConnections> & { error?: string }>(`/admin/users/${id}/connections`),
  connectionsByCountry: (country: string) =>
    request<{ ok: boolean; sessions?: CountrySession[]; error?: string }>(`/admin/connections/by-country?country=${encodeURIComponent(country)}`),

  waitlist: () => request<{ ok: boolean; entries?: WaitlistEntry[]; error?: string }>("/admin/waitlist"),
  deleteWaitlistEntry: (id: string) => request<{ ok: boolean; error?: string }>(`/admin/waitlist/${id}`, { method: "DELETE" }),
};
