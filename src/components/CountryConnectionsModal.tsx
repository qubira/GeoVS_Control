import { useEffect, useState } from "react";
import { api, type CountrySession } from "../api/client";
import { formatDate, formatDuration } from "../utils/format";
import RoleBadge from "./RoleBadge";

export default function CountryConnectionsModal({ country, onClose }: { country: string; onClose: () => void }) {
  const [sessions, setSessions] = useState<CountrySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.connectionsByCountry(country).then(({ body }) => {
      setSessions(body.sessions || []);
      setLoading(false);
    });
  }, [country]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel" style={{ width: 520, maxHeight: "86vh", display: "flex", flexDirection: "column" }}>
        <div className="row-between" style={{ flexShrink: 0 }}>
          <span className="font-display" style={{ fontSize: 18 }}>
            Conexiones desde {country}
          </span>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <p className="subtitle">Cargando...</p>
        ) : (
          <div style={{ overflowY: "auto", marginTop: 10 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Fecha</th>
                  <th>IP</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>
                      {s.username} {s.role && <RoleBadge role={s.role} />}
                    </td>
                    <td style={{ color: "var(--geo-text-dim)", whiteSpace: "nowrap" }}>{formatDate(s.connectedAt)}</td>
                    <td style={{ color: "var(--geo-text-dim)" }}>{s.ip || "—"}</td>
                    <td>{s.durationSec != null ? formatDuration(s.durationSec) : "en curso"}</td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                      Sin conexiones registradas desde aquí.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
