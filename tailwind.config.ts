import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0a',
          surface: '#141414',
          elevated: '#1e1e1e',
        },
        accent: {
          DEFAULT: '#a3e635',
          dim: '#4d7c0f',
        },
        text: {
          primary: '#f5f5f5',
          muted: '#909090',
        },
        border: '#2a2a2a',
        success: '#22c55e',
        error: '#ef4444',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
