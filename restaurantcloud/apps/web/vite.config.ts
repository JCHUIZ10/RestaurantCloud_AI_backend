import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Todo /api entra por Kong (puerto 8000), como en producción: enruta al núcleo y a los
      // microservicios. VITE_PROXY_DESTINO=http://127.0.0.1:8080 va directo al núcleo, sin Kong.
      '/api': {
        target: process.env.VITE_PROXY_DESTINO || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});