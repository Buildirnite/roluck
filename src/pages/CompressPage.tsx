import { useState } from 'react';
import type { ConvertOptions, OutputFormat } from '../types';
import { useActiveImage } from '../hooks/useActiveImage';
import { lossWarnings } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';
import SingleImageLayout from '../components/SingleImageLayout';
import ConversionPanel from '../components/ConversionPanel';
import PresetBar from '../components/PresetBar';
import TargetSizePanel, { type TargetSizeState } from '../components/TargetSizePanel';
import ConvertButton from '../components/ConvertButton';
import ResultStage from '../components/ResultStage';

const COMPRESS_FORMATS: OutputFormat[] = ['image/jpeg', 'image/webp'];

/** Ruta /comprimir — reducir peso por calidad o a peso objetivo. */
export default function CompressPage() {
  const { t } = useI18n();
  const img = useActiveImage();
  const [format, setFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState(80);
  const [targetSize, setTargetSize] = useState<TargetSizeState>({ enabled: false, kb: 500 });
  const [localError, setLocalError] = useState<string | null>(null);

  const targetActive = targetSize.enabled;
  const warnings = img.file ? lossWarnings(img.file.type, format) : [];

  function handleConvert() {
    const options: ConvertOptions = {};
    if (targetActive) options.targetBytes = targetSize.kb * 1024;
    void img.convert(format, quality, options);
  }

  const controls = (
    <>
      <ConversionPanel
        format={format}
        quality={quality}
        onFormatChange={setFormat}
        onQualityChange={setQuality}
        warnings={warnings}
        formats={COMPRESS_FORMATS}
        hideQuality={targetActive}
      />
      <TargetSizePanel
        state={targetSize}
        onChange={setTargetSize}
        supported
        achievedQuality={targetActive ? img.result?.qualityUsed : undefined}
      />
      <PresetBar
        current={{ format, quality, targetKb: targetActive ? targetSize.kb : undefined }}
        onApply={(p) => {
          setFormat(p.format);
          setQuality(p.quality);
          setTargetSize(
            p.targetKb !== undefined
              ? { enabled: true, kb: p.targetKb }
              : { ...targetSize, enabled: false },
          );
        }}
      />
      <ConvertButton onClick={handleConvert} isConverting={img.isConverting} label={t.pages.compress.title} />
    </>
  );

  return (
    <SingleImageLayout
      title={t.pages.compress.title}
      subtitle={t.pages.compress.subtitle}
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
