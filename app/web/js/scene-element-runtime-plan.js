import { compileCustomModuleRegistry } from './scene-runtime/custom-module/compiler.js';
import {
  BUILT_IN_SCENE_MODULE_CATALOG,
  BUILT_IN_SCENE_MODULE_TYPES
} from './contracts/runtime-module-catalog.js';

const DEFAULT_PIPELINE_PATCHES = Object.freeze({ post: [], camera: [], lighting: [] });

function normalizeModuleType(moduleType) {
  if (typeof moduleType !== 'string') return null;
  const normalized = moduleType.trim();
  return normalized || null;
}

function addUnique(list, seen, value) {
  if (!value || seen.has(value)) return;
  seen.add(value);
  list.push(value);
}

function normalizePipelinePatches(pipelinePatches = DEFAULT_PIPELINE_PATCHES) {
  return {
    post: Array.isArray(pipelinePatches?.post) ? pipelinePatches.post : [],
    camera: Array.isArray(pipelinePatches?.camera) ? pipelinePatches.camera : [],
    lighting: Array.isArray(pipelinePatches?.lighting) ? pipelinePatches.lighting : []
  };
}

function buildPipelinePatchFacts(pipelinePatches = DEFAULT_PIPELINE_PATCHES) {
  const normalized = normalizePipelinePatches(pipelinePatches);
  const facts = {};
  let total = 0;

  for (const family of ['post', 'camera', 'lighting']) {
    const patches = normalized[family];
    total += patches.length;
    facts[family] = {
      count: patches.length,
      ids: patches.map((patch) => patch?.id).filter(Boolean)
    };
  }

  return { total, ...facts };
}

export function buildSceneElementRuntimePlan({
  elements = [],
  customModules = [],
  baseModuleTypes = BUILT_IN_SCENE_MODULE_TYPES,
  baseModuleFamilyByType = BUILT_IN_SCENE_MODULE_CATALOG.moduleFamilyByType
} = {}) {
  const customModuleRegistry = compileCustomModuleRegistry({
    customModules,
    baseModuleTypes
  });
  const customModuleFamilyByType = customModuleRegistry.moduleTypeToFamily || {};
  const moduleTypeToFamily = {
    ...baseModuleFamilyByType,
    ...customModuleFamilyByType
  };

  const familiesToLoad = [];
  const familySet = new Set();
  const builtInModuleTypes = [];
  const builtInSet = new Set();
  const customModuleTypes = [];
  const customSet = new Set();
  const unresolvedModuleTypes = [];
  const unresolvedSet = new Set();
  const elementModuleResolutions = [];

  for (const element of Array.isArray(elements) ? elements : []) {
    const moduleType = normalizeModuleType(element?.moduleType);
    if (!moduleType) continue;

    const builtInFamily = baseModuleFamilyByType[moduleType] || null;
    const customFamily = customModuleFamilyByType[moduleType] || null;
    const family = customFamily || builtInFamily || null;
    const source = customFamily ? 'custom' : (builtInFamily ? 'built-in' : 'unresolved');

    if (family) addUnique(familiesToLoad, familySet, family);
    if (source === 'built-in') addUnique(builtInModuleTypes, builtInSet, moduleType);
    if (source === 'custom') addUnique(customModuleTypes, customSet, moduleType);
    if (source === 'unresolved') addUnique(unresolvedModuleTypes, unresolvedSet, moduleType);

    elementModuleResolutions.push({
      id: element?.id || null,
      moduleType,
      family,
      source
    });
  }

  const pipelinePatches = normalizePipelinePatches(customModuleRegistry.pipelinePatches);

  return {
    familiesToLoad,
    moduleTypeToFamily,
    builtInModuleTypes,
    customModuleTypes,
    unresolvedModuleTypes,
    elementModuleResolutions,
    customModuleReport: customModuleRegistry.report || null,
    customModuleRegistry,
    pipelinePatches,
    pipelinePatchFacts: buildPipelinePatchFacts(pipelinePatches)
  };
}
