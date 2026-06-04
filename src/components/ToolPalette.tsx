import type { IconProps } from '@tabler/icons-react';
import type { ComponentType } from 'react';

export interface EditorTool {
  id: string;
  label: string;
  Icon: ComponentType<IconProps>;
  available: boolean; // false = "próximamente"
}

interface ToolPaletteProps {
  tools: EditorTool[];
  active: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

/**
 * Paleta de herramientas del editor (divulgación progresiva): una fila de chips
 * ícono + etiqueta. Solo una herramienta queda activa a la vez; sus controles se
 * muestran debajo (los renderiza el contenedor).
 */
export default function ToolPalette({ tools, active, onSelect, disabled }: ToolPaletteProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tools.map(({ id, label, Icon, available }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            disabled={disabled || !available}
            title={available ? label : `${label} (próximamente)`}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              isActive
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-border bg-bg-elevated text-text-muted hover:text-text-primary'
            } ${!available ? 'opacity-40' : ''} disabled:cursor-not-allowed`}
          >
            <Icon size={16} stroke={1.8} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
