import { useEffect, useState } from "react";
import { api, type OnlineByCountry } from "../api/client";
import BarChart from "./BarChart";
import CountryConnectionsModal from "./CountryConnectionsModal";

const POLL_MS = 5000;

export default function OnlineByCountryCard() {
  const [data, setData] = useState<OnlineByCountry | null>(null);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api.connectionsOnlineByCountry().then(({ body }) => {
        if (!cancelled && body.byCountry) setData(body as OnlineByCountry);
      });
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="panel" style={{ flex: 1, minWidth: 280 }}>
      <div className="row-between">
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>
          <span className="live-dot" />
          Conexiones por país (en vivo)
        </h2>
      </div>

      {!data ? (
        <p className="subtitle" style={{ margin: 0 }}>
          Cargando...
        </p>
      ) : (
        <>
          <div className="stat-value" style={{ fontSize: 22, marginBottom: 10 }}>
            {data.totalOnline} <span style={{ fontSize: 12, color: "var(--geo-text-dim)", fontWeight: 400 }}>conectados ahora</span>
          </div>
          <BarChart
            data={data.byCountry.slice(0, 8).map((c) => ({ label: c.country, value: c.count }))}
            height={100}
            formatValue={(v) => `${v} en línea`}
            emptyLabel="Nadie conectado en este momento."
          />
          {data.byCountry.length > 0 && (
            <table className="data-table" style={{ marginTop: 12 }}>
              <tbody>
                {data.byCountry.slice(0, 10).map((c) => (
                  <tr key={c.country} className="row-clickable" onClick={() => setCountry(c.country)}>
                    <td>{c.country}</td>
                    <td style={{ textAlign: "right", color: "var(--geo-text-dim)" }}>{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {country && <CountryConnectionsModal country={country} onClose={() => setCountry(null)} />}
    </div>
  );
}
