import { useEffect, useRef, useState } from 'react';
import { canvasToBlob } from '../utils/canvasUtils';
import { loadImageFile } from '../utils/heicDecoder';
import { useI18n } from '../i18n/I18nContext';

interface AnnotateModalProps {
  file: File;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

interface Point {
  x: number;
  y: number;
}
interface Stroke {
  color: string;
  size: number; // grosor en píxeles naturales de la imagen
  points: Point[];
}

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#ffffff', '#000000'];

/** Dibujo a mano alzada sobre la imagen → nuevo File PNG aplanado. */
export default function AnnotateModal({ file, onCancel, onConfirm }: AnnotateModalProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);

  const [color, setColor] = useState('#ef4444');
  const [size, setSize] = useState(6);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0); // nº de trazos (para habilitar deshacer)
  const [working, setWorking] = useState(false);

  // Carga la imagen en el canvas a resolución natural (CSS la escala para mostrar).
  useEffect(() => {
    let alive = true;
    loadImageFile(file).then((img) => {
      if (!alive) return;
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      redraw();
      setReady(true);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  function redraw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of strokesRef.current) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.beginPath();
      s.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      // Un punto suelto: dibuja un círculo para que un click deje marca.
      if (s.points.length === 1) {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.points[0].x, s.points[0].y, s.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.stroke();
      }
    }
  }

  /** Convierte coordenadas de puntero a píxeles naturales del canvas. */
  function toCanvasPoint(e: React.PointerEvent): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale };
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const scale = canvasRef.current!.width / canvasRef.current!.getBoundingClientRect().width;
    strokesRef.current.push({ color, size: size * scale, points: [toCanvasPoint(e)] });
    redraw();
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    stroke.points.push(toCanvasPoint(e));
    redraw();
  }

  function handlePointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    setCount(strokesRef.current.length);
  }

  function handleUndo() {
    strokesRef.current.pop();
    setCount(strokesRef.current.length);
    redraw();
  }

  function handleClear() {
    strokesRef.current = [];
    setCount(0);
    redraw();
  }

  async function handleConfirm() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setWorking(true);
    try {
      const blob = await canvasToBlob(canvas, 'image/png');
      if (!blob) return;
      const dot = file.name.lastIndexOf('.');
      const base = dot > 0 ? file.name.slice(0, dot) : file.name;
      onConfirm(new File([blob], `${base}.png`, { type: 'image/png' }));
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-border bg-bg-surface p-4">
        <h3 className="font-display text-lg font-semibold text-text-primary">{t.annotate.title}</h3>
        <p className="text-xs text-text-muted">{t.annotate.hint}</p>

        <div className="checkerboard flex max-h-[55vh] items-center justify-center overflow-auto rounded-xl bg-bg-primary p-2">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="max-h-[50vh] w-auto max-w-full cursor-crosshair touch-none rounded-lg"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-accent' : 'border-border'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label={t.annotate.color}
              className="h-7 w-8 cursor-pointer rounded border border-border bg-transparent"
            />
          </div>
          <label className="flex flex-1 items-center gap-2 text-xs">
            <span className="uppercase tracking-wide text-text-muted">{t.annotate.size}</span>
            <input type="range" min={2} max={40} value={size} onChange={(e) => setSize(Number(e.target.value))} className="flex-1" />
            <span className="w-6 font-mono text-accent">{size}</span>
          </label>
          <button type="button" onClick={handleUndo} disabled={count === 0} className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs text-text-muted hover:text-text-primary disabled:opacity-40">
            {t.annotate.undo}
          </button>
          <button type="button" onClick={handleClear} disabled={count === 0} className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs text-text-muted hover:text-error disabled:opacity-40">
            {t.annotate.clear}
          </button>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={working} className="min-h-[48px] flex-1 rounded-xl border border-border bg-bg-elevated px-6 text-sm font-medium text-text-muted hover:text-text-primary disabled:opacity-40">
            {t.common.cancel}
          </button>
          <button type="button" onClick={handleConfirm} disabled={working || count === 0} className="min-h-[48px] flex-1 rounded-xl bg-accent px-6 text-sm font-semibold text-bg-primary hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-text-muted">
            {working ? t.region.applying : t.common.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
