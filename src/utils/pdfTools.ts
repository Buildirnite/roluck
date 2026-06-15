/**
 * Operaciones sobre archivos PDF para el PDF Toolbox (/pdf). 100% client-side.
 *
 * La manipulación (unir, reordenar, rotar, eliminar páginas) usa `pdf-lib`; las miniaturas
 * de página se generan con `pdf.js` (pdfjs-dist). Ambas librerías se cargan con import
 * diferido para que NO entren al bundle base — solo se descargan al usar el PDF Toolbox.
 * Convención del hub: PDF nuevo = pdf-lib (no jspdf).
 */

/** Una página dentro de una operación de organización. */
export interface PageOp {
  /** Índice de la página en el documento original (base 0). */
  index: number;
  /** Rotación adicional a aplicar, en grados (múltiplo de 90). */
  rotation: number;
}

/** Une varios PDF en uno solo, en el orden recibido. Devuelve los bytes. */
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const page of pages) out.addPage(page);
  }
  return out.save();
}

/**
 * Reconstruye un PDF a partir de un subconjunto de páginas del original, en el orden dado
 * y con la rotación indicada por página. Sirve para reordenar, eliminar y rotar a la vez.
 */
export async function organizePdf(file: File, ops: PageOp[]): Promise<Uint8Array> {
  const { PDFDocument, degrees } = await import('pdf-lib');
  const src = await PDFDocument.load(await file.arrayBuffer());
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, ops.map((o) => o.index));
  copied.forEach((page, i) => {
    const delta = ops[i].rotation;
    if (delta % 360 !== 0) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((((current + delta) % 360) + 360) % 360));
    }
    out.addPage(page);
  });
  return out.save();
}

/** Número de páginas de un PDF. */
export async function getPageCount(file: File): Promise<number> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.load(await file.arrayBuffer());
  return doc.getPageCount();
}

export interface PageThumb {
  index: number;
  dataUrl: string;
}

/**
 * Renderiza miniaturas de cada página con pdf.js. `scale` controla la resolución (pequeña
 * para que sea liviano). pdf.js separa el buffer, por eso se le pasa una copia.
 */
export async function renderThumbnails(file: File, scale = 0.4): Promise<PageThumb[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;
  const thumbs: PageThumb[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      thumbs.push({ index: i - 1, dataUrl: canvas.toDataURL('image/jpeg', 0.7) });
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }
  return thumbs;
}

/** Descarga unos bytes PDF como archivo. */
export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

/** ¿Es un archivo PDF aceptable? */
export function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
