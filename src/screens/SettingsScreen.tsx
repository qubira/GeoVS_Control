import { useEffect, useState } from "react";
import { api, type BlockReason, MODERATION_ERROR_MESSAGES } from "../api/client";

export default function SettingsScreen() {
  const [reasons, setReasons] = useState<BlockReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    api.blockReasons().then(({ body }) => {
      setReasons(body.reasons || []);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    setBusy(true);
    setError("");
    const { body } = await api.createBlockReason(label);
    setBusy(false);
    if (!body.ok) {
      setError(MODERATION_ERROR_MESSAGES[body.error || ""] || "No se pudo agregar el motivo.");
      return;
    }
    setNewLabel("");
    load();
  }

  async function onDelete(id: string) {
    setError("");
    const { body } = await api.deleteBlockReason(id);
    if (!body.ok) {
      setError(MODERATION_ERROR_MESSAGES[body.error || ""] || "No se pudo borrar el motivo.");
      return;
    }
    load();
  }

  return (
    <div>
      <h1 className="title">Configuración</h1>
      <p className="subtitle">Motivos de bloqueo/alerta disponibles al moderar desde Conversaciones.</p>

      <form onSubmit={onAdd} className="row" style={{ marginBottom: 16, flexWrap: "nowrap" }}>
        <input
          className="input"
          style={{ marginBottom: 0, flex: 1 }}
          placeholder="Nuevo motivo (ej. Spam)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          maxLength={60}
        />
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "auto" }}>
          Agregar
        </button>
      </form>
      {!!error && <p className="error-text">{error}</p>}

      <div className="row" style={{ marginBottom: 16 }}>
        <input
          className="input"
          placeholder="Buscar motivo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 240 }}
        />
      </div>

      <div className="panel" style={{ overflowX: "auto" }}>
        {loading ? (
          <p className="subtitle">Cargando...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Motivo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reasons
                .filter((r) => r.label.toLowerCase().includes(search.trim().toLowerCase()))
                .map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700 }}>{r.label}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn-ghost" onClick={() => onDelete(r.id)}>
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              {reasons.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                    Todavía no hay motivos configurados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
