import {
  IconPhoto,
  IconArrowsMinimize,
  IconEdit,
  IconAspectRatio,
  IconStack2,
  IconFileTypePdf,
  IconWand,
  IconTool,
  IconReceipt,
  IconQrcode,
  IconRuler2,
  IconShirt,
  IconCar,
  IconCalendarStats,
  IconCurrencyDollar,
  IconCash,
  IconFileText,
  IconBuildingBank,
  IconCalendarCheck,
  IconTag,
  type IconProps,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';
import type { Lang } from './i18n/translations';

/**
 * Catálogo único del hub RoLuck. Es la fuente de verdad de todas las herramientas:
 * de aquí derivan la navegación lateral, la grilla de la home, el ruteo y el sitemap.
 * Agregar una herramienta nueva = añadir una entrada aquí (y su página + SEO).
 */

/** Las dos familias del hub (informe §2). */
export type Family = 'files' | 'chile';

/** `live` = construida y enlazable. `soon` = en el roadmap, se muestra atenuada. */
export type ToolStatus = 'live' | 'soon';

export interface Bilingual {
  es: string;
  en: string;
}

export interface Tool {
  /** Subruta canónica, también su keyword SEO principal. */
  to: string;
  Icon: ComponentType<IconProps>;
  family: Family;
  status: ToolStatus;
  /** Se muestra en la barra inferior móvil (espacio limitado). */
  primary?: boolean;
  /** Tiene funciones que desbloquea RoLuck Pro. */
  pro?: boolean;
  name: Bilingual;
  desc: Bilingual;
}

export interface FamilyInfo {
  id: Family;
  name: Bilingual;
  tagline: Bilingual;
}

/** Metadatos de cada familia para los encabezados de navegación y la home. */
export const FAMILIES: FamilyInfo[] = [
  {
    id: 'files',
    name: { es: 'Archivos y utilidades', en: 'Files & utilities' },
    tagline: {
      es: 'Client-side y universales: imagen, PDF y conversores.',
      en: 'Client-side and universal: image, PDF and converters.',
    },
  },
  {
    id: 'chile',
    name: { es: 'Chile · pyme', en: 'Chile · SMB' },
    tagline: {
      es: 'Calculadoras de uso diario en Chile.',
      en: 'Everyday calculators for Chile.',
    },
  },
];

export const TOOLS: Tool[] = [
  // ── Familia A · Archivos y utilidades (en línea hoy) ──────────────────────
  {
    to: '/convertir',
    Icon: IconPhoto,
    family: 'files',
    status: 'live',
    primary: true,
    name: { es: 'Convertir', en: 'Convert' },
    desc: {
      es: 'Cambia el formato entre PNG, JPEG, WebP y AVIF.',
      en: 'Switch format between PNG, JPEG, WebP and AVIF.',
    },
  },
  {
    to: '/comprimir',
    Icon: IconArrowsMinimize,
    family: 'files',
    status: 'live',
    name: { es: 'Comprimir', en: 'Compress' },
    desc: {
      es: 'Reduce el peso por calidad o a un tamaño objetivo.',
      en: 'Shrink file size by quality or to a target.',
    },
  },
  {
    to: '/editor',
    Icon: IconEdit,
    family: 'files',
    status: 'live',
    primary: true,
    pro: true,
    name: { es: 'Editor', en: 'Editor' },
    desc: {
      es: 'Recorta, rota, filtros, marca de agua y quitar fondo.',
      en: 'Crop, rotate, filters, watermark and remove background.',
    },
  },
  {
    to: '/redimensionar',
    Icon: IconAspectRatio,
    family: 'files',
    status: 'live',
    name: { es: 'Redimensionar', en: 'Resize' },
    desc: {
      es: 'Dimensiones, presets de redes y generador de srcset.',
      en: 'Dimensions, social presets and srcset generator.',
    },
  },
  {
    to: '/lote',
    Icon: IconStack2,
    family: 'files',
    status: 'live',
    name: { es: 'Lote', en: 'Batch' },
    desc: {
      es: 'Convierte varias imágenes y descárgalas en un ZIP.',
      en: 'Convert many images and download them as a ZIP.',
    },
  },
  {
    to: '/pdf',
    Icon: IconFileTypePdf,
    family: 'files',
    status: 'live',
    primary: true,
    name: { es: 'PDF', en: 'PDF' },
    desc: {
      es: 'Imágenes a PDF, unir y organizar páginas.',
      en: 'Images to PDF, merge and organize pages.',
    },
  },
  {
    to: '/crear',
    Icon: IconWand,
    family: 'files',
    status: 'live',
    name: { es: 'Crear', en: 'Create' },
    desc: {
      es: 'Compón GIF, collages, spritesheets y divisiones.',
      en: 'Compose GIFs, collages, spritesheets and splits.',
    },
  },
  {
    to: '/herramientas',
    Icon: IconTool,
    family: 'files',
    status: 'live',
    name: { es: 'Herramientas', en: 'Tools' },
    desc: {
      es: 'Favicons, Base64, paleta, EXIF y OCR.',
      en: 'Favicons, Base64, palette, EXIF and OCR.',
    },
  },

  // ── Familia A · próximas (roadmap, informe §6) ────────────────────────────
  {
    to: '/cotizaciones',
    Icon: IconReceipt,
    family: 'files',
    status: 'live',
    pro: true,
    name: { es: 'Cotizaciones', en: 'Quotes' },
    desc: {
      es: 'Genera presupuestos y cotizaciones en PDF.',
      en: 'Generate quotes and estimates as PDF.',
    },
  },
  {
    to: '/qr',
    Icon: IconQrcode,
    family: 'files',
    status: 'live',
    pro: true,
    name: { es: 'Código QR', en: 'QR code' },
    desc: {
      es: 'Genera y escanea códigos QR de texto, URL o WiFi.',
      en: 'Generate and scan QR codes for text, URL or WiFi.',
    },
  },
  {
    to: '/unidades',
    Icon: IconRuler2,
    family: 'files',
    status: 'live',
    name: { es: 'Unidades', en: 'Units' },
    desc: {
      es: 'Convierte longitud, peso, temperatura y más.',
      en: 'Convert length, weight, temperature and more.',
    },
  },
  {
    to: '/tallas',
    Icon: IconShirt,
    family: 'files',
    status: 'live',
    name: { es: 'Tallas', en: 'Sizes' },
    desc: {
      es: 'Convierte tallas de ropa y calzado US/EU/UK.',
      en: 'Convert clothing and shoe sizes US/EU/UK.',
    },
  },
  {
    to: '/costo-viaje',
    Icon: IconCar,
    family: 'files',
    status: 'live',
    name: { es: 'Costo de viaje', en: 'Trip cost' },
    desc: {
      es: 'Calcula el costo de bencina y divídelo entre pasajeros.',
      en: 'Estimate fuel cost and split it between riders.',
    },
  },
  {
    to: '/fechas',
    Icon: IconCalendarStats,
    family: 'files',
    status: 'live',
    name: { es: 'Fechas', en: 'Dates' },
    desc: {
      es: 'Días entre fechas, edad y cuenta regresiva.',
      en: 'Days between dates, age and countdown.',
    },
  },

  // ── Familia B · Chile / pyme (roadmap, informe §6) ────────────────────────
  {
    to: '/indicadores',
    Icon: IconCurrencyDollar,
    family: 'chile',
    status: 'live',
    name: { es: 'Indicadores', en: 'Indicators' },
    desc: {
      es: 'Convierte UF, UTM, peso y dólar con el valor del día.',
      en: 'Convert UF, UTM, peso and dollar at today’s rate.',
    },
  },
  {
    to: '/sueldo-liquido',
    Icon: IconCash,
    family: 'chile',
    status: 'live',
    name: { es: 'Sueldo líquido', en: 'Net salary' },
    desc: {
      es: 'Calcula tu líquido a partir del sueldo bruto.',
      en: 'Estimate net pay from your gross salary.',
    },
  },
  {
    to: '/finiquito',
    Icon: IconFileText,
    family: 'chile',
    status: 'live',
    name: { es: 'Finiquito', en: 'Severance' },
    desc: {
      es: 'Indemnización, aviso previo y vacaciones proporcionales.',
      en: 'Severance, notice and prorated vacation.',
    },
  },
  {
    to: '/credito',
    Icon: IconBuildingBank,
    family: 'chile',
    status: 'live',
    name: { es: 'Dividendo', en: 'Mortgage' },
    desc: {
      es: 'Simula el dividendo de un crédito hipotecario.',
      en: 'Simulate a mortgage monthly payment.',
    },
  },
  {
    to: '/dias-habiles',
    Icon: IconCalendarCheck,
    family: 'chile',
    status: 'live',
    name: { es: 'Días hábiles', en: 'Business days' },
    desc: {
      es: 'Suma plazos y cuenta días hábiles con feriados.',
      en: 'Add deadlines and count business days with holidays.',
    },
  },
  {
    to: '/precio-venta',
    Icon: IconTag,
    family: 'chile',
    status: 'live',
    name: { es: 'Precio de venta', en: 'Selling price' },
    desc: {
      es: 'Precio de venta con margen e IVA para pymes.',
      en: 'Selling price with margin and VAT for SMBs.',
    },
  },
];

/** Herramientas construidas y enlazables (las que tienen ruta real hoy). */
export const liveTools = TOOLS.filter((tool) => tool.status === 'live');

/** Herramientas de una familia, opcionalmente filtradas por estado. */
export function toolsByFamily(family: Family, status?: ToolStatus): Tool[] {
  return TOOLS.filter((tool) => tool.family === family && (!status || tool.status === status));
}

/** Resuelve un texto bilingüe al idioma activo. */
export function tr(value: Bilingual, lang: Lang): string {
  return value[lang];
}
