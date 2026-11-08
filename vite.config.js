import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

/** Project site: https://shanshanhli-oss.github.io/Daora/ */
const githubPagesBase = '/Daora/';

export default defineConfig({
  // `npm run build:pages` sets GITHUB_PAGES so JS and CSS load from /Daora/.
  // Local dev, preview, and the file-open build keep a relative base.
  base: process.env.VITE_BASE || (process.env.GITHUB_PAGES === 'true' ? githubPagesBase : './'),
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2800,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        sanctuary: resolve(root, 'sanctuary.html'),
        yijing: resolve(root, 'yijing.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('places.json')) return 'places';
          if (id.includes('node_modules/iztro') || id.includes('node_modules/lunar-javascript')) return 'charts';
        },
      },
    },
  },
});
