import { useEffect, useState } from "react";
import { api, type Account, type AuditLogEntry, type UserConnections } from "../api/client";
import { formatDate, formatDay, formatDuration } from "../utils/format";

const FIELD_LABELS: Record<string, string> = {
  account: "Cuenta",
  email: "Correo",
  username: "Usuario",
  age: "Edad",
  password: "Contraseña",
  role: "Rol",
  blocked: "Bloqueo",
};

export default function UserHistoryModal({ user, onClose }: { user: Account; onClose: () => void }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [conn, setConn] = useState<UserConnections | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.auditLogs({ userId: user.id, username: user.username }),
      api.userConnections(user.id),
    ]).then(([auditRes, connRes]) => {
      setLogs(auditRes.body.logs || []);
      if (connRes.body.totalSec !== undefined) setConn(connRes.body as UserConnections);
      setLoading(false);
    });
  }, [user.id]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel" style={{ width: 560, maxHeight: "86vh", display: "flex", flexDirection: "column" }}>
        <div className="row-between" style={{ flexShrink: 0 }}>
          <span className="font-display" style={{ fontSize: 18 }}>
            Historial — {user.username}
          </span>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading && <p className="subtitle">Cargando...</p>}

        {!loading && (
          <div style={{ overflowY: "auto", marginTop: 10 }}>
            {conn && (
              <>
                <div className="label" style={{ marginTop: 0 }}>
                  Tiempo de conexión
                </div>
                <div className="stat-grid" style={{ marginBottom: 8 }}>
                  <div className="stat-card" style={{ padding: 12 }}>
                    <div className="stat-value" style={{ fontSize: 20 }}>
                      {formatDuration(conn.totalSec)}
                    </div>
                    <div className="stat-label">Acumulado total</div>
                  </div>
                  <div className="stat-card" style={{ padding: 12 }}>
                    <div className="stat-value" style={{ fontSize: 20 }}>
                      {conn.byDay[0] ? formatDuration(conn.byDay[0].seconds) : "0s"}
                    </div>
                    <div className="stat-label">{conn.byDay[0] ? formatDay(conn.byDay[0].day) : "Sin datos"}</div>
                  </div>
                </div>

                {conn.byDay.length > 0 && (
                  <table className="data-table" style={{ marginBottom: 16 }}>
                    <thead>
                      <tr>
                        <th>Día</th>
                        <th>Tiempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conn.byDay.slice(0, 7).map((d) => (
                        <tr key={d.day}>
                          <td>{formatDay(d.day)}</td>
                          <td>{formatDuration(d.seconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {conn.sessions.length > 0 && (
                  <>
                    <div className="label">Últimas conexiones</div>
                    <table className="data-table" style={{ marginBottom: 16 }}>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>País</th>
                          <th>IP</th>
                          <th>Duración</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conn.sessions.slice(0, 10).map((s) => (
                          <tr key={s.id}>
                            <td>{formatDate(s.connectedAt)}</td>
                            <td>{s.country || "—"}</td>
                            <td style={{ color: "var(--geo-text-dim)" }}>{s.ip || "—"}</td>
                            <td>{s.durationSec != null ? formatDuration(s.durationSec) : "en curso"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}

            <div className="label">Cambios registrados</div>
            {logs.length === 0 && <p style={{ color: "var(--geo-text-dim)", fontSize: 13 }}>Sin registros.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {logs.map((log) => (
                <div key={log.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 10 }}>
                  <div className="row-between">
                    <strong style={{ fontSize: 13 }}>{FIELD_LABELS[log.field] || log.field}</strong>
                    <span style={{ fontSize: 11, color: "var(--geo-text-dim)" }}>{formatDate(log.changedAt)}</span>
                  </div>
                  {(log.oldValue || log.newValue) && (
                    <p style={{ fontSize: 12, color: "var(--geo-text-dim)", margin: "4px 0" }}>
                      {log.oldValue ? `${log.oldValue} → ` : ""}
                      {log.newValue || ""}
                    </p>
                  )}
                  <p style={{ fontSize: 12, margin: "4px 0 0" }}>
                    {log.reason || "Sin motivo especificado"}
                    {log.changedByUsername && (
                      <span style={{ color: "var(--geo-text-dim)" }}> — por {log.changedByUsername}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
