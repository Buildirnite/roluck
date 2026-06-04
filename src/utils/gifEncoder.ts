import GIF from 'gif.js';
// gif.js corre el cuantizado en un Web Worker servido como archivo aparte. Con Vite
// importamos su URL con `?url` para que el worker se resuelva igual en dev y en
// producción (sin esto falla al construir el GIF tras el build).
import gifWorkerUrl from 'gif.js/dist/gif.worker.js?url';
import { loadImageFile } from './heicDecoder';
import { clampDimensions } from './createUtils';

export interface GifOptions {
  delay: number; // ms entre frames
  quality: number; // 1 (mejor) – 30 (peor/rápido); gif.js usa menor = mejor
  repeat: number; // 0 = bucle infinito, -1 = una vez
  onProgress?: (fraction: number) => void;
}

/**
 * Combina varias imágenes en un GIF animado. El tamaño del lienzo lo fija el primer
 * frame (acotado al límite seguro de canvas); los demás frames se reescalan a ese
 * tamaño con recorte "cover" para que no haya saltos de dimensión en la animación.
 */
export async function encodeGif(files: File[], opts: GifOptions): Promise<Blob> {
  if (files.length === 0) throw new Error('No hay frames para el GIF.');

  const imgs = await Promise.all(files.map(loadImageFile));
  const first = imgs[0];
  const { width, height } = clampDimensions(first.naturalWidth, first.naturalHeight);

  const gif = new GIF({
    workers: 2,
    quality: opts.quality,
    width,
    height,
    repeat: opts.repeat,
    workerScript: gifWorkerUrl,
  });

  for (const img of imgs) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo crear el lienzo del frame.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Recorte "cover" para encajar cualquier proporción en el lienzo común.
    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const sw = width / scale;
    const sh = height / scale;
    const sx = (img.naturalWidth - sw) / 2;
    const sy = (img.naturalHeight - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
    gif.addFrame(canvas, { delay: opts.delay, copy: true });
  }

  return new Promise<Blob>((resolve, reject) => {
    gif.on('progress', (p) => opts.onProgress?.(p));
    gif.on('finished', (blob) => resolve(blob));
    // gif.js no emite un evento de error explícito; "abort" es lo más cercano.
    gif.on('abort', () => reject(new Error('La generación del GIF se canceló.')));
    gif.render();
  });
}
