import { existsSync } from 'node:fs';
import { cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(__dirname, 'app/web');
const WEB_DIST = path.join(__dirname, 'app/web-dist');
const WEB_DATA = path.join(WEB_ROOT, 'data');

function copyRuntimeDataPlugin() {
  return {
    name: 'copy-runtime-data',
    async closeBundle() {
      const target = path.join(WEB_DIST, 'data');
      await rm(target, { recursive: true, force: true });
      if (existsSync(WEB_DATA)) {
        await cp(WEB_DATA, target, { recursive: true });
      }
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
