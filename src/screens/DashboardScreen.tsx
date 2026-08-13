import { useEffect, useState } from "react";
import { api, type Account, type ConnectionsSummary } from "../api/client";
import { formatDuration } from "../utils/format";
import CountryConnectionsModal from "../components/CountryConnectionsModal";
import UserHistoryModal from "../components/UserHistoryModal";

export default function DashboardScreen() {
  const [data, setData] = useState<ConnectionsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<string | null>(null);
  const [historyUser, setHistoryUser] = useState<Account | null>(null);
  const [lookingUp, setLookingUp] = useState<string | null>(null);

  useEffect(() => {
    api.connectionsSummary().then(({ body }) => {
      if (body.totalUsers !== undefined) setData(body as ConnectionsSummary);
      setLoading(false);
    });
  }, []);

  async function openPlayerHistory(userId: string, username: string) {
    setLookingUp(userId);
    try {
      const { body } = await api.listUsers({ search: username });
      const match = body.users?.find((u) => u.id === userId) || body.users?.[0];
      if (match) setHistoryUser(match);
    } finally {
      setLookingUp(null);
    }
  }

  if (loading) return <p className="subtitle">Cargando...</p>;
  if (!data) return <p className="error-text">No se pudo cargar el resumen.</p>;

  return (
    <div>
      <h1 className="title">Resumen</h1>
      <p className="subtitle">Vista general de cuentas y actividad.</p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{data.totalUsers}</div>
          <div className="stat-label">Cuentas totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.connectionsToday}</div>
          <div className="stat-label">Conexiones hoy</div>
        </div>
        {data.byRole.map((r) => (
          <div className="stat-card" key={r.role}>
            <div className="stat-value">{r.count}</div>
            <div className="stat-label">{r.role}</div>
          </div>
        ))}
      </div>

      <div className="row" style={{ alignItems: "flex-start", gap: 20 }}>
        <div className="panel" style={{ flex: 1, minWidth: 280 }}>
          <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Conexiones por país</h2>
          {data.byCountry.length === 0 && <p className="subtitle" style={{ margin: 0 }}>Todavía sin datos.</p>}
          <table className="data-table">
            <tbody>
              {data.byCountry.slice(0, 10).map((c) => (
                <tr key={c.country} className="row-clickable" onClick={() => setCountry(c.country)}>
                  <td>{c.country}</td>
                  <td style={{ textAlign: "right", color: "var(--geo-text-dim)" }}>{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel" style={{ flex: 1, minWidth: 280 }}>
          <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Más tiempo conectado (reciente)</h2>
          {data.topByTotalTime.length === 0 && <p className="subtitle" style={{ margin: 0 }}>Todavía sin datos.</p>}
          <table className="data-table">
            <tbody>
              {data.topByTotalTime.map((u) => (
                <tr
                  key={u.userId}
                  className="row-clickable"
                  onClick={() => openPlayerHistory(u.userId, u.username)}
                  style={{ opacity: lookingUp === u.userId ? 0.5 : 1 }}
                >
                  <td>{u.username}</td>
                  <td style={{ textAlign: "right", color: "var(--geo-text-dim)" }}>{formatDuration(u.seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {country && <CountryConnectionsModal country={country} onClose={() => setCountry(null)} />}
      {historyUser && <UserHistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />}
    </div>
  );
}
