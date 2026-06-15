import { useEffect, useState, type ReactNode } from 'react';
import ToolShell from '../components/ToolShell';
import { useI18n } from '../i18n/I18nContext';
import {
  parseDate,
  parseDateTime,
  daysBetween,
  diffYMD,
  addPeriod,
  daysToNextBirthday,
  countdown,
  todayStr,
  formatDate,
  formatInt,
  type Period,
} from '../utils/dateCalc';

type Tab = 'diff' | 'add' | 'age' | 'countdown';

/** Tarjeta de estadística grande (número + etiqueta). Usada en desgloses y countdown. */
function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-bg-elevated px-2 py-3">
      <span className="font-mono text-2xl font-bold text-accent tabular-nums sm:text-3xl">{value}</span>
      <span className="mt-1 text-[11px] uppercase tracking-wide text-text-muted">{label}</span>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent [color-scheme:dark]';

const fieldLabel = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted';

/**
 * Ruta /fechas — calculadora de fechas y cuenta regresiva (informe §6.8). 100%
 * client-side. Cuatro funciones en pestañas: diferencia entre fechas, sumar/restar un
 * período, edad exacta y cuenta regresiva en vivo. La lógica vive en utils/dateCalc.ts.
 */
export default function DatesPage() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>('diff');

  // Estado por función.
  const [start, setStart] = useState(todayStr());
  const [end, setEnd] = useState(todayStr());
  const [base, setBase] = useState(todayStr());
  const [amount, setAmount] = useState('30');
  const [unit, setUnit] = useState<Period>('days');
  const [sign, setSign] = useState<1 | -1>(1);
  const [birth, setBirth] = useState('2000-01-01');
  const [target, setTarget] = useState('');

  // Reloj para la cuenta regresiva: solo corre en esa pestaña.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (tab !== 'countdown') return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [tab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'diff', label: t.dates.tabDiff },
    { id: 'add', label: t.dates.tabAdd },
    { id: 'age', label: t.dates.tabAge },
    { id: 'countdown', label: t.dates.tabCountdown },
  ];

  const invalid = <p className="text-sm text-text-muted">{t.dates.invalid}</p>;

  function renderDiff() {
    const a = parseDate(start);
    const b = parseDate(end);
    if (!a || !b) return invalid;
    const ymd = diffYMD(a, b);
    const totalDays = Math.abs(daysBetween(a, b));
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={fieldLabel}>{t.dates.start}</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={fieldLabel}>{t.dates.end}</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat value={ymd.years} label={t.dates.years} />
          <Stat value={ymd.months} label={t.dates.months} />
          <Stat value={ymd.days} label={t.dates.days} />
        </div>
        <p className="text-sm text-text-primary">
          {t.dates.totalDays(formatInt(totalDays, lang))}{' '}
          <span className="text-text-muted">· {t.dates.totalWeeks(formatInt(Math.floor(totalDays / 7), lang))}</span>
        </p>
      </div>
    );
  }

  function renderAdd() {
    const b = parseDate(base);
    const amt = Number.parseInt(amount, 10);
    const result = b && Number.isFinite(amt) ? addPeriod(b, amt, unit, sign) : null;
    const units: Period[] = ['days', 'weeks', 'months', 'years'];
    return (
      <div className="flex flex-col gap-4">
        <div>
          <label className={fieldLabel}>{t.dates.base}</label>
          <input type="date" value={base} onChange={(e) => setBase(e.target.value)} className={inputClass} />
        </div>
        <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
          <div className="flex gap-2">
            {([1, -1] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSign(s)}
                aria-pressed={sign === s}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  sign === s
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-bg-surface text-text-muted hover:text-text-primary'
                }`}
              >
                {s === 1 ? t.dates.add : t.dates.subtract}
              </button>
            ))}
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label={t.dates.amount}
            className={`${inputClass} font-mono`}
          />
          <select value={unit} onChange={(e) => setUnit(e.target.value as Period)} className={inputClass}>
            {units.map((u) => (
              <option key={u} value={u}>
                {t.dates[u]}
              </option>
            ))}
          </select>
        </div>
        {result ? (
          <div className="rounded-xl border border-accent/30 bg-bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.dates.result}</p>
            <p className="mt-1 font-display text-lg font-bold capitalize text-accent">{formatDate(result, lang)}</p>
          </div>
        ) : (
          invalid
        )}
      </div>
    );
  }

  function renderAge() {
    const b = parseDate(birth);
    if (!b) return invalid;
    const ref = new Date();
    const ymd = diffYMD(b, ref);
    const totalDays = Math.abs(daysBetween(b, ref));
    const toBirthday = daysToNextBirthday(b, ref);
    return (
      <div className="flex flex-col gap-4">
        <div>
          <label className={fieldLabel}>{t.dates.birth}</label>
          <input type="date" value={birth} max={todayStr()} onChange={(e) => setBirth(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat value={ymd.years} label={t.dates.years} />
          <Stat value={ymd.months} label={t.dates.months} />
          <Stat value={ymd.days} label={t.dates.days} />
        </div>
        <p className="text-sm text-text-primary">
          {t.dates.totalDays(formatInt(totalDays, lang))}
        </p>
        <p className="text-sm text-accent">
          {toBirthday === 0 ? t.dates.birthdayToday : t.dates.nextBirthday(formatInt(toBirthday, lang))}
        </p>
      </div>
    );
  }

  function renderCountdown() {
    const target_ = parseDateTime(target);
    const cd = target_ ? countdown(target_, now) : null;
    return (
      <div className="flex flex-col gap-4">
        <div>
          <label className={fieldLabel}>{t.dates.target}</label>
          <input
            type="datetime-local"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className={inputClass}
          />
        </div>
        {cd ? (
          <>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <Stat value={formatInt(cd.days, lang)} label={t.dates.days} />
              <Stat value={String(cd.hours).padStart(2, '0')} label={t.dates.hours} />
              <Stat value={String(cd.minutes).padStart(2, '0')} label={t.dates.minutes} />
              <Stat value={String(cd.seconds).padStart(2, '0')} label={t.dates.seconds} />
            </div>
            <p className={`text-sm font-medium ${cd.past ? 'text-accent' : 'text-text-muted'}`}>
              {cd.past ? t.dates.reached : `${t.dates.remaining} · ${formatDate(target_!, lang)}`}
            </p>
          </>
        ) : (
          invalid
        )}
      </div>
    );
  }

  return (
    <ToolShell title={t.dates.title} subtitle={t.dates.subtitle}>
      <div className="flex flex-col gap-6">
        {/* Pestañas */}
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

        {tab === 'diff' && renderDiff()}
        {tab === 'add' && renderAdd()}
        {tab === 'age' && renderAge()}
        {tab === 'countdown' && renderCountdown()}
      </div>
    </ToolShell>
  );
}
