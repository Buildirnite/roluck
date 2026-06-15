import { useState, type ReactNode } from 'react';
import { decodeHeic } from '../utils/heicDecoder';
import { SIZE_WARNING_BYTES, formatBytes } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';
import DropZone from './DropZone';
import ToolShell from './ToolShell';

interface SingleImageLayoutProps {
  title: string;
  subtitle?: string;
  /** La herramienta tiene funciones Pro (muestra la etiqueta junto al título). */
  pro?: boolean;
  hasImage: boolean;
  /** Recibe el archivo ya decodificado (HEIC → JPEG si hace falta). */
  onImage: (file: File) => void;
  onReset?: () => void;
  controls: ReactNode;
  stage: ReactNode;
  error?: string | null;
  onError: (message: string | null) => void;
}

/**
 * Layout reutilizable para las rutas que trabajan sobre la imagen activa
 * (Convertir / Comprimir / Editor / Redimensionar). Sin imagen muestra el DropZone;
 * con imagen, dos columnas: controles a la izquierda y "etapa" visual a la derecha.
 * Centraliza la decodificación de HEIC y el aviso de tamaño.
 */
export default function SingleImageLayout({
  title,
  subtitle,
  pro,
  hasImage,
  onImage,
  onReset,
  controls,
  stage,
  error,
  onError,
}: SingleImageLayoutProps) {
  const { t } = useI18n();
  const [preparing, setPreparing] = useState(false);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    const original = files[0];
    if (!original) return;
    onError(null);
    setPreparing(true);
    try {
      const file = await decodeHeic(original);
      setSizeWarning(
        original.size > SIZE_WARNING_BYTES ? t.common.sizeWarning(formatBytes(original.size)) : null,
      );
      onImage(file);
    } catch {
      onError(t.common.heicError);
    } finally {
      setPreparing(false);
    }
  }

  return (
    <ToolShell
      title={title}
      subtitle={subtitle}
      pro={pro}
      actions={
        hasImage && onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg border border-accent/50 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent transition-colors hover:border-accent hover:bg-accent/20"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            {t.common.newImage}
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-5">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6M12 16h.01" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {!hasImage ? (
        preparing ? (
          <div className="flex min-h-[200px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-bg-surface p-8 text-sm text-text-muted md:min-h-[300px]">
            <svg className="h-5 w-5 animate-spin text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            {t.common.decodingHeic}
          </div>
        ) : (
          <DropZone onFiles={handleFiles} onError={onError} />
        )
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="flex flex-col gap-4">
            {sizeWarning && (
              <p className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-text-primary">
                {sizeWarning}
              </p>
            )}
            {controls}
          </section>
          <section className="flex flex-col gap-4">{stage}</section>
        </div>
      )}
      </div>
    </ToolShell>
  );
}
