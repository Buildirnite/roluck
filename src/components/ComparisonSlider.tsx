import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

interface ComparisonSliderProps {
  originalSrc: string;
  resultSrc: string;
}

/**
 * Comparador antes/después: la imagen original va de fondo y el resultado encima,
 * recortado con clip-path según la posición del divisor arrastrable (Función 4).
 * Soporta mouse y touch.
 */
export default function ComparisonSlider({ originalSrc, resultSrc }: ComparisonSliderProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // % desde la izquierda
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  // Listeners globales mientras se arrastra (mouse y touch).
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (draggingRef.current) updateFromClientX(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (draggingRef.current && e.touches[0]) updateFromClientX(e.touches[0].clientX);
    };
    const stop = () => {
      draggingRef.current = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stop);
    };
  }, [updateFromClientX]);

  return (
    <div
      ref={containerRef}
      className="checkerboard relative select-none overflow-hidden rounded-xl border border-border"
      onMouseDown={(e) => {
        draggingRef.current = true;
        updateFromClientX(e.clientX);
      }}
      onTouchStart={(e) => {
        draggingRef.current = true;
        if (e.touches[0]) updateFromClientX(e.touches[0].clientX);
      }}
    >
      {/* Imagen original (fondo) */}
      <img
        src={originalSrc}
        alt={t.comparison.original}
        draggable={false}
        className="block max-h-[320px] w-full object-contain"
      />

      {/* Resultado convertido, recortado hasta el divisor */}
      <img
        src={resultSrc}
        alt={t.comparison.converted}
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />

      {/* Etiquetas */}
      <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-text-primary">
        {t.comparison.original}
      </span>
      <span className="pointer-events-none absolute right-2 top-2 rounded bg-accent/80 px-2 py-0.5 font-mono text-xs text-accent-ink">
        {t.comparison.converted}
      </span>

      {/* Divisor arrastrable */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-accent"
        style={{ left: `${position}%` }}
      >
        <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-accent bg-bg-primary">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 7-4 5 4 5" />
            <path d="m15 7 4 5-4 5" />
          </svg>
        </span>
      </div>
    </div>
  );
}
