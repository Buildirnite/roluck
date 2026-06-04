import { useEffect, useState } from 'react';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import DropZone from '../DropZone';
import { formatBytes } from '../../utils/imageUtils';
import { useI18n } from '../../i18n/I18nContext';

/** Herramienta "Base64 / Data URI": codifica el archivo tal cual como data URI. */
export default function Base64Tool({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [dataUri, setDataUri] = useState<string>('');
  const [copied, setCopied] = useState<'uri' | 'css' | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      setDataUri('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);

    const reader = new FileReader();
    reader.onload = () => setDataUri(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => onError(t.base64Tool.errRead);
    reader.readAsDataURL(file);

    return () => URL.revokeObjectURL(url);
  }, [file, onError]);

  function copy(text: string, which: 'uri' | 'css') {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  if (!file) {
    return <DropZone onFiles={(f) => setFile(f[0])} onError={onError} />;
  }

  const cssSnippet = `background-image: url("${dataUri}");`;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-border bg-bg-surface">
          {preview && <img src={preview} alt="" className="max-h-[40vh] w-full object-contain" />}
        </div>
        <p className="font-mono text-xs text-text-muted">
          {t.base64Tool.sizeLine(file.name, formatBytes(file.size), formatBytes(Math.round(dataUri.length)))}
        </p>
        <p className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-2 text-xs text-text-muted">
          {t.base64Tool.note}
        </p>
        <button
          type="button"
          onClick={() => setFile(null)}
          className="min-h-[48px] rounded-xl border border-border bg-bg-surface px-6 font-display text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary"
        >
          {t.common.loadAnother}
        </button>
      </section>

      <section className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.base64Tool.dataUri}</span>
            <button
              type="button"
              onClick={() => copy(dataUri, 'uri')}
              className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80"
            >
              {copied === 'uri' ? <IconCheck size={14} stroke={2} /> : <IconCopy size={14} stroke={2} />}
              {copied === 'uri' ? t.common.copied : t.common.copy}
            </button>
          </div>
          <pre className="max-h-48 overflow-auto break-all p-4 font-mono text-xs text-text-primary">{dataUri}</pre>
        </div>

        <div className="rounded-xl border border-border bg-bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.base64Tool.css}</span>
            <button
              type="button"
              onClick={() => copy(cssSnippet, 'css')}
              className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80"
            >
              {copied === 'css' ? <IconCheck size={14} stroke={2} /> : <IconCopy size={14} stroke={2} />}
              {copied === 'css' ? t.common.copied : t.common.copy}
            </button>
          </div>
          <pre className="max-h-32 overflow-auto break-all p-4 font-mono text-xs text-text-primary">{cssSnippet}</pre>
        </div>
      </section>
    </div>
  );
}
