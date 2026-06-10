import * as THREE from 'three';
import {
  normalizeRendererModeRequest,
  POST_PROCESSING_MODES,
  RENDERER_MODES,
  resolvePostProcessingRequestFromSearchParams,
  resolveRendererRequestFromSearchParams
} from './renderer-mode-request.js';
import {
  classifySceneShaderCompatibility
} from './scene-shader-compatibility.js';
import { normalizeWebGPUFeatureFacts } from './contracts/webgpu-feature-facts-contract.js';
import { POST_FRAGMENT, POST_VERTEX } from './scene-shaders.js';

export {
  normalizeRendererModeRequest,
  POST_PROCESSING_MODES,
  RENDERER_MODES,
  resolvePostProcessingRequestFromSearchParams,
  resolveRendererRequestFromSearchParams
} from './renderer-mode-request.js';
export {
  classifySceneShaderCompatibility,
  SHADER_COMPATIBILITY_STATUSES
} from './scene-shader-compatibility.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export const MAX_RENDER_PIXEL_RATIO = 2.25;
export const PREFERRED_RENDER_TARGET_SAMPLES = 4;
export const IMMERSIVE_WORLD_INTERACTIVE_PIXEL_RATIO_CAP = 1;
export const IMMERSIVE_WORLD_CAPTURE_PIXEL_RATIO_CAP = 2;
export const IMMERSIVE_WORLD_INTERACTIVE_RENDER_TARGET_SAMPLES = 4;
export const IMMERSIVE_WORLD_CAPTURE_RENDER_TARGET_SAMPLES = 4;

export function resolveRendererPixelRatio(devicePixelRatio = 1) {
  const ratio = Number(devicePixelRatio);
  return clamp(Number.isFinite(ratio) && ratio > 0 ? ratio : 1, 1, MAX_RENDER_PIXEL_RATIO);
}

export function resolveImmersiveWorldRendererPixelRatio(devicePixelRatio = 1, { captureMode = false } = {}) {
  const maxPixelRatio = captureMode
    ? IMMERSIVE_WORLD_CAPTURE_PIXEL_RATIO_CAP
    : IMMERSIVE_WORLD_INTERACTIVE_PIXEL_RATIO_CAP;
  return Math.min(resolveRendererPixelRatio(devicePixelRatio), maxPixelRatio);
}

export function resolveImmersiveWorldRenderTargetSamplePreference({ captureMode = false } = {}) {
  return captureMode
    ? IMMERSIVE_WORLD_CAPTURE_RENDER_TARGET_SAMPLES
    : IMMERSIVE_WORLD_INTERACTIVE_RENDER_TARGET_SAMPLES;
}

export function resolveRenderTargetSamples(maxSamples = 0, preferredSamples = PREFERRED_RENDER_TARGET_SAMPLES) {
  const max = Math.max(0, Math.floor(Number(maxSamples) || 0));
  const preferred = Math.max(0, Math.floor(Number(preferredSamples) || 0));
  return Math.min(max, preferred);
}

export function supportsHalfFloatRenderTarget(renderer) {
  if (!renderer?.extensions || !renderer?.capabilities) return false;
  if (renderer.capabilities.isWebGL2) {
    return Boolean(
      renderer.extensions.get('EXT_color_buffer_float')
      || renderer.extensions.get('EXT_color_buffer_half_float')
    );
  }
  return Boolean(
    renderer.extensions.get('OES_texture_half_float')
    && renderer.extensions.get('EXT_color_buffer_half_float')
  );
}

export function resolveRenderTargetType(renderer) {
  return supportsHalfFloatRenderTarget(renderer) ? THREE.HalfFloatType : THREE.UnsignedByteType;
}

export function resolveRenderTargetSize(width, height, pixelRatio = 1) {
  const ratio = resolveRendererPixelRatio(pixelRatio);
  return {
    width: Math.max(1, Math.round((Number(width) || 1) * ratio)),
    height: Math.max(1, Math.round((Number(height) || 1) * ratio))
  };
}

export function resolveRendererBackend(renderer = null) {
  if (!renderer) return null;
  if (renderer.isWebGPURenderer) {
    if (renderer.backend?.isWebGLBackend === true) return 'webgl2';
    if (renderer.backend?.isWebGPUBackend === true) return 'webgpu';
    return 'webgpu';
  }
  if (renderer.capabilities?.isWebGL2 === true) return 'webgl2';
  if (renderer.getContext || renderer.capabilities) return 'webgl1';
  return null;
}

export function resolveRendererMode(renderer = null, rendererBackend = null) {
  if (renderer?.isWebGPURenderer) {
    return rendererBackend === 'webgl2'
      ? RENDERER_MODES.WEBGPU_WEBGL2_BACKEND
      : RENDERER_MODES.WEBGPU;
  }
  return RENDERER_MODES.WEBGL_LEGACY;
}

function nullableBoolean(value) {
  return typeof value === 'boolean' ? value : null;
}

function nullableNonNegativeInteger(value) {
  if (value == null || value === '') return null;
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function rendererOutputBufferTypeName(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'string') return value;
  if (value === THREE.UnsignedByteType) return 'UnsignedByteType';
  if (value === THREE.HalfFloatType) return 'HalfFloatType';
  if (value === THREE.FloatType) return 'FloatType';
  return String(value);
}

function normalizeStringList(value = []) {
  const source = Array.isArray(value) ? value : [value];
  return [...new Set(source.map((entry) => String(entry || '').trim()).filter(Boolean))];
}

function resolveRendererOutputBufferType(renderer = null) {
  if (typeof renderer?.getOutputBufferType !== 'function') return null;
  try {
    return rendererOutputBufferTypeName(renderer.getOutputBufferType());
  } catch {
    return null;
  }
}

function resolveCompatibilityMode(renderer = null) {
  const value = renderer?.backend?.compatibilityMode ?? renderer?.compatibilityMode;
  return typeof value === 'boolean' ? value : null;
}

export function describeRendererDiagnostics(renderer = null, {
  rendererMode = null,
  rendererBackend = null,
  selectedRendererMode = null,
  selectedRendererBackend = null,
  rendererFallbackReason = null,
  outputColorTransformMode = null,
  requestedAntialias = null,
  requestedSamples = null,
  textureFormatFacts = null,
  webgpuFeatureFacts = null,
  webgpuFeatureFallbackReasons = null
} = {}) {
  const actualRendererBackend = resolveRendererBackend(renderer);
  const actualRendererMode = resolveRendererMode(renderer, actualRendererBackend);
  const resolvedBackend = rendererBackend || actualRendererBackend;
  const resolvedMode = rendererMode || actualRendererMode;
  const requestedSamplesCount = nullableNonNegativeInteger(requestedSamples);
  const currentSamples = nullableNonNegativeInteger(renderer?.currentSamples);
  const effectiveSamples = currentSamples ?? nullableNonNegativeInteger(renderer?.samples);
  return {
    rendererMode: resolvedMode,
    rendererBackend: resolvedBackend,
    selectedRendererMode: selectedRendererMode || null,
    selectedRendererBackend: selectedRendererBackend || null,
    actualRendererMode,
    actualRendererBackend,
    rendererFallbackReason: rendererFallbackReason || null,
    outputColorTransformMode: outputColorTransformMode || null,
    compatibilityMode: resolveCompatibilityMode(renderer),
    requestedAntialias: nullableBoolean(requestedAntialias),
    requestedSamples: requestedSamplesCount,
    currentSamples,
    effectiveSamples,
    samplesDegraded: requestedSamplesCount != null && effectiveSamples != null ? effectiveSamples < requestedSamplesCount : false,
    outputBufferType: resolveRendererOutputBufferType(renderer),
    textureFormatFacts: Array.isArray(textureFormatFacts) ? textureFormatFacts : [],
    webgpuFeatureFacts: normalizeWebGPUFeatureFacts(webgpuFeatureFacts),
    webgpuFeatureFallbackReasons: normalizeStringList(webgpuFeatureFallbackReasons),
    rendererProof: renderer ? {
      isWebGPURenderer: renderer.isWebGPURenderer === true,
      backendIsWebGPUBackend: renderer.backend?.isWebGPUBackend === true,
      backendIsWebGLBackend: renderer.backend?.isWebGLBackend === true,
      backendType: renderer.backend?.constructor?.name || null
    } : null
  };
}

export function collectRendererSceneFeatures({
  art = null,
  sceneKind = null,
  adapterFeatures = {}
} = {}) {
  const shaderCompatibility = classifySceneShaderCompatibility({
    art,
    sceneKind,
    adapterFeatures
  });
  const adapterWebGPUCompatible = !shaderCompatibility.surfaces.some((surface) => surface.source === 'adapter');

  return {
    sceneKind,
    adapterWebGPUCompatible,
    hasGLSLShaderMaterial: shaderCompatibility.hasGLSLShaderMaterial,
    hasRawShaderMaterial: shaderCompatibility.hasRawShaderMaterial,
    customModuleShaderSurfaceCount: shaderCompatibility.customModuleShaderSurfaceCount,
    incompatibleCustomModuleShaderSurfaceCount: shaderCompatibility.customModuleShaderSurfaceCount,
    generatedModuleShaderSurfaceCount: shaderCompatibility.generatedModuleShaderSurfaceCount,
    shaderCompatibility,
    unsupportedWebGPUReasons: shaderCompatibility.unsupportedWebGPUReasons
  };
}

export function resolveRendererRuntimeSelection({
  requestedMode = RENDERER_MODES.WEBGL_LEGACY,
  captureMode = false,
  sceneFeatures = null,
  navigatorRef = typeof navigator !== 'undefined' ? navigator : null,
  webGPUAvailable = null
} = {}) {
  const normalizedRequest = normalizeRendererModeRequest(requestedMode);
  const browserSupportsWebGPU = webGPUAvailable == null
    ? Boolean(navigatorRef?.gpu)
    : Boolean(webGPUAvailable);
  const unsupportedReasons = Array.isArray(sceneFeatures?.unsupportedWebGPUReasons)
    ? sceneFeatures.unsupportedWebGPUReasons
    : [];
  const fallbackReason = unsupportedReasons[0] || null;
  const base = {
    requestedMode: normalizedRequest,
    captureMode: Boolean(captureMode),
    browserSupportsWebGPU,
    unsupportedWebGPUReasons: unsupportedReasons,
    rendererFamily: 'webgl-renderer',
    rendererMode: RENDERER_MODES.WEBGL_LEGACY,
    rendererBackend: 'webgl2',
    rendererFallbackReason: null,
    useWebGPURenderer: false,
    forceWebGL: false,
    capturePolicy: captureMode ? 'capture-requested-renderer' : 'interactive-requested-renderer'
  };

  if (normalizedRequest === RENDERER_MODES.WEBGL_LEGACY) return base;
  if (fallbackReason) {
    return {
      ...base,
      rendererFallbackReason: fallbackReason
    };
  }
  if (normalizedRequest === RENDERER_MODES.WEBGPU_WEBGL2_BACKEND) {
    return {
      ...base,
      rendererFamily: 'webgpu-renderer',
      rendererMode: RENDERER_MODES.WEBGPU_WEBGL2_BACKEND,
      rendererBackend: 'webgl2',
      rendererFallbackReason: 'forced-webgl2-backend',
      useWebGPURenderer: true,
      forceWebGL: true
    };
  }
  if (!browserSupportsWebGPU) {
    return {
      ...base,
      rendererFamily: 'webgpu-renderer',
      rendererMode: RENDERER_MODES.WEBGPU_WEBGL2_BACKEND,
      rendererBackend: 'webgl2',
      rendererFallbackReason: 'webgpu-unsupported',
      useWebGPURenderer: true,
      forceWebGL: true
    };
  }
  return {
    ...base,
    rendererFamily: 'webgpu-renderer',
    rendererMode: RENDERER_MODES.WEBGPU,
    rendererBackend: 'webgpu',
    useWebGPURenderer: true
  };
}

function defaultRendererDispose(renderer) {
  renderer?.dispose?.();
}

function defaultRendererSetSize(renderer, width, height, updateStyle = false) {
  renderer?.setSize?.(width, height, updateStyle);
}

function defaultRendererSetPixelRatio(renderer, pixelRatio) {
  renderer?.setPixelRatio?.(pixelRatio);
}

function defaultRendererGetPixelRatio(renderer) {
  return typeof renderer?.getPixelRatio === 'function' ? renderer.getPixelRatio() : 1;
}

export function createRendererRuntime({
  renderer,
  rendererMode = null,
  rendererBackend = null,
  selectedRendererMode = null,
  selectedRendererBackend = null,
  rendererFallbackReason = null,
  requestedAntialias = null,
  requestedSamples = null,
  initialize = async () => renderer,
  dispose = defaultRendererDispose,
  setSize = defaultRendererSetSize,
  setPixelRatio = defaultRendererSetPixelRatio,
  getPixelRatio = defaultRendererGetPixelRatio,
  setAnimationLoop = renderer?.setAnimationLoop ? (callback) => renderer.setAnimationLoop(callback) : null
} = {}) {
  if (!renderer) throw new Error('Renderer runtime requires a renderer instance.');

  let initialized = false;
  let initializationStarted = false;
  let initializationError = null;
  let initializationPromise = null;
  let disposed = false;

  const runtime = {
    renderer,

    async initialize() {
      if (disposed) throw new Error('Cannot initialize a disposed renderer runtime.');
      initializationStarted = true;
      if (!initializationPromise) {
        initializationPromise = Promise.resolve()
          .then(() => initialize(renderer))
          .then(() => {
            initialized = true;
            initializationError = null;
            return renderer;
          })
          .catch((error) => {
            initializationError = error;
            throw error;
          });
      }
      return initializationPromise;
    },

    setPixelRatio(value) {
      const pixelRatio = resolveRendererPixelRatio(value);
      setPixelRatio(renderer, pixelRatio);
      return pixelRatio;
    },

    getPixelRatio() {
      return resolveRendererPixelRatio(getPixelRatio(renderer));
    },

    resize(width, height, updateStyle = false) {
      const resolvedWidth = Math.max(1, Math.round(Number(width) || 1));
      const resolvedHeight = Math.max(1, Math.round(Number(height) || 1));
      setSize(renderer, resolvedWidth, resolvedHeight, updateStyle);
      const pixelRatio = this.getPixelRatio();
      return {
        width: resolvedWidth,
        height: resolvedHeight,
        pixelRatio,
        renderTargetSize: resolveRenderTargetSize(resolvedWidth, resolvedHeight, pixelRatio)
      };
    },

    setAnimationLoop(callback) {
      if (typeof setAnimationLoop !== 'function') return false;
      setAnimationLoop(callback);
      return true;
    },

    clearAnimationLoop() {
      return this.setAnimationLoop(null);
    },

    dispose() {
      if (disposed) return;
      this.clearAnimationLoop();
      dispose(renderer);
      disposed = true;
    },

    getDiagnostics(options = {}) {
      const resolvedRendererBackend = typeof rendererBackend === 'function' ? rendererBackend(renderer) : rendererBackend;
      const resolvedRendererMode = typeof rendererMode === 'function' ? rendererMode(renderer) : rendererMode;
      const resolvedSelectedRendererBackend = typeof selectedRendererBackend === 'function' ? selectedRendererBackend(renderer) : selectedRendererBackend;
      const resolvedSelectedRendererMode = typeof selectedRendererMode === 'function' ? selectedRendererMode(renderer) : selectedRendererMode;
      return describeRendererDiagnostics(renderer, {
        rendererMode: resolvedRendererMode,
        rendererBackend: resolvedRendererBackend,
        selectedRendererMode: resolvedSelectedRendererMode,
        selectedRendererBackend: resolvedSelectedRendererBackend,
        rendererFallbackReason,
        requestedAntialias,
        requestedSamples,
        ...options
      });
    },

    getFacts() {
      const resolvedRendererBackend = typeof rendererBackend === 'function' ? rendererBackend(renderer) : rendererBackend;
      const resolvedRendererMode = typeof rendererMode === 'function' ? rendererMode(renderer) : rendererMode;
      const resolvedSelectedRendererBackend = typeof selectedRendererBackend === 'function' ? selectedRendererBackend(renderer) : selectedRendererBackend;
      const resolvedSelectedRendererMode = typeof selectedRendererMode === 'function' ? selectedRendererMode(renderer) : selectedRendererMode;
      const diagnostics = describeRendererDiagnostics(renderer, {
        rendererMode: resolvedRendererMode,
        rendererBackend: resolvedRendererBackend,
        selectedRendererMode: resolvedSelectedRendererMode,
        selectedRendererBackend: resolvedSelectedRendererBackend,
        rendererFallbackReason,
        requestedAntialias,
        requestedSamples
      });
      return {
        ...diagnostics,
        initialized,
        initializationStarted,
        initializationError: initializationError?.message || null,
        disposed
      };
    }
  };

  return runtime;
}

export function createWebGLRendererRuntime({
  canvas,
  devicePixelRatio = 1,
  rendererFactory = (options) => new THREE.WebGLRenderer(options),
  rendererFallbackReason = null
} = {}) {
  const renderer = rendererFactory({ canvas, antialias: true, alpha: false });
  const runtime = createRendererRuntime({
    renderer,
    rendererMode: RENDERER_MODES.WEBGL_LEGACY,
    rendererFallbackReason,
    requestedAntialias: true,
    initialize: async () => renderer
  });

  runtime.setPixelRatio(devicePixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  return runtime;
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

export function createArtworkRenderer(canvas, devicePixelRatio = 1) {
  return createWebGLRendererRuntime({ canvas, devicePixelRatio }).renderer;
}

export function createRendererRuntimeFromSelection({
  canvas,
  devicePixelRatio = 1,
  selection = null,
  webglRendererFactory,
  webgpuRuntimeFactory = null,
  webgpuRuntimeOptions = {}
} = {}) {
  const rendererSelection = selection || resolveRendererRuntimeSelection();
  if (!rendererSelection.useWebGPURenderer) {
    return createWebGLRendererRuntime({
      canvas,
      devicePixelRatio,
      rendererFactory: webglRendererFactory,
      rendererFallbackReason: rendererSelection.rendererFallbackReason
    });
  }

  if (typeof webgpuRuntimeFactory !== 'function') {
    throw new Error('WebGPU renderer runtime factory is required for WebGPU renderer selection.');
  }

  return webgpuRuntimeFactory({
    canvas,
    devicePixelRatio,
    forceWebGL: rendererSelection.forceWebGL,
    rendererMode: rendererSelection.rendererMode,
    rendererBackend: rendererSelection.rendererBackend,
    rendererFallbackReason: rendererSelection.rendererFallbackReason,
    ...webgpuRuntimeOptions
  });
}

export async function createSelectedRendererRuntime({
  canvas,
  devicePixelRatio = 1,
  rendererRequest = RENDERER_MODES.WEBGL_LEGACY,
  captureMode = false,
  sceneFeatures = null,
  navigatorRef = typeof navigator !== 'undefined' ? navigator : null,
  webGPUAvailable = null,
  webglRendererFactory,
  webgpuRuntimeFactory = null,
  webgpuModuleLoader = () => import('./scene-webgpu-renderer-runtime.js')
} = {}) {
  const selection = resolveRendererRuntimeSelection({
    requestedMode: rendererRequest,
    captureMode,
    sceneFeatures,
    navigatorRef,
    webGPUAvailable
  });

  const factory = webgpuRuntimeFactory || (async (options) => {
    const module = await webgpuModuleLoader();
    return module.createWebGPURendererRuntime(options);
  });
  const runtime = await createRendererRuntimeFromSelection({
    canvas,
    devicePixelRatio,
    selection,
    webglRendererFactory,
    webgpuRuntimeFactory: factory
  });
  return { selection, runtime };
}

export function createPostRenderTarget(renderer, { preferredSamples = PREFERRED_RENDER_TARGET_SAMPLES } = {}) {
  const samples = resolveRenderTargetSamples(renderer?.capabilities?.maxSamples, preferredSamples);
  const type = resolveRenderTargetType(renderer);
  const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: true,
    stencilBuffer: false,
    type,
    samples
  });
  return { renderTarget, samples, type };
}

export function createPostPass(renderTarget, {
  vertexShader = POST_VERTEX,
  fragmentShader = POST_FRAGMENT,
  toneMapped = null
} = {}) {
  const postScene = new THREE.Scene();
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postUniforms = {
    uTexture: { value: renderTarget.texture },
    uTime: { value: 0 },
    uContrast: { value: 1.08 },
    uSaturation: { value: 1.04 },
    uVignette: { value: 0.26 },
    uDistortion: { value: 0.24 },
    uHueShift: { value: 0 },
    uExposureMul: { value: 1 },
    uResolution: { value: new THREE.Vector2(1, 1) }
  };

  const postQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: postUniforms,
      vertexShader,
      fragmentShader,
      depthWrite: false,
      depthTest: false
    })
  );
  if (toneMapped !== null) postQuad.material.toneMapped = Boolean(toneMapped);
  postScene.add(postQuad);

  return { postScene, postCamera, postUniforms, postQuad };
}

export function resizeSceneRenderTargets({ canvas, renderer, rendererRuntime = null, renderTarget, postUniforms, camera }) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width || canvas.clientWidth || 1));
  const height = Math.max(1, Math.round(rect.height || canvas.clientHeight || 1));
  const resizeFacts = rendererRuntime?.resize
    ? rendererRuntime.resize(width, height, false)
    : null;
  const pixelRatio = resizeFacts?.pixelRatio || renderer.getPixelRatio();
  const renderTargetSize = resizeFacts?.renderTargetSize || resolveRenderTargetSize(width, height, pixelRatio);

  if (!resizeFacts) renderer.setSize(width, height, false);
  renderTarget.setSize(renderTargetSize.width, renderTargetSize.height);
  postUniforms.uResolution.value.set(renderTargetSize.width, renderTargetSize.height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  return { width, height, pixelRatio, renderTargetSize };
}
