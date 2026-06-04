import { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { IconDownload } from '@tabler/icons-react';
import DropZone from '../DropZone';
import { splitImageGrid, type GridPiece } from '../../utils/createUtils';
import { downloadBlob, formatBytes } from '../../utils/imageUtils';
import { useI18n } from '../../i18n/I18nContext';

/** Herramienta "Dividir en cuadrícula": corta una imagen en rows×cols piezas PNG. */
export default function GridSplitTool({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [pieces, setPieces] = useState<GridPiece[]>([]);
  const [busy, setBusy] = useState(false);

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

  // Object URLs de las piezas generadas.
  const [pieceUrls, setPieceUrls] = useState<string[]>([]);
  useEffect(() => {
    const urls = pieces.map((p) => URL.createObjectURL(p.blob));
    setPieceUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [pieces]);

  async function handleSplit() {
    if (!file) return;
    setBusy(true);
    onError(null);
    try {
      setPieces(await splitImageGrid(file, rows, cols));
    } catch (e) {
      onError(e instanceof Error ? e.message : t.splitTool.errSplit);
    } finally {
      setBusy(false);
    }
  }

  async function downloadZip() {
    const zip = new JSZip();
    pieces.forEach((p) => zip.file(p.name, p.blob));
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'roluck-cuadricula.zip');
  }

  if (!file) {
    return (
      <DropZone
        onFiles={(files) => {
          setFile(files[0]);
          setPieces([]);
        }}
        onError={onError}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <p className="mb-3 text-sm font-semibold text-text-primary">{t.splitTool.grid}</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">{t.splitTool.rows}</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, Math.min(10, Number(e.target.value))))}
                  className="rounded-lg border border-border bg-bg-elevated px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">{t.splitTool.columns}</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={cols}
                  onChange={(e) => setCols(Math.max(1, Math.min(10, Number(e.target.value))))}
                  className="rounded-lg border border-border bg-bg-elevated px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>
            </div>
            <p className="mt-2 font-mono text-xs text-text-muted">
              {t.splitTool.pieces(rows * cols)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleSplit()}
            disabled={busy}
            className="min-h-[48px] rounded-xl border border-accent bg-accent/10 px-6 font-display text-base font-semibold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
          >
            {busy ? t.splitTool.splitting : t.splitTool.splitInto(rows * cols)}
          </button>

          {pieces.length > 0 && (
            <button
              type="button"
              onClick={() => void downloadZip()}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-border bg-bg-surface px-6 font-display text-sm font-medium text-text-primary transition-colors hover:border-accent/40"
            >
              <IconDownload size={18} stroke={2} />
              {t.splitTool.downloadZip(pieces.length)}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPieces([]);
            }}
            className="min-h-[48px] rounded-xl border border-border bg-bg-surface px-6 font-display text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary"
          >
            {t.common.loadAnother}
          </button>
        </section>

        <section className="flex flex-col gap-3">
          {pieces.length === 0 ? (
            <div className="overflow-hidden rounded-xl border border-border bg-bg-surface">
              {preview && <img src={preview} alt={t.splitTool.altOriginal} className="w-full object-contain" />}
            </div>
          ) : (
            <div
              className="grid gap-1 overflow-hidden rounded-xl border border-border bg-bg-surface p-1"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {pieceUrls.map((url, i) => (
                <div key={i} className="group relative">
                  <img src={url} alt={pieces[i].name} className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => downloadBlob(pieces[i].blob, pieces[i].name)}
                    title={`${t.common.download} ${pieces[i].name} (${formatBytes(pieces[i].blob.size)})`}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition-colors group-hover:bg-black/50 group-hover:text-white"
                  >
                    <IconDownload size={20} stroke={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
