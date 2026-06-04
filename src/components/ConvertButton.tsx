import { useI18n } from '../i18n/I18nContext';

interface ConvertButtonProps {
  onClick: () => void;
  isConverting: boolean;
  disabled?: boolean;
  /** Etiqueta del botón en estado normal (por defecto "Convertir"). */
  label?: string;
}

/** Botón principal de conversión, con estado de carga. */
export default function ConvertButton({
  onClick,
  isConverting,
  disabled,
  label,
}: ConvertButtonProps) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isConverting}
      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 font-display text-base font-semibold text-bg-primary transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-text-muted"
    >
      {isConverting ? (
        <>
          <svg
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {t.convertBtn.converting}
        </>
      ) : (
        <>
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 11h8l-3-3" />
            <path d="M15 13H7l3 3" />
          </svg>
          {label ?? t.convertBtn.convert}
        </>
      )}
    </button>
  );
}
