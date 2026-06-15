/**
 * Lógica del calculador de costo de viaje en auto (/costo-viaje). 100% offline, sin red.
 *
 * Estima los litros de combustible que consume un trayecto, su costo, suma peajes opcionales
 * y reparte el total entre los pasajeros. El rendimiento se acepta en los dos formatos
 * habituales: km/L (común en Chile) o L/100km (común en Europa); ambos se normalizan a litros.
 */
import type { Lang } from '../i18n/translations';

/** Formato del rendimiento del vehículo. */
export type EffUnit = 'kmpl' | 'l100';

export interface TripInput {
  /** Distancia de un trayecto (ida), en km. */
  distance: number;
  /** Si el costo cubre ida y vuelta (duplica la distancia). */
  roundTrip: boolean;
  /** Rendimiento del vehículo, en la unidad `effUnit`. */
  efficiency: number;
  effUnit: EffUnit;
  /** Precio del combustible por litro (en la moneda local). */
  pricePerLiter: number;
  /** Peajes u otros costos fijos del viaje, total. */
  tolls: number;
  /** Personas entre las que se divide el costo (mín. 1). */
  passengers: number;
}

export interface TripResult {
  /** Distancia total considerada (ida o ida y vuelta), en km. */
  totalDistance: number;
  /** Litros de combustible estimados. */
  liters: number;
  /** Costo solo del combustible. */
  fuelCost: number;
  /** Combustible + peajes. */
  totalCost: number;
  /** Total dividido entre los pasajeros. */
  perPassenger: number;
}

/** Litros que consume `distanceKm` según el rendimiento dado. */
export function litersFor(distanceKm: number, efficiency: number, unit: EffUnit): number {
  if (!(efficiency > 0) || !(distanceKm > 0)) return 0;
  return unit === 'kmpl' ? distanceKm / efficiency : (distanceKm * efficiency) / 100;
}

export function computeTrip(input: TripInput): TripResult {
  const totalDistance = input.roundTrip ? input.distance * 2 : input.distance;
  const liters = litersFor(totalDistance, input.efficiency, input.effUnit);
  const fuelCost = liters * (input.pricePerLiter > 0 ? input.pricePerLiter : 0);
  const tolls = input.tolls > 0 ? input.tolls : 0;
  const totalCost = fuelCost + tolls;
  const passengers = Math.max(1, Math.floor(input.passengers || 1));
  return {
    totalDistance,
    liters,
    fuelCost,
    totalCost,
    perPassenger: totalCost / passengers,
  };
}

/** Moneda local: entero agrupado con prefijo "$" (el peso chileno no usa decimales). */
export function formatMoney(n: number, lang: Lang): string {
  if (!Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString(lang === 'es' ? 'es-CL' : 'en-US')}`;
}

/** Litros con hasta 1 decimal. */
export function formatLiters(n: number, lang: Lang): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString(lang === 'es' ? 'es-CL' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}
