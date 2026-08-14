import { useEffect, useState } from "react";
import { api, type CustomLevel } from "../../api/client";
import LevelEditor from "../../components/create/LevelEditor";

export default function LevelsPanel() {
  const [levels, setLevels] = useState<CustomLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CustomLevel | "new" | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"" | "published" | "draft">("");

  function load() {
    setLoading(true);
    api.listCustomLevels().then(({ body }) => {
      setLevels(body.levels || []);
      setLoading(false);
    });
  }
  useEffect(load, []);

  async function onDelete(id: string) {
    await api.deleteCustomLevel(id);
    setConfirmingDelete(null);
    load();
  }

  async function onTogglePublish(l: CustomLevel) {
    await api.publishCustomLevel(l.id, !l.published);
    load();
  }

  if (editing) {
    return (
      <LevelEditor
        level={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <p className="subtitle" style={{ margin: 0 }}>
          Pistas creadas desde el panel. Quedan en borrador hasta que le des "Subir proyecto" — recién ahí los
          jugadores pueden elegirlas y entrar a jugarlas.
        </p>
        <button className="btn btn-primary" onClick={() => setEditing("new")} style={{ width: "auto" }}>
          + Nueva pista
        </button>
      </div>

      {levels.length > 0 && (
        <div className="row" style={{ marginBottom: 16 }}>
          <input
            className="input"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <div className="segmented">
            {(["", "published", "draft"] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={`segmented-btn ${publishedFilter === v ? "active" : ""}`}
                onClick={() => setPublishedFilter(v)}
              >
                {v === "" ? "Todos" : v === "published" ? "Publicados" : "Borradores"}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="subtitle">Cargando...</p>
      ) : (
        <div className="panel" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Duración</th>
                <th>Obstáculos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {levels
                .filter((l) => l.name.toLowerCase().includes(search.trim().toLowerCase()))
                .filter((l) => (publishedFilter === "" ? true : publishedFilter === "published" ? l.published : !l.published))
                .map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 700 }}>{l.name}</td>
                  <td>
                    <span className={`badge ${l.published ? "badge-ok" : "badge-draft"}`}>{l.published ? "Publicado" : "Borrador"}</span>
                  </td>
                  <td style={{ color: "var(--geo-text-dim)" }}>{l.durationSec}s</td>
                  <td style={{ color: "var(--geo-text-dim)" }}>{l.obstacles.length}</td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{ display: "inline-flex", gap: 6 }}>
                      <button
                        className={`btn ${l.published ? "btn-secondary" : "btn-primary"}`}
                        style={{ width: "auto" }}
                        onClick={() => onTogglePublish(l)}
                      >
                        {l.published ? "⬇️ Despublicar" : "🚀 Subir proyecto"}
                      </button>
                      <button className="btn btn-secondary" style={{ width: "auto" }} onClick={() => setEditing(l)}>
                        Editar
                      </button>
                      {confirmingDelete === l.id ? (
                        <>
                          <button className="btn btn-danger" style={{ width: "auto" }} onClick={() => onDelete(l.id)}>
                            Sí, eliminar
                          </button>
                          <button className="btn btn-secondary" style={{ width: "auto" }} onClick={() => setConfirmingDelete(null)}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-danger" style={{ width: "auto" }} onClick={() => setConfirmingDelete(l.id)}>
                          🗑️
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
              {levels.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                    Todavía no hay pistas personalizadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
