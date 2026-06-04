import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OutputFormat } from '../types';

/**
 * Un preset de conversión reutilizable: formato + calidad y, opcionalmente, un peso
 * objetivo (KB). Se aplica en Convertir, Comprimir y Lote; cada página usa los campos
 * que le aplican (Convertir ignora targetKb, por ejemplo).
 */
export interface ConversionPreset {
  id: string;
  name: string;
  format: OutputFormat;
  quality: number;
  targetKb?: number;
}

interface PresetStore {
  presets: ConversionPreset[];
  addPreset: (preset: Omit<ConversionPreset, 'id'>) => void;
  removePreset: (id: string) => void;
}

let counter = 0;
const nextId = () => `preset-${Date.now()}-${counter++}`;

/**
 * Presets guardados, persistidos en localStorage (clave `roluck-presets`) vía el
 * middleware `persist` de Zustand, para que sobrevivan entre sesiones.
 */
export const usePresetStore = create<PresetStore>()(
  persist(
    (set) => ({
      presets: [],
      addPreset: (preset) =>
        set((s) => ({ presets: [...s.presets, { ...preset, id: nextId() }] })),
      removePreset: (id) => set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),
    }),
    { name: 'roluck-presets' },
  ),
);
