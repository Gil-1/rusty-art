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
  rendererMode = null,
  rendererBackend = null,
  rendererFallbackReason = null,
  rendererFactory = (options) => new WebGPURenderer(options)
} = {}) {
  const renderer = rendererFactory({
    canvas,
    antialias: true,
    alpha: false,
    forceWebGL
  });
  const runtime = createRendererRuntime({
    renderer,
    rendererMode: rendererMode || ((activeRenderer) => {
      const backend = resolveRendererBackend(activeRenderer);
      return forceWebGL
        ? RENDERER_MODES.WEBGPU_WEBGL2_BACKEND
        : resolveRendererMode(activeRenderer, backend);
    }),
    rendererBackend: rendererBackend || ((activeRenderer) => resolveRendererBackend(activeRenderer)),
    rendererFallbackReason,
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
