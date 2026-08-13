import { useEffect, useState } from "react";
import { api, type LevelsPopularity, type RangeParams } from "../api/client";
import BarChart from "./BarChart";
import EyeButton from "./EyeButton";
import LevelPopularityModal from "./LevelPopularityModal";

const LEVEL_COLORS: Record<string, string> = {
  level1: "var(--geo-purple)",
  level2: "var(--geo-cyan)",
  level3: "var(--geo-pink)",
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
    <div className="panel" style={{ flex: 1, minWidth: 280 }}>
      <div className="row-between">
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Niveles más jugados</h2>
        <EyeButton onClick={() => setShowDetail(true)} title="Ver detalle por país y jugador" />
      </div>

      {!data ? (
        <p className="subtitle" style={{ margin: 0 }}>
          Cargando...
        </p>
      ) : (
        <BarChart
          data={data.overall.map((l) => ({ label: l.levelId, value: l.sessionCount, color: LEVEL_COLORS[l.levelId] }))}
          height={100}
          formatValue={(v) => `${v} partidas`}
          emptyLabel="Sin partidas jugadas en este rango."
        />
      )}

      {showDetail && <LevelPopularityModal range={range} onClose={() => setShowDetail(false)} />}
    </div>
  );
}
