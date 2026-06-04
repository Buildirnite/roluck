import { useEffect, useState } from 'react';
import { IconDownload, IconCopy, IconCheck } from '@tabler/icons-react';
import QueuePicker from '../QueuePicker';
import { useAppStore } from '../../store/useAppStore';
import { buildSpritesheet, type SpritesheetResult } from '../../utils/createUtils';
import { downloadBlob, formatBytes } from '../../utils/imageUtils';
import { useI18n } from '../../i18n/I18nContext';

/** Herramienta "Spritesheet": compone la cola en una hoja de sprites + CSS. */
export default function SpritesheetTool({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useI18n();
  const queue = useAppStore((s) => s.queue);
  const [columns, setColumns] = useState(4);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SpritesheetResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!result) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(result.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [result]);

  useEffect(() => setResult(null), [queue]);

  async function handleBuild() {
    if (queue.length === 0) return;
    setBusy(true);
    onError(null);
    try {
      const res = await buildSpritesheet(
        queue.map((q) => q.file),
        columns,
      );
      setResult(res);
    } catch (e) {
      onError(e instanceof Error ? e.message : t.spriteTool.errCreate);
    } finally {
      setBusy(false);
    }
  }

  function copyCss() {
    if (!result) return;
    void navigator.clipboard.writeText(result.css).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-4">
        <QueuePicker hint={t.spriteTool.hint} onError={onError} />

        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-text-primary">{t.spriteTool.columns}</span>
            <input
              type="number"
              min={1}
              max={16}
              value={columns}
              onChange={(e) => setColumns(Math.max(1, Math.min(16, Number(e.target.value))))}
              className="w-24 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 font-mono text-sm text-text-primary outline-none focus:border-accent"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void handleBuild()}
          disabled={busy || queue.length === 0}
          className="min-h-[48px] rounded-xl border border-accent bg-accent/10 px-6 font-display text-base font-semibold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
        >
          {busy ? t.spriteTool.creating : t.spriteTool.create}
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex min-h-[160px] items-center justify-center overflow-hidden rounded-xl border border-border bg-bg-surface p-2 [background-image:linear-gradient(45deg,#1a1a1a_25%,transparent_25%),linear-gradient(-45deg,#1a1a1a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1a1a1a_75%),linear-gradient(-45deg,transparent_75%,#1a1a1a_75%)] [background-position:0_0,0_10px,10px_-10px,-10px_0] [background-size:20px_20px]">
          {url ? (
            <img src={url} alt={t.spriteTool.alt} className="max-h-[50vh] w-full object-contain" />
          ) : (
            <p className="text-sm text-text-muted">{t.spriteTool.willAppear}</p>
          )}
        </div>

        {result && (
          <>
            <p className="font-mono text-xs text-text-muted">
              {t.spriteTool.info(result.columns, result.rows, result.frameWidth, result.frameHeight, result.count)}
            </p>
            <button
              type="button"
              onClick={() => downloadBlob(result.blob, 'spritesheet.png')}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 px-6 font-display text-base font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              <IconDownload size={18} stroke={2} />
              {t.spriteTool.download(formatBytes(result.blob.size))}
            </button>

            <div className="rounded-xl border border-border bg-bg-surface">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.base64Tool.css}</span>
                <button
                  type="button"
                  onClick={copyCss}
                  className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80"
                >
                  {copied ? <IconCheck size={14} stroke={2} /> : <IconCopy size={14} stroke={2} />}
                  {copied ? t.common.copied : t.common.copy}
                </button>
              </div>
              <pre className="max-h-48 overflow-auto p-4 font-mono text-xs text-text-primary">{result.css}</pre>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
