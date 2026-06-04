import { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { IconDownload, IconCopy, IconCheck } from '@tabler/icons-react';
import DropZone from '../DropZone';
import { buildIco, buildPng, FAVICON_HTML_SNIPPET, FAVICON_MANIFEST } from '../../utils/icoEncoder';
import { downloadBlob } from '../../utils/imageUtils';
import { useI18n } from '../../i18n/I18nContext';

// Tamaños PNG que acompañan al .ico en el paquete.
const PNG_OUTPUTS: { size: number; name: string }[] = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
];

/** Herramienta "Generador de favicons": .ico multi-tamaño + PNG + manifest + snippet. */
export default function FaviconTool({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
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

  async function downloadPackage() {
    if (!file) return;
    setBusy(true);
    onError(null);
    try {
      const zip = new JSZip();
      zip.file('favicon.ico', await buildIco(file));
      for (const { size, name } of PNG_OUTPUTS) {
        zip.file(name, await buildPng(file, size));
      }
      zip.file('site.webmanifest', FAVICON_MANIFEST);
      zip.file('snippet.html', FAVICON_HTML_SNIPPET);
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, 'roluck-favicons.zip');
    } catch (e) {
      onError(e instanceof Error ? e.message : t.faviconTool.errPkg);
    } finally {
      setBusy(false);
    }
  }

  function copySnippet() {
    void navigator.clipboard.writeText(FAVICON_HTML_SNIPPET).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (!file) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-2 text-xs text-text-muted">
          {t.faviconTool.hint}
        </p>
        <DropZone onFiles={(f) => setFile(f[0])} onError={onError} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-center overflow-hidden rounded-xl border border-border bg-bg-surface p-4">
          {preview && <img src={preview} alt="" className="max-h-[40vh] object-contain" />}
        </div>

        {/* Vista previa de los tamaños reales del favicon. */}
        <div className="flex items-end gap-4 rounded-xl border border-border bg-bg-surface p-4">
          {[16, 32, 48].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              {preview && (
                <img src={preview} alt="" width={s} height={s} style={{ width: s, height: s }} className="rounded object-cover" />
              )}
              <span className="font-mono text-[10px] text-text-muted">{s}px</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void downloadPackage()}
          disabled={busy}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 px-6 font-display text-base font-semibold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
        >
          <IconDownload size={18} stroke={2} />
          {busy ? t.faviconTool.generating : t.faviconTool.downloadPackage}
        </button>

        <button
          type="button"
          onClick={() => setFile(null)}
          className="min-h-[48px] rounded-xl border border-border bg-bg-surface px-6 font-display text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary"
        >
          {t.common.loadAnother}
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{t.faviconTool.includes}</h2>
        <ul className="flex flex-col gap-1 rounded-xl border border-border bg-bg-surface p-4 font-mono text-xs text-text-muted">
          <li>favicon.ico <span className="text-text-primary">(16·32·48)</span></li>
          {PNG_OUTPUTS.map((p) => (
            <li key={p.name}>{p.name}</li>
          ))}
          <li>site.webmanifest</li>
          <li>snippet.html</li>
        </ul>

        <div className="rounded-xl border border-border bg-bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.faviconTool.htmlHead}</span>
            <button
              type="button"
              onClick={copySnippet}
              className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80"
            >
              {copied ? <IconCheck size={14} stroke={2} /> : <IconCopy size={14} stroke={2} />}
              {copied ? t.common.copied : t.common.copy}
            </button>
          </div>
          <pre className="overflow-auto p-4 font-mono text-xs text-text-primary">{FAVICON_HTML_SNIPPET}</pre>
        </div>
      </section>
    </div>
  );
}
