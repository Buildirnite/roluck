import { useState } from 'react';
import ReactCrop, { centerCrop, type Crop, type PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { applyRegionEffect, type RegionMode } from '../utils/editUtils';
import { useI18n } from '../i18n/I18nContext';
import { useModal } from '../hooks/useModal';

interface RegionModalProps {
  file: File;
  imageSrc: string;
  /** 'obscure' → difuminar/pixelar (con intensidad); 'redact' → caja negra. */
  kind: 'obscure' | 'redact';
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

/** Selecciona una región y le aplica un efecto (difuminar / pixelar / redacción). */
export default function RegionModal({ file, imageSrc, kind, onCancel, onConfirm }: RegionModalProps) {
  const { t } = useI18n();
  const [crop, setCrop] = useState<Crop>();
  const [completed, setCompleted] = useState<PercentCrop | null>(null);
  const [mode, setMode] = useState<RegionMode>(kind === 'redact' ? 'redact' : 'blur');
  const [intensity, setIntensity] = useState(12);
  const [working, setWorking] = useState(false);
  const dialogRef = useModal<HTMLDivElement>(onCancel);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const c = centerCrop({ unit: '%', width: 50, height: 40 }, width, height);
    setCrop(c);
    setCompleted(c);
  }

  async function handleConfirm() {
    if (!completed || completed.width === 0) return;
    setWorking(true);
    try {
      const region = { x: completed.x, y: completed.y, width: completed.width, height: completed.height };
      const result = await applyRegionEffect(file, region, mode, intensity);
      if (result) onConfirm(result);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div tabIndex={-1} className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-border bg-bg-surface p-4 focus:outline-none">
        <h3 className="font-display text-lg font-semibold text-text-primary">
          {kind === 'redact' ? t.region.redaction : t.region.blurPixelate}
        </h3>
        <p className="text-xs text-text-muted">{kind === 'redact' ? t.region.selectRedact : t.region.selectObscure}</p>

        <div className="checkerboard flex max-h-[55vh] items-center justify-center overflow-auto rounded-xl bg-bg-primary p-2">
          <ReactCrop crop={crop} onChange={(_, p) => setCrop(p)} onComplete={(_, p) => setCompleted(p)}>
            <img src={imageSrc} alt={t.region.selectAlt} onLoad={onImageLoad} style={{ maxHeight: '50vh', width: 'auto' }} />
          </ReactCrop>
        </div>

        {kind === 'obscure' && (
          <>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode('blur')} className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${mode === 'blur' ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-bg-elevated text-text-muted'}`}>
                {t.region.blur}
              </button>
              <button type="button" onClick={() => setMode('pixelate')} className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${mode === 'pixelate' ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-bg-elevated text-text-muted'}`}>
                {t.region.pixelate}
              </button>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="uppercase tracking-wide text-text-muted">{t.region.intensity}</span>
                <span className="font-mono text-accent">{intensity}</span>
              </div>
              <input type="range" min={2} max={40} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-full" />
            </div>
          </>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={working} className="min-h-[48px] flex-1 rounded-xl border border-border bg-bg-elevated px-6 text-sm font-medium text-text-muted hover:text-text-primary disabled:opacity-40">
            {t.common.cancel}
          </button>
          <button type="button" onClick={handleConfirm} disabled={working || !completed} className="min-h-[48px] flex-1 rounded-xl bg-accent px-6 text-sm font-semibold text-bg-primary hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-text-muted">
            {working ? t.region.applying : t.common.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
