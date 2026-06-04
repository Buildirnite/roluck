import { useState } from 'react';
import type { WatermarkOptions, WatermarkPosition } from '../utils/editUtils';
import { useI18n } from '../i18n/I18nContext';

interface WatermarkPanelProps {
  onApply: (options: WatermarkOptions) => void;
  disabled?: boolean;
}

const POSITIONS: WatermarkPosition[] = ['tl', 'tc', 'tr', 'cl', 'cc', 'cr', 'bl', 'bc', 'br'];

/** Controles de marca de agua de texto (posición, opacidad, tamaño, color). */
export default function WatermarkPanel({ onApply, disabled }: WatermarkPanelProps) {
  const { t } = useI18n();
  const [text, setText] = useState('© RoLuck');
  const [position, setPosition] = useState<WatermarkPosition>('br');
  const [opacity, setOpacity] = useState(60);
  const [sizePct, setSizePct] = useState(5);
  const [color, setColor] = useState('#ffffff');

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-text-muted">{t.watermark.text}</span>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
      </label>

      <div>
        <span className="mb-1 block text-xs uppercase tracking-wide text-text-muted">{t.watermark.position}</span>
        <div className="grid w-28 grid-cols-3 gap-1">
          {POSITIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPosition(p)}
              aria-label={t.watermark.positionAria(p)}
              className={`h-8 rounded border transition-colors ${
                position === p ? 'border-accent bg-accent/20' : 'border-border bg-bg-elevated hover:border-accent/40'
              }`}
            >
              <span className={`block h-1.5 w-1.5 rounded-full ${position === p ? 'bg-accent' : 'bg-text-muted'} mx-auto`} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="uppercase tracking-wide text-text-muted">{t.watermark.opacity}</span>
          <span className="font-mono text-accent">{opacity}%</span>
        </div>
        <input type="range" min={10} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full" />
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="uppercase tracking-wide text-text-muted">{t.watermark.size}</span>
          <span className="font-mono text-accent">{sizePct}%</span>
        </div>
        <input type="range" min={2} max={15} value={sizePct} onChange={(e) => setSizePct(Number(e.target.value))} className="w-full" />
      </div>

      <label className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-text-muted">{t.watermark.color}</span>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent" />
      </label>

      <button
        type="button"
        onClick={() => onApply({ text, position, opacity: opacity / 100, color, sizePct })}
        disabled={disabled || !text.trim()}
        className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-text-muted"
      >
        {t.watermark.apply}
      </button>
    </div>
  );
}
