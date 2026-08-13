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
};

export default function AuditLogScreen() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auditLogs().then(({ body }) => {
      setLogs(body.logs || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="title">Historial de cambios</h1>
      <p className="subtitle">Últimos 200 movimientos en cualquier cuenta (datos personales, bloqueos, roles, altas y bajas).</p>

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
                    Sin movimientos todavía.
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
