import { useEffect, useRef, useState } from "react";
import { api, type CustomAvatar } from "../../api/client";

export default function AvatarsPanel() {
  const [avatars, setAvatars] = useState<CustomAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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
        setError("No se pudo subir la imagen.");
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

  return (
    <div>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginTop: 0 }}>
          Nuevo avatar (cubo)
        </div>
        <p className="subtitle" style={{ margin: "0 0 12px" }}>
          Sube una imagen cuadrada — se recorta al centro sobre el cubo del jugador, igual que las caras integradas.
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

      {loading ? (
        <p className="subtitle">Cargando...</p>
      ) : avatars.length === 0 ? (
        <p className="subtitle">Todavía no hay avatares personalizados.</p>
      ) : (
        <div className="thumb-grid">
          {avatars.map((a) => (
            <div className="thumb-card" key={a.id}>
              <button className="thumb-card-delete" onClick={() => onDelete(a.id)} title="Eliminar">
                ✕
              </button>
              <img src={a.imageUrl} alt={a.name} />
              <div className="thumb-card-name">{a.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
