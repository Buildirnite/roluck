import type { Lang } from './translations';

/**
 * Idioma por URL. El español vive en la raíz (`/convertir`) y el inglés bajo el prefijo
 * `/en` (`/en/convertir`). La URL es la fuente de verdad del idioma: así cada versión
 * tiene su propia URL indexable y `hreflang` recíproco (ver scripts/prerender.cjs y useSeo).
 */

/** ¿La ruta pertenece al árbol en inglés (`/en` o `/en/...`)? */
export function isEnPath(pathname: string): boolean {
  return pathname === '/en' || pathname.startsWith('/en/');
}

/** Idioma derivado de la URL (ES es el predeterminado). */
export function langFromPath(pathname: string): Lang {
  return isEnPath(pathname) ? 'en' : 'es';
}

/** Ruta lógica sin el prefijo de idioma (`/en/convertir` → `/convertir`, `/en` → `/`). */
export function stripLang(pathname: string): string {
  if (!isEnPath(pathname)) return pathname;
  return pathname.slice(3) || '/';
}

/** Antepone el prefijo de idioma a una ruta lógica (`/convertir` + `en` → `/en/convertir`). */
export function localize(route: string, lang: Lang): string {
  if (lang === 'es') return route;
  return route === '/' ? '/en' : `/en${route}`;
}
