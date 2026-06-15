import { useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { stripLang } from '../i18n/localize';
import content from '../seo/onPageContent.json';

type FaqItem = { q: string; a: string };
type PageContent = { heading: string; intro: string[]; faq: FaqItem[] };
type ContentMap = Record<string, { es: PageContent; en: PageContent }>;

const CONTENT = content as ContentMap;

const SUMMARY = { es: 'Sobre esta herramienta', en: 'About this tool' } as const;
const FAQ_TITLE = { es: 'Preguntas frecuentes', en: 'Frequently asked questions' } as const;

/**
 * Contenido on-page para SEO: encabezado, descripción con palabras clave y FAQ por ruta.
 * Va en una sección colapsable discreta al pie de cada página para no alterar la UI de la
 * herramienta. Es texto real e indexable (Google rastrea el contenido de <details>), y el
 * prerender lo inyecta también en el HTML estático para los bots que no ejecutan JS. El
 * FAQPage JSON-LD correspondiente lo añade el hook useSeo.
 */
export default function SeoContent() {
  const { pathname } = useLocation();
  const { lang } = useI18n();
  const entry = CONTENT[stripLang(pathname)];
  if (!entry) return null;
  const page = entry[lang];

  return (
    <details className="mt-12 border-t border-border pt-4 text-sm text-text-muted">
      <summary className="cursor-pointer select-none font-mono text-xs uppercase tracking-wide text-text-muted transition-colors hover:text-text-primary">
        {SUMMARY[lang]}
      </summary>
      <div className="mt-4 space-y-4 leading-relaxed">
        <h2 className="font-display text-base font-semibold text-text-primary">{page.heading}</h2>
        {page.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-text-primary">{FAQ_TITLE[lang]}</h3>
          {page.faq.map((item, i) => (
            <div key={i}>
              <h4 className="font-medium text-text-primary">{item.q}</h4>
              <p className="mt-0.5">{item.a}</p>
            </div>
          ))}
        </section>
      </div>
    </details>
  );
}
