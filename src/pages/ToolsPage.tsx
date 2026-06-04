import { useState, type ComponentType } from 'react';
import { IconBrandFirefox, IconCode, IconPalette, IconFileInfo, IconLanguage } from '@tabler/icons-react';
import ToolPalette, { type EditorTool } from '../components/ToolPalette';
import FaviconTool from '../components/tools/FaviconTool';
import Base64Tool from '../components/tools/Base64Tool';
import PaletteTool from '../components/tools/PaletteTool';
import ExifTool from '../components/tools/ExifTool';
import OcrTool from '../components/tools/OcrTool';
import { useI18n } from '../i18n/I18nContext';

type ToolId = 'favicon' | 'base64' | 'palette' | 'exif' | 'ocr';

const TOOL_META: { id: ToolId; Icon: EditorTool['Icon'] }[] = [
  { id: 'favicon', Icon: IconBrandFirefox },
  { id: 'base64', Icon: IconCode },
  { id: 'palette', Icon: IconPalette },
  { id: 'exif', Icon: IconFileInfo },
  { id: 'ocr', Icon: IconLanguage },
];

const PANELS: Record<ToolId, ComponentType<{ onError: (m: string | null) => void }>> = {
  favicon: FaviconTool,
  base64: Base64Tool,
  palette: PaletteTool,
  exif: ExifTool,
  ocr: OcrTool,
};

/**
 * Ruta /herramientas — utilidades de desarrollo y análisis con divulgación progresiva:
 * una paleta de sub-herramientas y solo se muestran los controles de la activa. Cada
 * herramienta opera sobre una imagen propia; OCR carga tesseract.js de forma diferida.
 */
export default function ToolsPage() {
  const { t } = useI18n();
  const [active, setActive] = useState<ToolId>('favicon');
  const [error, setError] = useState<string | null>(null);
  const Panel = PANELS[active];
  const tools: EditorTool[] = TOOL_META.map((m) => ({ ...m, label: t.toolsTools[m.id], available: true }));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-xl font-bold tracking-tight">{t.pages.tools.title}</h1>
        <p className="mt-0.5 text-xs text-text-muted">{t.pages.tools.subtitle}</p>
      </header>

      <ToolPalette
        tools={tools}
        active={active}
        onSelect={(id) => {
          setActive(id as ToolId);
          setError(null);
        }}
      />

      {error && (
        <div role="alert" className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <Panel onError={setError} />
    </div>
  );
}
