import type { Rotation } from '../types';
import { canvasToBlob, renderToCanvas } from './canvasUtils';
import { loadImageFile } from './heicDecoder';

interface TransformInput {
  rotation?: Rotation;
  flipH?: boolean;
  flipV?: boolean;
}

/** Reemplaza la extensión por .png conservando el nombre base. */
function toPngName(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.png`;
}

/**
 * Aplica una rotación o espejo a un archivo de imagen y devuelve un nuevo File PNG
 * (PNG para conservar la transparencia entre ediciones encadenadas). Se usa para
 * que rotar/voltear sean ediciones en vivo y reversibles, igual que recortar.
 */
export async function applyTransform(
  file: File,
  opts: TransformInput,
): Promise<File | null> {
  const img = await loadImageFile(file);
  const canvas = renderToCanvas(img, opts);
  if (!canvas) return null;
  const blob = await canvasToBlob(canvas, 'image/png');
  if (!blob) return null;
  return new File([blob], toPngName(file.name), { type: 'image/png' });
}

/** Ajustes de filtro (porcentajes; 100 = sin cambio). */
export interface FilterValues {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: boolean;
  sepia: boolean;
}

export const DEFAULT_FILTERS: FilterValues = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: false,
  sepia: false,
};

/** ¿Los filtros están en sus valores neutros (sin efecto)? */
export function isNeutralFilter(f: FilterValues): boolean {
  return (
    f.brightness === 100 &&
    f.contrast === 100 &&
    f.saturate === 100 &&
    !f.grayscale &&
    !f.sepia
  );
}

/** Construye el string para ctx.filter / CSS filter a partir de los ajustes. */
export function buildFilterString(f: FilterValues): string {
  const parts = [
    `brightness(${f.brightness}%)`,
    `contrast(${f.contrast}%)`,
    `saturate(${f.saturate}%)`,
  ];
  if (f.grayscale) parts.push('grayscale(1)');
  if (f.sepia) parts.push('sepia(1)');
  return parts.join(' ');
}

/** Aplica filtros de color a un archivo y devuelve un nuevo File PNG. */
export async function applyFilters(file: File, f: FilterValues): Promise<File | null> {
  const img = await loadImageFile(file);
  const canvas = renderToCanvas(img, { filter: buildFilterString(f) });
  if (!canvas) return null;
  const blob = await canvasToBlob(canvas, 'image/png');
  if (!blob) return null;
  return new File([blob], toPngName(file.name), { type: 'image/png' });
}

// ── Marca de agua ──────────────────────────────────────────────────────────
export type WatermarkPosition = 'tl' | 'tc' | 'tr' | 'cl' | 'cc' | 'cr' | 'bl' | 'bc' | 'br';

export interface WatermarkOptions {
  text: string;
  position: WatermarkPosition;
  opacity: number; // 0–1
  color: string; // ej. "#ffffff"
  sizePct: number; // tamaño de fuente como % del lado menor (ej. 5)
}

/** Dibuja una marca de agua de texto sobre un contexto ya con la imagen pintada. */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  o: WatermarkOptions,
): void {
  if (!o.text.trim()) return;
  const fontPx = Math.max(12, Math.round((Math.min(w, h) * o.sizePct) / 100));
  const pad = Math.round(fontPx * 0.6);

  ctx.save();
  ctx.globalAlpha = o.opacity;
  ctx.fillStyle = o.color;
  ctx.font = `600 ${fontPx}px "Space Grotesk", system-ui, sans-serif`;
  // Sombra sutil para legibilidad sobre fondos claros u oscuros.
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = Math.round(fontPx * 0.15);

  const vert = o.position[0]; // t | c | b
  const horiz = o.position[1]; // l | c | r
  ctx.textBaseline = vert === 't' ? 'top' : vert === 'b' ? 'bottom' : 'middle';
  ctx.textAlign = horiz === 'l' ? 'left' : horiz === 'r' ? 'right' : 'center';

  const x = horiz === 'l' ? pad : horiz === 'r' ? w - pad : w / 2;
  const y = vert === 't' ? pad : vert === 'b' ? h - pad : h / 2;
  ctx.fillText(o.text, x, y);
  ctx.restore();
}

/** Aplica una marca de agua de texto a un archivo → nuevo File PNG. */
export async function applyWatermark(file: File, o: WatermarkOptions): Promise<File | null> {
  const img = await loadImageFile(file);
  const canvas = renderToCanvas(img);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  drawWatermark(ctx, canvas.width, canvas.height, o);
  const blob = await canvasToBlob(canvas, 'image/png');
  if (!blob) return null;
  return new File([blob], toPngName(file.name), { type: 'image/png' });
}

// ── Escalar (ampliar) ──────────────────────────────────────────────────────
/**
 * Reescala una imagen por un factor (>1 amplía) con suavizado de alta calidad y
 * devuelve un nuevo File PNG. Pensado para "Escalar" en el editor.
 */
export async function applyScale(file: File, factor: number): Promise<File | null> {
  const img = await loadImageFile(file);
  const w = Math.max(1, Math.round(img.naturalWidth * factor));
  const h = Math.max(1, Math.round(img.naturalHeight * factor));
  const canvas = renderToCanvas(img, { width: w, height: h });
  if (!canvas) return null;
  const blob = await canvasToBlob(canvas, 'image/png');
  if (!blob) return null;
  return new File([blob], toPngName(file.name), { type: 'image/png' });
}

// ── Reemplazar fondo (color sólido) ────────────────────────────────────────
/** Compone la imagen sobre un color sólido (aplana la transparencia). */
export async function applyBackgroundColor(file: File, color: string): Promise<File | null> {
  const img = await loadImageFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  const blob = await canvasToBlob(canvas, 'image/png');
  if (!blob) return null;
  return new File([blob], toPngName(file.name), { type: 'image/png' });
}

// ── Efectos de región (difuminar / pixelar / redacción) ─────────────────────
export type RegionMode = 'blur' | 'pixelate' | 'redact';

export interface RegionPercent {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Aplica un efecto a una región rectangular (en %) de la imagen. */
export async function applyRegionEffect(
  file: File,
  region: RegionPercent,
  mode: RegionMode,
  intensity: number,
): Promise<File | null> {
  const img = await loadImageFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);

  const rx = Math.round((region.x / 100) * canvas.width);
  const ry = Math.round((region.y / 100) * canvas.height);
  const rw = Math.max(1, Math.round((region.width / 100) * canvas.width));
  const rh = Math.max(1, Math.round((region.height / 100) * canvas.height));

  if (mode === 'redact') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(rx, ry, rw, rh);
  } else if (mode === 'blur') {
    // Difuminamos la imagen completa en un canvas aparte y copiamos solo la
    // región de vuelta. Así el borde de la región queda nítido (sin sangrado de
    // píxeles externos como ocurría al difuminar con clip sobre el mismo canvas).
    const blurred = document.createElement('canvas');
    blurred.width = canvas.width;
    blurred.height = canvas.height;
    const bctx = blurred.getContext('2d');
    if (bctx) {
      bctx.filter = `blur(${intensity}px)`;
      bctx.drawImage(canvas, 0, 0);
      ctx.drawImage(blurred, rx, ry, rw, rh, rx, ry, rw, rh);
    }
  } else {
    // pixelar: reducir y ampliar sin suavizado
    const factor = Math.max(2, intensity);
    const sw = Math.max(1, Math.round(rw / factor));
    const sh = Math.max(1, Math.round(rh / factor));
    const small = document.createElement('canvas');
    small.width = sw;
    small.height = sh;
    const sctx = small.getContext('2d');
    if (sctx) {
      sctx.drawImage(canvas, rx, ry, rw, rh, 0, 0, sw, sh);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, sw, sh, rx, ry, rw, rh);
      ctx.imageSmoothingEnabled = true;
    }
  }

  const blob = await canvasToBlob(canvas, 'image/png');
  if (!blob) return null;
  return new File([blob], toPngName(file.name), { type: 'image/png' });
}
