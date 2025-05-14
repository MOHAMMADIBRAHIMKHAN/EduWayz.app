import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  root: './client', // ✅ where your index.html is located
  plugins: [
    tsconfigPaths(), // ✅ correct plugin usage
    react()
  ],
  build: {
    outDir: '../dist', // ✅ output outside client folder
    emptyOutDir: true,
    chunkSizeWarningLimit: 3000,
    target: 'esnext',
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
