import { useEffect, useRef, useState } from "react";
import { api, type CustomObjectType, type PhysicsType } from "../../api/client";

const PHYSICS_LABELS: { value: PhysicsType; label: string }[] = [
  { value: "spike", label: "Triángulo" },
  { value: "block", label: "Rectángulo" },
  { value: "platform", label: "Plataforma" },
];

export default function ObjectTypesPanel() {
  const [objectTypes, setObjectTypes] = useState<CustomObjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [physicsType, setPhysicsType] = useState<PhysicsType>("spike");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    api.listCustomObjectTypes().then(({ body }) => {
      setObjectTypes(body.objectTypes || []);
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
      const uploadRes = await api.uploadFile(file, "object");
      if (!uploadRes.body.url) {
        setError("No se pudo subir la imagen.");
        return;
      }
      const { status } = await api.createCustomObjectType({ name: name.trim(), imageUrl: uploadRes.body.url, physicsType });
      if (status !== 201) {
        setError("No se pudo guardar el objeto.");
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
    await api.deleteCustomObjectType(id);
    load();
  }

  return (
    <div>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginTop: 0 }}>
          Nuevo objeto
        </div>
        <p className="subtitle" style={{ margin: "0 0 12px" }}>
          El tipo elegido determina cómo colisiona en el juego (el triángulo mata, el rectángulo mata salvo que se le
          aterrice encima, la plataforma es segura y atravesable por los lados) — la imagen es solo el aspecto visual.
        </p>
        <div className="row" style={{ marginBottom: 10 }}>
          <input
            className="input"
            placeholder="Nombre del objeto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            style={{ minWidth: 220 }}
          />
          <div className="segmented">
            {PHYSICS_LABELS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`segmented-btn ${physicsType === p.value ? "active" : ""}`}
                onClick={() => setPhysicsType(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
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
      ) : objectTypes.length === 0 ? (
        <p className="subtitle">Todavía no hay objetos personalizados.</p>
      ) : (
        <div className="thumb-grid">
          {objectTypes.map((o) => (
            <div className="thumb-card" key={o.id}>
              <button className="thumb-card-delete" onClick={() => onDelete(o.id)} title="Eliminar">
                ✕
              </button>
              <img src={o.imageUrl} alt={o.name} />
              <div className="thumb-card-name">{o.name}</div>
              <div className="thumb-card-name" style={{ color: "var(--geo-text-dim)", fontSize: 10 }}>
                {PHYSICS_LABELS.find((p) => p.value === o.physicsType)?.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
