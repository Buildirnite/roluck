import { canvasToBlob } from './canvasUtils';
import { loadImageFile } from './heicDecoder';

/** Tamaños estándar que se incluyen en un favicon .ico. */
export const ICO_SIZES = [16, 32, 48] as const;

/** Dibuja la imagen fuente recortada "cover" en un cuadrado de `size` y la exporta a PNG. */
async function renderSquarePng(img: HTMLImageElement, size: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el lienzo del ícono.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
  const sw = size / scale;
  const sh = size / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
  const blob = await canvasToBlob(canvas, 'image/png');
  if (!blob) throw new Error('No se pudo codificar el ícono PNG.');
  return blob;
}

/**
 * Construye un .ico que contiene un PNG por cada tamaño. El .ico es un formato
 * contenedor: `canvas.toBlob` solo entrega PNG/JPEG/WebP, así que armamos a mano la
 * cabecera ICONDIR + entradas ICONDIRENTRY y embebemos los PNG (soportado desde
 * Windows Vista). Ver gotcha en las instrucciones.
 */
export async function buildIco(source: File, sizes: readonly number[] = ICO_SIZES): Promise<Blob> {
  const img = await loadImageFile(source);
  const pngs = await Promise.all(sizes.map((s) => renderSquarePng(img, s)));
  const buffers = await Promise.all(pngs.map((b) => b.arrayBuffer()));

  const headerSize = 6; // ICONDIR
  const entrySize = 16; // ICONDIRENTRY
  const dirSize = headerSize + entrySize * sizes.length;
  const totalSize = dirSize + buffers.reduce((sum, b) => sum + b.byteLength, 0);

  const out = new ArrayBuffer(totalSize);
  const view = new DataView(out);
  const bytes = new Uint8Array(out);

  // ICONDIR
  view.setUint16(0, 0, true); // reservado
  view.setUint16(2, 1, true); // tipo: 1 = ícono
  view.setUint16(4, sizes.length, true); // número de imágenes

  let offset = dirSize;
  sizes.forEach((size, i) => {
    const entry = headerSize + i * entrySize;
    const len = buffers[i].byteLength;
    // 256 se codifica como 0 en el campo de 1 byte.
    view.setUint8(entry + 0, size >= 256 ? 0 : size); // ancho
    view.setUint8(entry + 1, size >= 256 ? 0 : size); // alto
    view.setUint8(entry + 2, 0); // colores de la paleta (0 = sin paleta)
    view.setUint8(entry + 3, 0); // reservado
    view.setUint16(entry + 4, 1, true); // planos de color
    view.setUint16(entry + 6, 32, true); // bits por píxel
    view.setUint32(entry + 8, len, true); // tamaño de los datos
    view.setUint32(entry + 12, offset, true); // offset a los datos

    bytes.set(new Uint8Array(buffers[i]), offset);
    offset += len;
  });

  return new Blob([out], { type: 'image/x-icon' });
}

/** Genera un PNG cuadrado de un tamaño concreto (apple-touch-icon, íconos del manifest). */
export async function buildPng(source: File, size: number): Promise<Blob> {
  const img = await loadImageFile(source);
  return renderSquarePng(img, size);
}

/** El snippet HTML para enlazar todos los archivos generados. */
export const FAVICON_HTML_SNIPPET = `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

/** Contenido de site.webmanifest con los íconos PWA de 192 y 512 px. */
export const FAVICON_MANIFEST = JSON.stringify(
  {
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  null,
  2,
);
