import {
  PIPELINE_FAMILIES,
  compileCustomModuleContract
} from './compiler-contract.js';
import { createCustomBuilder } from './builder-adapters.js';

export function compileCustomModuleRegistry({ customModules = [], baseModuleTypes = [] } = {}) {
  const requested = Array.isArray(customModules) ? customModules : [];
  const maxModulesRaw = Number(globalThis.__DAILY_SCENE_CUSTOM_MODULES_MAX__);
  const maxModules = Number.isFinite(maxModulesRaw) && maxModulesRaw > 0
    ? Math.floor(maxModulesRaw)
    : null;
  const contract = compileCustomModuleContract({
    customModules: requested,
    baseModuleTypes,
    maxModules,
    allowJs: globalThis.__DAILY_SCENE_CUSTOM_JS__ === true
  });

  const registry = {
    builders: new Map(),
    moduleTypeToFamily: {},
    pipelinePatches: contract.pipelinePatches || { post: [], camera: [], lighting: [] },
    report: {
      requested: requested.length,
      accepted: [],
      rejected: Array.isArray(contract.report?.rejected) ? contract.report.rejected.slice() : []
    }
  };

  for (const { spec, reportEntry } of contract.acceptedSpecs || []) {
    if (PIPELINE_FAMILIES.has(spec.family)) {
      registry.report.accepted.push(reportEntry);
      continue;
    }

    const { builder, reason } = createCustomBuilder(spec);
    if (typeof builder !== 'function') {
      registry.report.rejected.push({ id: spec.id, reason: reason || 'builder-unavailable' });
      continue;
    }

    registry.builders.set(spec.id, builder);
    registry.moduleTypeToFamily[spec.id] = spec.family;
    registry.report.accepted.push(reportEntry);
  }

  return registry;
}
