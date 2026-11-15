import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api はバックエンドへプロキシする(接続先は VITE_API_TARGET で変更可能)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.VITE_API_TARGET ?? 'http://localhost:8080',
    },
  },
});
