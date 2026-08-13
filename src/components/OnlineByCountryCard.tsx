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
    <div className="metric-card">
      <h2 className="metric-card-title">
        <span className="live-dot" />
        Conexiones por país (en vivo)
      </h2>
      <p className="metric-card-hint">{data ? `${data.totalOnline} conectados ahora` : "Cargando..."}</p>

      <BarChart
        data={(data?.byCountry || []).slice(0, 6).map((c) => ({ label: c.country, value: c.count }))}
        height={110}
        formatValue={(v) => `${v} en línea`}
        emptyLabel="Nadie conectado en este momento."
        onBarClick={(d) => setCountry(d.label)}
      />

      {country && <CountryConnectionsModal country={country} onClose={() => setCountry(null)} />}
    </div>
  );
}
