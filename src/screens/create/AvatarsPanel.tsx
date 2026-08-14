import { useEffect, useRef, useState } from "react";
import { api, UPLOAD_ERROR_MESSAGES, type CustomAvatar } from "../../api/client";

export default function AvatarsPanel() {
  const [avatars, setAvatars] = useState<CustomAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"" | "published" | "draft">("");

  function load() {
    setLoading(true);
    api.listCustomAvatars().then(({ body }) => {
      setAvatars(body.avatars || []);
      setLoading(false);
    });
  }
  useEffect(load, []);

  async function onFilePicked(file: File) {
    if (!name.trim()) {
      setError("Ponle un nombre antes de subir la imagen.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const uploadRes = await api.uploadFile(file, "avatar");
      if (!uploadRes.body.url) {
        setError(UPLOAD_ERROR_MESSAGES[uploadRes.body.error || ""] || "No se pudo subir la imagen.");
        return;
      }
      const { status, body } = await api.createCustomAvatar({ name: name.trim(), imageUrl: uploadRes.body.url });
      if (status !== 201) {
        setError("No se pudo guardar el avatar.");
        return;
      }
      setName("");
      load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onDelete(id: string) {
    await api.deleteCustomAvatar(id);
    load();
  }

  async function onTogglePublish(a: CustomAvatar) {
    await api.publishCustomAvatar(a.id, !a.published);
    load();
  }

  return (
    <div>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginTop: 0 }}>
          Nuevo avatar (cubo)
        </div>
        <p className="subtitle" style={{ margin: "0 0 12px" }}>
          Sube una imagen cuadrada — se recorta al centro sobre el cubo del jugador, igual que las caras integradas.
          Queda en borrador hasta que le des "Subir proyecto" en su tarjeta.
        </p>
        <div className="row" style={{ marginBottom: 10 }}>
          <input
            className="input"
            placeholder="Nombre del avatar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            style={{ minWidth: 240 }}
          />
        </div>
        <label className="upload-dropzone" style={{ display: "block" }}>
          {uploading ? "Subiendo..." : "Click para elegir una imagen (PNG/JPG)"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFilePicked(file);
            }}
          />
        </label>
        {!!error && <p className="error-text">{error}</p>}
      </div>

      {avatars.length > 0 && (
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
      ) : avatars.length === 0 ? (
        <p className="subtitle">Todavía no hay avatares personalizados.</p>
      ) : (
        <div className="thumb-grid">
          {avatars
            .filter((a) => a.name.toLowerCase().includes(search.trim().toLowerCase()))
            .filter((a) => (publishedFilter === "" ? true : publishedFilter === "published" ? a.published : !a.published))
            .map((a) => (
            <div className="thumb-card" key={a.id}>
              <button className="thumb-card-delete" onClick={() => onDelete(a.id)} title="Eliminar">
                ✕
              </button>
              <img src={a.imageUrl} alt={a.name} />
              <div className="thumb-card-name">{a.name}</div>
              <div style={{ margin: "4px 0" }}>
                <span className={`badge ${a.published ? "badge-ok" : "badge-draft"}`}>{a.published ? "Publicado" : "Borrador"}</span>
              </div>
              <button
                className={`btn ${a.published ? "btn-secondary" : "btn-primary"}`}
                style={{ width: "100%", fontSize: 11, padding: "6px 8px" }}
                onClick={() => onTogglePublish(a)}
              >
                {a.published ? "⬇️ Despublicar" : "🚀 Subir proyecto"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
