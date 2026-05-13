import * as THREE from 'three';
import { disposeObjectTree } from './scene-runtime.js';

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

    const radius = number(environment.radius, 90);
    const geometry = new THREE.SphereGeometry(radius, 48, 24);
    const material = new THREE.MeshBasicMaterial({
      color: color(environment.fieldColor || palette.field || bg, bg),
      side: THREE.BackSide,
      transparent: true,
      opacity: number(environment.opacity, 0.9)
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'immersive-world-environment';
    this.group.add(mesh);
    return { kind: environment.kind || 'skybox-field', radius };
  }

  applyCamera(world) {
    const camera = asObject(world.camera);
    const position = vector3(camera.position, [0, 2.2, number(camera.radius, 14)]);
    const target = vector3(camera.target, [0, 0, 0]);
    this.camera.near = number(camera.near, 0.1);
    this.camera.far = number(camera.far, 200);
    this.camera.fov = number(camera.fov, 65);
    this.camera.position.set(position[0], position[1], position[2]);
    this.camera.lookAt(target[0], target[1], target[2]);
    this.camera.updateProjectionMatrix();
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
    const result = normalizeModuleResult(await createPart({
      THREE,
      part,
      world,
      seed: config.seed,
      assets,
      utilities: { normalizePublicRuntimeUrl }
    }));
    if (!result.object?.isObject3D) {
      throw new Error(`Immersive world module did not return a Three.js Object3D: ${part.id || index}`);
    }
    result.object.name = result.object.name || part.id || `immersive-world-part-${index + 1}`;
    this.group.add(result.object);
    if (result.update) this.updateHooks.push(result.update);
    if (result.dispose) this.disposeHooks.push(result.dispose);
    return {
      id: part.id || null,
      role: part.role || null,
      moduleUrl: moduleRef.url,
      assetCount: assets.length
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
    this.applyCamera(world);

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
    this.clearWorld();
    disposeObjectTree(this.scene);
    this.renderer?.dispose?.();
  }
}
