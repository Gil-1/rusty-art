import { getWebGPUMaterialFactoryDescriptor } from './webgpu-material-factory-catalog.js';

export const WEBGPU_AUTHORING_MODES = Object.freeze({
  WEBGPU_PROJECT_SCENE: 'webgpu-project-scene',
  LEGACY_WEBGL_SCENE: 'legacy-webgl-scene',
  UNSPECIFIED: 'unspecified'
});

export const WEBGPU_AUTHORING_COMPATIBILITY_STATUSES = Object.freeze({
  WEBGPU_COMPATIBLE: 'webgpu-compatible',
  WEBGL_ONLY: 'webgl-only',
  CONTRADICTORY: 'contradictory',
  UNKNOWN: 'unknown'
});

export const WEBGPU_AUTHORING_FALLBACK_REASONS = Object.freeze({
  LEGACY_WEBGL_AUTHORING_MODE: 'legacy-webgl-authoring-mode',
  RAW_GLSL_SHADER_SURFACE: 'raw-glsl-shader-surface',
  RAW_SHADER_MATERIAL: 'raw-shader-material',
  SHADER_MATERIAL: 'shader-material',
  ON_BEFORE_COMPILE: 'on-before-compile',
  LEGACY_GLSL_POST_PASS: 'legacy-glsl-post-pass',
  CUSTOM_JS_SHADER_SURFACE: 'custom-js-shader-surface',
  GENERATED_MODULE_UNKNOWN: 'generated-module-unknown',
  TEXTURED_GEOMETRY_MISSING_UV: 'textured-geometry-missing-uv',
  POINTS_GEOMETRY_MISSING_UV: 'points-geometry-missing-uv',
  WEBGPU_EVIDENCE_MISSING: 'webgpu-evidence-missing'
});

export const WEBGPU_SAFE_MATERIAL_SURFACES = Object.freeze([
  'MeshBasicMaterial',
  'MeshStandardMaterial',
  'MeshPhysicalMaterial',
  'MeshLambertMaterial',
  'MeshMatcapMaterial',
  'MeshPhongMaterial',
  'PointsMaterial',
  'LineBasicMaterial',
  'LineDashedMaterial',
  'SpriteMaterial',
  'CanvasTexture',
  'DataTexture',
  'VideoTexture',
  'TSLNodeMaterial',
  'project-webgpu-material-factory'
]);

export const WEBGPU_FORBIDDEN_SHADER_SURFACES = Object.freeze([
  'ShaderMaterial',
  'RawShaderMaterial',
  'onBeforeCompile',
  'legacy-glsl-post-pass',
  'custom-js-shader-surface',
  'raw-glsl-source',
  'unknown-generated-module',
  'textured-geometry-missing-uv',
  'points-geometry-missing-uv'
]);

const WEBGPU_MODE_ALIASES = new Set([
  'webgpu',
  'webgpu-compatible',
  'webgpu-project',
  'webgpu-project-scene',
  'project-webgpu'
]);

const WEBGL_MODE_ALIASES = new Set([
  'webgl',
  'legacy',
  'legacy-webgl',
  'legacy-webgl-scene',
  'webgl-only'
]);

const WEBGPU_SAFE_MATERIAL_SET = new Set(WEBGPU_SAFE_MATERIAL_SURFACES.map((entry) => entry.toLowerCase()));

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function arrayFrom(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value, maxLen = 160) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, maxLen) : null;
}

function normalizeMaterialClass(value) {
  const text = normalizeText(value, 96);
  if (!text) return null;
  return text.replace(/^THREE\./i, '');
}

function isWebGPUSafeMaterialType(value) {
  const materialClass = normalizeMaterialClass(value);
  return materialClass ? WEBGPU_SAFE_MATERIAL_SET.has(materialClass.toLowerCase()) : false;
}

function normalizeModeToken(value) {
  return String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
}

function booleanFlag(value) {
  if (value === true) return true;
  const raw = normalizeModeToken(value);
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'webgpu-compatible';
}

function uniqueById(entries = []) {
  const seen = new Set();
  const out = [];
  for (const entry of entries) {
    const id = normalizeText(entry?.id, 240);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ ...entry, id });
  }
  return out;
}

function firstModeToken(...values) {
  for (const value of values) {
    const token = normalizeModeToken(value);
    if (token) return token;
  }
  return '';
}

export function normalizeWebGPUAuthoringMode(value = null) {
  const token = normalizeModeToken(value);
  if (WEBGPU_MODE_ALIASES.has(token)) return WEBGPU_AUTHORING_MODES.WEBGPU_PROJECT_SCENE;
  if (WEBGL_MODE_ALIASES.has(token)) return WEBGPU_AUTHORING_MODES.LEGACY_WEBGL_SCENE;
  return WEBGPU_AUTHORING_MODES.UNSPECIFIED;
}

export function isExplicitWebGPUAuthoringClaim(value = {}) {
  if (!isObject(value)) return false;
  return normalizeWebGPUAuthoringMode(firstModeToken(
    value.authoringMode,
    value.rendererTarget,
    value.renderingMode,
    value.targetMode,
    value.sceneAuthoring?.authoringMode,
    value.sceneAuthoring?.rendererTarget,
    value.scene?.authoringMode,
    value.scene?.rendererTarget,
    value.scene?.sceneAuthoring?.authoringMode,
    value.scene?.sceneAuthoring?.rendererTarget
  )) === WEBGPU_AUTHORING_MODES.WEBGPU_PROJECT_SCENE
    || booleanFlag(value.webgpuCompatible)
    || booleanFlag(value.rendererCompatibility?.webgpu)
    || booleanFlag(value.compatibility?.webgpu)
    || booleanFlag(value.runtimeCompatibility?.webgpu)
    || booleanFlag(value.sceneAuthoring?.rendererCompatibility?.webgpu)
    || booleanFlag(value.scene?.sceneAuthoring?.rendererCompatibility?.webgpu);
}

function collectTargetMode(source = {}, targetMode = null) {
  const explicitMode = normalizeWebGPUAuthoringMode(targetMode);
  if (explicitMode !== WEBGPU_AUTHORING_MODES.UNSPECIFIED) return explicitMode;
  const mode = normalizeWebGPUAuthoringMode(firstModeToken(
    source?.authoringMode,
    source?.rendererTarget,
    source?.renderingMode,
    source?.sceneAuthoring?.authoringMode,
    source?.sceneAuthoring?.rendererTarget,
    source?.scene?.authoringMode,
    source?.scene?.rendererTarget,
    source?.scene?.sceneAuthoring?.authoringMode,
    source?.scene?.sceneAuthoring?.rendererTarget
  ));
  if (mode !== WEBGPU_AUTHORING_MODES.UNSPECIFIED) return mode;
  if (isExplicitWebGPUAuthoringClaim(source)) return WEBGPU_AUTHORING_MODES.WEBGPU_PROJECT_SCENE;
  return mode;
}

function hasRawGlslSource(value = {}) {
  return Boolean(
    value?.source?.glsl?.vertex
    || value?.source?.glsl?.fragment
    || value?.glsl?.vertex
    || value?.glsl?.fragment
    || value?.vertexShader
    || value?.fragmentShader
  );
}

function collectForbiddenFromSurface(surface = {}, index = 0) {
  const materialType = normalizeMaterialClass(surface.materialType || surface.material || surface.type);
  const surfaceType = normalizeMaterialClass(surface.surfaceType || surface.kind);
  const reasons = [];
  if (materialType === 'ShaderMaterial' || surfaceType === 'ShaderMaterial') {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.SHADER_MATERIAL);
  }
  if (materialType === 'RawShaderMaterial' || surfaceType === 'RawShaderMaterial') {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.RAW_SHADER_MATERIAL);
  }
  if (hasRawGlslSource(surface) || surfaceType === 'raw-glsl-source') {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.RAW_GLSL_SHADER_SURFACE);
  }
  if (surface.onBeforeCompile === true || surfaceType === 'onBeforeCompile') {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.ON_BEFORE_COMPILE);
  }
  if (surface.legacyGlslPostPass === true || surfaceType === 'legacy-glsl-post-pass') {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.LEGACY_GLSL_POST_PASS);
  }
  if (surface.customJsShaderSurface === true || surfaceType === 'custom-js-shader-surface') {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.CUSTOM_JS_SHADER_SURFACE);
  }
  if (surface.unknownGeneratedModule === true || surfaceType === 'unknown-generated-module') {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.GENERATED_MODULE_UNKNOWN);
  }
  if (surface.texturedGeometryMissingUv === true || surfaceType === 'textured-geometry-missing-uv') {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.TEXTURED_GEOMETRY_MISSING_UV);
  }
  return reasons.map((reason, reasonIndex) => ({
    id: `surface.${index + 1}.${reasonIndex + 1}.${reason}`,
    source: 'surface',
    reason,
    materialType,
    surfaceType
  }));
}

function collectCompatibleFromSurface(surface = {}, index = 0) {
  const materialType = normalizeMaterialClass(surface.materialType || surface.material || surface.type);
  const factoryId = normalizeText(surface.factoryId || surface.webgpuMaterialFactory || surface.materialFactoryId, 96);
  const factoryDescriptor = factoryId ? getWebGPUMaterialFactoryDescriptor(factoryId) : null;
  const registeredWebGPUFactory = factoryDescriptor?.compatibility?.webgpu === true;
  if (registeredWebGPUFactory || isWebGPUSafeMaterialType(materialType)) {
    return [{
      id: `surface.${index + 1}.compatible`,
      source: 'surface',
      reason: registeredWebGPUFactory
        ? 'project-webgpu-material-factory'
        : 'webgpu-safe-material',
      materialType,
      factoryId,
      factoryCategory: factoryDescriptor?.category || null,
      factoryCompatibility: factoryDescriptor?.compatibility || null,
      factoryOutput: factoryDescriptor?.output || null
    }];
  }
  return [];
}

function collectForbiddenFromCustomModule(module = {}, index = 0) {
  const family = normalizeModeToken(module.family);
  const kind = normalizeModeToken(module.kind);
  const dslMaterial = isObject(module?.source?.dsl?.material) ? module.source.dsl.material : {};
  const materialType = normalizeMaterialClass(
    module.materialType
    || module.material
    || dslMaterial.materialType
    || dslMaterial.type
  );
  const rawGlslSource = hasRawGlslSource(module);
  const reasons = [];
  if (rawGlslSource) reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.RAW_GLSL_SHADER_SURFACE);
  if (materialType === 'ShaderMaterial' || (family === 'shader' && rawGlslSource)) {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.SHADER_MATERIAL);
  }
  if (materialType === 'RawShaderMaterial') {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.RAW_SHADER_MATERIAL);
  }
  if (module.texturedGeometryMissingUv === true || kind === 'textured-geometry-missing-uv') {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.TEXTURED_GEOMETRY_MISSING_UV);
  }
  if (kind === 'js' || module?.source?.js) reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.CUSTOM_JS_SHADER_SURFACE);
  if (family === 'post' && (module?.source?.glsl || module?.glsl)) {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.LEGACY_GLSL_POST_PASS);
  }
  return [...new Set(reasons)].map((reason) => ({
    id: `customModule.${normalizeText(module.id, 80) || index + 1}.${reason}`,
    source: 'custom-module',
    reason,
    moduleId: normalizeText(module.id, 80),
    family: normalizeText(module.family, 40),
    kind: normalizeText(module.kind, 40),
    materialType
  }));
}

function collectForbiddenFromModuleOverride(moduleOverride = {}, index = 0) {
  const reasons = [];
  if (hasRawGlslSource(moduleOverride)) {
    reasons.push(WEBGPU_AUTHORING_FALLBACK_REASONS.RAW_GLSL_SHADER_SURFACE);
  }
  return [...new Set(reasons)].map((reason) => ({
    id: `moduleOverride.${normalizeText(moduleOverride.id, 80) || index + 1}.${reason}`,
    source: 'module-override',
    reason,
    moduleOverrideId: normalizeText(moduleOverride.id, 80),
    targetModuleType: normalizeText(moduleOverride.target?.moduleType || moduleOverride.moduleType, 80),
    targetElementId: normalizeText(moduleOverride.target?.elementId || moduleOverride.elementId, 80)
  }));
}

function collectCompatibleFromCustomModule(module = {}, index = 0) {
  const dsl = isObject(module?.source?.dsl) ? module.source.dsl : {};
  const material = isObject(dsl.material) ? dsl.material : {};
  const factoryId = normalizeText(
    module.webgpuMaterialFactory
    || module.materialFactoryId
    || dsl.webgpuMaterialFactory
    || material.factoryId,
    96
  );
  const factoryDescriptor = factoryId ? getWebGPUMaterialFactoryDescriptor(factoryId) : null;
  const registeredWebGPUFactory = factoryDescriptor?.compatibility?.webgpu === true;
  const materialType = normalizeMaterialClass(
    module.materialType
    || module.material
    || material.materialType
    || material.type
  );
  const compatible = registeredWebGPUFactory || isWebGPUSafeMaterialType(materialType);
  if (!compatible) return [];
  return [{
    id: `customModule.${normalizeText(module.id, 80) || index + 1}.compatible`,
    source: 'custom-module',
    reason: registeredWebGPUFactory ? 'project-webgpu-material-factory' : 'webgpu-safe-material',
    moduleId: normalizeText(module.id, 80),
    factoryId,
    factoryCategory: factoryDescriptor?.category || null,
    factoryCompatibility: factoryDescriptor?.compatibility || null,
    factoryOutput: factoryDescriptor?.output || null,
    materialType
  }];
}

function collectForbiddenFromElement(element = {}, index = 0) {
  const material = element.material || element.params?.material || {};
  const materialType = normalizeText(material.materialType || material.type || element.materialType, 96);
  return collectForbiddenFromSurface({
    ...material,
    materialType,
    surfaceType: element.surfaceType,
    source: element
  }, index).map((entry) => ({
    ...entry,
    id: `element.${normalizeText(element.id, 80) || index + 1}.${entry.reason}`,
    source: 'element',
    elementId: normalizeText(element.id, 80),
    moduleType: normalizeText(element.moduleType, 80)
  }));
}

function collectCompatibleFromElement(element = {}, index = 0) {
  const material = element.material || element.params?.material || {};
  return collectCompatibleFromSurface({
    ...material,
    materialType: material.materialType || material.type || element.materialType,
    factoryId: element.webgpuMaterialFactory
      || element.materialFactoryId
      || element.params?.webgpuMaterialFactory
      || element.params?.materialFactoryId,
    webgpuCompatible: element.webgpuCompatible,
    rendererCompatibility: element.rendererCompatibility
  }, index).map((entry) => ({
    ...entry,
    id: `element.${normalizeText(element.id, 80) || index + 1}.compatible`,
    source: 'element',
    elementId: normalizeText(element.id, 80),
    moduleType: normalizeText(element.moduleType, 80)
  }));
}

function collectSurfaces({ scene = null, elements = null, customModules = null, moduleOverrides = null, materialSurfaces = null } = {}) {
  const sceneElements = [
    ...arrayFrom(elements),
    ...arrayFrom(scene?.elements),
    ...arrayFrom(scene?.scene?.elements),
    ...arrayFrom(scene?.representation?.elements),
    ...arrayFrom(scene?.scene?.representation?.elements)
  ];
  const sceneCustomModules = [
    ...arrayFrom(customModules),
    ...arrayFrom(scene?.sceneAuthoring?.customModules),
    ...arrayFrom(scene?.scene?.sceneAuthoring?.customModules),
    ...arrayFrom(scene?.scene?.customModules)
  ];
  const sceneModuleOverrides = [
    ...arrayFrom(moduleOverrides),
    ...arrayFrom(scene?.sceneAuthoring?.moduleOverrides),
    ...arrayFrom(scene?.scene?.sceneAuthoring?.moduleOverrides),
    ...arrayFrom(scene?.scene?.moduleOverrides)
  ];
  const declaredSurfaces = [
    ...arrayFrom(materialSurfaces),
    ...arrayFrom(scene?.sceneAuthoring?.materialSurfaces),
    ...arrayFrom(scene?.scene?.sceneAuthoring?.materialSurfaces)
  ];

  const forbiddenSurfaces = uniqueById([
    ...declaredSurfaces.flatMap(collectForbiddenFromSurface),
    ...sceneElements.flatMap(collectForbiddenFromElement),
    ...sceneCustomModules.flatMap(collectForbiddenFromCustomModule),
    ...sceneModuleOverrides.flatMap(collectForbiddenFromModuleOverride)
  ]);
  const compatibleSurfaces = uniqueById([
    ...declaredSurfaces.flatMap(collectCompatibleFromSurface),
    ...sceneElements.flatMap(collectCompatibleFromElement),
    ...sceneCustomModules.flatMap(collectCompatibleFromCustomModule)
  ]);

  return { forbiddenSurfaces, compatibleSurfaces };
}

function uniqueReasons(surfaces = []) {
  return [...new Set(surfaces.map((surface) => surface.reason).filter(Boolean))];
}

export function buildWebGPUProjectSceneAuthoringNotes() {
  return [
    'A WebGPU project scene is authored for WebGPURenderer with a WebGPU backend when the browser supports it.',
    'Use standard Three.js materials, TSL/node-material composition, WebGPU-safe textures, and project WebGPU material factories.',
    'Do not emit ShaderMaterial, RawShaderMaterial, onBeforeCompile shader patches, legacy GLSL post passes, or prose-only shader descriptions for a WebGPU project scene.',
    'Raw GLSL custom modules remain supported only as intentional legacy WebGL scene surfaces.',
    'Compatibility is evidence-backed: a scene is WebGPU-compatible only when its surfaces are known WebGPU-safe or built through project factories marked compatible.'
  ];
}

export function evaluateWebGPUSceneAuthoringPolicy({
  scene = null,
  elements = null,
  customModules = null,
  moduleOverrides = null,
  materialSurfaces = null,
  targetMode = null
} = {}) {
  const mode = collectTargetMode(scene || {}, targetMode);
  const { forbiddenSurfaces, compatibleSurfaces } = collectSurfaces({
    scene,
    elements,
    customModules,
    moduleOverrides,
    materialSurfaces
  });
  const fallbackReasons = uniqueReasons(forbiddenSurfaces);
  const evidenceReasons = uniqueReasons(compatibleSurfaces);

  let compatibilityStatus = /** @type {string} */ (WEBGPU_AUTHORING_COMPATIBILITY_STATUSES.UNKNOWN);
  let fallbackReason = null;
  if (mode === WEBGPU_AUTHORING_MODES.LEGACY_WEBGL_SCENE) {
    compatibilityStatus = WEBGPU_AUTHORING_COMPATIBILITY_STATUSES.WEBGL_ONLY;
    fallbackReason = WEBGPU_AUTHORING_FALLBACK_REASONS.LEGACY_WEBGL_AUTHORING_MODE;
  } else if (forbiddenSurfaces.length) {
    compatibilityStatus = mode === WEBGPU_AUTHORING_MODES.WEBGPU_PROJECT_SCENE
      ? WEBGPU_AUTHORING_COMPATIBILITY_STATUSES.CONTRADICTORY
      : WEBGPU_AUTHORING_COMPATIBILITY_STATUSES.WEBGL_ONLY;
    fallbackReason = fallbackReasons[0] || WEBGPU_AUTHORING_FALLBACK_REASONS.RAW_GLSL_SHADER_SURFACE;
  } else if (mode === WEBGPU_AUTHORING_MODES.WEBGPU_PROJECT_SCENE && !compatibleSurfaces.length) {
    compatibilityStatus = WEBGPU_AUTHORING_COMPATIBILITY_STATUSES.UNKNOWN;
    fallbackReason = WEBGPU_AUTHORING_FALLBACK_REASONS.WEBGPU_EVIDENCE_MISSING;
  } else if (compatibleSurfaces.length) {
    compatibilityStatus = WEBGPU_AUTHORING_COMPATIBILITY_STATUSES.WEBGPU_COMPATIBLE;
  }

  return {
    version: 1,
    targetMode: mode,
    compatibilityStatus,
    webgpuCompatible: compatibilityStatus === WEBGPU_AUTHORING_COMPATIBILITY_STATUSES.WEBGPU_COMPATIBLE,
    fallbackReason,
    fallbackReasons,
    evidenceReasons,
    compatibleSurfaces,
    forbiddenSurfaces,
    allowedSurfaces: WEBGPU_SAFE_MATERIAL_SURFACES.slice(),
    forbiddenSurfaceTypes: WEBGPU_FORBIDDEN_SHADER_SURFACES.slice(),
    agentNotes: buildWebGPUProjectSceneAuthoringNotes()
  };
}
