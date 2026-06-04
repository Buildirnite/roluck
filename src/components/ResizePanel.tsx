import { useI18n } from '../i18n/I18nContext';

export interface ResizeState {
  enabled: boolean;
  width: number;
  height: number;
  keepRatio: boolean;
}

interface ResizePanelProps {
  originalWidth: number;
  originalHeight: number;
  state: ResizeState;
  onChange: (next: ResizeState) => void;
}

const PRESETS = [25, 50, 75, 100] as const;

/** Panel para redimensionar la imagen antes de exportar (Función 1). */
export default function ResizePanel({
  originalWidth,
  originalHeight,
  state,
  onChange,
}: ResizePanelProps) {
  const { t } = useI18n();
  const ratio = originalWidth / originalHeight;

  function setWidth(width: number) {
    const w = Math.max(1, Math.round(width || 0));
    const h = state.keepRatio ? Math.max(1, Math.round(w / ratio)) : state.height;
    onChange({ ...state, width: w, height: h });
  }

  function setHeight(height: number) {
    const h = Math.max(1, Math.round(height || 0));
    const w = state.keepRatio ? Math.max(1, Math.round(h * ratio)) : state.width;
    onChange({ ...state, width: w, height: h });
  }

  function applyPreset(percent: number) {
    onChange({
      ...state,
      width: Math.max(1, Math.round((originalWidth * percent) / 100)),
      height: Math.max(1, Math.round((originalHeight * percent) / 100)),
    });
  }

  function toggleKeepRatio() {
    const keepRatio = !state.keepRatio;
    // Al reactivar la proporción, recalculamos el alto a partir del ancho actual.
    const height = keepRatio ? Math.max(1, Math.round(state.width / ratio)) : state.height;
    onChange({ ...state, keepRatio, height });
  }

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4">
      <label className="flex cursor-pointer items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{t.resizePanel.title}</span>
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={(e) => onChange({ ...state, enabled: e.target.checked })}
          className="h-4 w-4 accent-accent"
        />
      </label>

      {state.enabled && (
        <div className="mt-4 flex flex-col gap-4">
          <p className="font-mono text-xs text-text-muted">
            {t.resizePanel.original(originalWidth, originalHeight)}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-text-muted">
                {t.resizePanel.width}
              </span>
              <input
                type="number"
                min={1}
                value={state.width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="rounded-lg border border-border bg-bg-elevated px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-text-muted">
                {t.resizePanel.height}
              </span>
              <input
                type="number"
                min={1}
                value={state.height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="rounded-lg border border-border bg-bg-elevated px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent"
              />
            </label>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={state.keepRatio}
              onChange={toggleKeepRatio}
              className="h-4 w-4 accent-accent"
            />
            {t.resizePanel.keepRatio}
          </label>

          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-lg border border-border bg-bg-elevated py-2 font-mono text-xs text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary"
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
