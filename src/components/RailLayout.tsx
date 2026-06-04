import { Suspense, useCallback, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight, IconDots, IconX, IconHistory, IconClipboardCheck, IconLock } from '@tabler/icons-react';
import { NAV_ITEMS } from '../navItems';
import { useI18n } from '../i18n/I18nContext';
import { useSeo } from '../seo/useSeo';
import SeoContent from './SeoContent';
import { useHistoryStore } from '../store/useHistoryStore';
import { useClipboardPaste } from '../hooks/useClipboardPaste';
import LanguageSwitcher from './LanguageSwitcher';
import HistoryDrawer from './HistoryDrawer';

/** Logo de RoLuck: lockup completo expandido, solo el símbolo de la llama colapsado. */
function Logo({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-elevated">
          <img src="/logo-mark.png" alt="RoLuck" className="h-8 w-8" width={32} height={32} />
        </span>
      </div>
    );
  }
  return (
    <div className="flex justify-center px-3 py-4">
      <img
        src="/logo.png"
        alt="RoLuck Convertidor"
        className="h-auto w-full max-w-[150px]"
        width={480}
        height={455}
      />
    </div>
  );
}

/**
 * Pie de privacidad: ícono candado + nota desplegable. Refuerza que las imágenes
 * nunca salen del dispositivo y que solo se registran estadísticas anónimas.
 */
function PrivacyNote({ collapsed }: { collapsed: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="px-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={collapsed ? t.privacy.note : undefined}
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-text-muted transition-colors hover:text-text-primary ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <IconLock size={16} stroke={1.8} className="flex-shrink-0 text-accent" />
        {!collapsed && <span className="truncate">{t.privacy.label}</span>}
      </button>
      {!collapsed && open && (
        <p className="px-3 pb-2 text-[11px] leading-snug text-text-muted">{t.privacy.note}</p>
      )}
    </div>
  );
}

/**
 * Layout persistente: riel lateral en escritorio (ícono + etiqueta, colapsable a
 * solo íconos) y barra inferior en móvil. Envuelve todas las rutas vía <Outlet />.
 */
export default function RailLayout() {
  const { t } = useI18n();
  useSeo(); // Sincroniza title/description/canonical/OG con la ruta y el idioma.
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyCount = useHistoryStore((s) => s.entries.length);
  const [toast, setToast] = useState<string | null>(null);

  // Atajo global: pegar una imagen del portapapeles. Muestra un aviso transitorio.
  const handlePasted = useCallback(
    (kind: 'single' | 'queued') => {
      setToast(kind === 'queued' ? t.paste.queued : t.paste.pasted);
      window.setTimeout(() => setToast(null), 2500);
    },
    [t.paste.queued, t.paste.pasted],
  );
  useClipboardPaste(handlePasted);

  const primary = NAV_ITEMS.filter((i) => i.primary);
  const secondary = NAV_ITEMS.filter((i) => !i.primary);

  const linkBase =
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';
  const linkActive = 'bg-bg-elevated text-accent';
  const linkIdle = 'text-text-muted hover:bg-bg-elevated/60 hover:text-text-primary';

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      {/* ── Riel lateral (escritorio) ── */}
      <aside
        className={`sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-border bg-bg-surface md:flex ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <Logo collapsed={collapsed} />

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
          {NAV_ITEMS.map(({ to, key, Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? t.nav[key] : undefined}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkIdle} ${collapsed ? 'justify-center' : ''}`
              }
            >
              <Icon size={20} stroke={1.8} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{t.nav[key]}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          title={collapsed ? t.history.title : undefined}
          className={`${linkBase} mx-2 ${linkIdle} ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="relative flex-shrink-0">
            <IconHistory size={20} stroke={1.8} />
            {historyCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold text-bg-primary">
                {historyCount}
              </span>
            )}
          </span>
          {!collapsed && <span className="truncate">{t.history.title}</span>}
        </button>

        <PrivacyNote collapsed={collapsed} />

        <LanguageSwitcher compact={collapsed} />

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="m-2 flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-text-muted transition-colors hover:text-text-primary"
          aria-label={collapsed ? t.nav.expand : t.nav.collapse}
        >
          {collapsed ? <IconChevronRight size={16} /> : (
            <>
              <IconChevronLeft size={16} /> {t.nav.collapse}
            </>
          )}
        </button>
      </aside>

      {/* ── Contenido de la ruta ── */}
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <Suspense
            fallback={
              <div className="flex min-h-[300px] items-center justify-center">
                <svg className="h-6 w-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </div>
            }
          >
            <Outlet />
          </Suspense>
          <SeoContent />
        </div>
      </main>

      {/* ── Barra inferior (móvil) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-bg-surface md:hidden">
        {primary.map(({ to, key, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-text-muted'
              }`
            }
          >
            <Icon size={22} stroke={1.8} />
            <span>{t.nav[key]}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-text-muted"
        >
          <IconDots size={22} stroke={1.8} />
          <span>{t.nav.more}</span>
        </button>
      </nav>

      {/* ── Hoja "Más" (móvil) ── */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="rounded-t-2xl border-t border-border bg-bg-surface p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-text-primary">{t.nav.moreTools}</span>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label={t.nav.close}>
                <IconX size={18} className="text-text-muted" />
              </button>
            </div>
            {secondary.map(({ to, key, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkIdle}`
                }
              >
                <Icon size={20} stroke={1.8} />
                <span>{t.nav[key]}</span>
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setHistoryOpen(true);
              }}
              className={`${linkBase} w-full ${linkIdle}`}
            >
              <IconHistory size={20} stroke={1.8} />
              <span>{t.history.title}{historyCount > 0 && ` (${historyCount})`}</span>
            </button>
            <PrivacyNote collapsed={false} />
            <LanguageSwitcher />
          </div>
        </div>
      )}

      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />

      {/* Aviso transitorio al pegar desde el portapapeles. */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-accent/40 bg-bg-elevated px-4 py-2.5 text-sm font-medium text-text-primary shadow-lg md:bottom-6"
        >
          <IconClipboardCheck size={18} stroke={2} className="text-accent" />
          {toast}
        </div>
      )}
    </div>
  );
}
