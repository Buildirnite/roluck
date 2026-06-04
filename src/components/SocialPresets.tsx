import { useI18n } from '../i18n/I18nContext';
import type { Dict } from '../i18n/translations';

export interface SocialPreset {
  key: keyof Dict['social'];
  hint: string;
  width: number;
  height: number;
}

export const SOCIAL_PRESETS: SocialPreset[] = [
  { key: 'square', hint: '1080×1080', width: 1080, height: 1080 },
  { key: 'story', hint: '1080×1920', width: 1080, height: 1920 },
  { key: 'portrait', hint: '1080×1350', width: 1080, height: 1350 },
  { key: 'youtube', hint: '1280×720', width: 1280, height: 720 },
  { key: 'xcover', hint: '1500×500', width: 1500, height: 500 },
  { key: 'thumb', hint: '400×400', width: 400, height: 400 },
];

interface SocialPresetsProps {
  active?: { width: number; height: number };
  onSelect: (preset: SocialPreset) => void;
  disabled?: boolean;
}

/** Presets de tamaño para redes sociales (aplican recorte "cover", sin distorsión). */
export default function SocialPresets({ active, onSelect, disabled }: SocialPresetsProps) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4">
      <p className="mb-1 text-sm font-semibold text-text-primary">{t.social.title}</p>
      <p className="mb-3 text-xs text-text-muted">{t.social.note}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SOCIAL_PRESETS.map((p) => {
          const isActive = active?.width === p.width && active?.height === p.height;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onSelect(p)}
              disabled={disabled}
              className={`flex flex-col items-center rounded-lg border px-2 py-2 transition-colors disabled:opacity-40 ${
                isActive
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-border bg-bg-elevated text-text-muted hover:border-accent/40 hover:text-text-primary'
              }`}
            >
              <span className="text-xs font-medium">{t.social[p.key]}</span>
              <span className="font-mono text-[10px] text-text-muted">{p.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
