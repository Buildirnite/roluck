/**
 * Tablas de equivalencia de tallas (/tallas). Datos estáticos, 100% offline.
 * Cada categoría define sus `systems` (columnas: US, EU, UK, cm, …) y `rows`, donde
 * cada fila alinea los valores equivalentes en el mismo orden que `systems`.
 *
 * Son tablas estándar de referencia: las tallas reales varían por marca y corte (la UI
 * muestra ese disclaimer). En Chile el calzado sigue la numeración EU y la ropa el
 * sistema internacional (XS/S/M/L), por eso esas columnas cubren CL/LATAM.
 */
import type { Bilingual } from '../catalog';

export interface SizeTable {
  id: string;
  name: Bilingual;
  /** Etiquetas de columna (universales: US, EU, UK, cm, Intl, in). */
  systems: string[];
  /** Filas con los valores equivalentes, alineadas a `systems`. */
  rows: string[][];
}

export const SIZE_TABLES: SizeTable[] = [
  {
    id: 'shoes-women',
    name: { es: 'Calzado mujer', en: "Women's shoes" },
    systems: ['US', 'EU', 'UK', 'cm'],
    rows: [
      ['5', '35', '3', '22'],
      ['6', '36', '4', '23'],
      ['7', '37', '5', '24'],
      ['8', '38', '6', '25'],
      ['9', '40', '7', '26'],
      ['10', '41', '8', '27'],
      ['11', '42', '9', '28'],
    ],
  },
  {
    id: 'shoes-men',
    name: { es: 'Calzado hombre', en: "Men's shoes" },
    systems: ['US', 'EU', 'UK', 'cm'],
    rows: [
      ['7', '40', '6', '25'],
      ['8', '41', '7', '26'],
      ['9', '42', '8', '27'],
      ['10', '43', '9', '28'],
      ['11', '44', '10', '29'],
      ['12', '45', '11', '30'],
      ['13', '46', '12', '31'],
    ],
  },
  {
    id: 'shoes-kids',
    name: { es: 'Calzado niños', en: "Kids' shoes" },
    systems: ['US', 'EU', 'UK', 'cm'],
    rows: [
      ['8', '24', '7', '14.5'],
      ['9', '25', '8', '15.5'],
      ['10', '27', '9', '16.5'],
      ['11', '28', '10', '17.5'],
      ['12', '30', '11', '18.5'],
      ['13', '31', '12', '19.5'],
      ['1', '32', '13', '20.5'],
      ['2', '33', '1', '21'],
      ['3', '34', '2', '21.5'],
    ],
  },
  {
    id: 'tops-women',
    name: { es: 'Ropa superior mujer', en: "Women's tops" },
    systems: ['Intl', 'US', 'EU', 'UK'],
    rows: [
      ['XS', '0–2', '34', '6'],
      ['S', '4–6', '36–38', '8–10'],
      ['M', '8–10', '40–42', '12–14'],
      ['L', '12–14', '44–46', '16–18'],
      ['XL', '16–18', '48–50', '20–22'],
      ['XXL', '20–22', '52–54', '24–26'],
    ],
  },
  {
    id: 'tops-men',
    name: { es: 'Ropa superior hombre (pecho)', en: "Men's tops (chest)" },
    systems: ['Intl', 'EU', 'in'],
    rows: [
      ['XS', '44', '34'],
      ['S', '46', '36'],
      ['M', '48–50', '38–40'],
      ['L', '52', '42'],
      ['XL', '54–56', '44–46'],
      ['XXL', '58', '48'],
    ],
  },
  {
    id: 'pants-women',
    name: { es: 'Pantalón mujer', en: "Women's pants" },
    systems: ['Intl', 'US', 'EU', 'UK'],
    rows: [
      ['XS', '0–2', '34', '6'],
      ['S', '4–6', '36–38', '8–10'],
      ['M', '8–10', '40–42', '12–14'],
      ['L', '12–14', '44–46', '16–18'],
      ['XL', '16–18', '48–50', '20–22'],
    ],
  },
  {
    id: 'pants-men',
    name: { es: 'Pantalón hombre (cintura)', en: "Men's pants (waist)" },
    systems: ['in', 'EU', 'cm'],
    rows: [
      ['28', '44', '71'],
      ['30', '46', '76'],
      ['32', '48', '81'],
      ['34', '50', '86'],
      ['36', '52', '91'],
      ['38', '54', '97'],
      ['40', '56', '102'],
    ],
  },
];

export function getSizeTable(id: string | null | undefined): SizeTable {
  return SIZE_TABLES.find((tbl) => tbl.id === id) ?? SIZE_TABLES[0];
}
