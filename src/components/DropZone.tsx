import { useRef, useState } from 'react';
import { ACCEPT_ATTR, isAcceptedImage } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';

interface DropZoneProps {
  /** Recibe los archivos aceptados (1 o varios según `multiple`). */
  onFiles: (files: File[]) => void;
  /** Reporta un error de validación al contenedor (ej: tipo no soportado). */
  onError: (message: string) => void;
  /** Permite seleccionar varias imágenes a la vez (modo lote / PDF). */
  multiple?: boolean;
}

/** Zona de drag & drop con fallback a <input type="file">. */
export default function DropZone({ onFiles, onError, multiple }: DropZoneProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(list: FileList | null) {
    const all = Array.from(list ?? []);
    if (all.length === 0) return;

    const accepted = all.filter(isAcceptedImage);

    if (accepted.length === 0) {
      onError(t.common.dropRejectAll);
      return;
    }
    if (accepted.length < all.length) {
      onError(t.common.dropRejectSome(all.length - accepted.length));
    }

    onFiles(multiple ? accepted : accepted.slice(0, 1));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t.common.dropAria}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`group flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors md:min-h-[300px] ${
        isDragging
          ? 'border-accent bg-accent/5'
          : 'border-border bg-bg-surface hover:border-accent/50 hover:bg-bg-elevated'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          // Permite volver a seleccionar el/los mismo(s) archivo(s).
          e.target.value = '';
        }}
      />

      <svg
        viewBox="0 0 24 24"
        className={`mb-4 h-12 w-12 transition-colors ${
          isDragging ? 'text-accent' : 'text-text-muted group-hover:text-accent'
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 9l5-5 5 5" />
        <path d="M12 4v12" />
      </svg>

      <p className="text-lg font-semibold text-text-primary">
        {multiple ? t.common.dropTitleMulti : t.common.dropTitle}
      </p>
      <p className="mt-1 text-sm text-text-muted">
        {multiple ? t.common.dropHintMulti : t.common.dropHintSingle}
      </p>
      <p className="mt-4 font-mono text-xs text-text-muted">
        PNG · JPEG · WebP · GIF · BMP · SVG
      </p>
    </div>
  );
}
