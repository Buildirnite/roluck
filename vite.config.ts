import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // @jsquash/avif carga su códec WASM de forma diferida; lo excluimos del
  // pre-bundling de esbuild para que el .wasm se resuelva correctamente.
  optimizeDeps: {
    exclude: ['@jsquash/avif'],
  },
  // El códec multi-thread de AVIF usa Web Workers; formato ES para que sean
  // compatibles con el code-splitting de Rollup.
  worker: {
    format: 'es',
  },
});
