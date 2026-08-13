export interface BarChartDatum {
  label: string;
  value: number;
  color?: string;
  tooltip?: string;
}

export interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  formatValue?: (v: number) => string;
  emptyLabel?: string;
}

export default function BarChart({ data, height = 160, formatValue = String, emptyLabel = "Sin datos" }: BarChartProps) {
  if (data.length === 0) {
    return (
      <p className="subtitle" style={{ margin: 0 }}>
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = 28;
  const gap = 6;
  const labelH = 18;
  const width = data.length * (barW + gap);

  return (
    <svg
      viewBox={`0 0 ${width} ${height + labelH}`}
      width="100%"
      height={height + labelH}
      preserveAspectRatio="xMinYMid meet"
      style={{ display: "block", maxWidth: "100%" }}
    >
      {data.map((d, i) => {
        const x = i * (barW + gap);
        const h = Math.max(2, (d.value / max) * height);
        const y = height - h;
        const fill = d.color || "var(--geo-cyan)";
        return (
          <g key={`${d.label}-${i}`}>
            <path
              d={`M${x},${height} L${x},${y + 4} Q${x},${y} ${x + 4},${y} L${x + barW - 4},${y} Q${x + barW},${y} ${x + barW},${y + 4} L${x + barW},${height} Z`}
              fill={fill}
            >
              <title>{`${d.tooltip || d.label}: ${formatValue(d.value)}`}</title>
            </path>
            <text x={x + barW / 2} y={height + 13} textAnchor="middle" fontSize="9" fill="var(--geo-text-dim)">
              {d.label.length > 6 ? `${d.label.slice(0, 5)}…` : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
