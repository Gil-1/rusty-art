import {
  compileCustomModuleContract,
  hasStructuredGeometryDsl
} from './contracts/custom-module-compiler-contract.js';
import {
  BUILT_IN_SCENE_MODULE_CATALOG,
  BUILT_IN_SCENE_MODULE_TYPES
} from './contracts/runtime-module-catalog.js';

export const SHADER_COMPATIBILITY_STATUSES = Object.freeze({
  WEBGPU_COMPATIBLE: 'webgpu-compatible',
  WEBGL_ONLY: 'webgl-only',
  NO_SHADER_SURFACE: 'no-shader-surface'
});

const BUILT_IN_SHADER_MATERIAL_MODULES = Object.freeze({
  'shader-field-plane': { runtimeFamily: 'shader', materialType: 'ShaderMaterial' },
  'flow-noise-slab': { runtimeFamily: 'shader', materialType: 'ShaderMaterial' },
  'volumetric-haze': { runtimeFamily: 'shader', materialType: 'ShaderMaterial' },
  'anchor-core': { runtimeFamily: 'shader', materialType: 'ShaderMaterial' },
  'agent-shader-plane': { runtimeFamily: 'shader', materialType: 'ShaderMaterial' },
  'particle-cloud': { runtimeFamily: 'particle', materialType: 'ShaderMaterial' },
  'particle-shell': { runtimeFamily: 'particle', materialType: 'ShaderMaterial' },
  'agent-particle-system': { runtimeFamily: 'particle', materialType: 'ShaderMaterial' }
});

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function arrayFrom(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function booleanFlag(value) {
  if (value === true) return true;
  const raw = String(value || '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'webgpu-compatible';
}

function uniqueByKey(entries, keyFor) {
  const seen = new Set();
  const result = [];
  for (const entry of entries) {
    const key = keyFor(entry);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}

export function isExplicitWebGPUCompatible(value = {}) {
  return booleanFlag(value?.webgpuCompatible)
    || booleanFlag(value?.rendererCompatibility?.webgpu)
    || booleanFlag(value?.compatibility?.webgpu)
    || booleanFlag(value?.runtimeCompatibility?.webgpu);
}

export function collectSceneElements(art = null, explicitElements = null) {
  return [
    ...arrayFrom(explicitElements),
    ...arrayFrom(art?.scene?.elements),
    ...arrayFrom(art?.elements),
    ...arrayFrom(art?.scene?.representation?.elements),
    ...arrayFrom(art?.representation?.elements)
  ];
}

export function collectSceneCustomModules(art = null, explicitCustomModules = null) {
  return [
    ...arrayFrom(explicitCustomModules),
    ...arrayFrom(art?.sceneAuthoring?.customModules),
    ...arrayFrom(art?.scene?.sceneAuthoring?.customModules),
    ...arrayFrom(art?.scene?.customModules)
  ];
}

function collectImmersiveGeneratedModuleRefs(art = null) {
  const refs = [
    ...arrayFrom(art?.world?.generatedModules),
    ...arrayFrom(art?.world?.parts).map((part) => part?.moduleRef),
    ...arrayFrom(art?.parts).map((part) => part?.moduleRef)
  ].filter(Boolean);
  return uniqueByKey(refs, (ref) => normalizeText(ref?.hash || ref?.moduleId || ref?.url || ref?.file));
}

function classifyAdapterSurfaces(adapterFeatures = {}) {
  if (isExplicitWebGPUCompatible(adapterFeatures)) return [];

  const surfaces = [];
  if (adapterFeatures.glslShaderMaterial || adapterFeatures.usesShaderMaterial) {
    surfaces.push({
      id: 'adapter.glsl-shader-material',
      source: 'adapter',
      runtimeFamily: 'scene-adapter',
      moduleType: null,
      materialType: 'ShaderMaterial',
      surfaceType: 'adapter-glsl-shader-material',
      compatibilityStatus: SHADER_COMPATIBILITY_STATUSES.WEBGL_ONLY,
      reason: 'glsl-shader-material'
    });
  }
  if (adapterFeatures.rawShaderMaterial) {
    surfaces.push({
      id: 'adapter.raw-shader-material',
      source: 'adapter',
      runtimeFamily: 'scene-adapter',
      moduleType: null,
      materialType: 'RawShaderMaterial',
      surfaceType: 'adapter-raw-shader-material',
      compatibilityStatus: SHADER_COMPATIBILITY_STATUSES.WEBGL_ONLY,
      reason: 'raw-shader-material'
    });
  }
  return surfaces;
}

export function classifyBuiltInShaderSurfaces(elements = []) {
  const surfaces = [];
  for (const element of arrayFrom(elements)) {
    const moduleType = normalizeText(element?.moduleType);
    if (!moduleType) continue;
    const shaderSurface = BUILT_IN_SHADER_MATERIAL_MODULES[moduleType];
    if (!shaderSurface) continue;
    surfaces.push({
      id: `built-in.${moduleType}`,
      source: 'built-in',
      runtimeFamily: shaderSurface.runtimeFamily,
      moduleType,
      materialType: shaderSurface.materialType,
      surfaceType: 'built-in-shader-material',
      compatibilityStatus: SHADER_COMPATIBILITY_STATUSES.WEBGL_ONLY,
      reason: 'built-in-shader-material'
    });
  }
  return uniqueByKey(surfaces, (surface) => surface.id);
}

function hasCustomGlslSource(spec = {}) {
  return Boolean(spec?.source?.glsl?.vertex || spec?.source?.glsl?.fragment);
}

function hasRichStructuredGeometrySurface(spec = {}) {
  const geometry = spec?.source?.dsl?.geometry;
  if (!hasStructuredGeometryDsl(geometry)) return false;
  const material = isObject(spec?.source?.dsl?.material) ? spec.source.dsl.material : {};
  const surface = isObject(material.surface) ? material.surface : {};
  return Object.entries(surface).some(([key, value]) => key !== 'flatness' && Number(value) > 0);
}

function customSurfaceReason(spec = {}) {
  if (hasCustomGlslSource(spec)) return 'custom-module-shader-surface';
  if (spec.family === 'shader') return 'custom-module-shader-surface';
  if (spec.kind === 'js') return 'custom-module-js-surface';
  if (spec.family === 'post') return 'custom-module-post-patch';
  if (hasRichStructuredGeometrySurface(spec)) return 'custom-module-shader-surface';
  return null;
}

export function classifyCustomModuleShaderSurfaces(customModules = []) {
  const contract = compileCustomModuleContract({
    customModules,
    baseModuleTypes: BUILT_IN_SCENE_MODULE_TYPES
  });
  const surfaces = [];

  for (const { spec, raw } of contract.acceptedSpecs || []) {
    const explicitWebGPU = isExplicitWebGPUCompatible(raw);
    const reason = explicitWebGPU ? null : customSurfaceReason(spec);
    if (!reason) continue;
    surfaces.push({
      id: `custom.${spec.id}`,
      source: 'custom-module',
      runtimeFamily: spec.family,
      moduleType: spec.id,
      materialType: hasCustomGlslSource(spec) || spec.family === 'shader' || hasRichStructuredGeometrySurface(spec)
        ? 'ShaderMaterial'
        : (spec.kind === 'js' ? 'custom-js' : 'pipeline-patch'),
      surfaceType: spec.kind === 'js' ? 'custom-js-module' : 'custom-module-shader-surface',
      compatibilityStatus: SHADER_COMPATIBILITY_STATUSES.WEBGL_ONLY,
      reason
    });
  }

  return surfaces;
}

function classifyImmersiveGeneratedModuleSurfaces(art = null) {
  const refs = collectImmersiveGeneratedModuleRefs(art);
  return refs
    .filter((ref) => String(ref?.type || '').trim() === 'immersive-world-generated-module')
    .filter((ref) => !isExplicitWebGPUCompatible(ref))
    .map((ref) => ({
      id: `immersive-generated.${normalizeText(ref.moduleId || ref.partId || ref.hash || ref.url) || 'unknown'}`,
      source: 'generated-module',
      runtimeFamily: 'immersive-world-generated',
      moduleType: normalizeText(ref.moduleId || ref.partId),
      materialType: 'generated-module',
      surfaceType: 'immersive-world-generated-module',
      compatibilityStatus: SHADER_COMPATIBILITY_STATUSES.WEBGL_ONLY,
      reason: 'generated-module-shader-surface'
    }));
}

function buildCounts(surfaces = []) {
  const counts = {
    total: surfaces.length,
    webglOnly: 0,
    shaderMaterial: 0,
    rawShaderMaterial: 0,
    customModuleShaderSurfaces: 0,
    generatedModuleSurfaces: 0,
    byRuntimeFamily: {}
  };

  for (const surface of surfaces) {
    if (surface.compatibilityStatus === SHADER_COMPATIBILITY_STATUSES.WEBGL_ONLY) counts.webglOnly += 1;
    if (surface.materialType === 'ShaderMaterial') counts.shaderMaterial += 1;
    if (surface.materialType === 'RawShaderMaterial') counts.rawShaderMaterial += 1;
    if (surface.source === 'custom-module') counts.customModuleShaderSurfaces += 1;
    if (surface.source === 'generated-module') counts.generatedModuleSurfaces += 1;
    const family = surface.runtimeFamily || 'unknown';
    counts.byRuntimeFamily[family] = (counts.byRuntimeFamily[family] || 0) + 1;
  }

  return counts;
}

function uniqueReasons(surfaces = []) {
  const reasons = [];
  const seen = new Set();
  for (const surface of surfaces) {
    const reason = normalizeText(surface.reason);
    if (!reason || seen.has(reason)) continue;
    seen.add(reason);
    reasons.push(reason);
  }
  return reasons;
}

export function classifySceneShaderCompatibility({
  art = null,
  sceneKind = null,
  elements = null,
  customModules = null,
  adapterFeatures = {}
} = {}) {
  const sceneElements = collectSceneElements(art, elements);
  const sceneCustomModules = collectSceneCustomModules(art, customModules);
  const surfaces = [
    ...classifyAdapterSurfaces(adapterFeatures),
    ...classifyBuiltInShaderSurfaces(sceneElements),
    ...classifyCustomModuleShaderSurfaces(sceneCustomModules),
    ...classifyImmersiveGeneratedModuleSurfaces(art)
  ];
  const unsupportedSurfaces = surfaces.filter(
    (surface) => surface.compatibilityStatus === SHADER_COMPATIBILITY_STATUSES.WEBGL_ONLY
  );
  const counts = buildCounts(surfaces);

  return {
    version: 1,
    sceneKind,
    moduleCatalogVersion: 1,
    builtInModuleCatalogSize: BUILT_IN_SCENE_MODULE_CATALOG.moduleTypes.length,
    webgpuCompatible: unsupportedSurfaces.length === 0,
    counts,
    hasGLSLShaderMaterial: counts.shaderMaterial > 0,
    hasRawShaderMaterial: counts.rawShaderMaterial > 0,
    customModuleShaderSurfaceCount: counts.customModuleShaderSurfaces,
    generatedModuleShaderSurfaceCount: counts.generatedModuleSurfaces,
    unsupportedWebGPUReasons: uniqueReasons(unsupportedSurfaces),
    surfaces,
    unsupportedSurfaces
  };
}
