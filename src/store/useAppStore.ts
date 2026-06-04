import { create } from 'zustand';
import { track } from '../analytics';

/** Etiqueta canónica del paso de edición → nombre de herramienta para la analítica. */
const EDIT_TOOL: Record<string, string> = {
  Recortada: 'crop',
  Filtros: 'filters',
  'Sin fondo': 'remove_bg',
  Rotada: 'rotate',
  Espejada: 'flip',
};

/** Una entrada de la pila de edición no destructiva (archivo + etiqueta del paso). */
export interface EditEntry {
  file: File;
  label: string;
}

/** Un ítem de la cola compartida (Lote / PDF / Crear). */
export interface QueueItem {
  id: string;
  file: File;
}

interface AppStore {
  // ── Imagen activa (Convertir / Comprimir / Editor / Redimensionar) ──
  // stack[0] es siempre el original inmutable; la cima es la imagen de trabajo.
  activeStack: EditEntry[];
  redoStack: EditEntry[]; // ediciones deshechas, disponibles para rehacer
  setActiveFile: (file: File) => void;
  applyEdit: (file: File, label: string) => void;
  undoEdit: () => void;
  redoEdit: () => void;
  revertActive: () => void;
  clearActive: () => void;

  // ── Cola compartida (Lote / PDF / Crear) ──
  queue: QueueItem[];
  addToQueue: (files: File[]) => void;
  removeFromQueue: (id: string) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
}

let idCounter = 0;
const nextId = () => `img-${Date.now()}-${idCounter++}`;

/**
 * Estado global compartido. La idea central: una imagen cargada en una herramienta
 * puede pasar a otra sin volver a subirla (encadenar recortar → quitar fondo →
 * convertir). La pila de edición vive aquí para ser común a todas las rutas que
 * trabajan sobre la imagen activa.
 */
export const useAppStore = create<AppStore>((set) => ({
  activeStack: [],
  redoStack: [],

  // Cargar imagen nueva: reinicia la pila y descarta el historial de rehacer.
  setActiveFile: (file) => set({ activeStack: [{ file, label: 'Original' }], redoStack: [] }),

  // Aplicar edición: nueva cima y se descarta lo que hubiera para rehacer.
  applyEdit: (file, label) => {
    // Métrica de uso de herramientas de edición (sin contenido de imagen).
    const tool = EDIT_TOOL[label];
    if (tool) track('tool_used', { tool });
    set((s) => ({ activeStack: [...s.activeStack, { file, label }], redoStack: [] }));
  },

  // Deshacer: la cima pasa a la pila de rehacer.
  undoEdit: () =>
    set((s) => {
      if (s.activeStack.length <= 1) return s;
      const top = s.activeStack[s.activeStack.length - 1];
      return {
        activeStack: s.activeStack.slice(0, -1),
        redoStack: [...s.redoStack, top],
      };
    }),

  // Rehacer: recupera la última edición deshecha.
  redoEdit: () =>
    set((s) => {
      if (s.redoStack.length === 0) return s;
      const next = s.redoStack[s.redoStack.length - 1];
      return {
        activeStack: [...s.activeStack, next],
        redoStack: s.redoStack.slice(0, -1),
      };
    }),

  revertActive: () =>
    set((s) => (s.activeStack.length > 1 ? { activeStack: [s.activeStack[0]], redoStack: [] } : s)),

  clearActive: () => set({ activeStack: [], redoStack: [] }),

  queue: [],

  addToQueue: (files) =>
    set((s) => ({
      queue: [...s.queue, ...files.map((file) => ({ id: nextId(), file }))],
    })),

  removeFromQueue: (id) => set((s) => ({ queue: s.queue.filter((i) => i.id !== id) })),

  reorderQueue: (from, to) =>
    set((s) => {
      if (from === to || from < 0 || to < 0 || from >= s.queue.length || to >= s.queue.length) {
        return s;
      }
      const next = [...s.queue];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { queue: next };
    }),

  clearQueue: () => set({ queue: [] }),
}));
