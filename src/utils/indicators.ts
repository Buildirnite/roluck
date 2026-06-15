/**
 * Datos y lógica del conversor de indicadores chilenos (/indicadores): UF, UTM, dólar y
 * euro respecto al peso (CLP). Los valores vienen de la API pública de mindicador.cl, con
 * caché en localStorage para render instantáneo + funcionamiento offline, y un juego de
 * valores de respaldo (fallback) por si la API no responde en la primera carga (convención
 * §8 del hub). La conversión usa el peso como base: cada indicador guarda su valor en CLP.
 */
import type { Lang } from '../i18n/translations';
import type { Bilingual } from '../catalog';

/** Códigos soportados; CLP es la base (factor 1). */
export type IndicatorCode = 'clp' | 'uf' | 'utm' | 'dolar' | 'euro';

export interface IndicatorMeta {
  code: IndicatorCode;
  /** Clave en la API de mindicador.cl (undefined para CLP, que es la base). */
  apiKey?: string;
  symbol: string;
  name: Bilingual;
}

export const INDICATORS: IndicatorMeta[] = [
  { code: 'clp', symbol: '$', name: { es: 'Peso chileno', en: 'Chilean peso' } },
  { code: 'uf', apiKey: 'uf', symbol: 'UF', name: { es: 'Unidad de Fomento', en: 'Unidad de Fomento' } },
  { code: 'utm', apiKey: 'utm', symbol: 'UTM', name: { es: 'Unidad Tributaria Mensual', en: 'Monthly Tax Unit' } },
  { code: 'dolar', apiKey: 'dolar', symbol: 'US$', name: { es: 'Dólar', en: 'US dollar' } },
  { code: 'euro', apiKey: 'euro', symbol: '€', name: { es: 'Euro', en: 'Euro' } },
];

/** Valor en CLP de cada indicador. */
export type Values = Record<IndicatorCode, number>;

export interface Snapshot {
  values: Values;
  /** Fecha del dato (ISO yyyy-mm-dd) reportada por la API. */
  date: string;
  /** Marca de tiempo de la descarga (epoch ms). */
  fetchedAt: number;
  /** True si proviene del fallback estático (la API no respondió nunca). */
  fallback?: boolean;
}

const CACHE_KEY = 'roluck-indicators';
const API_URL = 'https://mindicador.cl/api';

/**
 * Valores de respaldo. SOLO se usan si NUNCA se pudo contactar la API ni hay caché; en ese
 * caso se muestran con un aviso de "valores referenciales". Son una foto puntual desde
 * mindicador.cl (actualizar cada cierto tiempo). Última actualización: 2026-06-15.
 */
const FALLBACK: Snapshot = {
  values: { clp: 1, uf: 40777, utm: 71506, dolar: 909, euro: 1051 },
  date: '2026-06-15',
  fetchedAt: 0,
  fallback: true,
};

function readCache(): Snapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as Snapshot;
    if (snap && snap.values && typeof snap.values.uf === 'number') return snap;
  } catch {
    /* caché ilegible */
  }
  return null;
}

function writeCache(snap: Snapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snap));
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Snapshot inmediato para el primer render: caché si existe, si no el fallback. */
export function cachedOrFallback(): Snapshot {
  return readCache() ?? FALLBACK;
}

/** Descarga los valores frescos desde la API y actualiza la caché. */
export async function fetchIndicators(): Promise<Snapshot> {
  const res = await fetch(API_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as Record<string, { valor?: number } | string>;

  const values: Values = { clp: 1, uf: 0, utm: 0, dolar: 0, euro: 0 };
  for (const ind of INDICATORS) {
    if (!ind.apiKey) continue;
    const entry = data[ind.apiKey];
    const valor = typeof entry === 'object' && entry ? entry.valor : undefined;
    if (typeof valor !== 'number' || !(valor > 0)) throw new Error(`dato inválido: ${ind.apiKey}`);
    values[ind.code] = valor;
  }
  const fecha = typeof data.fecha === 'string' ? data.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10);

  const snap: Snapshot = { values, date: fecha, fetchedAt: Date.now() };
  writeCache(snap);
  return snap;
}

/** Convierte `amount` desde el código `from` al `to` usando el peso como base. */
export function convertIndicator(amount: number, from: IndicatorCode, to: IndicatorCode, values: Values): number {
  const inClp = amount * values[from];
  return inClp / values[to];
}

/** Formato adaptado al indicador: CLP entero; el resto con decimales. */
export function formatValue(n: number, code: IndicatorCode, lang: Lang): string {
  if (!Number.isFinite(n)) return '—';
  const locale = lang === 'es' ? 'es-CL' : 'en-US';
  if (code === 'clp') return Math.round(n).toLocaleString(locale);
  return n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

/** Fecha legible del snapshot. */
export function formatSnapshotDate(date: string, lang: Lang): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}
