import * as THREE from 'three';
import { hashString, hslStringToColor, mulberry32, resolveBlend } from '../../primitives/utils.js';
import { hasStructuredGeometryDsl } from '../../contracts/custom-module-compiler-contract.js';
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
  asText,
  clamp,
  isFullscreenPlaneDsl,
  isObject,
  resolveDepthTest,
  resolveDepthWrite,
  toBoolean
} from './runtime-utils.js';
import { applyTransform, buildTransformParams } from './transforms.js';
import {
  buildStructuredGeometryNode,
  resolveStructuredPalette
} from './structured-geometry-builder.js';

export function makeShapeGeometry(shape, size = 1) {
  const id = String(shape || 'icosahedron').toLowerCase();
  if (id.includes('sphere')) return new THREE.SphereGeometry(size, 16, 16);
  if (id.includes('box')) return new THREE.BoxGeometry(size, size, size);
  if (id.includes('torus')) return new THREE.TorusGeometry(size * 0.8, size * 0.2, 10, 48);
  if (id.includes('cone')) return new THREE.ConeGeometry(size * 0.7, size * 1.5, 12);
  return new THREE.IcosahedronGeometry(size, 0);
}

export function createDslGeometryBuilder(spec) {
  return ({ primitive, sceneCfg, seed = 0, index = 0 }) => {
    const dsl = isObject(spec.source.dsl) ? spec.source.dsl : {};
    const params = isObject(primitive?.params) ? primitive.params : {};
    const hasShaderSource = Boolean(spec.source.glsl.vertex || spec.source.glsl.fragment);
    const hasStructuredGeometry = hasStructuredGeometryDsl(dsl.geometry);

    if (hasShaderSource) {
      const width = clamp(params.width ?? dsl.width ?? dsl.gridWidth, 0.3, 120, 7.2);
      const height = clamp(params.height ?? dsl.height ?? dsl.gridHeight, 0.3, 120, 5.4);
      const segmentsX = Math.round(clamp(params.segmentsX ?? dsl.segmentsX ?? dsl.cellCount, 1, 240, 32));
      const segmentsY = Math.round(clamp(params.segmentsY ?? dsl.segmentsY ?? dsl.cellCount, 1, 240, 20));
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

      const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
      const uniforms = ensureShaderUniformDefaults(applyUniformMap({
        uTime: { value: 0 },
        uOpacity: { value: clamp(params.opacity ?? primitive?.opacity ?? dsl.opacity, 0.02, 1, 0.54) },
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
      applyTransform(mesh, buildTransformParams({ params, primitive, dsl, defaultPosition: [0, 0, 0] }));
      return { obj: mesh, uniforms };
    }

    if (hasStructuredGeometry) {
      const materialSpec = isObject(dsl.material) ? dsl.material : {};
      const baseContext = {
        spec,
        params,
        primitive,
        sceneCfg,
        seed,
        index,
      };
      const materialPalette = resolveStructuredPalette(materialSpec, baseContext);
      const obj = buildStructuredGeometryNode(dsl.geometry, {
        ...baseContext,
        dsl,
        materialPalette,
      });
      const transformDsl = isObject(dsl.transform) ? { ...dsl, ...dsl.transform } : dsl;
      applyTransform(obj, buildTransformParams({
        params,
        primitive,
        dsl: transformDsl,
        defaultPosition: [0, 0, 0]
      }));
      obj.frustumCulled = false;
      return { obj, uniforms: null };
    }

    const requestedCount = Number(params.count ?? dsl.count ?? spec.budgets.maxInstances ?? 16);
    const unclampedCount = Number.isFinite(requestedCount) ? Math.round(requestedCount) : 16;
    const count = Number.isFinite(spec.budgets.maxInstances) && spec.budgets.maxInstances > 0
      ? Math.max(1, Math.min(unclampedCount, Math.round(spec.budgets.maxInstances)))
      : Math.max(1, unclampedCount);
    const spread = clamp(params.spread ?? dsl.spread, 0.2, 30, 5);
    const depth = clamp(params.depth ?? dsl.depth, 0.1, 12, 2.5);
    const shape = asText(params.shape || dsl.shape || primitive?.shape, 48) || 'icosahedron';
    const wireframe = params.wireframe === true || dsl.wireframe === true;

    const group = new THREE.Group();
    const rand = mulberry32((seed ^ hashString(`${spec.id}:${index}`)) >>> 0);
    const color = hslStringToColor(
      sceneCfg?.palette?.[primitive?.color] || sceneCfg?.palette?.secondary || '#9aa8ff',
      '#9aa8ff'
    );

    for (let i = 0; i < count; i += 1) {
      const size = 0.08 + rand() * 0.5;
      const mesh = new THREE.Mesh(
        makeShapeGeometry(shape, size),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          wireframe,
          opacity: clamp(params.opacity ?? primitive?.opacity ?? dsl.opacity, 0.04, 1, 0.48)
        })
      );
      mesh.position.set(
        (rand() - 0.5) * spread * 2,
        (rand() - 0.5) * spread * 1.3,
        (rand() - 0.5) * depth
      );
      mesh.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      group.add(mesh);
    }

    applyTransform(group, buildTransformParams({ params, primitive, dsl, defaultPosition: [0, 0, 0] }));

    return { obj: group, uniforms: null };
  };
}
