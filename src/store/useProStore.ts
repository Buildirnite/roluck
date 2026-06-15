import { create } from 'zustand';

/**
 * Estado de RoLuck Pro. Para la v1 (informe §7) basta una verificación de licencia
 * simple por dispositivo/navegador: si hay una licencia válida en localStorage, el
 * usuario es Pro. El "login unificado" con cuentas se añade después, cuando lo
 * justifique el ingreso. Toda la lógica de desbloqueo del hub pasa por aquí.
 */

const STORAGE_KEY = 'roluck-pro-license';

interface ProStore {
  isPro: boolean;
  /** Guarda la licencia (tras una compra) y desbloquea las funciones Pro. */
  activate: (license: string) => void;
  /** Revoca la licencia local (cambio de dispositivo, soporte, etc.). */
  deactivate: () => void;
}

/** Una licencia local cuenta como válida si existe y no está vacía. */
function readLicense(): boolean {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

export const useProStore = create<ProStore>((set) => ({
  isPro: readLicense(),
  activate: (license) => {
    try {
      localStorage.setItem(STORAGE_KEY, license);
    } catch {
      /* almacenamiento no disponible: la sesión sigue como Pro en memoria */
    }
    set({ isPro: true });
  },
  deactivate: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sin acceso a almacenamiento */
    }
    set({ isPro: false });
  },
}));
