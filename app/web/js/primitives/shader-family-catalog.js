export const BUILT_IN_SHADER_MODULE_METADATA = Object.freeze([
  { moduleType: 'shader-field-plane', family: 'shader', role: 'field' },
  { moduleType: 'flow-noise-slab', family: 'shader', role: 'field' },
  { moduleType: 'volumetric-haze', family: 'shader', role: 'atmosphere' },
  { moduleType: 'anchor-core', family: 'shader', role: 'anchor' },
  { moduleType: 'agent-shader-plane', family: 'shader', role: 'agent-authored' }
]);

export const BUILT_IN_SHADER_MODULE_TYPES = Object.freeze(
  BUILT_IN_SHADER_MODULE_METADATA.map((entry) => entry.moduleType)
);

function requireBuilderFactory(moduleType, factories) {
  const factory = factories?.[moduleType];
  if (typeof factory !== 'function') {
    throw new Error(`Missing built-in shader factory for ${moduleType}`);
  }
  return factory;
}

export function createShaderFamilyCatalog({ factories = {}, wrapBuilder = (builder) => builder } = {}) {
  const entries = BUILT_IN_SHADER_MODULE_METADATA.map((metadata) => {
    const factory = requireBuilderFactory(metadata.moduleType, factories);
    const builder = wrapBuilder(factory, metadata);
    return Object.freeze({ ...metadata, builder });
  });
  const byModuleType = new Map(entries.map((entry) => [entry.moduleType, entry]));
  const builders = Object.freeze(Object.fromEntries(entries.map((entry) => [entry.moduleType, entry.builder])));

  return Object.freeze({
    entries: Object.freeze(entries.slice()),
    moduleTypes: BUILT_IN_SHADER_MODULE_TYPES,
    byModuleType,
    builders,
    buildRuntimeModule(moduleType, args) {
      const entry = byModuleType.get(String(moduleType || '').trim());
      if (!entry) return null;
      return entry.builder(args);
    },
    buildShaderModule(moduleType, args) {
      const entry = byModuleType.get(String(moduleType || '').trim());
      if (!entry) return null;
      return entry.builder(args);
    }
  });
}
