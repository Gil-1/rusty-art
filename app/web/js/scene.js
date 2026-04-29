import * as THREE from 'three';
import { applyPrimitiveAnimations } from './scene-animations.js';
import {
  bindOrbitInput as bindOrbitInputHandlers,
  updateCameraFromOrbit as updateCameraFromOrbitState,
  updateOrbitForFrame
} from './scene-camera.js';
import { disposeObjectTree, loadElementRuntime } from './scene-runtime.js';
import { POST_FRAGMENT, POST_VERTEX } from './scene-shaders.js';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export const MAX_RENDER_PIXEL_RATIO = 2.25;
export const PREFERRED_RENDER_TARGET_SAMPLES = 4;

export function resolveRendererPixelRatio(devicePixelRatio = 1) {
  const ratio = Number(devicePixelRatio);
  return clamp(Number.isFinite(ratio) && ratio > 0 ? ratio : 1, 1, MAX_RENDER_PIXEL_RATIO);
}

export function resolveRenderTargetSamples(maxSamples = 0, preferredSamples = PREFERRED_RENDER_TARGET_SAMPLES) {
  const max = Math.max(0, Math.floor(Number(maxSamples) || 0));
  const preferred = Math.max(0, Math.floor(Number(preferredSamples) || 0));
  return Math.min(max, preferred);
}

export function resolveRenderTargetSize(width, height, pixelRatio = 1) {
  const ratio = resolveRendererPixelRatio(pixelRatio);
  return {
    width: Math.max(1, Math.round((Number(width) || 1) * ratio)),
    height: Math.max(1, Math.round((Number(height) || 1) * ratio))
  };
}

function normalizeIdentifier(value, fallback = null) {
  const id = String(value || '').trim();
  return id || fallback;
}

function normalizeOverrideMode(value) {
  const mode = String(value || '').trim().toLowerCase();
  return mode === 'replace' || mode === 'hooks' || mode === 'uniforms' ? mode : 'uniforms';
}

function toFiniteNumber(value, fallback = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

const ELEMENT_LAYER_RENDER_ORDER = {
  background: 0,
  backdrop: 0,
  atmosphere: 0,
  midground: 1,
  middle: 1,
  foreground: 2,
  accent: 3,
  overlay: 4
};

export function resolveElementRenderOrder(element = {}, index = 0) {
  const layer = String(element?.layer || element?.params?.layer || '').trim().toLowerCase();
  const rank = Object.prototype.hasOwnProperty.call(ELEMENT_LAYER_RENDER_ORDER, layer)
    ? ELEMENT_LAYER_RENDER_ORDER[layer]
    : 1;
  return rank * 1000 + Math.max(0, Number(index) || 0);
}

export function applyElementRenderOrder(obj, element = {}, index = 0) {
  if (!obj) return null;
  const renderOrder = resolveElementRenderOrder(element, index);
  obj.renderOrder = renderOrder;
  if (typeof obj.traverse === 'function') {
    obj.traverse((child) => {
      child.renderOrder = renderOrder;
    });
  }
  return renderOrder;
}

function hashAnimationSeed(value = '') {
  let hash = 2166136261;
  const text = String(value || 'seed');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeVector3(value, fallback = [0, 0, 0]) {
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

function resolveSceneColor(sceneCfg, value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const normalized = value.trim();
  if (normalized.startsWith('palette.')) {
    const key = normalized.slice('palette.'.length);
    return sceneCfg?.palette?.[key] || fallback;
  }
  return normalized;
}

function applyPipelinePatches(sceneCfg, pipelinePatches = { post: [], camera: [], lighting: [] }) {
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

function buildModuleOverrideResolver(moduleOverrides = []) {
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


export class ArtworkScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(resolveRendererPixelRatio(window.devicePixelRatio || 1));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, 1, 0.1, 100);
    this.camera.position.set(0, 0.8, 12);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.clock = new THREE.Clock();

    this.controls = {
      minDistance: 6,
      maxDistance: 24,
      autoRotate: false,
      autoRotateSpeed: 0.14,
      dampingFactor: 0.08
    };
    this.orbit = {
      target: new THREE.Vector3(0, 0, 0),
      radius: 12,
      theta: 0,
      phi: Math.PI / 2.2,
      thetaVel: 0,
      phiVel: 0,
      dragging: false,
      lastX: 0,
      lastY: 0,
      userControlLocked: false
    };
    this.baseOrbitPose = { radius: 12, theta: 0, phi: Math.PI / 2.2 };
    this.baseOrbitTarget = new THREE.Vector3(0, 0, 0);
    this.viewportOrbitFrame = { radiusMultiplier: 1, phiOffset: 0, targetYOffset: 0 };
    this.bindOrbitInput();
    this.updateCameraFromOrbit();

    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderTargetSamples = resolveRenderTargetSamples(this.renderer.capabilities.maxSamples);
    this.renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: true,
      stencilBuffer: false,
      samples: this.renderTargetSamples
    });

    this.postUniforms = {
      uTexture: { value: this.renderTarget.texture },
      uTime: { value: 0 },
      uContrast: { value: 1.08 },
      uSaturation: { value: 1.04 },
      uVignette: { value: 0.26 },
      uDistortion: { value: 0.24 },
      uHueShift: { value: 0 },
      uExposureMul: { value: 1 },
      uResolution: { value: new THREE.Vector2(1, 1) }
    };

    this.postQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: this.postUniforms,
        vertexShader: POST_VERTEX,
        fragmentShader: POST_FRAGMENT,
        depthWrite: false,
        depthTest: false
      })
    );
    this.postScene.add(this.postQuad);

    this.animations = [];
    this.uniformTargets = [];
    this.motionSpeed = 0.001;
    this.currentTension = 0.5;
    this.cameraBeats = null;
    this.cameraCycleSeconds = 24;
    this.cameraMotionEnabled = false;
    this.breathing = { hueShift: 0.01, saturationAmplitude: 0.06, exposureAmplitude: 0.04, phaseA: 0.17, phaseB: 0.43 };
    this.postBase = { contrast: 1.08, saturation: 1.04, vignette: 0.26, distortion: 0.24, exposure: 1 };
    this.styleFingerprint = { pulseFamily: 'balanced', stripeWarp: 0.14, edgeSoftness: 0.26, cameraSway: 0.16, cadenceBias: 0, temperatureBias: 0 };
    this.motionIntensity = 1;
    this.captureMode = false;
    this.captureTime = 1.234;
    this.applyConfigToken = 0;
    this.renderFrameCount = 0;
    this.renderFrameWaiters = [];

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    window.addEventListener('resize', this.resize);

    this.resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas);
      if (this.canvas.parentElement) this.resizeObserver.observe(this.canvas.parentElement);
    }

    this.resize();
    requestAnimationFrame(this.animate);
  }

  async applyConfig(config) {
    const applyToken = ++this.applyConfigToken;
    const { buildElementObject, loadElementBuilders } = await loadElementRuntime();
    if (applyToken !== this.applyConfigToken) return false;

    while (this.group.children.length) {
      const child = this.group.children[0];
      this.group.remove(child);
      disposeObjectTree(child);
    }

    this.animations = [];
    this.uniformTargets = [];

    const sceneCfg = config.scene || {};
    sceneCfg.palette = sceneCfg.palette || {
      bg: '#090b12',
      primary: '#c9a4ff',
      secondary: '#8bb4ff',
      glow: '#ffffff',
      anchor: '#ffd58a'
    };

    const elements = Array.isArray(sceneCfg.elements) ? sceneCfg.elements : null;
    if (!elements || !elements.length) {
      const artworkId = typeof config?.id === 'string' && config.id.trim() ? config.id.trim() : 'unknown-artwork';
      throw new Error(`[scene] ${artworkId} is missing required scene.elements entries.`);
    }

    this.styleFingerprint = {
      ...this.styleFingerprint,
      ...(sceneCfg.styleFingerprint || {})
    };

    const pipelineKind = sceneCfg.renderPipeline?.kind || sceneCfg.techStack?.pipelineKind || null;
    const isAgentAuthored = sceneCfg.sceneAuthoring?.mode === 'agent-dsl';
    const customModules = Array.isArray(sceneCfg.sceneAuthoring?.customModules)
      ? sceneCfg.sceneAuthoring.customModules
      : [];
    const hasCustomModules = customModules.length > 0;
    const moduleOverrideResolver = buildModuleOverrideResolver(sceneCfg.sceneAuthoring?.moduleOverrides || []);
    const pipelineModuleFilter = {
      'geometry-heavy': new Set(['instance-grid', 'polyhedron-array', 'suprematist-planes', 'motif-armature', 'signal-weave', 'anchor-core', 'fault-line']),
      'particle-heavy': new Set(['particle-cloud', 'particle-stream', 'particle-shell', 'volumetric-haze', 'anchor-core', 'drift-ribbon']),
      'shader-field': new Set(['shader-field-plane', 'flow-noise-slab', 'volumetric-haze', 'anchor-core'])
    };

    let activeElements = !isAgentAuthored && !hasCustomModules && pipelineModuleFilter[pipelineKind]
      ? elements.filter((element) => pipelineModuleFilter[pipelineKind].has(element?.moduleType))
      : elements;
    if (!activeElements.length) activeElements = elements;

    const {
      builders: elementBuilders,
      customModuleReport,
      pipelinePatches
    } = await loadElementBuilders(activeElements, customModules);
    if (applyToken !== this.applyConfigToken) return false;
    this.customModuleReport = customModuleReport || null;
    sceneCfg.customModuleReport = customModuleReport || sceneCfg.customModuleReport || null;
    applyPipelinePatches(sceneCfg, pipelinePatches);

    activeElements.forEach((element, index) => {
      const moduleOverride = moduleOverrideResolver.resolve(element);
      const elementParams = element?.params && typeof element.params === 'object' ? element.params : {};
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

      const built = buildElementObject({
        element: builderElement,
        sceneCfg,
        seed: config.seed,
        index,
        builders: elementBuilders
      });
      if (!built?.obj) return;
      applyElementRenderOrder(built.obj, builderElement, index);
      this.group.add(built.obj);
      const animationSeed = hashAnimationSeed(`${config.seed || 0}:${builderElement.id || builderElement.moduleType || index}`);
      this.animations.push({
        obj: built.obj,
        animation: builderElement.animation || {},
        baseTransform: {
          position: { x: built.obj.position.x, y: built.obj.position.y, z: built.obj.position.z },
          rotation: { x: built.obj.rotation.x, y: built.obj.rotation.y, z: built.obj.rotation.z },
          scale: { x: built.obj.scale.x, y: built.obj.scale.y, z: built.obj.scale.z }
        },
        seedPhase: (animationSeed / 0xffffffff) * Math.PI * 2
      });
      if (Array.isArray(built.uniforms)) {
        built.uniforms.filter(Boolean).forEach((uniformSet) => this.uniformTargets.push(uniformSet));
      } else if (built.uniforms) {
        this.uniformTargets.push(built.uniforms);
      }
    });

    this.scene.background = new THREE.Color(sceneCfg.palette?.bg || '#090b12');
    this.scene.fog = new THREE.FogExp2(sceneCfg.palette?.bg || '#090b12', sceneCfg.fogDensity || 0.035);

    const lightingCfg = isObject(sceneCfg.lighting) ? sceneCfg.lighting : {};
    const ambientCfg = isObject(lightingCfg.ambient) ? lightingCfg.ambient : {};
    const keyCfg = isObject(lightingCfg.key) ? lightingCfg.key : {};
    const rimCfg = isObject(lightingCfg.rim) ? lightingCfg.rim : {};

    const ambient = new THREE.AmbientLight(
      resolveSceneColor(sceneCfg, ambientCfg.color, sceneCfg.palette?.secondary || '#8899cc'),
      toFiniteNumber(ambientCfg.intensity, 0.6)
    );

    const key = new THREE.DirectionalLight(
      resolveSceneColor(sceneCfg, keyCfg.color, sceneCfg.palette?.glow || '#ffffff'),
      toFiniteNumber(keyCfg.intensity, 0.95)
    );
    const keyPos = normalizeVector3(keyCfg.position, [2.6, 3.4, 6.6]);
    key.position.set(keyPos[0], keyPos[1], keyPos[2]);

    const rim = new THREE.PointLight(
      resolveSceneColor(sceneCfg, rimCfg.color, sceneCfg.palette?.anchor || '#ffffff'),
      toFiniteNumber(rimCfg.intensity, 0.9),
      toFiniteNumber(rimCfg.distance, 16),
      toFiniteNumber(rimCfg.decay, 2)
    );
    const rimPos = normalizeVector3(rimCfg.position, [-2.4, -1.4, 4.8]);
    rim.position.set(rimPos[0], rimPos[1], rimPos[2]);
    this.group.add(ambient);
    this.group.add(key);
    this.group.add(rim);

    this.motionSpeed = sceneCfg.motionSpeed || 0.001;
    this.currentTension = sceneCfg.expression?.tension ?? 0.5;

    const camCfg = sceneCfg.camera || {};
    this.controls.autoRotate = camCfg.autoRotate === true;
    this.controls.autoRotateSpeed = Number.isFinite(camCfg.autoRotateSpeed) ? camCfg.autoRotateSpeed : 0.35;
    if (Number.isFinite(camCfg.minDistance)) this.controls.minDistance = camCfg.minDistance;
    if (Number.isFinite(camCfg.maxDistance)) this.controls.maxDistance = camCfg.maxDistance;
    this.cameraBeats = Array.isArray(camCfg.beats) && camCfg.beats.length >= 2 ? camCfg.beats : null;
    this.cameraCycleSeconds = Number.isFinite(camCfg.cycleSeconds) ? camCfg.cycleSeconds : 24;
    this.cameraMotionEnabled = camCfg.motionEnabled === true;
    this.resetCameraForArtwork(camCfg);

    this.breathing = {
      hueShift: sceneCfg.post?.breathing?.hueShift ?? 0.01,
      saturationAmplitude: sceneCfg.post?.breathing?.saturationAmplitude ?? 0.06,
      exposureAmplitude: sceneCfg.post?.breathing?.exposureAmplitude ?? 0.04,
      phaseA: sceneCfg.post?.breathing?.phaseA ?? 0.17,
      phaseB: sceneCfg.post?.breathing?.phaseB ?? 0.43
    };

    this.postBase = {
      contrast: sceneCfg.post?.contrast || 1.08,
      saturation: sceneCfg.post?.saturation || 1.04,
      vignette: sceneCfg.post?.vignette || 0.26,
      distortion: sceneCfg.distortion || 0.24,
      exposure: sceneCfg.post?.exposure || 1
    };
    this.renderer.toneMappingExposure = this.postBase.exposure;
    this.postUniforms.uContrast.value = this.postBase.contrast;
    this.postUniforms.uSaturation.value = this.postBase.saturation;
    this.postUniforms.uVignette.value = this.postBase.vignette;
    this.postUniforms.uDistortion.value = this.postBase.distortion * this.motionIntensity;
    return true;
  }

  setMotionIntensity(intensity = 1) {
    this.motionIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));
    this.postUniforms.uDistortion.value = this.postBase.distortion * this.motionIntensity;
  }

  setCaptureMode(enabled = false, freezeTime = 1.234) {
    this.captureMode = Boolean(enabled);
    this.captureTime = Number.isFinite(freezeTime) ? freezeTime : 1.234;

    if (this.captureMode) {
      this.controls.autoRotate = false;
      this.orbit.thetaVel = 0;
      this.orbit.phiVel = 0;
      this.setMotionIntensity(0);
    }
  }

  waitForRenderedFrame(timeoutMs = 2500) {
    const targetFrame = this.renderFrameCount + 1;
    return new Promise((resolve, reject) => {
      const waiter = {
        targetFrame,
        resolve: () => {
          clearTimeout(waiter.timeoutId);
          resolve(targetFrame);
        },
        reject: (error) => {
          clearTimeout(waiter.timeoutId);
          reject(error);
        },
        timeoutId: null
      };

      waiter.timeoutId = setTimeout(() => {
        this.renderFrameWaiters = this.renderFrameWaiters.filter((entry) => entry !== waiter);
        waiter.reject(new Error('Timed out while waiting for rendered frame.'));
      }, timeoutMs);

      this.renderFrameWaiters.push(waiter);
    });
  }

  resetCameraForArtwork(camCfg = {}) {
    const defaultPose = { radius: 12, theta: 0, phi: Math.PI / 2.2 };
    const firstBeat = Array.isArray(this.cameraBeats) && this.cameraBeats.length ? this.cameraBeats[0] : null;

    const pick = (key) => {
      const fromCfg = camCfg?.[key];
      const fromBeat = firstBeat?.[key];
      if (Number.isFinite(fromCfg)) return fromCfg;
      if (Number.isFinite(fromBeat)) return fromBeat;
      return defaultPose[key];
    };

    this.baseOrbitPose.radius = clamp(pick('radius'), this.controls.minDistance, this.controls.maxDistance);
    this.baseOrbitPose.theta = pick('theta');
    this.baseOrbitPose.phi = pick('phi');

    const target = camCfg?.target;
    if (Array.isArray(target) && target.length === 3 && target.every(Number.isFinite)) {
      this.baseOrbitTarget.set(target[0], target[1], target[2]);
    } else if (target && Number.isFinite(target.x) && Number.isFinite(target.y) && Number.isFinite(target.z)) {
      this.baseOrbitTarget.set(target.x, target.y, target.z);
    } else {
      this.baseOrbitTarget.set(0, 0, 0);
    }

    this.orbit.radius = this.baseOrbitPose.radius;
    this.orbit.theta = this.baseOrbitPose.theta;
    this.orbit.phi = this.baseOrbitPose.phi;
    this.orbit.thetaVel = 0;
    this.orbit.phiVel = 0;
    this.orbit.dragging = false;
    this.orbit.userControlLocked = false;
    this.applyViewportOrbitFrame({ resetOrbit: true });
  }

  computeViewportOrbitFrame(aspect = this.camera.aspect || 1) {
    const portraitInfluence = clamp((1 - aspect) / 0.44, 0, 1);
    return {
      radiusMultiplier: 1 - portraitInfluence * 0.1,
      phiOffset: -portraitInfluence * 0.05,
      targetYOffset: -portraitInfluence * 0.24
    };
  }

  applyViewportOrbitFrame({ resetOrbit = false } = {}) {
    const previous = this.viewportOrbitFrame || { radiusMultiplier: 1, phiOffset: 0, targetYOffset: 0 };
    const next = this.computeViewportOrbitFrame();
    this.viewportOrbitFrame = next;

    this.orbit.target.set(
      this.baseOrbitTarget.x,
      this.baseOrbitTarget.y + next.targetYOffset,
      this.baseOrbitTarget.z
    );

    if (resetOrbit) {
      this.orbit.radius = clamp(
        this.baseOrbitPose.radius * next.radiusMultiplier,
        this.controls.minDistance,
        this.controls.maxDistance
      );
      this.orbit.theta = this.baseOrbitPose.theta;
      this.orbit.phi = this.baseOrbitPose.phi + next.phiOffset;
      this.updateCameraFromOrbit();
      return;
    }

    const prevRadiusMultiplier = Math.max(0.01, previous.radiusMultiplier || 1);
    const radiusRatio = next.radiusMultiplier / prevRadiusMultiplier;
    this.orbit.radius = clamp(
      this.orbit.radius * radiusRatio,
      this.controls.minDistance,
      this.controls.maxDistance
    );
    this.orbit.phi += next.phiOffset - (previous.phiOffset || 0);
    this.updateCameraFromOrbit();
  }

  bindOrbitInput() {
    bindOrbitInputHandlers(this);
  }

  updateCameraFromOrbit() {
    updateCameraFromOrbitState(this);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || this.canvas.clientWidth || 1));
    const height = Math.max(1, Math.round(rect.height || this.canvas.clientHeight || 1));
    const renderTargetSize = resolveRenderTargetSize(width, height, this.renderer.getPixelRatio());

    this.renderer.setSize(width, height, false);
    this.renderTarget.setSize(renderTargetSize.width, renderTargetSize.height);
    this.postUniforms.uResolution.value.set(renderTargetSize.width, renderTargetSize.height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.applyViewportOrbitFrame();
  }

  animate() {
    const t = this.captureMode ? this.captureTime : this.clock.getElapsedTime();
    const motion = this.motionIntensity ?? 1;
    const timeScale = 0.2 + motion * 0.8;
    const motionT = t * timeScale;
    const speed = (this.motionSpeed || 0.001) * (0.2 + motion * 0.8);

    this.uniformTargets.forEach((uniforms) => {
      if (uniforms.uTime) uniforms.uTime.value = motionT;
      if (uniforms.uCameraPos) uniforms.uCameraPos.value.copy(this.camera.position);
      if (uniforms.uTension) uniforms.uTension.value = this.currentTension;
    });
    this.postUniforms.uTime.value = motionT;

    const breathA = Math.sin(motionT * 0.11 + this.breathing.phaseA * Math.PI * 2);
    const breathB = Math.sin(motionT * 0.07 + this.breathing.phaseB * Math.PI * 2);
    this.postUniforms.uHueShift.value = breathA * this.breathing.hueShift * motion + (this.styleFingerprint.temperatureBias || 0) * 0.006;
    this.postUniforms.uSaturation.value = this.postBase.saturation * (1 + breathB * this.breathing.saturationAmplitude * motion);
    this.postUniforms.uContrast.value = this.postBase.contrast * (1 + (this.styleFingerprint.edgeHardness || 0.5) * 0.06 * (0.45 + motion * 0.55));
    this.postUniforms.uVignette.value = this.postBase.vignette + this.currentTension * 0.04;
    this.postUniforms.uDistortion.value = this.postBase.distortion * motion;
    this.postUniforms.uExposureMul.value = 1 + breathA * this.breathing.exposureAmplitude * motion;

    applyPrimitiveAnimations({
      animations: this.animations,
      motionT,
      speed,
      motion,
      styleFingerprint: this.styleFingerprint
    });

    updateOrbitForFrame(this, { t, motionT, speed, motion });

    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCamera);

    this.renderFrameCount += 1;
    if (this.renderFrameWaiters.length) {
      const dueWaiters = this.renderFrameWaiters.filter((waiter) => this.renderFrameCount >= waiter.targetFrame);
      this.renderFrameWaiters = this.renderFrameWaiters.filter((waiter) => this.renderFrameCount < waiter.targetFrame);
      dueWaiters.forEach((waiter) => waiter.resolve());
    }

    requestAnimationFrame(this.animate);
  }
}
