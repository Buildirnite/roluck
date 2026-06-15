import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Datos del emisor de cotizaciones (la empresa o persona que cotiza). Se guardan en
 * localStorage (`roluck-issuer`) para no reescribirlos en cada cotización. Es el único
 * dato que persiste: el cliente y los ítems son por documento. Nada sale del navegador.
 */
export interface IssuerData {
  name: string;
  taxId: string;
  address: string;
  email: string;
  phone: string;
}

export const emptyIssuer: IssuerData = { name: '', taxId: '', address: '', email: '', phone: '' };

interface IssuerStore {
  issuer: IssuerData;
  setIssuer: (issuer: IssuerData) => void;
}

export const useIssuerStore = create<IssuerStore>()(
  persist(
    (set) => ({
      issuer: emptyIssuer,
      setIssuer: (issuer) => set({ issuer }),
    }),
    { name: 'roluck-issuer' },
  ),
);
