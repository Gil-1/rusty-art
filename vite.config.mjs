import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

import { createRuntimeDataCopyPlan, executeRuntimeDataCopyPlan } from './pipeline/core/web-runtime/runtime-data-copy-plan.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(__dirname, 'app/web');
const WEB_DIST = path.join(__dirname, 'app/web-dist');

function copyRuntimeDataPlugin() {
  return {
    name: 'copy-runtime-data',
    async closeBundle() {
      const plan = createRuntimeDataCopyPlan({ webRoot: WEB_ROOT, distDir: WEB_DIST });
      await executeRuntimeDataCopyPlan(plan);
    }
  };
}

export default defineConfig({
  root: WEB_ROOT,
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  preview: {
    host: '127.0.0.1',
    port: 4173
  },
  build: {
    outDir: WEB_DIST,
    emptyOutDir: true
  },
  plugins: [copyRuntimeDataPlugin()]
});
