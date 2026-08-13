export interface BarChartDatum {
  label: string;
  value: number;
  color?: string; // color solido o un `background` CSS completo (ej. un gradiente)
  tooltip?: string;
}

export interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  formatValue?: (v: number) => string;
  emptyLabel?: string;
  onBarClick?: (d: BarChartDatum) => void;
}

const DEFAULT_FILL = "linear-gradient(180deg, var(--geo-cyan), var(--geo-blue))";

// Barras HTML/CSS (no SVG con viewBox) a propósito: la altura queda fijada
// por el contenedor flex en px reales, sin depender de preserveAspectRatio
// ni de la cantidad de barras — asi no se puede "disparar" el alto como
// pasaba con el enfoque anterior basado en SVG.
export default function BarChart({ data, height = 120, formatValue = String, emptyLabel = "Sin datos", onBarClick }: BarChartProps) {
  if (data.length === 0) {
    return (
      <p className="subtitle" style={{ margin: 0 }}>
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max(3, Math.round((d.value / max) * 100));
        return (
          <div
            key={`${d.label}-${i}`}
            className={`bar-chart-col ${onBarClick ? "bar-chart-col-clickable" : ""}`}
            title={`${d.tooltip || d.label}: ${formatValue(d.value)}`}
            onClick={() => onBarClick?.(d)}
          >
            <div className="bar-chart-bar" style={{ height: `${pct}%`, background: d.color || DEFAULT_FILL }} />
            <div className="bar-chart-label">{d.label.length > 8 ? `${d.label.slice(0, 7)}…` : d.label}</div>
          </div>
        );
      })}
    </div>
  );
}
