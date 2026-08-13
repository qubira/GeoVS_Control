import { useEffect, useState } from "react";
import { api, type LevelsPopularity, type RangeParams } from "../api/client";
import BarChart from "./BarChart";
import EyeButton from "./EyeButton";
import LevelPopularityModal from "./LevelPopularityModal";

const LEVEL_COLORS: Record<string, string> = {
  level1: "var(--geo-grad-purple)",
  level2: "var(--geo-grad-cyan)",
  level3: "var(--geo-grad-pink)",
};

export default function LevelPopularityCard({ range }: { range: RangeParams }) {
  const [data, setData] = useState<LevelsPopularity | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    api.levelsPopularity(range).then(({ body }) => {
      if (body.overall) setData(body as LevelsPopularity);
    });
  }, [range.range, range.date]);

  return (
    <div className="metric-card">
      <div className="row-between" style={{ marginBottom: 2 }}>
        <h2 className="metric-card-title" style={{ margin: 0 }}>
          Niveles más jugados
        </h2>
        <EyeButton onClick={() => setShowDetail(true)} title="Ver detalle por país y jugador" />
      </div>
      <p className="metric-card-hint">Partidas jugadas en el rango elegido.</p>

      <BarChart
        data={(data?.overall || []).map((l) => ({ label: l.levelId, value: l.sessionCount, color: LEVEL_COLORS[l.levelId] }))}
        height={110}
        formatValue={(v) => `${v} partidas`}
        emptyLabel={data ? "Sin partidas jugadas en este rango." : "Cargando..."}
      />

      {showDetail && <LevelPopularityModal range={range} onClose={() => setShowDetail(false)} />}
    </div>
  );
}
