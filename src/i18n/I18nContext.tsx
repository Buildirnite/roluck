import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { DICTS, type Dict, type Lang } from './translations';

const STORAGE_KEY = 'roluck-lang';

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
}

const I18nContext = createContext<I18nValue | null>(null);

/** Idioma inicial: preferencia guardada, si no el del navegador, con ES por defecto. */
function detectLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'es' || saved === 'en') return saved;
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  // Mantener <html lang> sincronizado (accesibilidad y SEO).
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: DICTS[lang] }}>{children}</I18nContext.Provider>
  );
}

/** Acceso a las traducciones y al idioma activo. `t` es el diccionario resuelto. */
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de <I18nProvider>.');
  return ctx;
}
