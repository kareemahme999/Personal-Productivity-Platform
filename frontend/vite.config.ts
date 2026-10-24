import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    react(),
    {
      name: 'github-pages-spa',
      closeBundle() {
        const dist = path.resolve(__dirname, 'dist');
        const index = path.join(dist, 'index.html');
        if (fs.existsSync(index)) {
          fs.copyFileSync(index, path.join(dist, '404.html'));
          fs.writeFileSync(path.join(dist, '.nojekyll'), '');
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
