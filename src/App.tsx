import { useState } from "react";
import { useAuth } from "./state/AuthContext";
import LoginScreen from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import UsersScreen from "./screens/UsersScreen";
import AuditLogScreen from "./screens/AuditLogScreen";
import WaitlistScreen from "./screens/WaitlistScreen";
import CreateScreen from "./screens/CreateScreen";
import RoleBadge from "./components/RoleBadge";
import logo from "../imagen/logo_geovs.png";

type Tab = "dashboard" | "users" | "audit" | "waitlist" | "create";

export default function App() {
  const { account, loading, networkError, logout, retry } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) {
    return (
      <div className="screen">
        <p className="subtitle">Cargando...</p>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="screen">
        <div className="panel" style={{ maxWidth: 380, textAlign: "center" }}>
          <p className="error-text" style={{ marginTop: 0 }}>
            No se pudo conectar con el servidor.
          </p>
          <p className="subtitle">Verifica que esté corriendo (o que Render haya despertado) e intenta de nuevo.</p>
          <button className="btn btn-primary" onClick={retry} style={{ width: "100%" }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!account) return <LoginScreen />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="GeoVS" style={{ height: 28, width: "auto", verticalAlign: "middle", marginRight: 8 }} />
          GeoVS <span style={{ color: "var(--geo-cyan)" }}>Control</span>
        </div>

        <button className={`nav-item ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
          📊 Resumen
        </button>
        <button className={`nav-item ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
          👥 Cuentas
        </button>
        <button className={`nav-item ${tab === "audit" ? "active" : ""}`} onClick={() => setTab("audit")}>
          📜 Historial
        </button>
        <button className={`nav-item ${tab === "waitlist" ? "active" : ""}`} onClick={() => setTab("waitlist")}>
          📝 Lista de espera
        </button>
        <button className={`nav-item ${tab === "create" ? "active" : ""}`} onClick={() => setTab("create")}>
          🛠️ Crear
        </button>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "10px 10px 4px", fontSize: 12, color: "var(--geo-text-dim)" }}>
          {account.username} · <RoleBadge role={account.role} />
        </div>
        <button className="nav-item" onClick={logout} style={{ color: "var(--geo-pink)" }}>
          Cerrar sesión
        </button>
      </aside>

      <main className="main">
        {tab === "dashboard" && <DashboardScreen />}
        {tab === "users" && <UsersScreen />}
        {tab === "audit" && <AuditLogScreen />}
        {tab === "waitlist" && <WaitlistScreen />}
        {tab === "create" && <CreateScreen />}
      </main>
    </div>
  );
}
