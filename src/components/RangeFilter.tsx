import type { RangeParams } from "../api/client";

export interface RangeValue {
  range: NonNullable<RangeParams["range"]>;
  date: string;
}

export function defaultRangeValue(): RangeValue {
  return { range: "day", date: new Date().toISOString().slice(0, 10) };
}

const OPTIONS: { key: RangeValue["range"]; label: string }[] = [
  { key: "day", label: "Día" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
];

export default function RangeFilter({ value, onChange }: { value: RangeValue; onChange: (v: RangeValue) => void }) {
  const isToday = value.date === new Date().toISOString().slice(0, 10);

  return (
    <div className="row" style={{ marginBottom: 16 }}>
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          className={`btn btn-secondary ${value.range === o.key ? "range-btn-active" : ""}`}
          onClick={() => onChange({ ...value, range: o.key })}
        >
          {o.key === "day" && isToday ? "Hoy" : o.label}
        </button>
      ))}
      <input
        type="date"
        className="input"
        value={value.date}
        max={new Date().toISOString().slice(0, 10)}
        onChange={(e) => onChange({ ...value, date: e.target.value || defaultRangeValue().date })}
        style={{ marginLeft: 4 }}
        title="Elegir otro día como referencia del rango"
      />
    </div>
  );
}
