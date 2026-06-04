import {
  IconPhoto,
  IconArrowsMinimize,
  IconEdit,
  IconAspectRatio,
  IconStack2,
  IconFileTypePdf,
  IconWand,
  IconTool,
  type IconProps,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';
import type { Dict } from './i18n/translations';

export interface NavItem {
  to: string;
  /** Clave en `t.nav` para resolver la etiqueta según el idioma activo. */
  key: keyof Dict['nav'];
  Icon: ComponentType<IconProps>;
  /** Categoría principal (se muestra directo en la barra inferior móvil). */
  primary?: boolean;
}

/** Las 8 categorías del hub (orden del riel). */
export const NAV_ITEMS: NavItem[] = [
  { to: '/convertir', key: 'convertir', Icon: IconPhoto, primary: true },
  { to: '/comprimir', key: 'comprimir', Icon: IconArrowsMinimize },
  { to: '/editor', key: 'editor', Icon: IconEdit, primary: true },
  { to: '/redimensionar', key: 'redimensionar', Icon: IconAspectRatio },
  { to: '/lote', key: 'lote', Icon: IconStack2, primary: true },
  { to: '/pdf', key: 'pdf', Icon: IconFileTypePdf, primary: true },
  { to: '/crear', key: 'crear', Icon: IconWand },
  { to: '/herramientas', key: 'herramientas', Icon: IconTool },
];
