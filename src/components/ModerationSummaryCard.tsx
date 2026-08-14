import { useEffect, useState } from "react";
import { api, type ModerationSummary, type RangeParams } from "../api/client";
import BarChart from "./BarChart";

export default function ModerationSummaryCard({ range }: { range: RangeParams }) {
  const [data, setData] = useState<ModerationSummary | null>(null);

  useEffect(() => {
    api.moderationSummary(range).then(({ body }) => {
      if (body.activeBlocks !== undefined) setData(body as ModerationSummary);
    });
  }, [range.range, range.date]);

  return (
    <div className="metric-card metric-card-wide">
      <h2 className="metric-card-title" style={{ margin: 0 }}>
        Moderación
      </h2>
      <p className="metric-card-hint">Cuentas bloqueadas, alertas e IPs bloqueadas.</p>

      {!data ? (
        <p className="subtitle" style={{ margin: 0 }}>
          Cargando...
        </p>
      ) : (
        <>
          <div className="stat-grid" style={{ marginBottom: 14 }}>
            <div className="stat-card" style={{ padding: 12 }}>
              <div className="stat-value" style={{ fontSize: 20 }}>
                {data.activeBlocks}
              </div>
              <div className="stat-label">Cuentas bloqueadas</div>
            </div>
            <div className="stat-card" style={{ padding: 12 }}>
              <div className="stat-value" style={{ fontSize: 20 }}>
                {data.warningsInRange}
              </div>
              <div className="stat-label">Alertas en el rango</div>
            </div>
            <div className="stat-card" style={{ padding: 12 }}>
              <div className="stat-value" style={{ fontSize: 20 }}>
                {data.ipBlocksCount}
              </div>
              <div className="stat-label">IPs bloqueadas</div>
            </div>
            <div className="stat-card" style={{ padding: 12 }}>
              <div className="stat-value" style={{ fontSize: 20 }}>
                {data.messagesInRange}
              </div>
              <div className="stat-label">Mensajes en el rango</div>
            </div>
          </div>

          <p className="metric-card-hint" style={{ marginBottom: 4 }}>
            Motivos más usados (bloqueos + alertas en el rango)
          </p>
          <BarChart
            data={data.topReasons.map((r) => ({ label: r.label, value: r.count }))}
            height={100}
            formatValue={(v) => `${v}`}
            emptyLabel="Sin bloqueos ni alertas en este rango."
          />
        </>
      )}
    </div>
  );
}
