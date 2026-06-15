import { useState } from 'react';
import ToolShell from '../components/ToolShell';
import { useI18n } from '../i18n/I18nContext';
import { computeSellingPrice, formatCLP, formatPct, type PriceMode } from '../utils/sellingPrice';

const inputClass =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent';
const fieldLabel = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted';

function num(value: string): number {
  const n = Number.parseFloat(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Ruta /precio-venta — calcula el precio de venta de un producto a partir del costo, un
 * porcentaje de ganancia (margen o markup) y el IVA (Familia B, informe §6). 100%
 * client-side, matemática pura en utils/sellingPrice.ts.
 */
export default function SellingPricePage() {
  const { t, lang } = useI18n();

  const [cost, setCost] = useState('1.000');
  const [mode, setMode] = useState<PriceMode>('margin');
  const [percent, setPercent] = useState('30');
  const [iva, setIva] = useState('19');

  const r = computeSellingPrice({ cost: num(cost), mode, percent: num(percent), ivaRate: num(iva) });
  const f = (n: number) => formatCLP(n, lang);

  const rows: { label: string; value: string; strong?: boolean }[] = [
    { label: t.sellingPrice.cost, value: f(num(cost)) },
    { label: t.sellingPrice.profit, value: f(r.profit) },
    { label: t.sellingPrice.net, value: f(r.net), strong: true },
    { label: `${t.sellingPrice.iva} (${num(iva)}%)`, value: f(r.iva) },
  ];

  return (
    <ToolShell title={t.sellingPrice.title} subtitle={t.sellingPrice.subtitle}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entradas */}
        <div className="flex flex-col gap-4">
          <div>
            <label className={fieldLabel}>{t.sellingPrice.cost}</label>
            <input type="text" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} className={`${inputClass} font-mono`} />
          </div>

          <div>
            <label className={fieldLabel}>{t.sellingPrice.mode}</label>
            <div className="flex gap-2">
              {(['margin', 'markup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    mode === m
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-bg-surface text-text-muted hover:text-text-primary'
                  }`}
                >
                  {m === 'margin' ? t.sellingPrice.margin : t.sellingPrice.markup}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {mode === 'margin' ? t.sellingPrice.marginHint : t.sellingPrice.markupHint}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabel}>{mode === 'margin' ? t.sellingPrice.marginPct : t.sellingPrice.markupPct}</label>
              <input type="text" inputMode="decimal" value={percent} onChange={(e) => setPercent(e.target.value)} className={`${inputClass} font-mono`} />
            </div>
            <div>
              <label className={fieldLabel}>{t.sellingPrice.iva} (%)</label>
              <input type="text" inputMode="decimal" value={iva} onChange={(e) => setIva(e.target.value)} className={`${inputClass} font-mono`} />
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-accent/30 bg-bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.sellingPrice.finalPrice}</p>
            <p className="mt-1 font-mono text-3xl font-bold text-accent tabular-nums">{f(r.final)}</p>
            <p className="mt-1 text-xs text-text-muted">
              {t.sellingPrice.resultMargin(formatPct(r.marginPct, lang))} · {t.sellingPrice.resultMarkup(formatPct(r.markupPct, lang))}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <div className="flex flex-col divide-y divide-border/60">
              {rows.map((row) => (
                <div key={row.label} className={`flex items-baseline justify-between py-1.5 text-sm ${row.strong ? 'font-semibold' : ''}`}>
                  <span className={row.strong ? 'text-text-primary' : 'text-text-muted'}>{row.label}</span>
                  <span className="font-mono text-text-primary">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-text-muted">{t.sellingPrice.note}</p>
        </div>
      </div>
    </ToolShell>
  );
}
