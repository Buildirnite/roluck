import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IconArrowsExchange, IconCopy, IconCheck } from '@tabler/icons-react';
import ToolShell from '../components/ToolShell';
import { useI18n } from '../i18n/I18nContext';
import {
  CATEGORIES,
  getCategory,
  getUnit,
  convert,
  formatResult,
  unitLabel,
  type Category,
} from '../utils/units';

/**
 * Ruta /unidades — conversor de unidades 100% client-side (informe §6.5). Categoría y
 * unidades se reflejan en la URL (?cat&de&a) para deep-linking y keywords como
 * "convertir kg a libras"; el valor se mantiene local. Toda la matemática vive en
 * utils/units.ts (incluida la temperatura, que es afín y no lineal).
 */
export default function UnitsPage() {
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const [value, setValue] = useState('1');
  const [copied, setCopied] = useState(false);

  const category = getCategory(params.get('cat'));
  const fromId = getUnit(category, params.get('de'))?.id ?? category.units[0].id;
  const toId = getUnit(category, params.get('a'))?.id ?? category.units[1].id;
  const fromUnit = getUnit(category, fromId)!;

  const numeric = Number.parseFloat(value.replace(',', '.'));
  const valid = Number.isFinite(numeric);
  const result = valid ? convert(numeric, fromId, toId, category) : NaN;

  function setUrl(next: { cat?: string; de?: string; a?: string }) {
    const p = new URLSearchParams(params);
    p.set('cat', next.cat ?? category.id);
    p.set('de', next.de ?? fromId);
    p.set('a', next.a ?? toId);
    setParams(p, { replace: true });
  }

  function selectCategory(cat: Category) {
    if (cat.id === category.id) return;
    setUrl({ cat: cat.id, de: cat.units[0].id, a: cat.units[1].id });
  }

  function swap() {
    setUrl({ de: toId, a: fromId });
  }

  const selectClass =
    'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent';

  async function copyResult() {
    if (!valid) return;
    try {
      await navigator.clipboard.writeText(formatResult(result));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
  }

  return (
    <ToolShell title={t.units.title} subtitle={t.units.subtitle}>
      <div className="flex flex-col gap-6">
        {/* Selector de categoría */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{t.units.category}</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = cat.id === category.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat)}
                  aria-pressed={active}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-bg-surface text-text-muted hover:border-accent/40 hover:text-text-primary'
                  }`}
                >
                  {cat.name[lang]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversión: De → A */}
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
          {/* De */}
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-bg-surface p-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.units.from}</label>
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-label={t.units.value}
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 font-mono text-lg text-text-primary outline-none transition-colors focus:border-accent"
            />
            <select
              value={fromId}
              onChange={(e) => setUrl({ de: e.target.value })}
              aria-label={t.units.from}
              className={selectClass}
            >
              {category.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {unitLabel(u, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Intercambiar */}
          <button
            type="button"
            onClick={swap}
            title={t.units.swap}
            aria-label={t.units.swap}
            className="mx-auto flex h-10 w-10 flex-shrink-0 items-center justify-center self-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:border-accent/50 hover:text-accent md:mb-7"
          >
            <IconArrowsExchange size={18} stroke={1.8} />
          </button>

          {/* A */}
          <div className="flex flex-col gap-2 rounded-xl border border-accent/30 bg-bg-surface p-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.units.to}</label>
            <div className="flex items-center gap-2">
              <output className="min-w-0 flex-1 truncate rounded-lg bg-bg-elevated px-3 py-2.5 font-mono text-lg text-accent">
                {valid ? formatResult(result) : '—'}
              </output>
              <button
                type="button"
                onClick={copyResult}
                disabled={!valid}
                title={copied ? t.units.copied : t.units.copy}
                aria-label={t.units.copy}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-40"
              >
                {copied ? <IconCheck size={18} stroke={2} className="text-accent" /> : <IconCopy size={18} stroke={1.8} />}
              </button>
            </div>
            <select
              value={toId}
              onChange={(e) => setUrl({ a: e.target.value })}
              aria-label={t.units.to}
              className={selectClass}
            >
              {category.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {unitLabel(u, lang)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!valid && <p className="text-sm text-text-muted">{t.units.invalid}</p>}

        {/* Tabla de equivalencias comunes */}
        {valid && (
          <section className="rounded-xl border border-border bg-bg-surface p-4">
            <h2 className="text-sm font-semibold text-text-primary">{t.units.tableTitle}</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {t.units.tableHint(formatResult(numeric), fromUnit.symbol)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {category.units
                .filter((u) => u.id !== fromId)
                .map((u) => (
                  <div key={u.id} className="flex items-baseline justify-between gap-2 border-b border-border/60 py-1">
                    <span className="text-xs text-text-muted">{u.symbol}</span>
                    <span className="truncate font-mono text-sm text-text-primary">
                      {formatResult(convert(numeric, fromId, u.id, category))}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </ToolShell>
  );
}
