import { useState, type ReactNode } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import ToolShell from '../components/ToolShell';
import { useI18n } from '../i18n/I18nContext';
import {
  computeTrip,
  formatMoney,
  formatLiters,
  type EffUnit,
  type TripInput,
} from '../utils/tripCost';

const inputClass =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 font-mono text-sm text-text-primary outline-none transition-colors focus:border-accent';

const fieldLabel = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted';

/** Lee un input de texto numérico aceptando coma decimal; vacío/invalido = 0. */
function num(value: string): number {
  const n = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Tarjeta de resultado (valor grande + etiqueta). */
function Stat({ value, label, accent }: { value: ReactNode; label: string; accent?: boolean }) {
  return (
    <div
      className={`flex flex-col rounded-xl border px-4 py-3 ${
        accent ? 'border-accent/40 bg-accent/10' : 'border-border bg-bg-surface'
      }`}
    >
      <span className="text-[11px] uppercase tracking-wide text-text-muted">{label}</span>
      <span
        className={`mt-1 font-mono text-xl font-bold tabular-nums sm:text-2xl ${
          accent ? 'text-accent' : 'text-text-primary'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Ruta /costo-viaje — calcula el costo de combustible de un viaje en auto y lo divide entre
 * los pasajeros (informe §6.7). 100% client-side; la matemática vive en utils/tripCost.ts.
 * Acepta rendimiento en km/L o L/100km y suma peajes opcionales.
 */
export default function TripCostPage() {
  const { t, lang } = useI18n();

  const [distance, setDistance] = useState('100');
  const [roundTrip, setRoundTrip] = useState(false);
  const [efficiency, setEfficiency] = useState('14');
  const [effUnit, setEffUnit] = useState<EffUnit>('kmpl');
  const [price, setPrice] = useState('1300');
  const [tolls, setTolls] = useState('');
  const [passengers, setPassengers] = useState('1');

  const input: TripInput = {
    distance: num(distance),
    roundTrip,
    efficiency: num(efficiency),
    effUnit,
    pricePerLiter: num(price),
    tolls: num(tolls),
    passengers: num(passengers) || 1,
  };
  const r = computeTrip(input);
  const split = (num(passengers) || 1) > 1;

  return (
    <ToolShell title={t.trip.title} subtitle={t.trip.subtitle}>
      <div className="flex flex-col gap-6">
        {/* Distancia + ida y vuelta */}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className={fieldLabel}>{t.trip.distance}</label>
            <input
              type="text"
              inputMode="decimal"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => setRoundTrip((v) => !v)}
            aria-pressed={roundTrip}
            className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              roundTrip
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-border bg-bg-surface text-text-muted hover:text-text-primary'
            }`}
          >
            {t.trip.roundTrip}
          </button>
        </div>

        {/* Rendimiento + unidad */}
        <div>
          <label className={fieldLabel}>{t.trip.efficiency}</label>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              inputMode="decimal"
              value={efficiency}
              onChange={(e) => setEfficiency(e.target.value)}
              className={inputClass}
            />
            <div className="flex gap-2">
              {(['kmpl', 'l100'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setEffUnit(u)}
                  aria-pressed={effUnit === u}
                  className={`flex-1 whitespace-nowrap rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    effUnit === u
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-bg-surface text-text-muted hover:text-text-primary'
                  }`}
                >
                  {u === 'kmpl' ? t.trip.kmpl : t.trip.l100}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Precio + peajes + pasajeros */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={fieldLabel}>{t.trip.price}</label>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={fieldLabel}>{t.trip.tolls}</label>
            <input
              type="text"
              inputMode="decimal"
              value={tolls}
              onChange={(e) => setTolls(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className={fieldLabel}>{t.trip.passengers}</label>
            <input
              type="text"
              inputMode="numeric"
              value={passengers}
              onChange={(e) => setPassengers(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Resultados */}
        <section className="grid gap-3 sm:grid-cols-2">
          <Stat value={formatLiters(r.liters, lang)} label={t.trip.liters} />
          <Stat value={formatMoney(r.fuelCost, lang)} label={t.trip.fuelCost} />
          {input.tolls > 0 && <Stat value={formatMoney(r.totalCost, lang)} label={t.trip.totalCost} />}
          {split && <Stat value={formatMoney(r.perPassenger, lang)} label={t.trip.perPassenger} accent />}
        </section>

        <p className="text-sm text-text-muted">
          {t.trip.summary(formatLiters(r.totalDistance, lang))}
        </p>

        {/* Disclaimer */}
        <p className="flex items-start gap-2 text-xs text-text-muted">
          <IconInfoCircle size={15} stroke={1.8} className="mt-0.5 flex-shrink-0 text-text-muted" />
          {t.trip.note}
        </p>
      </div>
    </ToolShell>
  );
}
