import type { ImageMetadata } from '../types';
import { formatBytes } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';
import FormatBadge from './FormatBadge';

interface ImagePreviewProps {
  src: string;
  metadata: ImageMetadata | null;
  /** Valor CSS `filter` para previsualizar ajustes en vivo (ej. filtros). */
  filter?: string;
}

/** Fila de metadato con etiqueta + valor monoespaciado. */
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs uppercase tracking-wide text-text-muted">{label}</span>
      <span className="font-mono text-sm text-text-primary">{value}</span>
    </div>
  );
}

/** Muestra la imagen original junto con su metadata detectada. */
export default function ImagePreview({ src, metadata, filter }: ImagePreviewProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-4">
      <div className="checkerboard flex items-center justify-center overflow-hidden rounded-xl border border-border p-2">
        <img
          src={src}
          alt={t.imagePreview.alt}
          className="max-h-[280px] w-auto max-w-full rounded-md object-contain"
          style={filter ? { filter } : undefined}
        />
      </div>

      <div className="rounded-xl border border-border bg-bg-surface px-4 py-2">
        {metadata ? (
          <>
            <MetaRow label={t.imagePreview.name} value={metadata.name} />
            <MetaRow
              label={t.imagePreview.dimensions}
              value={`${metadata.width} × ${metadata.height} px`}
            />
            <MetaRow label={t.imagePreview.size} value={formatBytes(metadata.sizeBytes)} />
            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-xs uppercase tracking-wide text-text-muted">
                {t.imagePreview.format}
              </span>
              <FormatBadge mime={metadata.format} />
            </div>
          </>
        ) : (
          <p className="py-3 text-sm text-text-muted">{t.imagePreview.readingMeta}</p>
        )}
      </div>
    </div>
  );
}
