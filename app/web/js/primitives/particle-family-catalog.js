export const BUILT_IN_PARTICLE_MODULE_METADATA = Object.freeze([
  { moduleType: 'particle-cloud', family: 'particle', role: 'cloud' },
  { moduleType: 'particle-shell', family: 'particle', role: 'shell' },
  { moduleType: 'particle-stream', family: 'particle', role: 'stream' },
  { moduleType: 'agent-particle-system', family: 'particle', role: 'agent-authored' }
]);

export const BUILT_IN_PARTICLE_MODULE_TYPES = Object.freeze(
  BUILT_IN_PARTICLE_MODULE_METADATA.map((entry) => entry.moduleType)
);

function requireBuilderFactory(moduleType, factories) {
  const factory = factories?.[moduleType];
  if (typeof factory !== 'function') {
    throw new Error(`Missing built-in particle factory for ${moduleType}`);
  }
  return factory;
}

export function createParticleFamilyCatalog({ factories = {}, wrapBuilder = (builder) => builder } = {}) {
  const entries = BUILT_IN_PARTICLE_MODULE_METADATA.map((metadata) => {
    const factory = requireBuilderFactory(metadata.moduleType, factories);
    const builder = wrapBuilder(factory, metadata);
    return Object.freeze({ ...metadata, builder });
  });
  const byModuleType = new Map(entries.map((entry) => [entry.moduleType, entry]));
  const builders = Object.freeze(Object.fromEntries(entries.map((entry) => [entry.moduleType, entry.builder])));

  return Object.freeze({
    entries: Object.freeze(entries.slice()),
    moduleTypes: BUILT_IN_PARTICLE_MODULE_TYPES,
    byModuleType,
    builders,
    buildRuntimeModule(moduleType, args) {
      const entry = byModuleType.get(String(moduleType || '').trim());
      if (!entry) return null;
      return entry.builder(args);
    },
    buildParticleModule(moduleType, args) {
      const entry = byModuleType.get(String(moduleType || '').trim());
      if (!entry) return null;
      return entry.builder(args);
    }
  });
}
