import * as THREE from 'three';
import { applyPrimitiveAnimations } from './scene-animations.js';
import { addSceneLighting, applySceneEnvironment, rebuildSceneElements } from './scene-assembly.js';
import {
  applyViewportOrbitFrame as applyViewportOrbitFrameState,
  bindOrbitInput as bindOrbitInputHandlers,
  computeViewportOrbitFrame as computeViewportOrbitFrameState,
  resetCameraForArtwork as resetCameraForArtworkState,
  updateCameraFromOrbit as updateCameraFromOrbitState,
  updateOrbitForFrame
} from './scene-camera.js';
import {
  applyPipelinePatches,
  buildModuleOverrideResolver,
  prepareRuntimeSceneConfig,
  resolveBreathingConfig,
  resolvePostBase,
  selectActiveSceneElements
} from './scene-config.js';
import {
  createArtworkRenderer,
  createPostPass,
  createPostRenderTarget,
  resizeSceneRenderTargets
} from './scene-rendering.js';
import { disposeObjectTree, loadElementRuntime } from './scene-runtime.js';


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
    this.bindOrbitInput();
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

    const { sceneCfg, elements } = prepareRuntimeSceneConfig(config);

    this.styleFingerprint = {
      ...this.styleFingerprint,
      ...(sceneCfg.styleFingerprint || {})
    };

    const customModules = Array.isArray(sceneCfg.sceneAuthoring?.customModules)
      ? sceneCfg.sceneAuthoring.customModules
      : [];
    const moduleOverrideResolver = buildModuleOverrideResolver(sceneCfg.sceneAuthoring?.moduleOverrides || []);
    const activeElements = selectActiveSceneElements(sceneCfg, elements);

    const {
      builders: elementBuilders,
      customModuleReport,
      pipelinePatches
    } = await loadElementBuilders(activeElements, customModules);
    if (applyToken !== this.applyConfigToken) return false;
    this.customModuleReport = customModuleReport || null;
    sceneCfg.customModuleReport = customModuleReport || sceneCfg.customModuleReport || null;
    applyPipelinePatches(sceneCfg, pipelinePatches);

    let rebuilt;
    try {
      rebuilt = rebuildSceneElements({
        group: this.group,
        requestedElements: elements,
        activeElements,
        sceneCfg,
        seed: config.seed,
        elementBuilders,
        buildElementObject,
        moduleOverrideResolver
      });
    } catch (error) {
      this.sceneAssemblyReport = error?.sceneAssemblyReport || null;
      throw error;
    }
    this.animations = rebuilt.animations;
    this.uniformTargets = rebuilt.uniformTargets;
    this.sceneAssemblyReport = rebuilt.assemblyReport || null;

    applySceneEnvironment(this.scene, sceneCfg);
    addSceneLighting(this.group, sceneCfg);

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

    this.breathing = resolveBreathingConfig(sceneCfg);

    this.postBase = resolvePostBase(sceneCfg);
    this.renderer.toneMappingExposure = this.postBase.exposure;
    this.postUniforms.uContrast.value = this.postBase.contrast;
    this.postUniforms.uSaturation.value = this.postBase.saturation;
    this.postUniforms.uVignette.value = this.postBase.vignette;
    this.postUniforms.uDistortion.value = this.postBase.distortion * this.motionIntensity;
    return true;
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
    resetCameraForArtworkState(this, camCfg);
  }

  computeViewportOrbitFrame(aspect = this.camera.aspect || 1) {
    return computeViewportOrbitFrameState(aspect);
  }

  applyViewportOrbitFrame({ resetOrbit = false } = {}) {
    applyViewportOrbitFrameState(this, { resetOrbit });
  }

  bindOrbitInput() {
    bindOrbitInputHandlers(this);
  }

  updateCameraFromOrbit() {
    updateCameraFromOrbitState(this);
  }

  resize() {
    resizeSceneRenderTargets({
      canvas: this.canvas,
      renderer: this.renderer,
      renderTarget: this.renderTarget,
      postUniforms: this.postUniforms,
      camera: this.camera
    });
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
