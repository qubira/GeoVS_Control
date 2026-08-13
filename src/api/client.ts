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
  connectionsInRange: number;
  topByTotalTime: { userId: string; username: string; seconds: number }[];
}

export interface RangeParams {
  range?: "day" | "week" | "month";
  date?: string;
}

function rangeQS(params: RangeParams = {}): string {
  const qs = new URLSearchParams();
  if (params.range) qs.set("range", params.range);
  if (params.date) qs.set("date", params.date);
  return qs.toString() ? `?${qs}` : "";
}

export interface OnlineByCountry {
  totalOnline: number;
  byCountry: { country: string; count: number }[];
}

export interface AccountsByCountry {
  byCountry: { country: string; accounts: number }[];
}

export interface LevelsPopularity {
  overall: { levelId: string; levelName: string; sessionCount: number }[];
  byCountry: { levelId: string; country: string; count: number }[];
  topPlayers: { levelId: string; userId: string; username: string; sessionCount: number }[];
}

export interface PeakHours {
  source: string;
  timestamps: string[];
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
  play: {
    totalSec: number;
    byDay: { day: string; seconds: number }[];
  };
}

export interface CustomAvatar {
  id: string;
  name: string;
  imageUrl: string;
  kind: string;
  published: boolean;
  createdAt: string;
}

export type PhysicsType = "spike" | "block" | "platform";

export interface CustomObjectType {
  id: string;
  name: string;
  imageUrl: string;
  physicsType: PhysicsType;
  createdAt: string;
}

export interface LevelObstacle {
  type: PhysicsType;
  x: number;
  y: number;
  w: number;
  h: number;
  imageUrl?: string;
}

export interface CustomLevel {
  id: string;
  name: string;
  length: number;
  durationSec: number;
  speedX: number | null;
  jumpVelocity: number | null;
  backgroundImageUrl: string | null;
  musicUrl: string | null;
  obstacles: LevelObstacle[];
  checkpoints: number[];
  published: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomLevelInput {
  name: string;
  durationSec: number;
  speedX?: number | null;
  jumpVelocity?: number | null;
  backgroundImageUrl?: string | null;
  musicUrl?: string | null;
  obstacles: LevelObstacle[];
  checkpoints?: number[];
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
  try {
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
  } catch {
    // Servidor inalcanzable (caido, sin red, cold-start de Render, etc).
    // status 0 = "no hubo respuesta", distinto de un 401/403 real, para que
    // los callers no confundan esto con una sesion invalida (ver AuthContext).
    return { status: 0, body: { ok: false, error: "NETWORK_ERROR" } as T };
  }
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

  connectionsSummary: (params: RangeParams = {}) =>
    request<{ ok: boolean } & Partial<ConnectionsSummary> & { error?: string }>(`/admin/connections/summary${rangeQS(params)}`),
  userConnections: (id: string) => request<{ ok: boolean } & Partial<UserConnections> & { error?: string }>(`/admin/users/${id}/connections`),
  connectionsByCountry: (country: string) =>
    request<{ ok: boolean; sessions?: CountrySession[]; error?: string }>(`/admin/connections/by-country?country=${encodeURIComponent(country)}`),
  connectionsOnlineByCountry: () =>
    request<{ ok: boolean } & Partial<OnlineByCountry> & { error?: string }>("/admin/connections/online-by-country"),
  accountsByCountry: (params: RangeParams = {}) =>
    request<{ ok: boolean } & Partial<AccountsByCountry> & { error?: string }>(`/admin/accounts/with-session-by-country${rangeQS(params)}`),
  levelsPopularity: (params: RangeParams = {}) =>
    request<{ ok: boolean } & Partial<LevelsPopularity> & { error?: string }>(`/admin/levels/popularity${rangeQS(params)}`),
  userPeakHours: (id: string, params: RangeParams = {}) =>
    request<{ ok: boolean } & Partial<PeakHours> & { error?: string }>(`/admin/users/${id}/peak-hours${rangeQS(params)}`),

  waitlist: () => request<{ ok: boolean; entries?: WaitlistEntry[]; error?: string }>("/admin/waitlist"),
  deleteWaitlistEntry: (id: string) => request<{ ok: boolean; error?: string }>(`/admin/waitlist/${id}`, { method: "DELETE" }),

  // --- Modulo "Crear": avatares, objetos y niveles personalizados --------

  uploadFile: (file: File, kind: "avatar" | "object" | "background" | "music") => {
    const token = loadToken();
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    return fetch(`${SERVER_URL}/admin/uploads`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      // OJO: no fijar Content-Type a mano — el navegador arma el boundary
      // multipart automaticamente a partir del FormData.
      body: form,
    })
      .then(async (res) => ({ status: res.status, body: (await res.json().catch(() => ({}))) as { ok: boolean; url?: string; error?: string } }))
      .catch(() => ({ status: 0, body: { ok: false, error: "NETWORK_ERROR" } as { ok: boolean; url?: string; error?: string } }));
  },

  listCustomAvatars: () => request<{ ok: boolean; avatars?: CustomAvatar[]; error?: string }>("/admin/custom-avatars"),
  createCustomAvatar: (input: { name: string; imageUrl: string }) =>
    request<{ ok: boolean; avatar?: CustomAvatar; error?: string }>("/admin/custom-avatars", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteCustomAvatar: (id: string) => request<{ ok: boolean; error?: string }>(`/admin/custom-avatars/${id}`, { method: "DELETE" }),
  publishCustomAvatar: (id: string, published: boolean) =>
    request<{ ok: boolean; avatar?: CustomAvatar; error?: string }>(`/admin/custom-avatars/${id}/publish`, {
      method: "PUT",
      body: JSON.stringify({ published }),
    }),

  listCustomObjectTypes: () => request<{ ok: boolean; objectTypes?: CustomObjectType[]; error?: string }>("/admin/custom-object-types"),
  createCustomObjectType: (input: { name: string; imageUrl: string; physicsType: PhysicsType }) =>
    request<{ ok: boolean; objectType?: CustomObjectType; error?: string }>("/admin/custom-object-types", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteCustomObjectType: (id: string) => request<{ ok: boolean; error?: string }>(`/admin/custom-object-types/${id}`, { method: "DELETE" }),

  listCustomLevels: () => request<{ ok: boolean; levels?: CustomLevel[]; error?: string }>("/admin/custom-levels"),
  getCustomLevel: (id: string) => request<{ ok: boolean; level?: CustomLevel; error?: string }>(`/admin/custom-levels/${id}`),
  createCustomLevel: (input: CustomLevelInput) =>
    request<{ ok: boolean; level?: CustomLevel; error?: string }>("/admin/custom-levels", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateCustomLevel: (id: string, input: CustomLevelInput) =>
    request<{ ok: boolean; level?: CustomLevel; error?: string }>(`/admin/custom-levels/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteCustomLevel: (id: string) => request<{ ok: boolean; error?: string }>(`/admin/custom-levels/${id}`, { method: "DELETE" }),
  publishCustomLevel: (id: string, published: boolean) =>
    request<{ ok: boolean; level?: CustomLevel; error?: string }>(`/admin/custom-levels/${id}/publish`, {
      method: "PUT",
      body: JSON.stringify({ published }),
    }),
};
