import * as THREE from 'three';
import {
  applyViewportOrbitFrame as applyViewportOrbitFrameState,
  bindOrbitInput as bindOrbitInputHandlers,
  computeViewportOrbitFrame as computeViewportOrbitFrameState,
  createSceneCameraInteraction,
  resetCameraForArtwork as resetCameraForArtworkState,
  updateCameraFromOrbit as updateCameraFromOrbitState
} from './scene-camera.js';
import {
  applySceneConfigSession
} from './scene-apply-config-session.js';
import {
  createArtworkRenderer,
  createPostPass,
  createPostRenderTarget,
  resizeSceneRenderTargets
} from './scene-rendering.js';
import {
  createBrowserResizeAdapter,
  createBrowserTimingAdapter,
  createSceneFrameLifecycle
} from './scene-frame-lifecycle.js';
import { renderSceneFramePass } from './scene-frame-render-pass.js';
import { disposeObjectTree } from './scene-runtime.js';


export class ArtworkScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = createArtworkRenderer(canvas, window.devicePixelRatio || 1);

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
    this.cameraInteraction = createSceneCameraInteraction(this);
    this.cameraInteraction.bindInput();
    this.updateCameraFromOrbit();

    const { renderTarget, samples } = createPostRenderTarget(this.renderer);
    this.renderTarget = renderTarget;
    this.renderTargetSamples = samples;
    const postPass = createPostPass(this.renderTarget);
    this.postScene = postPass.postScene;
    this.postCamera = postPass.postCamera;
    this.postUniforms = postPass.postUniforms;
    this.postQuad = postPass.postQuad;

    this.animations = [];
    this.uniformTargets = [];
    this.sceneAssemblyReport = null;
    this.motionSpeed = 0.001;
    this.currentTension = 0.5;
    this.cameraBeats = null;
    this.cameraCycleSeconds = 24;
    this.cameraMotionEnabled = false;
    this.canonicalFirstViewEstablished = false;
    this.breathing = { hueShift: 0.01, saturationAmplitude: 0.06, exposureAmplitude: 0.04, phaseA: 0.17, phaseB: 0.43 };
    this.postBase = { contrast: 1.08, saturation: 1.04, vignette: 0.26, distortion: 0.24, exposure: 1 };
    this.styleFingerprint = { pulseFamily: 'balanced', stripeWarp: 0.14, edgeSoftness: 0.26, cameraSway: 0.16, cadenceBias: 0, temperatureBias: 0 };
    this.motionIntensity = 1;
    this.captureMode = false;
    this.captureTime = 1.234;
    this.applyConfigToken = 0;

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    this.frameLifecycle = createSceneFrameLifecycle({
      onResize: () => this.resizeFrameTargets(),
      onFrame: () => this.renderFrame(),
      timing: createBrowserTimingAdapter(window),
      resizeAdapter: createBrowserResizeAdapter({
        canvas: this.canvas,
        target: window,
        resizeObserverCtor: typeof ResizeObserver !== 'undefined' ? ResizeObserver : undefined
      })
    });

    this.frameLifecycle.start();
  }

  async applyConfig(config) {
    const applyToken = ++this.applyConfigToken;
    return applySceneConfigSession(this, config, {
      applyToken,
      getCurrentApplyToken: () => this.applyConfigToken
    });
  }

  getAssemblyReport() {
    return this.sceneAssemblyReport;
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
      this.resetCameraForArtwork();
      this.setMotionIntensity(0);
    }
  }

  waitForRenderedFrame(timeoutMs = 2500) {
    return this.frameLifecycle.waitForRenderedFrame(timeoutMs);
  }

  get renderFrameCount() {
    return this.frameLifecycle?.getFrameCount?.() || 0;
  }

  get renderFrameWaiters() {
    return this.frameLifecycle?.getPendingWaiters?.() || [];
  }

  resetCameraForArtwork(camCfg = {}) {
    resetCameraForArtworkState(this, camCfg);
  }

  computeViewportOrbitFrame(aspect = this.camera.aspect || 1) {
    return computeViewportOrbitFrameState(aspect);
  }

  applyViewportOrbitFrame({ resetOrbit = false } = {}) {
    applyViewportOrbitFrameState(this, { resetOrbit });
  }

  bindOrbitInput() {
    return bindOrbitInputHandlers(this);
  }

  updateCameraFromOrbit() {
    updateCameraFromOrbitState(this);
  }

  resize() {
    return this.frameLifecycle.resize();
  }

  resizeFrameTargets() {
    resizeSceneRenderTargets({
      canvas: this.canvas,
      renderer: this.renderer,
      renderTarget: this.renderTarget,
      postUniforms: this.postUniforms,
      camera: this.camera
    });
    this.applyViewportOrbitFrame();
  }

  animate(timestamp) {
    return this.frameLifecycle.animate(timestamp);
  }

  renderFrame() {
    renderSceneFramePass(this);
  }

  stop() {
    this.frameLifecycle?.stop();
  }

  dispose() {
    this.frameLifecycle?.dispose();
    this.cameraInteraction?.dispose();
    disposeObjectTree(this.group);
    disposeObjectTree(this.postScene);
    this.renderTarget?.dispose?.();
    this.renderer?.dispose?.();
  }
}
