#!/usr/bin/env node
/**
 * Prerender de SEO para la SPA. Tras `vite build`, toma dist/index.html como plantilla
 * y escribe un .html estático por ruta (dist/convertir.html, dist/comprimir.html, …)
 * con el <head> ya sustituido: title, description, canonical y las tarjetas OG/Twitter
 * propias de esa página. Así los bots que NO ejecutan JS (Bing, redes sociales, etc.) y
 * la primera carga de cada URL reciben la meta correcta sin depender del runtime.
 *
 * El cuerpo (#root) no cambia: la app React hidrata igual al cargar. Nginx debe servir
 * estos archivos con `try_files $uri $uri.html … /index.html` (ver deploy/nginx.conf).
 *
 * Sin dependencias. Se ejecuta dentro de `npm run build`.
 *
 *   node scripts/prerender.cjs
 */
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://roluck.app';
const LANG = 'es'; // Idioma por defecto del HTML estático (coincide con <html lang="es">).

const dist = path.join(__dirname, '..', 'dist');
const meta = require('../src/seo/routeMeta.json');
const content = require('../src/seo/onPageContent.json');
const templatePath = path.join(dist, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('✗ No existe dist/index.html. Ejecuta `vite build` antes del prerender.');
  process.exit(1);
}
const template = fs.readFileSync(templatePath, 'utf8');

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

function renderRoute(route, m, c) {
  const title = esc(m.title);
  const description = esc(m.description);
  const url = `${SITE_URL}${route}`;
  let html = swap(template, [
    [/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`],
    [/(<meta name="description" content=")[\s\S]*?(" \/>)/, `$1${description}$2`],
    [/(<link rel="canonical" href=")[\s\S]*?(" \/>)/, `$1${url}$2`],
    [/(<meta property="og:url" content=")[\s\S]*?(" \/>)/, `$1${url}$2`],
    [/(<meta property="og:title" content=")[\s\S]*?(" \/>)/, `$1${title}$2`],
    [/(<meta property="og:description" content=")[\s\S]*?(" \/>)/, `$1${description}$2`],
    [/(<meta name="twitter:title" content=")[\s\S]*?(" \/>)/, `$1${title}$2`],
    [/(<meta name="twitter:description" content=")[\s\S]*?(" \/>)/, `$1${description}$2`],
  ]);
  // FAQPage JSON-LD antes de </head>.
  const ld = faqJsonLd(c);
  if (ld) html = html.replace('</head>', `    ${ld}\n  </head>`);
  // Contenido indexable dentro de #root (React lo sustituye al montar).
  const body = contentHtml(c);
  if (body) html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
}

let count = 0;
for (const [route, langs] of Object.entries(meta)) {
  const m = langs[LANG];
  const c = content[route] ? content[route][LANG] : null;
  const html = renderRoute(route, m, c);
  // La home ('/') reescribe el propio index.html; el resto generan <ruta>.html.
  const file =
    route === '/' ? templatePath : path.join(dist, `${route.replace(/^\//, '')}.html`);
  fs.writeFileSync(file, html);
  count++;
  console.log(`  ✓ ${path.relative(dist, file)}`);
}

console.log(`✓ Prerender: ${count} rutas generadas en dist/`);
