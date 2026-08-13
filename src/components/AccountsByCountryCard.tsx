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
    <div className="panel" style={{ flex: 1, minWidth: 280 }}>
      <div className="row-between">
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Cuentas con sesión por país</h2>
        <EyeButton onClick={() => setShowDetail(true)} title="Ver todos los países" />
      </div>

      {!data ? (
        <p className="subtitle" style={{ margin: 0 }}>
          Cargando...
        </p>
      ) : (
        <BarChart
          data={data.byCountry.slice(0, 8).map((c) => ({ label: c.country, value: c.accounts, color: "var(--geo-purple)" }))}
          height={100}
          formatValue={(v) => `${v} cuentas`}
          emptyLabel="Sin datos en este rango."
        />
      )}

      {showDetail && <AccountsByCountryModal range={range} onClose={() => setShowDetail(false)} />}
    </div>
  );
}
