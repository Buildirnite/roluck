import { canvasToBlob } from './canvasUtils';
import { loadImageFile } from './heicDecoder';

/**
 * Lado máximo seguro para un lienzo. Los navegadores (Safari/iOS el más estricto)
 * topan el área del canvas y, pasado el límite, devuelven un lienzo en blanco SIN
 * lanzar error. Reescalamos a este máximo antes de procesar para evitar ese bug
 * silencioso (ver gotchas en las instrucciones).
 */
export const MAX_CANVAS_DIM = 4096;

/** Reduce un par ancho×alto para que ningún lado supere `max`, conservando proporción. */
export function clampDimensions(w: number, h: number, max = MAX_CANVAS_DIM): { width: number; height: number } {
  const longest = Math.max(w, h);
  if (longest <= max) return { width: Math.round(w), height: Math.round(h) };
  const scale = max / longest;
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

/** Dibuja `img` cubriendo (cover, sin distorsión) el rectángulo dx,dy,dw,dh del contexto. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const scale = Math.max(dw / img.naturalWidth, dh / img.naturalHeight);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/** Quita la extensión de un nombre de archivo (ej: "foto.png" → "foto"). */
function baseName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

// ── Dividir en cuadrícula ───────────────────────────────────────────────────

export interface GridPiece {
  blob: Blob;
  name: string;
  row: number;
  col: number;
}

/**
 * Corta una imagen en una cuadrícula rows×cols. Cada celda se exporta como PNG
 * independiente (útil para carruseles de Instagram). Las celdas del borde derecho
 * e inferior absorben el sobrante de píxeles si las dimensiones no son divisibles.
 */
export async function splitImageGrid(file: File, rows: number, cols: number): Promise<GridPiece[]> {
  const img = await loadImageFile(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const base = baseName(file.name);
  const pieces: GridPiece[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sx = Math.round((c * w) / cols);
      const sy = Math.round((r * h) / rows);
      const sw = Math.round(((c + 1) * w) / cols) - sx;
      const sh = Math.round(((r + 1) * h) / rows) - sy;

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      const blob = await canvasToBlob(canvas, 'image/png');
      if (blob) {
        pieces.push({ blob, name: `${base}_r${r + 1}_c${c + 1}.png`, row: r, col: c });
      }
    }
  }
  return pieces;
}

// ── Spritesheet ──────────────────────────────────────────────────────────────

export interface SpritesheetResult {
  blob: Blob;
  css: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  count: number;
}

/**
 * Compone varias imágenes en una hoja de sprites de `columns` columnas. La celda
 * toma el mayor ancho y alto de entre todos los frames; cada frame se centra en su
 * celda. Devuelve también un snippet CSS con la clase base y la posición de cada índice.
 */
export async function buildSpritesheet(files: File[], columns: number): Promise<SpritesheetResult | null> {
  if (files.length === 0) return null;
  const imgs = await Promise.all(files.map(loadImageFile));

  const frameW = Math.max(...imgs.map((i) => i.naturalWidth));
  const frameH = Math.max(...imgs.map((i) => i.naturalHeight));
  const cols = Math.max(1, Math.min(columns, imgs.length));
  const rows = Math.ceil(imgs.length / cols);

  const canvas = document.createElement('canvas');
  canvas.width = cols * frameW;
  canvas.height = rows * frameH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  imgs.forEach((img, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    // Centrar el frame en su celda (no estirar: respeta el tamaño original).
    const ox = col * frameW + (frameW - img.naturalWidth) / 2;
    const oy = row * frameH + (frameH - img.naturalHeight) / 2;
    ctx.drawImage(img, ox, oy);
  });

  const blob = await canvasToBlob(canvas, 'image/png');
  if (!blob) return null;

  const positions = imgs
    .map((_, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return `.sprite-${idx} { background-position: -${col * frameW}px -${row * frameH}px; }`;
    })
    .join('\n');

  const css = `.sprite {
  width: ${frameW}px;
  height: ${frameH}px;
  background-image: url('spritesheet.png');
  background-repeat: no-repeat;
}
${positions}`;

  return { blob, css, frameWidth: frameW, frameHeight: frameH, columns: cols, rows, count: imgs.length };
}

// ── Collage ───────────────────────────────────────────────────────────────────

export interface CollageOptions {
  columns: number;
  cellSize: number; // lado de cada celda cuadrada, en px
  gap: number; // separación entre celdas y márgenes, en px
  background: string; // color de fondo (ej. "#0a0a0a")
}

/**
 * Combina varias imágenes en una cuadrícula sobre un solo lienzo. Cada imagen se
 * recorta "cover" en una celda cuadrada de `cellSize`. El lienzo se reescala si
 * supera el límite seguro de canvas.
 */
export async function buildCollage(files: File[], opts: CollageOptions): Promise<Blob | null> {
  if (files.length === 0) return null;
  const imgs = await Promise.all(files.map(loadImageFile));

  const cols = Math.max(1, Math.min(opts.columns, imgs.length));
  const rows = Math.ceil(imgs.length / cols);
  const { gap, cellSize, background } = opts;

  const fullW = cols * cellSize + (cols + 1) * gap;
  const fullH = rows * cellSize + (rows + 1) * gap;
  const { width, height } = clampDimensions(fullW, fullH);
  const scale = width / fullW; // mismo factor en ambos ejes (proporción conservada)

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const cell = cellSize * scale;
  const g = gap * scale;
  imgs.forEach((img, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const dx = g + col * (cell + g);
    const dy = g + row * (cell + g);
    drawCover(ctx, img, dx, dy, cell, cell);
  });

  return canvasToBlob(canvas, 'image/png');
}
