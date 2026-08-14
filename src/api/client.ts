import { SERVER_URL } from "../config";

export interface Account {
  id: string;
  email: string;
  username: string;
  age: number;
  role: "player" | "developer" | "moderator" | "admin";
  blocked: boolean;
  createdAt: string;
  // Ultima IP conocida (y cuando) — el historico completo, con fecha/hora
  // de cada conexion, esta en UserHistoryModal (api.userConnections).
  lastIp?: string | null;
  lastIpAt?: string | null;
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

export interface ChatMessage {
  id: string;
  roomCode: string;
  userId: string | null;
  username: string;
  text: string;
  createdAt: string;
  // Cuantas alertas tiene YA esa cuenta (null = sesion anonima, no aplica).
  // Se muestra antes de alertar de nuevo, para no descubrir el limite de 3
  // recien cuando el servidor la rechaza.
  warningCount: number | null;
}

export interface ModerationSummary {
  activeBlocks: number;
  warningsInRange: number;
  ipBlocksCount: number;
  messagesInRange: number;
  topReasons: { label: string; count: number }[];
}

export interface Comment {
  id: string;
  userId: string | null;
  username: string;
  text: string;
  read: boolean;
  createdAt: string;
}

export type ConnectionQuality = "muy_buena" | "normal" | "baja" | "mala";

export interface LiveRoomPlayer {
  id: string;
  name: string;
  connected: boolean;
  rttMs: number | null;
  quality: ConnectionQuality | null;
}

export interface LiveRoom {
  code: string;
  mode: string;
  levelId: string;
  state: "lobby" | "countdown" | "playing" | "finished";
  maxPlayers: number;
  players: LiveRoomPlayer[];
}

export interface RoomLog {
  id: string;
  code: string;
  mode: string;
  levelId: string;
  maxPlayers: number;
  createdAt: string;
  endedAt: string | null;
  endReason: string | null;
  endedBy: string | null;
  peakPlayers: number;
}

export interface RoomLatencySample {
  id: string;
  takenAt: string;
  avgRttMs: number | null;
  minRttMs: number | null;
  maxRttMs: number | null;
  playerCount: number;
}

export const ROOM_ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "Esa sala ya no existe (puede que se haya vaciado sola).",
  NETWORK_ERROR: "No se pudo conectar con el servidor.",
};

export interface BlockReason {
  id: string;
  label: string;
  createdAt: string;
}

export interface AccountBlock {
  id: string;
  userId: string;
  username: string | null;
  reasonId: string;
  reasonLabel: string;
  messageId: string | null;
  messageText: string | null;
  blockedBy: string;
  blockedByName: string;
  active: boolean;
  createdAt: string;
}

export interface IpBlock {
  id: string;
  ip: string;
  reason: string;
  blockedBy: string | null;
  createdAt: string;
}

export interface IpAccount {
  id: string;
  username: string;
  blocked: boolean;
  role: string;
}

export const MODERATION_ERROR_MESSAGES: Record<string, string> = {
  INVALID_USER: "No se reconoce esa cuenta.",
  USER_NOT_FOUND: "Esa cuenta ya no existe.",
  INVALID_REASON: "Elige un motivo válido.",
  INVALID_USERS: "Selecciona al menos una cuenta.",
  INVALID_LABEL: "Ponle un nombre al motivo.",
  LABEL_IN_USE: "Ya existe un motivo con ese nombre.",
  REASON_IN_USE: "Ese motivo ya se usó en algún bloqueo o alerta — no se puede borrar.",
  INVALID_IP: "Ingresa una IP válida.",
  IP_ALREADY_BLOCKED: "Esa IP ya está bloqueada.",
  NETWORK_ERROR: "No se pudo conectar con el servidor.",
};

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
  backgroundScale: number | null;
  musicUrl: string | null;
  musicStartSec: number;
  musicEndSec: number | null;
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
  backgroundScale?: number | null;
  musicUrl?: string | null;
  musicStartSec?: number;
  musicEndSec?: number | null;
  obstacles: LevelObstacle[];
  checkpoints?: number[];
}

export const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  FILE_TOO_LARGE: "El archivo es muy grande (máximo 25MB).",
  INVALID_FILE_TYPE: "Ese tipo de archivo no es válido para esto.",
  NETWORK_ERROR: "No se pudo conectar con el servidor.",
};

export const LEVEL_ERROR_MESSAGES: Record<string, string> = {
  INVALID_NAME: "Ponle un nombre a la pista.",
  INVALID_DURATION: "La duración debe ser entre 5 y 600 segundos.",
  INVALID_SPEED: "La velocidad debe ser entre 100 y 1200 px/s (o déjala en blanco).",
  INVALID_JUMP: "La fuerza de salto debe ser un número negativo entre -300 y -2000 (o déjala en blanco).",
  INVALID_BACKGROUND_SCALE: "El tamaño del fondo debe ser entre 30% y 400%.",
  INVALID_OBSTACLES: "Hay un problema con los obstáculos colocados.",
  INVALID_OBSTACLE_TYPE: "Uno de los obstáculos tiene un tipo inválido.",
  INVALID_OBSTACLE_SHAPE: "Uno de los obstáculos tiene una posición o tamaño inválido.",
  OBSTACLE_OUT_OF_BOUNDS: "Algún obstáculo queda después del final de la pista.",
  INVALID_MUSIC_TRIM: "El inicio y fin de la música no son válidos.",
  NETWORK_ERROR: "No se pudo conectar con el servidor.",
};

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

  listUsers: (params: { search?: string; role?: string; blocked?: "true" | "false"; dateFrom?: string; dateTo?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.role) qs.set("role", params.role);
    if (params.blocked) qs.set("blocked", params.blocked);
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
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

  auditLogs: (
    params: { userId?: string; username?: string; field?: string; changedBy?: string; dateFrom?: string; dateTo?: string } = {}
  ) => {
    const qs = new URLSearchParams();
    if (params.userId) qs.set("userId", params.userId);
    if (params.username) qs.set("username", params.username);
    if (params.field) qs.set("field", params.field);
    if (params.changedBy) qs.set("changedBy", params.changedBy);
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
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

  // --- Conversaciones (moderacion) ----------------------------------------
  chatMessages: (
    params: { search?: string; roomCode?: string; onlyAccounts?: boolean; dateFrom?: string; dateTo?: string; page?: number } = {}
  ) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.roomCode) qs.set("roomCode", params.roomCode);
    if (params.onlyAccounts) qs.set("onlyAccounts", "true");
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
    if (params.page) qs.set("page", String(params.page));
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<{ ok: boolean; messages?: ChatMessage[]; total?: number; page?: number; pageSize?: number; error?: string }>(
      `/admin/chat-messages${suffix}`
    );
  },

  // --- Moderacion: bloqueo, alertas y motivos -----------------------------
  blockAccount: (input: { userId: string; reasonId: string; messageId?: string }) =>
    request<{ ok: boolean; block?: AccountBlock; error?: string }>("/admin/moderation/block", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  warnAccounts: (input: { userIds: string[]; reasonId: string; messageId?: string }) =>
    request<{ ok: boolean; warned?: unknown[]; blockedInstead?: string[]; error?: string }>("/admin/moderation/warn", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  moderationSummary: (params: RangeParams = {}) =>
    request<{ ok: boolean } & Partial<ModerationSummary> & { error?: string }>(`/admin/moderation/summary${rangeQS(params)}`),
  accountBlocks: (params: { active?: boolean; search?: string; dateFrom?: string; dateTo?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.active === false) qs.set("active", "false");
    if (params.search) qs.set("search", params.search);
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<{ ok: boolean; blocks?: AccountBlock[]; error?: string }>(`/admin/account-blocks${suffix}`);
  },
  unblockAccount: (id: string) => request<{ ok: boolean; error?: string }>(`/admin/account-blocks/${id}/unblock`, { method: "PUT" }),

  blockReasons: () => request<{ ok: boolean; reasons?: BlockReason[]; error?: string }>("/admin/block-reasons"),
  createBlockReason: (label: string) =>
    request<{ ok: boolean; reason?: BlockReason; error?: string }>("/admin/block-reasons", {
      method: "POST",
      body: JSON.stringify({ label }),
    }),
  deleteBlockReason: (id: string) => request<{ ok: boolean; error?: string }>(`/admin/block-reasons/${id}`, { method: "DELETE" }),

  // --- Lista negra de IP ---------------------------------------------------
  ipBlocks: (params: { search?: string } = {}) => {
    const suffix = params.search ? `?search=${encodeURIComponent(params.search)}` : "";
    return request<{ ok: boolean; blocks?: IpBlock[]; error?: string }>(`/admin/ip-blocks${suffix}`);
  },
  createIpBlock: (input: { ip: string; reason: string }) =>
    request<{ ok: boolean; block?: IpBlock; error?: string }>("/admin/ip-blocks", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteIpBlock: (id: string) => request<{ ok: boolean; error?: string }>(`/admin/ip-blocks/${id}`, { method: "DELETE" }),
  ipBlockAccounts: (ip: string) =>
    request<{ ok: boolean; accounts?: IpAccount[]; error?: string }>(`/admin/ip-blocks/${encodeURIComponent(ip)}/accounts`),

  // --- Salas -----------------------------------------------------------
  liveRooms: () => request<{ ok: boolean; rooms?: LiveRoom[]; error?: string }>("/admin/rooms/live"),
  roomHistory: (params: { search?: string; dateFrom?: string; dateTo?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<{ ok: boolean; logs?: RoomLog[]; error?: string }>(`/admin/rooms/history${suffix}`);
  },
  roomSamples: (roomLogId: string) =>
    request<{ ok: boolean; samples?: RoomLatencySample[]; error?: string }>(`/admin/rooms/history/${roomLogId}/samples`),
  endRoom: (code: string) => request<{ ok: boolean; error?: string }>(`/admin/rooms/${code}/end`, { method: "POST" }),

  // --- Bandeja de comentarios --------------------------------------------
  feedback: (params: { search?: string; read?: "true" | "false"; dateFrom?: string; dateTo?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.read) qs.set("read", params.read);
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<{ ok: boolean; comments?: Comment[]; unreadCount?: number; error?: string }>(`/admin/feedback${suffix}`);
  },
  markFeedbackRead: (id: string, read: boolean) =>
    request<{ ok: boolean; comment?: Comment; error?: string }>(`/admin/feedback/${id}/read`, {
      method: "PUT",
      body: JSON.stringify({ read }),
    }),
  deleteFeedback: (id: string) => request<{ ok: boolean; error?: string }>(`/admin/feedback/${id}`, { method: "DELETE" }),

  waitlist: (params: { search?: string; dateFrom?: string; dateTo?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<{ ok: boolean; entries?: WaitlistEntry[]; error?: string }>(`/admin/waitlist${suffix}`);
  },
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
