import { ACESFilmicToneMapping, WebGPURenderer } from 'three/webgpu';
import {
  createRendererRuntime,
  RENDERER_MODES,
  resolveRendererBackend,
  resolveRendererMode
} from './scene-rendering.js';

export function createWebGPURendererRuntime({
  canvas,
  devicePixelRatio = 1,
  forceWebGL = false,
  antialias = true,
  samples = null,
  outputBufferType = null,
  rendererMode = null,
  rendererBackend = null,
  rendererFallbackReason = null,
  rendererFactory = (options) => new WebGPURenderer(options)
} = {}) {
  const rendererOptions = {
    canvas,
    antialias,
    alpha: false,
    forceWebGL
  };
  if (Number.isFinite(Number(samples))) rendererOptions.samples = Math.max(0, Math.floor(Number(samples)));
  if (outputBufferType != null) {
    rendererOptions.outputBufferType = outputBufferType;
    rendererOptions.outputType = outputBufferType;
  }
  const renderer = rendererFactory(rendererOptions);
  const selectedRendererMode = rendererMode || null;
  const selectedRendererBackend = rendererBackend || null;
  const runtime = createRendererRuntime({
    renderer,
    rendererMode: (activeRenderer) => {
      const backend = resolveRendererBackend(activeRenderer);
      return forceWebGL
        ? RENDERER_MODES.WEBGPU_WEBGL2_BACKEND
        : resolveRendererMode(activeRenderer, backend);
    },
    rendererBackend: (activeRenderer) => resolveRendererBackend(activeRenderer),
    selectedRendererMode,
    selectedRendererBackend,
    rendererFallbackReason,
    requestedAntialias: Boolean(antialias),
    requestedSamples: rendererOptions.samples ?? null,
    initialize: async (activeRenderer) => {
      if (typeof activeRenderer.init === 'function') await activeRenderer.init();
      return activeRenderer;
    }
  });

  runtime.setPixelRatio(devicePixelRatio);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  return runtime;
}
