import { useState } from 'react';
import { IconPlus, IconTrash, IconDownload, IconDeviceFloppy } from '@tabler/icons-react';
import ToolShell from '../components/ToolShell';
import { useI18n } from '../i18n/I18nContext';
import { useProStore } from '../store/useProStore';
import { useIssuerStore, emptyIssuer, type IssuerData } from '../store/useIssuerStore';
import {
  computeTotals,
  lineTotal,
  formatMoney,
  generateQuotePdf,
  type QuoteItem,
} from '../utils/quote';

const inputClass =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent';
const fieldLabel = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-text-muted';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Ruta /cotizaciones — generador de cotizaciones/presupuestos en PDF (informe §6). 100%
 * client-side: el PDF se arma con pdf-lib (lazy) en utils/quote.ts. Los datos del emisor se
 * guardan en localStorage (useIssuerStore) para reutilizarlos. Pro: quitar la marca del pie.
 */
export default function QuotesPage() {
  const { t, lang } = useI18n();
  const isPro = useProStore((s) => s.isPro);
  const { issuer, setIssuer } = useIssuerStore();

  const [client, setClient] = useState<IssuerData>(emptyIssuer);
  const [items, setItems] = useState<QuoteItem[]>([{ description: '', qty: 1, unitPrice: 0 }]);
  const [number, setNumber] = useState('001');
  const [date, setDate] = useState(todayStr());
  const [validUntil, setValidUntil] = useState('');
  const [currency, setCurrency] = useState('$');
  const [includeTax, setIncludeTax] = useState(true);
  const [taxRate, setTaxRate] = useState('19');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const rate = Number.parseFloat(taxRate.replace(',', '.')) || 0;
  const totals = computeTotals(items, rate, includeTax);
  const money = (n: number) => formatMoney(n, lang, currency);

  function updateItem(i: number, patch: Partial<QuoteItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { description: '', qty: 1, unitPrice: 0 }]);
  }
  function removeItem(i: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }
  function field(party: IssuerData, set: (p: IssuerData) => void, key: keyof IssuerData) {
    return (
      <input
        value={party[key]}
        onChange={(e) => set({ ...party, [key]: e.target.value })}
        className={inputClass}
        placeholder={t.quotes[key]}
      />
    );
  }

  async function download() {
    setBusy(true);
    try {
      const bytes = await generateQuotePdf(
        { issuer, client, items, number, date, validUntil, notes, currency, taxRate: rate, includeTax },
        { isPro, lang, labels: t.quotes.pdf },
      );
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${number || 'roluck'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell title={t.quotes.title} subtitle={t.quotes.subtitle} pro>
      <div className="flex flex-col gap-6">
        {/* Emisor + cliente */}
        <div className="grid gap-5 md:grid-cols-2">
          <section className="flex flex-col gap-2 rounded-xl border border-border bg-bg-surface p-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary">{t.quotes.issuer}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
                <IconDeviceFloppy size={12} stroke={1.8} />
                {t.quotes.issuerSaved}
              </span>
            </div>
            {field(issuer, setIssuer, 'name')}
            {field(issuer, setIssuer, 'taxId')}
            {field(issuer, setIssuer, 'address')}
            <div className="grid grid-cols-2 gap-2">
              {field(issuer, setIssuer, 'email')}
              {field(issuer, setIssuer, 'phone')}
            </div>
          </section>

          <section className="flex flex-col gap-2 rounded-xl border border-border bg-bg-surface p-4">
            <h2 className="text-sm font-semibold text-text-primary">{t.quotes.client}</h2>
            {field(client, setClient, 'name')}
            {field(client, setClient, 'taxId')}
            {field(client, setClient, 'address')}
            <div className="grid grid-cols-2 gap-2">
              {field(client, setClient, 'email')}
              {field(client, setClient, 'phone')}
            </div>
          </section>
        </div>

        {/* Metadatos */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={fieldLabel}>{t.quotes.number}</label>
            <input value={number} onChange={(e) => setNumber(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={fieldLabel}>{t.quotes.date}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={fieldLabel}>{t.quotes.validUntil}</label>
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Ítems */}
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text-primary">{t.quotes.items}</h2>
          <div className="hidden grid-cols-[1fr_70px_110px_110px_32px] gap-2 px-1 text-[11px] uppercase tracking-wide text-text-muted sm:grid">
            <span>{t.quotes.itemDesc}</span>
            <span className="text-right">{t.quotes.qty}</span>
            <span className="text-right">{t.quotes.unitPrice}</span>
            <span className="text-right">{t.quotes.lineTotal}</span>
            <span />
          </div>
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_70px_110px_110px_32px] sm:items-center">
              <input
                value={it.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                placeholder={t.quotes.itemDesc}
                className={`${inputClass} col-span-2 sm:col-span-1`}
              />
              <input
                type="text"
                inputMode="decimal"
                value={it.qty}
                onChange={(e) => updateItem(i, { qty: Number.parseFloat(e.target.value.replace(',', '.')) || 0 })}
                className={`${inputClass} text-right font-mono`}
                aria-label={t.quotes.qty}
              />
              <input
                type="text"
                inputMode="decimal"
                value={it.unitPrice}
                onChange={(e) => updateItem(i, { unitPrice: Number.parseFloat(e.target.value.replace(',', '.')) || 0 })}
                className={`${inputClass} text-right font-mono`}
                aria-label={t.quotes.unitPrice}
              />
              <output className="flex items-center justify-end px-2 font-mono text-sm text-text-primary">
                {money(lineTotal(it))}
              </output>
              <button
                type="button"
                onClick={() => removeItem(i)}
                aria-label={t.quotes.remove}
                className="flex h-9 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-30"
                disabled={items.length === 1}
              >
                <IconTrash size={16} stroke={1.8} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-bg-surface px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary"
          >
            <IconPlus size={16} stroke={1.8} />
            {t.quotes.addItem}
          </button>
        </section>

        {/* Moneda + IVA + notas + totales */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fieldLabel}>{t.quotes.currency}</label>
                <input value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label className={fieldLabel}>{t.quotes.taxRate}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  disabled={!includeTax}
                  className={`${inputClass} font-mono disabled:opacity-40`}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input type="checkbox" checked={includeTax} onChange={(e) => setIncludeTax(e.target.checked)} className="accent-accent" />
              {t.quotes.includeTax}
            </label>
            <div>
              <label className={fieldLabel}>{t.quotes.notes}</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} placeholder={t.quotes.notesPlaceholder} />
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-xl border border-accent/30 bg-bg-surface p-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t.quotes.subtotal}</span>
                <span className="font-mono text-text-primary">{money(totals.subtotal)}</span>
              </div>
              {includeTax && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{`${t.quotes.tax} (${rate}%)`}</span>
                  <span className="font-mono text-text-primary">{money(totals.tax)}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-border pt-2">
                <span className="font-semibold text-text-primary">{t.quotes.total}</span>
                <span className="font-mono text-lg font-bold text-accent">{money(totals.total)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={download}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <IconDownload size={17} stroke={1.8} />
              {busy ? t.quotes.generating : t.quotes.downloadPdf}
            </button>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
