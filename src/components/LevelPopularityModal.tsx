import { useEffect, useState } from "react";
import { api, type LevelsPopularity, type RangeParams } from "../api/client";

export default function LevelPopularityModal({ range, onClose }: { range: RangeParams; onClose: () => void }) {
  const [data, setData] = useState<LevelsPopularity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.levelsPopularity(range).then(({ body }) => {
      if (body.overall) setData(body as LevelsPopularity);
      setLoading(false);
    });
  }, [range.range, range.date]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel" style={{ width: 520, maxHeight: "86vh", display: "flex", flexDirection: "column" }}>
        <div className="row-between" style={{ flexShrink: 0 }}>
          <span className="font-display" style={{ fontSize: 18 }}>
            Niveles más jugados
          </span>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <p className="subtitle">Cargando...</p>
        ) : (
          <div style={{ overflowY: "auto" }}>
            <div className="label" style={{ marginTop: 0 }}>
              Por país
            </div>
            <table className="data-table" style={{ marginBottom: 16 }}>
              <thead>
                <tr>
                  <th>Nivel</th>
                  <th>País</th>
                  <th style={{ textAlign: "right" }}>Partidas</th>
                </tr>
              </thead>
              <tbody>
                {data?.byCountry.map((c) => (
                  <tr key={`${c.levelId}|${c.country}`}>
                    <td>{c.levelId}</td>
                    <td style={{ color: "var(--geo-text-dim)" }}>{c.country}</td>
                    <td style={{ textAlign: "right" }}>{c.count}</td>
                  </tr>
                ))}
                {(!data || data.byCountry.length === 0) && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                      Sin datos en este rango.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="label">Top jugadores</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Nivel</th>
                  <th style={{ textAlign: "right" }}>Partidas</th>
                </tr>
              </thead>
              <tbody>
                {data?.topPlayers.map((p) => (
                  <tr key={`${p.levelId}|${p.userId}`}>
                    <td style={{ fontWeight: 700 }}>{p.username}</td>
                    <td style={{ color: "var(--geo-text-dim)" }}>{p.levelId}</td>
                    <td style={{ textAlign: "right" }}>{p.sessionCount}</td>
                  </tr>
                ))}
                {(!data || data.topPlayers.length === 0) && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                      Sin datos en este rango.
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
