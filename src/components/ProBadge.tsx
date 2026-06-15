import { IconSparkles } from '@tabler/icons-react';
import { useI18n } from '../i18n/I18nContext';

/**
 * Etiqueta "Pro": marca de forma discreta y consistente las funciones que desbloquea
 * RoLuck Pro. Reutilizable en tarjetas de la home, paneles de herramientas y CTAs.
 */
export default function ProBadge({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent ${className}`}
    >
      <IconSparkles size={11} stroke={2.2} className="flex-shrink-0" />
      {t.pro.badge}
    </span>
  );
}
