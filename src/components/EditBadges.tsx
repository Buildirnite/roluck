import { IconArrowBackUp, IconArrowForwardUp, IconRestore } from '@tabler/icons-react';
import { useI18n } from '../i18n/I18nContext';
import type { Dict } from '../i18n/translations';

interface EditBadgesProps {
  labels: string[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRevert: () => void;
  disabled?: boolean;
}

/** Badges de ediciones aplicadas + acciones de deshacer / rehacer / revertir. */
export default function EditBadges({
  labels,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onRevert,
  disabled,
}: EditBadgesProps) {
  const { t } = useI18n();
  const unique = [...new Set(labels)];
  if (unique.length === 0 && !canUndo && !canRedo) return null;

  // Las etiquetas se guardan en español (clave canónica) en el store; aquí se
  // traducen al idioma activo, con fallback al texto original si no hay clave.
  const tr = (label: string) => t.editLabels[label as keyof Dict['editLabels']] ?? label;

  const actionBtn =
    'flex items-center gap-1 rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 font-mono text-xs text-text-muted transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-30 disabled:hover:border-border disabled:hover:text-text-muted';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {unique.map((b) => (
        <span
          key={b}
          className="rounded-md border border-accent/40 bg-accent/15 px-2 py-0.5 font-mono text-xs text-accent"
        >
          {tr(b)}
        </span>
      ))}
      <span className="flex-1" />
      <button type="button" onClick={onUndo} disabled={disabled || !canUndo} className={actionBtn} title={t.editBadges.undo}>
        <IconArrowBackUp size={15} stroke={2} />
        {t.editBadges.undo}
      </button>
      <button type="button" onClick={onRedo} disabled={disabled || !canRedo} className={actionBtn} title={t.editBadges.redo}>
        <IconArrowForwardUp size={15} stroke={2} />
        {t.editBadges.redo}
      </button>
      <button type="button" onClick={onRevert} disabled={disabled || !canUndo} className={actionBtn} title={t.editBadges.revertTitle}>
        <IconRestore size={15} stroke={2} />
        {t.editBadges.revert}
      </button>
    </div>
  );
}
