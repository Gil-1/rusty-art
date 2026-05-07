export const BUILT_IN_GEOMETRY_MODULE_METADATA = Object.freeze([
  { moduleType: 'motif-armature', family: 'geometry', role: 'motif' },
  { moduleType: 'orbit-ribbon', family: 'geometry', role: 'ribbon' },
  { moduleType: 'shear-ribbon', family: 'geometry', role: 'ribbon' },
  { moduleType: 'drift-ribbon', family: 'geometry', role: 'ribbon' },
  {
    moduleType: 'fault-line',
    family: 'geometry',
    role: 'line',
    params: ['length', 'markLength', 'start', 'end', 'segment', 'width', 'markWidth', 'thickness', 'fractureAmount', 'rotationZ', 'boundedMark']
  },
  { moduleType: 'signal-weave', family: 'geometry', role: 'line' },
  { moduleType: 'node-cluster', family: 'geometry', role: 'cluster' },
  { moduleType: 'kandinsky-burst', family: 'geometry', role: 'artist-motif' },
  { moduleType: 'spiral-sigil', family: 'geometry', role: 'artist-motif' },
  { moduleType: 'miro-glyphs', family: 'geometry', role: 'artist-motif' },
  { moduleType: 'concentric-discs', family: 'geometry', role: 'artist-motif' },
  { moduleType: 'suprematist-planes', family: 'geometry', role: 'artist-motif' },
  { moduleType: 'klee-cells', family: 'geometry', role: 'artist-motif' },
  { moduleType: 'color-field-stack', family: 'geometry', role: 'field' },
  { moduleType: 'op-stripes', family: 'geometry', role: 'field' },
  { moduleType: 'instance-grid', family: 'geometry', role: 'grid' },
  { moduleType: 'polyhedron-array', family: 'geometry', role: 'cluster' },
  { moduleType: 'agent-geometry', family: 'geometry', role: 'agent-authored' },
  { moduleType: 'agent-composite-rig', family: 'geometry', role: 'agent-authored' }
]);

export const BUILT_IN_GEOMETRY_MODULE_TYPES = Object.freeze(
  BUILT_IN_GEOMETRY_MODULE_METADATA.map((entry) => entry.moduleType)
);

function requireBuilderFactory(moduleType, factories) {
  const factory = factories?.[moduleType];
  if (typeof factory !== 'function') {
    throw new Error(`Missing built-in geometry factory for ${moduleType}`);
  }
  return factory;
}

export function createGeometryFamilyCatalog({ factories = {}, wrapBuilder = (builder) => builder } = {}) {
  const entries = BUILT_IN_GEOMETRY_MODULE_METADATA.map((metadata) => {
    const factory = requireBuilderFactory(metadata.moduleType, factories);
    const builder = wrapBuilder(factory, metadata);
    return Object.freeze({ ...metadata, builder });
  });
  const byModuleType = new Map(entries.map((entry) => [entry.moduleType, entry]));
  const builders = Object.freeze(Object.fromEntries(entries.map((entry) => [entry.moduleType, entry.builder])));

  return Object.freeze({
    entries: Object.freeze(entries.slice()),
    moduleTypes: BUILT_IN_GEOMETRY_MODULE_TYPES,
    byModuleType,
    builders,
    buildRuntimeModule(moduleType, args) {
      const entry = byModuleType.get(String(moduleType || '').trim());
      if (!entry) return null;
      return entry.builder(args);
    },
    buildGeometryModule(moduleType, args) {
      const entry = byModuleType.get(String(moduleType || '').trim());
      if (!entry) return null;
      return entry.builder(args);
    }
  });
}
