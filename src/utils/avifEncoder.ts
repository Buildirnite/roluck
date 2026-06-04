/**
 * Codifica un canvas a AVIF usando @jsquash/avif (Función 9).
 * canvas.toBlob('image/avif') es inconsistente entre navegadores, por eso usamos
 * el códec WASM, que se importa de forma diferida solo cuando el usuario elige AVIF.
 *
 * @param quality 0–100 (mayor = mejor calidad y más peso).
 */
export async function encodeAvif(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Lazy import del códec WASM (cae a single-thread si no hay aislamiento COOP/COEP).
  const { default: encode } = await import('@jsquash/avif/encode');
  const buffer = await encode(imageData, { quality });

  return new Blob([buffer], { type: 'image/avif' });
}
