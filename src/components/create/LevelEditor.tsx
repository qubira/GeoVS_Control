import { useMemo, useRef, useState, useEffect } from "react";
import { api, UPLOAD_ERROR_MESSAGES, LEVEL_ERROR_MESSAGES, type CustomLevel, type CustomObjectType, type LevelObstacle, type PhysicsType } from "../../api/client";
import WaveformCanvas from "./WaveformCanvas";

// Valores globales del juego (server/src/config.js), duplicados aca solo
// como referencia/placeholder para los sliders — el server siempre recalcula
// y valida lo que se guarda, esto es puramente para la UX del editor.
const DEFAULT_SPEED_X = 420;
const DEFAULT_JUMP_VELOCITY = -900;

const PHYSICS_LABELS: { value: PhysicsType; label: string; color: string }[] = [
  { value: "spike", label: "Triángulo", color: "#ff6b4a" },
  { value: "block", label: "Rectángulo", color: "#c084fc" },
  { value: "platform", label: "Plataforma", color: "#f7c948" },
];

const DEFAULT_SHAPE: Record<PhysicsType, { w: number; h: number; y: number }> = {
  spike: { w: 40, h: 40, y: 460 },
  block: { w: 40, h: 40, y: 460 },
  platform: { w: 100, h: 20, y: 340 },
};

const BASE_PX_PER_SECOND = 80; // escala visual del editor a zoom 1x, no tiene relacion con la fisica
const TIMELINE_VIEWPORT_HEIGHT = 320; // alto visible fijo del recuadro (con scroll si el contenido es mas alto)
const RULER_HEIGHT = 22;
const WAVEFORM_HEIGHT = 50;
const BASE_STRIP_HEIGHT = 220; // alto del carril de objetos a zoom 1x
const WORLD_HEIGHT_REF = 560; // GROUND_Y(500) + PLAYER_SIZE(40) + margen, mismo mundo que el juego real
const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2, 3];
const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900];

// Elige un intervalo de marcas "prolijo" (1s, 2s, 5s, 10s...) segun el zoom
// actual, para que las marcas de tiempo no queden ni amontonadas ni
// desperdiciando espacio sin importar que tan larga sea la pista.
function niceTickInterval(pxPerSecond: number): number {
  const targetPx = 90;
  const rawSec = targetPx / pxPerSecond;
  return TICK_STEPS.find((s) => s >= rawSec) ?? TICK_STEPS[TICK_STEPS.length - 1];
}
function formatMMSS(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface PaletteChoice {
  type: PhysicsType;
  imageUrl?: string;
  label: string;
  swatchColor?: string;
}

export default function LevelEditor({
  level,
  onClose,
  onSaved,
}: {
  level: CustomLevel | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !level;
  const [name, setName] = useState(level?.name || "");
  const [durationSec, setDurationSec] = useState(level?.durationSec || 30);
  const [speedX, setSpeedX] = useState<number | null>(level?.speedX ?? null);
  const [jumpVelocity, setJumpVelocity] = useState<number | null>(level?.jumpVelocity ?? null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(level?.backgroundImageUrl ?? null);
  const [backgroundScale, setBackgroundScale] = useState<number>(level?.backgroundScale ?? 1);
  const [musicUrl, setMusicUrl] = useState<string | null>(level?.musicUrl ?? null);
  const [musicStartSec, setMusicStartSec] = useState<number>(level?.musicStartSec ?? 0);
  const [musicEndSec, setMusicEndSec] = useState<number | null>(level?.musicEndSec ?? null);
  const [fullMusicDuration, setFullMusicDuration] = useState<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const [obstacles, setObstacles] = useState<LevelObstacle[]>(level?.obstacles || []);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tool, setTool] = useState<PaletteChoice>({ type: "spike", label: "Triángulo", swatchColor: "#ff6b4a" });
  const [objectTypes, setObjectTypes] = useState<CustomObjectType[]>([]);
  const [zoomIndex, setZoomIndex] = useState(2); // ZOOM_STEPS[2] = 1x
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listCustomObjectTypes().then(({ body }) => setObjectTypes(body.objectTypes || []));
  }, []);

  const effectiveSpeed = speedX ?? DEFAULT_SPEED_X;
  const length = Math.round(effectiveSpeed * durationSec);
  const zoom = ZOOM_STEPS[zoomIndex];
  const pxPerSecond = BASE_PX_PER_SECOND * zoom;
  const totalWidthPx = Math.max(400, durationSec * pxPerSecond);
  const stripContentHeight = BASE_STRIP_HEIGHT * zoom;
  const vScale = stripContentHeight / WORLD_HEIGHT_REF;

  const tickInterval = niceTickInterval(pxPerSecond);
  const ticks: number[] = [];
  for (let t = 0; t <= durationSec; t += tickInterval) ticks.push(t);

  function levelXToScreenX(x: number) {
    return (x / length) * totalWidthPx;
  }
  function screenXToLevelX(screenX: number) {
    return Math.round((screenX / totalWidthPx) * length);
  }

  const paletteChoices: PaletteChoice[] = useMemo(() => {
    const defaults = PHYSICS_LABELS.map((p) => ({ type: p.value, label: p.label, swatchColor: p.color }));
    const customs = objectTypes.map((o) => ({ type: o.physicsType, label: o.name, imageUrl: o.imageUrl }));
    return [...defaults, ...customs];
  }, [objectTypes]);

  function confirmReflowIfNeeded(): boolean {
    if (obstacles.length === 0) return true;
    return window.confirm(
      "Ya hay obstáculos colocados. Cambiar la duración o la velocidad puede desalinearlos de la música o dejarlos fuera de la pista. ¿Continuar?"
    );
  }

  // Dos objetos "se tocan" (comparten X e Y) si no hay ni un pixel de hueco
  // entre sus rectangulos — se pueden poner al lado, encima o debajo, pero
  // nunca uno arriba del otro en el mismo lugar.
  function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function onStripClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left + (stripRef.current?.scrollLeft || 0);
    const x = Math.max(0, Math.min(length, screenXToLevelX(screenX)));
    const shape = DEFAULT_SHAPE[tool.type];
    const newObstacle: LevelObstacle = { type: tool.type, x, y: shape.y, w: shape.w, h: shape.h, ...(tool.imageUrl ? { imageUrl: tool.imageUrl } : {}) };
    if (obstacles.some((o) => rectsOverlap(newObstacle, o))) {
      setError("Ya hay un objeto ahí — colócalo al lado, arriba o abajo, no superpuesto.");
      return;
    }
    setError("");
    setObstacles((prev) => [...prev, newObstacle]);
    setSelectedIndex(obstacles.length);
  }

  function updateSelected(patch: Partial<LevelObstacle>) {
    if (selectedIndex === null) return;
    const current = obstacles[selectedIndex];
    const updated = { ...current, ...patch };
    const overlapsOther = obstacles.some((o, i) => i !== selectedIndex && rectsOverlap(updated, o));
    if (overlapsOther) {
      setError("Ese cambio superpondría este objeto con otro — colócalo al lado, arriba o abajo.");
      return;
    }
    setError("");
    setObstacles((prev) => prev.map((o, i) => (i === selectedIndex ? updated : o)));
  }

  function deleteSelected() {
    if (selectedIndex === null) return;
    setObstacles((prev) => prev.filter((_, i) => i !== selectedIndex));
    setSelectedIndex(null);
  }

  // El reproductor de la tarjeta "Música" respeta el recorte: al escuchar,
  // arranca en el inicio elegido y, si llega al fin elegido, vuelve a
  // arrancar ahi mismo (mismo comportamiento que el juego real).
  useEffect(() => {
    const el = audioPreviewRef.current;
    if (!el) return;
    const onTimeUpdate = () => {
      if (musicEndSec != null && el.currentTime >= musicEndSec) el.currentTime = musicStartSec;
    };
    el.addEventListener("timeupdate", onTimeUpdate);
    return () => el.removeEventListener("timeupdate", onTimeUpdate);
  }, [musicStartSec, musicEndSec]);

  function previewMusicTrim() {
    const el = audioPreviewRef.current;
    if (!el) return;
    el.currentTime = musicStartSec;
    el.play().catch(() => {});
  }

  async function onUpload(file: File, kind: "background" | "music") {
    const setUploading = kind === "background" ? setUploadingBg : setUploadingMusic;
    setError("");
    setUploading(true);
    try {
      const { body } = await api.uploadFile(file, kind);
      if (!body.url) {
        setError(UPLOAD_ERROR_MESSAGES[body.error || ""] || "No se pudo subir el archivo.");
        return;
      }
      if (kind === "background") setBackgroundImageUrl(body.url);
      else {
        setMusicUrl(body.url);
        // Archivo nuevo: el recorte vuelve a cubrir todo (se reajusta solo
        // cuando WaveformCanvas informe la duracion real, ver mas abajo).
        setMusicStartSec(0);
        setMusicEndSec(null);
        setFullMusicDuration(null);
      }
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    setError("");
    if (!name.trim()) {
      setError("Ponle un nombre a la pista.");
      return;
    }
    if (obstacles.some((o) => o.x + o.w > length)) {
      setError("Algún obstáculo queda después del final de la pista — muévelo o alarga la duración.");
      return;
    }
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        durationSec,
        speedX,
        jumpVelocity,
        backgroundImageUrl,
        backgroundScale,
        musicUrl,
        musicStartSec,
        musicEndSec,
        obstacles,
      };
      const { status, body } = level ? await api.updateCustomLevel(level.id, input) : await api.createCustomLevel(input);
      if (status !== 200 && status !== 201) {
        setError(LEVEL_ERROR_MESSAGES[body.error || ""] || "No se pudo guardar la pista. Revisa los valores.");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const selected = selectedIndex !== null ? obstacles[selectedIndex] : null;

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <h2 className="font-display" style={{ fontSize: 18, margin: 0 }}>
          {isNew ? "Nueva pista" : `Editar — ${level!.name}`}
        </h2>
        <button className="btn btn-secondary" style={{ width: "auto" }} onClick={onClose}>
          ← Volver
        </button>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <div className="label" style={{ marginTop: 0 }}>
              Nombre
            </div>
            <input className="input" style={{ width: "100%" }} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </div>
          <div style={{ width: 140 }}>
            <div className="label" style={{ marginTop: 0 }}>
              Duración (s)
            </div>
            <input
              className="input"
              style={{ width: "100%" }}
              type="number"
              min={5}
              max={600}
              value={durationSec}
              onChange={(e) => {
                if (!confirmReflowIfNeeded()) return;
                setDurationSec(Math.max(5, Math.min(600, Number(e.target.value) || 5)));
              }}
            />
          </div>
          <div style={{ width: 160 }}>
            <div className="label" style={{ marginTop: 0 }}>
              Velocidad (px/s)
            </div>
            <input
              className="input"
              style={{ width: "100%" }}
              type="number"
              min={100}
              max={1200}
              placeholder={String(DEFAULT_SPEED_X)}
              value={speedX ?? ""}
              onChange={(e) => {
                if (!confirmReflowIfNeeded()) return;
                const v = e.target.value ? Number(e.target.value) : null;
                setSpeedX(v);
              }}
            />
          </div>
          <div style={{ width: 160 }}>
            <div className="label" style={{ marginTop: 0 }}>
              Fuerza de salto
            </div>
            <input
              className="input"
              style={{ width: "100%" }}
              type="number"
              min={-2000}
              max={-300}
              placeholder={String(DEFAULT_JUMP_VELOCITY)}
              value={jumpVelocity ?? ""}
              onChange={(e) => setJumpVelocity(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>
        <p className="subtitle" style={{ margin: "8px 0 0", fontSize: 11 }}>
          Deja velocidad/salto en blanco para usar los valores normales del juego. Largo de la pista calculado: {length}px.
        </p>
      </div>

      <div className="row" style={{ gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="panel" style={{ flex: 1, minWidth: 220 }}>
          <div className="label" style={{ marginTop: 0 }}>
            Fondo
          </div>
          {backgroundImageUrl && (
            <img src={backgroundImageUrl} alt="Fondo" style={{ width: "100%", height: 70, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
          )}
          <label className="upload-dropzone" style={{ display: "block" }}>
            {uploadingBg ? "Subiendo..." : backgroundImageUrl ? "Cambiar imagen" : "Subir imagen de fondo"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              disabled={uploadingBg}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f, "background");
              }}
            />
          </label>
          {backgroundImageUrl && (
            <div style={{ marginTop: 10 }}>
              <div className="row-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "var(--geo-text-dim)" }}>Tamaño del fondo</span>
                <span style={{ fontSize: 11, color: "var(--geo-text-dim)" }}>{Math.round(backgroundScale * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={4}
                step={0.1}
                value={backgroundScale}
                onChange={(e) => setBackgroundScale(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
          )}
        </div>

        <div className="panel" style={{ flex: 1, minWidth: 220 }}>
          <div className="label" style={{ marginTop: 0 }}>
            Música
          </div>
          {musicUrl && <audio ref={audioPreviewRef} src={musicUrl} controls style={{ width: "100%", marginBottom: 8, height: 32 }} />}
          <label className="upload-dropzone" style={{ display: "block" }}>
            {uploadingMusic ? "Subiendo..." : musicUrl ? "Cambiar música" : "Subir música (mp3/wav, hasta 25MB)"}
            <input
              type="file"
              accept="audio/*"
              style={{ display: "none" }}
              disabled={uploadingMusic}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f, "music");
              }}
            />
          </label>

          {musicUrl && (
            <div style={{ marginTop: 10 }}>
              <div className="row-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "var(--geo-text-dim)" }}>Recorte (qué parte de la canción se usa)</span>
                {fullMusicDuration != null && (
                  <span style={{ fontSize: 11, color: "var(--geo-text-dim)" }}>Duración total: {formatMMSS(fullMusicDuration)}</span>
                )}
              </div>

              <div style={{ position: "relative", width: "100%", overflow: "hidden", borderRadius: 6 }}>
                <WaveformCanvas
                  musicUrl={musicUrl}
                  width={420}
                  height={40}
                  onDurationDetected={(sec) => {
                    setFullMusicDuration(sec);
                    setMusicEndSec((prev) => (prev == null ? sec : prev));
                  }}
                />
                {fullMusicDuration != null && fullMusicDuration > 0 && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${(musicStartSec / fullMusicDuration) * 100}%`,
                        background: "rgba(10,11,30,0.75)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: `${(1 - (musicEndSec ?? fullMusicDuration) / fullMusicDuration) * 100}%`,
                        background: "rgba(10,11,30,0.75)",
                        pointerEvents: "none",
                      }}
                    />
                  </>
                )}
              </div>

              <div className="row" style={{ gap: 10, marginTop: 8, alignItems: "flex-end" }}>
                <label style={{ fontSize: 11, color: "var(--geo-text-dim)" }}>
                  Inicio (s)
                  <input
                    className="input"
                    type="number"
                    style={{ width: 90, display: "block" }}
                    min={0}
                    max={fullMusicDuration ?? undefined}
                    step={0.5}
                    value={musicStartSec}
                    onChange={(e) => setMusicStartSec(Math.max(0, Number(e.target.value) || 0))}
                  />
                </label>
                <label style={{ fontSize: 11, color: "var(--geo-text-dim)" }}>
                  Fin (s)
                  <input
                    className="input"
                    type="number"
                    style={{ width: 90, display: "block" }}
                    min={0}
                    max={fullMusicDuration ?? undefined}
                    step={0.5}
                    value={musicEndSec ?? ""}
                    placeholder={fullMusicDuration ? String(Math.round(fullMusicDuration)) : ""}
                    onChange={(e) => setMusicEndSec(e.target.value ? Number(e.target.value) : null)}
                  />
                </label>
                <button type="button" className="btn btn-secondary" style={{ width: "auto" }} onClick={previewMusicTrim}>
                  ▶ Escuchar recorte
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="label" style={{ marginTop: 0 }}>
          Paleta de objetos — elige uno y haz click en la pista para colocarlo
        </div>
        <div className="row" style={{ gap: 8, marginBottom: 12 }}>
          {paletteChoices.map((p, i) => (
            <button
              key={`${p.type}-${p.imageUrl || i}`}
              type="button"
              className={`palette-item ${tool.type === p.type && tool.imageUrl === p.imageUrl ? "active" : ""}`}
              onClick={() => setTool(p)}
            >
              {p.imageUrl ? <img src={p.imageUrl} alt={p.label} /> : <span className="swatch" style={{ background: p.swatchColor }} />}
              {p.label}
            </button>
          ))}
        </div>

        <div className="row-between" style={{ margin: "0 0 6px" }}>
          <span style={{ fontSize: 11, color: "var(--geo-text-dim)" }}>Línea de tiempo — audio, fondo y objetos, todo a la misma escala</span>
          <span className="row" style={{ gap: 4, margin: 0 }}>
            <button type="button" className="icon-btn" onClick={() => setZoomIndex((i) => Math.max(0, i - 1))} disabled={zoomIndex === 0} title="Alejar">
              −
            </button>
            <span style={{ fontSize: 11, color: "var(--geo-text-dim)", width: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              title="Acercar (más detalle)"
            >
              +
            </button>
          </span>
        </div>

        {/* Un solo contenedor con scroll para regla de tiempo + forma de onda +
            fondo/objetos: las tres franjas comparten el mismo ancho total y el
            mismo scroll horizontal, asi nunca se desalinean ni se salen de la
            tarjeta (antes la forma de onda vivia afuera de este scroll y se
            desbordaba de la pagina en pistas largas). */}
        <div ref={stripRef} className="level-strip" style={{ height: TIMELINE_VIEWPORT_HEIGHT, overflowY: "auto" }}>
          <div style={{ position: "relative", width: totalWidthPx }}>
            <div style={{ position: "relative", height: RULER_HEIGHT, borderBottom: "1px solid var(--geo-border)" }}>
              {ticks.map((t) => (
                <div
                  key={t}
                  style={{ position: "absolute", left: t * pxPerSecond, top: 0, bottom: 0, borderLeft: "1px solid var(--geo-border)", paddingLeft: 3 }}
                >
                  <span style={{ fontSize: 9, color: "var(--geo-text-dim)" }}>{formatMMSS(t)}</span>
                </div>
              ))}
            </div>

            <div style={{ height: WAVEFORM_HEIGHT, borderBottom: "1px solid var(--geo-border)" }}>
              <WaveformCanvas
                musicUrl={musicUrl}
                width={totalWidthPx}
                height={WAVEFORM_HEIGHT}
                trimStartSec={musicStartSec}
                trimEndSec={musicEndSec}
                onDurationDetected={(sec) => {
                  if (isNew && obstacles.length === 0) setDurationSec(Math.max(5, Math.round(sec)));
                }}
              />
            </div>

            <div
              style={{
                position: "relative",
                width: totalWidthPx,
                height: stripContentHeight,
                backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
                backgroundRepeat: "repeat-x",
                backgroundSize: `auto ${100 * backgroundScale}%`,
                backgroundPosition: "left center",
              }}
              onClick={onStripClick}
            >
              {/* linea de suelo, referencia visual */}
              <div style={{ position: "absolute", left: 0, right: 0, top: 500 * vScale, height: 1, background: "rgba(139,47,224,0.4)" }} />
              {obstacles.map((o, i) => {
                const meta = PHYSICS_LABELS.find((p) => p.value === o.type);
                return (
                  <div
                    key={i}
                    className={`level-strip-obstacle ${selectedIndex === i ? "selected" : ""}`}
                    style={{
                      left: levelXToScreenX(o.x),
                      top: o.y * vScale,
                      width: Math.max(4, levelXToScreenX(o.x + o.w) - levelXToScreenX(o.x)),
                      height: Math.max(4, o.h * vScale),
                      background: o.imageUrl ? `url(${o.imageUrl}) center/cover` : meta?.color || "#888",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(i);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <p className="subtitle" style={{ margin: "8px 0 0", fontSize: 11 }}>
          Click en el carril de abajo para agregar el objeto seleccionado. Click en un objeto ya puesto para editarlo o borrarlo. Usa +/− para acercar y ver mejor el detalle.
        </p>
      </div>

      {selected && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="row-between">
            <div className="label" style={{ marginTop: 0 }}>
              Obstáculo seleccionado
            </div>
            <button className="btn btn-danger" style={{ width: "auto" }} onClick={deleteSelected}>
              🗑️ Eliminar
            </button>
          </div>
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <label style={{ fontSize: 11, color: "var(--geo-text-dim)" }}>
              X
              <input
                className="input"
                type="number"
                style={{ width: 90, display: "block" }}
                value={selected.x}
                onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })}
              />
            </label>
            <label style={{ fontSize: 11, color: "var(--geo-text-dim)" }}>
              Y
              <input
                className="input"
                type="number"
                style={{ width: 90, display: "block" }}
                value={selected.y}
                onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })}
              />
            </label>
            <label style={{ fontSize: 11, color: "var(--geo-text-dim)" }}>
              Ancho
              <input
                className="input"
                type="number"
                style={{ width: 90, display: "block" }}
                value={selected.w}
                onChange={(e) => updateSelected({ w: Math.max(4, Number(e.target.value) || 4) })}
              />
            </label>
            <label style={{ fontSize: 11, color: "var(--geo-text-dim)" }}>
              Alto
              <input
                className="input"
                type="number"
                style={{ width: 90, display: "block" }}
                value={selected.h}
                onChange={(e) => updateSelected({ h: Math.max(4, Number(e.target.value) || 4) })}
              />
            </label>
            <div>
              <div style={{ fontSize: 11, color: "var(--geo-text-dim)", marginBottom: 4 }}>Tipo</div>
              <div className="segmented">
                {PHYSICS_LABELS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={`segmented-btn ${selected.type === p.value ? "active" : ""}`}
                    onClick={() => updateSelected({ type: p.value })}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row-between">
        <button className="btn btn-primary" onClick={onSave} disabled={saving} style={{ width: "auto" }}>
          {saving ? "Guardando..." : "Guardar pista"}
        </button>
        {!!error && <p className="error-text" style={{ margin: 0 }}>{error}</p>}
      </div>
    </div>
  );
}
