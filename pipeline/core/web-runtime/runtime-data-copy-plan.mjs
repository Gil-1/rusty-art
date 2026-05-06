import { existsSync } from 'node:fs';
import { cp, rm } from 'node:fs/promises';
import path from 'node:path';

export const RUNTIME_DATA_COPY_DEFAULTS = Object.freeze({
  dataDirName: 'data',
  cleanupOptions: Object.freeze({ recursive: true, force: true }),
  copyOptions: Object.freeze({ recursive: true })
});

/**
 * @param {{ webRoot?: string | null, distDir?: string | null, source?: string | null, target?: string | null, dataDirName?: string }} [options]
 */
export function createRuntimeDataCopyPlan({
  webRoot,
  distDir,
  source = null,
  target = null,
  dataDirName = RUNTIME_DATA_COPY_DEFAULTS.dataDirName
} = {}) {
  if (!webRoot && !source) throw new Error('Runtime data copy plan requires webRoot or source.');
  if (!distDir && !target) throw new Error('Runtime data copy plan requires distDir or target.');

  const resolvedSource = source || path.join(webRoot, dataDirName);
  const resolvedTarget = target || path.join(distDir, dataDirName);
  const cleanup = {
    id: 'cleanup-runtime-data',
    type: 'remove',
    target: resolvedTarget,
    options: { ...RUNTIME_DATA_COPY_DEFAULTS.cleanupOptions }
  };
  const copy = {
    id: 'copy-runtime-data',
    type: 'copy-if-exists',
    source: resolvedSource,
    target: resolvedTarget,
    options: { ...RUNTIME_DATA_COPY_DEFAULTS.copyOptions }
  };

  return {
    source: resolvedSource,
    target: resolvedTarget,
    cleanup,
    copy,
    actions: [cleanup, copy]
  };
}

async function adapterPathExists(adapter, filePath) {
  if (typeof adapter.exists === 'function') return Boolean(await adapter.exists(filePath));
  if (typeof adapter.existsSync === 'function') return Boolean(adapter.existsSync(filePath));
  return existsSync(filePath);
}

export async function executeRuntimeDataCopyPlan(plan, fsAdapter = {}) {
  if (!plan || !Array.isArray(plan.actions)) throw new Error('Runtime data copy plan actions are required.');

  const adapter = {
    existsSync,
    rm,
    cp,
    ...fsAdapter
  };
  const results = [];

  for (const action of plan.actions) {
    if (action.type === 'remove') {
      await adapter.rm(action.target, action.options || {});
      results.push({ id: action.id, type: action.type, target: action.target, status: 'ok' });
      continue;
    }

    if (action.type === 'copy-if-exists') {
      const exists = await adapterPathExists(adapter, action.source);
      if (!exists) {
        results.push({ id: action.id, type: action.type, source: action.source, target: action.target, status: 'skipped', reason: 'source-missing' });
        continue;
      }

      await adapter.cp(action.source, action.target, action.options || {});
      results.push({ id: action.id, type: action.type, source: action.source, target: action.target, status: 'ok' });
      continue;
    }

    throw new Error(`Unknown runtime data copy action "${action.type}".`);
  }

  return {
    source: plan.source,
    target: plan.target,
    results,
    copied: results.some((result) => result.id === 'copy-runtime-data' && result.status === 'ok')
  };
}
