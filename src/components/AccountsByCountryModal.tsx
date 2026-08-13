import { useEffect, useState } from "react";
import { api, type AccountsByCountry, type RangeParams } from "../api/client";

export default function AccountsByCountryModal({ range, onClose }: { range: RangeParams; onClose: () => void }) {
  const [data, setData] = useState<AccountsByCountry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.accountsByCountry(range).then(({ body }) => {
      if (body.byCountry) setData(body as AccountsByCountry);
      setLoading(false);
    });
  }, [range.range, range.date]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel" style={{ width: 460, maxHeight: "86vh", display: "flex", flexDirection: "column" }}>
        <div className="row-between" style={{ flexShrink: 0 }}>
          <span className="font-display" style={{ fontSize: 18 }}>
            Cuentas con sesión por país
          </span>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="subtitle">Cuentas distintas que se conectaron desde cada país en el rango elegido.</p>

        {loading ? (
          <p className="subtitle">Cargando...</p>
        ) : (
          <div style={{ overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>País</th>
                  <th style={{ textAlign: "right" }}>Cuentas</th>
                </tr>
              </thead>
              <tbody>
                {data?.byCountry.map((c) => (
                  <tr key={c.country}>
                    <td>{c.country}</td>
                    <td style={{ textAlign: "right", color: "var(--geo-text-dim)" }}>{c.accounts}</td>
                  </tr>
                ))}
                {(!data || data.byCountry.length === 0) && (
                  <tr>
                    <td colSpan={2} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
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
