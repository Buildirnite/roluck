import { useEffect, useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import ToolShell from '../components/ToolShell';
import { useI18n } from '../i18n/I18nContext';
import type { Lang } from '../i18n/translations';
import { cachedOrFallback, fetchIndicators, formatSnapshotDate, type Snapshot } from '../utils/indicators';
import { computeMortgage, type CreditUnit } from '../utils/mortgage';

const inputClass =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent';
const fieldLabel = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted';

function num(value: string): number {
  const n = Number.parseFloat(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Formato de un monto en la unidad: UF con decimales, CLP entero. */
function formatAmount(n: number, unit: CreditUnit, lang: Lang): string {
  if (!Number.isFinite(n)) return '—';
  const locale = lang === 'es' ? 'es-CL' : 'en-US';
  if (unit === 'uf') return `UF ${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${Math.round(n).toLocaleString(locale)}`;
}

function formatCLP(n: number, lang: Lang): string {
  return `$${Math.round(n).toLocaleString(lang === 'es' ? 'es-CL' : 'en-US')}`;
}

/**
 * Ruta /credito — simulador de dividendo hipotecario con amortización francesa (Familia B,
 * informe §6). 100% client-side; la lógica vive en utils/mortgage.ts. Si la entrada está en
 * UF, convierte a pesos con el valor del día del conversor de indicadores (mindicador.cl).
 */
export default function MortgagePage() {
  const { t, lang } = useI18n();
  const [snap, setSnap] = useState<Snapshot>(() => cachedOrFallback());
  const [stale, setStale] = useState(false);

  const [unit, setUnit] = useState<CreditUnit>('uf');
  const [value, setValue] = useState('4000');
  const [down, setDown] = useState('20');
  const [rate, setRate] = useState('4.5');
  const [years, setYears] = useState('25');

  useEffect(() => {
    fetchIndicators()
      .then(setSnap)
      .catch(() => setStale(true));
  }, []);

  const r = computeMortgage({
    propertyValue: num(value),
    downPct: num(down),
    annualRate: num(rate),
    years: num(years),
  });

  const uf = snap.values.uf;
  const valuesStale = snap.fallback || stale;
  const showClp = unit === 'uf';
  const fa = (n: number) => formatAmount(n, unit, lang);
  const clp = (nUf: number) => formatCLP(nUf * uf, lang);

  const rows: { label: string; value: number; strong?: boolean }[] = [
    { label: t.mortgage.loanAmount, value: r.loanAmount },
    { label: t.mortgage.downPayment, value: r.downPayment },
    { label: t.mortgage.totalInterest, value: r.totalInterest },
    { label: t.mortgage.totalPaid, value: r.totalPaid },
  ];

  return (
    <ToolShell title={t.mortgage.title} subtitle={t.mortgage.subtitle}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entradas */}
        <div className="flex flex-col gap-4">
          <div>
            <label className={fieldLabel}>{t.mortgage.unit}</label>
            <div className="flex gap-2">
              {(['uf', 'clp'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  aria-pressed={unit === u}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    unit === u
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-bg-surface text-text-muted hover:text-text-primary'
                  }`}
                >
                  {u === 'uf' ? t.mortgage.inUf : t.mortgage.inClp}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={fieldLabel}>{t.mortgage.propertyValue}</label>
            <input type="text" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className={`${inputClass} font-mono`} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={fieldLabel}>{t.mortgage.downPct}</label>
              <input type="text" inputMode="decimal" value={down} onChange={(e) => setDown(e.target.value)} className={`${inputClass} font-mono`} />
            </div>
            <div>
              <label className={fieldLabel}>{t.mortgage.annualRate}</label>
              <input type="text" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className={`${inputClass} font-mono`} />
            </div>
            <div>
              <label className={fieldLabel}>{t.mortgage.years}</label>
              <input type="text" inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} className={`${inputClass} font-mono`} />
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-accent/30 bg-bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.mortgage.monthly}</p>
            <p className="mt-1 font-mono text-3xl font-bold text-accent tabular-nums">{fa(r.monthly)}</p>
            {showClp && <p className="mt-1 font-mono text-sm text-text-muted">≈ {clp(r.monthly)}</p>}
          </div>

          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <div className="flex flex-col divide-y divide-border/60">
              {rows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between py-1.5 text-sm">
                  <span className="text-text-muted">{row.label}</span>
                  <span className="text-right font-mono text-text-primary">
                    {fa(row.value)}
                    {showClp && <span className="ml-1 text-text-muted">· {clp(row.value)}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {showClp && (
            <p className="text-xs text-text-muted">
              {valuesStale ? t.mortgage.ufFallback : t.mortgage.ufValue(formatSnapshotDate(snap.date, lang))}{' '}
              (UF ${formatCLP(uf, lang).slice(1)})
            </p>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-6 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 light:bg-amber-500/10 p-3 text-xs text-amber-300/90 light:text-amber-700">
        <IconAlertTriangle size={15} stroke={1.8} className="mt-0.5 flex-shrink-0" />
        {t.mortgage.disclaimer}
      </p>
    </ToolShell>
  );
}
