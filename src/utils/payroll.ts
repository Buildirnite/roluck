/**
 * Cálculo de sueldo líquido en Chile (/sueldo-liquido). 100% client-side.
 *
 * Estima el líquido a partir del sueldo bruto imponible, descontando las cotizaciones
 * previsionales (AFP, salud, seguro de cesantía) y el impuesto único de segunda categoría.
 *
 * Los parámetros que cambian por ley están centralizados y versionados en `PAYROLL_CONFIG`
 * (convención §8 del hub): topes imponibles en UF, comisiones de AFP y los tramos del
 * impuesto en UTM. Los valores de UF y UTM del día se pasan desde el conversor de
 * indicadores (mindicador.cl). Es una estimación referencial (convención §9): no reemplaza
 * la liquidación oficial del empleador.
 */

export interface AfpOption {
  id: string;
  name: string;
  /** Comisión de la AFP, en % de la renta imponible (se suma al 10% obligatorio). */
  comision: number;
}

export interface TaxBracket {
  /** Límite superior del tramo, en UTM (Infinity para el último). */
  upToUtm: number;
  /** Factor aplicado a la base tributable. */
  factor: number;
  /** Rebaja del tramo, en UTM. */
  rebajaUtm: number;
}

export interface PayrollConfig {
  /** Año/versión de los parámetros, para mostrarlo y facilitar su actualización. */
  version: string;
  /** Cotización obligatoria de AFP (capitalización), sin comisión. */
  afpCotizacion: number;
  /** Cotización legal de salud. */
  saludLegal: number;
  /** Aporte del trabajador al seguro de cesantía (contrato indefinido). */
  cesantiaIndefinido: number;
  /** Tope imponible para AFP y salud, en UF. */
  topeImponibleUf: number;
  /** Tope imponible para el seguro de cesantía, en UF. */
  topeCesantiaUf: number;
  afps: AfpOption[];
  /** Tramos del impuesto único de segunda categoría (mensual), en UTM. */
  brackets: TaxBracket[];
}

/**
 * Parámetros 2026 (REFERENCIALES — verificar contra los valores oficiales del año en
 * https://www.sii.cl y la Superintendencia de Pensiones antes de tomar decisiones).
 * Centralizados aquí para actualizarlos en un solo lugar.
 */
export const PAYROLL_CONFIG: PayrollConfig = {
  version: '2026',
  afpCotizacion: 0.1,
  saludLegal: 0.07,
  cesantiaIndefinido: 0.006,
  topeImponibleUf: 87.8,
  topeCesantiaUf: 131.9,
  afps: [
    { id: 'modelo', name: 'Modelo', comision: 0.0058 },
    { id: 'uno', name: 'Uno', comision: 0.0049 },
    { id: 'habitat', name: 'Habitat', comision: 0.0127 },
    { id: 'planvital', name: 'PlanVital', comision: 0.0116 },
    { id: 'capital', name: 'Capital', comision: 0.0144 },
    { id: 'cuprum', name: 'Cuprum', comision: 0.0144 },
    { id: 'provida', name: 'ProVida', comision: 0.0145 },
  ],
  // Tramos del impuesto único de segunda categoría (factores SII vigentes).
  brackets: [
    { upToUtm: 13.5, factor: 0, rebajaUtm: 0 },
    { upToUtm: 30, factor: 0.04, rebajaUtm: 0.54 },
    { upToUtm: 50, factor: 0.08, rebajaUtm: 1.74 },
    { upToUtm: 70, factor: 0.135, rebajaUtm: 4.49 },
    { upToUtm: 90, factor: 0.23, rebajaUtm: 11.14 },
    { upToUtm: 120, factor: 0.304, rebajaUtm: 17.8 },
    { upToUtm: 310, factor: 0.35, rebajaUtm: 23.32 },
    { upToUtm: Infinity, factor: 0.4, rebajaUtm: 38.82 },
  ],
};

export type SaludTipo = 'fonasa' | 'isapre';
export type Contrato = 'indefinido' | 'plazo';

export interface PayrollInput {
  /** Sueldo bruto imponible mensual, en pesos. */
  brutoImponible: number;
  /** Haberes no imponibles (colación, movilización), en pesos. Se suman al líquido. */
  noImponible: number;
  afpId: string;
  saludTipo: SaludTipo;
  /** Valor del plan de Isapre en UF (solo si saludTipo = 'isapre'). */
  planIsapreUf: number;
  contrato: Contrato;
}

export interface PayrollResult {
  rentaImponible: number;
  afp: number;
  salud: number;
  /** Excedente de Isapre sobre el 7% legal (informativo). */
  saludAdicional: number;
  cesantia: number;
  baseTributable: number;
  impuesto: number;
  totalDescuentos: number;
  liquido: number;
}

/** Impuesto único mensual sobre la `baseTributable` (en pesos) dado el valor de la UTM. */
export function impuestoUnico(baseTributable: number, utm: number, config = PAYROLL_CONFIG): number {
  if (baseTributable <= 0 || !(utm > 0)) return 0;
  const baseUtm = baseTributable / utm;
  for (const tramo of config.brackets) {
    if (baseUtm <= tramo.upToUtm) {
      return Math.max(0, baseTributable * tramo.factor - tramo.rebajaUtm * utm);
    }
  }
  return 0;
}

export function computePayroll(
  input: PayrollInput,
  uf: number,
  utm: number,
  config = PAYROLL_CONFIG,
): PayrollResult {
  const afp = config.afps.find((a) => a.id === input.afpId) ?? config.afps[0];
  const bruto = Math.max(0, input.brutoImponible || 0);

  const topeImp = config.topeImponibleUf * uf;
  const topeCes = config.topeCesantiaUf * uf;
  const rentaImponible = Math.min(bruto, topeImp);
  const rentaCesantia = Math.min(bruto, topeCes);

  const afpMonto = rentaImponible * (config.afpCotizacion + afp.comision);
  const saludLegal = rentaImponible * config.saludLegal;

  let salud = saludLegal;
  let saludAdicional = 0;
  if (input.saludTipo === 'isapre') {
    const plan = Math.max(0, input.planIsapreUf || 0) * uf;
    salud = Math.max(saludLegal, plan);
    saludAdicional = salud - saludLegal;
  }

  const cesantia = input.contrato === 'indefinido' ? rentaCesantia * config.cesantiaIndefinido : 0;

  // Base tributable: renta imponible menos cotizaciones legales (salud deducible tope 7%).
  const baseTributable = Math.max(0, rentaImponible - afpMonto - saludLegal - cesantia);
  const impuesto = impuestoUnico(baseTributable, utm, config);

  const totalDescuentos = afpMonto + salud + cesantia + impuesto;
  const liquido = bruto - totalDescuentos + Math.max(0, input.noImponible || 0);

  return {
    rentaImponible,
    afp: afpMonto,
    salud,
    saludAdicional,
    cesantia,
    baseTributable,
    impuesto,
    totalDescuentos,
    liquido,
  };
}

/** Peso chileno: entero agrupado (sin decimales). */
export function formatCLP(n: number, lang: 'es' | 'en'): string {
  if (!Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString(lang === 'es' ? 'es-CL' : 'en-US')}`;
}
