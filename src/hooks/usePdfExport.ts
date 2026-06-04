import { useCallback, useState } from 'react';
import type { PdfOptions } from '../types';
import { renderToCanvas } from '../utils/canvasUtils';
import { loadImageFile } from '../utils/heicDecoder';
import { track } from '../analytics';

interface UsePdfExport {
  isGenerating: boolean;
  generate: (files: File[], options: PdfOptions) => Promise<void>;
}

/**
 * Hook para exportar una o varias imágenes a un único PDF multipágina (Función 7).
 * Una imagen por página, centrada y escalada para entrar manteniendo proporción.
 * Cada imagen se rasteriza a JPEG (fondo blanco) para mantener el PDF liviano.
 */
export function usePdfExport(): UsePdfExport {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (files: File[], options: PdfOptions) => {
    if (files.length === 0) return;
    setIsGenerating(true);

    try {
      // Preparamos cada imagen como dataURL JPEG + sus dimensiones reales.
      const pages: { dataUrl: string; width: number; height: number }[] = [];
      for (const file of files) {
        const img = await loadImageFile(file);
        const canvas = renderToCanvas(img, { fillBackground: '#ffffff' });
        if (!canvas) continue;
        pages.push({
          dataUrl: canvas.toDataURL('image/jpeg', 0.92),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
      if (pages.length === 0) return;

      // Lazy import: jsPDF (+ sus deps) solo se descarga al generar el primer PDF.
      const { jsPDF } = await import('jspdf');

      // Orientación: "auto" usa la forma de la primera imagen.
      const orientation =
        options.orientation === 'auto'
          ? pages[0].width >= pages[0].height
            ? 'landscape'
            : 'portrait'
          : options.orientation;

      const pdf = new jsPDF({
        orientation,
        unit: 'pt',
        format: options.pageSize,
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;

      pages.forEach((page, index) => {
        if (index > 0) pdf.addPage();

        // Escalamos para entrar en la página manteniendo proporción.
        const ratio = Math.min(maxW / page.width, maxH / page.height);
        const w = page.width * ratio;
        const h = page.height * ratio;
        const x = (pageW - w) / 2; // centrar horizontal
        const y = (pageH - h) / 2; // centrar vertical

        pdf.addImage(page.dataUrl, 'JPEG', x, y, w, h);
      });

      const filename = options.filename.trim() || 'roluck-imagenes';
      pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
      // Métrica de uso: número de páginas (sin contenido ni nombre del archivo).
      track('pdf_generated', { pages: pages.length });
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { isGenerating, generate };
}
