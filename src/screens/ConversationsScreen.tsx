import { useEffect, useState } from "react";
import { api, type ChatMessage } from "../api/client";
import { formatDate } from "../utils/format";

const PAGE_SIZE = 50;

export default function ConversationsScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.chatMessages({ search: search || undefined, page }).then(({ body }) => {
        setMessages(body.messages || []);
        setTotal(body.total || 0);
        setLoading(false);
      });
    }, 250); // debounce de busqueda
    return () => clearTimeout(t);
  }, [search, page]);

  // Buscar de nuevo siempre arranca en la pagina 1 (si no, se puede quedar
  // pidiendo una pagina que ya no existe con menos resultados).
  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="title">Conversaciones</h1>
      <p className="subtitle">Mensajes de chat de todas las salas. Busca una palabra para encontrar quién la escribió.</p>

      <div className="row" style={{ marginBottom: 16 }}>
        <input
          className="input"
          placeholder="Buscar palabra en los mensajes..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ minWidth: 280 }}
        />
      </div>

      <div className="panel" style={{ overflowX: "auto" }}>
        {loading ? (
          <p className="subtitle">Cargando...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha/hora</th>
                <th>Sala</th>
                <th>Usuario</th>
                <th>Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id}>
                  <td style={{ color: "var(--geo-text-dim)", whiteSpace: "nowrap" }}>{formatDate(m.createdAt)}</td>
                  <td style={{ fontFamily: "monospace" }}>{m.roomCode}</td>
                  <td style={{ fontWeight: 700 }}>{m.username}</td>
                  <td>{m.text}</td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                    {search ? "Sin resultados para esa búsqueda." : "Todavía no hay mensajes registrados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </button>
          <span style={{ color: "var(--geo-text-dim)", fontSize: 13, alignSelf: "center" }}>
            Página {page} de {totalPages}
          </span>
          <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
