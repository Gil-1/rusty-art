import { compileCustomModuleRegistry } from './scene-runtime/custom-module/compiler.js';

const BASE_MODULE_TYPE_TO_FAMILY = {
  'particle-cloud': 'particle',
  'particle-stream': 'particle',
  'particle-shell': 'particle',
  'volumetric-haze': 'shader',
  'anchor-core': 'shader',
  'shader-field-plane': 'shader',
  'flow-noise-slab': 'shader',
  'motif-armature': 'geometry',
  'orbit-ribbon': 'geometry',
  'shear-ribbon': 'geometry',
  'drift-ribbon': 'geometry',
  'fault-line': 'geometry',
  'signal-weave': 'geometry',
  'node-cluster': 'geometry',
  'kandinsky-burst': 'geometry',
  'spiral-sigil': 'geometry',
  'miro-glyphs': 'geometry',
  'concentric-discs': 'geometry',
  'suprematist-planes': 'geometry',
  'klee-cells': 'geometry',
  'color-field-stack': 'geometry',
  'op-stripes': 'geometry',
  'instance-grid': 'geometry',
  'polyhedron-array': 'geometry',
  'agent-geometry': 'geometry',
  'agent-composite-rig': 'geometry',
  'agent-particle-system': 'particle',
  'agent-shader-plane': 'shader'
};

export const SCENE_ELEMENT_MODULE_TYPES = Object.freeze(Object.keys(BASE_MODULE_TYPE_TO_FAMILY));

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

function getElementModuleType(element) {
  const moduleType = element?.moduleType;
  if (typeof moduleType !== 'string') return null;
  const normalized = moduleType.trim();
  return normalized || null;
}

function familiesForElements(elements = [], moduleTypeToFamily = BASE_MODULE_TYPE_TO_FAMILY) {
  const families = new Set();
  for (const element of elements) {
    const moduleType = getElementModuleType(element);
    const family = moduleType ? moduleTypeToFamily[moduleType] : null;
    if (family) families.add(family);
  }
  return families;
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
  const customModuleRegistry = compileCustomModuleRegistry({
    customModules,
    baseModuleTypes: SCENE_ELEMENT_MODULE_TYPES
  });

  const moduleTypeToFamily = {
    ...BASE_MODULE_TYPE_TO_FAMILY,
    ...(customModuleRegistry.moduleTypeToFamily || {})
  };
  const families = familiesForElements(elements, moduleTypeToFamily);
  await ensureFamilyBuilders(families);

  const builders = new Map();
  for (const family of families) {
    const registry = familyBuilderCache.get(family) || {};
    Object.entries(registry).forEach(([moduleType, builder]) => {
      if (typeof builder === 'function') builders.set(moduleType, builder);
    });
  }

  for (const [moduleType, builder] of customModuleRegistry.builders || []) {
    if (typeof builder === 'function') builders.set(moduleType, builder);
  }

  return {
    builders,
    customModuleReport: customModuleRegistry.report || null,
    pipelinePatches: customModuleRegistry.pipelinePatches || { post: [], camera: [], lighting: [] }
  };
}

export function buildElementObject({ element, sceneCfg, seed, index, builders }) {
  const moduleType = element?.moduleType;
  const builder = builders?.get?.(moduleType);
  if (!builder) return null;
  return builder({ primitive: element, sceneCfg, seed, index });
}
