import { useState } from 'react';
import type { OutputFormat } from '../types';
import { useActiveImage } from '../hooks/useActiveImage';
import { lossWarnings } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';
import SingleImageLayout from '../components/SingleImageLayout';
import ConversionPanel from '../components/ConversionPanel';
import PresetBar from '../components/PresetBar';
import ConvertButton from '../components/ConvertButton';
import ResultStage from '../components/ResultStage';
import FormatComparison from '../components/FormatComparison';

/** Ruta /convertir — conversión de formato. */
export default function ConvertPage() {
  const { t } = useI18n();
  const img = useActiveImage();
  const [format, setFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState(85);
  const [localError, setLocalError] = useState<string | null>(null);

  const warnings = img.file ? lossWarnings(img.file.type, format) : [];

  const controls = (
    <>
      <ConversionPanel
        format={format}
        quality={quality}
        onFormatChange={setFormat}
        onQualityChange={setQuality}
        warnings={warnings}
      />
      <PresetBar
        current={{ format, quality }}
        onApply={(p) => {
          setFormat(p.format);
          setQuality(p.quality);
        }}
      />
      <ConvertButton
        onClick={() => void img.convert(format, quality)}
        isConverting={img.isConverting}
      />
      <FormatComparison
        file={img.file}
        quality={quality}
        originalBytes={img.metadata?.sizeBytes ?? img.file?.size ?? 0}
        originalName={img.originalName}
      />
    </>
  );

  return (
    <SingleImageLayout
      title={t.pages.convert.title}
      subtitle={t.pages.convert.subtitle}
      hasImage={!!img.file}
      onImage={img.setActiveFile}
      onReset={img.reset}
      controls={controls}
      stage={
        <ResultStage
          preview={img.preview}
          metadata={img.metadata}
          result={img.result}
          isConverting={img.isConverting}
          originalBytes={img.metadata?.sizeBytes ?? img.file?.size ?? 0}
        />
      }
      error={localError ?? img.error}
      onError={setLocalError}
    />
  );
}
