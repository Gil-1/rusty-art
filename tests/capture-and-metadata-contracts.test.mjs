import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyCaptureReadinessPatch,
  createCaptureReadinessState
} from '../app/web/js/contracts/capture-readiness-contract.js';
import {
  resolveCaptureTargetFromSearchParams
} from '../app/web/js/contracts/capture-target-contract.js';
import {
  applyImmersiveWorldCameraConfig,
  INSTAGRAM_CAPTURE_CAMERA
} from '../app/web/js/immersive-world-scene.js';
import { renderMeta } from '../app/web/js/main-render.js';

const PUBLIC_CAMERA = Object.freeze({
  owner: 'world-composition',
  fov: 66,
  near: 0.08,
  far: 220,
  position: Object.freeze([0.22, 2.12, 14.2]),
  target: Object.freeze([0.55, 0.18, -5.6]),
  distanceSafety: Object.freeze({
    nearFarOwnedHere: true,
    minPartDistance: 1.7,
    clippingRisk: 'low'
  })
});

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function vector3(x = 0, y = 0, z = 0) {
  return {
    x,
    y,
    z,
    set(nextX, nextY, nextZ) {
      this.x = nextX;
      this.y = nextY;
      this.z = nextZ;
      return this;
    },
    toArray() {
      return [this.x, this.y, this.z];
    }
  };
}

function makeScene({ captureMode = false, captureProfile = null } = {}) {
  return {
    captureMode,
    captureProfile,
    instagramCaptureCamera: INSTAGRAM_CAPTURE_CAMERA,
    camera: {
      aspect: 0.75,
      near: null,
      far: null,
      fov: null,
      position: vector3(),
      updateProjectionMatrix() {
        this.projectionUpdated = true;
      },
      lookAt(target) {
        this.lookAtTarget = target.toArray();
      }
    },
    controls: { minDistance: 0.1, maxDistance: 100 },
    baseOrbitTarget: vector3(),
    baseOrbitPose: { radius: 0, theta: 0, phi: 0 },
    viewportOrbitFrame: { radiusMultiplier: 1, phiOffset: 0, targetYOffset: 0 },
    orbit: {
      target: vector3(),
      radius: 0,
      theta: 0,
      phi: 0,
      thetaVel: 1,
      phiVel: 1,
      dragging: true,
      userControlLocked: true
    }
  };
}

function makeImmersiveArtwork() {
  return {
    id: '2026-05-19-1141z-example-artwork',
    artCreationMethod: 'immersive-world-v1',
    date: '2026-05-19',
    title: 'Example artwork',
    generatedAt: '2026-05-19T11:41:00.000Z',
    news: {
      source: 'Example source',
      title: 'Example headline',
      link: 'https://example.invalid/story'
    },
    inspiration: {
      artist: 'Example Artist',
      tags: ['immersive-world'],
      links: {}
    },
    newsVisualMappings: [
      { visualDecision: 'postContrast=1.12 accentType=n/a' },
      { visualDecision: 'composition held from perceptual scale evidence' }
    ],
    world: {
      environment: {
        kind: 'inside-facing-artist-field'
      },
      rendererCompatibility: {
        compatibilityStatus: 'webgl-compatible'
      },
      generatedModules: [
        { moduleId: 'world-environment-module' },
        { moduleId: 'primary-news-signal-module' }
      ],
      parts: [
        {
          partId: 'world-environment',
          role: 'environment field',
          params: { band: 'environment', visibilityPriority: 'environment' },
          moduleRef: { moduleId: 'world-environment-module' }
        },
        {
          partId: 'news-signal',
          role: 'primary news signal',
          params: { band: 'foreground', visibilityPriority: 'primary' },
          moduleRef: { moduleId: 'primary-news-signal-module' }
        }
      ]
    }
  };
}

test('capture target accepts the Instagram profile only in capture mode', () => {
  const captureTarget = resolveCaptureTargetFromSearchParams('?capture=1&captureProfile=instagram&view=story');
  const publicTarget = resolveCaptureTargetFromSearchParams('?captureProfile=instagram&view=story');

  assert.equal(captureTarget.captureMode, true);
  assert.equal(captureTarget.captureProfile, 'instagram');
  assert.equal(publicTarget.captureMode, false);
  assert.equal(publicTarget.captureProfile, null);
});

test('Instagram capture applies its own camera without mutating the public camera', () => {
  const world = { camera: cloneJson(PUBLIC_CAMERA), environment: {} };
  const beforePublicCamera = cloneJson(world.camera);
  const scene = makeScene({ captureMode: true, captureProfile: 'instagram' });

  const result = applyImmersiveWorldCameraConfig(scene, world);

  assert.equal(result.source, 'captureProfile.instagram');
  assert.deepEqual(result.requested.position, INSTAGRAM_CAPTURE_CAMERA.position);
  assert.deepEqual(result.requested.target, INSTAGRAM_CAPTURE_CAMERA.target);
  assert.equal(scene.camera.fov, INSTAGRAM_CAPTURE_CAMERA.fov);
  assert.deepEqual(world.camera, beforePublicCamera);
});

test('public runtime ignores the Instagram profile and keeps the authored camera', () => {
  const world = { camera: cloneJson(PUBLIC_CAMERA), environment: {} };
  const scene = makeScene({ captureMode: false, captureProfile: 'instagram' });

  const result = applyImmersiveWorldCameraConfig(scene, world);

  assert.equal(result.source, 'world.camera');
  assert.deepEqual(result.requested.position, PUBLIC_CAMERA.position);
  assert.deepEqual(result.requested.target, PUBLIC_CAMERA.target);
});

test('capture readiness preserves renderer proof and WebGPU feature facts', () => {
  const state = createCaptureReadinessState({ now: '2026-06-09T06:00:00.000Z' });
  const { state: updated, rejectedKeys } = applyCaptureReadinessPatch(state, {
    rendererMode: 'webgpu',
    rendererBackend: 'webgpu',
    selectedRendererMode: 'webgpu',
    selectedRendererBackend: 'webgpu',
    actualRendererMode: 'webgpu',
    actualRendererBackend: 'webgpu',
    rendererProof: {
      isWebGPURenderer: true,
      backendIsWebGPUBackend: true,
      backendIsWebGLBackend: false,
      backendType: 'WebGPUBackend'
    },
    webgpuFeatureFacts: [{
      helperId: 'point-particle-field',
      api: 'utilities.createPointParticleField',
      featureFamily: 'point-particle-field',
      materialFactoryId: 'soft-particles',
      materialType: 'PointsMaterial',
      runtimeSurface: 'three-points-buffer-geometry'
    }],
    webgpuFeatureFallbackReasons: ['storage-buffer-unsupported']
  }, { now: '2026-06-09T06:00:01.000Z' });

  assert.deepEqual(rejectedKeys, []);
  assert.equal(updated.readinessFacts.selectedRendererMode, 'webgpu');
  assert.equal(updated.readinessFacts.actualRendererBackend, 'webgpu');
  assert.equal(updated.readinessFacts.rendererProof.backendIsWebGPUBackend, true);
  assert.equal(updated.readinessFacts.webgpuFeatureFacts[0].kind, 'webgpu-native-helper');
  assert.equal(updated.readinessFacts.webgpuFeatureFacts[0].family, 'point-particle-field');
  assert.deepEqual(updated.readinessFacts.webgpuFeatureFallbackReasons, ['storage-buffer-unsupported']);
});

test('public metadata omits unavailable placeholder rows', () => {
  const meta = { innerHTML: '' };

  renderMeta(meta, makeImmersiveArtwork());

  assert.match(meta.innerHTML, /Sources/);
  assert.match(meta.innerHTML, /World parts/);
  assert.match(meta.innerHTML, /Environment/);
  assert.match(meta.innerHTML, /composition held from perceptual scale evidence/);
  assert.doesNotMatch(meta.innerHTML, /accentType/);
  assert.doesNotMatch(meta.innerHTML, /Artist links unavailable/);
  assert.doesNotMatch(meta.innerHTML, /Scene authoring brief unavailable/);
  assert.doesNotMatch(meta.innerHTML, /Emotional arc unavailable/);
  assert.doesNotMatch(meta.innerHTML, /Composition logic unavailable/);
  assert.doesNotMatch(meta.innerHTML, /Selection rationale/);
  assert.doesNotMatch(meta.innerHTML, /Quality lens/);
  assert.doesNotMatch(meta.innerHTML, /\bn\/a\b/i);
});
