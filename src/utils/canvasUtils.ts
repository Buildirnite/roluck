import type { Rotation } from '../types';

/** Opciones geométricas para dibujar una imagen en un canvas. */
export interface RenderOptions {
  width?: number; // ancho de dibujo (antes de rotar); por defecto el natural
  height?: number; // alto de dibujo (antes de rotar)
  rotation?: Rotation;
  flipH?: boolean;
  flipV?: boolean;
  fillBackground?: string; // color de fondo (ej. "#ffffff" para JPEG sin alpha)
  filter?: string; // valor para ctx.filter (ej. "brightness(120%) contrast(110%)")
  fit?: 'stretch' | 'cover'; // con width+height: estirar (default) o cubrir y recortar
}

/**
 * Carga un File/Blob en un HTMLImageElement. Crea y revoca su propia Object URL,
 * así el llamador no tiene que preocuparse de fugas de memoria.
 */
export function loadImage(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen.'));
    };
    img.src = url;
  });
}

/**
 * Dibuja una imagen en un <canvas> aplicando, en orden: redimensionado,
 * rotación (múltiplos de 90°) y espejos. Centraliza toda la geometría para que
 * tanto la conversión normal como la búsqueda de peso objetivo usen lo mismo.
 */
export function renderToCanvas(
  img: HTMLImageElement,
  opts: RenderOptions = {},
): HTMLCanvasElement | null {
  const rotation = opts.rotation ?? 0;
  // Dimensiones a las que se dibuja la imagen (resize). Si no se piden, las naturales.
  const drawW = opts.width ?? img.naturalWidth;
  const drawH = opts.height ?? img.naturalHeight;

  // Modo "cover": lienzo exacto width×height, escala para cubrir y recorta el
  // centro (sin distorsión). Pensado para presets de tamaño fijo (redes sociales).
  if (opts.fit === 'cover' && opts.width && opts.height) {
    const canvas = document.createElement('canvas');
    canvas.width = opts.width;
    canvas.height = opts.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (opts.fillBackground) {
      ctx.fillStyle = opts.fillBackground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const scale = Math.max(opts.width / img.naturalWidth, opts.height / img.naturalHeight);
    const sw = opts.width / scale; // ancho del recorte fuente
    const sh = opts.height / scale; // alto del recorte fuente
    const sx = (img.naturalWidth - sw) / 2;
    const sy = (img.naturalHeight - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, opts.width, opts.height);
    return canvas;
  }

  // En rotaciones de 90°/270° el lienzo intercambia ancho y alto.
  const swap = rotation === 90 || rotation === 270;

  const canvas = document.createElement('canvas');
  canvas.width = swap ? drawH : drawW;
  canvas.height = swap ? drawW : drawH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Calidad de reescalado más suave.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fondo opaco (JPEG no soporta transparencia).
  if (opts.fillBackground) {
    ctx.fillStyle = opts.fillBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Trabajamos desde el centro del lienzo para rotar/espejar limpiamente.
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(opts.flipH ? -1 : 1, opts.flipV ? -1 : 1);
  // Filtros (brillo/contraste/etc.) se aplican solo al dibujo de la imagen.
  if (opts.filter) ctx.filter = opts.filter;
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

  return canvas;
}

/** Envuelve canvas.toBlob en una promesa (resuelve null si el formato no se soporta). */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}
