import { Link } from 'react-router-dom';
import { IconArrowRight, IconLock, IconSparkles } from '@tabler/icons-react';
import { FAMILIES, toolsByFamily, tr, type Tool } from '../catalog';
import { useI18n } from '../i18n/I18nContext';
import ProBadge from '../components/ProBadge';

/** Tarjeta de una herramienta en línea: enlaza a su subruta. */
function ToolCard({ tool }: { tool: Tool }) {
  const { lang } = useI18n();
  const { Icon } = tool;
  return (
    <Link
      to={tool.to}
      className="group flex flex-col rounded-xl border border-border bg-bg-surface p-4 transition-colors hover:border-accent/40 hover:bg-bg-elevated"
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
    <div className="flex cursor-default flex-col rounded-xl border border-dashed border-border bg-bg-surface/40 p-4 opacity-60">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-elevated text-text-muted">
          <Icon size={20} stroke={1.8} />
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          {t.home.soon}
        </span>
      </div>
      <h3 className="font-display text-sm font-semibold text-text-primary">{tr(tool.name, lang)}</h3>
      <p className="mt-1 text-xs leading-snug text-text-muted">{tr(tool.desc, lang)}</p>
    </div>
  );
}

/**
 * Home del hub (informe §6.0). Presenta la suite agrupada en sus dos familias, con la
 * promesa de privacidad por delante y un CTA discreto a RoLuck Pro. La grilla se arma
 * desde el catálogo: las herramientas en línea enlazan a su subruta y las del roadmap
 * se muestran atenuadas. La FAQ + contenido SEO los aporta <SeoContent> al pie.
 */
export default function HomePage() {
  const { t, lang } = useI18n();

  return (
    <div className="space-y-12">
      {/* ── Hero ── */}
      <section className="pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <IconLock size={13} stroke={2} />
          {t.privacy.badge}
        </span>
        <h1 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          {t.home.heroTitle}
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-text-muted">{t.home.heroSubtitle}</p>
        <a
          href="#herramientas"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
        >
          {t.home.heroCta}
          <IconArrowRight size={16} stroke={2.2} />
        </a>
      </section>

      {/* ── Familias de herramientas ── */}
      <div id="herramientas" className="space-y-10 scroll-mt-6">
        {FAMILIES.map((family) => {
          const tools = toolsByFamily(family.id);
          if (tools.length === 0) return null;
          return (
            <section key={family.id}>
              <div className="mb-4">
                <h2 className="font-display text-xl font-bold text-text-primary">{tr(family.name, lang)}</h2>
                <p className="mt-0.5 text-sm text-text-muted">{tr(family.tagline, lang)}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      <section className="rounded-2xl border border-border bg-bg-surface p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <IconLock size={20} stroke={1.8} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">{t.home.privacyTitle}</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-text-muted">{t.home.privacyBody}</p>
          </div>
        </div>
      </section>

      {/* ── CTA Pro (discreto) ── */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-accent/30 bg-accent/[0.06] p-6 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <IconSparkles size={20} stroke={1.8} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">{t.pro.title}</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-text-muted">{t.pro.subtitle}</p>
          </div>
        </div>
        <Link
          to="/pro"
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg border border-accent px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-ink"
        >
          {t.pro.cta}
          <IconArrowRight size={16} stroke={2.2} />
        </Link>
      </section>
    </div>
  );
}
