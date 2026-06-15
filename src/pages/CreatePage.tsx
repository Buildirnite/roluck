import { useState, type ComponentType } from 'react';
import { IconGif, IconLayoutGrid, IconGridDots, IconLayoutCollage } from '@tabler/icons-react';
import ToolPalette, { type EditorTool } from '../components/ToolPalette';
import GifTool from '../components/create/GifTool';
import SpritesheetTool from '../components/create/SpritesheetTool';
import GridSplitTool from '../components/create/GridSplitTool';
import CollageTool from '../components/create/CollageTool';
import ToolShell from '../components/ToolShell';
import { useI18n } from '../i18n/I18nContext';

type ToolId = 'gif' | 'sprite' | 'split' | 'collage';

const TOOL_META: { id: ToolId; Icon: EditorTool['Icon'] }[] = [
  { id: 'gif', Icon: IconGif },
  { id: 'sprite', Icon: IconLayoutGrid },
  { id: 'split', Icon: IconGridDots },
  { id: 'collage', Icon: IconLayoutCollage },
];

const PANELS: Record<ToolId, ComponentType<{ onError: (m: string | null) => void }>> = {
  gif: GifTool,
  sprite: SpritesheetTool,
  split: GridSplitTool,
  collage: CollageTool,
};

/**
 * Ruta /crear — componer imágenes nuevas. Usa divulgación progresiva: una paleta
 * de sub-herramientas y solo se muestran los controles de la activa. GIF, spritesheet
 * y collage operan sobre la cola compartida; dividir, sobre una sola imagen.
 */
export default function CreatePage() {
  const { t } = useI18n();
  const [active, setActive] = useState<ToolId>('gif');
  const [error, setError] = useState<string | null>(null);
  const Panel = PANELS[active];
  const tools: EditorTool[] = TOOL_META.map((m) => ({ ...m, label: t.createTools[m.id], available: true }));

  return (
    <ToolShell title={t.pages.create.title} subtitle={t.pages.create.subtitle}>
      <div className="flex flex-col gap-5">
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
    </ToolShell>
  );
}
