import { useState } from "react";
import { useAuth } from "../state/AuthContext";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Usuario o contraseña incorrectos.",
  ACCOUNT_BLOCKED: "Esta cuenta está bloqueada.",
  NOT_ALLOWED: "Esta cuenta no tiene permisos de administración.",
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const err = await login(username.trim(), password);
      if (err) setError(ERROR_MESSAGES[err] || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <form className="panel" onSubmit={onSubmit} style={{ width: 380 }}>
        <h1 className="font-display title">
          GeoVS <span style={{ color: "var(--geo-cyan)" }}>Control</span>
        </h1>
        <p className="subtitle">Panel de administración — acceso restringido a admin/moderador.</p>

        <div className="label" style={{ marginTop: 0 }}>
          Usuario
        </div>
        <input className="input" style={{ width: "100%" }} value={username} onChange={(e) => setUsername(e.target.value)} required />

        <div className="label">Contraseña</div>
        <input
          className="input"
          style={{ width: "100%" }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 18 }}>
          {loading ? "Un momento..." : "Entrar"}
        </button>
        {!!error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}
