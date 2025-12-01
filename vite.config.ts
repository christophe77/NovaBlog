import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: './client', // Point Vite vers le dossier client
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable websocket proxy
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            // Ignore ECONNREFUSED errors during startup
            if ((err as any).code !== 'ECONNREFUSED') {
              console.error('Proxy error:', err);
            }
          });
        },
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            // Ignore ECONNREFUSED errors during startup
            if ((err as any).code !== 'ECONNREFUSED') {
              console.error('Proxy error:', err);
            }
          });
        },
      },
    },
  },
  build: {
    outDir: '../dist/client', // Build dans dist/client depuis la racine
    emptyOutDir: true,
  },
});

