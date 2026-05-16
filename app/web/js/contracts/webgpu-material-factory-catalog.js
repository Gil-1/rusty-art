export const WEBGPU_MATERIAL_FACTORY_CATALOG_VERSION = 1;

export const WEBGPU_MATERIAL_FACTORY_CATEGORIES = Object.freeze({
  MATTE_PAINTED_SURFACE: 'matte-painted-surface',
  COLOR_FIELD: 'color-field',
  PROCEDURAL_MARKS: 'procedural-marks',
  SOFT_PARTICLES: 'soft-particles',
  SKY_BACKGROUND_FIELD: 'sky-background-field',
  TEXTURE_SURFACE: 'texture-surface',
  POST_COLOR_TRANSFORM: 'post-color-transform'
});

const COMMON_WEBGPU_COMPATIBILITY = Object.freeze({
  webgpu: true,
  webgl: true,
  status: 'webgpu-compatible',
  rendererFamilies: Object.freeze(['webgpu-renderer', 'webgl-renderer']),
  evidence: Object.freeze([
    'project-webgpu-material-factory',
    'declarative-material-descriptor',
    'no-raw-glsl'
  ]),
  gpuDeviceRequiredForInspection: false,
  webglOnly: false
});

const WEBGL_ONLY_FORBIDDEN_SURFACES = Object.freeze([
  'ShaderMaterial',
  'RawShaderMaterial',
  'onBeforeCompile',
  'legacy-glsl-post-pass',
  'custom-js-shader-surface',
  'raw-glsl-source'
]);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const entry of Object.values(value)) deepFreeze(entry);
  return value;
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function descriptor({
  id,
  category,
  label,
  description,
  output,
  requiredInputs = [],
  optionalInputs = [],
  guidance = []
}) {
  return deepFreeze({
    id,
    version: WEBGPU_MATERIAL_FACTORY_CATALOG_VERSION,
    category,
    label,
    description,
    factoryKind: 'declarative-material-descriptor',
    authoringSurface: 'project-webgpu-material-factory',
    runtimeSurface: output.runtimeSurface,
    output,
    compatibility: COMMON_WEBGPU_COMPATIBILITY,
    forbiddenSurfaces: WEBGL_ONLY_FORBIDDEN_SURFACES,
    requiredInputs,
    optionalInputs,
    guidance
  });
}

const WEBGPU_MATERIAL_FACTORY_DESCRIPTORS = deepFreeze([
  descriptor({
    id: 'matte-painted-surface',
    category: WEBGPU_MATERIAL_FACTORY_CATEGORIES.MATTE_PAINTED_SURFACE,
    label: 'Matte Painted Surface',
    description: 'A rough frontal paint, paper, or prepared-panel material described without custom shader code.',
    output: {
      runtimeSurface: 'three-standard-material',
      materialType: 'MeshStandardMaterial',
      textureTypes: ['CanvasTexture', 'DataTexture'],
      colorSpace: 'srgb',
      transparency: 'optional-alpha',
      proceduralInputs: ['grain', 'wash', 'roughness', 'opacityLayering']
    },
    requiredInputs: ['palette'],
    optionalInputs: ['grain', 'wash', 'roughness', 'stain', 'opacityLayering'],
    guidance: [
      'Use for painted, paper, canvas, ink wash, graphite, stain, and transfer surfaces.',
      'Represent texture through declarative surface controls and WebGPU-safe texture descriptors.'
    ]
  }),
  descriptor({
    id: 'color-field',
    category: WEBGPU_MATERIAL_FACTORY_CATEGORIES.COLOR_FIELD,
    label: 'Color Field',
    description: 'A large field, band, ramp, or hard-edged color plane using standard material/color attributes.',
    output: {
      runtimeSurface: 'three-basic-or-standard-material',
      materialType: 'MeshBasicMaterial',
      textureTypes: ['CanvasTexture', 'DataTexture'],
      colorSpace: 'srgb',
      transparency: 'optional-alpha',
      proceduralInputs: ['colorRamp', 'edgeSoftness', 'banding', 'opacity']
    },
    requiredInputs: ['colorRamp'],
    optionalInputs: ['edgeSoftness', 'banding', 'blend', 'opacity'],
    guidance: [
      'Use for all-over color fields, hard-edged planes, atmospheric bands, and flat graphic fields.',
      'Prefer geometry layers or declarative texture descriptors over GLSL gradients.'
    ]
  }),
  descriptor({
    id: 'procedural-marks',
    category: WEBGPU_MATERIAL_FACTORY_CATEGORIES.PROCEDURAL_MARKS,
    label: 'Procedural Marks',
    description: 'A deterministic mark surface for dashes, scratches, stipple, transfer noise, and drawn accents.',
    output: {
      runtimeSurface: 'instanced-geometry-material',
      materialType: 'MeshBasicMaterial',
      textureTypes: ['CanvasTexture', 'DataTexture'],
      colorSpace: 'srgb',
      transparency: 'alpha-blend',
      proceduralInputs: ['markFamily', 'density', 'jitter', 'pressure', 'seed']
    },
    requiredInputs: ['markFamily', 'seed'],
    optionalInputs: ['density', 'jitter', 'pressure', 'width', 'opacity'],
    guidance: [
      'Use deterministic geometry, sprites, or texture descriptors for marks.',
      'Do not encode marks as one-off fragment shaders for WebGPU project scenes.'
    ]
  }),
  descriptor({
    id: 'soft-particles',
    category: WEBGPU_MATERIAL_FACTORY_CATEGORIES.SOFT_PARTICLES,
    label: 'Soft Particles',
    description: 'A WebGPU-safe particle material descriptor for mist, dust, blooms, and airborne pigment.',
    output: {
      runtimeSurface: 'three-points-material',
      materialType: 'PointsMaterial',
      textureTypes: ['CanvasTexture', 'DataTexture'],
      colorSpace: 'srgb',
      transparency: 'alpha-blend',
      proceduralInputs: ['count', 'size', 'spread', 'falloff', 'seed']
    },
    requiredInputs: ['count', 'seed'],
    optionalInputs: ['size', 'spread', 'falloff', 'opacity', 'colorRamp'],
    guidance: [
      'Use for soft atmosphere, dust, floating pigment, and particulate halos.',
      'Keep the particle logic deterministic and inspectable in data.'
    ]
  }),
  descriptor({
    id: 'sky-background-field',
    category: WEBGPU_MATERIAL_FACTORY_CATEGORIES.SKY_BACKGROUND_FIELD,
    label: 'Sky And Background Field',
    description: 'A scene background or full-frame field descriptor for gradients, paper grounds, and horizonless spaces.',
    output: {
      runtimeSurface: 'scene-background-or-large-plane',
      materialType: 'MeshBasicMaterial',
      textureTypes: ['CanvasTexture', 'DataTexture'],
      colorSpace: 'srgb',
      transparency: 'opaque-or-alpha',
      proceduralInputs: ['colorRamp', 'grain', 'vignette', 'horizon', 'seed']
    },
    requiredInputs: ['colorRamp'],
    optionalInputs: ['grain', 'vignette', 'horizon', 'opacity', 'seed'],
    guidance: [
      'Use for skyboxes, background fields, frontal paper grounds, and full-frame atmosphere.',
      'Represent background behavior declaratively so renderer choice can be inspected without a GPU.'
    ]
  }),
  descriptor({
    id: 'texture-surface',
    category: WEBGPU_MATERIAL_FACTORY_CATEGORIES.TEXTURE_SURFACE,
    label: 'Texture Surface',
    description: 'A safe image, canvas, or data texture material descriptor with explicit color-space and wrapping facts.',
    output: {
      runtimeSurface: 'three-texture-material',
      materialType: 'MeshStandardMaterial',
      textureTypes: ['Texture', 'CanvasTexture', 'DataTexture'],
      colorSpace: 'srgb',
      transparency: 'optional-alpha',
      proceduralInputs: ['textureRef', 'uvTransform', 'wrap', 'filter', 'opacity']
    },
    requiredInputs: ['textureRef'],
    optionalInputs: ['uvTransform', 'wrap', 'filter', 'roughness', 'opacity'],
    guidance: [
      'Use for loaded images, generated canvas textures, paper scans, and transfer-like surfaces.',
      'Declare texture metadata instead of hiding sampling behavior in shader strings.'
    ]
  }),
  descriptor({
    id: 'post-color-transform',
    category: WEBGPU_MATERIAL_FACTORY_CATEGORIES.POST_COLOR_TRANSFORM,
    label: 'Post Color Transform',
    description: 'A declarative post-color transform descriptor for exposure, contrast, saturation, vignette, and hue drift.',
    output: {
      runtimeSurface: 'declarative-post-color-transform',
      materialType: 'TSLNodeMaterial',
      textureTypes: ['render-target-texture'],
      colorSpace: 'srgb',
      transparency: 'not-applicable',
      proceduralInputs: ['exposure', 'contrast', 'saturation', 'vignette', 'hueShift']
    },
    requiredInputs: [],
    optionalInputs: ['exposure', 'contrast', 'saturation', 'vignette', 'hueShift'],
    guidance: [
      'Use for WebGPU-safe color grading and output transforms.',
      'Do not use legacy GLSL post passes for WebGPU project scenes.'
    ]
  })
]);

const WEBGPU_MATERIAL_FACTORY_BY_ID = new Map(
  WEBGPU_MATERIAL_FACTORY_DESCRIPTORS.map((entry) => [entry.id, entry])
);

function normalizeFactoryId(factoryId) {
  return String(factoryId || '').trim();
}

export function listWebGPUMaterialFactoryDescriptors({ category = null } = {}) {
  const normalizedCategory = category ? String(category).trim() : null;
  const descriptors = normalizedCategory
    ? WEBGPU_MATERIAL_FACTORY_DESCRIPTORS.filter((entry) => entry.category === normalizedCategory)
    : WEBGPU_MATERIAL_FACTORY_DESCRIPTORS;
  return descriptors.map(cloneData);
}

export function getWebGPUMaterialFactoryDescriptor(factoryId) {
  const descriptorEntry = WEBGPU_MATERIAL_FACTORY_BY_ID.get(normalizeFactoryId(factoryId));
  return descriptorEntry ? cloneData(descriptorEntry) : null;
}

export function isWebGPUMaterialFactoryId(factoryId) {
  return WEBGPU_MATERIAL_FACTORY_BY_ID.has(normalizeFactoryId(factoryId));
}

export function buildWebGPUMaterialFactorySurfaceDescriptor(factoryId, params = {}) {
  const factoryDescriptor = getWebGPUMaterialFactoryDescriptor(factoryId);
  if (!factoryDescriptor) return null;
  return {
    surfaceType: 'project-webgpu-material-factory',
    factoryId: factoryDescriptor.id,
    materialFactoryId: factoryDescriptor.id,
    factoryCategory: factoryDescriptor.category,
    materialType: factoryDescriptor.output.materialType,
    runtimeSurface: factoryDescriptor.output.runtimeSurface,
    params: params && typeof params === 'object' && !Array.isArray(params) ? cloneData(params) : {},
    rendererCompatibility: {
      webgpu: true,
      webgl: true,
      evidence: factoryDescriptor.compatibility.evidence.slice()
    },
    compatibility: cloneData(factoryDescriptor.compatibility),
    factoryDescriptor
  };
}

export function getWebGPUMaterialFactoryCatalog() {
  return {
    version: WEBGPU_MATERIAL_FACTORY_CATALOG_VERSION,
    categories: { ...WEBGPU_MATERIAL_FACTORY_CATEGORIES },
    factoryIds: WEBGPU_MATERIAL_FACTORY_DESCRIPTORS.map((entry) => entry.id),
    descriptors: listWebGPUMaterialFactoryDescriptors()
  };
}
