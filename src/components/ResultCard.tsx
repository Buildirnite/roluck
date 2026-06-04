import type { ConversionResult } from '../types';
import { formatBytes, savingsPercent } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';
import FormatBadge from './FormatBadge';

interface ResultCardProps {
  result: ConversionResult;
  /** Tamaño del archivo original, para calcular el ahorro. */
  originalBytes: number;
}

/** Tarjeta con la preview del resultado, su tamaño y la descarga. */
export default function ResultCard({ result, originalBytes }: ResultCardProps) {
  const { t } = useI18n();
  const savings = savingsPercent(originalBytes, result.sizeBytes);

  // Descarga programática: creamos un <a> temporal y simulamos el click.
  function handleDownload() {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="checkerboard flex items-center justify-center overflow-hidden rounded-xl border border-accent/40 p-2">
        <img
          src={result.url}
          alt={t.result.altResult}
          className="max-h-[280px] w-auto max-w-full rounded-md object-contain"
        />
      </div>

      <div className="rounded-xl border border-border bg-bg-surface px-4 py-3">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2">
          <span className="text-xs uppercase tracking-wide text-text-muted">
            {t.result.format}
          </span>
          <FormatBadge mime={result.mimeType} variant="accent" />
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2">
          <span className="text-xs uppercase tracking-wide text-text-muted">
            {t.result.size}
          </span>
          <span className="font-mono text-sm text-text-primary">
            {formatBytes(result.sizeBytes)}
          </span>
        </div>
        {result.qualityUsed !== undefined && (
          <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2">
            <span className="text-xs uppercase tracking-wide text-text-muted">
              {t.result.quality}
            </span>
            <span className="font-mono text-sm text-text-primary">
              {result.qualityUsed}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 py-2">
          <span className="text-xs uppercase tracking-wide text-text-muted">
            {t.result.change}
          </span>
          {savings > 0 ? (
            <span className="font-mono text-sm font-semibold text-success">
              {t.result.saved(savings)}
            </span>
          ) : savings < 0 ? (
            <span className="font-mono text-sm text-text-muted">
              {t.result.larger(Math.abs(savings))}
            </span>
          ) : (
            <span className="font-mono text-sm text-text-muted">{t.result.noChange}</span>
          )}
        </div>
      </div>

      {/* Badge de privacidad: la conversión por canvas elimina el EXIF (Función 11). */}
      <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-xs text-success">
        <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <span>{t.result.exifRemoved}</span>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 px-6 font-display text-base font-semibold text-accent transition-colors hover:bg-accent/20"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v12" />
          <path d="M7 11l5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
        {t.result.downloadFile(result.filename)}
      </button>
    </div>
  );
}
