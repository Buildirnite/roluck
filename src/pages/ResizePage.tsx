import { useEffect, useState } from 'react';
import type { ConvertOptions, OutputFormat } from '../types';
import { useActiveImage } from '../hooks/useActiveImage';
import { lossWarnings } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';
import SingleImageLayout from '../components/SingleImageLayout';
import ConversionPanel from '../components/ConversionPanel';
import ResizePanel, { type ResizeState } from '../components/ResizePanel';
import SocialPresets, { type SocialPreset } from '../components/SocialPresets';
import SrcsetPanel from '../components/SrcsetPanel';
import ConvertButton from '../components/ConvertButton';
import ResultStage from '../components/ResultStage';

/** Ruta /redimensionar — cambiar dimensiones de salida, presets sociales y srcset. */
export default function ResizePage() {
  const { t } = useI18n();
  const img = useActiveImage();
  const [format, setFormat] = useState<OutputFormat>('image/png');
  const [quality, setQuality] = useState(90);
  const [resize, setResize] = useState<ResizeState>({
    enabled: true,
    width: 0,
    height: 0,
    keepRatio: true,
  });
  const [fit, setFit] = useState<'stretch' | 'cover'>('stretch');
  const [localError, setLocalError] = useState<string | null>(null);

  // Refleja las dimensiones de cada imagen nueva (metadata solo cambia al cargarla).
  useEffect(() => {
    if (img.metadata) {
      setResize((r) => ({ ...r, width: img.metadata!.width, height: img.metadata!.height }));
    }
  }, [img.metadata]);

  const warnings = img.file ? lossWarnings(img.file.type, format) : [];

  function handlePreset(p: SocialPreset) {
    // Tamaño exacto + recorte cover (sin distorsión).
    setResize({ enabled: true, width: p.width, height: p.height, keepRatio: false });
    setFit('cover');
  }

  function handleConvert() {
    const options: ConvertOptions = {};
    if (resize.enabled) {
      options.width = resize.width;
      options.height = resize.height;
      options.fit = fit;
    }
    void img.convert(format, quality, options);
  }

  const controls = (
    <>
      {img.metadata && (
        <ResizePanel
          originalWidth={img.metadata.width}
          originalHeight={img.metadata.height}
          state={resize}
          onChange={(r) => {
            setResize(r);
            setFit('stretch'); // editar manualmente vuelve a modo estirar
          }}
        />
      )}

      {/* Modo de ajuste cuando hay dimensiones fijas */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFit('stretch')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            fit === 'stretch' ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-bg-elevated text-text-muted hover:text-text-primary'
          }`}
        >
          Estirar
        </button>
        <button
          type="button"
          onClick={() => setFit('cover')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            fit === 'cover' ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-bg-elevated text-text-muted hover:text-text-primary'
          }`}
        >
          Cubrir y recortar
        </button>
      </div>

      <SocialPresets
        active={resize.enabled ? { width: resize.width, height: resize.height } : undefined}
        onSelect={handlePreset}
      />

      <ConversionPanel
        format={format}
        quality={quality}
        onFormatChange={setFormat}
        onQualityChange={setQuality}
        warnings={warnings}
      />
      <ConvertButton onClick={handleConvert} isConverting={img.isConverting} label="Redimensionar" />

      <SrcsetPanel file={img.file} format={format} quality={quality} originalName={img.originalName} />
    </>
  );

  return (
    <SingleImageLayout
      title={t.pages.resize.title}
      subtitle={t.pages.resize.subtitle}
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
