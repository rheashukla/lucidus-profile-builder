import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const API_PORT = Number(process.env.PORT || 3001);

export default defineConfig({
  root: 'client',
  plugins: [react()],
  resolve: { alias: { '@shared': fileURLToPath(new URL('./shared', import.meta.url)) } },
  server: {
    port: 5173,
    proxy: { '/api': `http://localhost:${API_PORT}` },
  },
  build: { outDir: '../dist/client', emptyOutDir: true },
  test: {
    root: '.',
    include: ['server/**/*.test.ts', 'shared/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
});
