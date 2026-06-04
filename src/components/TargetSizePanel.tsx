import { useI18n } from '../i18n/I18nContext';

export interface TargetSizeState {
  enabled: boolean;
  kb: number; // peso objetivo en KB
}

interface TargetSizePanelProps {
  state: TargetSizeState;
  onChange: (next: TargetSizeState) => void;
  /** True si el formato destino es con pérdida (JPEG/WebP). */
  supported: boolean;
  /** Calidad final alcanzada (0–100) tras convertir, si la hubo. */
  achievedQuality?: number;
}

/** Panel para comprimir a un peso objetivo mediante búsqueda binaria (Función 3). */
export default function TargetSizePanel({
  state,
  onChange,
  supported,
  achievedQuality,
}: TargetSizePanelProps) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4">
      <label className="flex cursor-pointer items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          {t.targetPanel.title}
        </span>
        <input
          type="checkbox"
          checked={state.enabled}
          disabled={!supported}
          onChange={(e) => onChange({ ...state, enabled: e.target.checked })}
          className="h-4 w-4 accent-accent disabled:opacity-40"
        />
      </label>

      {!supported ? (
        <p className="mt-2 text-xs text-text-muted">
          {t.targetPanel.onlyLossy}
        </p>
      ) : (
        state.enabled && (
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-text-muted">
                {t.targetPanel.maxKb}
              </span>
              <input
                type="number"
                min={1}
                value={state.kb}
                onChange={(e) =>
                  onChange({ ...state, kb: Math.max(1, Math.round(Number(e.target.value) || 0)) })
                }
                className="rounded-lg border border-border bg-bg-elevated px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent"
              />
            </label>
            <p className="text-xs leading-relaxed text-text-muted">
              {t.targetPanel.note}
            </p>
            {achievedQuality !== undefined && (
              <p className="font-mono text-xs text-accent">
                {t.targetPanel.achieved(achievedQuality)}
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
