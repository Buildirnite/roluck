/**
 * Lógica de plazos y días hábiles en Chile (/dias-habiles). 100% client-side.
 *
 * Cuenta los días hábiles entre dos fechas y suma plazos en días hábiles a una fecha,
 * saltando fines de semana y feriados. Los feriados son datos estáticos versionados por
 * año (convención §8 del hub): es la parte que cambia y se actualiza en un solo lugar.
 * Son los feriados legales nacionales; pueden faltar feriados regionales o eventuales
 * (elecciones, censo), por eso la herramienta muestra un aviso referencial.
 */

/**
 * Feriados legales nacionales de Chile por año (ISO yyyy-mm-dd). REFERENCIALES: verificar
 * contra el calendario oficial (feriados.cl / Diario Oficial). No incluye feriados
 * regionales ni eventuales (p. ej. elecciones).
 */
export const HOLIDAYS: Record<number, string[]> = {
  2025: [
    '2025-01-01', // Año Nuevo
    '2025-04-18', // Viernes Santo
    '2025-04-19', // Sábado Santo
    '2025-05-01', // Día del Trabajo
    '2025-05-21', // Glorias Navales
    '2025-06-20', // Día Nacional de los Pueblos Indígenas
    '2025-06-29', // San Pedro y San Pablo
    '2025-07-16', // Virgen del Carmen
    '2025-08-15', // Asunción de la Virgen
    '2025-09-18', // Independencia Nacional
    '2025-09-19', // Glorias del Ejército
    '2025-10-12', // Encuentro de Dos Mundos
    '2025-10-31', // Iglesias Evangélicas y Protestantes
    '2025-11-01', // Día de Todos los Santos
    '2025-12-08', // Inmaculada Concepción
    '2025-12-25', // Navidad
  ],
  2026: [
    '2026-01-01', // Año Nuevo
    '2026-04-03', // Viernes Santo
    '2026-04-04', // Sábado Santo
    '2026-05-01', // Día del Trabajo
    '2026-05-21', // Glorias Navales
    '2026-06-20', // Día Nacional de los Pueblos Indígenas
    '2026-06-29', // San Pedro y San Pablo
    '2026-07-16', // Virgen del Carmen
    '2026-08-15', // Asunción de la Virgen
    '2026-09-18', // Independencia Nacional
    '2026-09-19', // Glorias del Ejército
    '2026-10-12', // Encuentro de Dos Mundos
    '2026-10-31', // Iglesias Evangélicas y Protestantes
    '2026-11-01', // Día de Todos los Santos
    '2026-12-08', // Inmaculada Concepción
    '2026-12-25', // Navidad
  ],
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Clave ISO local de una fecha. */
export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function isHoliday(d: Date): boolean {
  return (HOLIDAYS[d.getFullYear()] ?? []).includes(toKey(d));
}

/** Un día es hábil si no es fin de semana ni feriado. */
export function isBusinessDay(d: Date): boolean {
  return !isWeekend(d) && !isHoliday(d);
}

/** ¿Tenemos datos de feriados para todos los años del rango [a, b]? */
export function hasHolidayData(a: Date, b: Date): boolean {
  const lo = Math.min(a.getFullYear(), b.getFullYear());
  const hi = Math.max(a.getFullYear(), b.getFullYear());
  for (let y = lo; y <= hi; y++) if (!HOLIDAYS[y]) return false;
  return true;
}

export interface CountResult {
  business: number;
  weekend: number;
  holiday: number;
  total: number;
}

/** Cuenta días hábiles, de fin de semana y feriados en el rango inclusivo [start, end]. */
export function countBusinessDays(start: Date, end: Date): CountResult {
  let a = start;
  let b = end;
  if (a > b) [a, b] = [b, a];
  const res: CountResult = { business: 0, weekend: 0, holiday: 0, total: 0 };
  for (let cur = a; cur <= b; cur = addDays(cur, 1)) {
    res.total++;
    if (isWeekend(cur)) res.weekend++;
    else if (isHoliday(cur)) res.holiday++;
    else res.business++;
  }
  return res;
}

/**
 * Suma (o resta, si `n` es negativo) `n` días hábiles a `start`, saltando fines de semana
 * y feriados. El día inicial no se cuenta.
 */
export function addBusinessDays(start: Date, n: number): Date {
  const step = n >= 0 ? 1 : -1;
  let remaining = Math.abs(Math.trunc(n));
  let cur = start;
  while (remaining > 0) {
    cur = addDays(cur, step);
    if (isBusinessDay(cur)) remaining--;
  }
  return cur;
}
