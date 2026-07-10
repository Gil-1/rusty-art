import test from 'node:test';
import assert from 'node:assert/strict';

import { createWebGPURendererRuntime } from '../app/web/js/scene-webgpu-renderer-runtime.js';

function createFakeWebGPURendererWithWebGLBackend() {
  return {
    isWebGPURenderer: true,
    backend: { isWebGLBackend: true },
    setPixelRatio(value) {
      this.pixelRatio = value;
    },
    setSize() {},
    setAnimationLoop() {},
    dispose() {},
    async init() {}
  };
}

function createFakeWebGPURendererWithQualityFacts(options = {}) {
  return {
    isWebGPURenderer: true,
    backend: { isWebGPUBackend: true, compatibilityMode: true },
    samples: options.samples ?? 4,
    currentSamples: options.currentSamples ?? 1,
    receivedOptions: options,
    getOutputBufferType() {
      return 'UnsignedByteType';
    },
    setPixelRatio(value) {
      this.pixelRatio = value;
    },
    setSize() {},
    setAnimationLoop() {},
    dispose() {},
    async init() {}
  };
}

test('WebGPU renderer diagnostics separate selected request from actual backend', async () => {
  const runtime = createWebGPURendererRuntime({
    canvas: {},
    rendererMode: 'webgpu',
    rendererBackend: 'webgpu',
    rendererFactory: createFakeWebGPURendererWithWebGLBackend
  });

  await runtime.initialize();
  const diagnostics = runtime.getDiagnostics();

  assert.equal(diagnostics.selectedRendererMode, 'webgpu');
  assert.equal(diagnostics.selectedRendererBackend, 'webgpu');
  assert.equal(diagnostics.rendererMode, 'webgpu-webgl2-backend');
  assert.equal(diagnostics.rendererBackend, 'webgl2');
  assert.equal(diagnostics.actualRendererBackend, 'webgl2');
  assert.equal(diagnostics.rendererProof.backendIsWebGLBackend, true);
});

test('WebGPU renderer diagnostics expose compatibility and sample quality facts', async () => {
  let rendererOptions;
  const runtime = createWebGPURendererRuntime({
    canvas: {},
    rendererMode: 'webgpu',
    rendererBackend: 'webgpu',
    samples: 4,
    rendererFactory: (options) => {
      rendererOptions = options;
      return createFakeWebGPURendererWithQualityFacts({ currentSamples: 1 });
    }
  });

  await runtime.initialize();
  const diagnostics = runtime.getDiagnostics();

  assert.equal(rendererOptions.antialias, true);
  assert.equal(rendererOptions.samples, 4);
  assert.equal(rendererOptions.outputType, undefined);
  assert.equal(diagnostics.compatibilityMode, true);
  assert.equal(diagnostics.requestedAntialias, true);
  assert.equal(diagnostics.requestedSamples, 4);
  assert.equal(diagnostics.currentSamples, 1);
  assert.equal(diagnostics.effectiveSamples, 1);
  assert.equal(diagnostics.samplesDegraded, true);
  assert.equal(diagnostics.outputBufferType, 'UnsignedByteType');
});

test('WebGPU renderer runtime leaves the canvas output type device-preferred', async () => {
  let rendererOptions;
  const runtime = createWebGPURendererRuntime({
    canvas: {},
    rendererMode: 'webgpu',
    rendererBackend: 'webgpu',
    outputBufferType: 1009,
    rendererFactory: (options) => {
      rendererOptions = options;
      return createFakeWebGPURendererWithQualityFacts(options);
    }
  });

  await runtime.initialize();

  assert.equal(rendererOptions.outputBufferType, 1009);
  assert.equal(rendererOptions.outputType, undefined);
});
