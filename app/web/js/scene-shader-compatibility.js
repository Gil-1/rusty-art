import {
  compileCustomModuleContract,
  hasStructuredGeometryDsl
} from './contracts/custom-module-compiler-contract.js';
import {
  BUILT_IN_SCENE_MODULE_CATALOG,
  BUILT_IN_SCENE_MODULE_TYPES
} from './contracts/runtime-module-catalog.js';
import { getWebGPUMaterialFactoryDescriptor } from './contracts/webgpu-material-factory-catalog.js';
import {
  WEBGPU_SAFE_MATERIAL_SURFACES,
  isExplicitWebGPUAuthoringClaim
} from './contracts/webgpu-scene-authoring-policy.js';

export const SHADER_COMPATIBILITY_STATUSES = Object.freeze({
  WEBGPU_COMPATIBLE: 'webgpu-compatible',
  WEBGL_ONLY: 'webgl-only',
  NO_SHADER_SURFACE: 'no-shader-surface'
});

const WEBGPU_EVIDENCE_REASONS = Object.freeze({
  PROJECT_FACTORY: 'project-webgpu-material-factory',
  SAFE_MATERIAL: 'webgpu-safe-material',
  EXPLICIT_COMPATIBLE: 'explicit-webgpu-compatible',
  DECLARATIVE_DESCRIPTOR: 'declarative-material-descriptor'
});

const WEBGPU_FALLBACK_REASONS = Object.freeze({
  EVIDENCE_MISSING: 'webgpu-evidence-missing',
  UNKNOWN_FACTORY: 'unknown-webgpu-material-factory'
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

const WEBGPU_SAFE_MATERIAL_SET = new Set(
  WEBGPU_SAFE_MATERIAL_SURFACES.map((surface) => String(surface).trim().toLowerCase())
);

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

function hasWebGPUAdapterEvidence(adapterFeatures = {}) {
  return booleanFlag(adapterFeatures?.webgpuCompatible);
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
    || booleanFlag(value?.rendererCompatibility?.webgpuCompatible)
    || booleanFlag(value?.compatibility?.webgpu)
    || booleanFlag(value?.runtimeCompatibility?.webgpu)
    || normalizeText(value?.compatibilityStatus) === 'webgpu-compatible'
    || normalizeText(value?.rendererCompatibility?.compatibilityStatus) === 'webgpu-compatible';
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

export function collectSceneMaterialSurfaces(art = null, explicitMaterialSurfaces = null) {
  return [
    ...arrayFrom(explicitMaterialSurfaces),
    ...arrayFrom(art?.sceneAuthoring?.materialSurfaces),
    ...arrayFrom(art?.scene?.sceneAuthoring?.materialSurfaces),
    ...arrayFrom(art?.scene?.materialSurfaces),
    ...arrayFrom(art?.materialSurfaces)
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

function materialTypeFrom(value = {}) {
  const material = isObject(value?.material) ? value.material : {};
  const paramsMaterial = isObject(value?.params?.material) ? value.params.material : {};
  return normalizeText(
    value?.materialType
    || value?.material
    || value?.type
    || material.materialType
    || material.type
    || paramsMaterial.materialType
    || paramsMaterial.type
  );
}

function factoryIdFrom(value = {}) {
  const material = isObject(value?.material) ? value.material : {};
  const params = isObject(value?.params) ? value.params : {};
  const paramsMaterial = isObject(params.material) ? params.material : {};
  const dsl = isObject(value?.source?.dsl) ? value.source.dsl : {};
  const dslMaterial = isObject(dsl.material) ? dsl.material : {};
  return normalizeText(
    value?.webgpuMaterialFactory
    || value?.materialFactoryId
    || value?.factoryId
    || material.webgpuMaterialFactory
    || material.materialFactoryId
    || material.factoryId
    || params.webgpuMaterialFactory
    || params.materialFactoryId
    || params.factoryId
    || paramsMaterial.webgpuMaterialFactory
    || paramsMaterial.materialFactoryId
    || paramsMaterial.factoryId
    || dsl.webgpuMaterialFactory
    || dsl.materialFactoryId
    || dsl.factoryId
    || dslMaterial.webgpuMaterialFactory
    || dslMaterial.materialFactoryId
    || dslMaterial.factoryId
  );
}

function webGPUFactoryDescriptor(factoryId) {
  return factoryId ? getWebGPUMaterialFactoryDescriptor(factoryId) : null;
}

function isKnownWebGPUFactory(factoryId) {
  return webGPUFactoryDescriptor(factoryId)?.compatibility?.webgpu === true;
}

function hasSafeMaterialType(materialType) {
  return WEBGPU_SAFE_MATERIAL_SET.has(String(materialType || '').trim().toLowerCase());
}

function hasExplicitSurfaceWebGPUClaim(value = {}) {
  return booleanFlag(value?.webgpuCompatible)
    || booleanFlag(value?.rendererCompatibility?.webgpu)
    || booleanFlag(value?.compatibility?.webgpu)
    || booleanFlag(value?.runtimeCompatibility?.webgpu);
}

function evidenceValuesFrom(value = {}) {
  return [
    value?.rendererCompatibility?.evidence,
    value?.rendererCompatibility?.evidenceReasons,
    value?.compatibility?.evidence,
    value?.runtimeCompatibility?.evidence,
    value?.evidence
  ].flatMap((entry) => Array.isArray(entry) ? entry : [entry]);
}

function hasRecognizedWebGPUEvidence(value = {}) {
  return evidenceValuesFrom(value).some((entry) => {
    const normalized = String(entry || '').trim().toLowerCase();
    return normalized === WEBGPU_EVIDENCE_REASONS.PROJECT_FACTORY
      || normalized === WEBGPU_EVIDENCE_REASONS.DECLARATIVE_DESCRIPTOR
      || normalized === 'no-raw-glsl'
      || normalized === 'tsl-node-material'
      || normalized === 'webgpu-safe-material';
  });
}

function compatibleSurfaceEntry({
  id,
  source,
  runtimeFamily = null,
  moduleType = null,
  materialType = null,
  surfaceType = 'webgpu-compatible-surface',
  reason,
  factoryId = null
} = {}) {
  const factoryDescriptor = webGPUFactoryDescriptor(factoryId);
  return {
    id,
    source,
    runtimeFamily,
    moduleType,
    materialType,
    surfaceType,
    compatibilityStatus: SHADER_COMPATIBILITY_STATUSES.WEBGPU_COMPATIBLE,
    reason,
    factoryId,
    factoryCategory: factoryDescriptor?.category || null,
    factoryCompatibility: factoryDescriptor?.compatibility || null
  };
}

function unsupportedEvidenceEntry({
  id,
  source,
  runtimeFamily = null,
  moduleType = null,
  materialType = null,
  surfaceType = 'webgpu-evidence',
  reason,
  factoryId = null
} = {}) {
  return {
    id,
    source,
    runtimeFamily,
    moduleType,
    materialType,
    surfaceType,
    compatibilityStatus: SHADER_COMPATIBILITY_STATUSES.WEBGL_ONLY,
    reason,
    factoryId
  };
}

function classifyCompatibleSurface(value = {}, {
  id,
  source,
  runtimeFamily = null,
  moduleType = null,
  requireExplicitClaim = false
} = {}) {
  const factoryId = factoryIdFrom(value);
  const materialType = materialTypeFrom(value);
  if (isKnownWebGPUFactory(factoryId)) {
    return compatibleSurfaceEntry({
      id,
      source,
      runtimeFamily,
      moduleType,
      materialType,
      surfaceType: 'project-webgpu-material-factory',
      reason: WEBGPU_EVIDENCE_REASONS.PROJECT_FACTORY,
      factoryId
    });
  }
  if (requireExplicitClaim && !hasExplicitSurfaceWebGPUClaim(value)) return null;
  if (hasSafeMaterialType(materialType)) {
    return compatibleSurfaceEntry({
      id,
      source,
      runtimeFamily,
      moduleType,
      materialType,
      surfaceType: 'webgpu-safe-material',
      reason: WEBGPU_EVIDENCE_REASONS.SAFE_MATERIAL
    });
  }
  if (hasExplicitSurfaceWebGPUClaim(value) && !factoryId) {
    return compatibleSurfaceEntry({
      id,
      source,
      runtimeFamily,
      moduleType,
      materialType,
      surfaceType: 'explicit-webgpu-compatible',
      reason: WEBGPU_EVIDENCE_REASONS.EXPLICIT_COMPATIBLE
    });
  }
  return null;
}

function classifyUnknownFactorySurface(value = {}, {
  id,
  source,
  runtimeFamily = null,
  moduleType = null
} = {}) {
  const factoryId = factoryIdFrom(value);
  if (!factoryId || isKnownWebGPUFactory(factoryId)) return null;
  return unsupportedEvidenceEntry({
    id,
    source,
    runtimeFamily,
    moduleType,
    materialType: materialTypeFrom(value),
    surfaceType: 'unknown-webgpu-material-factory',
    reason: WEBGPU_FALLBACK_REASONS.UNKNOWN_FACTORY,
    factoryId
  });
}

function classifyWebGPUCompatibleMaterialSurfaces(materialSurfaces = []) {
  return arrayFrom(materialSurfaces)
    .map((surface, index) => classifyCompatibleSurface(surface, {
      id: `material-surface.${normalizeText(surface?.id) || index + 1}.compatible`,
      source: 'material-surface'
    }))
    .filter(Boolean);
}

function classifyWebGPUCompatibleElementSurfaces(elements = []) {
  return arrayFrom(elements)
    .map((element, index) => classifyCompatibleSurface(element, {
      id: `element.${normalizeText(element?.id) || index + 1}.compatible`,
      source: 'element',
      moduleType: normalizeText(element?.moduleType),
      requireExplicitClaim: true
    }))
    .filter(Boolean);
}

function classifyWebGPUCompatibleCustomModuleSurfaces(customModules = []) {
  return arrayFrom(customModules)
    .map((module, index) => classifyCompatibleSurface(module, {
      id: `custom.${normalizeText(module?.id) || index + 1}.compatible`,
      source: 'custom-module',
      runtimeFamily: normalizeText(module?.family),
      moduleType: normalizeText(module?.id),
      requireExplicitClaim: true
    }))
    .filter(Boolean);
}

function classifyUnknownWebGPUEvidenceSurfaces({ elements = [], customModules = [], materialSurfaces = [] } = {}) {
  return [
    ...arrayFrom(materialSurfaces).map((surface, index) => classifyUnknownFactorySurface(surface, {
      id: `material-surface.${normalizeText(surface?.id) || index + 1}.unknown-factory`,
      source: 'material-surface'
    })),
    ...arrayFrom(elements).map((element, index) => classifyUnknownFactorySurface(element, {
      id: `element.${normalizeText(element?.id) || index + 1}.unknown-factory`,
      source: 'element',
      moduleType: normalizeText(element?.moduleType)
    })),
    ...arrayFrom(customModules).map((module, index) => classifyUnknownFactorySurface(module, {
      id: `custom.${normalizeText(module?.id) || index + 1}.unknown-factory`,
      source: 'custom-module',
      runtimeFamily: normalizeText(module?.family),
      moduleType: normalizeText(module?.id)
    }))
  ].filter(Boolean);
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

  for (const { spec } of contract.acceptedSpecs || []) {
    const reason = customSurfaceReason(spec);
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
    .filter((ref) => !hasGeneratedModuleWebGPUEvidence(ref))
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

function classifyCompatibleImmersiveGeneratedModuleSurfaces(art = null) {
  const refs = collectImmersiveGeneratedModuleRefs(art);
  return refs
    .filter((ref) => String(ref?.type || '').trim() === 'immersive-world-generated-module')
    .filter(hasGeneratedModuleWebGPUEvidence)
    .map((ref) => {
      const factoryId = factoryIdFrom(ref);
      return compatibleSurfaceEntry({
        id: `immersive-generated.${normalizeText(ref.moduleId || ref.partId || ref.hash || ref.url) || 'unknown'}.compatible`,
        source: 'generated-module',
        runtimeFamily: 'immersive-world-generated',
        moduleType: normalizeText(ref.moduleId || ref.partId),
        materialType: 'generated-module',
        surfaceType: 'immersive-world-generated-module',
        reason: isKnownWebGPUFactory(factoryId)
          ? WEBGPU_EVIDENCE_REASONS.PROJECT_FACTORY
          : WEBGPU_EVIDENCE_REASONS.DECLARATIVE_DESCRIPTOR,
        factoryId: isKnownWebGPUFactory(factoryId) ? factoryId : null
      });
    });
}

function hasGeneratedModuleWebGPUEvidence(ref = {}) {
  if (!isExplicitWebGPUCompatible(ref)) return false;
  const factoryId = factoryIdFrom(ref);
  if (factoryId) return isKnownWebGPUFactory(factoryId);
  return hasRecognizedWebGPUEvidence(ref);
}

function buildCounts(surfaces = []) {
  const counts = {
    total: surfaces.length,
    webgpuCompatible: 0,
    webglOnly: 0,
    shaderMaterial: 0,
    rawShaderMaterial: 0,
    customModuleShaderSurfaces: 0,
    generatedModuleSurfaces: 0,
    byRuntimeFamily: {}
  };

  for (const surface of surfaces) {
    if (surface.compatibilityStatus === SHADER_COMPATIBILITY_STATUSES.WEBGPU_COMPATIBLE) counts.webgpuCompatible += 1;
    if (surface.compatibilityStatus === SHADER_COMPATIBILITY_STATUSES.WEBGL_ONLY) counts.webglOnly += 1;
    if (surface.materialType === 'ShaderMaterial') counts.shaderMaterial += 1;
    if (surface.materialType === 'RawShaderMaterial') counts.rawShaderMaterial += 1;
    if (surface.source === 'custom-module' && surface.compatibilityStatus === SHADER_COMPATIBILITY_STATUSES.WEBGL_ONLY) {
      counts.customModuleShaderSurfaces += 1;
    }
    if (surface.source === 'generated-module' && surface.compatibilityStatus === SHADER_COMPATIBILITY_STATUSES.WEBGL_ONLY) {
      counts.generatedModuleSurfaces += 1;
    }
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
  materialSurfaces = null,
  adapterFeatures = {}
} = {}) {
  const sceneElements = collectSceneElements(art, elements);
  const sceneCustomModules = collectSceneCustomModules(art, customModules);
  const sceneMaterialSurfaces = collectSceneMaterialSurfaces(art, materialSurfaces);
  const compatibleSurfaces = uniqueByKey([
    ...classifyWebGPUCompatibleMaterialSurfaces(sceneMaterialSurfaces),
    ...classifyWebGPUCompatibleElementSurfaces(sceneElements),
    ...classifyWebGPUCompatibleCustomModuleSurfaces(sceneCustomModules),
    ...classifyCompatibleImmersiveGeneratedModuleSurfaces(art)
  ], (surface) => surface.id);
  const explicitWebGPUClaim = isExplicitWebGPUAuthoringClaim(art || {})
    || isExplicitWebGPUCompatible(art || {});
  const hasCompatibleEvidence = compatibleSurfaces.length > 0 || hasWebGPUAdapterEvidence(adapterFeatures);
  const surfaces = [
    ...classifyAdapterSurfaces(adapterFeatures),
    ...classifyBuiltInShaderSurfaces(sceneElements),
    ...classifyCustomModuleShaderSurfaces(sceneCustomModules),
    ...classifyImmersiveGeneratedModuleSurfaces(art),
    ...classifyUnknownWebGPUEvidenceSurfaces({
      elements: sceneElements,
      customModules: sceneCustomModules,
      materialSurfaces: sceneMaterialSurfaces
    })
  ];
  if (surfaces.length === 0 && explicitWebGPUClaim && !hasCompatibleEvidence) {
    surfaces.push(unsupportedEvidenceEntry({
      id: 'scene.webgpu-evidence-missing',
      source: 'scene-authoring',
      runtimeFamily: sceneKind,
      surfaceType: 'webgpu-authoring-claim',
      reason: WEBGPU_FALLBACK_REASONS.EVIDENCE_MISSING
    }));
  }
  const unsupportedSurfaces = surfaces.filter(
    (surface) => surface.compatibilityStatus === SHADER_COMPATIBILITY_STATUSES.WEBGL_ONLY
  );
  const counts = buildCounts([...compatibleSurfaces, ...surfaces]);

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
    evidenceReasons: uniqueReasons(compatibleSurfaces),
    compatibleSurfaces,
    surfaces,
    unsupportedSurfaces
  };
}
