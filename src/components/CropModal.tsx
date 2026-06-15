import { useRef, useState } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PercentCrop,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCroppedBlob } from '../utils/cropImage';
import { useI18n } from '../i18n/I18nContext';
import { useModal } from '../hooks/useModal';

interface CropModalProps {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

const ASPECTS: { label: string; value: number | undefined }[] = [
  { label: 'Libre', value: undefined },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
];

/** Crea un recorte centrado para una proporción dada (o el 90% si es libre). */
function buildCrop(width: number, height: number, aspect: number | undefined): PercentCrop {
  if (aspect) {
    return centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
      width,
      height,
    );
  }
  return centerCrop({ unit: '%', width: 90, height: 90 }, width, height);
}

/**
 * Modal de recorte con react-image-crop (Función 5).
 * El usuario arrastra y redimensiona el recuadro con las manijas, y puede hacer
 * zoom sobre la imagen. El recorte se guarda en % para ser invariante al zoom.
 */
export default function CropModal({ imageSrc, onCancel, onConfirm }: CropModalProps) {
  const { t } = useI18n();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completed, setCompleted] = useState<PercentCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [zoom, setZoom] = useState(1);
  const [working, setWorking] = useState(false);

  // Escape + focus-trap + restauración de foco.
  const dialogRef = useModal<HTMLDivElement>(onCancel);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initial = buildCrop(width, height, aspect);
    setCrop(initial);
    setCompleted(initial);
  }

  // Si el usuario redimensiona con una manija (cambia ancho/alto) estando con una
  // proporción fija, la liberamos a "Libre" para evitar confusiones. Mover el
  // recuadro (solo cambia x/y) no la libera.
  function handleCropChange(_pixel: PixelCrop, percent: PercentCrop) {
    if (aspect !== undefined && crop) {
      const dw = Math.abs((crop.width ?? 0) - percent.width);
      const dh = Math.abs((crop.height ?? 0) - percent.height);
      if (dw > 0.01 || dh > 0.01) setAspect(undefined);
    }
    setCrop(percent);
  }

  function handleAspect(value: number | undefined) {
    setAspect(value);
    const img = imgRef.current;
    if (img) {
      const next = buildCrop(img.width, img.height, value);
      setCrop(next);
      setCompleted(next);
    }
  }

  async function handleConfirm() {
    if (!completed || completed.width === 0) return;
    setWorking(true);
    try {
      const blob = await getCroppedBlob(imageSrc, {
        x: completed.x,
        y: completed.y,
        width: completed.width,
        height: completed.height,
      });
      if (blob) onConfirm(blob);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.crop.aria}
      onMouseDown={(e) => {
        // Click en el fondo (fuera del cuadro) cierra el modal.
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div tabIndex={-1} className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-border bg-bg-surface p-4 focus:outline-none">
        <h3 className="font-display text-lg font-semibold text-text-primary">{t.crop.title}</h3>

        {/* Área del recorte: arrastra las manijas para redimensionar */}
        <div className="checkerboard flex max-h-[55vh] items-center justify-center overflow-auto rounded-xl bg-bg-primary p-2">
          <ReactCrop
            crop={crop}
            onChange={handleCropChange}
            onComplete={(_, percent) => setCompleted(percent)}
            aspect={aspect}
            keepSelection
            ruleOfThirds
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt={t.crop.altImage}
              onLoad={onImageLoad}
              style={{
                // El zoom escala el tamaño real (layout) para que el overlay del
                // recorte siga a la imagen; el recuadro se guarda en % y no se descuadra.
                height: `${50 * zoom}vh`,
                width: 'auto',
                maxWidth: 'none',
              }}
            />
          </ReactCrop>
        </div>

        {/* Selector de proporción */}
        <div className="grid grid-cols-4 gap-2">
          {ASPECTS.map((a) => {
            const active = a.value === aspect;
            return (
              <button
                key={a.label}
                type="button"
                onClick={() => handleAspect(a.value)}
                className={`min-h-[44px] rounded-lg border font-mono text-sm transition-colors ${
                  active
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-bg-elevated text-text-muted hover:text-text-primary'
                }`}
              >
                {a.value === undefined ? t.crop.free : a.label}
              </button>
            );
          })}
        </div>

        {/* Zoom */}
        <label className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-text-muted">{t.crop.zoom}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-10 text-right font-mono text-xs text-accent">
            {zoom.toFixed(1)}×
          </span>
        </label>

        {/* Acciones */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            className="min-h-[48px] flex-1 rounded-xl border border-border bg-bg-elevated px-6 font-display text-sm font-medium text-text-muted transition-colors hover:text-text-primary disabled:opacity-40"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={working || !completed || completed.width === 0}
            className="min-h-[48px] flex-1 rounded-xl bg-accent px-6 font-display text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-text-muted"
          >
            {working ? t.crop.cropping : t.crop.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
