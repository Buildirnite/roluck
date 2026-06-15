import { useEffect, useRef, useState } from 'react';
import type { OutputFormat } from '../types';
import { canvasToBlob, renderToCanvas } from '../utils/canvasUtils';
import { loadImageFile } from '../utils/heicDecoder';
import { encodeAvif } from '../utils/avifEncoder';
import { extensionFor, formatBytes, formatLabel, savingsPercent } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';

interface FormatComparisonProps {
  file: File | null;
  quality: number;
  originalBytes: number;
  originalName: string | null;
}

interface CandidateResult {
  format: OutputFormat;
  blob: Blob;
  url: string;
  size: number;
}

const CANDIDATES: OutputFormat[] = ['image/jpeg', 'image/webp', 'image/avif'];

/**
 * Comparador inteligente: codifica la imagen activa a JPEG, WebP y AVIF con la
 * misma calidad y muestra los pesos lado a lado para elegir el mejor formato.
 */
export default function FormatComparison({
  file,
  quality,
  originalBytes,
  originalName,
}: FormatComparisonProps) {
  const { t } = useI18n();
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlsRef = useRef<string[]>([]);

  const revokeAll = () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
  };

  // Limpiar resultados al cambiar la imagen o desmontar.
  useEffect(() => {
    setResults([]);
    setError(null);
    revokeAll();
  }, [file]);
  useEffect(() => () => revokeAll(), []);

  async function compare() {
    if (!file) return;
    setBusy(true);
    setError(null);
    revokeAll();
    try {
      const img = await loadImageFile(file);
      const out: CandidateResult[] = [];
      for (const format of CANDIDATES) {
        const canvas = renderToCanvas(img, {
          fillBackground: format === 'image/jpeg' ? '#ffffff' : undefined,
        });
        if (!canvas) continue;
        const blob =
          format === 'image/avif'
            ? await encodeAvif(canvas, quality)
            : await canvasToBlob(canvas, format, quality / 100);
        if (!blob) continue;
        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);
        out.push({ format, blob, url, size: blob.size });
      }
      setResults(out);
    } catch {
      setError(t.formatCmp.error);
    } finally {
      setBusy(false);
    }
  }

  function download(r: CandidateResult) {
    const base = (originalName ?? 'imagen').replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = r.url;
    a.download = `${base}.${extensionFor(r.format)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const smallest = results.length ? Math.min(...results.map((r) => r.size)) : 0;

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{t.formatCmp.title}</span>
        <button
          type="button"
          onClick={compare}
          disabled={!file || busy}
          className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
        >
          {busy ? t.formatCmp.comparing : t.formatCmp.compare}
        </button>
      </div>
      <p className="mb-3 text-xs text-text-muted">
        {t.formatCmp.note(quality)}
      </p>

      {error && <p className="text-xs text-error">{error}</p>}

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((r) => {
            const best = r.size === smallest;
            const savings = savingsPercent(originalBytes, r.size);
            return (
              <div
                key={r.format}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                  best ? 'border-accent/50 bg-accent/10' : 'border-border bg-bg-elevated'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-text-primary">
                    {formatLabel(r.format)}
                  </span>
                  {best && (
                    <span className="rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent-ink">
                      {t.formatCmp.best}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-text-primary">{formatBytes(r.size)}</span>
                  {savings > 0 && (
                    <span className="font-mono text-xs text-success">−{savings}%</span>
                  )}
                  <button
                    type="button"
                    onClick={() => download(r)}
                    aria-label={`${t.common.download} ${formatLabel(r.format)}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-surface hover:text-accent"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
