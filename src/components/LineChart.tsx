export interface LineChartPoint {
  label: string;
  value: number | null;
}

export interface LineChartProps {
  data: LineChartPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  emptyLabel?: string;
  color?: string;
  // Linea horizontal de referencia (ej. el umbral de "mala" conexion) para
  // que los picos por encima salten a la vista de un vistazo.
  thresholdValue?: number;
  thresholdLabel?: string;
}

// SVG con viewBox 0-100 en ambos ejes (no pixeles reales) — se escala solo
// con el contenedor via preserveAspectRatio="none", mismo espiritu que
// BarChart (nada de librerias de graficos, un componente chico a medida).
export default function LineChart({
  data,
  height = 140,
  formatValue = String,
  emptyLabel = "Sin datos",
  color = "var(--geo-cyan)",
  thresholdValue,
  thresholdLabel,
}: LineChartProps) {
  const validValues = data.map((d) => d.value).filter((v): v is number => v != null);
  if (validValues.length === 0) {
    return (
      <p className="subtitle" style={{ margin: 0 }}>
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(...validValues, thresholdValue ?? 0, 1);
  const min = 0;
  const toY = (v: number) => 100 - ((v - min) / (max - min || 1)) * 100;

  const points = data.map((d, i) => ({
    x: (i / (Math.max(data.length - 1, 1))) * 100,
    y: d.value == null ? null : toY(d.value),
    label: d.label,
    value: d.value,
  }));
  const polyline = points
    .filter((p): p is { x: number; y: number; label: string; value: number } => p.y != null)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  return (
    <div style={{ height, position: "relative" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
        {thresholdValue != null && (
          <line
            x1={0}
            x2={100}
            y1={toY(thresholdValue)}
            y2={toY(thresholdValue)}
            stroke="var(--geo-pink)"
            strokeWidth={0.5}
            strokeDasharray="2,2"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        {points.map(
          (p, i) =>
            p.y != null && (
              <circle key={i} cx={p.x} cy={p.y} r={1.4} fill={color}>
                <title>{`${p.label}: ${formatValue(p.value!)}`}</title>
              </circle>
            )
        )}
      </svg>
      {thresholdValue != null && thresholdLabel && (
        <span style={{ position: "absolute", right: 0, top: `${toY(thresholdValue)}%`, fontSize: 9, color: "var(--geo-pink)", transform: "translateY(-100%)" }}>
          {thresholdLabel}
        </span>
      )}
    </div>
  );
}
