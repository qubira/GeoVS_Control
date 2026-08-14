import { Fragment, useEffect, useState } from "react";
import { api, type LiveRoom, type RoomLog, type RoomLatencySample, type ConnectionQuality, ROOM_ERROR_MESSAGES } from "../api/client";
import { formatDate, formatDuration } from "../utils/format";
import LineChart from "../components/LineChart";

const LIVE_REFRESH_MS = 6000;
const MODE_LABELS: Record<string, string> = { race: "Carrera", elimination: "Eliminación" };
const QUALITY_LABELS: Record<ConnectionQuality, string> = {
  muy_buena: "Muy buena",
  normal: "Normal",
  baja: "Baja",
  mala: "Mala",
};
const END_REASON_LABELS: Record<string, string> = {
  emptied: "Se vació sola",
  admin: "Finalizada por admin",
};

export default function RoomsScreen() {
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [confirmEndCode, setConfirmEndCode] = useState<string | null>(null);
  const [endError, setEndError] = useState("");

  const [history, setHistory] = useState<RoomLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [samplesById, setSamplesById] = useState<Record<string, RoomLatencySample[]>>({});

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      api.liveRooms().then(({ body }) => {
        if (!mounted) return;
        setLiveRooms(body.rooms || []);
        setLiveLoading(false);
      });
    };
    refresh();
    const interval = setInterval(refresh, LIVE_REFRESH_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setHistoryLoading(true);
    const t = setTimeout(() => {
      api.roomHistory({ search: search || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }).then(({ body }) => {
        setHistory(body.logs || []);
        setHistoryLoading(false);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [search, dateFrom, dateTo]);

  async function onEndRoom(code: string) {
    setEndError("");
    const { body } = await api.endRoom(code);
    setConfirmEndCode(null);
    if (!body.ok) {
      setEndError(ROOM_ERROR_MESSAGES[body.error || ""] || "No se pudo finalizar la sala.");
      return;
    }
    setLiveRooms((prev) => prev.filter((r) => r.code !== code));
  }

  async function toggleExpand(log: RoomLog) {
    if (expandedId === log.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(log.id);
    if (!samplesById[log.id]) {
      const { body } = await api.roomSamples(log.id);
      setSamplesById((prev) => ({ ...prev, [log.id]: body.samples || [] }));
    }
  }

  return (
    <div>
      <h1 className="title">Salas</h1>
      <p className="subtitle">Salas creadas y usadas, jugadores conectados, calidad de conexión real (ping) y su histórico.</p>

      <div className="label" style={{ marginTop: 0 }}>
        Salas en vivo
      </div>
      {!!endError && <p className="error-text">{endError}</p>}
      {liveLoading ? (
        <p className="subtitle">Cargando...</p>
      ) : liveRooms.length === 0 ? (
        <p className="subtitle" style={{ marginBottom: 20 }}>
          No hay salas activas ahora mismo.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {liveRooms.map((room) => (
            <div key={room.code} className="panel">
              <div className="row-between" style={{ marginBottom: 8 }}>
                <div>
                  <strong style={{ fontFamily: "monospace", fontSize: 15 }}>{room.code}</strong>
                  <span style={{ marginLeft: 10, fontSize: 12, color: "var(--geo-text-dim)" }}>
                    {MODE_LABELS[room.mode] || room.mode} · {room.levelId} · {room.state} · {room.players.length}/{room.maxPlayers}
                  </span>
                </div>
                {confirmEndCode === room.code ? (
                  <span style={{ display: "inline-flex", gap: 6 }}>
                    <span style={{ fontSize: 12, alignSelf: "center" }}>¿Expulsar a todos y cerrar la sala?</span>
                    <button className="btn-danger" onClick={() => onEndRoom(room.code)}>
                      Sí, finalizar
                    </button>
                    <button className="btn-ghost" onClick={() => setConfirmEndCode(null)}>
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <button className="btn-danger" onClick={() => setConfirmEndCode(room.code)}>
                    ⛔ Finalizar sala
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {room.players.map((p) => (
                  <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "4px 10px", fontSize: 12 }}>
                    {p.name}
                    {p.connected === false ? (
                      <span className="badge" style={{ background: "rgba(255,255,255,0.08)", color: "var(--geo-text-dim)" }}>
                        Desconectado
                      </span>
                    ) : p.quality ? (
                      <span className={`badge badge-quality-${p.quality}`}>
                        {QUALITY_LABELS[p.quality]}
                        {p.rttMs != null ? ` (${p.rttMs}ms)` : ""}
                      </span>
                    ) : (
                      <span className="badge" style={{ background: "rgba(255,255,255,0.08)", color: "var(--geo-text-dim)" }}>
                        Midiendo...
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="label">Histórico de salas</div>
      <div className="row" style={{ marginBottom: 16 }}>
        <input className="input" placeholder="Buscar por código de sala..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        <input className="input" type="date" style={{ marginBottom: 0 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input className="input" type="date" style={{ marginBottom: 0 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="panel" style={{ overflowX: "auto" }}>
        {historyLoading ? (
          <p className="subtitle">Cargando...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Modo</th>
                <th>Nivel</th>
                <th>Creada</th>
                <th>Duración</th>
                <th>Pico jugadores</th>
                <th>Cómo terminó</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {history.map((log) => {
                const durationSec = log.endedAt ? Math.round((new Date(log.endedAt).getTime() - new Date(log.createdAt).getTime()) / 1000) : null;
                return (
                  <Fragment key={log.id}>
                    <tr>
                      <td style={{ fontFamily: "monospace" }}>{log.code}</td>
                      <td>{MODE_LABELS[log.mode] || log.mode}</td>
                      <td style={{ color: "var(--geo-text-dim)" }}>{log.levelId}</td>
                      <td style={{ color: "var(--geo-text-dim)", whiteSpace: "nowrap" }}>{formatDate(log.createdAt)}</td>
                      <td>{durationSec != null ? formatDuration(durationSec) : "en curso"}</td>
                      <td>{log.peakPlayers}</td>
                      <td>
                        {log.endReason ? (
                          <span>
                            {END_REASON_LABELS[log.endReason] || log.endReason}
                            {log.endedBy ? ` (${log.endedBy})` : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn-ghost" onClick={() => toggleExpand(log)}>
                          {expandedId === log.id ? "▲ Ocultar" : "▼ Ver latencia"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr>
                        <td colSpan={8} style={{ background: "rgba(255,255,255,0.03)", padding: 16 }}>
                          {!samplesById[log.id] ? (
                            <span className="subtitle">Cargando...</span>
                          ) : (
                            <>
                              <p className="metric-card-hint" style={{ marginBottom: 6 }}>
                                Latencia promedio (ms) en el tiempo — picos = caídas de calidad de conexión.
                              </p>
                              <LineChart
                                data={samplesById[log.id].map((s) => ({ label: formatDate(s.takenAt), value: s.avgRttMs }))}
                                height={140}
                                formatValue={(v) => `${v}ms`}
                                emptyLabel="No se guardaron muestras para esta sala (duró muy poco)."
                                thresholdValue={350}
                                thresholdLabel="malo"
                              />
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                    {search || dateFrom || dateTo ? "Sin resultados para ese filtro." : "Todavía no hay salas registradas."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
