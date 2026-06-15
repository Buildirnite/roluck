import { useEffect, useState } from 'react';
import { IconArrowsExchange, IconRefresh, IconAlertTriangle } from '@tabler/icons-react';
import ToolShell from '../components/ToolShell';
import { useI18n } from '../i18n/I18nContext';
import {
  INDICATORS,
  cachedOrFallback,
  fetchIndicators,
  convertIndicator,
  formatValue,
  formatSnapshotDate,
  type IndicatorCode,
  type Snapshot,
} from '../utils/indicators';

const selectClass =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent';

/**
 * Ruta /indicadores — conversor de UF, UTM, dólar y euro respecto al peso chileno (Familia
 * B, informe §6). Los valores vienen de mindicador.cl con caché en localStorage + fallback
 * y aviso si la API no responde (convención §8). Toda la lógica vive en utils/indicators.ts.
 */
export default function IndicatorsPage() {
  const { t, lang } = useI18n();
  const [snap, setSnap] = useState<Snapshot>(() => cachedOrFallback());
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState<IndicatorCode>('uf');
  const [to, setTo] = useState<IndicatorCode>('clp');

  async function refresh() {
    setLoading(true);
    setFailed(false);
    try {
      setSnap(await fetchIndicators());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  // Al montar, intenta refrescar en segundo plano (la caché/fallback ya se muestra).
  useEffect(() => {
    refresh();
  }, []);

  const numeric = Number.parseFloat(amount.replace(',', '.'));
  const valid = Number.isFinite(numeric);
  const result = valid ? convertIndicator(numeric, from, to, snap.values) : NaN;

  const stale = snap.fallback || failed;
  const meta = (code: IndicatorCode) => INDICATORS.find((i) => i.code === code)!;

  return (
    <ToolShell title={t.indicators.title} subtitle={t.indicators.subtitle}>
      <div className="flex flex-col gap-6">
        {/* Conversor */}
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-bg-surface p-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.indicators.amount}</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 font-mono text-lg text-text-primary outline-none transition-colors focus:border-accent"
            />
            <select value={from} onChange={(e) => setFrom(e.target.value as IndicatorCode)} className={selectClass}>
              {INDICATORS.map((i) => (
                <option key={i.code} value={i.code}>
                  {i.name[lang]} ({i.symbol})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            title={t.indicators.swap}
            aria-label={t.indicators.swap}
            className="mx-auto flex h-10 w-10 flex-shrink-0 items-center justify-center self-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:border-accent/50 hover:text-accent md:mb-7"
          >
            <IconArrowsExchange size={18} stroke={1.8} />
          </button>

          <div className="flex flex-col gap-2 rounded-xl border border-accent/30 bg-bg-surface p-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.indicators.result}</label>
            <output className="block truncate rounded-lg bg-bg-elevated px-3 py-2.5 font-mono text-lg text-accent">
              {valid ? formatValue(result, to, lang) : '—'}
            </output>
            <select value={to} onChange={(e) => setTo(e.target.value as IndicatorCode)} className={selectClass}>
              {INDICATORS.map((i) => (
                <option key={i.code} value={i.code}>
                  {i.name[lang]} ({i.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {valid && from !== to && (
          <p className="text-sm text-text-muted">
            1 {meta(from).symbol} = {formatValue(convertIndicator(1, from, to, snap.values), to, lang)} {meta(to).symbol}
          </p>
        )}

        {/* Valores de hoy */}
        <section className="rounded-xl border border-border bg-bg-surface p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-text-primary">{t.indicators.todayTitle}</h2>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
            >
              <IconRefresh size={14} stroke={1.8} className={loading ? 'animate-spin' : ''} />
              {loading ? t.indicators.updating : t.indicators.refresh}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {INDICATORS.filter((i) => i.code !== 'clp').map((i) => (
              <div key={i.code} className="flex flex-col rounded-lg border border-border bg-bg-elevated px-3 py-2.5">
                <span className="text-[11px] uppercase tracking-wide text-text-muted">{i.symbol}</span>
                <span className="mt-0.5 font-mono text-base font-bold text-text-primary tabular-nums">
                  ${formatValue(snap.values[i.code], 'clp', lang)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-muted">
            {stale ? t.indicators.fallbackNote : t.indicators.source(formatSnapshotDate(snap.date, lang))}
          </p>
        </section>

        {stale && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 light:bg-amber-500/10 p-3 text-xs text-amber-300/90 light:text-amber-700">
            <IconAlertTriangle size={15} stroke={1.8} className="mt-0.5 flex-shrink-0" />
            {t.indicators.staleWarning}
          </p>
        )}
      </div>
    </ToolShell>
  );
}
