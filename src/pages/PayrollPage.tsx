import { useEffect, useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import ToolShell from '../components/ToolShell';
import { useI18n } from '../i18n/I18nContext';
import { cachedOrFallback, fetchIndicators, formatSnapshotDate, type Snapshot } from '../utils/indicators';
import {
  PAYROLL_CONFIG,
  computePayroll,
  formatCLP,
  type Contrato,
  type SaludTipo,
} from '../utils/payroll';

const inputClass =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent';
const fieldLabel = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted';

function num(value: string): number {
  const n = Number.parseFloat(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Ruta /sueldo-liquido — calculadora de sueldo líquido en Chile (Familia B, informe §6).
 * 100% client-side; la lógica y los parámetros versionados viven en utils/payroll.ts. Los
 * valores de UF y UTM del día se obtienen del conversor de indicadores (mindicador.cl), con
 * caché y fallback. Resultado referencial (convención §9): no reemplaza la liquidación oficial.
 */
export default function PayrollPage() {
  const { t, lang } = useI18n();
  const [snap, setSnap] = useState<Snapshot>(() => cachedOrFallback());
  const [stale, setStale] = useState(false);

  const [bruto, setBruto] = useState('1.000.000');
  const [noImp, setNoImp] = useState('');
  const [afpId, setAfpId] = useState(PAYROLL_CONFIG.afps[0].id);
  const [saludTipo, setSaludTipo] = useState<SaludTipo>('fonasa');
  const [planIsapre, setPlanIsapre] = useState('');
  const [contrato, setContrato] = useState<Contrato>('indefinido');

  useEffect(() => {
    fetchIndicators()
      .then(setSnap)
      .catch(() => setStale(true));
  }, []);

  const r = computePayroll(
    {
      brutoImponible: num(bruto),
      noImponible: num(noImp),
      afpId,
      saludTipo,
      planIsapreUf: num(planIsapre),
      contrato,
    },
    snap.values.uf,
    snap.values.utm,
  );
  const valuesStale = snap.fallback || stale;
  const f = (n: number) => formatCLP(n, lang);

  const rows: { label: string; value: number }[] = [
    { label: t.payroll.afp, value: r.afp },
    { label: t.payroll.salud, value: r.salud },
    { label: t.payroll.cesantia, value: r.cesantia },
    { label: t.payroll.impuesto, value: r.impuesto },
  ];

  return (
    <ToolShell title={t.payroll.title} subtitle={t.payroll.subtitle}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entradas */}
        <div className="flex flex-col gap-4">
          <div>
            <label className={fieldLabel}>{t.payroll.bruto}</label>
            <input type="text" inputMode="numeric" value={bruto} onChange={(e) => setBruto(e.target.value)} className={`${inputClass} font-mono`} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>{t.payroll.afpLabel}</label>
              <select value={afpId} onChange={(e) => setAfpId(e.target.value)} className={inputClass}>
                {PAYROLL_CONFIG.afps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({(a.comision * 100).toFixed(2)}%)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabel}>{t.payroll.contrato}</label>
              <select value={contrato} onChange={(e) => setContrato(e.target.value as Contrato)} className={inputClass}>
                <option value="indefinido">{t.payroll.indefinido}</option>
                <option value="plazo">{t.payroll.plazo}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>{t.payroll.salud}</label>
              <select value={saludTipo} onChange={(e) => setSaludTipo(e.target.value as SaludTipo)} className={inputClass}>
                <option value="fonasa">{t.payroll.fonasa}</option>
                <option value="isapre">{t.payroll.isapre}</option>
              </select>
            </div>
            {saludTipo === 'isapre' && (
              <div>
                <label className={fieldLabel}>{t.payroll.planUf}</label>
                <input type="text" inputMode="decimal" value={planIsapre} onChange={(e) => setPlanIsapre(e.target.value)} placeholder="0" className={`${inputClass} font-mono`} />
              </div>
            )}
          </div>

          <div>
            <label className={fieldLabel}>{t.payroll.noImponible}</label>
            <input type="text" inputMode="numeric" value={noImp} onChange={(e) => setNoImp(e.target.value)} placeholder="0" className={`${inputClass} font-mono`} />
          </div>
        </div>

        {/* Resultado */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-accent/30 bg-bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.payroll.liquido}</p>
            <p className="mt-1 font-mono text-3xl font-bold text-accent tabular-nums">{f(r.liquido)}</p>
          </div>

          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <h2 className="mb-2 text-sm font-semibold text-text-primary">{t.payroll.descuentos}</h2>
            <div className="flex flex-col divide-y divide-border/60">
              {rows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between py-1.5 text-sm">
                  <span className="text-text-muted">{row.label}</span>
                  <span className="font-mono text-text-primary">-{f(row.value)}</span>
                </div>
              ))}
              <div className="flex items-baseline justify-between py-1.5 text-sm font-semibold">
                <span className="text-text-primary">{t.payroll.totalDescuentos}</span>
                <span className="font-mono text-text-primary">-{f(r.totalDescuentos)}</span>
              </div>
            </div>
            {r.saludAdicional > 0 && (
              <p className="mt-2 text-xs text-text-muted">{t.payroll.adicionalNote(f(r.saludAdicional))}</p>
            )}
          </div>

          <p className="text-xs text-text-muted">
            {t.payroll.params(PAYROLL_CONFIG.version)} ·{' '}
            {valuesStale ? t.payroll.valuesFallback : t.payroll.valuesDate(formatSnapshotDate(snap.date, lang))}
            {' '}(UF ${formatCLP(snap.values.uf, lang).slice(1)}, UTM ${formatCLP(snap.values.utm, lang).slice(1)})
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-6 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 light:bg-amber-500/10 p-3 text-xs text-amber-300/90 light:text-amber-700">
        <IconAlertTriangle size={15} stroke={1.8} className="mt-0.5 flex-shrink-0" />
        {t.payroll.disclaimer}
      </p>
    </ToolShell>
  );
}
