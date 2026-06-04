import { useEffect, useState } from 'react';
import { IconDownload } from '@tabler/icons-react';
import QueuePicker from '../QueuePicker';
import { useAppStore } from '../../store/useAppStore';
import { encodeGif } from '../../utils/gifEncoder';
import { downloadBlob, formatBytes } from '../../utils/imageUtils';
import { useI18n } from '../../i18n/I18nContext';

/** Herramienta "GIF animado": combina los frames de la cola en un GIF. */
export default function GifTool({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useI18n();
  const queue = useAppStore((s) => s.queue);
  const [delay, setDelay] = useState(200); // ms por frame
  const [quality, setQuality] = useState(10); // 1 mejor – 30 peor
  const [loop, setLoop] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);

  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!result) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(result);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [result]);

  useEffect(() => setResult(null), [queue]);

  async function handleBuild() {
    if (queue.length < 2) return;
    setBusy(true);
    setProgress(0);
    onError(null);
    try {
      const blob = await encodeGif(
        queue.map((q) => q.file),
        { delay, quality, repeat: loop ? 0 : -1, onProgress: setProgress },
      );
      setResult(blob);
    } catch (e) {
      onError(e instanceof Error ? e.message : t.gifTool.errGen);
    } finally {
      setBusy(false);
    }
  }

  const fps = (1000 / delay).toFixed(1);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-4">
        <QueuePicker numbered hint={t.gifTool.hint} onError={onError} />

        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="mb-3 text-sm font-semibold text-text-primary">{t.gifTool.animation}</p>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="flex items-center justify-between text-sm text-text-muted">
                {t.gifTool.durationPerFrame}
                <span className="font-mono text-text-primary">{delay} ms · {fps} fps</span>
              </span>
              <input
                type="range"
                min={40}
                max={1000}
                step={20}
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="accent-accent"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="flex items-center justify-between text-sm text-text-muted">
                {t.gifTool.quality}
                <span className="font-mono text-text-primary">{quality <= 5 ? t.gifTool.qHigh : quality <= 15 ? t.gifTool.qMed : t.gifTool.qLow}</span>
              </span>
              <input
                type="range"
                min={1}
                max={30}
                value={31 - quality}
                onChange={(e) => setQuality(31 - Number(e.target.value))}
                className="accent-accent"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{t.gifTool.loop}</span>
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleBuild()}
          disabled={busy || queue.length < 2}
          className="min-h-[48px] rounded-xl border border-accent bg-accent/10 px-6 font-display text-base font-semibold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
        >
          {busy ? t.gifTool.generating(Math.round(progress * 100)) : t.gifTool.create}
        </button>

        {busy && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl border border-border bg-bg-surface p-2">
          {url ? (
            <img src={url} alt={t.gifTool.alt} className="max-h-[60vh] w-full object-contain" />
          ) : (
            <p className="text-sm text-text-muted">
              {queue.length < 2 ? t.gifTool.atLeast2 : t.gifTool.willAppear}
            </p>
          )}
        </div>
        {result && (
          <button
            type="button"
            onClick={() => downloadBlob(result, 'roluck-animacion.gif')}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 px-6 font-display text-base font-semibold text-accent transition-colors hover:bg-accent/20"
          >
            <IconDownload size={18} stroke={2} />
            {t.gifTool.download(formatBytes(result.size))}
          </button>
        )}
      </section>
    </div>
  );
}
