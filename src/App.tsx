import { useEffect, useState } from "react";
import { useAuth } from "./state/AuthContext";
import LoginScreen from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import UsersScreen from "./screens/UsersScreen";
import AuditLogScreen from "./screens/AuditLogScreen";
import WaitlistScreen from "./screens/WaitlistScreen";
import ConversationsScreen from "./screens/ConversationsScreen";
import BlockedAccountsScreen from "./screens/BlockedAccountsScreen";
import IpBlacklistScreen from "./screens/IpBlacklistScreen";
import RoomsScreen from "./screens/RoomsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import CreateScreen from "./screens/CreateScreen";
import RoleBadge from "./components/RoleBadge";
import logo from "../imagen/logo_geovs.png";

type Tab = "dashboard" | "rooms" | "users" | "audit" | "waitlist" | "conversations" | "blocked" | "ipBlocks" | "settings" | "create";

export default function App() {
  const { account, loading, networkError, logout, retry } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (account?.role === "developer" && tab !== "create") setTab("create");
  }, [account?.role, tab]);

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

  // El rol developer solo puede ver y usar el modulo "Crear" — el backend ya
  // rechaza (403) cualquier otra ruta /admin para ese rol, esto es la
  // contraparte visual para no mostrar botones que llevarian a un error.
  // effectiveTab se calcula en el mismo render (no solo en el useEffect de
  // arriba) para que una cuenta developer no vea, ni por un instante, la
  // pantalla de otra seccion mientras el estado se corrige.
  const isDeveloper = account.role === "developer";
  const effectiveTab = isDeveloper ? "create" : tab;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="GeoVS" style={{ height: 28, width: "auto", verticalAlign: "middle", marginRight: 8 }} />
          GeoVS <span style={{ color: "var(--geo-cyan)" }}>Control</span>
        </div>

        {!isDeveloper && (
          <>
            <button className={`nav-item ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
              📊 Resumen
            </button>
            <button className={`nav-item ${tab === "rooms" ? "active" : ""}`} onClick={() => setTab("rooms")}>
              🎮 Salas
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
            <button className={`nav-item ${tab === "conversations" ? "active" : ""}`} onClick={() => setTab("conversations")}>
              💬 Conversaciones
            </button>
            <button className={`nav-item ${tab === "blocked" ? "active" : ""}`} onClick={() => setTab("blocked")}>
              🚫 Cuentas bloqueadas
            </button>
            <button className={`nav-item ${tab === "ipBlocks" ? "active" : ""}`} onClick={() => setTab("ipBlocks")}>
              🌐 Lista negra de IP
            </button>
            <button className={`nav-item ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>
              ⚙️ Configuración
            </button>
          </>
        )}
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
        {effectiveTab === "dashboard" && <DashboardScreen />}
        {effectiveTab === "rooms" && <RoomsScreen />}
        {effectiveTab === "users" && <UsersScreen />}
        {effectiveTab === "audit" && <AuditLogScreen />}
        {effectiveTab === "waitlist" && <WaitlistScreen />}
        {effectiveTab === "conversations" && <ConversationsScreen />}
        {effectiveTab === "blocked" && <BlockedAccountsScreen />}
        {effectiveTab === "ipBlocks" && <IpBlacklistScreen />}
        {effectiveTab === "settings" && <SettingsScreen />}
        {effectiveTab === "create" && <CreateScreen />}
      </main>
    </div>
  );
}
