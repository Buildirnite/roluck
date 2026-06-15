/**
 * Cálculo de precio de venta para pymes (/precio-venta). 100% client-side, matemática pura.
 *
 * A partir del costo y un porcentaje de ganancia (por margen o por markup) calcula el precio
 * neto, el IVA y el precio final, además de la utilidad y los porcentajes de margen y markup
 * resultantes (que se confunden a menudo):
 *   - Markup: la ganancia se mide sobre el COSTO →  neto = costo × (1 + markup/100)
 *   - Margen: la ganancia se mide sobre el PRECIO →  neto = costo / (1 − margen/100)
 */
import type { Lang } from '../i18n/translations';

export type PriceMode = 'margin' | 'markup';

export interface SellingPriceInput {
  cost: number;
  mode: PriceMode;
  /** Porcentaje de ganancia, interpretado según `mode`. */
  percent: number;
  /** IVA en porcentaje (Chile: 19). */
  ivaRate: number;
}

export interface SellingPriceResult {
  /** Precio de venta sin IVA. */
  net: number;
  /** Utilidad (neto menos costo). */
  profit: number;
  iva: number;
  /** Precio final con IVA. */
  final: number;
  /** Margen resultante (sobre el precio neto), en %. */
  marginPct: number;
  /** Markup resultante (sobre el costo), en %. */
  markupPct: number;
}

export function computeSellingPrice(input: SellingPriceInput): SellingPriceResult {
  const cost = Math.max(0, input.cost || 0);
  const pct = Math.max(0, input.percent || 0);
  const ivaRate = Math.max(0, input.ivaRate || 0);

  let net: number;
  if (input.mode === 'markup') {
    net = cost * (1 + pct / 100);
  } else {
    // Margen: no puede ser 100% o más (precio infinito); se acota.
    const m = Math.min(pct, 99.99) / 100;
    net = cost / (1 - m);
  }

  const profit = net - cost;
  const iva = net * (ivaRate / 100);
  const final = net + iva;
  const marginPct = net > 0 ? (profit / net) * 100 : 0;
  const markupPct = cost > 0 ? (profit / cost) * 100 : 0;

  return { net, profit, iva, final, marginPct, markupPct };
}

/** Peso chileno: entero agrupado. */
export function formatCLP(n: number, lang: Lang): string {
  if (!Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString(lang === 'es' ? 'es-CL' : 'en-US')}`;
}

/** Porcentaje con hasta 1 decimal. */
export function formatPct(n: number, lang: Lang): string {
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString(lang === 'es' ? 'es-CL' : 'en-US', { maximumFractionDigits: 1 })}%`;
}
