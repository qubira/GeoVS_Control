import { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../state/AuthContext";
import RoleSelect from "./RoleSelect";

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_IN_USE: "Ese correo ya está en uso.",
  USERNAME_IN_USE: "Ese nombre de usuario ya está en uso.",
  INVALID_EMAIL: "Correo inválido.",
  INVALID_USERNAME: "Usuario inválido (3-20 caracteres, letras/números/_).",
  INVALID_PASSWORD: "La contraseña debe tener al menos 6 caracteres.",
  INVALID_AGE: "Edad inválida.",
  ONLY_ADMIN_CAN_SET_ROLE: "Solo un administrador puede asignar roles distintos a jugador.",
};

export default function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { account } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [role, setRole] = useState("player");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = account?.role === "admin";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { status, body } = await api.createUser({
        email: email.trim(),
        username: username.trim(),
        password,
        age: Number(age),
        role,
      });
      if (status !== 201) {
        setError(ERROR_MESSAGES[body.error || ""] || "No se pudo crear la cuenta.");
        return;
      }
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="panel" onSubmit={onSubmit} style={{ width: 420 }}>
        <div className="row-between">
          <span className="font-display" style={{ fontSize: 18 }}>
            Nueva cuenta
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

        <div className="label">Contraseña</div>
        <input
          className="input"
          style={{ width: "100%" }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="label">Edad</div>
        <input className="input" style={{ width: "100%" }} type="number" value={age} onChange={(e) => setAge(e.target.value)} min={5} max={100} required />

        <div className="label">Rol</div>
        <RoleSelect value={role} onChange={setRole} disabled={!isAdmin} />
        {!isAdmin && (
          <p style={{ color: "var(--geo-text-dim)", fontSize: 11, marginTop: 4 }}>
            Solo un administrador puede crear cuentas con rol distinto a jugador.
          </p>
        )}

        <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: "100%", marginTop: 16 }}>
          {saving ? "Creando..." : "Crear cuenta"}
        </button>
        {!!error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}
