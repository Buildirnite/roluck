export type InputFormat =
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/gif'
  | 'image/bmp'
  | 'image/svg+xml'
  | 'image/heic';

export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';

export interface ConversionResult {
  url: string; // Object URL del blob resultante
  blob: Blob;
  filename: string; // Nombre sugerido para descarga, ej: "foto_converted.webp"
  sizeBytes: number;
  mimeType: OutputFormat;
  qualityUsed?: number; // calidad final 0–100 (solo formatos con pérdida)
}

/** Modo de operación de la app. */
export type AppMode = 'single' | 'batch' | 'pdf';

/** Un ítem dentro de la cola de conversión por lotes (Función 6). */
export interface BatchItem {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'done' | 'error';
  result?: ConversionResult;
  error?: string;
}

export type PdfOrientation = 'auto' | 'portrait' | 'landscape';
export type PdfPageSize = 'a4' | 'letter';

/** Opciones para exportar imágenes a PDF (Función 7). */
export interface PdfOptions {
  orientation: PdfOrientation;
  pageSize: PdfPageSize;
  filename: string;
}

/** Grados de rotación admitidos (múltiplos de 90). */
export type Rotation = 0 | 90 | 180 | 270;

/** Opciones de transformación/exportación que acepta convert(). */
export interface ConvertOptions {
  width?: number; // ancho destino (antes de rotar); por defecto el natural
  height?: number; // alto destino (antes de rotar)
  rotation?: Rotation;
  flipH?: boolean; // espejo horizontal
  flipV?: boolean; // espejo vertical
  targetBytes?: number; // si se define, busca la calidad que entre en ese peso
  fit?: 'stretch' | 'cover'; // con width+height: estirar o cubrir y recortar
}

export interface ImageMetadata {
  name: string;
  sizeBytes: number;
  width: number;
  height: number;
  format: InputFormat;
}
