import { useState } from 'react';
import { IconBookmark, IconBookmarkPlus, IconX, IconCheck } from '@tabler/icons-react';
import { usePresetStore, type ConversionPreset } from '../store/usePresetStore';
import { formatLabel } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';

interface PresetBarProps {
  /** Ajustes actuales que se guardarán al crear un preset. */
  current: { format: ConversionPreset['format']; quality: number; targetKb?: number };
  /** Aplica un preset elegido a la página. */
  onApply: (preset: ConversionPreset) => void;
}

/**
 * Barra de presets guardados: chips que aplican una configuración al hacer click,
 * con botón para guardar los ajustes actuales bajo un nombre. Compartida por
 * Convertir, Comprimir y Lote; los presets viven en el store persistido.
 */
export default function PresetBar({ current, onApply }: PresetBarProps) {
  const { t } = useI18n();
  const presets = usePresetStore((s) => s.presets);
  const addPreset = usePresetStore((s) => s.addPreset);
  const removePreset = usePresetStore((s) => s.removePreset);

  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    addPreset({ ...current, name: trimmed });
    setName('');
    setNaming(false);
  }

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
          <IconBookmark size={16} stroke={1.8} className="text-accent" />
          {t.presets.title}
        </span>
        {!naming && (
          <button
            type="button"
            onClick={() => setNaming(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80"
          >
            <IconBookmarkPlus size={15} stroke={2} />
            {t.presets.save}
          </button>
        )}
      </div>

      {naming && (
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={name}
            autoFocus
            placeholder={t.presets.placeholder}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setNaming(false);
                setName('');
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            aria-label={t.presets.saveAction}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-text-muted"
          >
            <IconCheck size={16} stroke={2.2} />
          </button>
          <button
            type="button"
            onClick={() => {
              setNaming(false);
              setName('');
            }}
            aria-label={t.common.cancel}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:text-text-primary"
          >
            <IconX size={16} stroke={2.2} />
          </button>
        </div>
      )}

      {presets.length === 0 ? (
        <p className="text-xs text-text-muted">{t.presets.empty}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <div
              key={p.id}
              className="group flex items-center gap-1 rounded-lg border border-border bg-bg-elevated pl-1 transition-colors hover:border-accent/40"
            >
              <button
                type="button"
                onClick={() => onApply(p)}
                aria-label={t.presets.applyAria(p.name)}
                className="flex flex-col items-start px-2 py-1 text-left"
              >
                <span className="text-sm font-medium text-text-primary">{p.name}</span>
                <span className="font-mono text-[10px] text-text-muted">
                  {t.presets.meta(formatLabel(p.format), p.quality, p.targetKb)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => removePreset(p.id)}
                aria-label={t.presets.deleteAria(p.name)}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:text-error"
              >
                <IconX size={14} stroke={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
