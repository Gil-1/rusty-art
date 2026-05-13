import * as THREE from 'three';
import {
  applyViewportOrbitFrame,
  bindOrbitInput,
  updateCameraFromOrbit
} from './scene-camera.js';
import {
  applyImmersiveWorldSkyboxDefaults,
  createImmersiveWorldSkyboxUtilities,
  isImmersiveWorldSkyboxMode,
  resolveImmersiveWorldSkyboxRadius,
  shouldUseImmersiveWorldSkybox
} from './immersive-world-skybox.js';
import { disposeObjectTree } from './scene-runtime.js';

const WORLD_ENVIRONMENT_PART_ID = 'world-environment';
const LEGACY_ORBIT_CONTROLS = Object.freeze({
  minDistance: 6,
  maxDistance: 24,
  autoRotate: false,
  autoRotateSpeed: 0.14,
  dampingFactor: 0.08
});
const DEFAULT_ORBIT_POSE = Object.freeze({
  radius: 12,
  theta: 0,
  phi: Math.PI / 2.2
});

export function isRemoteRuntimeRef(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(String(value || '').trim());
}

export function normalizePublicRuntimeUrl(value, {
  expectedDir = 'data',
  baseHref = typeof window !== 'undefined' ? window.location.href : 'http://localhost/'
} = {}) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('Runtime ref URL is required.');
  if (isRemoteRuntimeRef(raw)) throw new Error(`Remote runtime refs are not allowed: ${raw}`);

  const normalized = raw.replace(/^\.\//, '').replace(/^\//, '');
  const safeDir = expectedDir.replace(/^\.\//, '').replace(/^\//, '').replace(/\/+$/, '');
  if (!normalized.startsWith(`${safeDir}/`)) {
    throw new Error(`Runtime ref must point under ${safeDir}: ${raw}`);
  }
  return new URL(normalized, baseHref).href;
}

function asObject(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function color(value, fallback) {
  const text = String(value || '').trim();
  return text || fallback;
}

function number(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function vector3(value, fallback) {
  if (Array.isArray(value) && value.length === 3) {
    const values = value.map(Number);
    if (values.every(Number.isFinite)) return values;
  }
  if (value && typeof value === 'object') {
    const values = [Number(value.x), Number(value.y), Number(value.z)];
    if (values.every(Number.isFinite)) return values;
  }
  return fallback;
}

function orbitPoseFromCamera({ position = [0, 0, 12], target = [0, 0, 0], fallbackRadius = 12 } = {}) {
  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];
  const rawRadius = Math.hypot(dx, dy, dz);
  const radius = Number.isFinite(rawRadius) && rawRadius > 0.0001 ? rawRadius : fallbackRadius;
  const theta = Math.atan2(dx, dz);
  const phi = Math.acos(clamp(dy / Math.max(radius, 0.0001), -1, 1));
  return {
    radius,
    theta: Number.isFinite(theta) ? theta : DEFAULT_ORBIT_POSE.theta,
    phi: Number.isFinite(phi) ? phi : DEFAULT_ORBIT_POSE.phi
  };
}

export function isWorldEnvironmentPart(part = {}) {
  const id = String(part?.partId || part?.id || '').trim().toLowerCase();
  const role = String(part?.role || '').trim().toLowerCase();
  return id === WORLD_ENVIRONMENT_PART_ID || role === WORLD_ENVIRONMENT_PART_ID;
}

export function initializeImmersiveWorldCameraControls(scene, { bindInput = true } = {}) {
  scene.controls = { ...LEGACY_ORBIT_CONTROLS };
  scene.orbit = {
    target: new THREE.Vector3(0, 0, 0),
    radius: DEFAULT_ORBIT_POSE.radius,
    theta: DEFAULT_ORBIT_POSE.theta,
    phi: DEFAULT_ORBIT_POSE.phi,
    thetaVel: 0,
    phiVel: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    userControlLocked: false
  };
  scene.baseOrbitPose = { ...DEFAULT_ORBIT_POSE };
  scene.baseOrbitTarget = new THREE.Vector3(0, 0, 0);
  scene.viewportOrbitFrame = { radiusMultiplier: 1, phiOffset: 0, targetYOffset: 0 };
  scene.cameraMotionEnabled = false;
  scene.cameraBeats = null;
  scene.cameraCycleSeconds = 24;
  scene.styleFingerprint = scene.styleFingerprint || { cameraSway: 0 };

  if (bindInput && scene.canvas) {
    scene.cameraInputTeardown?.();
    scene.cameraInputTeardown = bindOrbitInput(scene);
  }

  updateCameraFromOrbit(scene);
  return {
    controls: scene.controls,
    orbit: scene.orbit,
    teardown: scene.cameraInputTeardown || null
  };
}

export function applyImmersiveWorldCameraConfig(scene, world = {}) {
  const camera = asObject(world.camera);
  const environment = asObject(world.environment);
  const position = vector3(camera.position, [0, 2.2, number(camera.radius, 14)]);
  const target = vector3(camera.target, [0, 0, 0]);
  const pose = orbitPoseFromCamera({
    position,
    target,
    fallbackRadius: number(camera.radius, DEFAULT_ORBIT_POSE.radius)
  });

  scene.camera.near = number(camera.near, 0.1);
  const requestedFar = number(camera.far, 220);
  const explicitSkyboxRadius = Number(environment.skyboxRadius);
  const skyboxRadius = Number.isFinite(explicitSkyboxRadius) && explicitSkyboxRadius > 0
    || isImmersiveWorldSkyboxMode(environment.kind)
    || isImmersiveWorldSkyboxMode(environment.renderMode)
    || isImmersiveWorldSkyboxMode(environment.mode)
    ? resolveImmersiveWorldSkyboxRadius(world, { fallback: 0, min: 0 })
    : 0;
  scene.camera.far = Math.max(requestedFar, skyboxRadius ? skyboxRadius * 1.05 : requestedFar);
  scene.camera.fov = number(camera.fov, 65);
  scene.camera.updateProjectionMatrix();

  scene.baseOrbitTarget.set(target[0], target[1], target[2]);
  scene.baseOrbitPose.radius = clamp(pose.radius, scene.controls.minDistance, scene.controls.maxDistance);
  scene.baseOrbitPose.theta = pose.theta;
  scene.baseOrbitPose.phi = pose.phi;

  scene.orbit.thetaVel = 0;
  scene.orbit.phiVel = 0;
  scene.orbit.dragging = false;
  scene.orbit.userControlLocked = false;
  applyViewportOrbitFrame(scene, { resetOrbit: true });
  return {
    source: 'world.camera',
    owner: camera.owner || null,
    requested: {
      position,
      target,
      near: camera.near ?? null,
      far: camera.far ?? null,
      fov: camera.fov ?? null
    },
    applied: {
      near: scene.camera.near,
      far: scene.camera.far,
      fov: scene.camera.fov,
      baseOrbitTarget: scene.baseOrbitTarget.toArray(),
      baseOrbitPose: { ...scene.baseOrbitPose },
      viewportOrbitFrame: { ...scene.viewportOrbitFrame }
    },
    alignment: {
      status: 'aligned',
      source: 'world.camera',
      appliedByFrontend: true,
      previewAndFrontendRuntime: 'shared-immersive-world-camera-config',
      viewportFrameApplied: true
    }
  };
}

export function updateImmersiveWorldCameraControlsForFrame(scene, { time = 0, motionIntensity = 1 } = {}) {
  if (!scene.captureMode) {
    const canAutoMoveCamera = !scene.orbit.dragging && !scene.orbit.userControlLocked;
    if (scene.controls.autoRotate && canAutoMoveCamera) {
      scene.orbit.theta += 0.001 * scene.controls.autoRotateSpeed * 4 * motionIntensity;
    }
    scene.orbit.theta += scene.orbit.thetaVel;
    scene.orbit.phi += scene.orbit.phiVel;
    scene.orbit.thetaVel *= 1 - scene.controls.dampingFactor;
    scene.orbit.phiVel *= 1 - scene.controls.dampingFactor;
  }

  updateCameraFromOrbit(scene);
  return {
    time,
    radius: scene.orbit.radius,
    theta: scene.orbit.theta,
    phi: scene.orbit.phi
  };
}

function measureObjectRadius(object) {
  const bounds = new THREE.Box3().setFromObject(object);
  if (bounds.isEmpty()) return null;
  const sphere = new THREE.Sphere();
  bounds.getBoundingSphere(sphere);
  return Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : null;
}

export function adaptWorldEnvironmentObject({ object, part, world } = {}) {
  if (!object?.isObject3D || !isWorldEnvironmentPart(part)) {
    return { adapted: false, reason: 'not-world-environment' };
  }
  if (!shouldUseImmersiveWorldSkybox({ object, part, world })) {
    return { adapted: false, reason: 'environment-artwork' };
  }

  const targetRadius = resolveImmersiveWorldSkyboxRadius(world);
  const currentRadius = measureObjectRadius(object) || 1;
  const scaleMultiplier = targetRadius / currentRadius;
  object.scale.multiplyScalar(scaleMultiplier);
  applyImmersiveWorldSkyboxDefaults(THREE, object, { radius: targetRadius });

  return {
    adapted: true,
    targetRadius,
    previousRadius: currentRadius,
    scaleMultiplier
  };
}

function resolveCreatePart(module) {
  return module?.createImmersiveWorldPart || module?.createPart || module?.create || module?.default || null;
}

function normalizeModuleResult(result) {
  if (!result) return { object: null, update: null, dispose: null };
  if (result.isObject3D) return { object: result, update: null, dispose: null };
  return {
    object: result.object || result.obj || null,
    update: typeof result.update === 'function' ? result.update : null,
    dispose: typeof result.dispose === 'function' ? result.dispose : null
  };
}

export class ArtworkScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, 1, 0.1, 200);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.clock = new THREE.Clock();
    this.updateHooks = [];
    this.disposeHooks = [];
    this.renderFrameCount = 0;
    this.renderFrameWaiters = [];
    this.motionIntensity = 1;
    this.captureMode = false;
    this.captureTime = 1.234;
    this.sceneAssemblyReport = null;
    this.cameraInputTeardown = null;
    initializeImmersiveWorldCameraControls(this);
    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
    requestAnimationFrame(this.animate);
  }

  getAssemblyReport() {
    return this.sceneAssemblyReport;
  }

  setMotionIntensity(intensity = 1) {
    this.motionIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));
  }

  setCaptureMode(enabled = false, freezeTime = 1.234) {
    this.captureMode = Boolean(enabled);
    this.captureTime = Number.isFinite(freezeTime) ? freezeTime : 1.234;
    this.setMotionIntensity(this.captureMode ? 0 : this.motionIntensity);
  }

  clearWorld() {
    this.disposeHooks.splice(0).forEach((dispose) => dispose());
    while (this.group.children.length) {
      const child = this.group.children[0];
      this.group.remove(child);
      disposeObjectTree(child);
    }
    this.updateHooks = [];
  }

  applyEnvironment(world) {
    const environment = asObject(world.environment);
    const palette = asObject(world.palette);
    const bg = color(environment.color || palette.background || palette.bg, '#090b12');
    this.scene.background = new THREE.Color(bg);
    this.scene.fog = new THREE.FogExp2(bg, number(environment.fogDensity, 0.018));

    const radius = resolveImmersiveWorldSkyboxRadius(world);
    const geometry = new THREE.SphereGeometry(radius, 48, 24);
    const material = new THREE.MeshBasicMaterial({
      color: color(environment.fieldColor || palette.field || bg, bg),
      side: THREE.BackSide,
      transparent: true,
      opacity: number(environment.opacity, 0.9),
      depthWrite: false,
      depthTest: true,
      fog: false,
      toneMapped: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'immersive-world-environment-shell';
    applyImmersiveWorldSkyboxDefaults(THREE, mesh, { radius, renderOrder: -1100 });
    this.group.add(mesh);
    return { kind: environment.kind || 'skybox-field', radius };
  }

  applyCamera(world) {
    return applyImmersiveWorldCameraConfig(this, world);
  }

  applyLighting(world) {
    const lighting = asObject(world.lighting);
    const ambient = new THREE.AmbientLight(color(lighting.ambientColor, '#8aa0c8'), number(lighting.ambientIntensity, 0.62));
    const key = new THREE.DirectionalLight(color(lighting.keyColor, '#ffffff'), number(lighting.keyIntensity, 1.05));
    const rim = new THREE.PointLight(color(lighting.rimColor, '#d9c7ff'), number(lighting.rimIntensity, 0.7), 32, 2);
    const keyPosition = vector3(lighting.keyPosition, [4, 6, 8]);
    const rimPosition = vector3(lighting.rimPosition, [-5, 2, -4]);
    key.position.set(keyPosition[0], keyPosition[1], keyPosition[2]);
    rim.position.set(rimPosition[0], rimPosition[1], rimPosition[2]);
    this.group.add(ambient);
    this.group.add(key);
    this.group.add(rim);
  }

  async buildPart({ part, world, config, index }) {
    const moduleRef = asObject(part.moduleRef || part.module, null);
    if (!moduleRef) throw new Error(`Immersive world part ${part.id || index} is missing moduleRef.`);
    const moduleUrl = normalizePublicRuntimeUrl(moduleRef.url, { expectedDir: 'data/immersive-world/generated-modules' });
    const module = await import(moduleUrl);
    const createPart = resolveCreatePart(module);
    if (typeof createPart !== 'function') {
      throw new Error(`Immersive world module did not export createPart: ${moduleRef.url}`);
    }
    const assets = (Array.isArray(part.assetRefs) ? part.assetRefs : []).map((asset) => ({
      ...asset,
      url: normalizePublicRuntimeUrl(asset.url, { expectedDir: 'data/immersive-world/generated-assets' })
    }));
    const skyboxUtilities = createImmersiveWorldSkyboxUtilities(THREE);
    const result = normalizeModuleResult(await createPart({
      THREE,
      part,
      world,
      seed: config.seed,
      assets,
      utilities: {
        normalizePublicRuntimeUrl,
        ...skyboxUtilities,
        skybox: skyboxUtilities
      }
    }));
    if (!result.object?.isObject3D) {
      throw new Error(`Immersive world module did not return a Three.js Object3D: ${part.id || index}`);
    }
    const environmentAdaptation = adaptWorldEnvironmentObject({ object: result.object, part, world });
    result.object.name = result.object.name || part.id || `immersive-world-part-${index + 1}`;
    this.group.add(result.object);
    if (result.update) this.updateHooks.push(result.update);
    if (result.dispose) this.disposeHooks.push(result.dispose);
    return {
      id: part.id || null,
      role: part.role || null,
      moduleUrl: moduleRef.url,
      assetCount: assets.length,
      environmentAdaptation: environmentAdaptation.adapted ? environmentAdaptation : undefined
    };
  }

  async applyConfig(config) {
    const world = asObject(config?.world, null);
    if (!world) throw new Error('Immersive world artwork is missing world.');
    const parts = Array.isArray(world.parts) ? world.parts : [];
    if (!parts.length) throw new Error('Immersive world artwork is missing world.parts.');

    this.clearWorld();
    const environment = this.applyEnvironment(world);
    this.applyLighting(world);
    const camera = this.applyCamera(world);

    const builtParts = [];
    try {
      for (const [index, part] of parts.entries()) {
        builtParts.push(await this.buildPart({ part, world, config, index }));
      }
    } catch (error) {
      this.sceneAssemblyReport = {
        method: 'immersive-world-v1',
        status: 'failed',
        error: error?.message || String(error),
        builtParts
      };
      error.sceneAssemblyReport = this.sceneAssemblyReport;
      throw error;
    }

    this.sceneAssemblyReport = {
      method: 'immersive-world-v1',
      status: 'ok',
      worldId: world.id || config.id || null,
      environment,
      camera,
      cameraAlignment: camera.alignment,
      builtParts,
      partCount: builtParts.length
    };
    return true;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || this.canvas.clientWidth || 1));
    const height = Math.max(1, Math.round(rect.height || this.canvas.clientHeight || 1));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.orbit) applyViewportOrbitFrame(this);
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

  animate() {
    const t = this.captureMode ? this.captureTime : this.clock.getElapsedTime();
    updateImmersiveWorldCameraControlsForFrame(this, { time: t, motionIntensity: this.motionIntensity });
    for (const update of this.updateHooks) update({ time: t, motionIntensity: this.motionIntensity, camera: this.camera });
    this.renderer.render(this.scene, this.camera);
    this.renderFrameCount += 1;
    if (this.renderFrameWaiters.length) {
      const dueWaiters = this.renderFrameWaiters.filter((waiter) => this.renderFrameCount >= waiter.targetFrame);
      this.renderFrameWaiters = this.renderFrameWaiters.filter((waiter) => this.renderFrameCount < waiter.targetFrame);
      dueWaiters.forEach((waiter) => waiter.resolve());
    }
    requestAnimationFrame(this.animate);
  }

  dispose() {
    window.removeEventListener('resize', this.resize);
    this.cameraInputTeardown?.();
    this.cameraInputTeardown = null;
    this.clearWorld();
    disposeObjectTree(this.scene);
    this.renderer?.dispose?.();
  }
}
