/**
 * Simulador de dividendo de crédito hipotecario (/credito). 100% client-side.
 *
 * Usa amortización francesa (cuota fija): el dividendo mensual se calcula con la fórmula
 * estándar a partir del monto del crédito, la tasa de interés anual y el plazo. Es una
 * estimación referencial (convención §9): el dividendo real suma seguros (desgravamen e
 * incendio) y gastos que dependen del banco y del cliente.
 */

export type CreditUnit = 'uf' | 'clp';

export interface MortgageInput {
  /** Valor de la propiedad, en la unidad elegida. */
  propertyValue: number;
  /** Pie como porcentaje del valor (ej. 20). */
  downPct: number;
  /** Tasa de interés anual, en % (ej. 4.5). */
  annualRate: number;
  /** Plazo en años. */
  years: number;
}

export interface MortgageResult {
  /** Monto financiado (valor menos pie), en la unidad de entrada. */
  loanAmount: number;
  /** Pie, en la unidad de entrada. */
  downPayment: number;
  /** Cuota mensual (dividendo), en la unidad de entrada. */
  monthly: number;
  /** Total pagado a lo largo del crédito. */
  totalPaid: number;
  /** Intereses totales (total pagado menos monto del crédito). */
  totalInterest: number;
  months: number;
}

export function computeMortgage(input: MortgageInput): MortgageResult {
  const value = Math.max(0, input.propertyValue || 0);
  const downPct = Math.min(100, Math.max(0, input.downPct || 0));
  const downPayment = value * (downPct / 100);
  const loanAmount = value - downPayment;
  const months = Math.max(0, Math.round((input.years || 0) * 12));
  const r = (input.annualRate || 0) / 100 / 12;

  let monthly = 0;
  if (months > 0) {
    monthly = r > 0 ? (loanAmount * r) / (1 - Math.pow(1 + r, -months)) : loanAmount / months;
  }
  const totalPaid = monthly * months;
  const totalInterest = totalPaid - loanAmount;

  return { loanAmount, downPayment, monthly, totalPaid, totalInterest, months };
}
