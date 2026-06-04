import { useState } from 'react';
import type { OutputFormat } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { useBatchConverter } from '../hooks/useBatchConverter';
import { ACCEPT_ATTR, isAcceptedImage } from '../utils/imageUtils';
import DropZone from '../components/DropZone';
import ConversionPanel from '../components/ConversionPanel';
import PresetBar from '../components/PresetBar';
import TargetSizePanel, { type TargetSizeState } from '../components/TargetSizePanel';
import TransformPanel, { INITIAL_TRANSFORM, type TransformState } from '../components/TransformPanel';
import ConvertButton from '../components/ConvertButton';
import BatchList from '../components/BatchList';

const SCALE_OPTIONS = [100, 75, 50, 25] as const;

/** Ruta /lote — convertir varias imágenes y descargarlas en un ZIP. */
export default function BatchPage() {
  const { t } = useI18n();
  const batch = useBatchConverter();
  const [format, setFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState(85);
  const [transform, setTransform] = useState<TransformState>(INITIAL_TRANSFORM);
  const [targetSize, setTargetSize] = useState<TargetSizeState>({ enabled: false, kb: 500 });
  const [scale, setScale] = useState(100);
  const [localError, setLocalError] = useState<string | null>(null);

  const isLossy = format === 'image/jpeg' || format === 'image/webp';
  const targetActive = targetSize.enabled && isLossy;
  const allDone = batch.items.length > 0 && batch.doneCount === batch.items.length;

  function handleAddMore(list: FileList | null) {
    const accepted = Array.from(list ?? []).filter(isAcceptedImage);
    if (accepted.length === 0) {
      setLocalError(t.batch.rejectAll);
      return;
    }
    batch.addFiles(accepted);
  }

  function handleConvertAll() {
    void batch.convertAll(format, quality, {
      rotation: transform.rotation,
      flipH: transform.flipH,
      flipV: transform.flipV,
      targetBytes: targetActive ? targetSize.kb * 1024 : undefined,
      scalePercent: scale,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-xl font-bold tracking-tight">{t.pages.batch.title}</h1>
        <p className="mt-0.5 text-xs text-text-muted">{t.pages.batch.subtitle}</p>
      </header>

      {localError && (
        <div role="alert" className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {localError}
        </div>
      )}

      {batch.items.length === 0 ? (
        <DropZone onFiles={batch.addFiles} onError={setLocalError} multiple />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t.batch.settingsAll}
            </h2>
            <ConversionPanel
              format={format}
              quality={quality}
              onFormatChange={setFormat}
              onQualityChange={setQuality}
              warnings={[]}
              hideQuality={targetActive}
            />
            <TargetSizePanel state={targetSize} onChange={setTargetSize} supported={isLossy} />
            <PresetBar
              current={{ format, quality, targetKb: targetActive ? targetSize.kb : undefined }}
              onApply={(p) => {
                setFormat(p.format);
                setQuality(p.quality);
                setTargetSize(
                  p.targetKb !== undefined
                    ? { enabled: true, kb: p.targetKb }
                    : { ...targetSize, enabled: false },
                );
              }}
            />
            <div className="rounded-xl border border-border bg-bg-surface p-4">
              <label className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">{t.batch.scaleAll}</span>
                <select
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 font-mono text-sm text-text-primary outline-none focus:border-accent"
                >
                  {SCALE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}%</option>
                  ))}
                </select>
              </label>
            </div>
            <TransformPanel state={transform} onChange={setTransform} />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t.batch.queue(batch.items.length)}
            </h2>
            <BatchList items={batch.items} onRemove={batch.removeItem} disabled={batch.isProcessing} />

            <label className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg-surface px-4 text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t.common.addMore}
              <input type="file" accept={ACCEPT_ATTR} multiple className="hidden" onChange={(e) => { handleAddMore(e.target.files); e.target.value = ''; }} />
            </label>

            <ConvertButton onClick={handleConvertAll} isConverting={batch.isProcessing} label={t.batch.convertAll(batch.items.length)} />

            {allDone && (
              <button type="button" onClick={() => void batch.downloadZip()} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 px-6 font-display text-base font-semibold text-accent transition-colors hover:bg-accent/20">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" />
                </svg>
                {t.batch.downloadZip(batch.doneCount)}
              </button>
            )}

            <button type="button" onClick={batch.clear} disabled={batch.isProcessing} className="min-h-[48px] rounded-xl border border-border bg-bg-surface px-6 font-display text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary disabled:opacity-40">
              {t.batch.clearQueue}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
