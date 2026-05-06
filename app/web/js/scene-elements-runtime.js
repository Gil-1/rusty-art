import { buildSceneElementRuntimePlan } from './scene-element-runtime-plan.js';
import {
  BUILT_IN_SCENE_MODULE_CATALOG,
  BUILT_IN_SCENE_MODULE_TYPES
} from '../../../pipeline/core/scene/runtime-module-catalog.mjs';

export const SCENE_ELEMENT_MODULE_TYPES = BUILT_IN_SCENE_MODULE_TYPES;

const FAMILY_LOADERS = {
  particle: () => import('./primitives/particle-family.js'),
  shader: () => import('./primitives/shader-family.js'),
  geometry: () => import('./primitives/geometry-family.js')
};

const familyModuleCache = new Map();
const familyBuilderCache = new Map();

async function loadFamilyModule(family) {
  if (!FAMILY_LOADERS[family]) return null;
  if (!familyModuleCache.has(family)) {
    familyModuleCache.set(family, FAMILY_LOADERS[family]());
  }
  return familyModuleCache.get(family);
}

async function ensureFamilyBuilders(families) {
  const missing = [...families].filter((family) => !familyBuilderCache.has(family));
  if (!missing.length) return;

  const modules = await Promise.all(missing.map((family) => loadFamilyModule(family)));
  missing.forEach((family, index) => {
    const builders = modules[index]?.builders || {};
    familyBuilderCache.set(family, builders);
  });
}

export async function loadElementBuilders(elements = [], customModules = []) {
  const runtimeResolutionPlan = buildSceneElementRuntimePlan({
    elements,
    customModules,
    baseModuleTypes: SCENE_ELEMENT_MODULE_TYPES,
    baseModuleFamilyByType: BUILT_IN_SCENE_MODULE_CATALOG.moduleFamilyByType
  });
  const families = runtimeResolutionPlan.familiesToLoad;
  await ensureFamilyBuilders(families);

  const builders = new Map();
  for (const family of families) {
    const registry = familyBuilderCache.get(family) || {};
    Object.entries(registry).forEach(([moduleType, builder]) => {
      if (typeof builder === 'function') builders.set(moduleType, builder);
    });
  }

  for (const [moduleType, builder] of runtimeResolutionPlan.customModuleRegistry?.builders || []) {
    if (typeof builder === 'function') builders.set(moduleType, builder);
  }

  return {
    builders,
    customModuleReport: runtimeResolutionPlan.customModuleReport || null,
    pipelinePatches: runtimeResolutionPlan.pipelinePatches,
    runtimeResolutionPlan
  };
}

export function buildElementObject({ element, sceneCfg, seed, index, builders }) {
  const moduleType = element?.moduleType;
  const builder = builders?.get?.(moduleType);
  if (!builder) return null;
  return builder({ primitive: element, sceneCfg, seed, index });
}
