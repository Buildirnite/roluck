import { useEffect, useState } from 'react';
import { IconCheck } from '@tabler/icons-react';
import DropZone from '../DropZone';
import { extractPalette, type SwatchColor } from '../../utils/colorPalette';
import { useI18n } from '../../i18n/I18nContext';

/** Herramienta "Paleta de colores": extrae los hex dominantes de la imagen. */
export default function PaletteTool({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(6);
  const [swatches, setSwatches] = useState<SwatchColor[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Recalcular al cambiar imagen o número de colores.
  useEffect(() => {
    if (!file) {
      setSwatches([]);
      return;
    }
    let alive = true;
    setBusy(true);
    onError(null);
    extractPalette(file, count)
      .then((s) => {
        if (alive) setSwatches(s);
      })
      .catch((e) => onError(e instanceof Error ? e.message : t.paletteTool.errRead))
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [file, count, onError]);

  function copyHex(hex: string) {
    void navigator.clipboard.writeText(hex).then(() => {
      setCopied(hex);
      setTimeout(() => setCopied(null), 1200);
    });
  }

  if (!file) {
    return <DropZone onFiles={(f) => setFile(f[0])} onError={onError} />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-border bg-bg-surface">
          {preview && <img src={preview} alt="" className="max-h-[50vh] w-full object-contain" />}
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-surface p-4">
          <span className="text-sm font-semibold text-text-primary">{t.paletteTool.colorCount}</span>
          <input
            type="number"
            min={2}
            max={12}
            value={count}
            onChange={(e) => setCount(Math.max(2, Math.min(12, Number(e.target.value))))}
            className="w-24 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 font-mono text-sm text-text-primary outline-none focus:border-accent"
          />
        </label>
        <button
          type="button"
          onClick={() => setFile(null)}
          className="min-h-[48px] rounded-xl border border-border bg-bg-surface px-6 font-display text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary"
        >
          {t.common.loadAnother}
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t.paletteTool.dominant} {busy && '· …'}
        </h2>
        <p className="mb-1 text-xs text-text-muted">{t.paletteTool.clickToCopy}</p>
        <div className="flex flex-col gap-2">
          {swatches.map((s) => (
            <button
              key={s.hex}
              type="button"
              onClick={() => copyHex(s.hex)}
              className="flex items-center gap-3 rounded-xl border border-border bg-bg-surface p-2 text-left transition-colors hover:border-accent/40"
            >
              <span
                className="h-10 w-10 flex-shrink-0 rounded-lg border border-border"
                style={{ backgroundColor: s.hex }}
              />
              <div className="flex-1">
                <p className="font-mono text-sm font-semibold uppercase text-text-primary">{s.hex}</p>
                <p className="font-mono text-xs text-text-muted">
                  rgb({s.rgb.join(', ')}) · {s.percent}%
                </p>
              </div>
              {copied === s.hex && (
                <span className="flex items-center gap-1 text-xs font-medium text-accent">
                  <IconCheck size={14} stroke={2} /> {t.common.copied}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
