import { useEffect, useState } from 'react';
import { IconDownload } from '@tabler/icons-react';
import QueuePicker from '../QueuePicker';
import { useAppStore } from '../../store/useAppStore';
import { buildCollage } from '../../utils/createUtils';
import { downloadBlob, formatBytes } from '../../utils/imageUtils';
import { useI18n } from '../../i18n/I18nContext';

/** Herramienta "Collage": combina las imágenes de la cola en un lienzo en cuadrícula. */
export default function CollageTool({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useI18n();
  const queue = useAppStore((s) => s.queue);
  const [columns, setColumns] = useState(3);
  const [cellSize, setCellSize] = useState(400);
  const [gap, setGap] = useState(16);
  const [background, setBackground] = useState('#0a0a0a');
  const [busy, setBusy] = useState(false);
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

  // El resultado queda obsoleto si cambia la cola.
  useEffect(() => setResult(null), [queue]);

  async function handleBuild() {
    if (queue.length === 0) return;
    setBusy(true);
    onError(null);
    try {
      const blob = await buildCollage(
        queue.map((q) => q.file),
        { columns, cellSize, gap, background },
      );
      setResult(blob);
    } catch (e) {
      onError(e instanceof Error ? e.message : t.collageTool.errCreate);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-4">
        <QueuePicker hint={t.collageTool.hint} onError={onError} />

        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="mb-3 text-sm font-semibold text-text-primary">{t.collageTool.design}</p>
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-text-muted">{t.collageTool.columns}</span>
              <input
                type="number"
                min={1}
                max={8}
                value={columns}
                onChange={(e) => setColumns(Math.max(1, Math.min(8, Number(e.target.value))))}
                className="w-24 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 font-mono text-sm text-text-primary outline-none focus:border-accent"
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-text-muted">{t.collageTool.cellSize}</span>
              <input
                type="number"
                min={50}
                max={1000}
                step={50}
                value={cellSize}
                onChange={(e) => setCellSize(Math.max(50, Math.min(1000, Number(e.target.value))))}
                className="w-24 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 font-mono text-sm text-text-primary outline-none focus:border-accent"
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-text-muted">{t.collageTool.gap}</span>
              <input
                type="number"
                min={0}
                max={100}
                value={gap}
                onChange={(e) => setGap(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-24 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 font-mono text-sm text-text-primary outline-none focus:border-accent"
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-text-muted">{t.collageTool.background}</span>
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="h-9 w-24 cursor-pointer rounded-lg border border-border bg-bg-elevated"
              />
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleBuild()}
          disabled={busy || queue.length === 0}
          className="min-h-[48px] rounded-xl border border-accent bg-accent/10 px-6 font-display text-base font-semibold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
        >
          {busy ? t.collageTool.creating : t.collageTool.create}
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl border border-border bg-bg-surface p-2">
          {url ? (
            <img src={url} alt={t.collageTool.alt} className="max-h-[60vh] w-full object-contain" />
          ) : (
            <p className="text-sm text-text-muted">{t.collageTool.willAppear}</p>
          )}
        </div>
        {result && (
          <button
            type="button"
            onClick={() => downloadBlob(result, 'roluck-collage.png')}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 px-6 font-display text-base font-semibold text-accent transition-colors hover:bg-accent/20"
          >
            <IconDownload size={18} stroke={2} />
            {t.collageTool.download(formatBytes(result.size))}
          </button>
        )}
      </section>
    </div>
  );
}
