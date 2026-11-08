import { defineConfig } from 'vite';

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
