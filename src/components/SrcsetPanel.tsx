import { useEffect, useRef, useState } from 'react';
import type { OutputFormat } from '../types';
import { canvasToBlob, renderToCanvas } from '../utils/canvasUtils';
import { loadImageFile } from '../utils/heicDecoder';
import { encodeAvif } from '../utils/avifEncoder';
import { extensionFor, formatBytes } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';

interface SrcsetPanelProps {
  file: File | null;
  format: OutputFormat;
  quality: number;
  originalName: string | null;
}

const WIDTHS = [320, 640, 960, 1280, 1920];

interface Variant {
  width: number;
  blob: Blob;
  url: string;
  size: number;
  name: string;
}

/** Genera la imagen en varios anchos + un snippet <img srcset> listo para usar. */
export default function SrcsetPanel({ file, format, quality, originalName }: SrcsetPanelProps) {
  const { t } = useI18n();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const urlsRef = useRef<string[]>([]);

  const revokeAll = () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
  };
  useEffect(() => {
    setVariants([]);
    revokeAll();
  }, [file]);
  useEffect(() => () => revokeAll(), []);

  async function generate() {
    if (!file) return;
    setBusy(true);
    setCopied(false);
    revokeAll();
    try {
      const img = await loadImageFile(file);
      const base = (originalName ?? 'imagen').replace(/\.[^.]+$/, '');
      const ext = extensionFor(format);
      // Solo anchos menores o iguales al original (no agranda).
      const widths = WIDTHS.filter((w) => w <= img.naturalWidth);
      if (widths.length === 0) widths.push(img.naturalWidth);

      const out: Variant[] = [];
      for (const width of widths) {
        const height = Math.round((width / img.naturalWidth) * img.naturalHeight);
        const canvas = renderToCanvas(img, {
          width,
          height,
          fillBackground: format === 'image/jpeg' ? '#ffffff' : undefined,
        });
        if (!canvas) continue;
        const blob =
          format === 'image/avif'
            ? await encodeAvif(canvas, quality)
            : await canvasToBlob(canvas, format, quality / 100);
        if (!blob) continue;
        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);
        out.push({ width, blob, url, size: blob.size, name: `${base}-${width}w.${ext}` });
      }
      setVariants(out);
    } finally {
      setBusy(false);
    }
  }

  function downloadOne(v: Variant) {
    const a = document.createElement('a');
    a.href = v.url;
    a.download = v.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const snippet =
    variants.length > 0
      ? `<img\n  src="${variants[variants.length - 1].name}"\n  srcset="${variants
          .map((v) => `${v.name} ${v.width}w`)
          .join(', ')}"\n  sizes="100vw"\n  alt="" />`
      : '';

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{t.srcset.title}</span>
        <button
          type="button"
          onClick={generate}
          disabled={!file || busy}
          className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
        >
          {busy ? t.srcset.generating : t.srcset.generate}
        </button>
      </div>
      <p className="mb-3 text-xs text-text-muted">{t.srcset.note}</p>

      {variants.length > 0 && (
        <div className="flex flex-col gap-2">
          {variants.map((v) => (
            <div key={v.width} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-elevated px-3 py-2">
              <span className="font-mono text-sm text-text-primary">{v.width}w</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-text-muted">{formatBytes(v.size)}</span>
                <button type="button" onClick={() => downloadOne(v)} aria-label={`${t.common.download} ${v.width}w`} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-surface hover:text-accent">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          <div className="mt-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-text-muted">{t.srcset.snippet}</span>
              <button type="button" onClick={copySnippet} className="font-mono text-xs text-accent hover:underline">
                {copied ? t.srcset.copied : t.srcset.copy}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-border bg-bg-primary p-3 font-mono text-[11px] leading-relaxed text-text-primary">
              {snippet}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
