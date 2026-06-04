import { isHeicName } from './imageUtils';
import { loadImage } from './canvasUtils';

/**
 * Decodifica un archivo HEIC/HEIF a un File JPEG manejable por el canvas (Función 8).
 * Las fotos de iPhone vienen en HEIC y el navegador no las decodifica nativamente.
 * heic2any se importa de forma diferida (es pesado) y solo se ejecuta si hace falta.
 * Si el archivo no es HEIC, se devuelve tal cual.
 */
export async function decodeHeic(file: File): Promise<File> {
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || isHeicName(file.name);
  if (!isHeic) return file;

  // Lazy import: heic2any solo se descarga al abrir el primer HEIC.
  const heic2any = (await import('heic2any')).default;
  const converted = (await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  })) as Blob;

  // Renombramos a .jpg conservando el nombre base original.
  const dot = file.name.lastIndexOf('.');
  const base = dot > 0 ? file.name.slice(0, dot) : file.name;
  return new File([converted], `${base}.jpg`, { type: 'image/jpeg' });
}

/**
 * Carga cualquier File en un HTMLImageElement, decodificando HEIC primero si
 * corresponde. Es el punto de entrada que deben usar las pipelines de conversión.
 */
export async function loadImageFile(file: File): Promise<HTMLImageElement> {
  const prepared = await decodeHeic(file);
  return loadImage(prepared);
}
