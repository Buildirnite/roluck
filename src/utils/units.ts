/**
 * Datos y lógica del conversor de unidades (/unidades). 100% offline, sin red.
 *
 * La mayoría de las categorías son lineales: cada unidad guarda un `factor` hacia la
 * unidad base de su categoría, y convertir es base = valor × factor_origen, luego
 * resultado = base / factor_destino. La temperatura NO es lineal (es afín), así que su
 * categoría define `toBase`/`fromBase` propios (base = Celsius).
 */
import type { Lang } from '../i18n/translations';

export interface Bilingual {
  es: string;
  en: string;
}

export interface Unit {
  /** Id estable usado en la URL (ej. 'kg', 'ft'). */
  id: string;
  /** Símbolo mostrado en tablas y resultados. */
  symbol: string;
  name: Bilingual;
  /** Factor hacia la unidad base (solo categorías lineales). */
  factor?: number;
}

export interface Category {
  id: string;
  name: Bilingual;
  units: Unit[];
  /** Conversión afín a base (solo temperatura). */
  toBase?: (value: number, unitId: string) => number;
  fromBase?: (value: number, unitId: string) => number;
}

export const CATEGORIES: Category[] = [
  {
    id: 'longitud',
    name: { es: 'Longitud', en: 'Length' },
    units: [
      { id: 'm', symbol: 'm', name: { es: 'Metro', en: 'Meter' }, factor: 1 },
      { id: 'km', symbol: 'km', name: { es: 'Kilómetro', en: 'Kilometer' }, factor: 1000 },
      { id: 'cm', symbol: 'cm', name: { es: 'Centímetro', en: 'Centimeter' }, factor: 0.01 },
      { id: 'mm', symbol: 'mm', name: { es: 'Milímetro', en: 'Millimeter' }, factor: 0.001 },
      { id: 'mi', symbol: 'mi', name: { es: 'Milla', en: 'Mile' }, factor: 1609.344 },
      { id: 'yd', symbol: 'yd', name: { es: 'Yarda', en: 'Yard' }, factor: 0.9144 },
      { id: 'ft', symbol: 'ft', name: { es: 'Pie', en: 'Foot' }, factor: 0.3048 },
      { id: 'in', symbol: 'in', name: { es: 'Pulgada', en: 'Inch' }, factor: 0.0254 },
      { id: 'nmi', symbol: 'nmi', name: { es: 'Milla náutica', en: 'Nautical mile' }, factor: 1852 },
    ],
  },
  {
    id: 'peso',
    name: { es: 'Peso / masa', en: 'Weight / mass' },
    units: [
      { id: 'kg', symbol: 'kg', name: { es: 'Kilogramo', en: 'Kilogram' }, factor: 1 },
      { id: 'g', symbol: 'g', name: { es: 'Gramo', en: 'Gram' }, factor: 0.001 },
      { id: 'mg', symbol: 'mg', name: { es: 'Miligramo', en: 'Milligram' }, factor: 1e-6 },
      { id: 't', symbol: 't', name: { es: 'Tonelada', en: 'Tonne' }, factor: 1000 },
      { id: 'lb', symbol: 'lb', name: { es: 'Libra', en: 'Pound' }, factor: 0.45359237 },
      { id: 'oz', symbol: 'oz', name: { es: 'Onza', en: 'Ounce' }, factor: 0.028349523125 },
      { id: 'st', symbol: 'st', name: { es: 'Stone', en: 'Stone' }, factor: 6.35029318 },
    ],
  },
  {
    id: 'temperatura',
    name: { es: 'Temperatura', en: 'Temperature' },
    units: [
      { id: 'c', symbol: '°C', name: { es: 'Celsius', en: 'Celsius' } },
      { id: 'f', symbol: '°F', name: { es: 'Fahrenheit', en: 'Fahrenheit' } },
      { id: 'k', symbol: 'K', name: { es: 'Kelvin', en: 'Kelvin' } },
    ],
    // Base = Celsius.
    toBase: (v, u) => (u === 'f' ? ((v - 32) * 5) / 9 : u === 'k' ? v - 273.15 : v),
    fromBase: (v, u) => (u === 'f' ? (v * 9) / 5 + 32 : u === 'k' ? v + 273.15 : v),
  },
  {
    id: 'volumen',
    name: { es: 'Volumen', en: 'Volume' },
    units: [
      { id: 'l', symbol: 'L', name: { es: 'Litro', en: 'Liter' }, factor: 1 },
      { id: 'ml', symbol: 'mL', name: { es: 'Mililitro', en: 'Milliliter' }, factor: 0.001 },
      { id: 'm3', symbol: 'm³', name: { es: 'Metro cúbico', en: 'Cubic meter' }, factor: 1000 },
      { id: 'gal', symbol: 'gal', name: { es: 'Galón (US)', en: 'Gallon (US)' }, factor: 3.785411784 },
      { id: 'qt', symbol: 'qt', name: { es: 'Cuarto (US)', en: 'Quart (US)' }, factor: 0.946352946 },
      { id: 'pt', symbol: 'pt', name: { es: 'Pinta (US)', en: 'Pint (US)' }, factor: 0.473176473 },
      { id: 'floz', symbol: 'fl oz', name: { es: 'Onza líquida (US)', en: 'Fluid ounce (US)' }, factor: 0.0295735295625 },
    ],
  },
  {
    id: 'area',
    name: { es: 'Área', en: 'Area' },
    units: [
      { id: 'm2', symbol: 'm²', name: { es: 'Metro cuadrado', en: 'Square meter' }, factor: 1 },
      { id: 'km2', symbol: 'km²', name: { es: 'Kilómetro cuadrado', en: 'Square kilometer' }, factor: 1e6 },
      { id: 'cm2', symbol: 'cm²', name: { es: 'Centímetro cuadrado', en: 'Square centimeter' }, factor: 1e-4 },
      { id: 'ha', symbol: 'ha', name: { es: 'Hectárea', en: 'Hectare' }, factor: 10000 },
      { id: 'acre', symbol: 'ac', name: { es: 'Acre', en: 'Acre' }, factor: 4046.8564224 },
      { id: 'ft2', symbol: 'ft²', name: { es: 'Pie cuadrado', en: 'Square foot' }, factor: 0.09290304 },
      { id: 'in2', symbol: 'in²', name: { es: 'Pulgada cuadrada', en: 'Square inch' }, factor: 0.00064516 },
    ],
  },
  {
    id: 'velocidad',
    name: { es: 'Velocidad', en: 'Speed' },
    units: [
      { id: 'kmh', symbol: 'km/h', name: { es: 'Kilómetro por hora', en: 'Kilometer per hour' }, factor: 1000 / 3600 },
      { id: 'ms', symbol: 'm/s', name: { es: 'Metro por segundo', en: 'Meter per second' }, factor: 1 },
      { id: 'mph', symbol: 'mph', name: { es: 'Milla por hora', en: 'Mile per hour' }, factor: 0.44704 },
      { id: 'kn', symbol: 'kn', name: { es: 'Nudo', en: 'Knot' }, factor: 0.514444444 },
      { id: 'fts', symbol: 'ft/s', name: { es: 'Pie por segundo', en: 'Foot per second' }, factor: 0.3048 },
    ],
  },
  {
    id: 'tiempo',
    name: { es: 'Tiempo', en: 'Time' },
    units: [
      { id: 's', symbol: 's', name: { es: 'Segundo', en: 'Second' }, factor: 1 },
      { id: 'ms', symbol: 'ms', name: { es: 'Milisegundo', en: 'Millisecond' }, factor: 0.001 },
      { id: 'min', symbol: 'min', name: { es: 'Minuto', en: 'Minute' }, factor: 60 },
      { id: 'h', symbol: 'h', name: { es: 'Hora', en: 'Hour' }, factor: 3600 },
      { id: 'd', symbol: 'd', name: { es: 'Día', en: 'Day' }, factor: 86400 },
      { id: 'wk', symbol: 'sem', name: { es: 'Semana', en: 'Week' }, factor: 604800 },
    ],
  },
  {
    id: 'datos',
    name: { es: 'Datos digitales', en: 'Digital data' },
    units: [
      { id: 'b', symbol: 'B', name: { es: 'Byte', en: 'Byte' }, factor: 1 },
      { id: 'bit', symbol: 'bit', name: { es: 'Bit', en: 'Bit' }, factor: 0.125 },
      { id: 'kb', symbol: 'KB', name: { es: 'Kilobyte', en: 'Kilobyte' }, factor: 1024 },
      { id: 'mb', symbol: 'MB', name: { es: 'Megabyte', en: 'Megabyte' }, factor: 1024 ** 2 },
      { id: 'gb', symbol: 'GB', name: { es: 'Gigabyte', en: 'Gigabyte' }, factor: 1024 ** 3 },
      { id: 'tb', symbol: 'TB', name: { es: 'Terabyte', en: 'Terabyte' }, factor: 1024 ** 4 },
    ],
  },
  {
    id: 'cocina',
    name: { es: 'Cocina', en: 'Cooking' },
    units: [
      { id: 'tsp', symbol: 'cdta', name: { es: 'Cucharadita', en: 'Teaspoon' }, factor: 4.92892159375 },
      { id: 'tbsp', symbol: 'cda', name: { es: 'Cucharada', en: 'Tablespoon' }, factor: 14.78676478125 },
      { id: 'cup', symbol: 'taza', name: { es: 'Taza', en: 'Cup' }, factor: 236.5882365 },
      { id: 'floz', symbol: 'fl oz', name: { es: 'Onza líquida', en: 'Fluid ounce' }, factor: 29.5735295625 },
      { id: 'ml', symbol: 'mL', name: { es: 'Mililitro', en: 'Milliliter' }, factor: 1 },
      { id: 'l', symbol: 'L', name: { es: 'Litro', en: 'Liter' }, factor: 1000 },
    ],
  },
];

export function getCategory(id: string | null | undefined): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

export function getUnit(category: Category, id: string | null | undefined): Unit | undefined {
  return category.units.find((u) => u.id === id);
}

/** Convierte `value` de la unidad `fromId` a la `toId` dentro de una categoría. */
export function convert(value: number, fromId: string, toId: string, category: Category): number {
  const from = getUnit(category, fromId);
  const to = getUnit(category, toId);
  if (!from || !to) return NaN;
  if (category.toBase && category.fromBase) {
    return category.fromBase(category.toBase(value, fromId), toId);
  }
  if (from.factor === undefined || to.factor === undefined) return NaN;
  return (value * from.factor) / to.factor;
}

/** Formato legible: hasta 7 cifras significativas, notación científica en extremos. */
export function formatResult(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-6) return n.toExponential(4);
  return String(Number.parseFloat(n.toPrecision(7)));
}

export function unitLabel(unit: Unit, lang: Lang): string {
  return `${unit.name[lang]} (${unit.symbol})`;
}
