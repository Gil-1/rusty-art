import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectRendererSceneFeatures,
  resolveRendererRuntimeSelection
} from '../app/web/js/scene-rendering.js';

function generatedModuleArt(rendererCompatibility) {
  return {
    world: {
      generatedModules: [{
        type: 'immersive-world-generated-module',
        moduleId: 'incident-module',
        rendererCompatibility
      }]
    }
  };
}

function selectRenderer(rendererCompatibility) {
  const sceneFeatures = collectRendererSceneFeatures({
    art: generatedModuleArt(rendererCompatibility),
    sceneKind: 'immersive-world'
  });
  return resolveRendererRuntimeSelection({
    requestedMode: 'webgpu',
    sceneFeatures,
    webGPUAvailable: true
  });
}

test('verified native helper evidence selects WebGPU with explicit compatibility', () => {
  const selection = selectRenderer({
    webgpuCompatible: true,
    compatibilityStatus: 'webgpu-compatible',
    evidenceReasons: ['webgpu-native-helper-utility']
  });

  assert.equal(selection.rendererMode, 'webgpu');
  assert.equal(selection.useWebGPURenderer, true);
  assert.equal(selection.rendererFallbackReason, null);
});

test('unknown generated-module evidence fails closed', () => {
  const selection = selectRenderer({
    webgpuCompatible: true,
    compatibilityStatus: 'webgpu-compatible',
    evidenceReasons: ['unknown-evidence']
  });

  assert.equal(selection.rendererMode, 'webgl-legacy');
  assert.equal(selection.useWebGPURenderer, false);
  assert.equal(selection.rendererFallbackReason, 'generated-module-shader-surface');
});

test('native helper evidence without explicit compatibility fails closed', () => {
  const selection = selectRenderer({
    evidenceReasons: ['webgpu-native-helper-utility']
  });

  assert.equal(selection.rendererMode, 'webgl-legacy');
  assert.equal(selection.useWebGPURenderer, false);
  assert.equal(selection.rendererFallbackReason, 'generated-module-shader-surface');
});
