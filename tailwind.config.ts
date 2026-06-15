import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Los colores referencian variables CSS en formato canal (R G B) para soportar
      // tema claro/oscuro y conservar los modificadores de opacidad de Tailwind
      // (bg-accent/15, border-accent/40, etc.). Los valores se definen en src/index.css.
      colors: {
        bg: {
          primary: 'rgb(var(--bg-primary) / <alpha-value>)',
          surface: 'rgb(var(--bg-surface) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          dim: 'rgb(var(--accent-dim) / <alpha-value>)',
          ink: 'rgb(var(--accent-ink) / <alpha-value>)', // texto legible SOBRE el acento
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
    },
  },
  // Variante `light:` (tema claro = clase .light en <html>) para los pocos casos que no
  // se resuelven con las variables CSS de color (p. ej. los ámbar de las advertencias).
  plugins: [plugin(({ addVariant }) => addVariant('light', '.light &'))],
} satisfies Config;
