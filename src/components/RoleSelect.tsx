import { useEffect, useRef, useState } from "react";

export const ROLE_LABELS: Record<string, string> = {
  player: "Jugador",
  developer: "Desarrollador",
  moderator: "Moderador",
  admin: "Administrador",
};

const ROLES = ["player", "developer", "moderator", "admin"];

export default function RoleSelect({
  value,
  onChange,
  disabled,
  allowAll,
  allLabel = "Todos los roles",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowAll?: boolean;
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const options = allowAll ? ["", ...ROLES] : ROLES;

  return (
    <div className="role-select" ref={wrapperRef}>
      <button
        type="button"
        className={`role-select-trigger ${open ? "open" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        {value ? <span className={`badge badge-${value}`}>{ROLE_LABELS[value] || value}</span> : <span style={{ color: "var(--geo-text-dim)" }}>{allLabel}</span>}
        <span className="role-select-chevron">▾</span>
      </button>

      {open && (
        <div className="role-select-menu">
          {options.map((r) => (
            <div
              key={r || "all"}
              className={`role-select-option ${value === r ? "active" : ""}`}
              onClick={() => {
                onChange(r);
                setOpen(false);
              }}
            >
              {r ? <span className={`badge badge-${r}`}>{ROLE_LABELS[r]}</span> : <span style={{ color: "var(--geo-text-dim)", fontSize: 13 }}>{allLabel}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
