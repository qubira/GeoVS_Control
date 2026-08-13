import { useEffect, useState } from "react";
import { api, type AccountsByCountry, type RangeParams } from "../api/client";
import BarChart from "./BarChart";
import EyeButton from "./EyeButton";
import AccountsByCountryModal from "./AccountsByCountryModal";

export default function AccountsByCountryCard({ range }: { range: RangeParams }) {
  const [data, setData] = useState<AccountsByCountry | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    api.accountsByCountry(range).then(({ body }) => {
      if (body.byCountry) setData(body as AccountsByCountry);
    });
  }, [range.range, range.date]);

  return (
    <div className="metric-card">
      <div className="row-between" style={{ marginBottom: 2 }}>
        <h2 className="metric-card-title" style={{ margin: 0 }}>
          Cuentas con sesión por país
        </h2>
        <EyeButton onClick={() => setShowDetail(true)} title="Ver todos los países" />
      </div>
      <p className="metric-card-hint">Histórico del rango elegido.</p>

      <BarChart
        data={(data?.byCountry || []).slice(0, 6).map((c) => ({ label: c.country, value: c.accounts, color: "var(--geo-grad-purple)" }))}
        height={110}
        formatValue={(v) => `${v} cuentas`}
        emptyLabel={data ? "Sin datos en este rango." : "Cargando..."}
      />

      {showDetail && <AccountsByCountryModal range={range} onClose={() => setShowDetail(false)} />}
    </div>
  );
}
