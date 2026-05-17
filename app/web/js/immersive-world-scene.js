import * as THREE from 'three';
import {
  applyViewportOrbitFrame,
  bindOrbitInput,
  updateCameraFromOrbit
} from './scene-camera.js';
import {
  applyImmersiveWorldSkyboxDefaults,
  createImmersiveWorldSkyboxUtilities,
  isImmersiveWorldSkyboxMode,
  resolveImmersiveWorldSkyboxRadius,
  shouldUseImmersiveWorldSkybox
} from './immersive-world-skybox.js';
import {
  collectRendererSceneFeatures,
  createPostPass,
  createPostRenderTarget,
  createWebGLRendererRuntime,
  describeRendererDiagnostics,
  normalizeRendererModeRequest,
  POST_PROCESSING_MODES,
  RENDERER_MODES,
  resolveRendererRuntimeSelection,
  resizeSceneRenderTargets
} from './scene-rendering.js';
import { createWebGPURendererRuntime } from './scene-webgpu-renderer-runtime.js';
import {
  applyOutputColorTransformToTslControls,
  createTslPostProcessingControls,
  createTslRenderPipeline
} from './scene-tsl-post-processing.js';
import {
  createBrowserResizeAdapter,
  createBrowserTimingAdapter,
  createSceneFrameLifecycle
} from './scene-frame-lifecycle.js';
import { IMMERSIVE_WORLD_POST_FRAGMENT } from './scene-shaders.js';
import { disposeObjectTree } from './scene-runtime.js';
import { createSceneElapsedTimer } from './scene-time.js';

const WORLD_ENVIRONMENT_PART_ID = 'world-environment';
const MAX_FRAME_DELTA_SECONDS = 1 / 15;
const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const LEGACY_ORBIT_CONTROLS = Object.freeze({
  minDistance: 6,
  maxDistance: 24,
  autoRotate: false,
  autoRotateSpeed: 0.14,
  dampingFactor: 0.08
});
const DEFAULT_ORBIT_POSE = Object.freeze({
  radius: 12,
  theta: 0,
  phi: Math.PI / 2.2
});
const DEFAULT_OUTPUT_COLOR_TRANSFORM = Object.freeze({
  contrast: 1,
  saturation: 1,
  exposure: 1,
  vignette: 0,
  hueShift: 0,
  distortion: 0
});
const OUTPUT_COLOR_TRANSFORM_LIMITS = Object.freeze({
  contrast: [0.85, 1.35],
  saturation: [0.75, 1.25],
  exposure: [0.8, 1.25],
  vignette: [0, 0.18],
  hueShift: [-0.03, 0.03],
  distortion: [0, 0]
});
const WEBGPU_PROJECT_SCENE_TARGET = 'webgpu-project-scene';
const LEGACY_WEBGL_SCENE_TARGET = 'legacy-webgl-scene';
const WEBGPU_COMPATIBLE_STATUS = 'webgpu-compatible';
const LEGACY_WEBGL_FALLBACK_REASON = 'legacy-webgl-authoring-mode';
const WEBGPU_EVIDENCE_MISSING_REASON = 'webgpu-evidence-missing';
const GENERATED_MODULE_UNKNOWN_REASON = 'generated-module-unknown';
const WEBGPU_DIRECT_OUTPUT_COLOR_TRANSFORM_MODE = 'webgpu-direct';

function cleanToken(value) {
  return String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
}

function booleanFlag(value) {
  if (value === true) return true;
  const token = cleanToken(value);
  return token === '1' || token === 'true' || token === 'yes' || token === WEBGPU_COMPATIBLE_STATUS;
}

function rendererTargetModeFrom(value = null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return cleanToken(value) || null;
  return cleanToken(
    value.targetMode
      || value.effectiveTarget
      || value.requestedTarget
      || value.rendererAuthoringTarget
      || value.rendererTarget
      || value.authoringMode
  ) || null;
}

function compatibilityFromFact(value = null, source = null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const compatibilityStatus = cleanToken(value.compatibilityStatus) || null;
  const webgpuCompatible = booleanFlag(value.webgpuCompatible)
    || booleanFlag(value.webgpu)
    || compatibilityStatus === WEBGPU_COMPATIBLE_STATUS;
  return {
    source,
    targetMode: rendererTargetModeFrom(value),
    compatibilityStatus,
    webgpuCompatible,
    fallbackReason: cleanToken(value.fallbackReason) || null,
    fallbackReasons: Array.isArray(value.fallbackReasons) ? value.fallbackReasons.map(cleanToken).filter(Boolean) : []
  };
}

function collectImmersiveWorldRuntimeModuleRefs(art = {}) {
  const world = asObject(art?.world);
  const refs = [
    ...(Array.isArray(world.generatedModules) ? world.generatedModules : []),
    ...(Array.isArray(world.parts) ? world.parts.map((part) => part?.moduleRef || part?.module) : [])
  ].filter(Boolean);
  const seen = new Set();
  return refs.filter((ref) => {
    const key = ref.hash || ref.moduleId || ref.url || ref.file;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function resolveImmersiveWorldRendererCompatibilityFacts(art = {}) {
  const world = asObject(art?.world);
  const targetMode = rendererTargetModeFrom(art?.rendererAuthoring)
    || rendererTargetModeFrom(world.rendererAuthoring)
    || rendererTargetModeFrom(art?.rendererCompatibility)
    || rendererTargetModeFrom(world.rendererCompatibility)
    || null;
  const declaredCompatibility = [
    compatibilityFromFact(art?.rendererCompatibility, 'payload'),
    compatibilityFromFact(world.rendererCompatibility, 'world')
  ].filter(Boolean);
  const declaredIncompatible = declaredCompatibility.find((entry) => entry.webgpuCompatible === false
    || (entry.compatibilityStatus && entry.compatibilityStatus !== WEBGPU_COMPATIBLE_STATUS)
  ) || null;
  const declared = declaredCompatibility.find((entry) => entry.webgpuCompatible)
    || declaredCompatibility.find((entry) => entry.compatibilityStatus)
    || null;
  const moduleFacts = collectImmersiveWorldRuntimeModuleRefs(art)
    .map((ref) => compatibilityFromFact(ref.rendererCompatibility || ref, 'generated-module'))
    .filter(Boolean);
  const allModulesCompatible = moduleFacts.length > 0 && moduleFacts.every((entry) => entry.webgpuCompatible === true);
  const moduleFallback = moduleFacts.find((entry) => entry.webgpuCompatible !== true);

  if (!declaredIncompatible && (declared?.webgpuCompatible === true || (targetMode === WEBGPU_PROJECT_SCENE_TARGET && allModulesCompatible))) {
    return {
      targetMode: WEBGPU_PROJECT_SCENE_TARGET,
      compatibilityStatus: WEBGPU_COMPATIBLE_STATUS,
      webgpuCompatible: true,
      fallbackReason: null,
      source: declared?.source || 'generated-module',
      moduleCount: moduleFacts.length
    };
  }

  if (targetMode === WEBGPU_PROJECT_SCENE_TARGET) {
    return {
      targetMode,
      compatibilityStatus: declaredIncompatible?.compatibilityStatus || declared?.compatibilityStatus || moduleFallback?.compatibilityStatus || 'unknown',
      webgpuCompatible: false,
      fallbackReason: declaredIncompatible?.fallbackReason
        || declared?.fallbackReason
        || moduleFallback?.fallbackReason
        || (moduleFacts.length ? WEBGPU_EVIDENCE_MISSING_REASON : GENERATED_MODULE_UNKNOWN_REASON),
      source: declaredIncompatible?.source || declared?.source || moduleFallback?.source || 'payload',
      moduleCount: moduleFacts.length
    };
  }

  if (targetMode === LEGACY_WEBGL_SCENE_TARGET) {
    return {
      targetMode,
      compatibilityStatus: 'webgl-only',
      webgpuCompatible: false,
      fallbackReason: LEGACY_WEBGL_FALLBACK_REASON,
      source: declared?.source || 'payload',
      moduleCount: moduleFacts.length
    };
  }

  return {
    targetMode: targetMode || 'unspecified',
    compatibilityStatus: declared?.compatibilityStatus || 'unknown',
    webgpuCompatible: false,
    fallbackReason: declared?.fallbackReason || null,
    source: declared?.source || null,
    moduleCount: moduleFacts.length
  };
}

export function resolveImmersiveWorldRendererRequest({
  art = null,
  requestedMode = RENDERER_MODES.WEBGL_LEGACY
} = {}) {
  const normalizedRequest = normalizeRendererModeRequest(requestedMode);
  if (normalizedRequest !== RENDERER_MODES.WEBGL_LEGACY) return normalizedRequest;
  return resolveImmersiveWorldRendererCompatibilityFacts(art).webgpuCompatible
    ? RENDERER_MODES.WEBGPU
    : RENDERER_MODES.WEBGL_LEGACY;
}

export function isRemoteRuntimeRef(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(String(value || '').trim());
}

export function normalizePublicRuntimeUrl(value, {
  expectedDir = 'data',
  baseHref = typeof window !== 'undefined' ? window.location.href : 'http://localhost/'
} = {}) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('Runtime ref URL is required.');
  if (isRemoteRuntimeRef(raw)) throw new Error(`Remote runtime refs are not allowed: ${raw}`);

  const normalized = raw.replace(/^\.\//, '').replace(/^\//, '');
  const safeDir = expectedDir.replace(/^\.\//, '').replace(/^\//, '').replace(/\/+$/, '');
  if (!normalized.startsWith(`${safeDir}/`)) {
    throw new Error(`Runtime ref must point under ${safeDir}: ${raw}`);
  }
  return new URL(normalized, baseHref).href;
}

function asObject(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function color(value, fallback) {
  const text = String(value || '').trim();
  return text || fallback;
}

function number(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampedNumber(value, fallback, [min, max]) {
  return clamp(number(value, fallback), min, max);
}

export function resolveImmersiveWorldOutputColorTransform(world = {}) {
  const source = asObject(world.outputColorTransform, null)
    || asObject(world.colorTransform, null)
    || asObject(world.colorGrade, null)
    || {};
  return {
    owner: source.owner || null,
    contrast: clampedNumber(source.contrast, DEFAULT_OUTPUT_COLOR_TRANSFORM.contrast, OUTPUT_COLOR_TRANSFORM_LIMITS.contrast),
    saturation: clampedNumber(source.saturation, DEFAULT_OUTPUT_COLOR_TRANSFORM.saturation, OUTPUT_COLOR_TRANSFORM_LIMITS.saturation),
    exposure: clampedNumber(source.exposure, DEFAULT_OUTPUT_COLOR_TRANSFORM.exposure, OUTPUT_COLOR_TRANSFORM_LIMITS.exposure),
    vignette: clampedNumber(source.vignette, DEFAULT_OUTPUT_COLOR_TRANSFORM.vignette, OUTPUT_COLOR_TRANSFORM_LIMITS.vignette),
    hueShift: clampedNumber(source.hueShift, DEFAULT_OUTPUT_COLOR_TRANSFORM.hueShift, OUTPUT_COLOR_TRANSFORM_LIMITS.hueShift),
    distortion: clampedNumber(source.distortion, DEFAULT_OUTPUT_COLOR_TRANSFORM.distortion, OUTPUT_COLOR_TRANSFORM_LIMITS.distortion)
  };
}

export function isNeutralImmersiveWorldOutputColorTransform(transform = {}) {
  return Math.abs(number(transform.contrast, DEFAULT_OUTPUT_COLOR_TRANSFORM.contrast) - 1) < 0.0001
    && Math.abs(number(transform.saturation, DEFAULT_OUTPUT_COLOR_TRANSFORM.saturation) - 1) < 0.0001
    && Math.abs(number(transform.exposure, DEFAULT_OUTPUT_COLOR_TRANSFORM.exposure) - 1) < 0.0001
    && Math.abs(number(transform.vignette, DEFAULT_OUTPUT_COLOR_TRANSFORM.vignette)) < 0.0001
    && Math.abs(number(transform.hueShift, DEFAULT_OUTPUT_COLOR_TRANSFORM.hueShift)) < 0.0001
    && Math.abs(number(transform.distortion, DEFAULT_OUTPUT_COLOR_TRANSFORM.distortion)) < 0.0001;
}

export function createImmersiveWorldPostPass(renderTarget) {
  return createPostPass(renderTarget, {
    fragmentShader: IMMERSIVE_WORLD_POST_FRAGMENT,
    toneMapped: false
  });
}

export function applyImmersiveWorldOutputColorTransform(scene, world = {}) {
  const transform = resolveImmersiveWorldOutputColorTransform(world);
  scene.outputColorTransform = transform;
  scene.postBase = transform;
  return transform;
}

const MATERIAL_TEXTURE_FIELDS = Object.freeze([
  'map',
  'alphaMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'emissiveMap',
  'envMap',
  'lightMap',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
  'specularMap',
  'gradientMap'
]);

function collectMaterialTextures(material) {
  const textures = [];
  for (const field of MATERIAL_TEXTURE_FIELDS) {
    const texture = material?.[field];
    if (texture?.isTexture) textures.push(texture);
  }
  const uniforms = asObject(material?.uniforms, null);
  if (uniforms) {
    for (const uniform of Object.values(uniforms)) {
      const value = uniform?.value;
      if (value?.isTexture) textures.push(value);
    }
  }
  return textures;
}

function maxTextureAnisotropy(renderer) {
  const value = typeof renderer?.capabilities?.getMaxAnisotropy === 'function'
    ? renderer.capabilities.getMaxAnisotropy()
    : 1;
  return Math.max(1, Math.min(8, Number.isFinite(value) ? value : 1));
}

const SOFT_POINT_TEXTURE_SIZE = 32;
const softPointTextureCache = new WeakMap();

function createSoftPointTexture(three) {
  const size = SOFT_POINT_TEXTURE_SIZE;
  const center = (size - 1) / 2;
  const radius = size * 0.46;
  const feather = size * 0.2;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x - center, y - center);
      const alpha = clamp((radius - distance) / feather, 0, 1);
      const easedAlpha = alpha * alpha * (3 - 2 * alpha);
      const offset = (y * size + x) * 4;
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = Math.round(easedAlpha * 255);
    }
  }
  const texture = new three.DataTexture(data, size, size, three.RGBAFormat);
  texture.name = 'immersive-world-soft-point-sprite';
  texture.magFilter = three.LinearFilter;
  texture.minFilter = three.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = three.ClampToEdgeWrapping;
  texture.wrapT = three.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function softPointTextureFor(three, anisotropy) {
  let texture = softPointTextureCache.get(three);
  if (!texture) {
    texture = createSoftPointTexture(three);
    softPointTextureCache.set(three, texture);
  }
  if (texture.anisotropy !== anisotropy) {
    texture.anisotropy = anisotropy;
    texture.needsUpdate = true;
  }
  return texture;
}

function normalizeSrgbDataTextureUpload(texture, three) {
  if (!texture?.isDataTexture) return false;
  if (!three?.SRGBColorSpace || texture.colorSpace !== three.SRGBColorSpace) return false;

  const image = texture.image || {};
  const width = Number(image.width);
  const height = Number(image.height);
  const data = image.data;
  const pixelCount = width * height;
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) return false;

  if (
    texture.format === three.RGBAFormat
    && texture.type === three.UnsignedByteType
    && data instanceof Uint8Array
  ) {
    return false;
  }

  if (
    texture.format === three.RGBFormat
    && texture.type === three.UnsignedByteType
    && data instanceof Uint8Array
    && data.length === pixelCount * 3
  ) {
    const rgba = new Uint8Array(pixelCount * 4);
    for (let index = 0; index < pixelCount; index += 1) {
      const rgbOffset = index * 3;
      const rgbaOffset = index * 4;
      rgba[rgbaOffset] = data[rgbOffset];
      rgba[rgbaOffset + 1] = data[rgbOffset + 1];
      rgba[rgbaOffset + 2] = data[rgbOffset + 2];
      rgba[rgbaOffset + 3] = 255;
    }
    texture.image.data = rgba;
    texture.format = three.RGBAFormat;
    texture.type = three.UnsignedByteType;
    return true;
  }

  if (
    texture.format === three.RGBAFormat
    && data instanceof Uint8Array
    && data.length === pixelCount * 4
  ) {
    texture.type = three.UnsignedByteType;
    return true;
  }

  if (three.NoColorSpace && texture.colorSpace !== three.NoColorSpace) {
    texture.colorSpace = three.NoColorSpace;
    return true;
  }

  return false;
}

export function applyImmersiveWorldTextureQuality(object, {
  THREE: three = THREE,
  renderer = null
} = {}) {
  const facts = {
    inspectedMaterials: 0,
    inspectedTextures: 0,
    normalizedTextures: 0,
    inspectedPointMaterials: 0,
    normalizedPointMaterials: 0
  };
  const anisotropy = maxTextureAnisotropy(renderer);
  const seenTextures = new Set();

  object?.traverse?.((child) => {
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material].filter(Boolean);
    for (const material of materials) {
      facts.inspectedMaterials += 1;
      for (const texture of collectMaterialTextures(material)) {
        if (seenTextures.has(texture)) continue;
        seenTextures.add(texture);
        facts.inspectedTextures += 1;
        if (!texture.isDataTexture) continue;
        let changed = normalizeSrgbDataTextureUpload(texture, three);
        if (texture.magFilter === three.NearestFilter) {
          texture.magFilter = three.LinearFilter;
          changed = true;
        }
        if (texture.minFilter !== three.LinearFilter) {
          texture.minFilter = three.LinearFilter;
          changed = true;
        }
        if (texture.generateMipmaps) {
          texture.generateMipmaps = false;
          changed = true;
        }
        if (texture.anisotropy !== anisotropy) {
          texture.anisotropy = anisotropy;
          changed = true;
        }
        if (changed) {
          texture.needsUpdate = true;
          facts.normalizedTextures += 1;
        }
      }
      if (child?.isPoints && material?.isPointsMaterial) {
        facts.inspectedPointMaterials += 1;
        if (!material.map && !material.alphaMap) {
          material.map = softPointTextureFor(three, anisotropy);
          material.transparent = true;
          material.alphaTest = Math.max(number(material.alphaTest, 0), 0.01);
          material.needsUpdate = true;
          facts.normalizedPointMaterials += 1;
        }
      }
    }
  });

  return facts;
}

export function hashImmersiveWorldSeedText(value) {
  const text = String(value ?? 'seed');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

export function createImmersiveWorldSeededRandom(seed = 0, salt = '') {
  const seedNumber = Number(seed);
  const baseSeed = Number.isFinite(seedNumber)
    ? seedNumber >>> 0
    : hashImmersiveWorldSeedText(seed);
  let state = (baseSeed ^ hashImmersiveWorldSeedText(salt)) >>> 0;
  return function seededRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function finiteNumber(value, fallback) {
  if (value == null || value === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function positiveNumber(value, fallback) {
  const numeric = finiteNumber(value, fallback);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : fallback;
}

function sampleRadius({ radius = null, minRadius = null, maxRadius = null, random }) {
  const fixedRadius = positiveNumber(radius, null);
  const min = positiveNumber(minRadius, fixedRadius ?? 1);
  const max = Math.max(min, positiveNumber(maxRadius, fixedRadius ?? min));
  if (fixedRadius !== null && minRadius == null && maxRadius == null) return fixedRadius;
  return min + (max - min) * random();
}

function arcRadians(value, fallback = TAU) {
  const numeric = finiteNumber(value, fallback);
  if (numeric > 0 && numeric <= 1) return numeric * TAU;
  return Math.max(0, Math.min(TAU, numeric));
}

export function sampleImmersiveWorldSphereSurface({
  count = 1,
  radius = 6,
  minRadius = null,
  maxRadius = null,
  seed = 0,
  salt = 'sphere-surface',
  yBias = 0,
  arc = TAU,
  thetaOffset = 0,
  jitter = 0
} = {}) {
  const total = Math.max(0, Math.floor(finiteNumber(count, 0)));
  const random = createImmersiveWorldSeededRandom(seed, salt);
  const positions = [];
  const thetaSpan = arcRadians(arc);
  const usePartialArc = thetaSpan < TAU - 0.0001;
  const jitterAmount = Math.max(0, finiteNumber(jitter, 0));
  for (let index = 0; index < total; index += 1) {
    const progress = total <= 1 ? 0.5 : index / (total - 1);
    const y = clamp(
      1 - 2 * ((index + 0.5) / Math.max(total, 1)) + finiteNumber(yBias, 0) + (random() - 0.5) * jitterAmount,
      -0.98,
      0.98
    );
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = finiteNumber(thetaOffset, 0)
      + (usePartialArc ? (progress - 0.5) * thetaSpan : index * GOLDEN_ANGLE)
      + (random() - 0.5) * jitterAmount;
    const distance = sampleRadius({ radius, minRadius, maxRadius, random });
    positions.push([
      Number((Math.cos(theta) * ringRadius * distance).toFixed(6)),
      Number((y * distance).toFixed(6)),
      Number((Math.sin(theta) * ringRadius * distance).toFixed(6))
    ]);
  }
  return positions;
}

export function sampleImmersiveWorldSphereVolume({
  count = 1,
  minRadius = 2,
  maxRadius = 8,
  seed = 0,
  salt = 'sphere-volume',
  yBias = 0,
  arc = TAU,
  thetaOffset = 0,
  jitter = 0
} = {}) {
  const random = createImmersiveWorldSeededRandom(seed, `${salt}:radius`);
  return sampleImmersiveWorldSphereSurface({
    count,
    minRadius,
    maxRadius,
    seed,
    salt,
    yBias,
    arc,
    thetaOffset,
    jitter
  }).map((position) => {
    const length = Math.hypot(position[0], position[1], position[2]) || 1;
    const min = positiveNumber(minRadius, 2);
    const max = Math.max(min, positiveNumber(maxRadius, 8));
    const distance = Math.cbrt(min ** 3 + (max ** 3 - min ** 3) * random());
    return [
      Number(((position[0] / length) * distance).toFixed(6)),
      Number(((position[1] / length) * distance).toFixed(6)),
      Number(((position[2] / length) * distance).toFixed(6))
    ];
  });
}

export function sampleImmersiveWorldRing({
  count = 1,
  radius = 4,
  minRadius = null,
  maxRadius = null,
  axis = 'y',
  height = 0,
  seed = 0,
  salt = 'ring',
  arc = TAU,
  thetaOffset = 0,
  jitter = 0
} = {}) {
  const total = Math.max(0, Math.floor(finiteNumber(count, 0)));
  const random = createImmersiveWorldSeededRandom(seed, salt);
  const positions = [];
  const thetaSpan = arcRadians(arc);
  const jitterAmount = Math.max(0, finiteNumber(jitter, 0));
  const ringAxis = String(axis || 'y').toLowerCase();
  for (let index = 0; index < total; index += 1) {
    const progress = total <= 1 ? 0.5 : index / total;
    const theta = finiteNumber(thetaOffset, 0) + progress * thetaSpan + (random() - 0.5) * jitterAmount;
    const distance = sampleRadius({ radius, minRadius, maxRadius, random });
    const x = Math.cos(theta) * distance;
    const y = finiteNumber(height, 0) + (random() - 0.5) * jitterAmount;
    const z = Math.sin(theta) * distance;
    if (ringAxis === 'x') positions.push([Number(y.toFixed(6)), Number(x.toFixed(6)), Number(z.toFixed(6))]);
    else if (ringAxis === 'z') positions.push([Number(x.toFixed(6)), Number(z.toFixed(6)), Number(y.toFixed(6))]);
    else positions.push([Number(x.toFixed(6)), Number(y.toFixed(6)), Number(z.toFixed(6))]);
  }
  return positions;
}

function centeredPosition(position, center = null) {
  const offset = Array.isArray(center) && center.length === 3 ? center.map(Number) : [0, 0, 0];
  if (!offset.every(Number.isFinite)) return position;
  return [
    Number((position[0] + offset[0]).toFixed(6)),
    Number((position[1] + offset[1]).toFixed(6)),
    Number((position[2] + offset[2]).toFixed(6))
  ];
}

function dimensionFromOptions(options, key, fallback) {
  const size = finiteNumber(options.size, null);
  return positiveNumber(options[key], size ?? fallback);
}

function axisOrientedPosition(axis, primary, a, b) {
  const normalized = String(axis || 'y').toLowerCase();
  if (normalized === 'x') return [primary, a, b];
  if (normalized === 'z') return [a, b, primary];
  return [a, primary, b];
}

function sampleBoxPosition({ random, width = 4, height = 4, depth = 4, surface = false }) {
  const x = (random() - 0.5) * width;
  const y = (random() - 0.5) * height;
  const z = (random() - 0.5) * depth;
  if (!surface) return [x, y, z];
  const face = Math.floor(random() * 6);
  if (face === 0) return [-width / 2, y, z];
  if (face === 1) return [width / 2, y, z];
  if (face === 2) return [x, -height / 2, z];
  if (face === 3) return [x, height / 2, z];
  if (face === 4) return [x, y, -depth / 2];
  return [x, y, depth / 2];
}

function sampleCylinderPosition({ random, radius = 4, minRadius = 0, height = 4, axis = 'y', surface = false, arc = TAU, thetaOffset = 0 }) {
  const theta = finiteNumber(thetaOffset, 0) + random() * arcRadians(arc);
  const min = positiveNumber(minRadius, 0);
  const max = Math.max(min, positiveNumber(radius, 4));
  const sideOrCap = surface ? random() : 0;
  const radial = surface && sideOrCap < 0.72
    ? max
    : Math.sqrt(min * min + (max * max - min * min) * random());
  const primary = surface && sideOrCap >= 0.72
    ? (sideOrCap < 0.86 ? -height / 2 : height / 2)
    : (random() - 0.5) * height;
  return axisOrientedPosition(axis, primary, Math.cos(theta) * radial, Math.sin(theta) * radial);
}

function sampleConePosition({ random, radius = 4, height = 4, axis = 'y', surface = false, arc = TAU, thetaOffset = 0 }) {
  const theta = finiteNumber(thetaOffset, 0) + random() * arcRadians(arc);
  const y = (random() - 0.5) * height;
  const heightProgress = clamp((y + height / 2) / Math.max(height, 0.0001), 0, 1);
  const localRadius = Math.max(0, radius * (1 - heightProgress));
  const radial = surface ? localRadius : Math.sqrt(random()) * localRadius;
  return axisOrientedPosition(axis, y, Math.cos(theta) * radial, Math.sin(theta) * radial);
}

function sampleDiscPosition({ random, radius = 4, minRadius = 0, axis = 'y', height = 0, surface = false, arc = TAU, thetaOffset = 0 }) {
  const theta = finiteNumber(thetaOffset, 0) + random() * arcRadians(arc);
  const min = positiveNumber(minRadius, 0);
  const max = Math.max(min, positiveNumber(radius, 4));
  const radial = surface ? max : Math.sqrt(min * min + (max * max - min * min) * random());
  return axisOrientedPosition(axis, finiteNumber(height, 0), Math.cos(theta) * radial, Math.sin(theta) * radial);
}

function sampleTorusPosition({ random, radius = 4, tubeRadius = 0.6, axis = 'y', surface = false, arc = TAU, thetaOffset = 0 }) {
  const theta = finiteNumber(thetaOffset, 0) + random() * arcRadians(arc);
  const tubeTheta = random() * TAU;
  const tube = surface ? tubeRadius : Math.sqrt(random()) * tubeRadius;
  const radial = radius + Math.cos(tubeTheta) * tube;
  const primary = Math.sin(tubeTheta) * tube;
  return axisOrientedPosition(axis, primary, Math.cos(theta) * radial, Math.sin(theta) * radial);
}

export function sampleImmersiveWorldVolume({
  shape = 'sphere',
  mode = null,
  surface = null,
  count = 1,
  seed = 0,
  salt = 'volume',
  center = null,
  ...options
} = {}) {
  const normalizedShape = String(shape || 'sphere').toLowerCase().replace(/[_\s]+/g, '-');
  const shapeSurface = surface === null
    ? ['surface', 'shell', 'outline'].includes(String(mode || '').toLowerCase())
      || normalizedShape.endsWith('-surface')
      || normalizedShape === 'shell'
    : Boolean(surface);
  const total = Math.max(0, Math.floor(finiteNumber(count, 0)));
  if (!total) return [];
  if (normalizedShape === 'sphere' || normalizedShape === 'shell' || normalizedShape === 'sphere-surface' || normalizedShape === 'sphere-volume') {
    const sphereOptions = { ...options, count: total, seed, salt, center: null };
    const positions = shapeSurface || normalizedShape === 'sphere-surface' || normalizedShape === 'shell'
      ? sampleImmersiveWorldSphereSurface(sphereOptions)
      : sampleImmersiveWorldSphereVolume(sphereOptions);
    return positions.map((position) => centeredPosition(position, center));
  }
  if (normalizedShape === 'ring' || normalizedShape === 'circle') {
    return sampleImmersiveWorldRing({ ...options, count: total, seed, salt })
      .map((position) => centeredPosition(position, center));
  }

  const random = createImmersiveWorldSeededRandom(seed, `${salt}:${normalizedShape}:${shapeSurface ? 'surface' : 'volume'}`);
  const width = dimensionFromOptions(options, 'width', 4);
  const height = dimensionFromOptions(options, 'height', 4);
  const depth = dimensionFromOptions(options, 'depth', 4);
  const radius = positiveNumber(options.radius, options.maxRadius ?? Math.max(width, depth) / 2);
  const positions = [];
  for (let index = 0; index < total; index += 1) {
    let position;
    if (normalizedShape === 'box' || normalizedShape === 'cube' || normalizedShape === 'rect' || normalizedShape === 'rectangular-prism') {
      position = sampleBoxPosition({ random, width, height, depth, surface: shapeSurface });
    } else if (normalizedShape === 'cylinder' || normalizedShape === 'tube') {
      position = sampleCylinderPosition({ random, radius, minRadius: options.minRadius, height, axis: options.axis, surface: shapeSurface, arc: options.arc, thetaOffset: options.thetaOffset });
    } else if (normalizedShape === 'cone') {
      position = sampleConePosition({ random, radius, height, axis: options.axis, surface: shapeSurface, arc: options.arc, thetaOffset: options.thetaOffset });
    } else if (normalizedShape === 'disc' || normalizedShape === 'disk' || normalizedShape === 'plane') {
      position = sampleDiscPosition({ random, radius, minRadius: options.minRadius, axis: options.axis, height: options.planeOffset ?? options.offset ?? 0, surface: shapeSurface, arc: options.arc, thetaOffset: options.thetaOffset });
    } else if (normalizedShape === 'torus' || normalizedShape === 'donut') {
      position = sampleTorusPosition({ random, radius, tubeRadius: positiveNumber(options.tubeRadius, Math.max(0.1, radius * 0.18)), axis: options.axis, surface: shapeSurface, arc: options.arc, thetaOffset: options.thetaOffset });
    } else {
      position = shapeSurface
        ? sampleImmersiveWorldSphereSurface({ ...options, count: 1, seed, salt: `${salt}:${index}` })[0]
        : sampleImmersiveWorldSphereVolume({ ...options, count: 1, seed, salt: `${salt}:${index}` })[0];
    }
    positions.push(centeredPosition(position.map((value) => Number(value.toFixed(6))), center));
  }
  return positions;
}

function applyVector3(target, value, fallback) {
  const source = Array.isArray(value) && value.length === 3 ? value : fallback;
  if (!Array.isArray(source)) return false;
  const values = source.map(Number);
  if (!values.every(Number.isFinite)) return false;
  target.set(values[0], values[1], values[2]);
  return true;
}

function vector3FromValue(value) {
  const parsed = vector3(value, null);
  return parsed ? new THREE.Vector3(parsed[0], parsed[1], parsed[2]) : null;
}

function firstVector3FromValues(...values) {
  for (const value of values) {
    const parsed = vector3FromValue(value);
    if (parsed) return parsed;
  }
  return null;
}

function normalizeFacingMode(options = {}) {
  const raw = options.facing ?? options.orientation;
  if (raw != null) {
    const mode = String(raw).trim().toLowerCase().replace(/[_\s]+/g, '-');
    if (['camera', 'face-camera', 'camera-facing', 'billboard', 'screen', 'screen-facing'].includes(mode)) return 'camera';
    if (['target', 'face-target', 'look-at', 'look-at-target', 'viewer', 'origin', 'center', 'radial-in', 'inward'].includes(mode)) return 'target';
    if (['radial-out', 'outward', 'away-from-center'].includes(mode)) return 'radial-out';
    if (['none', 'world', 'fixed', 'rotation'].includes(mode)) return 'none';
  }
  if (options.faceCamera === true || options.billboard === true) return 'camera';
  if (options.faceOutward === true) return 'radial-out';
  if (options.faceTarget) return 'target';
  return 'none';
}

function applyFrontFacingDirection(object, direction) {
  if (!object?.quaternion || !direction || direction.lengthSq() < 0.000001) return false;
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.normalize());
  return true;
}

function applyImmersiveWorldFacingOrientation(object, options = {}) {
  if (!object?.isObject3D) return false;
  const mode = normalizeFacingMode(options);
  if (mode === 'none') return false;
  if (mode === 'camera') {
    const cameraQuaternion = options.camera?.quaternion;
    if (cameraQuaternion?.isQuaternion) {
      object.quaternion.copy(cameraQuaternion);
      return true;
    }
    const cameraPosition = firstVector3FromValues(options.camera?.position, options.cameraPosition);
    if (!cameraPosition) return false;
    return applyFrontFacingDirection(object, cameraPosition.sub(object.position));
  }
  const center = firstVector3FromValues(options.center, options.origin, [0, 0, 0]);
  const target = mode === 'radial-out'
    ? center
    : firstVector3FromValues(options.target, options.lookAt, options.lookAtTarget, options.faceTarget, center);
  if (!target) return false;
  const direction = mode === 'radial-out'
    ? object.position.clone().sub(target)
    : target.sub(object.position);
  return applyFrontFacingDirection(object, direction);
}

export function applyImmersiveWorldPartPlacement(object, params = {}) {
  if (!object?.isObject3D) return { applied: false };
  const placement = params?.placement && typeof params.placement === 'object' ? params.placement : params;
  const positionApplied = applyVector3(object.position, placement.position, null);
  const rotationApplied = applyVector3(object.rotation, placement.rotation, null);
  const scale = placement.scale;
  let scaleApplied = false;
  if (Array.isArray(scale)) {
    scaleApplied = applyVector3(object.scale, scale, null);
  } else if (Number.isFinite(Number(scale))) {
    object.scale.setScalar(Number(scale));
    scaleApplied = true;
  }
  const facingApplied = applyImmersiveWorldFacingOrientation(object, placement);
  return { applied: positionApplied || rotationApplied || scaleApplied || facingApplied, positionApplied, rotationApplied, scaleApplied, facingApplied };
}

export function createImmersiveWorldInstancedShapeField(THREE, {
  geometry,
  material,
  positions = [],
  scales = 1,
  rotations = null,
  facing = null,
  orientation = null,
  faceCamera = false,
  billboard = false,
  camera = null,
  cameraPosition = null,
  faceTarget = null,
  faceOutward = false,
  target = null,
  lookAt = null,
  lookAtTarget = null,
  center = null,
  origin = null,
  name = 'immersive-world-instanced-shape-field'
} = {}) {
  if (!geometry || !material) throw new Error('Instanced shape field requires geometry and material.');
  const mesh = new THREE.InstancedMesh(geometry, material, positions.length);
  const matrixObject = new THREE.Object3D();
  mesh.name = name;
  positions.forEach((position, index) => {
    applyVector3(matrixObject.position, position, [0, 0, 0]);
    const scale = Array.isArray(scales) ? scales[index] : scales;
    if (Array.isArray(scale)) applyVector3(matrixObject.scale, scale, [1, 1, 1]);
    else matrixObject.scale.setScalar(Number.isFinite(Number(scale)) ? Number(scale) : 1);
    if (Array.isArray(rotations?.[index])) applyVector3(matrixObject.rotation, rotations[index], [0, 0, 0]);
    else matrixObject.rotation.set(0, 0, 0);
    if (!Array.isArray(rotations?.[index])) {
      applyImmersiveWorldFacingOrientation(matrixObject, {
        facing,
        orientation,
        faceCamera,
        billboard,
        camera,
        cameraPosition,
        faceTarget,
        faceOutward,
        target,
        lookAt,
        lookAtTarget,
        center,
        origin
      });
    }
    matrixObject.updateMatrix();
    mesh.setMatrixAt(index, matrixObject.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function normalizedCurveProgress(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return ((numeric % 1) + 1) % 1;
}

function splineProgressFromOptions({
  progress = 0,
  elapsedSeconds = null,
  speed = 0,
  duration = null,
  phase = 0,
  offset = 0
} = {}) {
  const elapsed = Number(elapsedSeconds);
  const durationSeconds = positiveNumber(duration, 0);
  const base = Number.isFinite(elapsed)
    ? durationSeconds > 0
      ? elapsed / durationSeconds
      : elapsed * finiteNumber(speed, 0)
    : finiteNumber(progress, 0);
  return normalizedCurveProgress(base + finiteNumber(phase, 0) + finiteNumber(offset, 0));
}

function splineControlPoints(points) {
  const parsed = (Array.isArray(points) ? points : [])
    .map((point) => vector3FromValue(point))
    .filter(Boolean);
  if (parsed.length >= 2) return parsed;
  return [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)];
}

export function createImmersiveWorldSplinePath(THREE, {
  points = [],
  closed = false,
  curveType = 'centripetal',
  tension = 0.5,
  progressOffset = 0
} = {}) {
  const normalizedCurveType = String(curveType).trim().toLowerCase();
  const safeCurveType = ['centripetal', 'chordal', 'catmullrom'].includes(normalizedCurveType)
    ? normalizedCurveType
    : 'centripetal';
  const controlPoints = splineControlPoints(points);
  const curve = new THREE.CatmullRomCurve3(controlPoints, closed === true, safeCurveType, finiteNumber(tension, 0.5));
  const tempPoint = new THREE.Vector3();
  const tempTangent = new THREE.Vector3();

  const normalizePathProgress = (progress) => normalizedCurveProgress(progress + finiteNumber(progressOffset, 0));
  const sampleVector = (progress = 0, target = new THREE.Vector3()) => curve.getPointAt(normalizePathProgress(progress), target);
  const tangentVector = (progress = 0, target = new THREE.Vector3()) => curve.getTangentAt(normalizePathProgress(progress), target).normalize();
  const sample = (progress = 0) => {
    sampleVector(progress, tempPoint);
    return [tempPoint.x, tempPoint.y, tempPoint.z].map((value) => Number(value.toFixed(6)));
  };

  const applyToObject = (object, options = {}) => {
    if (!object?.isObject3D) return { applied: false };
    const progress = splineProgressFromOptions(options);
    sampleVector(progress, object.position);
    let orientationApplied = false;
    if (options.orientToPath === true || options.facePath === true || options.facing === 'path') {
      tangentVector(progress, tempTangent);
      orientationApplied = applyFrontFacingDirection(object, tempTangent);
    }
    return { applied: true, progress, orientationApplied };
  };

  const writePositions = (target, options = {}) => {
    const attribute = target?.isBufferAttribute ? target : target?.getAttribute?.('position');
    const array = attribute?.array || target?.array || target;
    if (!array || typeof array.length !== 'number') return { updated: false, count: 0 };
    const stride = Math.max(3, Math.floor(finiteNumber(options.stride, 3)));
    const available = attribute?.count ?? Math.floor(array.length / stride);
    const total = Math.max(0, Math.min(Math.floor(finiteNumber(options.count, available)), available));
    const phaseStep = options.phaseStep == null
      ? (total > 0 ? 1 / total : 0)
      : finiteNumber(options.phaseStep, 0);
    const baseOffset = finiteNumber(options.offset, 0);
    for (let index = 0; index < total; index += 1) {
      const offset = Array.isArray(options.offsets) ? finiteNumber(options.offsets[index], index * phaseStep) : index * phaseStep;
      const progress = splineProgressFromOptions({ ...options, offset: baseOffset + offset });
      sampleVector(progress, tempPoint);
      const base = index * stride;
      array[base] = tempPoint.x;
      array[base + 1] = tempPoint.y;
      array[base + 2] = tempPoint.z;
    }
    if (attribute) attribute.needsUpdate = true;
    return { updated: true, count: total };
  };

  return {
    curve,
    controlPoints,
    closed: closed === true,
    sample,
    sampleVector,
    tangent: (progress = 0) => {
      tangentVector(progress, tempTangent);
      return [tempTangent.x, tempTangent.y, tempTangent.z].map((value) => Number(value.toFixed(6)));
    },
    tangentVector,
    applyToObject,
    writePositions,
    updateParticles: writePositions
  };
}

function createImmersiveWorldPlacementUtilities(THREE) {
  return {
    sampleSphereSurface: sampleImmersiveWorldSphereSurface,
    sampleSphereVolume: sampleImmersiveWorldSphereVolume,
    sampleRing: sampleImmersiveWorldRing,
    sampleVolume: sampleImmersiveWorldVolume,
    sampleShape: sampleImmersiveWorldVolume,
    applyPartPlacement: applyImmersiveWorldPartPlacement,
    createInstancedShapeField: (options) => createImmersiveWorldInstancedShapeField(THREE, options),
    createSplinePath: (options) => createImmersiveWorldSplinePath(THREE, options)
  };
}

function vector3(value, fallback) {
  if (Array.isArray(value) && value.length === 3) {
    const values = value.map(Number);
    if (values.every(Number.isFinite)) return values;
  }
  if (value && typeof value === 'object') {
    const values = [Number(value.x), Number(value.y), Number(value.z)];
    if (values.every(Number.isFinite)) return values;
  }
  return fallback;
}

function orbitPoseFromCamera({ position = [0, 0, 12], target = [0, 0, 0], fallbackRadius = 12 } = {}) {
  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];
  const rawRadius = Math.hypot(dx, dy, dz);
  const radius = Number.isFinite(rawRadius) && rawRadius > 0.0001 ? rawRadius : fallbackRadius;
  const theta = Math.atan2(dx, dz);
  const phi = Math.acos(clamp(dy / Math.max(radius, 0.0001), -1, 1));
  return {
    radius,
    theta: Number.isFinite(theta) ? theta : DEFAULT_ORBIT_POSE.theta,
    phi: Number.isFinite(phi) ? phi : DEFAULT_ORBIT_POSE.phi
  };
}

export function isWorldEnvironmentPart(part = {}) {
  const id = String(part?.partId || part?.id || '').trim().toLowerCase();
  const role = String(part?.role || '').trim().toLowerCase();
  return id === WORLD_ENVIRONMENT_PART_ID || role === WORLD_ENVIRONMENT_PART_ID;
}

export function hasAuthoredImmersiveWorldEnvironmentPart(world = {}) {
  const parts = Array.isArray(world?.parts) ? world.parts : [];
  return parts.some((part) => isWorldEnvironmentPart(part) && Boolean(asObject(part?.moduleRef || part?.module, null)));
}

export function shouldCreateImmersiveWorldBaseEnvironmentShell(world = {}) {
  const environment = asObject(world?.environment);
  if (environment.baseShell === false || environment.builtInShell === false || environment.createBaseShell === false) return false;
  if (environment.baseShell === true || environment.builtInShell === true || environment.createBaseShell === true) return true;
  return !hasAuthoredImmersiveWorldEnvironmentPart(world);
}

export function initializeImmersiveWorldCameraControls(scene, { bindInput = true } = {}) {
  scene.controls = { ...LEGACY_ORBIT_CONTROLS };
  scene.orbit = {
    target: new THREE.Vector3(0, 0, 0),
    radius: DEFAULT_ORBIT_POSE.radius,
    theta: DEFAULT_ORBIT_POSE.theta,
    phi: DEFAULT_ORBIT_POSE.phi,
    thetaVel: 0,
    phiVel: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    userControlLocked: false
  };
  scene.baseOrbitPose = { ...DEFAULT_ORBIT_POSE };
  scene.baseOrbitTarget = new THREE.Vector3(0, 0, 0);
  scene.viewportOrbitFrame = { radiusMultiplier: 1, phiOffset: 0, targetYOffset: 0 };
  scene.cameraMotionEnabled = false;
  scene.cameraBeats = null;
  scene.cameraCycleSeconds = 24;
  scene.styleFingerprint = scene.styleFingerprint || { cameraSway: 0 };

  if (bindInput && scene.canvas) {
    scene.cameraInputTeardown?.();
    scene.cameraInputTeardown = bindOrbitInput(scene);
  }

  updateCameraFromOrbit(scene);
  return {
    controls: scene.controls,
    orbit: scene.orbit,
    teardown: scene.cameraInputTeardown || null
  };
}

export function applyImmersiveWorldCameraConfig(scene, world = {}) {
  const camera = asObject(world.camera);
  const environment = asObject(world.environment);
  const position = vector3(camera.position, [0, 2.2, number(camera.radius, 14)]);
  const target = vector3(camera.target, [0, 0, 0]);
  const pose = orbitPoseFromCamera({
    position,
    target,
    fallbackRadius: number(camera.radius, DEFAULT_ORBIT_POSE.radius)
  });

  scene.camera.near = number(camera.near, 0.1);
  const requestedFar = number(camera.far, 220);
  const explicitSkyboxRadius = Number(environment.skyboxRadius);
  const skyboxRadius = Number.isFinite(explicitSkyboxRadius) && explicitSkyboxRadius > 0
    || isImmersiveWorldSkyboxMode(environment.kind)
    || isImmersiveWorldSkyboxMode(environment.renderMode)
    || isImmersiveWorldSkyboxMode(environment.mode)
    ? resolveImmersiveWorldSkyboxRadius(world, { fallback: 0, min: 0 })
    : 0;
  scene.camera.far = Math.max(requestedFar, skyboxRadius ? skyboxRadius * 1.05 : requestedFar);
  scene.camera.fov = number(camera.fov, 65);
  scene.camera.updateProjectionMatrix();

  scene.baseOrbitTarget.set(target[0], target[1], target[2]);
  scene.baseOrbitPose.radius = clamp(pose.radius, scene.controls.minDistance, scene.controls.maxDistance);
  scene.baseOrbitPose.theta = pose.theta;
  scene.baseOrbitPose.phi = pose.phi;

  scene.orbit.thetaVel = 0;
  scene.orbit.phiVel = 0;
  scene.orbit.dragging = false;
  scene.orbit.userControlLocked = false;
  applyViewportOrbitFrame(scene, { resetOrbit: true });
  return {
    source: 'world.camera',
    owner: camera.owner || null,
    requested: {
      position,
      target,
      near: camera.near ?? null,
      far: camera.far ?? null,
      fov: camera.fov ?? null
    },
    applied: {
      near: scene.camera.near,
      far: scene.camera.far,
      fov: scene.camera.fov,
      baseOrbitTarget: scene.baseOrbitTarget.toArray(),
      baseOrbitPose: { ...scene.baseOrbitPose },
      viewportOrbitFrame: { ...scene.viewportOrbitFrame }
    },
    alignment: {
      status: 'aligned',
      source: 'world.camera',
      appliedByFrontend: true,
      previewAndFrontendRuntime: 'shared-immersive-world-camera-config',
      viewportFrameApplied: true
    }
  };
}

export function updateImmersiveWorldCameraControlsForFrame(scene, { time = 0, motionIntensity = 1 } = {}) {
  if (!scene.captureMode) {
    const canAutoMoveCamera = !scene.orbit.dragging && !scene.orbit.userControlLocked;
    if (scene.controls.autoRotate && canAutoMoveCamera) {
      scene.orbit.theta += 0.001 * scene.controls.autoRotateSpeed * 4 * motionIntensity;
    }
    scene.orbit.theta += scene.orbit.thetaVel;
    scene.orbit.phi += scene.orbit.phiVel;
    scene.orbit.thetaVel *= 1 - scene.controls.dampingFactor;
    scene.orbit.phiVel *= 1 - scene.controls.dampingFactor;
  }

  updateCameraFromOrbit(scene);
  return {
    time,
    radius: scene.orbit.radius,
    theta: scene.orbit.theta,
    phi: scene.orbit.phi
  };
}

export function buildImmersiveWorldFrameFacts(scene) {
  const elapsedSeconds = scene.captureMode ? scene.captureTime : scene.clock.getElapsedTime();
  const previousElapsedSeconds = Number.isFinite(scene.previousElapsedSeconds)
    ? scene.previousElapsedSeconds
    : null;
  const rawDeltaSeconds = previousElapsedSeconds == null ? 0 : elapsedSeconds - previousElapsedSeconds;
  const deltaSeconds = scene.captureMode
    ? 0
    : clamp(rawDeltaSeconds, 0, MAX_FRAME_DELTA_SECONDS);
  scene.previousElapsedSeconds = elapsedSeconds;
  return {
    time: elapsedSeconds,
    elapsedSeconds,
    deltaSeconds,
    rawDeltaSeconds,
    captureMode: scene.captureMode,
    frameCount: scene.renderFrameCount,
    motionIntensity: scene.motionIntensity,
    camera: scene.camera
  };
}

export function applyImmersiveWorldPostUniforms(scene, frameFacts = {}) {
  const transform = scene.outputColorTransform || scene.postBase || resolveImmersiveWorldOutputColorTransform({});
  const elapsedSeconds = Number(frameFacts.elapsedSeconds ?? frameFacts.time ?? 0);
  scene.postUniforms.uTime.value = Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0;
  scene.postUniforms.uHueShift.value = transform.hueShift;
  scene.postUniforms.uSaturation.value = transform.saturation;
  scene.postUniforms.uContrast.value = transform.contrast;
  scene.postUniforms.uVignette.value = transform.vignette;
  scene.postUniforms.uDistortion.value = transform.distortion;
  scene.postUniforms.uExposureMul.value = transform.exposure;
  return transform;
}

export function renderImmersiveWorldFrame(scene, frameFacts = {}) {
  const transform = applyImmersiveWorldPostUniforms(scene, frameFacts);
  if (scene.tslPostPipeline) {
    applyOutputColorTransformToTslControls(scene.postUniforms, transform, frameFacts);
    scene.tslPostPipeline.render();
    return frameFacts;
  }

  if (scene.rendererSelection?.useWebGPURenderer || !scene.renderTarget || !scene.postScene || !scene.postCamera) {
    scene.renderer.setRenderTarget?.(null);
    scene.renderer.render(scene.scene, scene.camera);
    return frameFacts;
  }

  if (isNeutralImmersiveWorldOutputColorTransform(transform)) {
    scene.renderer.setRenderTarget(null);
    scene.renderer.render(scene.scene, scene.camera);
    return frameFacts;
  }

  scene.renderer.setRenderTarget(scene.renderTarget);
  scene.renderer.render(scene.scene, scene.camera);
  scene.renderer.setRenderTarget(null);
  scene.renderer.render(scene.postScene, scene.postCamera);
  return frameFacts;
}

function measureObjectRadius(object) {
  const bounds = new THREE.Box3().setFromObject(object);
  if (bounds.isEmpty()) return null;
  const sphere = new THREE.Sphere();
  bounds.getBoundingSphere(sphere);
  return Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : null;
}

export function adaptWorldEnvironmentObject({ object, part, world } = {}) {
  if (!object?.isObject3D || !isWorldEnvironmentPart(part)) {
    return { adapted: false, reason: 'not-world-environment' };
  }
  if (!shouldUseImmersiveWorldSkybox({ object, part, world })) {
    return { adapted: false, reason: 'environment-artwork' };
  }

  const targetRadius = resolveImmersiveWorldSkyboxRadius(world);
  const currentRadius = measureObjectRadius(object) || 1;
  const scaleMultiplier = targetRadius / currentRadius;
  object.scale.multiplyScalar(scaleMultiplier);
  applyImmersiveWorldSkyboxDefaults(THREE, object, { radius: targetRadius });

  return {
    adapted: true,
    targetRadius,
    previousRadius: currentRadius,
    scaleMultiplier
  };
}

function resolveCreatePart(module) {
  return module?.createImmersiveWorldPart || module?.createPart || module?.create || module?.default || null;
}

function normalizeModuleResult(result) {
  if (!result) return { object: null, update: null, dispose: null };
  if (result.isObject3D) return { object: result, update: null, dispose: null };
  return {
    object: result.object || result.obj || null,
    update: typeof result.update === 'function' ? result.update : null,
    dispose: typeof result.dispose === 'function' ? result.dispose : null
  };
}

export class ArtworkScene {
  constructor(canvas, {
    rendererRequest = RENDERER_MODES.WEBGL_LEGACY,
    postProcessingRequest = POST_PROCESSING_MODES.WEBGL_GLSL_POST,
    captureMode = false,
    art = null,
    navigatorRef = typeof window !== 'undefined' ? window.navigator : null
  } = {}) {
    this.canvas = canvas;
    this.rendererCompatibilityFacts = resolveImmersiveWorldRendererCompatibilityFacts(art);
    this.rendererRequest = resolveImmersiveWorldRendererRequest({
      art,
      requestedMode: rendererRequest
    });
    this.postProcessingRequest = this.rendererRequest === RENDERER_MODES.WEBGL_LEGACY
      ? postProcessingRequest
      : POST_PROCESSING_MODES.WEBGPU_TSL_POST;
    this.rendererSceneFeatures = collectRendererSceneFeatures({
      art,
      sceneKind: 'immersive-world-v1',
      adapterFeatures: {
        glslShaderMaterial: this.rendererCompatibilityFacts.webgpuCompatible !== true,
        rawShaderMaterial: false,
        webgpuCompatible: this.rendererCompatibilityFacts.webgpuCompatible === true
      }
    });
    this.rendererSelection = resolveRendererRuntimeSelection({
      requestedMode: this.rendererRequest,
      captureMode,
      sceneFeatures: this.rendererSceneFeatures,
      navigatorRef
    });
    this.rendererRuntime = this.rendererSelection.useWebGPURenderer
      ? createWebGPURendererRuntime({
        canvas,
        devicePixelRatio: window.devicePixelRatio || 1,
        forceWebGL: this.rendererSelection.forceWebGL,
        rendererMode: this.rendererSelection.rendererMode,
        rendererBackend: this.rendererSelection.rendererBackend,
        rendererFallbackReason: this.rendererSelection.rendererFallbackReason
      })
      : createWebGLRendererRuntime({
        canvas,
        devicePixelRatio: window.devicePixelRatio || 1,
        rendererFallbackReason: this.rendererSelection.rendererFallbackReason
      });
    this.renderer = this.rendererRuntime.renderer;
    this.rendererInitialized = false;
    this.rendererInitError = null;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, 1, 0.1, 200);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.clock = createSceneElapsedTimer(THREE, { documentRef: window.document });
    this.updateHooks = [];
    this.disposeHooks = [];
    this.tslPostPipeline = null;
    if (this.rendererSelection.useWebGPURenderer) {
      this.renderTarget = null;
      this.renderTargetSamples = 0;
      this.postScene = null;
      this.postCamera = null;
      this.postUniforms = createTslPostProcessingControls();
      this.postQuad = null;
    } else {
      const { renderTarget, samples } = createPostRenderTarget(this.renderer);
      this.renderTarget = renderTarget;
      this.renderTargetSamples = samples;
      const postPass = createImmersiveWorldPostPass(this.renderTarget);
      this.postScene = postPass.postScene;
      this.postCamera = postPass.postCamera;
      this.postUniforms = postPass.postUniforms;
      this.postQuad = postPass.postQuad;
    }
    this.outputColorTransform = resolveImmersiveWorldOutputColorTransform({});
    this.postBase = this.outputColorTransform;
    this.motionIntensity = 1;
    this.captureMode = false;
    this.captureTime = 1.234;
    this.previousElapsedSeconds = null;
    this.sceneAssemblyReport = null;
    this.applyConfigGeneration = 0;
    this.cameraInputTeardown = null;
    initializeImmersiveWorldCameraControls(this);
    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    this.frameLifecycle = createSceneFrameLifecycle({
      onResize: () => this.resizeFrameTargets(),
      onFrame: ({ timestamp }) => this.renderFrame({ timestamp }),
      timing: createBrowserTimingAdapter(window),
      resizeAdapter: createBrowserResizeAdapter({
        canvas: this.canvas,
        target: window,
        resizeObserverCtor: typeof ResizeObserver !== 'undefined' ? ResizeObserver : undefined
      })
    });
    this.rendererReady = this.rendererRuntime.initialize()
      .then(() => {
        this.rendererInitialized = true;
        if (this.rendererSelection.useWebGPURenderer && this.postProcessingRequest === POST_PROCESSING_MODES.WEBGPU_TSL_POST) {
          this.tslPostPipeline = createTslRenderPipeline({
            renderer: this.renderer,
            scene: this.scene,
            camera: this.camera,
            controls: this.postUniforms,
            vignetteMode: 'immersive'
          });
        }
        this.frameLifecycle.start();
        return this.renderer;
      })
      .catch((error) => {
        this.rendererInitError = error;
        throw error;
      });
  }

  getAssemblyReport() {
    return this.sceneAssemblyReport;
  }

  getRendererDiagnostics() {
    const outputColorTransformMode = this.rendererSelection?.useWebGPURenderer
      ? (this.postProcessingRequest === POST_PROCESSING_MODES.WEBGPU_TSL_POST
          ? POST_PROCESSING_MODES.WEBGPU_TSL_POST
          : WEBGPU_DIRECT_OUTPUT_COLOR_TRANSFORM_MODE)
      : isNeutralImmersiveWorldOutputColorTransform(this.outputColorTransform)
          ? 'webgl-direct'
          : POST_PROCESSING_MODES.WEBGL_GLSL_POST;
    return this.rendererRuntime?.getDiagnostics?.({
      outputColorTransformMode
    }) || describeRendererDiagnostics(this.renderer, {
      outputColorTransformMode
    });
  }

  setMotionIntensity(intensity = 1) {
    this.motionIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));
  }

  setCaptureMode(enabled = false, freezeTime = 1.234) {
    this.captureMode = Boolean(enabled);
    this.captureTime = Number.isFinite(freezeTime) ? freezeTime : 1.234;
    this.previousElapsedSeconds = null;
    this.setMotionIntensity(this.captureMode ? 0 : this.motionIntensity);
  }

  clearWorld() {
    this.disposeHooks.splice(0).forEach((dispose) => dispose());
    while (this.group.children.length) {
      const child = this.group.children[0];
      this.group.remove(child);
      disposeObjectTree(child);
    }
    this.updateHooks = [];
    this.previousElapsedSeconds = null;
  }

  applyEnvironment(world) {
    const environment = asObject(world.environment);
    const palette = asObject(world.palette);
    const bg = color(environment.color || palette.background || palette.bg, '#090b12');
    this.scene.background = new THREE.Color(bg);
    this.scene.fog = new THREE.FogExp2(bg, number(environment.fogDensity, 0.018));

    const radius = resolveImmersiveWorldSkyboxRadius(world);
    if (!shouldCreateImmersiveWorldBaseEnvironmentShell(world)) {
      return {
        kind: environment.kind || 'skybox-field',
        radius,
        shellCreated: false,
        shellReason: 'authored-world-environment-part'
      };
    }

    const geometry = new THREE.SphereGeometry(radius, 48, 24);
    const material = new THREE.MeshBasicMaterial({
      color: color(environment.fieldColor || palette.field || bg, bg),
      side: THREE.BackSide,
      transparent: true,
      opacity: number(environment.opacity, 0.9),
      depthWrite: false,
      depthTest: true,
      fog: false,
      toneMapped: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'immersive-world-environment-shell';
    applyImmersiveWorldSkyboxDefaults(THREE, mesh, { radius, renderOrder: -1100 });
    this.group.add(mesh);
    return { kind: environment.kind || 'skybox-field', radius, shellCreated: true };
  }

  applyCamera(world) {
    return applyImmersiveWorldCameraConfig(this, world);
  }

  applyLighting(world) {
    const lighting = asObject(world.lighting);
    const ambient = new THREE.AmbientLight(color(lighting.ambientColor, '#8aa0c8'), number(lighting.ambientIntensity, 0.62));
    const key = new THREE.DirectionalLight(color(lighting.keyColor, '#ffffff'), number(lighting.keyIntensity, 1.05));
    const rim = new THREE.PointLight(color(lighting.rimColor, '#d9c7ff'), number(lighting.rimIntensity, 0.7), 32, 2);
    const keyPosition = vector3(lighting.keyPosition, [4, 6, 8]);
    const rimPosition = vector3(lighting.rimPosition, [-5, 2, -4]);
    key.position.set(keyPosition[0], keyPosition[1], keyPosition[2]);
    rim.position.set(rimPosition[0], rimPosition[1], rimPosition[2]);
    this.group.add(ambient);
    this.group.add(key);
    this.group.add(rim);
  }

  async buildPart({ part, world, config, index, generation }) {
    if (generation !== this.applyConfigGeneration) return null;
    const moduleRef = asObject(part.moduleRef || part.module, null);
    if (!moduleRef) throw new Error(`Immersive world part ${part.id || index} is missing moduleRef.`);
    const moduleUrl = normalizePublicRuntimeUrl(moduleRef.url, { expectedDir: 'data/immersive-world/generated-modules' });
    const module = await import(moduleUrl);
    if (generation !== this.applyConfigGeneration) return null;
    const createPart = resolveCreatePart(module);
    if (typeof createPart !== 'function') {
      throw new Error(`Immersive world module did not export createPart: ${moduleRef.url}`);
    }
    const assets = (Array.isArray(part.assetRefs) ? part.assetRefs : []).map((asset) => ({
      ...asset,
      url: normalizePublicRuntimeUrl(asset.url, { expectedDir: 'data/immersive-world/generated-assets' })
    }));
    const skyboxUtilities = createImmersiveWorldSkyboxUtilities(THREE);
    const placementUtilities = createImmersiveWorldPlacementUtilities(THREE);
    const result = normalizeModuleResult(await createPart({
      THREE,
      part,
      world,
      seed: config.seed,
      assets,
      camera: this.camera,
      utilities: {
        normalizePublicRuntimeUrl,
        hashSeedText: hashImmersiveWorldSeedText,
        createSeededRandom: createImmersiveWorldSeededRandom,
        seededRandom: (salt = '') => createImmersiveWorldSeededRandom(config.seed, salt)(),
        ...placementUtilities,
        ...skyboxUtilities,
        skybox: skyboxUtilities
      }
    }));
    if (generation !== this.applyConfigGeneration) {
      result.dispose?.();
      if (result.object?.isObject3D) disposeObjectTree(result.object);
      return null;
    }
    if (!result.object?.isObject3D) {
      throw new Error(`Immersive world module did not return a Three.js Object3D: ${part.id || index}`);
    }
    const environmentAdaptation = adaptWorldEnvironmentObject({ object: result.object, part, world });
    const textureQuality = applyImmersiveWorldTextureQuality(result.object, {
      THREE,
      renderer: this.renderer
    });
    result.object.name = result.object.name || part.id || `immersive-world-part-${index + 1}`;
    this.group.add(result.object);
    if (result.update) this.updateHooks.push(result.update);
    if (result.dispose) this.disposeHooks.push(result.dispose);
    return {
      id: part.id || null,
      role: part.role || null,
      moduleUrl: moduleRef.url,
      assetCount: assets.length,
      textureQuality,
      environmentAdaptation: environmentAdaptation.adapted ? environmentAdaptation : undefined
    };
  }

  async applyConfig(config) {
    const world = asObject(config?.world, null);
    if (!world) throw new Error('Immersive world artwork is missing world.');
    const parts = Array.isArray(world.parts) ? world.parts : [];
    if (!parts.length) throw new Error('Immersive world artwork is missing world.parts.');

    const generation = this.applyConfigGeneration + 1;
    this.applyConfigGeneration = generation;
    const isCurrentApply = () => generation === this.applyConfigGeneration;

    this.clearWorld();
    applyImmersiveWorldOutputColorTransform(this, world);
    const environment = this.applyEnvironment(world);
    this.applyLighting(world);
    const camera = this.applyCamera(world);

    const builtParts = [];
    try {
      for (const [index, part] of parts.entries()) {
        if (!isCurrentApply()) return false;
        const builtPart = await this.buildPart({ part, world, config, index, generation });
        if (!isCurrentApply()) return false;
        if (!builtPart) return false;
        builtParts.push(builtPart);
      }
    } catch (error) {
      if (!isCurrentApply()) return false;
      this.sceneAssemblyReport = {
        method: 'immersive-world-v1',
        status: 'failed',
        error: error?.message || String(error),
        builtParts
      };
      error.sceneAssemblyReport = this.sceneAssemblyReport;
      throw error;
    }

    if (!isCurrentApply()) return false;
    this.sceneAssemblyReport = {
      method: 'immersive-world-v1',
      status: 'ok',
      worldId: world.id || config.id || null,
      environment,
      camera,
      cameraAlignment: camera.alignment,
      renderer: this.getRendererDiagnostics(),
      rendererCompatibility: this.rendererCompatibilityFacts,
      builtParts,
      partCount: builtParts.length
    };
    return true;
  }

  resize() {
    return this.frameLifecycle.resize();
  }

  resizeFrameTargets() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || this.canvas.clientWidth || 1));
    const height = Math.max(1, Math.round(rect.height || this.canvas.clientHeight || 1));
    if (!this.renderTarget) {
      const resizeFacts = this.rendererRuntime.resize(width, height, false);
      const renderTargetSize = resizeFacts.renderTargetSize || { width, height };
      this.postUniforms.uResolution?.value?.set?.(renderTargetSize.width, renderTargetSize.height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      if (this.orbit) applyViewportOrbitFrame(this);
      return { width, height, pixelRatio: resizeFacts.pixelRatio, renderTargetSize };
    }
    resizeSceneRenderTargets({
      canvas: this.canvas,
      renderer: this.renderer,
      rendererRuntime: this.rendererRuntime,
      renderTarget: this.renderTarget,
      postUniforms: this.postUniforms,
      camera: this.camera
    });
    if (this.orbit) applyViewportOrbitFrame(this);
    return { width, height };
  }

  async waitForRenderedFrame(timeoutMs = 2500) {
    await this.rendererReady;
    return this.frameLifecycle.waitForRenderedFrame(timeoutMs);
  }

  get renderFrameCount() {
    return this.frameLifecycle?.getFrameCount?.() || 0;
  }

  get renderFrameWaiters() {
    return this.frameLifecycle?.getPendingWaiters?.() || [];
  }

  animate(timestamp) {
    return this.frameLifecycle.animate(timestamp);
  }

  renderFrame({ timestamp } = {}) {
    if (!this.rendererInitialized) return;
    this.clock?.update?.(timestamp);
    const frameFacts = buildImmersiveWorldFrameFacts(this);
    updateImmersiveWorldCameraControlsForFrame(this, frameFacts);
    for (const update of this.updateHooks) update(frameFacts);
    renderImmersiveWorldFrame(this, frameFacts);
  }

  dispose() {
    this.applyConfigGeneration += 1;
    this.frameLifecycle?.dispose();
    this.cameraInputTeardown?.();
    this.cameraInputTeardown = null;
    this.clearWorld();
    this.tslPostPipeline?.dispose?.();
    if (this.postScene) disposeObjectTree(this.postScene);
    this.renderTarget?.dispose?.();
    disposeObjectTree(this.scene);
    this.rendererRuntime?.dispose?.();
    this.clock?.dispose?.();
  }
}
