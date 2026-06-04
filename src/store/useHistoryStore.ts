import { create } from 'zustand';
import type { OutputFormat } from '../types';

/** Una entrada del historial de sesión: el resultado de una conversión. */
export interface HistoryEntry {
  id: string;
  filename: string;
  sizeBytes: number;
  mimeType: OutputFormat;
  blob: Blob;
  createdAt: number;
}

interface HistoryStore {
  entries: HistoryEntry[]; // las más recientes primero
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => void;
  clear: () => void;
}

/** Máximo de entradas a conservar; se descartan las más antiguas. */
const MAX_ENTRIES = 30;

let counter = 0;
const nextId = () => `hist-${Date.now()}-${counter++}`;

/**
 * Historial de la sesión actual. Vive solo en memoria (NO se persiste): guarda los
 * Blobs de los resultados para poder re-descargarlos, y eso no tiene sentido
 * conservarlo entre recargas. La vista crea sus propias Object URLs desde el Blob.
 */
export const useHistoryStore = create<HistoryStore>((set) => ({
  entries: [],
  addEntry: (entry) =>
    set((s) => ({
      entries: [{ ...entry, id: nextId(), createdAt: Date.now() }, ...s.entries].slice(0, MAX_ENTRIES),
    })),
  clear: () => set({ entries: [] }),
}));
