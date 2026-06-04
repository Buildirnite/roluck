import type { OutputFormat } from '../types';
import { formatLabel } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';

interface ConversionPanelProps {
  format: OutputFormat;
  quality: number;
  onFormatChange: (format: OutputFormat) => void;
  onQualityChange: (quality: number) => void;
  /** Avisos de pérdida de datos según el origen/destino (texto plano). */
  warnings: string[];
  /** Oculta el slider de calidad (ej: cuando el modo peso objetivo está activo). */
  hideQuality?: boolean;
  /** Restringe los formatos de salida ofrecidos (por defecto, los cuatro). */
  formats?: OutputFormat[];
}

const ALL_OUTPUT_FORMATS: OutputFormat[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
];

/** El slider de calidad solo aplica a formatos con pérdida. */
function supportsQuality(format: OutputFormat): boolean {
  return format === 'image/jpeg' || format === 'image/webp' || format === 'image/avif';
}

/** Panel para elegir formato destino y, si aplica, la calidad. */
export default function ConversionPanel({
  format,
  quality,
  onFormatChange,
  onQualityChange,
  warnings,
  hideQuality,
  formats = ALL_OUTPUT_FORMATS,
}: ConversionPanelProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-bg-surface p-4">
      {/* Selector de formato destino */}
      <div>
        <label className="mb-2 block text-xs uppercase tracking-wide text-text-muted">
          {t.conversion.targetFormat}
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {formats.map((f) => {
            const active = f === format;
            return (
              <button
                key={f}
                type="button"
                onClick={() => onFormatChange(f)}
                className={`min-h-[48px] rounded-lg border font-mono text-sm font-medium transition-colors ${
                  active
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-bg-elevated text-text-muted hover:border-accent/40 hover:text-text-primary'
                }`}
              >
                {formatLabel(f)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slider de calidad — solo JPEG / WebP, oculto si hay peso objetivo */}
      {supportsQuality(format) && !hideQuality && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="quality"
              className="text-xs uppercase tracking-wide text-text-muted"
            >
              {t.conversion.quality}
            </label>
            <span className="font-mono text-sm text-accent">{quality}</span>
          </div>
          <input
            id="quality"
            type="range"
            min={0}
            max={100}
            value={quality}
            onChange={(e) => onQualityChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Aviso específico de AVIF */}
      {format === 'image/avif' && (
        <p className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-text-primary">
          {t.conversion.avifNote}
        </p>
      )}

      {/* Avisos de pérdida de datos */}
      {warnings.length > 0 && (
        <ul className="flex flex-col gap-2">
          {warnings.map((w) => (
            <li
              key={w}
              className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-text-primary"
            >
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
