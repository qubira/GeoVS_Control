import { useState } from "react";
import AvatarsPanel from "./create/AvatarsPanel";
import ObjectTypesPanel from "./create/ObjectTypesPanel";
import LevelsPanel from "./create/LevelsPanel";

type SubTab = "avatars" | "objects" | "levels";

const TABS: { key: SubTab; label: string }[] = [
  { key: "avatars", label: "Avatares" },
  { key: "objects", label: "Objetos" },
  { key: "levels", label: "Niveles" },
];

export default function CreateScreen() {
  const [tab, setTab] = useState<SubTab>("avatars");

  return (
    <div>
      <h1 className="title">Crear</h1>
      <p className="subtitle">Sube avatares, objetos y arma pistas nuevas para el juego.</p>

      <div className="row" style={{ marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`btn btn-secondary ${tab === t.key ? "range-btn-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "avatars" && <AvatarsPanel />}
      {tab === "objects" && <ObjectTypesPanel />}
      {tab === "levels" && <LevelsPanel />}
    </div>
  );
}
