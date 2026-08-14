import { useEffect, useState } from "react";
import { api, type AccountBlock } from "../api/client";
import { formatDate } from "../utils/format";

export default function BlockedAccountsScreen() {
  const [blocks, setBlocks] = useState<AccountBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function load() {
    setLoading(true);
    api.accountBlocks({ search: search || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }).then(({ body }) => {
      setBlocks(body.blocks || []);
      setLoading(false);
    });
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search, dateFrom, dateTo]);

  async function handleUnblock(id: string) {
    await api.unblockAccount(id);
    setConfirmId(null);
    load();
  }

  return (
    <div>
      <h1 className="title">Cuentas bloqueadas</h1>
      <p className="subtitle">Cuentas bloqueadas desde Conversaciones, con el motivo, quién bloqueó y el mensaje que lo originó.</p>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{blocks.length}</div>
          <div className="stat-label">Bloqueadas ahora</div>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 8 }}>
        <input
          className="input"
          placeholder="Buscar por usuario, motivo o mensaje..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 280 }}
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
                <th>Usuario</th>
                <th>Motivo</th>
                <th>Mensaje</th>
                <th>Bloqueado por</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 700 }}>{b.username || b.userId}</td>
                  <td>{b.reasonLabel}</td>
                  <td style={{ color: "var(--geo-text-dim)", maxWidth: 280 }}>{b.messageText || "—"}</td>
                  <td>{b.blockedByName}</td>
                  <td style={{ color: "var(--geo-text-dim)", whiteSpace: "nowrap" }}>{formatDate(b.createdAt)}</td>
                  <td style={{ textAlign: "right" }}>
                    {confirmId === b.id ? (
                      <span style={{ display: "inline-flex", gap: 6 }}>
                        <button className="btn-secondary" onClick={() => handleUnblock(b.id)}>
                          Sí, desbloquear
                        </button>
                        <button className="btn-ghost" onClick={() => setConfirmId(null)}>
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <button className="btn-ghost" onClick={() => setConfirmId(b.id)}>
                        🔓 Desbloquear
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {blocks.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                    {search || dateFrom || dateTo ? "Sin resultados para ese filtro." : "No hay cuentas bloqueadas."}
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
