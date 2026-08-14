import { useEffect, useState } from "react";
import { api, type WaitlistEntry } from "../api/client";
import { useAuth } from "../state/AuthContext";
import { formatDate } from "../utils/format";

export default function WaitlistScreen() {
  const { account } = useAuth();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function load() {
    setLoading(true);
    api.waitlist({ search: search || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }).then(({ body }) => {
      setEntries(body.entries || []);
      setLoading(false);
    });
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search, dateFrom, dateTo]);

  async function handleDelete(id: string) {
    await api.deleteWaitlistEntry(id);
    setConfirmId(null);
    load();
  }

  return (
    <div>
      <h1 className="title">Lista de espera</h1>
      <p className="subtitle">Personas que se inscribieron en el formulario de la página de aterrizaje (no son cuentas del juego).</p>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{entries.length}</div>
          <div className="stat-label">Inscritos</div>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 8 }}>
        <input
          className="input"
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <button type="button" className="btn-ghost" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? "▲ Ocultar filtro avanzado" : "▼ Filtro avanzado"}
        </button>
      </div>

      {showAdvanced && (
        <div className="panel" style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div className="label" style={{ marginTop: 0 }}>
              Desde
            </div>
            <input className="input" type="date" style={{ marginBottom: 0 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <div className="label" style={{ marginTop: 0 }}>
              Hasta
            </div>
            <input className="input" type="date" style={{ marginBottom: 0 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      )}

      <div className="panel" style={{ overflowX: "auto" }}>
        {loading ? (
          <p className="subtitle">Cargando...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Fecha</th>
                {account?.role === "admin" && <th></th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 700 }}>{e.name}</td>
                  <td style={{ color: "var(--geo-text-dim)" }}>{e.email}</td>
                  <td style={{ color: "var(--geo-text-dim)", whiteSpace: "nowrap" }}>{formatDate(e.createdAt)}</td>
                  {account?.role === "admin" && (
                    <td style={{ textAlign: "right" }}>
                      {confirmId === e.id ? (
                        <span style={{ display: "inline-flex", gap: 6 }}>
                          <button className="btn-danger" onClick={() => handleDelete(e.id)}>
                            Sí, eliminar
                          </button>
                          <button className="btn-ghost" onClick={() => setConfirmId(null)}>
                            Cancelar
                          </button>
                        </span>
                      ) : (
                        <button className="btn-ghost" onClick={() => setConfirmId(e.id)}>
                          🗑️ Eliminar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                    {search || dateFrom || dateTo ? "Sin resultados para ese filtro." : "Todavía sin inscritos."}
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
