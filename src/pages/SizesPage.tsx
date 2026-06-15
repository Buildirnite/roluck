import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IconInfoCircle } from '@tabler/icons-react';
import ToolShell from '../components/ToolShell';
import { useI18n } from '../i18n/I18nContext';
import { SIZE_TABLES, getSizeTable } from '../utils/sizes';

/**
 * Ruta /tallas — conversor de tallas de ropa y calzado (informe §6.6). 100% client-side
 * con tablas estándar estáticas (utils/sizes.ts). El usuario elige categoría, su sistema
 * y su talla, y ve el equivalente en los demás sistemas + la tabla de referencia. La
 * categoría se refleja en la URL (?cat) para deep-linking.
 */
export default function SizesPage() {
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const [sysIndex, setSysIndex] = useState(0);
  const [rowIndex, setRowIndex] = useState(0);

  const table = getSizeTable(params.get('cat'));

  function selectCategory(id: string) {
    if (id === table.id) return;
    const p = new URLSearchParams(params);
    p.set('cat', id);
    setParams(p, { replace: true });
    setSysIndex(0);
    setRowIndex(0);
  }

  const row = table.rows[rowIndex] ?? table.rows[0];

  const selectClass =
    'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent';

  return (
    <ToolShell title={t.sizes.title} subtitle={t.sizes.subtitle}>
      <div className="flex flex-col gap-6">
        {/* Categoría */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{t.sizes.category}</p>
          <div className="flex flex-wrap gap-2">
            {SIZE_TABLES.map((tbl) => {
              const active = tbl.id === table.id;
              return (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => selectCategory(tbl.id)}
                  aria-pressed={active}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-bg-surface text-text-muted hover:border-accent/40 hover:text-text-primary'
                  }`}
                >
                  {tbl.name[lang]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tu sistema + tu talla */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t.sizes.system}
            </label>
            <select
              value={sysIndex}
              onChange={(e) => setSysIndex(Number(e.target.value))}
              className={selectClass}
            >
              {table.systems.map((s, i) => (
                <option key={s} value={i}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t.sizes.size}
            </label>
            <select
              value={rowIndex}
              onChange={(e) => setRowIndex(Number(e.target.value))}
              className={selectClass}
            >
              {table.rows.map((r, i) => (
                <option key={i} value={i}>
                  {r[sysIndex]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Equivalencias del valor elegido */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-primary">{t.sizes.equivalents}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {table.systems.map((s, i) => {
              const isInput = i === sysIndex;
              return (
                <div
                  key={s}
                  className={`flex flex-col items-center rounded-xl border px-2 py-3 ${
                    isInput ? 'border-accent/50 bg-accent/10' : 'border-border bg-bg-surface'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wide text-text-muted">{s}</span>
                  <span className={`mt-1 font-mono text-xl font-bold ${isInput ? 'text-accent' : 'text-text-primary'}`}>
                    {row[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tabla de referencia completa */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-primary">{t.sizes.tableTitle}</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-surface">
                  {table.systems.map((s, i) => (
                    <th
                      key={s}
                      className={`px-3 py-2 text-left font-semibold ${i === sysIndex ? 'text-accent' : 'text-text-muted'}`}
                    >
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, ri) => (
                  <tr
                    key={ri}
                    onClick={() => setRowIndex(ri)}
                    className={`cursor-pointer border-b border-border/60 transition-colors last:border-0 ${
                      ri === rowIndex ? 'bg-accent/10' : 'hover:bg-bg-elevated/50'
                    }`}
                  >
                    {r.map((v, ci) => (
                      <td
                        key={ci}
                        className={`px-3 py-2 font-mono ${
                          ri === rowIndex ? 'text-text-primary' : 'text-text-muted'
                        } ${ci === sysIndex ? 'font-bold text-accent' : ''}`}
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Disclaimer */}
        <p className="flex items-start gap-2 text-xs text-text-muted">
          <IconInfoCircle size={15} stroke={1.8} className="mt-0.5 flex-shrink-0 text-text-muted" />
          {t.sizes.note}
        </p>
      </div>
    </ToolShell>
  );
}
