const BUILT_IN_SCENE_MODULE_FAMILY_BY_TYPE = Object.freeze({
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
});

export const BUILT_IN_SCENE_MODULE_TYPES = Object.freeze(Object.keys(BUILT_IN_SCENE_MODULE_FAMILY_BY_TYPE));
export const AGENT_SCENE_MODULE_TYPES = Object.freeze([
  'agent-geometry',
  'agent-particle-system',
  'agent-shader-plane',
  'agent-composite-rig'
]);
export const BUILT_IN_SCENE_MODULE_FAMILIES = Object.freeze(
  [...new Set(Object.values(BUILT_IN_SCENE_MODULE_FAMILY_BY_TYPE))].sort()
);
export const BUILT_IN_SCENE_MODULE_CATALOG = Object.freeze({
  moduleTypes: BUILT_IN_SCENE_MODULE_TYPES,
  moduleFamilyByType: BUILT_IN_SCENE_MODULE_FAMILY_BY_TYPE,
  families: BUILT_IN_SCENE_MODULE_FAMILIES,
  agentModuleTypes: AGENT_SCENE_MODULE_TYPES
});

export function listBuiltInSceneModuleTypes() {
  return BUILT_IN_SCENE_MODULE_TYPES.slice();
}

export function getBuiltInSceneModuleFamily(moduleType) {
  const key = typeof moduleType === 'string' ? moduleType.trim() : '';
  return BUILT_IN_SCENE_MODULE_FAMILY_BY_TYPE[key] || null;
}

export function isBuiltInSceneModuleType(moduleType) {
  return Boolean(getBuiltInSceneModuleFamily(moduleType));
}

export function getBuiltInSceneModuleCatalog() {
  return {
    moduleTypes: listBuiltInSceneModuleTypes(),
    moduleFamilyByType: { ...BUILT_IN_SCENE_MODULE_FAMILY_BY_TYPE },
    families: BUILT_IN_SCENE_MODULE_FAMILIES.slice(),
    agentModuleTypes: AGENT_SCENE_MODULE_TYPES.slice()
  };
}
