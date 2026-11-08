import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/** Project site: https://shanshanhli-oss.github.io/Daora/ */
const githubPagesBase = '/Daora/';

export default defineConfig({
  // `npm run build:pages` sets GITHUB_PAGES so JS and CSS load from /Daora/.
  // Local dev, preview, and the file-open build keep a relative base.
  base: process.env.VITE_BASE || (process.env.GITHUB_PAGES === 'true' ? githubPagesBase : './'),
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 950,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        divination: resolve(__dirname, 'divination.html'),
      },
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
});
