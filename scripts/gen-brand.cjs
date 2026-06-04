#!/usr/bin/env node
/**
 * Generador de todos los assets de marca a partir del master `brand/logo-master.png`
 * (lockup de la llama RoLuck). Produce el logo del sidebar, el símbolo, los favicons,
 * los iconos PWA y la imagen Open Graph, todo sobre el fondo de marca #0a0a0a.
 *
 * REQUIERE `sharp` (dependencia solo de generación, no del runtime ni del build):
 *
 *   npm i -D sharp && node scripts/gen-brand.cjs && npm rm sharp
 *
 * Se ejecuta de forma puntual cuando cambia el logo; los assets resultantes se versionan
 * en public/. El master es raster, por eso no se usa el rasterizador propio sin deps.
 */
const path = require('path');
const fs = require('fs');
let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('✗ Falta sharp. Instálalo temporalmente: npm i -D sharp');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const MASTER = path.join(ROOT, 'brand', 'logo-master.png');
const DARK = '#0a0a0a';

const out = (f) => path.join(PUB, f);
const kb = (f) => (fs.statSync(out(f)).size / 1024).toFixed(1) + ' KB';

/** Lockup completo recortado (llama + texto ROLUCK), sin artefactos tenues. */
function lockup() {
  return sharp(MASTER).trim({ threshold: 30 });
}

/** Solo el símbolo de la llama (recorta por encima del texto ROLUCK), buffer ajustado. */
async function llamaTight() {
  const tr = await lockup().toBuffer({ resolveWithObject: true });
  const { width, height } = tr.info;
  const top = Math.round(height * 0.72);
  return sharp(tr.data).extract({ left: 0, top: 0, width, height: top }).trim({ threshold: 30 }).toBuffer();
}

function bg(size, rounded) {
  const r = rounded ? Math.round(size * 0.22) : 0;
  return Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${DARK}"/></svg>`);
}

async function icon(file, size, { rounded = true, factor = 0.72 } = {}) {
  const llama = await sharp(await llamaTight()).resize({ width: Math.round(size * factor) }).toBuffer();
  await sharp(bg(size, rounded))
    .composite([{ input: llama, gravity: 'center' }])
    .png({ palette: true, compressionLevel: 9, effort: 10 })
    .toFile(out(file));
}

async function ogImage() {
  const LH = 360;
  const llama = await sharp(await llamaTight()).resize({ height: LH }).toBuffer();
  const lw = (await sharp(llama).metadata()).width;
  const llamaX = 70;
  const textX = llamaX + lw + 55;
  const W = 1200, H = 630;
  const overlay = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="8" height="${H}" fill="#a3e635"/>
    <text x="${textX}" y="285" font-family="Verdana,Arial,sans-serif" font-size="56" font-weight="700" fill="#f5f5f5">RoLuck</text>
    <text x="${textX}" y="350" font-family="Verdana,Arial,sans-serif" font-size="56" font-weight="700" fill="#a3e635">Convertidor</text>
    <text x="${textX}" y="402" font-family="Verdana,Arial,sans-serif" font-size="23" fill="#a3a3a3">Convierte imágenes gratis en tu navegador</text>
    <text x="${W - 40}" y="${H - 34}" text-anchor="end" font-family="Verdana,Arial,sans-serif" font-size="24" fill="#737373">roluck.app</text>
  </svg>`);
  await sharp({ create: { width: W, height: H, channels: 4, background: DARK } })
    .composite([
      { input: llama, left: llamaX, top: Math.round((H - LH) / 2) },
      { input: overlay, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(out('og-image.png'));
}

(async () => {
  // Logo del sidebar (lockup) y símbolo.
  await lockup().resize({ width: 480 }).png({ palette: true, compressionLevel: 9, effort: 10 }).toFile(out('logo.png'));
  const tight = await llamaTight();
  await sharp(tight)
    .resize({ width: 256, height: 256, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, compressionLevel: 9, effort: 10 })
    .toFile(out('logo-mark.png'));

  // Favicons.
  await icon('favicon-16x16.png', 16, { factor: 0.82 });
  await icon('favicon-32x32.png', 32, { factor: 0.8 });
  await icon('favicon-48x48.png', 48, { factor: 0.78 });

  // Iconos PWA + Apple.
  await icon('pwa-192.png', 192, { factor: 0.72 });
  await icon('pwa-512.png', 512, { factor: 0.72 });
  await icon('apple-touch-icon.png', 180, { rounded: false, factor: 0.7 });
  await icon('pwa-maskable-512.png', 512, { rounded: false, factor: 0.58 });

  // Open Graph / Twitter.
  await ogImage();

  const files = ['logo.png', 'logo-mark.png', 'favicon-16x16.png', 'favicon-32x32.png', 'favicon-48x48.png', 'pwa-192.png', 'pwa-512.png', 'apple-touch-icon.png', 'pwa-maskable-512.png', 'og-image.png'];
  for (const f of files) console.log('  ✓ ' + f.padEnd(22) + kb(f));
  console.log('✓ Assets de marca generados desde brand/logo-master.png');
})();
