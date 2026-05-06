import * as THREE from 'three';
import { hashString, hslStringToColor, mulberry32, resolveBlend } from '../../primitives/utils.js';
import {
  DEFAULT_PARTICLE_FRAGMENT,
  DEFAULT_PARTICLE_VERTEX
} from './shader-sources.js';
import {
  applyUniformMap,
  ensureShaderUniformDefaults,
  prepareCustomShaderSources
} from './uniforms.js';
import { clamp, isObject } from './runtime-utils.js';
import { applyTransform, buildTransformParams } from './transforms.js';

export function createDslParticleBuilder(spec) {
  return ({ primitive, sceneCfg, seed = 0, index = 0 }) => {
    const dsl = isObject(spec.source.dsl) ? spec.source.dsl : {};
    const params = isObject(primitive?.params) ? primitive.params : {};
    const requestedCount = Number(params.count ?? dsl.count ?? spec.budgets.maxInstances ?? 220);
    const unclampedCount = Number.isFinite(requestedCount) ? Math.round(requestedCount) : 220;
    const count = Number.isFinite(spec.budgets.maxInstances) && spec.budgets.maxInstances > 0
      ? Math.max(8, Math.min(unclampedCount, Math.round(spec.budgets.maxInstances)))
      : Math.max(8, unclampedCount);
    const spread = clamp(params.spread ?? dsl.spread, 0.2, 40, 6);
    const size = clamp(params.size ?? dsl.size, 0.002, 1, 0.08);

    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const rand = mulberry32((seed ^ hashString(`${spec.id}:particle:${index}`)) >>> 0);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (rand() - 0.5) * spread * 2;
      positions[i * 3 + 1] = (rand() - 0.5) * spread * 1.2;
      positions[i * 3 + 2] = (rand() - 0.5) * spread * 0.7;
      scales[i] = 0.55 + rand() * 1.75;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const hasShaderSource = Boolean(spec.source.glsl.vertex || spec.source.glsl.fragment);
    if (hasShaderSource) {
      const { vertexShader, fragmentShader, paramUniforms } = prepareCustomShaderSources({
        spec,
        params,
        sceneCfg,
        vertexFallback: DEFAULT_PARTICLE_VERTEX,
        fragmentFallback: DEFAULT_PARTICLE_FRAGMENT
      });
      const uniforms = ensureShaderUniformDefaults(applyUniformMap({
        uTime: { value: 0 },
        uSize: { value: size * 120 },
        uOpacity: { value: clamp(params.opacity ?? primitive?.opacity ?? dsl.opacity, 0.03, 1, 0.72) },
        uColorA: { value: hslStringToColor(sceneCfg?.palette?.primary || '#ffffff', '#ffffff') },
        ...paramUniforms
      }, {
        ...(isObject(dsl.uniforms) ? dsl.uniforms : {}),
        ...(isObject(params.uniforms) ? params.uniforms : {})
      }, sceneCfg), {
        vertexShader,
        fragmentShader,
        sceneCfg,
        seed,
        moduleId: spec.id,
        index
      });

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: resolveBlend(params.blend || dsl.blend || primitive?.blend || 'additive')
      });

      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      applyTransform(points, buildTransformParams({ params, primitive, dsl, defaultPosition: [0, 0, 0] }));
      return { obj: points, uniforms };
    }

    const material = new THREE.PointsMaterial({
      color: sceneCfg?.palette?.[primitive?.color] || sceneCfg?.palette?.primary || '#ffffff',
      size: size * 3,
      transparent: true,
      opacity: clamp(params.opacity ?? primitive?.opacity ?? dsl.opacity, 0.03, 1, 0.72),
      depthWrite: false,
      blending: resolveBlend(params.blend || dsl.blend || primitive?.blend || 'additive')
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    applyTransform(points, buildTransformParams({ params, primitive, dsl, defaultPosition: [0, 0, 0] }));

    return { obj: points, uniforms: null };
  };
}
