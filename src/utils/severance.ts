/**
 * Cálculo de finiquito en Chile (/finiquito). 100% client-side.
 *
 * Estima los tres componentes habituales: indemnización por años de servicio, indemnización
 * sustitutiva del aviso previo y feriado (vacaciones) proporcional. Los parámetros legales
 * están centralizados y versionados en `SEVERANCE_CONFIG` (convención §8). Es una estimación
 * referencial (convención §9): el finiquito real depende de la causal, el contrato y otros
 * haberes, y debe revisarse con un profesional o la Dirección del Trabajo.
 */
import { diffYMD } from './dateCalc';

/** Causal de término que define si corresponde indemnización por años de servicio. */
export type Causal = 'needs' | 'resign' | 'other';

export interface SeveranceConfig {
  version: string;
  /** Tope de la remuneración base para indemnizaciones, en UF. */
  topeUf: number;
  /** Tope de años de servicio indemnizables. */
  maxYears: number;
  /** Días hábiles de feriado legal por año. */
  vacationDaysPerYear: number;
  /** Factor para pasar días hábiles a días corridos (21/15). */
  corridoFactor: number;
}

export const SEVERANCE_CONFIG: SeveranceConfig = {
  version: '2026',
  topeUf: 90,
  maxYears: 11,
  vacationDaysPerYear: 15,
  corridoFactor: 21 / 15,
};

export interface SeveranceInput {
  /** Última remuneración mensual (base de cálculo), en pesos. */
  salary: number;
  startDate: Date;
  endDate: Date;
  causal: Causal;
  /** Se dio el aviso previo de 30 días (solo aplica a 'needs'). */
  priorNotice: boolean;
  /** Días hábiles de vacaciones pendientes. */
  pendingVacationDays: number;
}

export interface SeveranceResult {
  years: number;
  monthsExtra: number;
  daysExtra: number;
  /** Años indemnizables (con fracción > 6 meses como año completo, tope incluido). */
  iasYears: number;
  /** Remuneración base tras aplicar el tope de 90 UF. */
  baseCapped: number;
  /** True si el tope de 90 UF redujo la base. */
  capped: boolean;
  ias: number;
  notice: number;
  vacation: number;
  total: number;
}

/** Estima los días hábiles de feriado proporcional de la fracción de año en curso. */
export function estimatePendingVacation(start: Date, end: Date, config = SEVERANCE_CONFIG): number {
  const { months, days } = diffYMD(start, end);
  const fractionMonths = months + days / 30;
  return Math.round(fractionMonths * (config.vacationDaysPerYear / 12) * 10) / 10;
}

export function computeSeverance(input: SeveranceInput, uf: number, config = SEVERANCE_CONFIG): SeveranceResult {
  const salary = Math.max(0, input.salary || 0);
  const { years, months, days } = diffYMD(input.startDate, input.endDate);

  // Fracción superior a 6 meses cuenta como año completo; tope de años.
  const extraIsYear = months > 6 || (months === 6 && days > 0);
  const iasYears = Math.min(config.maxYears, years + (extraIsYear ? 1 : 0));

  const tope = config.topeUf * uf;
  const baseCapped = tope > 0 ? Math.min(salary, tope) : salary;
  const capped = baseCapped < salary;

  const generatesIas = input.causal === 'needs';
  const ias = generatesIas ? iasYears * baseCapped : 0;
  const notice = generatesIas && !input.priorNotice ? baseCapped : 0;

  const pending = Math.max(0, input.pendingVacationDays || 0);
  const vacation = (salary / 30) * pending * config.corridoFactor;

  return {
    years,
    monthsExtra: months,
    daysExtra: days,
    iasYears,
    baseCapped,
    capped,
    ias,
    notice,
    vacation,
    total: ias + notice + vacation,
  };
}
