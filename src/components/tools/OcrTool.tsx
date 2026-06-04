import { useEffect, useState } from 'react';
import { IconCopy, IconCheck, IconDownload } from '@tabler/icons-react';
import DropZone from '../DropZone';
import { downloadBlob } from '../../utils/imageUtils';
import { track } from '../../analytics';
import { useI18n } from '../../i18n/I18nContext';

type Lang = 'spa' | 'eng' | 'spa+eng';

const LANGS: { id: Lang; key: 'langEs' | 'langEn' | 'langBoth' }[] = [
  { id: 'spa', key: 'langEs' },
  { id: 'eng', key: 'langEn' },
  { id: 'spa+eng', key: 'langBoth' },
];

/**
 * Herramienta "OCR": extrae texto con tesseract.js. La librería es pesada y descarga
 * sus datos de idioma desde un CDN, por eso se importa de forma diferida (solo cuando
 * el usuario ejecuta el reconocimiento).
 */
export default function OcrTool({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<Lang>('spa');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

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

  async function runOcr() {
    if (!file) return;
    setBusy(true);
    setText('');
    setProgress(0);
    setStatus(t.ocrTool.loadingEngine);
    onError(null);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(lang, 1, {
        logger: (m: { status: string; progress: number }) => {
          setStatus(m.status);
          setProgress(m.progress);
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setText(data.text.trim());
      track('ocr_used'); // métrica de uso (no se envía el texto extraído)
      if (!data.text.trim()) onError(t.ocrTool.noText);
    } catch (e) {
      onError(e instanceof Error ? e.message : t.ocrTool.errOcr);
    } finally {
      setBusy(false);
      setStatus('');
    }
  }

  function copy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (!file) {
    return <DropZone onFiles={(f) => setFile(f[0])} onError={onError} />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-border bg-bg-surface">
          {preview && <img src={preview} alt="" className="max-h-[45vh] w-full object-contain" />}
        </div>

        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="mb-2 text-sm font-semibold text-text-primary">{t.ocrTool.langTitle}</p>
          <div className="flex flex-wrap gap-2">
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLang(l.id)}
                disabled={busy}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  lang === l.id
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-bg-elevated text-text-muted hover:text-text-primary'
                }`}
              >
                {t.ocrTool[l.key]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void runOcr()}
          disabled={busy}
          className="min-h-[48px] rounded-xl border border-accent bg-accent/10 px-6 font-display text-base font-semibold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
        >
          {busy ? t.ocrTool.progress(status || t.common.processing.replace('…', ''), Math.round(progress * 100)) : t.ocrTool.extractText}
        </button>
        {busy && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setFile(null);
            setText('');
          }}
          className="min-h-[48px] rounded-xl border border-border bg-bg-surface px-6 font-display text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary"
        >
          {t.common.loadAnother}
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{t.ocrTool.resultTitle}</h2>
          {text && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={copy}
                className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80"
              >
                {copied ? <IconCheck size={14} stroke={2} /> : <IconCopy size={14} stroke={2} />}
                {copied ? t.common.copied : t.common.copy}
              </button>
              <button
                type="button"
                onClick={() => downloadBlob(new Blob([text], { type: 'text/plain' }), 'texto-extraido.txt')}
                className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80"
              >
                <IconDownload size={14} stroke={2} />
                .txt
              </button>
            </div>
          )}
        </div>
        <textarea
          value={text}
          readOnly
          placeholder={t.ocrTool.placeholder}
          className="min-h-[300px] flex-1 resize-none rounded-xl border border-border bg-bg-surface p-4 font-mono text-sm text-text-primary outline-none focus:border-accent"
        />
      </section>
    </div>
  );
}
