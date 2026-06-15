import { useState } from 'react';
import {
  IconRotateClockwise,
  IconArrowLeft,
  IconArrowRight,
  IconTrash,
  IconDownload,
  IconFileTypePdf,
  IconRestore,
} from '@tabler/icons-react';
import { useI18n } from '../../i18n/I18nContext';
import { track } from '../../analytics';
import { renderThumbnails, organizePdf, downloadPdf, isPdf, type PageThumb } from '../../utils/pdfTools';

interface Page {
  /** Índice original en el PDF. */
  index: number;
  rotation: number;
  dataUrl: string;
}

/**
 * Pestaña "Organizar páginas": carga un PDF, muestra miniaturas (pdf.js) y permite rotar,
 * eliminar y reordenar páginas; al exportar reconstruye el PDF con pdf-lib.
 */
export default function OrganizePdf() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load(f: File) {
    if (!isPdf(f)) {
      setError(t.pdfTools.notPdf);
      return;
    }
    setError('');
    setLoading(true);
    setFile(f);
    try {
      const thumbs: PageThumb[] = await renderThumbnails(f);
      setPages(thumbs.map((th) => ({ index: th.index, rotation: 0, dataUrl: th.dataUrl })));
    } catch {
      setError(t.pdfTools.error);
      setFile(null);
    } finally {
      setLoading(false);
    }
  }

  function rotate(i: number) {
    setPages((prev) => prev.map((p, idx) => (idx === i ? { ...p, rotation: (p.rotation + 90) % 360 } : p)));
  }
  function move(i: number, dir: -1 | 1) {
    setPages((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function remove(i: number) {
    setPages((prev) => prev.filter((_, idx) => idx !== i));
  }
  function reset() {
    setFile(null);
    setPages([]);
    setError('');
  }

  async function exportPdf() {
    if (!file || pages.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const bytes = await organizePdf(file, pages.map((p) => ({ index: p.index, rotation: p.rotation })));
      downloadPdf(bytes, 'roluck-organizado.pdf');
      track('pdf_organized', { pages: pages.length });
    } catch {
      setError(t.pdfTools.error);
    } finally {
      setBusy(false);
    }
  }

  if (!file && !loading) {
    return (
      <div className="flex flex-col gap-4">
        {error && <p className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">{error}</p>}
        <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg-surface px-4 text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary">
          <IconFileTypePdf size={28} className="text-accent" />
          {t.pdfTools.selectPdf}
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void load(f); }} />
        </label>
      </div>
    );
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-text-muted">{t.pdfTools.rendering}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-text-muted">{t.pdfTools.pagesCount(pages.length)}</p>
        <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-surface px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary">
          <IconRestore size={14} stroke={1.8} />
          {t.pdfTools.otherFile}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {pages.map((p, i) => (
          <div key={`${p.index}-${i}`} className="flex flex-col gap-2 rounded-xl border border-border bg-bg-surface p-2">
            <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded bg-white">
              <img
                src={p.dataUrl}
                alt={`${i + 1}`}
                className="max-h-full max-w-full object-contain transition-transform"
                style={{ transform: `rotate(${p.rotation}deg)` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-muted">{i + 1}</span>
              <div className="flex gap-0.5">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t.pdfTools.moveUp} className="flex h-8 w-8 items-center justify-center rounded text-text-muted transition-colors hover:text-accent disabled:opacity-30">
                  <IconArrowLeft size={14} stroke={1.8} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === pages.length - 1} aria-label={t.pdfTools.moveDown} className="flex h-8 w-8 items-center justify-center rounded text-text-muted transition-colors hover:text-accent disabled:opacity-30">
                  <IconArrowRight size={14} stroke={1.8} />
                </button>
                <button type="button" onClick={() => rotate(i)} aria-label={t.pdfTools.rotate} className="flex h-8 w-8 items-center justify-center rounded text-text-muted transition-colors hover:text-accent">
                  <IconRotateClockwise size={14} stroke={1.8} />
                </button>
                <button type="button" onClick={() => remove(i)} aria-label={t.pdfTools.remove} className="flex h-8 w-8 items-center justify-center rounded text-text-muted transition-colors hover:text-red-400">
                  <IconTrash size={14} stroke={1.8} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={exportPdf}
        disabled={busy || pages.length === 0}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-bg-base transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <IconDownload size={17} stroke={1.8} />
        {busy ? t.pdfTools.processing : t.pdfTools.exportBtn}
      </button>
    </div>
  );
}
