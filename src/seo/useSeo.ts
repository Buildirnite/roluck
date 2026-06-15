import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import routeMeta from './routeMeta.json';
import onPageContent from './onPageContent.json';
import catalog from '../catalog.data.json';
import { langFromPath, localize, stripLang } from '../i18n/localize';

const SITE_URL = 'https://roluck.app';

type Lang = 'es' | 'en';

/** URL absoluta de una ruta lógica en un idioma (`/convertir`, en → …/en/convertir). */
function urlFor(route: string, lang: Lang): string {
  const p = localize(route, lang);
  return p === '/' ? SITE_URL : `${SITE_URL}${p}`;
}

// Nombre de cada familia y herramienta por ruta, para armar la miga de pan
// (Inicio → Familia → Herramienta). Misma fuente que el prerender (catalog.data.json).
const HOME_NAME: Record<Lang, string> = { es: 'Inicio', en: 'Home' };
const FAMILY_NAME = Object.fromEntries(
  catalog.families.map((f) => [f.id, f.name]),
) as Record<string, Record<Lang, string>>;
const TOOL_BY_ROUTE = Object.fromEntries(
  catalog.tools.map((t) => [t.to, t]),
) as Record<string, (typeof catalog.tools)[number]>;

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

const BREADCRUMB_SCRIPT_ID = 'breadcrumb-jsonld';

/**
 * Inserta/actualiza el BreadcrumbList JSON-LD (Inicio → Familia → Herramienta) de la
 * ruta, o lo elimina en la home y en rutas sin herramienta asociada (p. ej. /pro).
 */
function applyBreadcrumbJsonLd(route: string, lang: Lang) {
  let script = document.getElementById(BREADCRUMB_SCRIPT_ID) as HTMLScriptElement | null;
  const tool = TOOL_BY_ROUTE[route];
  if (!tool) {
    if (script) script.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = BREADCRUMB_SCRIPT_ID;
    document.head.appendChild(script);
  }
  const trail = [
    { name: HOME_NAME[lang], item: urlFor('/', lang) },
    { name: FAMILY_NAME[tool.family][lang], item: undefined },
    { name: tool.name[lang], item: urlFor(tool.to, lang) },
  ];
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.item ? { item: c.item } : {}),
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

/**
 * Mantiene los `<link rel="alternate" hreflang>` recíprocos (es / en / x-default) de la
 * ruta actual. Cada versión de idioma vive en su propia URL, así Google sabe cuál servir.
 */
function applyHreflang(route: string) {
  const alts: Array<[string, string]> = [
    ['es', urlFor(route, 'es')],
    ['en', urlFor(route, 'en')],
    ['x-default', urlFor(route, 'es')],
  ];
  for (const [hreflang, href] of alts) {
    setTag(
      `link[rel="alternate"][hreflang="${hreflang}"]`,
      () => {
        const l = document.createElement('link');
        l.setAttribute('rel', 'alternate');
        l.setAttribute('hreflang', hreflang);
        return l;
      },
      'href',
      href,
    );
  }
}

function applyMeta(title: string, description: string, canonical: string, lang: Lang) {
  document.title = title;
  setTag('meta[property="og:locale"]', () => {
    const m = document.createElement('meta');
    m.setAttribute('property', 'og:locale');
    return m;
  }, 'content', lang === 'en' ? 'en_US' : 'es_ES');
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

  useEffect(() => {
    // El idioma y la ruta lógica se derivan de la URL (ES en raíz, EN bajo /en).
    const lang = langFromPath(pathname);
    const route = stripLang(pathname);
    const entry = META[route];
    const meta = entry ? entry[lang] : DEFAULT[lang];
    applyMeta(meta.title, meta.description, urlFor(route, lang), lang);
    applyHreflang(route);
    applyFaqJsonLd(CONTENT[route]?.[lang]?.faq);
    applyBreadcrumbJsonLd(route, lang);
  }, [pathname]);
}
