import { useEffect, useState } from "react";
import { api, type AuditLogEntry } from "../api/client";
import { formatDate } from "../utils/format";

const FIELD_LABELS: Record<string, string> = {
  account: "Cuenta",
  email: "Correo",
  username: "Usuario",
  age: "Edad",
  password: "Contraseña",
  role: "Rol",
  blocked: "Bloqueo",
  warned: "Alerta",
};

export default function AuditLogScreen() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [username, setUsername] = useState("");
  const [field, setField] = useState("");
  const [changedBy, setChangedBy] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api
        .auditLogs({
          username: username || undefined,
          field: field || undefined,
          changedBy: changedBy || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })
        .then(({ body }) => {
          setLogs(body.logs || []);
          setLoading(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [username, field, changedBy, dateFrom, dateTo]);

  const hasFilters = !!(username || field || changedBy || dateFrom || dateTo);

  return (
    <div>
      <h1 className="title">Historial de cambios</h1>
      <p className="subtitle">Últimos 200 movimientos en cualquier cuenta (datos personales, bloqueos, alertas, roles, altas y bajas).</p>

      <div className="row" style={{ marginBottom: 8 }}>
        <input
          className="input"
          placeholder="Buscar por cuenta afectada..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <button type="button" className="btn-ghost" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? "▲ Ocultar filtro avanzado" : "▼ Filtro avanzado"}
        </button>
      </div>

      {showAdvanced && (
        <div className="panel" style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div className="label" style={{ marginTop: 0 }}>
              Tipo de cambio
            </div>
            <select className="input" style={{ marginBottom: 0, width: 160 }} value={field} onChange={(e) => setField(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(FIELD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="label" style={{ marginTop: 0 }}>
              Hecho por
            </div>
            <input
              className="input"
              style={{ marginBottom: 0, width: 160 }}
              placeholder="Usuario que hizo el cambio"
              value={changedBy}
              onChange={(e) => setChangedBy(e.target.value)}
            />
          </div>
          <div>
            <div className="label" style={{ marginTop: 0 }}>
              Desde
            </div>
            <input className="input" type="date" style={{ marginBottom: 0 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <div className="label" style={{ marginTop: 0 }}>
              Hasta
            </div>
            <input className="input" type="date" style={{ marginBottom: 0 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      )}

      <div className="panel" style={{ overflowX: "auto" }}>
        {loading ? (
          <p className="subtitle">Cargando...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cuenta</th>
                <th>Campo</th>
                <th>Cambio</th>
                <th>Motivo</th>
                <th>Hecho por</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: "var(--geo-text-dim)", whiteSpace: "nowrap" }}>{formatDate(log.changedAt)}</td>
                  <td style={{ fontWeight: 700 }}>{log.targetUsername}</td>
                  <td>{FIELD_LABELS[log.field] || log.field}</td>
                  <td style={{ color: "var(--geo-text-dim)" }}>
                    {log.oldValue ? `${log.oldValue} → ` : ""}
                    {log.newValue || "—"}
                  </td>
                  <td>{log.reason || "—"}</td>
                  <td>{log.changedByUsername || "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                    {hasFilters ? "Sin resultados para ese filtro." : "Sin movimientos todavía."}
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
