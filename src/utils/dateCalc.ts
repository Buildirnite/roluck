/**
 * Lógica de la calculadora de fechas (/fechas). 100% client-side, sin red.
 * Se opera con fechas locales a medianoche (componentes y/m/d) para evitar sustos con
 * zonas horarias y DST; las diferencias en días usan UTC de esos componentes.
 */
import type { Lang } from '../i18n/translations';

export type Period = 'days' | 'weeks' | 'months' | 'years';

export interface YMD {
  years: number;
  months: number;
  days: number;
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** El objetivo ya pasó. */
  past: boolean;
}

/** Parsea 'YYYY-MM-DD' (input type=date) a una fecha local a medianoche. */
export function parseDate(str: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Parsea 'YYYY-MM-DDThh:mm' (input type=datetime-local) a fecha local. */
export function parseDateTime(str: string): Date | null {
  if (!str) return null;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Diferencia entera de días entre dos fechas (positiva si b ≥ a). */
export function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

/** Desglose calendario años/meses/días entre dos fechas (siempre no negativo). */
export function diffYMD(start: Date, end: Date): YMD {
  let a = start;
  let b = end;
  if (a > b) [a, b] = [b, a];

  let years = b.getFullYear() - a.getFullYear();
  let months = b.getMonth() - a.getMonth();
  let days = b.getDate() - a.getDate();

  if (days < 0) {
    months--;
    // Días del mes anterior al de `b` (día 0 del mes de b = último del previo).
    days += new Date(b.getFullYear(), b.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}

/** Suma (sign=1) o resta (sign=-1) un período a una fecha. */
export function addPeriod(date: Date, amount: number, unit: Period, sign: 1 | -1): Date {
  const d = new Date(date);
  const delta = sign * amount;
  switch (unit) {
    case 'days':
      d.setDate(d.getDate() + delta);
      break;
    case 'weeks':
      d.setDate(d.getDate() + delta * 7);
      break;
    case 'months':
      d.setMonth(d.getMonth() + delta);
      break;
    case 'years':
      d.setFullYear(d.getFullYear() + delta);
      break;
  }
  return d;
}

/** Días hasta el próximo cumpleaños desde `now` (0 si es hoy). */
export function daysToNextBirthday(birth: Date, now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
  return daysBetween(today, next);
}

/** Cuenta regresiva (o transcurrida) entre `now` y `target`. */
export function countdown(target: Date, now: Date): Countdown {
  const diff = target.getTime() - now.getTime();
  const past = diff < 0;
  const totalSec = Math.floor(Math.abs(diff) / 1000);
  return {
    days: Math.floor(totalSec / 86_400),
    hours: Math.floor((totalSec % 86_400) / 3_600),
    minutes: Math.floor((totalSec % 3_600) / 60),
    seconds: totalSec % 60,
    past,
  };
}

/** Cadena 'YYYY-MM-DD' de hoy (para inicializar inputs type=date). */
export function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Fecha legible y completa según idioma (con día de la semana). */
export function formatDate(date: Date, lang: Lang): string {
  return date.toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Entero con separador de miles según idioma. */
export function formatInt(n: number, lang: Lang): string {
  return n.toLocaleString(lang === 'es' ? 'es-CL' : 'en-US');
}
