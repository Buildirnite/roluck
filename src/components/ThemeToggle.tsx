import { IconSun, IconMoon } from '@tabler/icons-react';
import { useThemeStore } from '../store/useThemeStore';
import { useI18n } from '../i18n/I18nContext';

/**
 * Conmutador de tema claro/oscuro. En el riel colapsado muestra solo el ícono; expandido,
 * un botón con etiqueta. Refleja el tema activo y alterna al contrario.
 */
export default function ThemeToggle({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = theme === 'dark';
  const Icon = isDark ? IconSun : IconMoon;
  const label = isDark ? t.theme.toLight : t.theme.toDark;

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className="m-2 flex items-center justify-center rounded-lg border border-border px-3 py-2 text-text-muted transition-colors hover:text-text-primary"
      >
        <Icon size={16} stroke={1.8} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="m-2 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
    >
      <Icon size={16} stroke={1.8} className="flex-shrink-0" />
      <span>{label}</span>
    </button>
  );
}
