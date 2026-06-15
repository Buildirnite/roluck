import { IconLanguage } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { localize, stripLang } from '../i18n/localize';
import type { Lang } from '../i18n/translations';

const OPTIONS: { id: Lang; label: string }[] = [
  { id: 'es', label: 'ES' },
  { id: 'en', label: 'EN' },
];

/**
 * Conmutador de idioma (segmentado ES/EN). El idioma vive en la URL (`/` vs `/en`), así que
 * cambiar de idioma = navegar a la misma página en el otro prefijo, conservando la ruta.
 */
export default function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const go = (target: Lang) => {
    if (target === lang) return;
    navigate(`${localize(stripLang(pathname), target)}${search}`);
  };

  if (compact) {
    // Solo el botón del idioma alterno (para el riel colapsado).
    const other = lang === 'es' ? 'en' : 'es';
    return (
      <button
        type="button"
        onClick={() => go(other)}
        aria-label={t.nav.language}
        title={t.nav.language}
        className="m-2 flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:text-text-primary"
      >
        {other.toUpperCase()}
      </button>
    );
  }

  return (
    <div className="m-2 flex items-center gap-2 rounded-lg border border-border p-1">
      <IconLanguage size={16} className="ml-1 flex-shrink-0 text-text-muted" />
      <div className="flex flex-1 gap-1">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => go(o.id)}
            aria-pressed={lang === o.id}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              lang === o.id ? 'bg-bg-elevated text-accent' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
