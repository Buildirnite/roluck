import { useEffect, useState } from 'react';
import { IconMapPin } from '@tabler/icons-react';
import DropZone from '../DropZone';
import { readExif, type ExifResult } from '../../utils/exifReader';
import { formatBytes } from '../../utils/imageUtils';
import { useI18n } from '../../i18n/I18nContext';

/** Herramienta "Visor EXIF": muestra los metadatos antes de eliminarlos al convertir. */
export default function ExifTool({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [exif, setExif] = useState<ExifResult | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      setExif(null);
      setDims(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);

    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;

    onError(null);
    readExif(file)
      .then(setExif)
      .catch((e) => onError(e instanceof Error ? e.message : t.exifTool.errRead));

    return () => URL.revokeObjectURL(url);
  }, [file, onError]);

  if (!file) {
    return <DropZone onFiles={(f) => setFile(f[0])} onError={onError} />;
  }

  const hasExif = exif && exif.entries.length > 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-border bg-bg-surface">
          {preview && <img src={preview} alt="" className="max-h-[50vh] w-full object-contain" />}
        </div>
        <button
          type="button"
          onClick={() => setFile(null)}
          className="min-h-[48px] rounded-xl border border-border bg-bg-surface px-6 font-display text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary"
        >
          {t.common.loadAnother}
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{t.exifTool.metadata}</h2>

        {/* Básicos del archivo, siempre disponibles. */}
        <dl className="overflow-hidden rounded-xl border border-border bg-bg-surface text-sm">
          <Row label={t.exifTool.file} value={file.name} />
          <Row label={t.exifTool.size} value={formatBytes(file.size)} />
          <Row label={t.exifTool.type} value={file.type || '—'} />
          {dims && <Row label={t.exifTool.dimensions} value={`${dims.w} × ${dims.h} px`} />}
        </dl>

        {hasExif ? (
          <dl className="overflow-hidden rounded-xl border border-border bg-bg-surface text-sm">
            {exif!.entries.map((e, i) => (
              <Row key={`${e.label}-${i}`} label={e.label} value={e.value} />
            ))}
          </dl>
        ) : (
          <p className="rounded-xl border border-border bg-bg-surface px-4 py-3 text-xs text-text-muted">
            {t.exifTool.noExif}
          </p>
        )}

        {exif?.gps && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${exif.gps.lat}&mlon=${exif.gps.lon}#map=15/${exif.gps.lat}/${exif.gps.lon}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 px-6 font-display text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
          >
            <IconMapPin size={18} stroke={2} />
            {t.exifTool.viewOnMap}
          </a>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-2 last:border-b-0">
      <dt className="flex-shrink-0 text-text-muted">{label}</dt>
      <dd className="break-all text-right font-mono text-text-primary">{value}</dd>
    </div>
  );
}
