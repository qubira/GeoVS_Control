import { useEffect, useState } from "react";
import { api, type ChatMessage, type BlockReason, MODERATION_ERROR_MESSAGES } from "../api/client";
import { formatDate } from "../utils/format";

const PAGE_SIZE = 50;

export default function ConversationsScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [onlyAccounts, setOnlyAccounts] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [reasons, setReasons] = useState<BlockReason[]>([]);
  const [reasonId, setReasonId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<"block" | "warn" | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionNote, setActionNote] = useState("");

  useEffect(() => {
    api.blockReasons().then(({ body }) => {
      const list = body.reasons || [];
      setReasons(list);
      if (list.length) setReasonId((prev) => prev || list[0].id);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api
        .chatMessages({
          search: search || undefined,
          roomCode: roomCode || undefined,
          onlyAccounts: onlyAccounts || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page,
        })
        .then(({ body }) => {
          setMessages(body.messages || []);
          setTotal(body.total || 0);
          setLoading(false);
        });
    }, 250); // debounce de busqueda
    return () => clearTimeout(t);
  }, [search, roomCode, onlyAccounts, dateFrom, dateTo, page]);

  // Cualquier cambio de filtro arranca de nuevo en la pagina 1 (si no, se
  // puede quedar pidiendo una pagina que ya no existe con menos resultados).
  function resetToFirstPage() {
    setPage(1);
    setSelected(new Set());
    setConfirmAction(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Solo los mensajes de una cuenta real se pueden bloquear/alertar — una
  // sesion anonima (userId null, ver Room.js) no tiene a quien bloquear.
  const selectableIds = messages.filter((m) => m.userId).map((m) => m.id);
  const allVisibleSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirmAction(null);
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        selectableIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...selectableIds]);
    });
    setConfirmAction(null);
  }

  // De las filas seleccionadas (pueden ser varios mensajes de la misma
  // cuenta) se saca el conjunto de cuentas distintas — eso es lo que
  // realmente se bloquea/alerta.
  const selectedMessages = messages.filter((m) => selected.has(m.id));
  const selectedUserIds = [...new Set(selectedMessages.map((m) => m.userId).filter((id): id is string => !!id))];
  // Si la seleccion es exactamente un mensaje, se guarda como el mensaje que
  // origino la accion (queda en el historial); con varias filas seleccionadas
  // no hay un unico mensaje al que anclar el motivo.
  const singleMessageId = selectedMessages.length === 1 ? selectedMessages[0].id : undefined;

  async function onConfirmBlock() {
    setBusy(true);
    setActionError("");
    setActionNote("");
    const failures: string[] = [];
    for (const userId of selectedUserIds) {
      const { body } = await api.blockAccount({ userId, reasonId, messageId: singleMessageId });
      if (!body.ok) failures.push(body.error || "ERROR");
    }
    setBusy(false);
    setSelected(new Set());
    setConfirmAction(null);
    if (failures.length) {
      setActionError(MODERATION_ERROR_MESSAGES[failures[0]] || "No se pudo bloquear alguna de las cuentas.");
    } else {
      setActionNote(`${selectedUserIds.length === 1 ? "Cuenta bloqueada" : `${selectedUserIds.length} cuentas bloqueadas`}.`);
    }
  }

  async function onConfirmWarn() {
    setBusy(true);
    setActionError("");
    setActionNote("");
    const { body } = await api.warnAccounts({ userIds: selectedUserIds, reasonId, messageId: singleMessageId });
    setBusy(false);
    setSelected(new Set());
    setConfirmAction(null);
    if (!body.ok) {
      setActionError(MODERATION_ERROR_MESSAGES[body.error || ""] || "No se pudo mandar la alerta.");
      return;
    }
    const warnedCount = body.warned?.length || 0;
    const blockedInstead = body.blockedInstead || [];
    if (blockedInstead.length) {
      setActionNote(
        `${warnedCount} alerta(s) enviada(s). ${blockedInstead.length} cuenta(s) ya tienen 3 alertas — hay que bloquearlas en vez de alertar de nuevo.`
      );
    } else {
      setActionNote(`${warnedCount} alerta(s) enviada(s).`);
    }
  }

  return (
    <div>
      <h1 className="title">Conversaciones</h1>
      <p className="subtitle">Mensajes de chat de todas las salas. Busca una palabra para encontrar quién la escribió.</p>

      <div className="row" style={{ marginBottom: 8, alignItems: "center" }}>
        <input
          className="input"
          placeholder="Buscar palabra en los mensajes..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetToFirstPage();
          }}
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
              Sala
            </div>
            <input
              className="input"
              style={{ marginBottom: 0, width: 140 }}
              placeholder="Código de sala"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value);
                resetToFirstPage();
              }}
            />
          </div>
          <div>
            <div className="label" style={{ marginTop: 0 }}>
              Desde
            </div>
            <input
              className="input"
              type="date"
              style={{ marginBottom: 0 }}
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                resetToFirstPage();
              }}
            />
          </div>
          <div>
            <div className="label" style={{ marginTop: 0 }}>
              Hasta
            </div>
            <input
              className="input"
              type="date"
              style={{ marginBottom: 0 }}
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                resetToFirstPage();
              }}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--geo-text-dim)", paddingBottom: 8 }}>
            <input
              type="checkbox"
              checked={onlyAccounts}
              onChange={(e) => {
                setOnlyAccounts(e.target.checked);
                resetToFirstPage();
              }}
            />
            Solo cuentas registradas (sin sesiones anónimas)
          </label>
        </div>
      )}

      {selectedUserIds.length > 0 && (
        <div className="panel" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "var(--geo-text-dim)" }}>
            {selectedUserIds.length} cuenta{selectedUserIds.length === 1 ? "" : "s"} seleccionada{selectedUserIds.length === 1 ? "" : "s"}
          </span>

          {confirmAction ? (
            <>
              <span style={{ fontSize: 13 }}>
                ¿Confirmas {confirmAction === "block" ? "bloquear" : "alertar a"} {selectedUserIds.length} cuenta
                {selectedUserIds.length === 1 ? "" : "s"} por "{reasons.find((r) => r.id === reasonId)?.label}"?
              </span>
              <button
                className={confirmAction === "block" ? "btn-danger" : "btn-secondary"}
                disabled={busy}
                onClick={confirmAction === "block" ? onConfirmBlock : onConfirmWarn}
              >
                Sí, confirmar
              </button>
              <button className="btn-ghost" disabled={busy} onClick={() => setConfirmAction(null)}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <select className="input" style={{ marginBottom: 0, width: "auto" }} value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
                {reasons.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button className="btn-danger" disabled={busy || !reasonId} onClick={() => setConfirmAction("block")}>
                🚫 Bloquear seleccionados
              </button>
              <button className="btn-secondary" disabled={busy || !reasonId} onClick={() => setConfirmAction("warn")}>
                ⚠️ Enviar alerta a seleccionados
              </button>
            </>
          )}
        </div>
      )}
      {!!actionError && <p className="error-text">{actionError}</p>}
      {!!actionNote && <p className="subtitle" style={{ color: "var(--geo-cyan)" }}>{actionNote}</p>}

      <div className="panel" style={{ overflowX: "auto" }}>
        {loading ? (
          <p className="subtitle">Cargando...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}>
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} disabled={selectableIds.length === 0} />
                </th>
                <th>Fecha/hora</th>
                <th>Sala</th>
                <th>Usuario</th>
                <th>Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id}>
                  <td>
                    <input type="checkbox" checked={selected.has(m.id)} disabled={!m.userId} onChange={() => toggleRow(m.id)} />
                  </td>
                  <td style={{ color: "var(--geo-text-dim)", whiteSpace: "nowrap" }}>{formatDate(m.createdAt)}</td>
                  <td style={{ fontFamily: "monospace" }}>{m.roomCode}</td>
                  <td style={{ fontWeight: 700 }}>
                    {m.username}
                    {m.warningCount !== null && m.warningCount > 0 && (
                      <span
                        title="Alertas ya enviadas a esta cuenta"
                        style={{
                          marginLeft: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 8,
                          background: m.warningCount >= 3 ? "#7d2e2e" : "rgba(255,255,255,0.1)",
                          color: m.warningCount >= 3 ? "#fff" : "var(--geo-text-dim)",
                        }}
                      >
                        {m.warningCount}/3 alertas
                      </span>
                    )}
                  </td>
                  <td>{m.text}</td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                    {search || roomCode || dateFrom || dateTo || onlyAccounts ? "Sin resultados para ese filtro." : "Todavía no hay mensajes registrados."}
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
