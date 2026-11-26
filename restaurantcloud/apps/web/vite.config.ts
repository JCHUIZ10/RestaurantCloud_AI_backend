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
  build: {
    // pdfjs-dist (cargado dinámicamente bajo demanda en VisorPdf) pesa ~501 kB minificado.
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'recharts';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'motion';
          }
          if (id.includes('node_modules/@stripe')) {
            return 'stripe';
          }
          if (id.includes('node_modules/@tanstack')) {
            return 'query';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/@hookform') ||
            id.includes('node_modules/zod')
          ) {
            return 'forms';
          }
          if (id.includes('node_modules/jsqr') || id.includes('node_modules/qrcode.react')) {
            return 'qr';
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router')
          ) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
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