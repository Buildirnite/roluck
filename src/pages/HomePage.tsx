import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowRight, IconLock, IconSparkles } from '@tabler/icons-react';
import { FAMILIES, toolsByFamily, liveTools, tr, type Tool } from '../catalog';
import { useI18n } from '../i18n/I18nContext';
import { localize } from '../i18n/localize';
import ProBadge from '../components/ProBadge';

/** Tarjeta de una herramienta en línea: enlaza a su subruta. */
function ToolCard({ tool }: { tool: Tool }) {
  const { lang } = useI18n();
  const { Icon } = tool;
  return (
    <Link
      to={localize(tool.to, lang)}
      className="group flex h-full flex-col rounded-xl border border-border bg-bg-surface p-3.5 transition-colors hover:border-accent/40 hover:bg-bg-elevated sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-elevated text-accent transition-colors group-hover:bg-accent/15">
          <Icon size={20} stroke={1.8} />
        </span>
        {tool.pro && <ProBadge />}
      </div>
      <h3 className="font-display text-sm font-semibold text-text-primary">{tr(tool.name, lang)}</h3>
      <p className="mt-1 text-xs leading-snug text-text-muted">{tr(tool.desc, lang)}</p>
    </Link>
  );
}

/** Tarjeta de una herramienta del roadmap: atenuada y no enlazable. */
function SoonCard({ tool }: { tool: Tool }) {
  const { lang, t } = useI18n();
  const { Icon } = tool;
  return (
    <div className="flex h-full cursor-default flex-col rounded-xl border border-dashed border-border bg-bg-surface/40 p-3.5 opacity-60 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-elevated text-text-muted">
          <Icon size={20} stroke={1.8} />
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          {t.home.soon}
        </span>
      </div>
      <h3 className="font-display text-sm font-semibold text-text-primary">{tr(tool.name, lang)}</h3>
      <p className="mt-1 text-xs leading-snug text-text-muted">{tr(tool.desc, lang)}</p>
    </div>
  );
}

/** Punto + texto en mono para la fila de garantías bajo el hero. */
function Stat({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * Home del hub (informe §6.0). Maquetada mobile-first: el símbolo de marca (perro tech)
 * ancla el hero también en teléfono, las herramientas se muestran en grilla de 2 columnas
 * desde móvil, y los rótulos estructurales usan la mono (JetBrains) para reforzar la
 * estética "corre 100% local". La grilla se arma desde el catálogo. La FAQ + contenido
 * SEO los aporta <SeoContent> al pie.
 */
export default function HomePage() {
  const { t, lang } = useI18n();

  return (
    <div className="space-y-12">
      {/* ── Hero ── */}
      <section className="pt-2 sm:pt-4">
        <div className="flex flex-col-reverse items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:gap-10 md:text-left">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wide text-accent">
              <IconLock size={13} stroke={2} />
              {t.privacy.badge}
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl lg:text-5xl">
              {t.home.heroTitle}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-text-muted md:mx-0 md:text-base">
              {t.home.heroSubtitle}
            </p>
            <a
              href="#herramientas"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
            >
              {t.home.heroCta}
              <IconArrowRight size={16} stroke={2.2} />
            </a>
          </div>
          {/* Símbolo de marca (perro tech): la firma del hub. Visible también en móvil. */}
          <img
            src="/logo-mark.png"
            alt=""
            aria-hidden="true"
            width={256}
            height={256}
            className="w-32 flex-shrink-0 select-none sm:w-40 md:w-44 lg:w-52"
          />
        </div>

        {/* Garantías en mono: codifican la promesa real (alcance + privacidad). */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border pt-5 font-mono text-[11px] text-text-muted md:justify-start md:text-xs">
          <Stat>{t.home.toolsCount(liveTools.length)}</Stat>
          <Stat>{t.home.statLocal}</Stat>
          <Stat>{t.home.statNoUpload}</Stat>
        </div>
      </section>

      {/* ── Familias de herramientas ── */}
      <div id="herramientas" className="space-y-10 scroll-mt-6">
        {FAMILIES.map((family) => {
          const tools = toolsByFamily(family.id);
          if (tools.length === 0) return null;
          const liveCount = tools.filter((tool) => tool.status === 'live').length;
          return (
            <section key={family.id}>
              <div className="mb-4 flex items-end justify-between gap-3 border-b border-border pb-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold text-text-primary sm:text-xl">
                    {tr(family.name, lang)}
                  </h2>
                  <p className="mt-0.5 text-xs text-text-muted sm:text-sm">{tr(family.tagline, lang)}</p>
                </div>
                <span className="flex-shrink-0 font-mono text-[11px] uppercase tracking-wide text-text-muted">
                  {t.home.toolsCount(liveCount)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {tools.map((tool) =>
                  tool.status === 'live' ? (
                    <ToolCard key={tool.to} tool={tool} />
                  ) : (
                    <SoonCard key={tool.to} tool={tool} />
                  ),
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Privacidad ── */}
      <section className="rounded-2xl border border-border bg-bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <IconLock size={20} stroke={1.8} />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-text-primary sm:text-lg">{t.home.privacyTitle}</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-text-muted">{t.home.privacyBody}</p>
          </div>
        </div>
      </section>

      {/* ── CTA Pro (discreto) ── */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-accent/30 bg-accent/[0.06] p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <IconSparkles size={20} stroke={1.8} />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-text-primary sm:text-lg">{t.pro.title}</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-text-muted">{t.pro.subtitle}</p>
          </div>
        </div>
        <Link
          to={localize('/pro', lang)}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg border border-accent px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-ink"
        >
          {t.pro.cta}
          <IconArrowRight size={16} stroke={2.2} />
        </Link>
      </section>
    </div>
  );
}
