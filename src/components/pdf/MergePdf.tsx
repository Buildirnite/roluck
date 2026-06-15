import { useState } from 'react';
import { IconArrowUp, IconArrowDown, IconTrash, IconFileTypePdf, IconDownload, IconPlus } from '@tabler/icons-react';
import { useI18n } from '../../i18n/I18nContext';
import { track } from '../../analytics';
import { mergePdfs, downloadPdf, isPdf } from '../../utils/pdfTools';

interface PdfFile {
  id: string;
  file: File;
}

let counter = 0;
const nextId = () => `pdf-${Date.now()}-${counter++}`;

/** Pestaña "Unir PDFs": combina varios PDF en uno, en el orden elegido. */
export default function MergePdf() {
  const { t } = useI18n();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function add(list: FileList | null) {
    const accepted = Array.from(list ?? []).filter(isPdf);
    if (accepted.length === 0) {
      setError(t.pdfTools.notPdf);
      return;
    }
    setError('');
    setFiles((prev) => [...prev, ...accepted.map((file) => ({ id: nextId(), file }))]);
  }

  function move(i: number, dir: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function remove(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function merge() {
    if (files.length < 2) return;
    setBusy(true);
    setError('');
    try {
      const bytes = await mergePdfs(files.map((f) => f.file));
      downloadPdf(bytes, 'roluck-unido.pdf');
      track('pdf_merged', { count: files.length });
    } catch {
      setError(t.pdfTools.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">{error}</p>}

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f, i) => (
            <li key={f.id} className="flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-3 py-2">
              <IconFileTypePdf size={18} className="flex-shrink-0 text-accent" />
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{f.file.name}</span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t.pdfTools.moveUp} className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted transition-colors hover:text-accent disabled:opacity-30">
                <IconArrowUp size={16} stroke={1.8} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === files.length - 1} aria-label={t.pdfTools.moveDown} className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted transition-colors hover:text-accent disabled:opacity-30">
                <IconArrowDown size={16} stroke={1.8} />
              </button>
              <button type="button" onClick={() => remove(f.id)} aria-label={t.pdfTools.remove} className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted transition-colors hover:text-red-400">
                <IconTrash size={16} stroke={1.8} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg-surface px-4 text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary">
        <IconPlus size={16} stroke={2} />
        {files.length === 0 ? t.pdfTools.addPdfs : t.common.addMore}
        <input type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </label>

      <button
        type="button"
        onClick={merge}
        disabled={busy || files.length < 2}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <IconDownload size={17} stroke={1.8} />
        {busy ? t.pdfTools.processing : t.pdfTools.mergeBtn(files.length)}
      </button>
    </div>
  );
}
