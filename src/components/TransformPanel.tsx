import type { Rotation } from '../types';
import { useI18n } from '../i18n/I18nContext';

export interface TransformState {
  rotation: Rotation;
  flipH: boolean;
  flipV: boolean;
}

export const INITIAL_TRANSFORM: TransformState = {
  rotation: 0,
  flipH: false,
  flipV: false,
};

interface TransformPanelProps {
  state: TransformState;
  onChange: (next: TransformState) => void;
}

const norm = (deg: number): Rotation => (((deg % 360) + 360) % 360) as Rotation;

/** Botón de acción de transformación con ícono. */
function TButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex min-h-[48px] items-center justify-center rounded-lg border transition-colors ${
        active
          ? 'border-accent bg-accent/15 text-accent'
          : 'border-border bg-bg-elevated text-text-muted hover:border-accent/40 hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

/** Panel para rotar y voltear; el estado se acumula entre clicks (Función 2). */
export default function TransformPanel({ state, onChange }: TransformPanelProps) {
  const { t } = useI18n();
  const isTransformed = state.rotation !== 0 || state.flipH || state.flipV;

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{t.transformPanel.title}</span>
        {isTransformed && (
          <button
            type="button"
            onClick={() => onChange(INITIAL_TRANSFORM)}
            className="font-mono text-xs text-text-muted underline-offset-2 hover:text-accent hover:underline"
          >
            {t.transformPanel.reset}
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <TButton
          label={t.transformPanel.rotateLeft}
          onClick={() => onChange({ ...state, rotation: norm(state.rotation - 90) })}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h11a4 4 0 0 1 4 4v1" />
            <path d="M7 4 3 8l4 4" />
          </svg>
        </TButton>
        <TButton
          label={t.transformPanel.rotateRight}
          onClick={() => onChange({ ...state, rotation: norm(state.rotation + 90) })}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8H10a4 4 0 0 0-4 4v1" />
            <path d="m17 4 4 4-4 4" />
          </svg>
        </TButton>
        <TButton
          label={t.transformPanel.mirrorH}
          active={state.flipH}
          onClick={() => onChange({ ...state, flipH: !state.flipH })}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18" />
            <path d="M8 7 4 12l4 5z" />
            <path d="m16 7 4 5-4 5z" />
          </svg>
        </TButton>
        <TButton
          label={t.transformPanel.mirrorV}
          active={state.flipV}
          onClick={() => onChange({ ...state, flipV: !state.flipV })}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18" />
            <path d="M7 8 12 4l5 4z" />
            <path d="m7 16 5 4 5-4z" />
          </svg>
        </TButton>
      </div>

      {isTransformed && (
        <p className="mt-3 font-mono text-xs text-text-muted">
          {state.rotation !== 0 && `${state.rotation}° `}
          {state.flipH && t.transformPanel.mirrorHShort}
          {state.flipV && t.transformPanel.mirrorVShort}
        </p>
      )}
    </div>
  );
}
