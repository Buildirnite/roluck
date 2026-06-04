import { loadImageFile } from './heicDecoder';

export interface SwatchColor {
  hex: string; // "#rrggbb"
  rgb: [number, number, number];
  percent: number; // porcentaje aproximado de píxeles del cluster, 0–100
}

/** Convierte un canal 0–255 a dos dígitos hex. */
function toHex(n: number): string {
  return n.toString(16).padStart(2, '0');
}

/**
 * Extrae los colores dominantes de una imagen por popularidad. Reduce la imagen a
 * un máximo de ~64px de lado (rápido y suficiente para dominantes), agrupa los
 * píxeles en cubos de color de 32 niveles por canal y devuelve los `count` cubos más
 * frecuentes con su color promedio. Ignora píxeles casi transparentes.
 */
export async function extractPalette(file: File, count = 6): Promise<SwatchColor[]> {
  const img = await loadImageFile(file);

  const maxSide = 64;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No se pudo leer la imagen.');
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  // Cubo de color: 3 bits altos por canal → 8×8×8 = 512 cubos. Acumulamos suma de
  // color y conteo para promediar después.
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 125) continue; // saltar casi transparentes
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const acc = buckets.get(key);
    if (acc) {
      acc.r += r;
      acc.g += g;
      acc.b += b;
      acc.n += 1;
    } else {
      buckets.set(key, { r, g, b, n: 1 });
    }
    total += 1;
  }
  if (total === 0) return [];

  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((acc) => {
      const rgb: [number, number, number] = [
        Math.round(acc.r / acc.n),
        Math.round(acc.g / acc.n),
        Math.round(acc.b / acc.n),
      ];
      return {
        rgb,
        hex: `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`,
        percent: Math.round((acc.n / total) * 100),
      };
    });
}
