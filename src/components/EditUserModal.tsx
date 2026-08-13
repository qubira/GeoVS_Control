import { useState } from "react";
import { api, type Account } from "../api/client";
import { useAuth } from "../state/AuthContext";

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_IN_USE: "Ese correo ya está en uso.",
  USERNAME_IN_USE: "Ese nombre de usuario ya está en uso.",
  INVALID_EMAIL: "Correo inválido.",
  INVALID_USERNAME: "Usuario inválido (3-20 caracteres, letras/números/_).",
  INVALID_PASSWORD: "La contraseña debe tener al menos 6 caracteres.",
  INVALID_AGE: "Edad inválida.",
  ONLY_ADMIN_CAN_SET_ROLE: "Solo un administrador puede cambiar roles.",
};

export default function EditUserModal({
  user,
  onClose,
  onSaved,
  onDeleted,
  onViewHistory,
}: {
  user: Account;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  onViewHistory: () => void;
}) {
  const { account } = useAuth();
  const isAdmin = account?.role === "admin";
  const isSelf = account?.id === user.id;

  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username);
  const [age, setAge] = useState(String(user.age));
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user.role);
  const [blocked, setBlocked] = useState(user.blocked);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const patch: Record<string, string | number | boolean> = {};
      if (email.trim() !== user.email) patch.email = email.trim();
      if (username.trim() !== user.username) patch.username = username.trim();
      if (String(age) !== String(user.age)) patch.age = Number(age);
      if (password.trim()) patch.password = password.trim();
      if (role !== user.role) patch.role = role;
      if (blocked !== user.blocked) patch.blocked = blocked;
      if (reason.trim()) patch.reason = reason.trim();

      if (Object.keys(patch).length === 0 || (Object.keys(patch).length === 1 && patch.reason)) {
        setSuccess("No hay cambios para guardar.");
        return;
      }

      const { status, body } = await api.updateUser(user.id, patch);
      if (status !== 200) {
        setError(ERROR_MESSAGES[body.error || ""] || "No se pudo actualizar la cuenta.");
        return;
      }
      setSuccess("Cambios guardados.");
      setPassword("");
      setReason("");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setSaving(true);
    setError("");
    try {
      const { status, body } = await api.deleteUser(user.id, reason.trim() || undefined);
      if (status !== 200) {
        setError(ERROR_MESSAGES[body.error || ""] || "No se pudo eliminar la cuenta.");
        return;
      }
      onDeleted();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="panel" onSubmit={onSave} style={{ width: 460, maxHeight: "88vh", overflowY: "auto" }}>
        <div className="row-between">
          <span className="font-display" style={{ fontSize: 18 }}>
            {user.username}
          </span>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="label" style={{ marginTop: 12 }}>
          Correo
        </div>
        <input className="input" style={{ width: "100%" }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <div className="label">Usuario</div>
        <input className="input" style={{ width: "100%" }} value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} required />

        <div className="label">Edad</div>
        <input className="input" style={{ width: "100%" }} type="number" value={age} onChange={(e) => setAge(e.target.value)} min={5} max={100} required />

        <div className="label">Nueva contraseña (opcional)</div>
        <input
          className="input"
          style={{ width: "100%" }}
          type="password"
          placeholder="Dejar en blanco para no cambiarla"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="label">Rol</div>
        <select
          className="input"
          style={{ width: "100%" }}
          value={role}
          onChange={(e) => setRole(e.target.value as Account["role"])}
          disabled={!isAdmin || isSelf}
        >
          <option value="player">Jugador</option>
          <option value="developer">Desarrollador</option>
          <option value="moderator">Moderador</option>
          <option value="admin">Administrador</option>
        </select>
        {isSelf && <p style={{ color: "var(--geo-text-dim)", fontSize: 11, marginTop: 4 }}>No puedes cambiar tu propio rol.</p>}

        <label className="row" style={{ marginTop: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} disabled={isSelf} />
          <span style={{ fontSize: 13 }}>Cuenta bloqueada</span>
        </label>

        <div className="label">Motivo (para el historial)</div>
        <input
          className="input"
          style={{ width: "100%" }}
          placeholder="Ej: solicitud del usuario, reporte de otro jugador..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="row-between" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-secondary" onClick={onViewHistory} style={{ width: "auto" }}>
            📜 Ver historial
          </button>
          <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: "auto" }}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        {!!error && <p className="error-text">{error}</p>}
        {!!success && <p className="success-text">{success}</p>}

        {isAdmin && !isSelf && (
          <div style={{ borderTop: "1px solid var(--geo-border)", marginTop: 18, paddingTop: 14 }}>
            {!confirmingDelete ? (
              <button type="button" className="btn btn-danger" onClick={() => setConfirmingDelete(true)} style={{ width: "100%" }}>
                🗑️ Eliminar cuenta
              </button>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "var(--geo-text-dim)", marginBottom: 8 }}>
                  Esto elimina la cuenta permanentemente. El historial de cambios queda registrado. ¿Confirmas?
                </p>
                <div className="row">
                  <button type="button" className="btn btn-danger" onClick={onDelete} disabled={saving} style={{ flex: 1 }}>
                    Sí, eliminar
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmingDelete(false)} style={{ flex: 1 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
