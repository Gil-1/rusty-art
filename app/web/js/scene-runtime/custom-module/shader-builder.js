import * as THREE from 'three';
import { hslStringToColor, resolveBlend } from '../../primitives/utils.js';
import {
  DEFAULT_SHADER_FRAGMENT,
  DEFAULT_SHADER_VERTEX
} from './shader-sources.js';
import {
  applyUniformMap,
  ensureShaderUniformDefaults,
  prepareCustomShaderSources
} from './uniforms.js';
import {
  clamp,
  isFullscreenPlaneDsl,
  isObject,
  resolveDepthTest,
  resolveDepthWrite,
  toBoolean
} from './runtime-utils.js';
import { applyTransform, buildTransformParams } from './transforms.js';

export function createDslShaderBuilder(spec) {
  return ({ primitive, sceneCfg, seed = 0, index = 0 }) => {
    const dsl = isObject(spec.source.dsl) ? spec.source.dsl : {};
    const params = isObject(primitive?.params) ? primitive.params : {};
    const width = clamp(params.width ?? dsl.width, 0.2, 120, 8);
    const height = clamp(params.height ?? dsl.height, 0.2, 120, 6);
    const isTransparent = toBoolean(params.transparent, toBoolean(dsl.transparent, true));
    const isDoubleSided = toBoolean(params.doubleSided, toBoolean(dsl.doubleSided, true));
    const isFullscreenPlane = isFullscreenPlaneDsl(dsl);
    const { vertexShader, fragmentShader, paramUniforms } = prepareCustomShaderSources({
      spec,
      params,
      sceneCfg,
      vertexFallback: DEFAULT_SHADER_VERTEX,
      fragmentFallback: DEFAULT_SHADER_FRAGMENT
    });

    const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
    const uniforms = ensureShaderUniformDefaults(applyUniformMap({
      uTime: { value: 0 },
      uOpacity: { value: clamp(params.opacity ?? primitive?.opacity ?? dsl.opacity, 0.02, 1, 0.68) },
      uColorA: { value: hslStringToColor(sceneCfg?.palette?.primary || '#ffffff', '#ffffff') },
      uColorB: { value: hslStringToColor(sceneCfg?.palette?.secondary || '#99a8ff', '#99a8ff') },
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
      transparent: isTransparent,
      depthWrite: resolveDepthWrite({ params, dsl, isTransparent }),
      depthTest: resolveDepthTest({ params, dsl, isFullscreenPlane }),
      side: isDoubleSided ? THREE.DoubleSide : THREE.FrontSide,
      blending: resolveBlend(params.blend || dsl.blend || primitive?.blend || 'normal')
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    applyTransform(mesh, buildTransformParams({ params, primitive, dsl, defaultPosition: [0, 0, -1.2] }));

    return { obj: mesh, uniforms };
  };
}
