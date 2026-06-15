import { useEffect, useState } from 'react';
import { IconAlertTriangle, IconWand } from '@tabler/icons-react';
import ToolShell from '../components/ToolShell';
import { useI18n } from '../i18n/I18nContext';
import type { Lang } from '../i18n/translations';
import { parseDate, todayStr } from '../utils/dateCalc';
import { cachedOrFallback, fetchIndicators, formatSnapshotDate, type Snapshot } from '../utils/indicators';
import { computeSeverance, estimatePendingVacation, SEVERANCE_CONFIG, type Causal } from '../utils/severance';

const inputClass =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent [color-scheme:dark]';
const fieldLabel = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted';

function num(value: string): number {
  const n = Number.parseFloat(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function formatCLP(n: number, lang: Lang): string {
  if (!Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString(lang === 'es' ? 'es-CL' : 'en-US')}`;
}

/**
 * Ruta /finiquito — calculadora de finiquito en Chile (Familia B, informe §6). 100%
 * client-side; la lógica y los parámetros versionados viven en utils/severance.ts. El tope
 * de 90 UF usa el valor del día del conversor de indicadores. Resultado referencial (§9).
 */
export default function SeverancePage() {
  const { t, lang } = useI18n();
  const [snap, setSnap] = useState<Snapshot>(() => cachedOrFallback());
  const [stale, setStale] = useState(false);

  const [salary, setSalary] = useState('800.000');
  const [start, setStart] = useState('2021-01-01');
  const [end, setEnd] = useState(todayStr());
  const [causal, setCausal] = useState<Causal>('needs');
  const [priorNotice, setPriorNotice] = useState(false);
  const [vacation, setVacation] = useState('');

  useEffect(() => {
    fetchIndicators()
      .then(setSnap)
      .catch(() => setStale(true));
  }, []);

  const startD = parseDate(start);
  const endD = parseDate(end);
  const valid = startD && endD && endD >= startD;

  function autoVacation() {
    if (startD && endD) setVacation(String(estimatePendingVacation(startD, endD)));
  }

  const r =
    valid &&
    computeSeverance(
      {
        salary: num(salary),
        startDate: startD!,
        endDate: endD!,
        causal,
        priorNotice,
        pendingVacationDays: num(vacation),
      },
      snap.values.uf,
    );

  const valuesStale = snap.fallback || stale;

  const rows = r
    ? [
        { label: t.severance.ias, value: r.ias },
        { label: t.severance.notice, value: r.notice },
        { label: t.severance.vacation, value: r.vacation },
      ]
    : [];

  return (
    <ToolShell title={t.severance.title} subtitle={t.severance.subtitle}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entradas */}
        <div className="flex flex-col gap-4">
          <div>
            <label className={fieldLabel}>{t.severance.salary}</label>
            <input type="text" inputMode="numeric" value={salary} onChange={(e) => setSalary(e.target.value)} className={`${inputClass} font-mono`} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>{t.severance.start}</label>
              <input type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={fieldLabel}>{t.severance.end}</label>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>{t.severance.causal}</label>
            <select value={causal} onChange={(e) => setCausal(e.target.value as Causal)} className={inputClass}>
              <option value="needs">{t.severance.causalNeeds}</option>
              <option value="resign">{t.severance.causalResign}</option>
              <option value="other">{t.severance.causalOther}</option>
            </select>
          </div>

          {causal === 'needs' && (
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input type="checkbox" checked={priorNotice} onChange={(e) => setPriorNotice(e.target.checked)} className="accent-accent" />
              {t.severance.priorNotice}
            </label>
          )}

          <div>
            <label className={fieldLabel}>{t.severance.vacationDays}</label>
            <div className="flex gap-2">
              <input type="text" inputMode="decimal" value={vacation} onChange={(e) => setVacation(e.target.value)} placeholder="0" className={`${inputClass} font-mono`} />
              <button
                type="button"
                onClick={autoVacation}
                disabled={!valid}
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-bg-surface px-3 text-xs font-medium text-text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-40"
              >
                <IconWand size={14} stroke={1.8} />
                {t.severance.estimate}
              </button>
            </div>
            <p className="mt-1 text-xs text-text-muted">{t.severance.vacationHint}</p>
          </div>
        </div>

        {/* Resultado */}
        <div className="flex flex-col gap-4">
          {r ? (
            <>
              <div className="rounded-xl border border-accent/30 bg-bg-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.severance.total}</p>
                <p className="mt-1 font-mono text-3xl font-bold text-accent tabular-nums">{formatCLP(r.total, lang)}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {t.severance.tenure(r.years, r.monthsExtra)} · {t.severance.iasYears(r.iasYears)}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-bg-surface p-4">
                <div className="flex flex-col divide-y divide-border/60">
                  {rows.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between py-1.5 text-sm">
                      <span className="text-text-muted">{row.label}</span>
                      <span className="font-mono text-text-primary">{formatCLP(row.value, lang)}</span>
                    </div>
                  ))}
                </div>
                {r.capped && <p className="mt-2 text-xs text-text-muted">{t.severance.cappedNote(SEVERANCE_CONFIG.topeUf)}</p>}
              </div>

              <p className="text-xs text-text-muted">
                {valuesStale ? t.severance.ufFallback : t.severance.ufValue(formatSnapshotDate(snap.date, lang))}{' '}
                (UF ${formatCLP(snap.values.uf, lang).slice(1)})
              </p>
            </>
          ) : (
            <p className="text-sm text-text-muted">{t.severance.invalid}</p>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-6 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300/90">
        <IconAlertTriangle size={15} stroke={1.8} className="mt-0.5 flex-shrink-0" />
        {t.severance.disclaimer}
      </p>
    </ToolShell>
  );
}
