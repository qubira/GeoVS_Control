import { useEffect, useState } from "react";
import { api, type Account, type ConnectionsSummary } from "../api/client";
import { formatDuration } from "../utils/format";
import RangeFilter, { defaultRangeValue, type RangeValue } from "../components/RangeFilter";
import OnlineByCountryCard from "../components/OnlineByCountryCard";
import AccountsByCountryCard from "../components/AccountsByCountryCard";
import LevelPopularityCard from "../components/LevelPopularityCard";
import ModerationSummaryCard from "../components/ModerationSummaryCard";
import UserHistoryModal from "../components/UserHistoryModal";

export default function DashboardScreen() {
  const [range, setRange] = useState<RangeValue>(defaultRangeValue());
  const [data, setData] = useState<ConnectionsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyUser, setHistoryUser] = useState<Account | null>(null);
  const [lookingUp, setLookingUp] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.connectionsSummary(range).then(({ body }) => {
      if (body.totalUsers !== undefined) setData(body as ConnectionsSummary);
      setLoading(false);
    });
  }, [range.range, range.date]);

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

  return (
    <div>
      <h1 className="title">Resumen</h1>
      <p className="subtitle">Vista general de cuentas y actividad.</p>

      <RangeFilter value={range} onChange={setRange} />

      {loading || !data ? (
        <p className="subtitle">Cargando...</p>
      ) : (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">{data.totalUsers}</div>
            <div className="stat-label">Cuentas totales</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.connectionsInRange}</div>
            <div className="stat-label">Conexiones en el rango</div>
          </div>
          {data.byRole.map((r) => (
            <div className="stat-card" key={r.role}>
              <div className="stat-value">{r.count}</div>
              <div className="stat-label">{r.role}</div>
            </div>
          ))}
        </div>
      )}

      <div className="metrics-grid">
        <OnlineByCountryCard />
        <AccountsByCountryCard range={range} />
        <LevelPopularityCard range={range} />
        <ModerationSummaryCard range={range} />

        <div className="metric-card">
          <h2 className="metric-card-title">Más tiempo jugado</h2>
          <p className="metric-card-hint">Solo tiempo jugando un nivel activamente, no en menús.</p>

          {!data ? null : data.topByTotalTime.length === 0 ? (
            <p className="subtitle" style={{ margin: 0 }}>
              Todavía sin datos.
            </p>
          ) : (
            <table className="data-table" style={{ display: "block", maxHeight: 130, overflowY: "auto" }}>
              <tbody style={{ display: "block" }}>
                {data.topByTotalTime.slice(0, 6).map((u) => (
                  <tr
                    key={u.userId}
                    className="row-clickable"
                    onClick={() => openPlayerHistory(u.userId, u.username)}
                    style={{ opacity: lookingUp === u.userId ? 0.5 : 1, display: "flex" }}
                  >
                    <td style={{ flex: 1 }}>{u.username}</td>
                    <td style={{ textAlign: "right", color: "var(--geo-text-dim)" }}>{formatDuration(u.seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {historyUser && <UserHistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />}
    </div>
  );
}
