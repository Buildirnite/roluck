import { useState } from 'react';
import type { BatchItem, PdfOptions } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { useAppStore } from '../store/useAppStore';
import { usePdfExport } from '../hooks/usePdfExport';
import { ACCEPT_ATTR, isAcceptedImage } from '../utils/imageUtils';
import DropZone from '../components/DropZone';
import PdfPanel from '../components/PdfPanel';
import ConvertButton from '../components/ConvertButton';
import ToolShell from '../components/ToolShell';
import MergePdf from '../components/pdf/MergePdf';
import OrganizePdf from '../components/pdf/OrganizePdf';

type Tab = 'images' | 'merge' | 'organize';

/**
 * Ruta /pdf — PDF Toolbox. Tres modos: combinar imágenes en un PDF (flujo original, jsPDF),
 * unir varios PDF y organizar páginas (rotar/eliminar/reordenar). Las operaciones sobre PDF
 * usan pdf-lib + pdf.js (lazy), ver utils/pdfTools.ts.
 */
export default function PdfPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('images');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'images', label: t.pdfTools.tabImages },
    { id: 'merge', label: t.pdfTools.tabMerge },
    { id: 'organize', label: t.pdfTools.tabOrganize },
  ];

  return (
    <ToolShell title={t.pdfTools.title} subtitle={t.pdfTools.subtitle}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tb) => {
            const active = tb.id === tab;
            return (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id)}
                aria-pressed={active}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-bg-surface text-text-muted hover:border-accent/40 hover:text-text-primary'
                }`}
              >
                {tb.label}
              </button>
            );
          })}
        </div>

        {tab === 'images' && <ImagesToPdf />}
        {tab === 'merge' && <MergePdf />}
        {tab === 'organize' && <OrganizePdf />}
      </div>
    </ToolShell>
  );
}

/** Flujo original: combinar imágenes de la cola compartida en un PDF multipágina. */
function ImagesToPdf() {
  const { t } = useI18n();
  const queue = useAppStore((s) => s.queue);
  const addToQueue = useAppStore((s) => s.addToQueue);
  const removeFromQueue = useAppStore((s) => s.removeFromQueue);
  const reorderQueue = useAppStore((s) => s.reorderQueue);
  const clearQueue = useAppStore((s) => s.clearQueue);
  const pdf = usePdfExport();

  const [options, setOptions] = useState<PdfOptions>({
    orientation: 'auto',
    pageSize: 'a4',
    filename: 'roluck-imagenes',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const items: BatchItem[] = queue.map((q) => ({ id: q.id, file: q.file, status: 'pending' }));

  function handleAddMore(list: FileList | null) {
    const accepted = Array.from(list ?? []).filter(isAcceptedImage);
    if (accepted.length === 0) {
      setLocalError(t.batch.rejectAll);
      return;
    }
    addToQueue(accepted);
  }

  return (
    <div className="flex flex-col gap-4">
      {localError && (
        <div role="alert" className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {localError}
        </div>
      )}

      {items.length === 0 ? (
        <DropZone onFiles={addToQueue} onError={setLocalError} multiple />
      ) : (
        <div className="flex flex-col gap-4">
          <PdfPanel
            items={items}
            options={options}
            onOptionsChange={setOptions}
            onReorder={reorderQueue}
            onRemove={removeFromQueue}
            isGenerating={pdf.isGenerating}
          />

          <label className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg-surface px-4 text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t.common.addMore}
            <input type="file" accept={ACCEPT_ATTR} multiple className="hidden" onChange={(e) => { handleAddMore(e.target.files); e.target.value = ''; }} />
          </label>

          <ConvertButton
            onClick={() => void pdf.generate(queue.map((q) => q.file), options)}
            isConverting={pdf.isGenerating}
            label={t.pdfPanel.generate(items.length)}
          />
          <button type="button" onClick={clearQueue} disabled={pdf.isGenerating} className="min-h-[48px] rounded-xl border border-border bg-bg-surface px-6 font-display text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary disabled:opacity-40">
            {t.common.clear}
          </button>
        </div>
      )}
    </div>
  );
}
