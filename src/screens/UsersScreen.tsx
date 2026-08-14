import { useEffect, useState } from "react";
import { api, type Account } from "../api/client";
import RoleBadge from "../components/RoleBadge";
import RoleSelect from "../components/RoleSelect";
import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";
import UserHistoryModal from "../components/UserHistoryModal";
import { formatDate } from "../utils/format";

export default function UsersScreen() {
  const [users, setUsers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [blockedFilter, setBlockedFilter] = useState<"" | "true" | "false">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Account | null>(null);

  async function refresh() {
    setLoading(true);
    const { body } = await api.listUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      blocked: blockedFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    setUsers(body.users || []);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(refresh, 250); // debounce de busqueda
    return () => clearTimeout(t);
  }, [search, roleFilter, blockedFilter, dateFrom, dateTo]);

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 18 }}>
        <div>
          <h1 className="title">Cuentas</h1>
          <p className="subtitle" style={{ margin: 0 }}>
            {users.length} cuenta{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Nueva cuenta
        </button>
      </div>

      <div className="row" style={{ marginBottom: 8 }}>
        <input
          className="input"
          placeholder="Buscar por usuario o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <div style={{ width: 200 }}>
          <RoleSelect value={roleFilter} onChange={setRoleFilter} allowAll />
        </div>
        <button type="button" className="btn-ghost" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? "▲ Ocultar filtro avanzado" : "▼ Filtro avanzado"}
        </button>
      </div>

      {showAdvanced && (
        <div className="panel" style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div className="label" style={{ marginTop: 0 }}>
              Estado
            </div>
            <select
              className="input"
              style={{ marginBottom: 0, width: 160 }}
              value={blockedFilter}
              onChange={(e) => setBlockedFilter(e.target.value as "" | "true" | "false")}
            >
              <option value="">Todas</option>
              <option value="false">Activas</option>
              <option value="true">Bloqueadas</option>
            </select>
          </div>
          <div>
            <div className="label" style={{ marginTop: 0 }}>
              Creada desde
            </div>
            <input className="input" type="date" style={{ marginBottom: 0 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <div className="label" style={{ marginTop: 0 }}>
              Creada hasta
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
                <th>Correo</th>
                <th>Edad</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Última IP</th>
                <th>Creada</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700 }}>{u.username}</td>
                  <td style={{ color: "var(--geo-text-dim)" }}>{u.email}</td>
                  <td>{u.age}</td>
                  <td>
                    <RoleBadge role={u.role} />
                  </td>
                  <td>
                    <span className={`badge ${u.blocked ? "badge-blocked" : "badge-ok"}`}>{u.blocked ? "Bloqueada" : "Activa"}</span>
                  </td>
                  <td style={{ fontFamily: "monospace", color: "var(--geo-text-dim)" }} title={u.lastIpAt ? formatDate(u.lastIpAt) : undefined}>
                    {u.lastIp || "—"}
                  </td>
                  <td style={{ color: "var(--geo-text-dim)" }}>{formatDate(u.createdAt)}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: "6px 12px" }} onClick={() => setEditing(u)}>
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--geo-text-dim)", padding: 24 }}>
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={refresh} />}
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={refresh}
          onDeleted={refresh}
          onViewHistory={() => {
            setViewingHistory(editing);
            setEditing(null);
          }}
        />
      )}
      {viewingHistory && <UserHistoryModal user={viewingHistory} onClose={() => setViewingHistory(null)} />}
    </div>
  );
}
