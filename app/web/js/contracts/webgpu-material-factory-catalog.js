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
  'raw-glsl-source',
  'cpu-baked-texture-generation'
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
    id: 'scraped-paint-grain-surface',
    category: WEBGPU_MATERIAL_FACTORY_CATEGORIES.MATTE_PAINTED_SURFACE,
    label: 'Scraped Paint Grain Surface',
    description: 'A bounded TSL paint/grain material for scraped bands, paper tooth, and animated pigment pressure.',
    output: {
      runtimeSurface: 'three-mesh-basic-node-material-tsl',
      materialType: 'MeshBasicNodeMaterial',
      textureTypes: [],
      colorSpace: 'srgb',
      transparency: 'optional-alpha',
      proceduralInputs: ['palette', 'opacity', 'grainStrength', 'scrapeStrength', 'bandScale', 'distortionStrength', 'flowSpeed', 'motionIntensity']
    },
    requiredInputs: ['palette'],
    optionalInputs: ['opacity', 'grainStrength', 'scrapeStrength', 'bandScale', 'distortionStrength', 'flowSpeed', 'motionIntensity', 'phase'],
    guidance: [
      'Use for shader-like scraped paint, paper grain, rubbed surfaces, and animated pigment bands on WebGPU.',
      'Runtime utilities own the TSL node material and deterministic frame-fact time controls.'
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

export const WEBGPU_NATIVE_HELPER_CATALOG_VERSION = 1;

export const WEBGPU_NATIVE_HELPER_FEATURE_FAMILIES = Object.freeze({
  COLOR_FIELD: 'color-field',
  PROCEDURAL_MARKS: 'procedural-marks',
  SKY_BACKGROUND_FIELD: 'sky-background-field',
  PAINT_GRAIN_SURFACE: 'paint-grain-surface',
  POINT_PARTICLE_FIELD: 'point-particle-field',
  INSTANCED_MARKS: 'instanced-marks'
});

export const WEBGPU_NATIVE_HELPER_IDS = Object.freeze({
  COLOR_FIELD_MATERIAL: 'color-field-material',
  ANIMATED_COLOR_FIELD_MATERIAL: 'animated-color-field-material',
  ANIMATED_DIRECTION_SPACE_SKYBOX_SHELL: 'animated-direction-space-skybox-shell',
  SCRAPED_PAINT_GRAIN_MATERIAL: 'scraped-paint-grain-material',
  PROCEDURAL_MARK_MATERIAL: 'procedural-mark-material',
  POINT_PARTICLE_FIELD: 'point-particle-field',
  ANIMATED_POINT_PARTICLE_FIELD: 'animated-point-particle-field',
  INSTANCED_MARK_FIELD: 'instanced-mark-field',
  ANIMATED_INSTANCED_MARK_FIELD: 'animated-instanced-mark-field',
  VERTEX_COLOR_SKYBOX_SHELL: 'vertex-color-skybox-shell',
  DIRECTION_SPACE_SKYBOX_SHELL: 'direction-space-skybox-shell'
});

const WEBGPU_NATIVE_HELPER_COMPATIBILITY = Object.freeze({
  webgpu: true,
  webgl: true,
  status: 'webgpu-compatible',
  rendererFamilies: Object.freeze(['webgpu-renderer', 'webgl-renderer']),
  evidence: Object.freeze([
    'rusty-art-webgpu-native-helper',
    'project-webgpu-material-factory',
    'no-raw-glsl'
  ]),
  gpuDeviceRequiredForInspection: false,
  webglOnly: false
});

function helperDescriptor({
  id,
  functionName,
  materialFactoryId,
  featureFamily,
  outputKind,
  runtimeSurface,
  materialType,
  budget = {},
  guidance = []
}) {
  const factory = WEBGPU_MATERIAL_FACTORY_BY_ID.get(materialFactoryId);
  return deepFreeze({
    id,
    version: WEBGPU_NATIVE_HELPER_CATALOG_VERSION,
    helperKind: 'runtime-helper',
    authoringSurface: 'generated-module-utilities',
    functionName,
    api: `utilities.${functionName}`,
    factoryId: materialFactoryId,
    materialFactoryId,
    factoryCategory: factory?.category || null,
    featureFamily,
    outputKind,
    runtimeSurface: runtimeSurface || factory?.output?.runtimeSurface || null,
    materialType,
    rendererCompatibility: WEBGPU_NATIVE_HELPER_COMPATIBILITY,
    budget,
    forbiddenSurfaces: WEBGL_ONLY_FORBIDDEN_SURFACES,
    guidance
  });
}

const WEBGPU_NATIVE_HELPER_DESCRIPTORS = deepFreeze([
  helperDescriptor({
    id: WEBGPU_NATIVE_HELPER_IDS.COLOR_FIELD_MATERIAL,
    functionName: 'createColorFieldMaterial',
    materialFactoryId: 'color-field',
    featureFamily: WEBGPU_NATIVE_HELPER_FEATURE_FAMILIES.COLOR_FIELD,
    outputKind: 'material',
    runtimeSurface: 'three-basic-material',
    materialType: 'MeshBasicMaterial',
    budget: { maxColorStops: 8, mobileSafe: true },
    guidance: [
      'Use for flat fields, bands, ramps, and atmosphere planes without shader strings.'
    ]
  }),
  helperDescriptor({
    id: WEBGPU_NATIVE_HELPER_IDS.ANIMATED_COLOR_FIELD_MATERIAL,
    functionName: 'createAnimatedColorFieldMaterial',
    materialFactoryId: 'color-field',
    featureFamily: WEBGPU_NATIVE_HELPER_FEATURE_FAMILIES.COLOR_FIELD,
    outputKind: 'material',
    runtimeSurface: 'three-mesh-basic-node-material-tsl',
    materialType: 'MeshBasicNodeMaterial',
    budget: { maxColorStops: 8, maxTimeUniforms: 1, maxBandScale: 24, mobileSafe: true },
    guidance: [
      'Use for time-driven bands, ramps, and atmospheric fields that need shader-like motion on WebGPU.',
      'Runtime utilities own the TSL node material and frame-fact time controls; generated modules must not import three/tsl or construct NodeMaterial directly.'
    ]
  }),
  helperDescriptor({
    id: WEBGPU_NATIVE_HELPER_IDS.PROCEDURAL_MARK_MATERIAL,
    functionName: 'createProceduralMarkMaterial',
    materialFactoryId: 'procedural-marks',
    featureFamily: WEBGPU_NATIVE_HELPER_FEATURE_FAMILIES.PROCEDURAL_MARKS,
    outputKind: 'material',
    runtimeSurface: 'three-basic-material',
    materialType: 'MeshBasicMaterial',
    budget: { maxOpacityLayers: 1, mobileSafe: true },
    guidance: [
      'Pair with deterministic geometry, lines, sprites, or instancing for scratches, dashes, stipple, and transfer marks.'
    ]
  }),
  helperDescriptor({
    id: WEBGPU_NATIVE_HELPER_IDS.ANIMATED_DIRECTION_SPACE_SKYBOX_SHELL,
    functionName: 'createAnimatedDirectionSpaceSkyboxShell',
    materialFactoryId: 'sky-background-field',
    featureFamily: WEBGPU_NATIVE_HELPER_FEATURE_FAMILIES.SKY_BACKGROUND_FIELD,
    outputKind: 'object-bundle',
    runtimeSurface: 'three-mesh-basic-node-material-tsl-skybox-shell',
    materialType: 'MeshBasicNodeMaterial',
    budget: { maxWidthSegments: 192, maxHeightSegments: 128, maxTimeUniforms: 1, shellCount: 1, mobileSafe: true },
    guidance: [
      'Use for animated normalized direction-space skybox fields without raw shader strings.',
      'Creates one environment shell and relies on frame-fact time controls for capture-safe animation.'
    ]
  }),
  helperDescriptor({
    id: WEBGPU_NATIVE_HELPER_IDS.SCRAPED_PAINT_GRAIN_MATERIAL,
    functionName: 'createScrapedPaintGrainMaterial',
    materialFactoryId: 'scraped-paint-grain-surface',
    featureFamily: WEBGPU_NATIVE_HELPER_FEATURE_FAMILIES.PAINT_GRAIN_SURFACE,
    outputKind: 'material',
    runtimeSurface: 'three-mesh-basic-node-material-tsl',
    materialType: 'MeshBasicNodeMaterial',
    budget: { maxColorStops: 8, maxTimeUniforms: 1, maxBandScale: 32, mobileSafe: true },
    guidance: [
      'Use for animated scraped paint, paper tooth, grain, rubbed pigment, and bounded fragment-effect surfaces.',
      'Generated modules pass palette/opacity/grain/scrape/band/distortion/flow controls to the utility instead of importing TSL.'
    ]
  }),
  helperDescriptor({
    id: WEBGPU_NATIVE_HELPER_IDS.POINT_PARTICLE_FIELD,
    functionName: 'createPointParticleField',
    materialFactoryId: 'soft-particles',
    featureFamily: WEBGPU_NATIVE_HELPER_FEATURE_FAMILIES.POINT_PARTICLE_FIELD,
    outputKind: 'object-bundle',
    runtimeSurface: 'three-points-buffer-geometry',
    materialType: 'PointsMaterial',
    budget: { maxCount: 1500, maxSize: 0.12, mobileSafe: true },
    guidance: [
      'Use for tiny dust, pigment, stipple, mist, and atmospheric specks; keep points small.'
    ]
  }),
  helperDescriptor({
    id: WEBGPU_NATIVE_HELPER_IDS.ANIMATED_POINT_PARTICLE_FIELD,
    functionName: 'createAnimatedPointParticleField',
    materialFactoryId: 'soft-particles',
    featureFamily: WEBGPU_NATIVE_HELPER_FEATURE_FAMILIES.POINT_PARTICLE_FIELD,
    outputKind: 'object-bundle',
    runtimeSurface: 'three-points-node-material-tsl-buffer-geometry',
    materialType: 'PointsNodeMaterial',
    budget: { maxCount: 1500, maxSize: 0.12, maxDensity: 1, maxMotionRadius: 0.6, maxFlowSpeed: 4, maxMotionIntensity: 1, maxTimeUniforms: 1, mobileSafe: true },
    guidance: [
      'Use for bounded animated dust, crowd, pressure, signal, and pigment point fields on WebGPU.',
      'Runtime utilities own the TSL point material and frame-fact time controls; generated modules must not import TSL or construct node materials directly.'
    ]
  }),
  helperDescriptor({
    id: WEBGPU_NATIVE_HELPER_IDS.INSTANCED_MARK_FIELD,
    functionName: 'createInstancedMarkField',
    materialFactoryId: 'procedural-marks',
    featureFamily: WEBGPU_NATIVE_HELPER_FEATURE_FAMILIES.INSTANCED_MARKS,
    outputKind: 'object-bundle',
    runtimeSurface: 'three-instanced-mesh-basic-material',
    materialType: 'MeshBasicMaterial',
    budget: { maxCount: 600, mobileSafe: true },
    guidance: [
      'Use for bounded repeated slashes, paper flecks, mesh billboards, and particle-style marks.'
    ]
  }),
  helperDescriptor({
    id: WEBGPU_NATIVE_HELPER_IDS.ANIMATED_INSTANCED_MARK_FIELD,
    functionName: 'createAnimatedInstancedMarkField',
    materialFactoryId: 'procedural-marks',
    featureFamily: WEBGPU_NATIVE_HELPER_FEATURE_FAMILIES.INSTANCED_MARKS,
    outputKind: 'object-bundle',
    runtimeSurface: 'three-instanced-mesh-basic-material-frame-facts',
    materialType: 'MeshBasicMaterial',
    budget: { maxCount: 600, maxWidth: 0.6, maxHeight: 0.3, maxDensity: 1, maxMotionRadius: 0.8, maxFlowSpeed: 4, maxMotionIntensity: 1, mobileSafe: true },
    guidance: [
      'Use for bounded animated slashes, repeated pressure marks, crowd glyphs, and particle-style instanced marks.',
      'Runtime utilities own deterministic frame-fact matrix updates so capture mode freezes and live mode advances without timers.'
    ]
  }),
  helperDescriptor({
    id: WEBGPU_NATIVE_HELPER_IDS.VERTEX_COLOR_SKYBOX_SHELL,
    functionName: 'createVertexColorSkyboxShell',
    materialFactoryId: 'sky-background-field',
    featureFamily: WEBGPU_NATIVE_HELPER_FEATURE_FAMILIES.SKY_BACKGROUND_FIELD,
    outputKind: 'object-bundle',
    runtimeSurface: 'vertex-color-skybox-shell',
    materialType: 'MeshBasicMaterial',
    budget: { maxWidthSegments: 192, maxHeightSegments: 128, mobileSafe: true },
    guidance: [
      'Use for WebGPU-safe background shells with pre-sampled vertex colors.'
    ]
  }),
  helperDescriptor({
    id: WEBGPU_NATIVE_HELPER_IDS.DIRECTION_SPACE_SKYBOX_SHELL,
    functionName: 'createDirectionSpaceSkyboxShell',
    materialFactoryId: 'sky-background-field',
    featureFamily: WEBGPU_NATIVE_HELPER_FEATURE_FAMILIES.SKY_BACKGROUND_FIELD,
    outputKind: 'object-bundle',
    runtimeSurface: 'direction-space-vertex-color-skybox-shell',
    materialType: 'MeshBasicMaterial',
    budget: { maxWidthSegments: 192, maxHeightSegments: 128, mobileSafe: true },
    guidance: [
      'Use for normalized direction-space sky and background fields translated away from raw shaders.'
    ]
  })
]);

const WEBGPU_NATIVE_HELPER_BY_ID = new Map(
  WEBGPU_NATIVE_HELPER_DESCRIPTORS.map((entry) => [entry.id, entry])
);

const WEBGPU_NATIVE_HELPER_BY_FUNCTION_NAME = new Map(
  WEBGPU_NATIVE_HELPER_DESCRIPTORS.map((entry) => [entry.functionName, entry])
);

export const WEBGPU_ADVANCED_FEATURE_CATALOG_VERSION = 1;

export const WEBGPU_ADVANCED_FEATURE_STATUSES = Object.freeze({
  AVAILABLE: 'available',
  UNSUPPORTED: 'unsupported',
  EXPERIMENTAL: 'experimental'
});

export const WEBGPU_ADVANCED_FEATURE_DEFAULT_ADVERTISING_POLICIES = Object.freeze({
  NOT_ADVERTISED: 'not-advertised',
  RENDERER_LEVEL_ONLY: 'renderer-level-only'
});

export const WEBGPU_ADVANCED_FEATURE_IDS = Object.freeze({
  COMPUTE_STORAGE_BUFFERS: 'compute-storage-buffers',
  STORAGE_TEXTURES: 'storage-textures',
  MULTIPLE_RENDER_TARGETS: 'mrt',
  INDIRECT_DRAW: 'indirect-draw',
  GPU_READBACK: 'gpu-readback',
  CLUSTERED_LIGHTING: 'clustered-lighting',
  TEMPORAL_PIPELINES: 'temporal-pipelines',
  RENDERER_POST_COLOR_TRANSFORM: 'renderer-post-color-transform'
});

function advancedFeatureGate({
  id,
  aliases = [],
  family,
  label,
  status,
  requiredProof = [],
  fallbackReason = null,
  defaultAdvertisingPolicy = WEBGPU_ADVANCED_FEATURE_DEFAULT_ADVERTISING_POLICIES.NOT_ADVERTISED,
  generatedModuleEvidenceEligible = false,
  rendererLevel = false
}) {
  return deepFreeze({
    id,
    version: WEBGPU_ADVANCED_FEATURE_CATALOG_VERSION,
    aliases,
    family,
    label,
    status,
    requiredProof,
    fallbackReason,
    defaultAdvertisingPolicy,
    generatedModuleEvidenceEligible,
    rendererLevel
  });
}

const WEBGPU_ADVANCED_FEATURE_GATES = deepFreeze([
  advancedFeatureGate({
    id: WEBGPU_ADVANCED_FEATURE_IDS.COMPUTE_STORAGE_BUFFERS,
    aliases: ['compute', 'compute-shader', 'compute-storage', 'compute-storage-buffer', 'storage-buffer', 'storage-buffers'],
    family: 'compute-storage',
    label: 'Compute And Storage Buffers',
    status: WEBGPU_ADVANCED_FEATURE_STATUSES.UNSUPPORTED,
    requiredProof: ['runtime-compute-fixture', 'adapter-feature-or-limit-check', 'preview-diagnostic', 'render-evidence'],
    fallbackReason: 'compute-storage-buffers-unsupported'
  }),
  advancedFeatureGate({
    id: WEBGPU_ADVANCED_FEATURE_IDS.STORAGE_TEXTURES,
    aliases: ['storage-texture', 'storage-textures'],
    family: 'storage-texture',
    label: 'Storage Textures',
    status: WEBGPU_ADVANCED_FEATURE_STATUSES.UNSUPPORTED,
    requiredProof: ['runtime-storage-texture-fixture', 'device-feature-check', 'preview-diagnostic', 'render-evidence'],
    fallbackReason: 'storage-textures-unsupported'
  }),
  advancedFeatureGate({
    id: WEBGPU_ADVANCED_FEATURE_IDS.MULTIPLE_RENDER_TARGETS,
    aliases: ['multiple-render-target', 'multiple-render-targets', 'mrt', 'render-target-array'],
    family: 'multiple-render-targets',
    label: 'Multiple Render Targets',
    status: WEBGPU_ADVANCED_FEATURE_STATUSES.UNSUPPORTED,
    requiredProof: ['runtime-mrt-fixture', 'max-color-attachments-limit-check', 'preview-diagnostic', 'render-evidence'],
    fallbackReason: 'mrt-unsupported'
  }),
  advancedFeatureGate({
    id: WEBGPU_ADVANCED_FEATURE_IDS.INDIRECT_DRAW,
    aliases: ['indirect', 'indirect-draw', 'draw-indirect', 'drawindirect'],
    family: 'indirect-draw',
    label: 'Indirect Draw',
    status: WEBGPU_ADVANCED_FEATURE_STATUSES.UNSUPPORTED,
    requiredProof: ['runtime-indirect-draw-fixture', 'command-buffer-diagnostic', 'preview-diagnostic', 'render-evidence'],
    fallbackReason: 'indirect-draw-unsupported'
  }),
  advancedFeatureGate({
    id: WEBGPU_ADVANCED_FEATURE_IDS.GPU_READBACK,
    aliases: ['readback', 'gpu-readback', 'gpu-to-cpu-readback', 'buffer-readback'],
    family: 'gpu-readback',
    label: 'GPU Readback',
    status: WEBGPU_ADVANCED_FEATURE_STATUSES.UNSUPPORTED,
    requiredProof: ['runtime-readback-fixture', 'buffer-map-diagnostic', 'bounded-debug-or-export-use', 'render-evidence'],
    fallbackReason: 'gpu-readback-unsupported'
  }),
  advancedFeatureGate({
    id: WEBGPU_ADVANCED_FEATURE_IDS.CLUSTERED_LIGHTING,
    aliases: ['clustered-lighting', 'clustered-lights', 'cluster-lighting'],
    family: 'clustered-lighting',
    label: 'Clustered Lighting',
    status: WEBGPU_ADVANCED_FEATURE_STATUSES.UNSUPPORTED,
    requiredProof: ['runtime-clustered-lighting-fixture', 'compute-or-buffer-limit-check', 'preview-diagnostic', 'render-evidence'],
    fallbackReason: 'clustered-lighting-unsupported'
  }),
  advancedFeatureGate({
    id: WEBGPU_ADVANCED_FEATURE_IDS.TEMPORAL_PIPELINES,
    aliases: ['temporal', 'temporal-pipeline', 'temporal-pipelines', 'taa', 'temporal-accumulation'],
    family: 'temporal-pipeline',
    label: 'Temporal Pipelines',
    status: WEBGPU_ADVANCED_FEATURE_STATUSES.UNSUPPORTED,
    requiredProof: ['runtime-temporal-fixture', 'history-buffer-lifecycle-check', 'preview-diagnostic', 'render-evidence'],
    fallbackReason: 'temporal-pipelines-unsupported'
  }),
  advancedFeatureGate({
    id: WEBGPU_ADVANCED_FEATURE_IDS.RENDERER_POST_COLOR_TRANSFORM,
    aliases: ['renderer-post', 'renderer-post-color-transform', 'post-color-transform', 'output-color-transform', 'color-transform'],
    family: 'renderer-post',
    label: 'Renderer Post Color Transform',
    status: WEBGPU_ADVANCED_FEATURE_STATUSES.AVAILABLE,
    requiredProof: ['world-output-color-transform-or-renderer-post-descriptor', 'renderer-owned-renderpipeline-runtime', 'render-evidence'],
    fallbackReason: 'renderer-post-descriptor-not-part-evidence',
    defaultAdvertisingPolicy: WEBGPU_ADVANCED_FEATURE_DEFAULT_ADVERTISING_POLICIES.RENDERER_LEVEL_ONLY,
    rendererLevel: true
  })
]);

function normalizeAdvancedFeatureToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[\s_/]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const WEBGPU_ADVANCED_FEATURE_BY_ID = new Map(
  WEBGPU_ADVANCED_FEATURE_GATES.map((entry) => [entry.id, entry])
);

const WEBGPU_ADVANCED_FEATURE_ALIAS_TO_ID = new Map(
  WEBGPU_ADVANCED_FEATURE_GATES.flatMap((entry) => (
    [entry.id, ...(entry.aliases || [])].map((alias) => [normalizeAdvancedFeatureToken(alias), entry.id])
  ))
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

export function listWebGPUNativeHelperDescriptors({ featureFamily = null } = {}) {
  const normalizedFamily = featureFamily ? String(featureFamily).trim() : null;
  const descriptors = normalizedFamily
    ? WEBGPU_NATIVE_HELPER_DESCRIPTORS.filter((entry) => entry.featureFamily === normalizedFamily)
    : WEBGPU_NATIVE_HELPER_DESCRIPTORS;
  return descriptors.map(cloneData);
}

export function getWebGPUNativeHelperDescriptor(helperId) {
  const descriptorEntry = WEBGPU_NATIVE_HELPER_BY_ID.get(normalizeFactoryId(helperId));
  return descriptorEntry ? cloneData(descriptorEntry) : null;
}

export function getWebGPUNativeHelperDescriptorByFunctionName(functionName) {
  const descriptorEntry = WEBGPU_NATIVE_HELPER_BY_FUNCTION_NAME.get(normalizeFactoryId(functionName));
  return descriptorEntry ? cloneData(descriptorEntry) : null;
}

export function isWebGPUNativeHelperId(helperId) {
  return WEBGPU_NATIVE_HELPER_BY_ID.has(normalizeFactoryId(helperId));
}

export function listWebGPUAdvancedFeatureGates({ defaultAdvertisingPolicy = null, rendererLevel = null } = {}) {
  const policy = defaultAdvertisingPolicy ? String(defaultAdvertisingPolicy).trim() : null;
  const descriptors = WEBGPU_ADVANCED_FEATURE_GATES.filter((entry) => (
    (!policy || entry.defaultAdvertisingPolicy === policy)
    && (rendererLevel === null || entry.rendererLevel === rendererLevel)
  ));
  return descriptors.map(cloneData);
}

export function getWebGPUAdvancedFeatureGate(featureId) {
  const token = normalizeAdvancedFeatureToken(featureId);
  const resolvedId = WEBGPU_ADVANCED_FEATURE_ALIAS_TO_ID.get(token) || token;
  const descriptorEntry = WEBGPU_ADVANCED_FEATURE_BY_ID.get(resolvedId);
  return descriptorEntry ? cloneData(descriptorEntry) : null;
}

export function isWebGPUAdvancedFeatureId(featureId) {
  return Boolean(getWebGPUAdvancedFeatureGate(featureId));
}

export function buildWebGPUNativeHelperFeatureFacts(helperId, { budget = {}, rendererCompatibility = null } = {}) {
  const descriptorEntry = WEBGPU_NATIVE_HELPER_BY_ID.get(normalizeFactoryId(helperId));
  if (!descriptorEntry) return null;
  const budgetFacts = budget && typeof budget === 'object' && !Array.isArray(budget) ? cloneData(budget) : {};
  return {
    helperId: descriptorEntry.id,
    api: descriptorEntry.api,
    factoryId: descriptorEntry.factoryId,
    materialFactoryId: descriptorEntry.materialFactoryId,
    featureFamily: descriptorEntry.featureFamily,
    outputKind: descriptorEntry.outputKind,
    runtimeSurface: descriptorEntry.runtimeSurface,
    materialType: descriptorEntry.materialType,
    rendererCompatibility: rendererCompatibility && typeof rendererCompatibility === 'object' && !Array.isArray(rendererCompatibility)
      ? cloneData(rendererCompatibility)
      : {
          webgpu: true,
          webgl: true,
          status: 'webgpu-compatible',
          evidence: descriptorEntry.rendererCompatibility.evidence.slice()
        },
    budget: {
      ...cloneData(descriptorEntry.budget || {}),
      ...budgetFacts
    }
  };
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
    descriptors: listWebGPUMaterialFactoryDescriptors(),
    nativeHelperVersion: WEBGPU_NATIVE_HELPER_CATALOG_VERSION,
    nativeHelperIds: WEBGPU_NATIVE_HELPER_DESCRIPTORS.map((entry) => entry.id),
    nativeHelpers: listWebGPUNativeHelperDescriptors(),
    advancedFeatureVersion: WEBGPU_ADVANCED_FEATURE_CATALOG_VERSION,
    advancedFeatureIds: WEBGPU_ADVANCED_FEATURE_GATES.map((entry) => entry.id),
    advancedFeatureGates: listWebGPUAdvancedFeatureGates()
  };
}
