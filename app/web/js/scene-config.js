import {
  resolveRenderingBreathingConfig,
  resolveRenderingPostBase
} from './rendering-config-contract.js';

export const DEFAULT_SCENE_PALETTE = Object.freeze({
  bg: '#090b12',
  primary: '#c9a4ff',
  secondary: '#8bb4ff',
  glow: '#ffffff',
  anchor: '#ffd58a'
});

const PIPELINE_MODULE_FILTERS = {
  'geometry-heavy': new Set(['instance-grid', 'polyhedron-array', 'suprematist-planes', 'motif-armature', 'signal-weave', 'anchor-core', 'fault-line']),
  'particle-heavy': new Set(['particle-cloud', 'particle-stream', 'particle-shell', 'volumetric-haze', 'anchor-core', 'drift-ribbon']),
  'shader-field': new Set(['shader-field-plane', 'flow-noise-slab', 'volumetric-haze', 'anchor-core'])
};

export function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeIdentifier(value, fallback = null) {
  const id = String(value || '').trim();
  return id || fallback;
}

function normalizeOverrideMode(value) {
  const mode = String(value || '').trim().toLowerCase();
  return mode === 'replace' || mode === 'hooks' || mode === 'uniforms' ? mode : 'uniforms';
}

export function toFiniteNumber(value, fallback = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizeVector3(value, fallback = [0, 0, 0]) {
  if (Array.isArray(value) && value.length === 3 && value.every((entry) => Number.isFinite(Number(entry)))) {
    return [Number(value[0]), Number(value[1]), Number(value[2])];
  }
  if (isObject(value)) {
    const x = toFiniteNumber(value.x, null);
    const y = toFiniteNumber(value.y, null);
    const z = toFiniteNumber(value.z, null);
    if (x != null && y != null && z != null) return [x, y, z];
  }
  return fallback;
}

export function resolveSceneColor(sceneCfg, value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const normalized = value.trim();
  if (normalized.startsWith('palette.')) {
    const key = normalized.slice('palette.'.length);
    return sceneCfg?.palette?.[key] || fallback;
  }
  return normalized;
}

export function prepareRuntimeSceneConfig(config = {}) {
  const sceneCfg = isObject(config.scene) ? config.scene : {};
  sceneCfg.palette = sceneCfg.palette || { ...DEFAULT_SCENE_PALETTE };

  const elements = Array.isArray(sceneCfg.elements) ? sceneCfg.elements : null;
  if (!elements || !elements.length) {
    const artworkId = typeof config?.id === 'string' && config.id.trim() ? config.id.trim() : 'unknown-artwork';
    throw new Error(`[scene] ${artworkId} is missing required scene.elements entries.`);
  }

  return { sceneCfg, elements };
}

export function selectActiveSceneElements(sceneCfg = {}, elements = []) {
  const pipelineKind = sceneCfg.renderPipeline?.kind || sceneCfg.techStack?.pipelineKind || null;
  const isAgentAuthored = sceneCfg.sceneAuthoring?.mode === 'agent-dsl';
  const customModules = Array.isArray(sceneCfg.sceneAuthoring?.customModules)
    ? sceneCfg.sceneAuthoring.customModules
    : [];
  const hasCustomModules = customModules.length > 0;
  const filter = PIPELINE_MODULE_FILTERS[pipelineKind];

  if (!isAgentAuthored && !hasCustomModules && filter) {
    const filtered = elements.filter((element) => filter.has(element?.moduleType));
    return filtered.length ? filtered : elements;
  }

  return elements;
}

export function applyPipelinePatches(sceneCfg, pipelinePatches = { post: [], camera: [], lighting: [] }) {
  const postPatches = Array.isArray(pipelinePatches?.post) ? pipelinePatches.post : [];
  if (postPatches.length) {
    const post = isObject(sceneCfg.post) ? { ...sceneCfg.post } : {};
    for (const entry of postPatches) {
      const patch = isObject(entry?.patch) ? entry.patch : {};
      const source = isObject(patch.post) ? patch.post : patch;
      if (toFiniteNumber(source.contrast) != null) post.contrast = toFiniteNumber(source.contrast);
      if (toFiniteNumber(source.saturation) != null) post.saturation = toFiniteNumber(source.saturation);
      if (toFiniteNumber(source.vignette) != null) post.vignette = toFiniteNumber(source.vignette);
      if (toFiniteNumber(source.exposure) != null) post.exposure = toFiniteNumber(source.exposure);
      if (toFiniteNumber(source.distortion) != null) sceneCfg.distortion = toFiniteNumber(source.distortion);
      if (isObject(source.breathing)) {
        post.breathing = {
          ...(isObject(post.breathing) ? post.breathing : {}),
          ...source.breathing
        };
      }
    }
    sceneCfg.post = post;
  }

  const cameraPatches = Array.isArray(pipelinePatches?.camera) ? pipelinePatches.camera : [];
  if (cameraPatches.length) {
    const camera = isObject(sceneCfg.camera) ? { ...sceneCfg.camera } : {};
    for (const entry of cameraPatches) {
      const patch = isObject(entry?.patch) ? entry.patch : {};
      const source = isObject(patch.camera) ? patch.camera : patch;
      if (typeof source.autoRotate === 'boolean') camera.autoRotate = source.autoRotate;
      if (toFiniteNumber(source.autoRotateSpeed) != null) camera.autoRotateSpeed = toFiniteNumber(source.autoRotateSpeed);
      if (toFiniteNumber(source.cycleSeconds) != null) camera.cycleSeconds = toFiniteNumber(source.cycleSeconds);
      if (toFiniteNumber(source.minDistance) != null) camera.minDistance = toFiniteNumber(source.minDistance);
      if (toFiniteNumber(source.maxDistance) != null) camera.maxDistance = toFiniteNumber(source.maxDistance);
      if (typeof source.motionEnabled === 'boolean') camera.motionEnabled = source.motionEnabled;
      const target = normalizeVector3(source.target, null);
      if (target) camera.target = target;
      if (Array.isArray(source.beats) && source.beats.length >= 2) camera.beats = source.beats;
    }
    sceneCfg.camera = camera;
  }

  const lightingPatches = Array.isArray(pipelinePatches?.lighting) ? pipelinePatches.lighting : [];
  if (lightingPatches.length) {
    const lighting = isObject(sceneCfg.lighting) ? { ...sceneCfg.lighting } : {};
    for (const entry of lightingPatches) {
      const patch = isObject(entry?.patch) ? entry.patch : {};
      const source = isObject(patch.lighting) ? patch.lighting : patch;
      if (isObject(source.ambient)) {
        lighting.ambient = {
          ...(isObject(lighting.ambient) ? lighting.ambient : {}),
          ...source.ambient
        };
      }
      if (isObject(source.key)) {
        lighting.key = {
          ...(isObject(lighting.key) ? lighting.key : {}),
          ...source.key
        };
      }
      if (isObject(source.rim)) {
        lighting.rim = {
          ...(isObject(lighting.rim) ? lighting.rim : {}),
          ...source.rim
        };
      }
    }
    sceneCfg.lighting = lighting;
  }
}

export function buildModuleOverrideResolver(moduleOverrides = []) {
  const byModuleType = new Map();
  const byElementId = new Map();

  (Array.isArray(moduleOverrides) ? moduleOverrides : []).forEach((entry, index) => {
    if (!isObject(entry)) return;
    const target = isObject(entry.target) ? entry.target : {};
    const moduleType = normalizeIdentifier(target.moduleType || entry.moduleType);
    const elementId = normalizeIdentifier(target.elementId || entry.elementId);
    if (!moduleType && !elementId) return;

    const normalized = {
      id: normalizeIdentifier(entry.id, `module-override-${index + 1}`),
      mode: normalizeOverrideMode(entry.mode),
      params: isObject(entry.params) ? entry.params : {},
      uniforms: isObject(entry.uniforms) ? entry.uniforms : {},
      hooks: isObject(entry.hooks) ? entry.hooks : {},
      glsl: isObject(entry.glsl) ? entry.glsl : {}
    };

    if (moduleType) {
      if (!byModuleType.has(moduleType)) byModuleType.set(moduleType, []);
      byModuleType.get(moduleType).push(normalized);
    }

    if (elementId) {
      if (!byElementId.has(elementId)) byElementId.set(elementId, []);
      byElementId.get(elementId).push(normalized);
    }
  });

  return {
    resolve(element = {}) {
      const moduleType = normalizeIdentifier(element.moduleType);
      const elementId = normalizeIdentifier(element.id);
      const overrides = [
        ...(moduleType ? byModuleType.get(moduleType) || [] : []),
        ...(elementId ? byElementId.get(elementId) || [] : [])
      ];
      if (!overrides.length) return null;

      const mergedParams = {};
      const mergedShaderOverride = {
        mode: 'uniforms',
        uniforms: {},
        hooks: {},
        glsl: {}
      };
      let lastId = null;

      overrides.forEach((entry) => {
        lastId = entry.id || lastId;
        mergedShaderOverride.mode = entry.mode || mergedShaderOverride.mode;
        Object.assign(mergedParams, entry.params || {});
        Object.assign(mergedShaderOverride.uniforms, entry.uniforms || {});
        Object.assign(mergedShaderOverride.hooks, entry.hooks || {});
        Object.assign(mergedShaderOverride.glsl, entry.glsl || {});
      });

      const hasParams = Object.keys(mergedParams).length > 0;
      const hasShaderData = Object.keys(mergedShaderOverride.uniforms).length > 0
        || Object.keys(mergedShaderOverride.hooks).length > 0
        || Object.keys(mergedShaderOverride.glsl).length > 0
        || mergedShaderOverride.mode !== 'uniforms';

      return {
        id: lastId,
        params: hasParams ? mergedParams : null,
        shaderOverride: hasShaderData ? mergedShaderOverride : null
      };
    }
  };
}

export function prepareBuilderElement(element = {}, moduleOverride = null) {
  const elementParams = isObject(element.params) ? element.params : {};
  const mergedParams = moduleOverride?.params
    ? { ...elementParams, ...moduleOverride.params }
    : elementParams;
  const builderElement = {
    ...element,
    ...mergedParams,
    params: mergedParams,
    type: element?.moduleType
  };

  if (moduleOverride?.shaderOverride) {
    builderElement.shaderOverride = moduleOverride.shaderOverride;
  }
  if (moduleOverride?.id) {
    builderElement.moduleOverrideRef = moduleOverride.id;
  }

  return builderElement;
}

export function hashAnimationSeed(value = '') {
  let hash = 2166136261;
  const text = String(value || 'seed');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function buildAnimationRecord({ obj, animation = {}, seed = 0, element = {}, index = 0 }) {
  const animationSeed = hashAnimationSeed(`${seed || 0}:${element.id || element.moduleType || index}`);
  return {
    obj,
    animation,
    baseTransform: {
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
      scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z }
    },
    seedPhase: (animationSeed / 0xffffffff) * Math.PI * 2
  };
}

export function appendUniformTargets(targets, uniforms) {
  if (Array.isArray(uniforms)) {
    uniforms.filter(Boolean).forEach((uniformSet) => targets.push(uniformSet));
  } else if (uniforms) {
    targets.push(uniforms);
  }
  return targets;
}

export function resolveBreathingConfig(sceneCfg = {}) {
  return resolveRenderingBreathingConfig(sceneCfg);
}

export function resolvePostBase(sceneCfg = {}) {
  return resolveRenderingPostBase(sceneCfg);
}
