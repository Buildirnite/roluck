import { IconSparkles, IconCheck } from '@tabler/icons-react';
import { useI18n } from '../i18n/I18nContext';
import { useProStore } from '../store/useProStore';

/**
 * Página de RoLuck Pro (informe §4). Membresía única que desbloquea todas las
 * herramientas: sin anuncios + funciones avanzadas. El checkout (Paddle) llega en
 * una fase posterior; por ahora presenta la propuesta y refleja el estado local Pro.
 */
export default function ProPage() {
  const { t, lang } = useI18n();
  const isPro = useProStore((s) => s.isPro);

  const benefits =
    lang === 'es'
      ? [
          'Sin anuncios en todo el hub',
          'Funciones avanzadas: lotes ilimitados, remoción de fondo y exportación sin marca',
          'Una sola compra desbloquea todas las herramientas, para siempre',
          'Mismo principio de privacidad: todo sigue en tu navegador',
        ]
      : [
          'No ads across the whole hub',
          'Advanced features: unlimited batches, background removal and unbranded export',
          'A single purchase unlocks every tool, forever',
          'Same privacy principle: everything stays in your browser',
        ];

  const soonNote =
    lang === 'es'
      ? 'El checkout llega pronto. Mientras tanto, todas las herramientas siguen gratis y sin límites.'
      : 'Checkout is coming soon. Meanwhile, every tool stays free with no limits.';

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
          <IconSparkles size={13} stroke={2.2} />
          {t.pro.badge}
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-text-primary">{t.pro.title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">{t.pro.subtitle}</p>
      </header>

      <ul className="space-y-3 rounded-2xl border border-border bg-bg-surface p-6">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-3 text-sm text-text-primary">
            <IconCheck size={18} stroke={2.4} className="mt-0.5 flex-shrink-0 text-accent" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-sm text-text-muted">
        {isPro ? (
          <>
            <IconCheck size={16} stroke={2.4} className="flex-shrink-0 text-accent" />
            {lang === 'es' ? 'Pro activo en este dispositivo.' : 'Pro active on this device.'}
          </>
        ) : (
          soonNote
        )}
      </p>
    </div>
  );
}
