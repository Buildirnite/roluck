import type { InputFormat, OutputFormat } from '../types';

/** Formatos de entrada que la app acepta. */
export const ACCEPTED_INPUT_FORMATS: InputFormat[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
  'image/heic',
];

/**
 * Atributo `accept` para el <input type="file">. Incluimos las extensiones
 * .heic/.heif porque muchos navegadores no asignan MIME type a esos archivos.
 */
export const ACCEPT_ATTR = [...ACCEPTED_INPUT_FORMATS, '.heic', '.heif'].join(',');

/** Umbral de advertencia de tamaño: 20 MB. */
export const SIZE_WARNING_BYTES = 20 * 1024 * 1024;

/** Mapa de MIME de salida → extensión de archivo. */
const OUTPUT_EXTENSIONS: Record<OutputFormat, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

/** Etiquetas legibles para mostrar en la UI. */
const FORMAT_LABELS: Record<string, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
  'image/avif': 'AVIF',
  'image/gif': 'GIF',
  'image/bmp': 'BMP',
  'image/svg+xml': 'SVG',
  'image/heic': 'HEIC',
};

/** ¿El nombre de archivo tiene extensión HEIC/HEIF? */
export function isHeicName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith('.heic') || lower.endsWith('.heif');
}

/** Devuelve la etiqueta corta legible de un MIME type (ej: "image/png" → "PNG"). */
export function formatLabel(mime: string): string {
  return FORMAT_LABELS[mime] ?? mime.replace('image/', '').toUpperCase();
}

/** Devuelve la extensión de archivo para un formato de salida. */
export function extensionFor(format: OutputFormat): string {
  return OUTPUT_EXTENSIONS[format];
}

/**
 * ¿El archivo es una imagen de entrada aceptada? Se valida por MIME type y,
 * como fallback, por extensión HEIC/HEIF (cuyo MIME suele venir vacío).
 */
export function isAcceptedImage(file: File): boolean {
  if (ACCEPTED_INPUT_FORMATS.includes(file.type as InputFormat)) return true;
  return isHeicName(file.name);
}

/** Detecta el formato de entrada a partir del File. */
export function detectFormat(file: File): InputFormat {
  if (file.type) return file.type as InputFormat;
  if (isHeicName(file.name)) return 'image/heic';
  return file.type as InputFormat;
}

/** Formatea bytes a una cadena legible (B / KB / MB). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Construye el nombre de descarga sugerido a partir del nombre original.
 * Ej: ("foto.png", "image/webp") → "foto_converted.webp"
 */
export function suggestedFilename(originalName: string, format: OutputFormat): string {
  const dot = originalName.lastIndexOf('.');
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  return `${base}_converted.${extensionFor(format)}`;
}

/**
 * Dispara la descarga de un Blob con el nombre dado. Crea y revoca su propia
 * Object URL para no dejar fugas de memoria.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Calcula el porcentaje de ahorro (negativo si el resultado pesa más). */
export function savingsPercent(originalBytes: number, resultBytes: number): number {
  if (originalBytes <= 0) return 0;
  return Math.round(((originalBytes - resultBytes) / originalBytes) * 100);
}

/** Formatos de entrada que pueden tener canal alfa (transparencia). */
const TRANSPARENT_CAPABLE = new Set([
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

/** Avisos de pérdida de datos según el formato de entrada y el destino elegido. */
export function lossWarnings(inputType: string, format: OutputFormat): string[] {
  const list: string[] = [];
  if (format === 'image/jpeg' && TRANSPARENT_CAPABLE.has(inputType)) {
    list.push(
      'JPEG no soporta transparencia. El fondo transparente se rellenará con blanco.',
    );
  }
  if (inputType === 'image/gif') {
    list.push('Solo se convertirá el primer frame de la animación.');
  }
  return list;
}
