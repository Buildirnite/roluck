import { IconLock } from '@tabler/icons-react';
import { useI18n } from '../i18n/I18nContext';

/**
 * Sello de privacidad visible. El informe pide que la promesa ('tus archivos
 * nunca salen de tu dispositivo') esté presente en cada herramienta, no enterrada
 * en un pie. Se monta en el encabezado de cada página vía <ToolShell>.
 */
export default function PrivacyBadge({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent ${className}`}
      title={t.privacy.note}
    >
      <IconLock size={13} stroke={2} className="flex-shrink-0" />
      {t.privacy.badge}
    </span>
  );
}
