import * as THREE from 'three';
import { applyImmersiveWorldTextureQuality } from './immersive-world-scene.js';
import { normalizeWebGPUFeatureFacts } from './contracts/webgpu-feature-facts-contract.js';
import {
  collectRendererSceneFeatures,
  createRendererRuntimeFromSelection,
  describeRendererDiagnostics,
  PREFERRED_RENDER_TARGET_SAMPLES,
  POST_PROCESSING_MODES,
  RENDERER_MODES,
  resolveRendererRuntimeSelection
} from './scene-rendering.js';
import { createWebGPURendererRuntime } from './scene-webgpu-renderer-runtime.js';
import {
  createTslPostProcessingControls,
  createTslRenderPipeline
} from './scene-tsl-post-processing.js';
import {
  createBrowserResizeAdapter,
  createBrowserTimingAdapter,
  createRendererAnimationLoopAdapter,
  createSceneFrameLifecycle
} from './scene-frame-lifecycle.js';
import { disposeObjectTree } from './scene-runtime.js';
import { createSceneElapsedTimer } from './scene-time.js';
import { createImmersiveWorldWebGPUNativeUtilities } from './immersive-world-webgpu-helpers.js';

function createPostUniformState() {
  return {
    uTime: { value: 0 },
    uContrast: { value: 1.08 },
    uSaturation: { value: 1.04 },
    uVignette: { value: 0.12 },
    uDistortion: { value: 0.02 },
    uHueShift: { value: 0 },
    uExposureMul: { value: 1 },
    uResolution: { value: new THREE.Vector2(1, 1) }
  };
}

function resolveCanvasSize(canvas, rendererRuntime) {
  const rect = canvas.getBoundingClientRect?.() || {};
  const width = Math.max(1, Math.round(rect.width || canvas.clientWidth || 1));
  const height = Math.max(1, Math.round(rect.height || canvas.clientHeight || 1));
  const resizeFacts = rendererRuntime.resize(width, height, false);
  return {
    width,
    height,
    renderTargetSize: resizeFacts.renderTargetSize || { width, height }
  };
}

export class ArtworkScene {
  constructor(canvas, {
    rendererRequest = RENDERER_MODES.WEBGL_LEGACY,
    postProcessingRequest = POST_PROCESSING_MODES.WEBGPU_TSL_POST,
    captureMode = false,
    art = null,
    navigatorRef = typeof window !== 'undefined' ? window.navigator : null
  } = {}) {
    this.canvas = canvas;
    this.postProcessingRequest = postProcessingRequest;
    this.rendererSceneFeatures = collectRendererSceneFeatures({
      art,
      sceneKind: 'webgpu-project-diagnostic-v1',
      adapterFeatures: {
        webgpuCompatible: true
      }
    });
    this.rendererSelection = resolveRendererRuntimeSelection({
      requestedMode: rendererRequest,
      captureMode,
      sceneFeatures: this.rendererSceneFeatures,
      navigatorRef
    });
    this.rendererRuntime = createRendererRuntimeFromSelection({
      canvas,
      devicePixelRatio: window.devicePixelRatio || 1,
      selection: this.rendererSelection,
      webgpuRuntimeFactory: createWebGPURendererRuntime,
      webgpuRuntimeOptions: { samples: PREFERRED_RENDER_TARGET_SAMPLES }
    });
    this.renderer = this.rendererRuntime.renderer;
    this.rendererInitialized = false;
    this.rendererInitError = null;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0b1018');
    this.camera = new THREE.PerspectiveCamera(54, 1, 0.1, 80);
    this.camera.position.set(0, 1.2, 8.5);
    this.camera.lookAt(0, 0, 0);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.scene.add(new THREE.AmbientLight(0x8fb7ff, 1.45));
    const key = new THREE.DirectionalLight(0xffd4a3, 2.1);
    key.position.set(3.2, 4.5, 5.5);
    this.scene.add(key);

    this.clock = createSceneElapsedTimer(THREE, { documentRef: window.document });
    this.postUniforms = createPostUniformState();
    this.tslPostPipeline = null;
    this.motionIntensity = 1;
    this.captureMode = Boolean(captureMode);
    this.captureTime = 1.234;
    this.sceneAssemblyReport = null;
    this.textureQuality = null;
    this.webgpuFeatureFacts = [];
    this.disposed = false;

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    this.renderFrame = this.renderFrame.bind(this);
    this.frameLifecycle = createSceneFrameLifecycle({
      onResize: () => this.resizeFrameTargets(),
      onFrame: ({ timestamp }) => this.renderFrame({ timestamp }),
      timing: createBrowserTimingAdapter(window),
      resizeAdapter: createBrowserResizeAdapter({
        canvas: this.canvas,
        target: window,
        resizeObserverCtor: typeof ResizeObserver !== 'undefined' ? ResizeObserver : undefined
      }),
      animationLoopAdapter: this.rendererSelection.useWebGPURenderer
        ? createRendererAnimationLoopAdapter(this.rendererRuntime)
        : null
    });

    this.rendererReady = this.rendererRuntime.initialize()
      .then(() => {
        if (this.disposed) return this.renderer;
        this.rendererInitialized = true;
        if (this.rendererSelection.useWebGPURenderer && this.postProcessingRequest === POST_PROCESSING_MODES.WEBGPU_TSL_POST) {
          this.tslPostPipeline = createTslRenderPipeline({
            renderer: this.renderer,
            scene: this.scene,
            camera: this.camera,
            controls: createTslPostProcessingControls(),
            vignetteMode: 'legacy'
          });
          this.postUniforms = this.tslPostPipeline.controls;
        }
        this.frameLifecycle.start();
        return this.renderer;
      })
      .catch((error) => {
        this.rendererInitError = error;
        throw error;
      });
  }

  async applyConfig(config = {}) {
    this.group.clear();
    const palette = config?.scene?.palette || {};
    const primary = palette.primary || '#7ed7ff';
    const secondary = palette.secondary || '#ffb06b';
    const anchor = palette.anchor || '#fff4d6';

    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(9.5, 5.4, 1, 1),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#182334'),
        roughness: 0.82,
        metalness: 0,
        emissive: new THREE.Color('#05070d'),
        emissiveIntensity: 0.4
      })
    );
    field.position.z = -1.2;
    this.group.add(field);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.72, 0.045, 20, 96),
      new THREE.MeshStandardMaterial({
        color: primary,
        roughness: 0.44,
        metalness: 0.08,
        emissive: new THREE.Color(primary),
        emissiveIntensity: 0.18
      })
    );
    ring.rotation.x = Math.PI * 0.08;
    this.group.add(ring);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.58, 3),
      new THREE.MeshStandardMaterial({
        color: anchor,
        roughness: 0.36,
        metalness: 0.12,
        emissive: new THREE.Color(secondary),
        emissiveIntensity: 0.22
      })
    );
    core.position.set(0.12, 0.02, 0.14);
    this.group.add(core);

    const marks = new THREE.Group();
    for (let index = 0; index < 24; index += 1) {
      const angle = (index / 24) * Math.PI * 2;
      const radius = 2.1 + (index % 5) * 0.18;
      const mark = new THREE.Mesh(
        new THREE.BoxGeometry(0.48 + (index % 3) * 0.16, 0.035, 0.035),
        new THREE.MeshStandardMaterial({
          color: index % 2 === 0 ? primary : secondary,
          roughness: 0.66,
          metalness: 0
        })
      );
      mark.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.58, 0.2 + (index % 4) * 0.05);
      mark.rotation.z = angle + Math.PI / 2;
      marks.add(mark);
    }
    this.group.add(marks);
    const webgpuUtilities = createImmersiveWorldWebGPUNativeUtilities(THREE);
    const helperProbe = webgpuUtilities.createPointParticleField({
      name: 'webgpu-diagnostic-point-helper-probe',
      seed: 'webgpu-diagnostic-helper-probe',
      count: 96,
      spread: [4.2, 2.1, 0.45],
      palette: [primary, secondary, anchor],
      size: 0.045,
      opacity: 0.64
    });
    helperProbe.position.set(0, 0, 0.42);
    this.group.add(helperProbe);
    const rgbData = new Uint8Array([
      255, 0, 0,
      0, 255, 0,
      0, 0, 255,
      255, 255, 255
    ]);
    const rgbaData = new Uint8Array([
      255, 255, 255, 255,
      255, 180, 80, 255,
      80, 180, 255, 255,
      12, 18, 30, 255
    ]);
    const rgbTexture = new THREE.DataTexture(rgbData, 2, 2, THREE.RGBFormat, THREE.UnsignedByteType);
    rgbTexture.name = 'webgpu-diagnostic-rgb-unsigned-byte-map';
    const rgbaTexture = new THREE.DataTexture(rgbaData, 2, 2, THREE.RGBAFormat, THREE.UnsignedByteType);
    rgbaTexture.name = 'webgpu-diagnostic-rgba-unsigned-byte-emissive-map';
    const textureProbe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.5, 1, 1),
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        roughness: 0.62,
        metalness: 0,
        map: rgbTexture,
        emissive: new THREE.Color('#202030'),
        emissiveMap: rgbaTexture,
        clearcoat: 0.2,
        clearcoatMap: rgbaTexture
      })
    );
    textureProbe.name = 'webgpu-diagnostic-texture-format-probe';
    textureProbe.position.set(-2.7, -1.55, 0.3);
    this.group.add(textureProbe);
    this.textureQuality = applyImmersiveWorldTextureQuality(this.group, {
      THREE,
      renderer: this.renderer
    });
    this.webgpuFeatureFacts = normalizeWebGPUFeatureFacts([
      helperProbe.userData?.webgpuNativeFeature,
      helperProbe.material?.userData?.webgpuNativeFeature
    ], { defaultReason: 'webgpu-diagnostic-helper-probe', limit: 0 });
    this.diagnosticObjects = { ring, core, marks, helperProbe };
    this.sceneAssemblyReport = {
      summary: {
        built: 5,
        sceneKind: 'webgpu-project-diagnostic-v1',
        rendererCompatibility: this.rendererSceneFeatures.shaderCompatibility,
        webgpuFeatureFacts: this.webgpuFeatureFacts
      },
      built: [
        { id: 'diagnostic-field', moduleType: 'webgpu-diagnostic-field' },
        { id: 'diagnostic-ring', moduleType: 'webgpu-diagnostic-standard-material' },
        { id: 'diagnostic-marks', moduleType: 'webgpu-diagnostic-standard-material' },
        { id: 'diagnostic-helper-probe', moduleType: 'webgpu-native-helper-probe', featureFamily: this.webgpuFeatureFacts[0]?.family || null },
        { id: 'diagnostic-texture-format-probe', moduleType: 'webgpu-diagnostic-texture-format-probe' }
      ],
      textureQuality: this.textureQuality,
      webgpuFeatureFacts: this.webgpuFeatureFacts
    };
    await this.rendererReady;
    return true;
  }

  getAssemblyReport() {
    return this.sceneAssemblyReport;
  }

  getRendererDiagnostics() {
    const outputColorTransformMode = this.rendererSelection?.useWebGPURenderer
      && this.postProcessingRequest === POST_PROCESSING_MODES.WEBGPU_TSL_POST
      ? POST_PROCESSING_MODES.WEBGPU_TSL_POST
      : 'webgpu-diagnostic-direct';
    return this.rendererRuntime?.getDiagnostics?.({
      outputColorTransformMode,
      textureFormatFacts: this.textureQuality?.textureFormatFacts || [],
      webgpuFeatureFacts: this.webgpuFeatureFacts
    }) || describeRendererDiagnostics(this.renderer, { outputColorTransformMode, webgpuFeatureFacts: this.webgpuFeatureFacts });
  }

  setMotionIntensity(intensity = 1) {
    this.motionIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));
  }

  setCaptureMode(enabled = false, freezeTime = 1.234) {
    this.captureMode = Boolean(enabled);
    this.captureTime = Number.isFinite(freezeTime) ? freezeTime : 1.234;
    if (this.captureMode) this.setMotionIntensity(0);
  }

  async waitForRenderedFrame(timeoutMs = 2500) {
    await this.rendererReady;
    return this.frameLifecycle.waitForRenderedFrame(timeoutMs);
  }

  get renderFrameCount() {
    return this.frameLifecycle?.getFrameCount?.() || 0;
  }

  get renderFrameWaiters() {
    return this.frameLifecycle?.getPendingWaiters?.() || [];
  }

  resize() {
    return this.frameLifecycle.resize();
  }

  resizeFrameTargets() {
    const { width, height, renderTargetSize } = resolveCanvasSize(this.canvas, this.rendererRuntime);
    this.postUniforms.uResolution?.value?.set?.(renderTargetSize.width, renderTargetSize.height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    return { width, height, renderTargetSize };
  }

  animate(timestamp) {
    return this.frameLifecycle.animate(timestamp);
  }

  renderFrame({ timestamp } = {}) {
    if (!this.rendererInitialized) return;
    this.clock?.update?.(timestamp);
    const t = this.captureMode ? this.captureTime : this.clock.getElapsedTime();
    const motion = this.motionIntensity ?? 1;
    const ring = this.diagnosticObjects?.ring;
    const core = this.diagnosticObjects?.core;
    const marks = this.diagnosticObjects?.marks;
    if (ring) ring.rotation.z = t * 0.08 * motion;
    if (core) {
      core.rotation.y = t * 0.18 * motion;
      core.rotation.x = Math.sin(t * 0.25) * 0.08 * motion;
    }
    if (marks) marks.rotation.z = -t * 0.035 * motion;

    this.postUniforms.uTime.value = t;
    this.postUniforms.uContrast.value = 1.08;
    this.postUniforms.uSaturation.value = 1.04;
    this.postUniforms.uVignette.value = 0.12;
    this.postUniforms.uDistortion.value = 0.018 * motion;
    this.postUniforms.uHueShift.value = Math.sin(t * 0.13) * 0.01 * motion;
    this.postUniforms.uExposureMul.value = 1.02;

    if (this.tslPostPipeline) {
      this.tslPostPipeline.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  stop() {
    this.frameLifecycle?.stop();
  }

  dispose() {
    this.disposed = true;
    this.frameLifecycle?.dispose();
    this.tslPostPipeline?.dispose?.();
    disposeObjectTree(this.group);
    this.rendererRuntime?.dispose?.();
    this.clock?.dispose?.();
  }
}
