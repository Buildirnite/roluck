#!/usr/bin/env node
/**
 * Prerender de SEO para la SPA. Tras `vite build`, toma dist/index.html como plantilla y
 * escribe un .html estático por ruta Y por idioma con el <head> ya sustituido: title,
 * description, canonical, tarjetas OG/Twitter, `hreflang` recíproco y JSON-LD (FAQ +
 * Breadcrumb). Así los bots que NO ejecutan JS y la primera carga de cada URL reciben la
 * meta correcta sin depender del runtime.
 *
 * Idiomas: español en la raíz (`/convertir` → dist/convertir.html) e inglés bajo `/en`
 * (`/en/convertir` → dist/en/convertir.html). Cada versión se autocanoniza y se enlaza con
 * la otra vía hreflang, de modo que ambas son indexables por separado. La home ES reescribe
 * dist/index.html; la home EN va a dist/en/index.html.
 *
 * El cuerpo (#root) no cambia: la app React hidrata igual al cargar. Nginx debe servir estos
 * archivos con `try_files $uri $uri.html $uri/ /index.html` (ver deploy/nginx.conf).
 *
 * También regenera dist/sitemap.xml con ambos idiomas y sus alternates. Sin dependencias.
 *
 *   node scripts/prerender.cjs
 */
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://roluck.app';
const LANGS = ['es', 'en'];
const BUILD_DATE = new Date().toISOString().slice(0, 10);
/** Rutas que NO van al sitemap (la home y las tools sí; /pro es un CTA delgado). */
const SITEMAP_EXCLUDE = new Set(['/pro']);

const dist = path.join(__dirname, '..', 'dist');
const meta = require('../src/seo/routeMeta.json');
const content = require('../src/seo/onPageContent.json');
const catalog = require('../src/catalog.data.json');
const templatePath = path.join(dist, 'index.html');

// Nombre de familia y herramienta por ruta para la miga de pan (misma fuente que useSeo).
const FAMILY_NAME = Object.fromEntries(catalog.families.map((f) => [f.id, f.name]));
const TOOL_BY_ROUTE = Object.fromEntries(catalog.tools.map((t) => [t.to, t]));
const HOME_NAME = { es: 'Inicio', en: 'Home' };

if (!fs.existsSync(templatePath)) {
  console.error('✗ No existe dist/index.html. Ejecuta `vite build` antes del prerender.');
  process.exit(1);
}
const template = fs.readFileSync(templatePath, 'utf8');

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Antepone el prefijo `/en` a una ruta lógica (espejo de src/i18n/localize.ts). */
function localize(route, lang) {
  if (lang === 'es') return route;
  return route === '/' ? '/en' : `/en${route}`;
}

/** URL absoluta de una ruta lógica en un idioma. */
function urlFor(route, lang) {
  const p = localize(route, lang);
  return p === '/' ? SITE_URL : `${SITE_URL}${p}`;
}

/** Reemplaza el content de un meta/título por su selector de atributo. */
function swap(html, patterns) {
  let out = html;
  for (const [regex, replacement] of patterns) {
    if (!regex.test(out)) {
      console.warn(`  ⚠ patrón no encontrado: ${regex}`);
    }
    out = out.replace(regex, replacement);
  }
  return out;
}

/** Bloque de contenido on-page (encabezado + intro + FAQ) para los bots sin JS. */
function contentHtml(c) {
  if (!c) return '';
  const intro = c.intro.map((p) => `<p>${esc(p)}</p>`).join('');
  const faq = c.faq
    .map((f) => `<div><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`)
    .join('');
  // Dentro de #root: React lo reemplaza al hidratar, así los usuarios ven la app normal
  // y los rastreadores que no ejecutan JS leen este contenido real e indexable.
  return `<section><h1>${esc(c.heading)}</h1>${intro}<section>${faq}</section></section>`;
}

/** FAQPage JSON-LD para el <head> estático. */
function faqJsonLd(c) {
  if (!c || !c.faq.length) return '';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

/** BreadcrumbList JSON-LD (Inicio → Familia → Herramienta) para el <head> estático. */
function breadcrumbJsonLd(route, lang) {
  const tool = TOOL_BY_ROUTE[route];
  if (!tool) return '';
  const trail = [
    { name: HOME_NAME[lang], item: urlFor('/', lang) },
    { name: FAMILY_NAME[tool.family][lang] },
    { name: tool.name[lang], item: urlFor(tool.to, lang) },
  ];
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.item ? { item: c.item } : {}),
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

/** Links hreflang recíprocos (es / en / x-default) para la ruta. */
function hreflangLinks(route) {
  return [
    `<link rel="alternate" hreflang="es" href="${urlFor(route, 'es')}" />`,
    `<link rel="alternate" hreflang="en" href="${urlFor(route, 'en')}" />`,
    `<link rel="alternate" hreflang="x-default" href="${urlFor(route, 'es')}" />`,
  ].join('\n    ');
}

function renderRoute(route, lang) {
  const m = meta[route][lang];
  const c = content[route] ? content[route][lang] : null;
  const title = esc(m.title);
  const description = esc(m.description);
  const url = urlFor(route, lang);
  const ogLocale = lang === 'en' ? 'en_US' : 'es_ES';
  const ogAlt = lang === 'en' ? 'es_ES' : 'en_US';
  let html = swap(template, [
    [/<html lang="[^"]*">/, `<html lang="${lang}">`],
    [/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`],
    [/(<meta name="description" content=")[\s\S]*?(" \/>)/, `$1${description}$2`],
    [/(<link rel="canonical" href=")[\s\S]*?(" \/>)/, `$1${url}$2`],
    [/(<meta property="og:url" content=")[\s\S]*?(" \/>)/, `$1${url}$2`],
    [/(<meta property="og:title" content=")[\s\S]*?(" \/>)/, `$1${title}$2`],
    [/(<meta property="og:description" content=")[\s\S]*?(" \/>)/, `$1${description}$2`],
    [/(<meta property="og:locale" content=")[\s\S]*?(" \/>)/, `$1${ogLocale}$2`],
    [/(<meta property="og:locale:alternate" content=")[\s\S]*?(" \/>)/, `$1${ogAlt}$2`],
    [/(<meta name="twitter:title" content=")[\s\S]*?(" \/>)/, `$1${title}$2`],
    [/(<meta name="twitter:description" content=")[\s\S]*?(" \/>)/, `$1${description}$2`],
  ]);
  // hreflang + FAQPage + BreadcrumbList antes de </head>.
  const head = [hreflangLinks(route), faqJsonLd(c), breadcrumbJsonLd(route, lang)]
    .filter(Boolean)
    .join('\n    ');
  if (head) html = html.replace('</head>', `    ${head}\n  </head>`);
  // Contenido indexable dentro de #root (React lo sustituye al montar).
  const body = contentHtml(c);
  if (body) html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
}

/** Ruta de salida en dist para (ruta lógica, idioma). */
function outFile(route, lang) {
  const dir = lang === 'en' ? path.join(dist, 'en') : dist;
  if (route === '/') return lang === 'en' ? path.join(dir, 'index.html') : templatePath;
  return path.join(dir, `${route.replace(/^\//, '')}.html`);
}

let count = 0;
for (const route of Object.keys(meta)) {
  for (const lang of LANGS) {
    const file = outFile(route, lang);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, renderRoute(route, lang));
    count++;
    console.log(`  ✓ ${path.relative(dist, file)}`);
  }
}

// ── Sitemap con ambos idiomas y sus alternates ──
const urls = Object.keys(meta)
  .filter((route) => !SITEMAP_EXCLUDE.has(route))
  .flatMap((route) =>
    LANGS.map((lang) => {
      const alts = [
        `<xhtml:link rel="alternate" hreflang="es" href="${urlFor(route, 'es')}"/>`,
        `<xhtml:link rel="alternate" hreflang="en" href="${urlFor(route, 'en')}"/>`,
        `<xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(route, 'es')}"/>`,
      ].join('');
      return `  <url><loc>${urlFor(route, lang)}</loc>${alts}<lastmod>${BUILD_DATE}</lastmod></url>`;
    }),
  )
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
console.log('  ✓ sitemap.xml');

console.log(`✓ Prerender: ${count} páginas (${LANGS.length} idiomas) generadas en dist/`);
