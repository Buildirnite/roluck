import type { ReactNode } from 'react';
import PrivacyBadge from './PrivacyBadge';
import ProBadge from './ProBadge';

interface ToolShellProps {
  /** H1 de la herramienta (orientado a su keyword principal). */
  title: string;
  /** Bajada breve bajo el título. */
  subtitle?: string;
  /** La herramienta tiene funciones Pro: muestra la etiqueta junto al título. */
  pro?: boolean;
  /** Acciones del encabezado (botones a la derecha del título). */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Envoltura estándar de toda página de herramienta del hub. Garantiza un encabezado
 * coherente (H1 + bajada + sello de privacidad siempre visible) para que la promesa
 * de marca aparezca en cada herramienta sin repetir el markup en cada página.
 */
export default function ToolShell({ title, subtitle, pro, actions, children }: ToolShellProps) {
  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-text-primary">{title}</h1>
            {pro && <ProBadge />}
          </div>
          {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
          <PrivacyBadge className="mt-3" />
        </div>
        {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
