import { useEffect, useRef } from 'react';

/** Selector de elementos enfocables dentro de un diálogo. */
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento accesible compartido para diálogos modales: cierra con Escape, atrapa el
 * foco con Tab (no se escapa al fondo) y restaura el foco al elemento previo al cerrar.
 *
 * Devuelve un ref para el contenedor del diálogo; conviene darle `tabIndex={-1}` para que
 * sirva de destino de foco de respaldo. `onClose` se guarda en un ref, así que el efecto de
 * montaje solo corre al abrir/cerrar (no reenfoca en cada render del padre).
 */
export function useModal<T extends HTMLElement>(onClose: () => void, enabled = true) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      node ? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null) : [];

    // Foco inicial: primer elemento enfocable, o el propio contenedor.
    (focusables()[0] ?? node)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (f.length === 0) {
        e.preventDefault();
        node?.focus();
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [enabled]);

  return ref;
}
