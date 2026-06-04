import { canvasToBlob, loadImage } from './canvasUtils';

/** Región de recorte expresada en porcentajes (0–100) de la imagen original. */
export interface PercentCropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Genera un Blob PNG recortado a partir de la imagen original y el área en
 * porcentajes. Usamos porcentajes para que el recorte sea invariante al zoom de
 * la previsualización. El recorte se aplica ANTES de cualquier conversión (Función 5).
 */
export async function getCroppedBlob(
  imageSrc: string,
  area: PercentCropArea,
): Promise<Blob | null> {
  const img = await loadImage(await (await fetch(imageSrc)).blob());

  // Convertimos los porcentajes a píxeles reales de la imagen.
  const sx = (area.x / 100) * img.naturalWidth;
  const sy = (area.y / 100) * img.naturalHeight;
  const sw = (area.width / 100) * img.naturalWidth;
  const sh = (area.height / 100) * img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Copiamos solo la región seleccionada al nuevo canvas.
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  return canvasToBlob(canvas, 'image/png');
}
