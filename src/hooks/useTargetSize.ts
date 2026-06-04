import type { OutputFormat } from '../types';
import { canvasToBlob, renderToCanvas, type RenderOptions } from '../utils/canvasUtils';

export interface TargetSizeResult {
  blob: Blob;
  quality: number; // calidad final 0–1 alcanzada por la búsqueda
}

/**
 * Comprime una imagen al mayor nivel de calidad que entre dentro de `targetBytes`,
 * mediante búsqueda binaria sobre el parámetro quality (0.1–1.0). Solo tiene sentido
 * para formatos con pérdida (JPEG/WebP). Reusa renderToCanvas para respetar cualquier
 * resize/rotación/espejo ya aplicado.
 *
 * 8 iteraciones acotan la calidad a ±~0.4%, suficiente en la práctica.
 */
export async function compressToTarget(
  img: HTMLImageElement,
  mimeType: Extract<OutputFormat, 'image/jpeg' | 'image/webp'>,
  targetBytes: number,
  render: RenderOptions = {},
): Promise<TargetSizeResult | null> {
  let low = 0.1;
  let high = 1.0;
  let best: Blob | null = null;
  let bestQuality = 0.1;

  for (let i = 0; i < 8; i++) {
    const mid = (low + high) / 2;
    const canvas = renderToCanvas(img, render);
    if (!canvas) return null;

    const blob = await canvasToBlob(canvas, mimeType, mid);
    if (!blob) return null; // navegador no soporta el formato

    if (blob.size <= targetBytes) {
      best = blob;
      bestQuality = mid;
      low = mid; // cabe: intentamos subir calidad
    } else {
      high = mid; // se pasa: bajamos calidad
    }
  }

  // Si ni la calidad mínima entró en el objetivo, devolvemos esa como mejor esfuerzo.
  if (!best) {
    const canvas = renderToCanvas(img, render);
    if (!canvas) return null;
    const blob = await canvasToBlob(canvas, mimeType, 0.1);
    if (!blob) return null;
    return { blob, quality: 0.1 };
  }

  return { blob: best, quality: bestQuality };
}
