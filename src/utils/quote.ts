/**
 * Lógica del generador de cotizaciones/presupuestos (/cotizaciones). 100% client-side:
 * los totales son matemática pura y el PDF se arma con `pdf-lib` (importado de forma
 * diferida para no entrar al bundle base). Convención del hub: PDF nuevo = pdf-lib, no
 * jspdf. Se usan las fuentes estándar (Helvetica), cuya codificación WinAnsi cubre los
 * acentos y la ñ del español, así que no hace falta incrustar fuentes.
 */
import type { Lang } from '../i18n/translations';
import type { IssuerData } from '../store/useIssuerStore';

export interface QuoteItem {
  description: string;
  qty: number;
  unitPrice: number;
}

export interface QuoteTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export interface QuoteData {
  issuer: IssuerData;
  client: IssuerData;
  items: QuoteItem[];
  number: string;
  date: string;
  validUntil: string;
  notes: string;
  currency: string;
  /** IVA en porcentaje (ej. 19). */
  taxRate: number;
  includeTax: boolean;
}

/** Etiquetas de texto del PDF (se pasan desde i18n para mantener el PDF traducido). */
export interface QuoteLabels {
  title: string;
  number: string;
  date: string;
  validUntil: string;
  from: string;
  to: string;
  item: string;
  qty: string;
  unitPrice: string;
  amount: string;
  subtotal: string;
  tax: string;
  total: string;
  notes: string;
  madeWith: string;
}

export function lineTotal(item: QuoteItem): number {
  return (item.qty || 0) * (item.unitPrice || 0);
}

export function computeTotals(items: QuoteItem[], taxRate: number, includeTax: boolean): QuoteTotals {
  const subtotal = items.reduce((sum, it) => sum + lineTotal(it), 0);
  const tax = includeTax ? subtotal * (taxRate / 100) : 0;
  return { subtotal, tax, total: subtotal + tax };
}

/** Moneda: entero agrupado con el símbolo elegido (el peso chileno no usa decimales). */
export function formatMoney(n: number, lang: Lang, currency: string): string {
  if (!Number.isFinite(n)) return '—';
  return `${currency}${Math.round(n).toLocaleString(lang === 'es' ? 'es-CL' : 'en-US')}`;
}

/* Mapa de caracteres tipográficos comunes a su equivalente WinAnsi seguro. */
const CHAR_MAP: Record<string, string> = {
  '‘': "'", '’': "'", '“': '"', '”': '"',
  '–': '-', '—': '-', '…': '...', ' ': ' ',
};

/** Sustituye/elimina caracteres que la fuente estándar (WinAnsi) no puede codificar. */
function safe(text: string): string {
  let out = '';
  for (const ch of text.replace(/[‘’“”–—… ]/g, (c) => CHAR_MAP[c])) {
    out += ch.charCodeAt(0) <= 0xff ? ch : '?';
  }
  return out;
}

/**
 * Genera el PDF de la cotización y devuelve sus bytes. Si `isPro` es false, agrega un
 * pie con la marca de RoLuck (el Pro lo quita).
 */
export async function generateQuotePdf(
  data: QuoteData,
  opts: { isPro: boolean; lang: Lang; labels: QuoteLabels },
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const { labels, lang, isPro } = opts;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = page.getWidth();
  const M = 50; // margen
  const ink = rgb(0.06, 0.06, 0.06);
  const muted = rgb(0.45, 0.45, 0.45);
  const accent = rgb(0.4, 0.7, 0.0);
  const line = rgb(0.85, 0.85, 0.85);
  const money = (n: number) => formatMoney(n, lang, data.currency);

  let y = 841.89 - M;
  const text = (s: string, x: number, yy: number, size: number, f = font, color = ink) =>
    page.drawText(safe(s), { x, y: yy, size, font: f, color });
  const right = (s: string, xRight: number, yy: number, size: number, f = font, color = ink) =>
    page.drawText(safe(s), { x: xRight - f.widthOfTextAtSize(safe(s), size), y: yy, size, font: f, color });

  // Encabezado: título + número/fecha.
  text(labels.title.toUpperCase(), M, y, 24, bold, accent);
  right(`${labels.number}: ${data.number || '—'}`, W - M, y, 10, font, muted);
  right(`${labels.date}: ${data.date || '—'}`, W - M, y - 15, 10, font, muted);
  y -= 44;

  // Emisor / cliente en dos columnas.
  const colX = W / 2 + 10;
  const block = (party: IssuerData, x: number, label: string) => {
    let yy = y;
    text(label, x, yy, 9, bold, muted);
    yy -= 16;
    text(party.name || '—', x, yy, 12, bold);
    yy -= 14;
    for (const field of [party.taxId, party.address, party.email, party.phone]) {
      if (field) {
        text(field, x, yy, 9, font, muted);
        yy -= 12;
      }
    }
    return yy;
  };
  const yLeft = block(data.issuer, M, labels.from);
  const yRight = block(data.client, colX, labels.to);
  y = Math.min(yLeft, yRight) - 18;

  // Tabla de ítems.
  const cols = { desc: M, qty: 330, price: 390, amount: W - M };
  page.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: 20, color: rgb(0.96, 0.96, 0.96) });
  text(labels.item, cols.desc + 4, y, 9, bold, muted);
  right(labels.qty, cols.qty + 30, y, 9, bold, muted);
  right(labels.unitPrice, cols.price + 80, y, 9, bold, muted);
  right(labels.amount, cols.amount, y, 9, bold, muted);
  y -= 22;

  const descWidth = cols.qty - cols.desc - 12;
  for (const item of data.items) {
    if (!item.description && !item.qty && !item.unitPrice) continue;
    // Ajuste de línea simple para la descripción.
    const words = safe(item.description).split(/\s+/);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(test, 10) > descWidth && cur) {
        lines.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) lines.push(cur);
    if (!lines.length) lines.push('');

    lines.forEach((ln, i) => text(ln, cols.desc + 4, y - i * 12, 10));
    right(String(item.qty || 0), cols.qty + 30, y, 10);
    right(money(item.unitPrice || 0), cols.price + 80, y, 10);
    right(money(lineTotal(item)), cols.amount, y, 10);
    y -= Math.max(lines.length * 12, 14) + 6;
    page.drawLine({ start: { x: M, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.5, color: line });

    if (y < 140) break; // protección de página única
  }

  // Totales.
  const totals = computeTotals(data.items, data.taxRate, data.includeTax);
  y -= 6;
  const totLabelX = W - M - 170;
  right(labels.subtotal, totLabelX, y, 10, font, muted);
  right(money(totals.subtotal), W - M, y, 10);
  y -= 16;
  if (data.includeTax) {
    right(`${labels.tax} (${data.taxRate}%)`, totLabelX, y, 10, font, muted);
    right(money(totals.tax), W - M, y, 10);
    y -= 16;
  }
  page.drawLine({ start: { x: totLabelX, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.8, color: ink });
  y -= 6;
  right(labels.total, totLabelX, y, 13, bold);
  right(money(totals.total), W - M, y, 13, bold, accent);
  y -= 30;

  // Notas.
  if (data.notes.trim()) {
    text(labels.notes, M, y, 9, bold, muted);
    y -= 14;
    for (const ln of safe(data.notes).split('\n')) {
      text(ln, M, y, 9, font, muted);
      y -= 12;
    }
  }

  // Validez + pie de marca (el Pro lo quita).
  if (data.validUntil) text(`${labels.validUntil}: ${data.validUntil}`, M, 60, 9, font, muted);
  if (!isPro) right(labels.madeWith, W - M, 40, 9, font, muted);

  return doc.save();
}
