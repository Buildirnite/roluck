import type { ConversionResult, ImageMetadata } from '../types';
import { useI18n } from '../i18n/I18nContext';
import ImagePreview from './ImagePreview';
import ComparisonSlider from './ComparisonSlider';
import ResultCard from './ResultCard';

interface ResultStageProps {
  preview: string | null;
  metadata: ImageMetadata | null;
  result: ConversionResult | null;
  isConverting: boolean;
  originalBytes: number;
}

/**
 * Etapa visual derecha para las rutas que convierten (Convertir/Comprimir/
 * Redimensionar): muestra la imagen activa en vivo y, tras convertir, el
 * comparador antes/después con la descarga.
 */
export default function ResultStage({
  preview,
  metadata,
  result,
  isConverting,
  originalBytes,
}: ResultStageProps) {
  const { t } = useI18n();
  if (result && preview) {
    return (
      <>
        <ComparisonSlider originalSrc={preview} resultSrc={result.url} />
        <ResultCard result={result} originalBytes={originalBytes} />
      </>
    );
  }

  if (isConverting) {
    return (
      <div className="flex min-h-[280px] flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg-surface p-6 text-sm text-text-muted">
        <svg className="h-5 w-5 animate-spin text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        {t.stage.processing}
      </div>
    );
  }

  return preview ? <ImagePreview src={preview} metadata={metadata} /> : null;
}
