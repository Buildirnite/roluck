#!/usr/bin/env node
/**
 * Descarga las fuentes de RoLuck desde Google Fonts y las deja self-hosted, para no
 * depender de fonts.googleapis.com en tiempo de ejecución (mejor LCP en el primer render
 * y refuerzo de privacidad: el navegador no le pide nada a Google al cargar el sitio).
 *
 * Genera:
 *   - public/fonts/<familia>-<peso>-<subset>.woff2   (los binarios, nombres estables)
 *   - src/styles/fonts.css                            (@font-face apuntando a /fonts/…)
 *
 * El `src/index.css` importa ese CSS y `index.html` precarga los archivos críticos.
 * Solo se conservan los subsets latin + latin-ext (suficiente para ES/EN). Reejecutar
 * con `npm run gen:fonts` si se cambian familias o pesos.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

// Misma especificación que tenía el <link> de Google Fonts.
const CSS_URL =
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;600;700&display=swap';
// UA de navegador moderno → Google devuelve woff2 (con UA viejo devolvería ttf/woff).
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const KEEP_SUBSETS = new Set(['latin', 'latin-ext']);

const fontsDir = path.join(__dirname, '..', 'public', 'fonts');
const cssOut = path.join(__dirname, '..', 'src', 'styles', 'fonts.css');

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(get(res.headers.location, headers));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} en ${url}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

const slug = (family) => family.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function main() {
  console.log('· Descargando CSS de Google Fonts…');
  const css = (await get(CSS_URL, { 'User-Agent': UA })).toString('utf8');

  // Cada bloque viene precedido por un comentario con el nombre del subset.
  const blockRe = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
  const faces = [];
  let m;
  while ((m = blockRe.exec(css))) {
    const subset = m[1];
    if (!KEEP_SUBSETS.has(subset)) continue;
    const body = m[2];
    const family = (body.match(/font-family:\s*'([^']+)'/) || [])[1];
    const weight = (body.match(/font-weight:\s*(\d+)/) || [])[1];
    const src = (body.match(/src:\s*url\(([^)]+)\)/) || [])[1];
    const range = (body.match(/unicode-range:\s*([^;]+);/) || [])[1];
    if (!family || !weight || !src) continue;
    faces.push({ subset, family, weight, src, range: range && range.trim() });
  }

  if (faces.length === 0) throw new Error('No se parseó ningún @font-face. ¿Cambió el formato de Google?');

  fs.mkdirSync(fontsDir, { recursive: true });
  fs.mkdirSync(path.dirname(cssOut), { recursive: true });

  const rules = [];
  for (const f of faces) {
    const file = `${slug(f.family)}-${f.weight}-${f.subset}.woff2`;
    console.log(`· ${f.family} ${f.weight} (${f.subset}) → ${file}`);
    const buf = await get(f.src, { 'User-Agent': UA });
    fs.writeFileSync(path.join(fontsDir, file), buf);
    rules.push(
      `@font-face {\n` +
        `  font-family: '${f.family}';\n` +
        `  font-style: normal;\n` +
        `  font-weight: ${f.weight};\n` +
        `  font-display: swap;\n` +
        `  src: url('/fonts/${file}') format('woff2');\n` +
        (f.range ? `  unicode-range: ${f.range};\n` : '') +
        `}`,
    );
  }

  const header =
    '/* Generado por scripts/gen-fonts.cjs — NO editar a mano. Reejecutar: npm run gen:fonts */\n';
  fs.writeFileSync(cssOut, header + rules.join('\n\n') + '\n');
  console.log(`✓ ${faces.length} fuentes en public/fonts/ + src/styles/fonts.css`);
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
