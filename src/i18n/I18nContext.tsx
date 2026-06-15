import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { DICTS, type Dict, type Lang } from './translations';
import { langFromPath } from './localize';

interface I18nValue {
  lang: Lang;
  t: Dict;
}

const I18nContext = createContext<I18nValue | null>(null);

/**
 * El idioma se deriva de la URL (ES en la raíz, EN bajo `/en`). Debe renderizarse dentro
 * del router (es un layout en App.tsx). Cambiar de idioma = navegar a la otra URL, lo hace
 * `LanguageSwitcher`. Mantiene `<html lang>` sincronizado (accesibilidad + SEO).
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const lang = langFromPath(pathname);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <I18nContext.Provider value={{ lang, t: DICTS[lang] }}>{children}</I18nContext.Provider>;
}

/** Acceso a las traducciones y al idioma activo. `t` es el diccionario resuelto. */
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de <I18nProvider>.');
  return ctx;
}
