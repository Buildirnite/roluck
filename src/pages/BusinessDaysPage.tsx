import { useState, type ReactNode } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import ToolShell from '../components/ToolShell';
import { useI18n } from '../i18n/I18nContext';
import { parseDate, todayStr, formatDate, formatInt } from '../utils/dateCalc';
import { countBusinessDays, addBusinessDays, hasHolidayData, isBusinessDay } from '../utils/businessDays';

type Tab = 'count' | 'add';

const inputClass =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent';
const fieldLabel = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted';

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-bg-elevated px-2 py-3">
      <span className="font-mono text-2xl font-bold text-accent tabular-nums sm:text-3xl">{value}</span>
      <span className="mt-1 text-center text-[11px] uppercase tracking-wide text-text-muted">{label}</span>
    </div>
  );
}

/**
 * Ruta /dias-habiles — plazos y días hábiles en Chile (Familia B, informe §6). 100%
 * client-side: cuenta días hábiles entre fechas y suma plazos saltando fines de semana y
 * feriados. Lógica + feriados versionados en utils/businessDays.ts.
 */
export default function BusinessDaysPage() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>('count');

  const [start, setStart] = useState(todayStr());
  const [end, setEnd] = useState(todayStr());
  const [base, setBase] = useState(todayStr());
  const [days, setDays] = useState('5');

  const invalid = <p className="text-sm text-text-muted">{t.business.invalid}</p>;

  const warning = (
    <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 light:bg-amber-500/10 p-3 text-xs text-amber-300/90 light:text-amber-700">
      <IconAlertTriangle size={15} stroke={1.8} className="mt-0.5 flex-shrink-0" />
      {t.business.warning}
    </p>
  );

  function renderCount() {
    const a = parseDate(start);
    const b = parseDate(end);
    if (!a || !b) return invalid;
    const res = countBusinessDays(a, b);
    const covered = hasHolidayData(a, b);
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={fieldLabel}>{t.business.start}</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={fieldLabel}>{t.business.end}</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={formatInt(res.business, lang)} label={t.business.businessDays} />
          <Stat value={formatInt(res.weekend, lang)} label={t.business.weekendDays} />
          <Stat value={formatInt(res.holiday, lang)} label={t.business.holidayDays} />
          <Stat value={formatInt(res.total, lang)} label={t.business.totalDays} />
        </div>
        <p className="text-xs text-text-muted">{t.business.countHint}</p>
        {!covered && warning}
      </div>
    );
  }

  function renderAdd() {
    const b = parseDate(base);
    const n = Number.parseInt(days, 10);
    const result = b && Number.isFinite(n) ? addBusinessDays(b, n) : null;
    const covered = result ? hasHolidayData(b!, result) : true;
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={fieldLabel}>{t.business.base}</label>
            <input type="date" value={base} onChange={(e) => setBase(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={fieldLabel}>{t.business.businessDaysToAdd}</label>
            <input
              type="text"
              inputMode="numeric"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
        {result ? (
          <div className="rounded-xl border border-accent/30 bg-bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.business.resultDate}</p>
            <p className="mt-1 font-display text-lg font-bold capitalize text-accent">{formatDate(result, lang)}</p>
            {b && !isBusinessDay(b) && <p className="mt-1 text-xs text-text-muted">{t.business.baseNotBusiness}</p>}
          </div>
        ) : (
          invalid
        )}
        {!covered && warning}
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'count', label: t.business.tabCount },
    { id: 'add', label: t.business.tabAdd },
  ];

  return (
    <ToolShell title={t.business.title} subtitle={t.business.subtitle}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tb) => {
            const active = tb.id === tab;
            return (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id)}
                aria-pressed={active}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-bg-surface text-text-muted hover:border-accent/40 hover:text-text-primary'
                }`}
              >
                {tb.label}
              </button>
            );
          })}
        </div>

        {tab === 'count' ? renderCount() : renderAdd()}
      </div>
    </ToolShell>
  );
}
