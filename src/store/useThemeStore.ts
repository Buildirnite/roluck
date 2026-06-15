import { create } from 'zustand';

/**
 * Tema claro/oscuro. El oscuro es el predeterminado de la marca. La elección se guarda en
 * localStorage (`roluck-theme`); si no hay elección, se sigue la preferencia del sistema.
 *
 * El tema se aplica como la clase `light` en <html> (un script inline en index.html ya la
 * pone antes del primer render para evitar parpadeo; aquí solo la mantenemos sincronizada).
 * Los colores reales viven en src/index.css como variables CSS por tema.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'roluck-theme';

/** Color de la barra del navegador por tema (coincide con --bg-primary). */
const THEME_COLOR: Record<Theme, string> = { dark: '#0a0a0a', light: '#ffffff' };

function systemPrefersLight(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches;
}

function readInitial(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* almacenamiento no disponible */
  }
  return systemPrefersLight() ? 'light' : 'dark';
}

/** Aplica el tema al documento: clase en <html> + meta theme-color. */
function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('light', theme === 'light');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: readInitial(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* sin acceso a almacenamiento */
    }
    applyTheme(theme);
    set({ theme });
  },
  toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));
