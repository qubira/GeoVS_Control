import { useEffect, useState } from "react";
import { api, type Comment } from "../api/client";
import { formatDate } from "../utils/format";

export default function FeedbackScreen() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [readFilter, setReadFilter] = useState<"" | "true" | "false">("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api.feedback({ search: search || undefined, read: readFilter || undefined }).then(({ body }) => {
      setComments(body.comments || []);
      setUnreadCount(body.unreadCount || 0);
      setLoading(false);
    });
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search, readFilter]);

  async function onToggleRead(c: Comment) {
    await api.markFeedbackRead(c.id, !c.read);
    load();
  }

  async function onDelete(id: string) {
    await api.deleteFeedback(id);
    setConfirmDeleteId(null);
    load();
  }

  return (
    <div>
      <h1 className="title">Bandeja de comentarios</h1>
      <p className="subtitle">Sugerencias y comentarios que los jugadores dejan desde su perfil en el juego.</p>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{unreadCount}</div>
          <div className="stat-label">Sin leer</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{comments.length}</div>
          <div className="stat-label">{readFilter || search ? "Coinciden con el filtro" : "Total"}</div>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 16 }}>
        <input
          className="input"
          placeholder="Buscar por usuario o texto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <div className="segmented">
          {(["", "false", "true"] as const).map((v) => (
            <button key={v} type="button" className={`segmented-btn ${readFilter === v ? "active" : ""}`} onClick={() => setReadFilter(v)}>
              {v === "" ? "Todos" : v === "false" ? "Sin leer" : "Leídos"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="subtitle">Cargando...</p>
      ) : comments.length === 0 ? (
        <p className="subtitle">{search || readFilter ? "Sin resultados para ese filtro." : "Todavía no hay comentarios."}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {comments.map((c) => (
            <div
              key={c.id}
              className="panel"
              style={{ borderLeft: c.read ? undefined : "3px solid var(--geo-cyan)" }}
            >
              <div className="row-between" style={{ marginBottom: 6 }}>
                <div>
                  <strong>{c.username}</strong>
                  <span style={{ marginLeft: 8, fontSize: 11, color: "var(--geo-text-dim)" }}>{formatDate(c.createdAt)}</span>
                  {!c.read && (
                    <span className="badge" style={{ marginLeft: 8, background: "rgba(34,211,238,0.2)", color: "var(--geo-cyan)" }}>
                      Nuevo
                    </span>
                  )}
                </div>
                <span style={{ display: "inline-flex", gap: 6 }}>
                  <button className="btn-ghost" onClick={() => onToggleRead(c)}>
                    {c.read ? "Marcar sin leer" : "✓ Marcar leído"}
                  </button>
                  {confirmDeleteId === c.id ? (
                    <>
                      <button className="btn-danger" onClick={() => onDelete(c.id)}>
                        Sí, eliminar
                      </button>
                      <button className="btn-ghost" onClick={() => setConfirmDeleteId(null)}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button className="btn-ghost" onClick={() => setConfirmDeleteId(c.id)}>
                      🗑️
                    </button>
                  )}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, whiteSpace: "pre-wrap" }}>{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
