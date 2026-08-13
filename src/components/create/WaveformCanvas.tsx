import { useEffect, useRef, useState } from "react";

const peaksCache = new Map<string, number[]>();
const durationCache = new Map<string, number>();

export default function WaveformCanvas({
  musicUrl,
  width,
  height = 64,
  trimStartSec,
  trimEndSec,
  onDurationDetected,
}: {
  musicUrl?: string | null;
  width: number;
  height?: number;
  /** Si se pasan, solo se dibuja ese tramo del archivo (estirado a `width`) —
   * usado por la linea de tiempo principal, que trabaja sobre la musica ya
   * recortada. Sin estos props se dibuja el archivo completo (usado en el
   * mini-resumen de recorte). */
  trimStartSec?: number;
  trimEndSec?: number | null;
  onDurationDetected?: (seconds: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [fullDuration, setFullDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!musicUrl) {
      setPeaks(null);
      setFullDuration(null);
      return;
    }
    const cachedPeaks = peaksCache.get(musicUrl);
    const cachedDuration = durationCache.get(musicUrl);
    if (cachedPeaks && cachedDuration !== undefined) {
      setPeaks(cachedPeaks);
      setFullDuration(cachedDuration);
      onDurationDetected?.(cachedDuration);
      return;
    }
    let cancelled = false;
    setPeaks(null);
    fetch(musicUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtxClass();
        return ctx.decodeAudioData(buf).finally(() => ctx.close());
      })
      .then((audioBuffer) => {
        if (cancelled) return;
        const data = audioBuffer.getChannelData(0);
        // ~8 barras por segundo del archivo COMPLETO (independiente del
        // recorte, que solo afecta que porcion se dibuja despues) para que
        // se vea como una forma de onda de verdad y no bloques gruesos.
        const buckets = Math.min(4000, Math.max(400, Math.round(audioBuffer.duration * 8)));
        const bucketSize = Math.max(1, Math.floor(data.length / buckets));
        const result: number[] = [];
        for (let i = 0; i < buckets; i++) {
          let max = 0;
          const start = i * bucketSize;
          for (let j = 0; j < bucketSize; j++) {
            const v = Math.abs(data[start + j] || 0);
            if (v > max) max = v;
          }
          result.push(max);
        }
        peaksCache.set(musicUrl, result);
        durationCache.set(musicUrl, audioBuffer.duration);
        setPeaks(result);
        setFullDuration(audioBuffer.duration);
        onDurationDetected?.(audioBuffer.duration);
      })
      .catch(() => setPeaks([]));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (!peaks || peaks.length === 0) return;

    let visible = peaks;
    if (trimStartSec !== undefined && fullDuration) {
      const end = trimEndSec ?? fullDuration;
      const startIdx = Math.max(0, Math.floor((trimStartSec / fullDuration) * peaks.length));
      const endIdx = Math.min(peaks.length, Math.ceil((end / fullDuration) * peaks.length));
      visible = peaks.slice(startIdx, Math.max(startIdx + 1, endIdx));
    }

    const barW = width / visible.length;
    ctx.fillStyle = "rgba(34, 211, 238, 0.65)";
    visible.forEach((p, i) => {
      const h = Math.max(1, p * height);
      ctx.fillRect(i * barW, (height - h) / 2, Math.max(1, barW - 1), h);
    });
  }, [peaks, width, height, trimStartSec, trimEndSec, fullDuration]);

  if (!musicUrl) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--geo-text-dim)", fontSize: 12 }}>
        Sin música
      </div>
    );
  }
  if (peaks === null) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--geo-text-dim)", fontSize: 12 }}>
        Analizando audio...
      </div>
    );
  }
  return <canvas ref={canvasRef} width={width} height={height} style={{ display: "block" }} />;
}
