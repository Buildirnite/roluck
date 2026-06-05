import { useEffect, useState } from 'react';
import {
  IconCrop,
  IconEraser,
  IconRotate,
  IconFlipHorizontal,
  IconAdjustments,
  IconDroplet,
  IconBlurOff,
  IconPencil,
  IconArrowsMaximize,
  IconRectangle,
  IconWallpaper,
} from '@tabler/icons-react';
import { useActiveImage } from '../hooks/useActiveImage';
import { useBackgroundRemoval } from '../hooks/useBackgroundRemoval';
import {
  applyTransform,
  applyFilters,
  applyWatermark,
  applyScale,
  applyBackgroundColor,
  buildFilterString,
  DEFAULT_FILTERS,
  isNeutralFilter,
  type FilterValues,
  type WatermarkOptions,
} from '../utils/editUtils';
import SingleImageLayout from '../components/SingleImageLayout';
import { useI18n } from '../i18n/I18nContext';
import ImagePreview from '../components/ImagePreview';
import EditBadges from '../components/EditBadges';
import ToolPalette, { type EditorTool } from '../components/ToolPalette';
import FiltersPanel from '../components/FiltersPanel';
import CropModal from '../components/CropModal';
import WatermarkPanel from '../components/WatermarkPanel';
import RegionModal from '../components/RegionModal';
import AnnotateModal from '../components/AnnotateModal';

const SCALE_FACTORS = [2, 3, 4] as const;

type ToolKey =
  | 'crop' | 'removebg' | 'rotate' | 'flip' | 'filters'
  | 'watermark' | 'blur' | 'annotate' | 'upscale' | 'redact' | 'replacebg';

const TOOL_META: { id: ToolKey; Icon: EditorTool['Icon']; available: boolean }[] = [
  { id: 'crop', Icon: IconCrop, available: true },
  { id: 'removebg', Icon: IconEraser, available: true },
  { id: 'rotate', Icon: IconRotate, available: true },
  { id: 'flip', Icon: IconFlipHorizontal, available: true },
  { id: 'filters', Icon: IconAdjustments, available: true },
  { id: 'watermark', Icon: IconDroplet, available: true },
  { id: 'blur', Icon: IconBlurOff, available: true },
  { id: 'annotate', Icon: IconPencil, available: true },
  { id: 'upscale', Icon: IconArrowsMaximize, available: true },
  { id: 'redact', Icon: IconRectangle, available: true },
  { id: 'replacebg', Icon: IconWallpaper, available: true },
];

/** Ruta /editor — herramientas de edición con divulgación progresiva. */
export default function EditorPage() {
  const { t } = useI18n();
  const img = useActiveImage();
  const bg = useBackgroundRemoval();
  const tools: EditorTool[] = TOOL_META.map((m) => ({ ...m, label: t.editorTools[m.id] }));
  const [tool, setTool] = useState('crop');
  const [showCrop, setShowCrop] = useState(false);
  const [region, setRegion] = useState<'obscure' | 'redact' | null>(null);
  const [showAnnotate, setShowAnnotate] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgResult, setBgResult] = useState<{ url: string; blob: Blob } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);

  const editing = editBusy || bg.isRemoving;
  // Previsualización en vivo de filtros (solo con la herramienta de filtros activa).
  const livePreviewFilter =
    tool === 'filters' && !isNeutralFilter(filters) ? buildFilterString(filters) : undefined;

  // Al cambiar la imagen de trabajo, reseteamos los filtros (ya quedaron aplicados).
  useEffect(() => setFilters(DEFAULT_FILTERS), [img.file]);

  // Limpieza del preview de fondo pendiente.
  useEffect(() => setBgResult(null), [img.file]);
  useEffect(() => {
    return () => {
      if (bgResult) URL.revokeObjectURL(bgResult.url);
    };
  }, [bgResult]);

  async function handleTransform(
    opts: { rotation?: 90 | 180 | 270; flipH?: boolean; flipV?: boolean },
    label: string,
  ) {
    if (!img.file || editing) return;
    setEditBusy(true);
    try {
      const next = await applyTransform(img.file, opts);
      if (next) img.applyEdit(next, label);
      else setLocalError(t.editor.errTransform);
    } finally {
      setEditBusy(false);
    }
  }

  function handleCropConfirm(blob: Blob) {
    img.applyEdit(new File([blob], 'recorte.png', { type: 'image/png' }), 'Recortada');
    setShowCrop(false);
  }

  async function handleWatermark(opts: WatermarkOptions) {
    if (!img.file || editing) return;
    setEditBusy(true);
    try {
      const next = await applyWatermark(img.file, opts);
      if (next) img.applyEdit(next, 'Marca de agua');
      else setLocalError(t.editor.errEdit);
    } finally {
      setEditBusy(false);
    }
  }

  async function handleScale(factor: number) {
    if (!img.file || editing) return;
    setEditBusy(true);
    try {
      const next = await applyScale(img.file, factor);
      if (next) img.applyEdit(next, 'Escalada');
      else setLocalError(t.editor.errEdit);
    } finally {
      setEditBusy(false);
    }
  }

  async function handleReplaceBg() {
    if (!img.file || editing) return;
    setEditBusy(true);
    try {
      const next = await applyBackgroundColor(img.file, bgColor);
      if (next) img.applyEdit(next, 'Fondo');
      else setLocalError(t.editor.errEdit);
    } finally {
      setEditBusy(false);
    }
  }

  function handleRegionConfirm(file: File) {
    img.applyEdit(file, region === 'redact' ? 'Tapada' : 'Difuminada');
    setRegion(null);
  }

  function handleAnnotateConfirm(file: File) {
    img.applyEdit(file, 'Anotada');
    setShowAnnotate(false);
  }

  async function handleApplyFilters() {
    if (!img.file || editing || isNeutralFilter(filters)) return;
    setEditBusy(true);
    try {
      const next = await applyFilters(img.file, filters);
      if (next) {
        img.applyEdit(next, 'Filtros');
        setFilters(DEFAULT_FILTERS);
      } else setLocalError(t.editor.errFilters);
    } finally {
      setEditBusy(false);
    }
  }

  async function handleRemoveBackground() {
    if (!img.preview || editing) return;
    const blob = await bg.removeBg(img.preview);
    if (blob) setBgResult({ url: URL.createObjectURL(blob), blob });
  }

  function handleUseBackground() {
    if (!bgResult) return;
    img.applyEdit(new File([bgResult.blob], 'sin-fondo.png', { type: 'image/png' }), 'Sin fondo');
    setBgResult(null);
  }

  function handleDownloadBackground() {
    if (!bgResult) return;
    const base = (img.originalName ?? 'imagen').replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = bgResult.url;
    a.download = `${base}_sin-fondo.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Controles de la herramienta activa (solo se muestra una a la vez).
  function renderToolControls() {
    switch (tool) {
      case 'crop':
        return (
          <button
            type="button"
            onClick={() => setShowCrop(true)}
            disabled={editing}
            className="min-h-[44px] rounded-xl bg-accent px-4 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            {t.editor.openCrop}
          </button>
        );
      case 'removebg':
        return (
          <button
            type="button"
            onClick={handleRemoveBackground}
            disabled={editing}
            className="min-h-[44px] rounded-xl bg-accent px-4 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            {t.editor.removeBg}
          </button>
        );
      case 'rotate':
        return (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handleTransform({ rotation: 270 }, 'Rotada')} disabled={editing} className="min-h-[44px] rounded-lg border border-border bg-bg-elevated text-sm text-text-muted hover:text-text-primary disabled:opacity-40">
              {t.editor.rotateLeft}
            </button>
            <button type="button" onClick={() => handleTransform({ rotation: 90 }, 'Rotada')} disabled={editing} className="min-h-[44px] rounded-lg border border-border bg-bg-elevated text-sm text-text-muted hover:text-text-primary disabled:opacity-40">
              {t.editor.rotateRight}
            </button>
          </div>
        );
      case 'flip':
        return (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handleTransform({ flipH: true }, 'Espejada')} disabled={editing} className="min-h-[44px] rounded-lg border border-border bg-bg-elevated text-sm text-text-muted hover:text-text-primary disabled:opacity-40">
              {t.editor.flipH}
            </button>
            <button type="button" onClick={() => handleTransform({ flipV: true }, 'Espejada')} disabled={editing} className="min-h-[44px] rounded-lg border border-border bg-bg-elevated text-sm text-text-muted hover:text-text-primary disabled:opacity-40">
              {t.editor.flipV}
            </button>
          </div>
        );
      case 'filters':
        return (
          <FiltersPanel
            values={filters}
            onChange={setFilters}
            onApply={handleApplyFilters}
            disabled={editing}
          />
        );
      case 'watermark':
        return <WatermarkPanel onApply={handleWatermark} disabled={editing} />;
      case 'blur':
        return (
          <button
            type="button"
            onClick={() => setRegion('obscure')}
            disabled={editing}
            className="min-h-[44px] w-full rounded-xl bg-accent px-4 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            {t.editor.selectRegion}
          </button>
        );
      case 'redact':
        return (
          <button
            type="button"
            onClick={() => setRegion('redact')}
            disabled={editing}
            className="min-h-[44px] w-full rounded-xl bg-accent px-4 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            {t.editor.selectRegion}
          </button>
        );
      case 'annotate':
        return (
          <button
            type="button"
            onClick={() => setShowAnnotate(true)}
            disabled={editing}
            className="min-h-[44px] w-full rounded-xl bg-accent px-4 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            {t.editor.openAnnotate}
          </button>
        );
      case 'upscale':
        return (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-text-muted">{t.editor.upscaleHint}</p>
            <div className="grid grid-cols-3 gap-2">
              {SCALE_FACTORS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleScale(f)}
                  disabled={editing}
                  className="min-h-[44px] rounded-lg border border-border bg-bg-elevated text-sm font-semibold text-text-muted hover:border-accent/40 hover:text-text-primary disabled:opacity-40"
                >
                  {f}×
                </button>
              ))}
            </div>
          </div>
        );
      case 'replacebg':
        return (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-text-muted">{t.editor.replaceBgHint}</p>
            <label className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-text-muted">{t.watermark.color}</span>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent" />
            </label>
            <button
              type="button"
              onClick={handleReplaceBg}
              disabled={editing}
              className="min-h-[44px] rounded-xl bg-accent px-4 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/90 disabled:opacity-40"
            >
              {t.common.apply}
            </button>
          </div>
        );
      default:
        return (
          <p className="rounded-xl border border-dashed border-border bg-bg-surface px-4 py-6 text-center text-sm text-text-muted">
            {t.editor.comingSoon}
          </p>
        );
    }
  }

  const controls = (
    <>
      <ToolPalette tools={tools} active={tool} onSelect={setTool} disabled={editing} />
      <div className="rounded-xl border border-border bg-bg-surface p-4">{renderToolControls()}</div>
    </>
  );

  // Ediciones aplicadas + deshacer/revertir, justo encima de la imagen.
  const stageContent = bg.isRemoving ? (
    <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-accent/30 bg-bg-surface p-6">
      <svg className="h-6 w-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <p className="text-sm text-text-primary">{bg.stage ?? t.common.processing}</p>
      <div className="h-2 w-48 overflow-hidden rounded-full bg-bg-elevated">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.round(bg.progress * 100)}%` }} />
      </div>
      <p className="font-mono text-xs text-accent">{Math.round(bg.progress * 100)}%</p>
      <p className="max-w-xs text-center text-xs text-text-muted">
        {t.editor.modelNote}
      </p>
    </div>
  ) : bgResult ? (
    <div className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-bg-surface p-3">
      <p className="text-sm font-semibold text-text-primary">{t.editor.bgDone}</p>
      <div className="checkerboard flex justify-center rounded-lg p-2">
        <img src={bgResult.url} alt={t.editor.bgAlt} className="max-h-[300px] w-auto max-w-full object-contain" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={handleUseBackground} className="min-h-[44px] rounded-lg bg-accent px-3 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/90">
          {t.editor.use}
        </button>
        <button type="button" onClick={handleDownloadBackground} className="min-h-[44px] rounded-lg border border-border bg-bg-elevated px-3 text-sm font-medium text-text-muted transition-colors hover:text-text-primary">
          {t.common.download}
        </button>
        <button type="button" onClick={() => setBgResult(null)} className="min-h-[44px] rounded-lg border border-border bg-bg-elevated px-3 text-sm font-medium text-text-muted transition-colors hover:text-error">
          {t.editor.discard}
        </button>
      </div>
    </div>
  ) : (
    img.preview && (
      <ImagePreview src={img.preview} metadata={img.metadata} filter={livePreviewFilter} />
    )
  );

  const stage = (
    <>
      <EditBadges
        labels={img.editLabels}
        canUndo={img.canUndo}
        canRedo={img.canRedo}
        onUndo={img.undo}
        onRedo={img.redo}
        onRevert={img.revertToOriginal}
        disabled={editing}
      />
      {stageContent}
    </>
  );

  return (
    <>
      <SingleImageLayout
        title={t.pages.editor.title}
        subtitle={t.pages.editor.subtitle}
        hasImage={!!img.file}
        onImage={img.setActiveFile}
        onReset={img.reset}
        controls={controls}
        stage={stage}
        error={localError ?? img.error ?? bg.error}
        onError={setLocalError}
      />
      {showCrop && img.preview && (
        <CropModal imageSrc={img.preview} onCancel={() => setShowCrop(false)} onConfirm={handleCropConfirm} />
      )}
      {region && img.file && img.preview && (
        <RegionModal
          file={img.file}
          imageSrc={img.preview}
          kind={region}
          onCancel={() => setRegion(null)}
          onConfirm={handleRegionConfirm}
        />
      )}
      {showAnnotate && img.file && (
        <AnnotateModal file={img.file} onCancel={() => setShowAnnotate(false)} onConfirm={handleAnnotateConfirm} />
      )}
    </>
  );
}
