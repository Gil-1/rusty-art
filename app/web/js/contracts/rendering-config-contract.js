function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function finiteNumber(value, fallback = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampedNumber(value, { min, max, decimals = 3 }) {
  const numeric = finiteNumber(value, null);
  if (numeric == null) return null;
  const clamped = clamp(numeric, min, max);
  return decimals == null ? clamped : Number(clamped.toFixed(decimals));
}

export const DEFAULT_RENDERING_CONFIG = Object.freeze({
  camera: Object.freeze({
    autoRotate: false,
    autoRotateSpeed: 0.35,
    minDistance: 7.8,
    maxDistance: 32,
    cycleSeconds: 24,
    motionEnabled: false
  }),
  post: Object.freeze({
    contrast: 1.08,
    saturation: 1.04,
    vignette: 0.26,
    distortion: 0.24,
    exposure: 1,
    breathing: Object.freeze({
      hueShift: 0.01,
      saturationAmplitude: 0.06,
      exposureAmplitude: 0.04,
      phaseA: 0.17,
      phaseB: 0.43
    })
  })
});

export const RENDERING_CONFIG_CLAMPS = Object.freeze({
  global: Object.freeze({
    flowField: Object.freeze({ min: 0.1, max: 0.98, decimals: 3 }),
    distortion: Object.freeze({ min: 0.03, max: 0.94, decimals: 3 }),
    bloom: Object.freeze({ min: 0.04, max: 0.94, decimals: 3 })
  }),
  camera: Object.freeze({
    cycleSeconds: Object.freeze({ min: 8, max: 90, decimals: null }),
    autoRotateSpeed: Object.freeze({ min: -2, max: 2, decimals: 3 })
  }),
  post: Object.freeze({
    contrast: Object.freeze({ min: 0.72, max: 1.52, decimals: 3 }),
    saturation: Object.freeze({ min: 0.65, max: 1.55, decimals: 3 }),
    vignette: Object.freeze({ min: 0.05, max: 0.84, decimals: 3 }),
    exposure: Object.freeze({ min: 0.6, max: 1.5, decimals: 3 })
  })
});

export function resolveRenderingPostBase(sceneCfg = {}) {
  return {
    contrast: sceneCfg.post?.contrast || DEFAULT_RENDERING_CONFIG.post.contrast,
    saturation: sceneCfg.post?.saturation || DEFAULT_RENDERING_CONFIG.post.saturation,
    vignette: sceneCfg.post?.vignette || DEFAULT_RENDERING_CONFIG.post.vignette,
    distortion: sceneCfg.distortion || DEFAULT_RENDERING_CONFIG.post.distortion,
    exposure: sceneCfg.post?.exposure || DEFAULT_RENDERING_CONFIG.post.exposure
  };
}

export function resolveRenderingBreathingConfig(sceneCfg = {}) {
  return {
    hueShift: sceneCfg.post?.breathing?.hueShift ?? DEFAULT_RENDERING_CONFIG.post.breathing.hueShift,
    saturationAmplitude: sceneCfg.post?.breathing?.saturationAmplitude ?? DEFAULT_RENDERING_CONFIG.post.breathing.saturationAmplitude,
    exposureAmplitude: sceneCfg.post?.breathing?.exposureAmplitude ?? DEFAULT_RENDERING_CONFIG.post.breathing.exposureAmplitude,
    phaseA: sceneCfg.post?.breathing?.phaseA ?? DEFAULT_RENDERING_CONFIG.post.breathing.phaseA,
    phaseB: sceneCfg.post?.breathing?.phaseB ?? DEFAULT_RENDERING_CONFIG.post.breathing.phaseB
  };
}

export function normalizeRenderingConfigPatch(executionPlan = {}) {
  const source = isObject(executionPlan) ? executionPlan : {};
  const globalPlan = isObject(source.global) ? source.global : {};
  const cameraPlan = isObject(source.camera) ? source.camera : {};
  const postPlan = isObject(source.post) ? source.post : {};
  const patch = { global: {}, camera: {}, post: {} };

  for (const [key, limits] of Object.entries(RENDERING_CONFIG_CLAMPS.global)) {
    const normalized = clampedNumber(globalPlan[key], limits);
    if (normalized != null) patch.global[key] = normalized;
  }

  const cycleSeconds = clampedNumber(cameraPlan.cycleSeconds, RENDERING_CONFIG_CLAMPS.camera.cycleSeconds);
  if (cycleSeconds != null) patch.camera.cycleSeconds = cycleSeconds;
  if (typeof cameraPlan.autoRotate === 'boolean') patch.camera.autoRotate = cameraPlan.autoRotate;
  const autoRotateSpeed = clampedNumber(cameraPlan.autoRotateSpeed, RENDERING_CONFIG_CLAMPS.camera.autoRotateSpeed);
  if (autoRotateSpeed != null) patch.camera.autoRotateSpeed = autoRotateSpeed;

  for (const [key, limits] of Object.entries(RENDERING_CONFIG_CLAMPS.post)) {
    const normalized = clampedNumber(postPlan[key], limits);
    if (normalized != null) patch.post[key] = normalized;
  }

  return patch;
}

export function applyRenderingConfigPatch(scene, patch = {}) {
  if (!isObject(scene)) return scene;
  if (isObject(patch.global)) {
    Object.assign(scene, patch.global);
  }
  if (isObject(patch.camera)) {
    scene.camera = isObject(scene.camera) ? scene.camera : {};
    Object.assign(scene.camera, patch.camera);
  }
  if (isObject(patch.post)) {
    scene.post = isObject(scene.post) ? scene.post : {};
    Object.assign(scene.post, patch.post);
  }
  return scene;
}
