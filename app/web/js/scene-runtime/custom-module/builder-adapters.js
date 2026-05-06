import { PIPELINE_FAMILIES } from '../../contracts/custom-module-compiler-contract.js';
import { createCustomJsBuilder } from './custom-js-builder.js';
import { createDslGeometryBuilder } from './geometry-builder.js';
import { createDslParticleBuilder } from './particle-builder.js';
import { createDslShaderBuilder } from './shader-builder.js';

export function createCustomBuilder(spec, runtime = globalThis) {
  if (PIPELINE_FAMILIES.has(spec.family)) {
    return { builder: null, reason: 'pipeline-family' };
  }

  if (spec.kind === 'js') {
    return createCustomJsBuilder(spec, runtime);
  }

  if (spec.family === 'shader') return { builder: createDslShaderBuilder(spec), reason: null };
  if (spec.family === 'geometry') return { builder: createDslGeometryBuilder(spec), reason: null };
  if (spec.family === 'particle') return { builder: createDslParticleBuilder(spec), reason: null };
  return { builder: null, reason: 'unknown-family' };
}
