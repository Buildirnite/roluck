import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import routeMeta from './routeMeta.json';
import onPageContent from './onPageContent.json';

const SITE_URL = 'https://roluck.app';

// Valores por defecto (home) — coinciden con los estáticos de index.html.
const DEFAULT = {
  es: {
    title: 'RoLuck — Hub de herramientas gratis en tu navegador',
    description:
      'Herramientas gratis en tu navegador: imágenes (convertir, comprimir, editar, PDF), conversores (unidades, QR, fechas) y calculadoras chilenas (UF, sueldo líquido, finiquito). Sin subir nada a ningún servidor.',
  },
  en: {
    title: 'RoLuck — Free tools hub in your browser',
    description:
      'Free tools that run in your browser: images (convert, compress, edit, PDF), converters (units, QR, dates) and calculators. Nothing is uploaded to any server.',
  },
} as const;

type Meta = { title: string; description: string };
type RouteMeta = Record<string, { es: Meta; en: Meta }>;

const META = routeMeta as RouteMeta;

type FaqItem = { q: string; a: string };
type PageContent = { heading: string; intro: string[]; faq: FaqItem[] };
type ContentMap = Record<string, { es: PageContent; en: PageContent }>;

const CONTENT = onPageContent as ContentMap;

const FAQ_SCRIPT_ID = 'faq-jsonld';

/** Inserta/actualiza el FAQPage JSON-LD de la ruta, o lo elimina si no hay FAQ. */
function applyFaqJsonLd(faq: FaqItem[] | undefined) {
  let script = document.getElementById(FAQ_SCRIPT_ID) as HTMLScriptElement | null;
  if (!faq || faq.length === 0) {
    if (script) script.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = FAQ_SCRIPT_ID;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  });
}

/** Crea o actualiza un <meta>/<link> en el <head> por atributo identificador. */
function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function applyMeta(title: string, description: string, canonical: string) {
  document.title = title;
  setTag('meta[name="description"]', () => {
    const m = document.createElement('meta');
    m.setAttribute('name', 'description');
    return m;
  }, 'content', description);
  setTag('link[rel="canonical"]', () => {
    const l = document.createElement('link');
    l.setAttribute('rel', 'canonical');
    return l;
  }, 'href', canonical);
  // Open Graph + Twitter — mantener las tarjetas sociales sincronizadas por ruta.
  const og: Array<[string, string, string]> = [
    ['meta[property="og:title"]', 'property', 'og:title'],
    ['meta[property="og:description"]', 'property', 'og:description'],
    ['meta[property="og:url"]', 'property', 'og:url'],
    ['meta[name="twitter:title"]', 'name', 'twitter:title'],
    ['meta[name="twitter:description"]', 'name', 'twitter:description'],
  ];
  const values: Record<string, string> = {
    'og:title': title,
    'og:description': description,
    'og:url': canonical,
    'twitter:title': title,
    'twitter:description': description,
  };
  for (const [selector, attr, key] of og) {
    setTag(selector, () => {
      const m = document.createElement('meta');
      m.setAttribute(attr, key);
      return m;
    }, 'content', values[key]);
  }
}

/**
 * Sincroniza el <head> con la ruta y el idioma actuales. La SPA cambia de vista sin
 * recargar, así que los buscadores que ejecutan JS y las tarjetas sociales necesitan
 * que title/description/canonical/OG se actualicen al navegar. El prerender genera la
 * versión estática equivalente para la primera carga de cada URL.
 */
export function useSeo() {
  const { pathname } = useLocation();
  const { lang } = useI18n();

  useEffect(() => {
    const entry = META[pathname];
    const meta = entry ? entry[lang] : DEFAULT[lang];
    const canonical = pathname === '/' ? SITE_URL : `${SITE_URL}${pathname}`;
    applyMeta(meta.title, meta.description, canonical);
    applyFaqJsonLd(CONTENT[pathname]?.[lang]?.faq);
  }, [pathname, lang]);
}
