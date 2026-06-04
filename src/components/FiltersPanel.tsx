import { DEFAULT_FILTERS, isNeutralFilter, type FilterValues } from '../utils/editUtils';
import { useI18n } from '../i18n/I18nContext';

interface FiltersPanelProps {
  values: FilterValues;
  onChange: (next: FilterValues) => void;
  onApply: () => void;
  disabled?: boolean;
}

function Slider({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-text-muted">{label}</span>
        <span className="font-mono text-xs text-accent">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={200}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

/** Controles de filtros (brillo/contraste/saturación + grises/sepia). */
export default function FiltersPanel({ values, onChange, onApply, disabled }: FiltersPanelProps) {
  const { t } = useI18n();
  const neutral = isNeutralFilter(values);

  return (
    <div className="flex flex-col gap-4">
      <Slider label={t.filters.brightness} value={values.brightness} onChange={(v) => onChange({ ...values, brightness: v })} disabled={disabled} />
      <Slider label={t.filters.contrast} value={values.contrast} onChange={(v) => onChange({ ...values, contrast: v })} disabled={disabled} />
      <Slider label={t.filters.saturation} value={values.saturate} onChange={(v) => onChange({ ...values, saturate: v })} disabled={disabled} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...values, grayscale: !values.grayscale, sepia: false })}
          disabled={disabled}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
            values.grayscale ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-bg-elevated text-text-muted hover:text-text-primary'
          }`}
        >
          {t.filters.grayscale}
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...values, sepia: !values.sepia, grayscale: false })}
          disabled={disabled}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
            values.sepia ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-bg-elevated text-text-muted hover:text-text-primary'
          }`}
        >
          {t.filters.sepia}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          disabled={disabled || neutral}
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text-muted transition-colors hover:text-text-primary disabled:opacity-40"
        >
          {t.common.reset}
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={disabled || neutral}
          className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-text-muted"
        >
          {t.filters.apply}
        </button>
      </div>
    </div>
  );
}
