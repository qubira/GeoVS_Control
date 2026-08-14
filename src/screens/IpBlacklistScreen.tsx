import { Fragment, useEffect, useState } from "react";
import { api, type IpBlock, type IpAccount, MODERATION_ERROR_MESSAGES } from "../api/client";
import { formatDate } from "../utils/format";

export default function IpBlacklistScreen() {
  const [blocks, setBlocks] = useState<IpBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIp, setExpandedIp] = useState<string | null>(null);
  const [accountsByIp, setAccountsByIp] = useState<Record<string, IpAccount[]>>({});

  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    api.ipBlocks().then(({ body }) => {
      setBlocks(body.blocks || []);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const ip = newIp.trim();
    const reason = newReason.trim();
    if (!ip || !reason) return;
    setBusy(true);
    setError("");
    const { body } = await api.createIpBlock({ ip, reason });
    setBusy(false);
    if (!body.ok) {
      setError(MODERATION_ERROR_MESSAGES[body.error || ""] || "No se pudo bloquear la IP.");
      return;
    }
    setNewIp("");
    setNewReason("");
    load();
  }

  async function onDelete(id: string) {
    await api.deleteIpBlock(id);
    load();
  }

  async function toggleExpand(ip: string) {
    if (expandedIp === ip) {
      setExpandedIp(null);
      return;
    }
    setExpandedIp(ip);
    if (!accountsByIp[ip]) {
      const { body } = await api.ipBlockAccounts(ip);
      setAccountsByIp((prev) => ({ ...prev, [ip]: body.accounts || [] }));
    }
  }

  return (
    <div>
      <h1 className="title">Lista negra de IP</h1>
      <p className="subtitle">
        IPs bloqueadas — no se puede loguear, registrar ni conectar al juego desde ellas. Se agregan solas cuando una segunda cuenta
        bloqueada reincide desde una IP donde ya hubo otra cuenta bloqueada.
      </p>

      <form onSubmit={onAdd} className="row" style={{ marginBottom: 16, flexWrap: "nowrap" }}>
        <input className="input" style={{ marginBottom: 0, width: 220 }} placeholder="IP a bloquear" value={newIp} onChange={(e) => setNewIp(e.target.value)} />
        <input className="input" style={{ marginBottom: 0, flex: 1 }} placeholder="Motivo" value={newReason} onChange={(e) => setNewReason(e.target.value)} />
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "auto" }}>
          Bloquear IP
        </button>
      </form>
      {!!error && <p className="error-text">{error}</p>}

      <div className="panel" style={{ overflowX: "auto" }}>
        {loading ? (
          <p className="subtitle">Cargando...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>IP</th>
                <th>Motivo</th>
                <th>Bloqueado por</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <Fragment key={b.id}>
                  <tr>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{b.ip}</td>
                    <td>{b.reason}</td>
                    <td>{b.blockedBy ? b.blockedBy : "Automático"}</td>
                    <td style={{ color: "var(--geo-text-dim)", whiteSpace: "nowrap" }}>{formatDate(b.createdAt)}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn-ghost" onClick={() => toggleExpand(b.ip)}>
                        {expandedIp === b.ip ? "▲ Ocultar" : "▼ Ver cuentas"}
                      </button>
                      <button className="btn-ghost" onClick={() => onDelete(b.id)}>
                        🔓 Desbloquear
                      </button>
                    </td>
                  </tr>
                  {expandedIp === b.ip && (
                    <tr>
                      <td colSpan={5} style={{ background: "rgba(255,255,255,0.03)" }}>
                        {!accountsByIp[b.ip] ? (
                          <span className="subtitle">Cargando cuentas...</span>
                        ) : accountsByIp[b.ip].length === 0 ? (
                          <span className="subtitle">No hay cuentas registradas desde esta IP.</span>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 0" }}>
                            {accountsByIp[b.ip].map((acc) => (
                              <span
                                key={acc.id}
                                style={{
                                  fontSize: 12,
                                  padding: "4px 10px",
                                  borderRadius: 10,
                                  background: acc.blocked ? "#7d2e2e" : "rgba(255,255,255,0.08)",
                                }}
                              >
                                {acc.username} {acc.blocked ? "(bloqueada)" : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {blocks.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                    No hay IPs bloqueadas.
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
