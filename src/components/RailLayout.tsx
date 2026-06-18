import { Suspense, useCallback, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight, IconDots, IconX, IconHistory, IconClipboardCheck, IconLock, IconHeart, IconHome2, IconSearch, IconLayoutGrid, IconArrowLeft, IconStack2, IconBuildingStore } from '@tabler/icons-react';
import { liveTools, FAMILIES, toolsByFamily, tr, type Family } from '../catalog';
import { useI18n } from '../i18n/I18nContext';
import { localize } from '../i18n/localize';
import { useModal } from '../hooks/useModal';
import { useSeo } from '../seo/useSeo';
import SeoContent from './SeoContent';
import { useHistoryStore } from '../store/useHistoryStore';
import { useClipboardPaste } from '../hooks/useClipboardPaste';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import HistoryDrawer from './HistoryDrawer';

/** Ícono representativo de cada familia para la grilla de categorías (móvil). */
const FAMILY_ICONS: Record<Family, typeof IconStack2> = {
  files: IconStack2,
  chile: IconBuildingStore,
};

/** Normaliza para buscar sin distinguir acentos ni mayúsculas. */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Logo de RoLuck: lockup completo expandido, solo el símbolo (perro) colapsado. */
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
        alt="RoLuck — Hub de herramientas"
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

// URL de donaciones (Ko-fi, Buy Me a Coffee, PayPal…). Configurable por entorno para
// no hardcodear la cuenta; si está vacía, el botón no se muestra.
const DONATE_URL = (import.meta.env.VITE_DONATE_URL as string | undefined)?.trim();

/**
 * Botón de apoyo: abre un modal con el código QR de donación + un CTA a PayPal.
 * Privacidad intacta — sin scripts ni cookies de terceros, solo un enlace externo.
 * Se oculta por completo si no hay URL configurada.
 */
function DonateButton({ collapsed }: { collapsed: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const dialogRef = useModal<HTMLDivElement>(() => setOpen(false), open);
  if (!DONATE_URL) return null;
  return (
    <>
      <div className="px-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={t.donate.title}
          className={`flex w-full items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <IconHeart size={16} stroke={2} className="flex-shrink-0" />
          {!collapsed && <span className="truncate">{t.donate.label}</span>}
        </button>
      </div>

      {open && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setOpen(false)}
        >
          <div
            tabIndex={-1}
            className="w-full max-w-xs rounded-2xl border border-border bg-bg-surface p-5 text-center focus:outline-none"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <IconHeart size={18} stroke={2} className="text-accent" />
                {t.donate.label}
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.nav.close}>
                <IconX size={18} className="text-text-muted transition-colors hover:text-text-primary" />
              </button>
            </div>
            <p className="mb-4 text-xs leading-snug text-text-muted">{t.donate.scan}</p>
            <img
              src="/donate-qr.png"
              alt={t.donate.title}
              className="mx-auto mb-4 h-44 w-44 rounded-lg bg-white p-2"
              width={176}
              height={176}
            />
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
            >
              <IconHeart size={16} stroke={2} />
              {t.donate.cta}
            </a>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Layout persistente: riel lateral en escritorio (ícono + etiqueta, colapsable a
 * solo íconos) y barra inferior en móvil. Envuelve todas las rutas vía <Outlet />.
 */
export default function RailLayout() {
  const { t, lang } = useI18n();
  useSeo(); // Sincroniza title/description/canonical/OG con la ruta y el idioma.
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [activeFamily, setActiveFamily] = useState<Family | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyCount = useHistoryStore((s) => s.entries.length);
  const [toast, setToast] = useState<string | null>(null);
  const moreRef = useModal<HTMLDivElement>(() => setMoreOpen(false), moreOpen);
  const catRef = useModal<HTMLDivElement>(() => setCatOpen(false), catOpen);
  const searchRef = useModal<HTMLDivElement>(() => setSearchOpen(false), searchOpen);

  // Cierra la hoja de categorías volviendo siempre al nivel raíz.
  const closeCategories = useCallback(() => {
    setCatOpen(false);
    setActiveFamily(null);
  }, []);

  // Resultados de búsqueda: todo el catálogo si está vacío; filtra por nombre/descripción.
  const q = norm(query.trim());
  const searchResults = q
    ? liveTools.filter((tool) => norm(tr(tool.name, lang)).includes(q) || norm(tr(tool.desc, lang)).includes(q))
    : liveTools;

  // Atajo global: pegar una imagen del portapapeles. Muestra un aviso transitorio.
  const handlePasted = useCallback(
    (kind: 'single' | 'queued') => {
      setToast(kind === 'queued' ? t.paste.queued : t.paste.pasted);
      window.setTimeout(() => setToast(null), 2500);
    },
    [t.paste.queued, t.paste.pasted],
  );
  useClipboardPaste(handlePasted);

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
          {/* Inicio (hub) */}
          <NavLink
            to={localize('/', lang)}
            end
            title={collapsed ? t.home.inicio : undefined}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkIdle} ${collapsed ? 'justify-center' : ''}`
            }
          >
            <IconHome2 size={20} stroke={1.8} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{t.home.inicio}</span>}
          </NavLink>

          {/* Herramientas agrupadas por familia (solo las que existen hoy) */}
          {FAMILIES.map((family) => {
            const tools = toolsByFamily(family.id, 'live');
            if (tools.length === 0) return null;
            return (
              <div key={family.id} className="mt-1.5">
                {collapsed ? (
                  <div className="mx-2 my-1.5 border-t border-border" />
                ) : (
                  <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                    {tr(family.name, lang)}
                  </p>
                )}
                {tools.map(({ to, name, Icon }) => (
                  <NavLink
                    key={to}
                    to={localize(to, lang)}
                    title={collapsed ? tr(name, lang) : undefined}
                    className={({ isActive }) =>
                      `${linkBase} ${isActive ? linkActive : linkIdle} ${collapsed ? 'justify-center' : ''}`
                    }
                  >
                    <Icon size={20} stroke={1.8} className="flex-shrink-0" />
                    {!collapsed && <span className="truncate">{tr(name, lang)}</span>}
                  </NavLink>
                ))}
              </div>
            );
          })}
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
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold text-accent-ink">
                {historyCount}
              </span>
            )}
          </span>
          {!collapsed && <span className="truncate">{t.history.title}</span>}
        </button>

        <DonateButton collapsed={collapsed} />

        <PrivacyNote collapsed={collapsed} />

        <ThemeToggle compact={collapsed} />

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
      <main className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
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

      {/* ── Barra inferior (móvil): Inicio · Buscar · Categorías · Más ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <NavLink
          to={localize('/', lang)}
          end
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
              isActive ? 'text-accent' : 'text-text-muted'
            }`
          }
        >
          <IconHome2 size={22} stroke={1.8} />
          <span>{t.home.inicio}</span>
        </NavLink>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
            searchOpen ? 'text-accent' : 'text-text-muted'
          }`}
        >
          <IconSearch size={22} stroke={1.8} />
          <span>{t.nav.search}</span>
        </button>
        <button
          type="button"
          onClick={() => setCatOpen(true)}
          className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
            catOpen ? 'text-accent' : 'text-text-muted'
          }`}
        >
          <IconLayoutGrid size={22} stroke={1.8} />
          <span>{t.nav.categories}</span>
        </button>
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
            moreOpen ? 'text-accent' : 'text-text-muted'
          }`}
        >
          <IconDots size={22} stroke={1.8} />
          <span>{t.nav.more}</span>
        </button>
      </nav>

      {/* ── Hoja "Categorías" (móvil): grilla de familias → herramientas de cada una ── */}
      {catOpen && (
        <div
          ref={catRef}
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 md:hidden"
          role="dialog"
          aria-modal="true"
          onMouseDown={closeCategories}
        >
          <div
            tabIndex={-1}
            className="max-h-[80vh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-border bg-bg-surface p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] focus:outline-none"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {activeFamily === null ? (
              <>
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-text-primary">{t.nav.categories}</span>
                  <button type="button" onClick={closeCategories} aria-label={t.nav.close}>
                    <IconX size={18} className="text-text-muted" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {FAMILIES.map((family) => {
                    const tools = toolsByFamily(family.id, 'live');
                    if (tools.length === 0) return null;
                    const FIcon = FAMILY_ICONS[family.id];
                    return (
                      <button
                        key={family.id}
                        type="button"
                        onClick={() => setActiveFamily(family.id)}
                        className="flex flex-col items-start gap-2 rounded-xl border border-border bg-bg-elevated/40 p-3 text-left transition-colors hover:border-accent/40"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-elevated text-accent">
                          <FIcon size={20} stroke={1.8} />
                        </span>
                        <span className="text-sm font-semibold text-text-primary">{tr(family.name, lang)}</span>
                        <span className="text-[11px] text-text-muted">{t.nav.toolCount(tools.length)}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setActiveFamily(null)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-text-primary"
                    aria-label={t.nav.back}
                  >
                    <IconArrowLeft size={18} stroke={1.8} className="text-text-muted" />
                    {tr(FAMILIES.find((f) => f.id === activeFamily)!.name, lang)}
                  </button>
                  <button type="button" onClick={closeCategories} aria-label={t.nav.close}>
                    <IconX size={18} className="text-text-muted" />
                  </button>
                </div>
                {toolsByFamily(activeFamily, 'live').map(({ to, name, Icon }) => (
                  <NavLink
                    key={to}
                    to={localize(to, lang)}
                    onClick={closeCategories}
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
                  >
                    <Icon size={20} stroke={1.8} />
                    <span>{tr(name, lang)}</span>
                  </NavLink>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Buscador (móvil): filtra todo el catálogo por nombre/descripción ── */}
      {searchOpen && (
        <div
          ref={searchRef}
          className="fixed inset-0 z-50 flex flex-col bg-bg-primary md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center gap-2 border-b border-border p-3 pt-[calc(0.5rem+env(safe-area-inset-top))]">
            <IconSearch size={20} stroke={1.8} className="flex-shrink-0 text-text-muted" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.nav.searchPlaceholder}
              aria-label={t.nav.search}
              className="min-w-0 flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted sm:text-sm"
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setQuery('');
              }}
              aria-label={t.nav.close}
            >
              <IconX size={20} className="text-text-muted" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain p-2">
            {searchResults.length === 0 ? (
              <p className="p-6 text-center text-sm text-text-muted">{t.nav.noResults}</p>
            ) : (
              searchResults.map(({ to, name, desc, Icon }) => (
                <NavLink
                  key={to}
                  to={localize(to, lang)}
                  onClick={() => {
                    setSearchOpen(false);
                    setQuery('');
                  }}
                  className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
                >
                  <Icon size={20} stroke={1.8} className="flex-shrink-0" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-text-primary">{tr(name, lang)}</span>
                    <span className="truncate text-[11px] text-text-muted">{tr(desc, lang)}</span>
                  </span>
                </NavLink>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Hoja "Más" (móvil): solo ajustes y utilidades ── */}
      {moreOpen && (
        <div
          ref={moreRef}
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 md:hidden"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setMoreOpen(false)}
        >
          <div
            tabIndex={-1}
            className="rounded-t-2xl border-t border-border bg-bg-surface p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] focus:outline-none"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-text-primary">{t.nav.settings}</span>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label={t.nav.close}>
                <IconX size={18} className="text-text-muted" />
              </button>
            </div>
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
            <DonateButton collapsed={false} />
            <PrivacyNote collapsed={false} />
            <ThemeToggle />
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
