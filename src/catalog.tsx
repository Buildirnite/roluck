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
import data from './catalog.data.json';

/**
 * Catálogo único del hub RoLuck. Es la fuente de verdad de todas las herramientas:
 * de aquí derivan la navegación lateral, la grilla de la home, el ruteo y el sitemap.
 * Agregar una herramienta nueva = añadir una entrada aquí (y su página + SEO).
 *
 * Los datos puros (sin íconos) viven en `catalog.data.json` para que también los pueda
 * leer el prerender de SEO (`scripts/prerender.cjs`), que corre en Node y no puede
 * importar este módulo TSX. Aquí se les adjunta el componente de ícono por su nombre.
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

/** Mapa nombre→componente para resolver el `icon` declarado en catalog.data.json. */
const ICONS: Record<string, ComponentType<IconProps>> = {
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
};

/** Metadatos de cada familia para los encabezados de navegación y la home. */
export const FAMILIES: FamilyInfo[] = data.families as FamilyInfo[];

type ToolData = Omit<Tool, 'Icon'> & { icon: string };

export const TOOLS: Tool[] = (data.tools as ToolData[]).map(({ icon, ...rest }) => ({
  ...rest,
  Icon: ICONS[icon],
}));

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
