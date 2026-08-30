import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';

import {
  ArtworkScene,
  applyImmersiveWorldOutputColorTransform,
  applyImmersiveWorldShadowParticipation,
  resolveImmersiveWorldWebGPURuntimeOptions,
  resolveImmersiveWorldRendererProfile
} from '../app/web/js/immersive-world-scene.js';
import { POST_PROCESSING_MODES, RENDERER_MODES } from '../app/web/js/scene-rendering.js';
import {
  NEUTRAL_WEBGPU_ENVIRONMENT,
  NEUTRAL_WEBGPU_LIGHTING,
  NEUTRAL_WEBGPU_OUTPUT_COLOR_TRANSFORM
} from '../app/web/js/contracts/immersive-world-baseline-contract.js';

test('neutral WebGPU baseline contract exposes the shared lighting and output defaults', () => {
  assert.equal(NEUTRAL_WEBGPU_LIGHTING.mode, 'neutral-webgpu');
  assert.equal(NEUTRAL_WEBGPU_LIGHTING.environmentMode, 'room-environment-pmrem');
  assert.equal(NEUTRAL_WEBGPU_LIGHTING.ambientIntensity, 0);
  assert.equal(NEUTRAL_WEBGPU_LIGHTING.ambientFallbackIntensity, 0.3);
  assert.deepEqual(NEUTRAL_WEBGPU_ENVIRONMENT, {
    color: '#73777d',
    fieldColor: '#73777d',
    fogDensity: 0
  });
  assert.equal(NEUTRAL_WEBGPU_LIGHTING.keyIntensity, 3);
  assert.equal(NEUTRAL_WEBGPU_LIGHTING.environmentIntensity, 1);
  assert.deepEqual(NEUTRAL_WEBGPU_LIGHTING.keyTarget, [0, 0, -5]);
  assert.equal(NEUTRAL_WEBGPU_LIGHTING.shadows.enabled, true);
  assert.equal(NEUTRAL_WEBGPU_OUTPUT_COLOR_TRANSFORM.toneMapping, 'neutral');
  assert.equal(NEUTRAL_WEBGPU_OUTPUT_COLOR_TRANSFORM.exposure, 1);
});

test('WebGPU capture uses the same TSL post path as interactive rendering', () => {
  const profile = resolveImmersiveWorldRendererProfile({
    art: {
      rendererCompatibility: {
        compatibilityStatus: 'webgpu-compatible',
        webgpuCompatible: true
      }
    },
    requestedMode: RENDERER_MODES.WEBGPU,
    captureMode: true,
    navigatorRef: { gpu: {} }
  });

  assert.equal(profile.rendererSelection.useWebGPURenderer, true);
  assert.equal(profile.postProcessingRequest, POST_PROCESSING_MODES.WEBGPU_TSL_POST);
});

test('WebGPU capture keeps the renderer default half-float output buffer', () => {
  assert.deepEqual(resolveImmersiveWorldWebGPURuntimeOptions({ captureMode: true }), {});
});

test('TSL color controls preserve HDR values for the final tone mapper', async () => {
  const source = await readFile(new URL('../app/web/js/scene-tsl-post-processing.js', import.meta.url), 'utf8');
  assert.match(source, /return max\(toRgb\.mul\(shifted\), 0\);/);
  assert.doesNotMatch(source, /return clamp\(toRgb\.mul\(shifted\), 0, 1\);/);
});

test('neutral lighting creates one shadow-casting directional key', () => {
  const group = new THREE.Group();
  const renderer = { shadowMap: { enabled: false, type: null } };
  const lighting = ArtworkScene.prototype.applyLighting.call({
    group,
    renderer,
    rendererSelection: { useWebGPURenderer: true }
  }, {
    lighting: {
      mode: 'neutral-webgpu',
      ambientColor: '#ffffff',
      ambientIntensity: 0.3,
      keyColor: '#ffffff',
      keyIntensity: 3,
      keyPosition: [5, 8, 6],
      keyTarget: [0, 0, -5],
      rimIntensity: 0,
      shadows: { enabled: true, mapSize: 2048, bounds: 18, near: 0.5, far: 80 }
    }
  });

  const key = group.children.find((child) => child.isDirectionalLight);
  assert.equal(renderer.shadowMap.enabled, true);
  assert.equal(renderer.shadowMap.type, THREE.PCFShadowMap);
  assert.equal(group.children.filter((child) => child.isPointLight).length, 0);
  assert.equal(group.children.filter((child) => child.isAmbientLight).length, 0);
  assert.equal(key.castShadow, true);
  assert.deepEqual(key.target.position.toArray(), [0, 0, -5]);
  assert.equal(key.shadow.mapSize.width, 2048);
  assert.equal(key.shadow.camera.left, -18);
  assert.equal(key.shadow.camera.far, 80);
  assert.equal(lighting.mode, 'neutral-webgpu');
});

test('neutral lighting keeps ambient fill only for renderer fallback', () => {
  const group = new THREE.Group();
  ArtworkScene.prototype.applyLighting.call({
    group,
    renderer: { shadowMap: {} },
    rendererSelection: { useWebGPURenderer: false }
  }, {
    lighting: {
      mode: 'neutral-webgpu',
      ambientIntensity: 0,
      ambientFallbackIntensity: 0.3,
      rimIntensity: 0,
      shadows: { enabled: true }
    }
  });

  assert.equal(group.children.find((child) => child.isAmbientLight).intensity, 0.3);
});

test('neutral environment defaults to a visible background without fog', () => {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  ArtworkScene.prototype.applyEnvironment.call({ scene, group }, {
    lighting: { mode: 'neutral-webgpu' }
  });

  assert.equal(scene.background.getHexString(), '73777d');
  assert.equal(scene.fog, null);
});

test('neutral shadows include opaque lit meshes and suppress competing global lights', () => {
  const root = new THREE.Group();
  const opaque = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  const unlit = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  const transparent = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.5 }));
  const competingLight = new THREE.HemisphereLight();
  root.add(opaque, unlit, transparent, competingLight);

  const facts = applyImmersiveWorldShadowParticipation(root, { suppressSharedLights: true });

  assert.equal(opaque.castShadow, true);
  assert.equal(opaque.receiveShadow, true);
  assert.equal(unlit.castShadow, false);
  assert.equal(transparent.receiveShadow, false);
  assert.equal(competingLight.visible, false);
  assert.deepEqual(facts, { eligibleMeshCount: 1, disabledSharedLightCount: 1 });
});

test('neutral baseline selects neutral tone mapping without changing exposure defaults', () => {
  const scene = { renderer: { toneMapping: THREE.ACESFilmicToneMapping } };
  const transform = applyImmersiveWorldOutputColorTransform(scene, {
    outputColorTransform: { toneMapping: 'neutral' }
  });

  assert.equal(scene.renderer.toneMapping, THREE.NeutralToneMapping);
  assert.equal(transform.toneMapping, 'neutral');
  assert.equal(transform.exposure, 1);
});
