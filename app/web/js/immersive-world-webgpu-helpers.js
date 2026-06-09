import {
  WEBGPU_NATIVE_HELPER_IDS,
  buildWebGPUNativeHelperFeatureFacts
} from './contracts/webgpu-material-factory-catalog.js';

const TAU = Math.PI * 2;
const MAX_POINT_PARTICLE_COUNT = 1500;
const MAX_INSTANCED_MARK_COUNT = 600;

function asObject(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function boundedNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(numeric, min, max);
}

function positiveInteger(value, fallback, { min = 1, max = 1024 } = {}) {
  const numeric = Math.floor(Number(value));
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(numeric, min, max);
}

function vectorComponents(value, fallback, { max = 100000 } = {}) {
  if (Array.isArray(value)) {
    return fallback.map((entry, index) => boundedNumber(value[index], entry, { min: -max, max }));
  }
  const source = asObject(value, null);
  if (source) {
    return [
      boundedNumber(source.x, fallback[0], { min: -max, max }),
      boundedNumber(source.y, fallback[1], { min: -max, max }),
      boundedNumber(source.z, fallback[2], { min: -max, max })
    ].slice(0, fallback.length);
  }
  const scalar = Number(value);
  return Number.isFinite(scalar)
    ? fallback.map(() => boundedNumber(scalar, 1, { min: -max, max }))
    : fallback.slice();
}

function assignColor(THREE, target, value, fallback = '#ffffff') {
  if (Array.isArray(value)) {
    target.setRGB(Number(value[0]) || 0, Number(value[1]) || 0, Number(value[2]) || 0);
    return target;
  }
  if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
    target.setRGB(Number(value.r) || 0, Number(value.g) || 0, Number(value.b) || 0);
    return target;
  }
  target.set(value ?? fallback);
  return target;
}

function resolvePalette(THREE, palette, fallback = ['#ffffff']) {
  const source = Array.isArray(palette) && palette.length ? palette : fallback;
  return source.slice(0, 8).map((entry) => assignColor(THREE, new THREE.Color(), entry));
}

function hashSeedText(seed, salt = '') {
  const text = `${seed ?? ''}|${salt ?? ''}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed, salt = '') {
  let state = hashSeedText(seed, salt) || 1;
  return function seededRandom() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function featureUserData(helperId, { budget = {}, userData = {}, webgpuSafeSurface = null } = {}) {
  const facts = buildWebGPUNativeHelperFeatureFacts(helperId, { budget }) || {};
  return {
    ...asObject(userData),
    materialFactoryId: facts.materialFactoryId,
    webgpuHelperId: facts.helperId,
    webgpuFeatureFamily: facts.featureFamily,
    rendererCompatibility: facts.rendererCompatibility,
    webgpuBudget: facts.budget,
    webgpuNativeFeature: facts,
    ...(webgpuSafeSurface ? { webgpuSafeSurface } : {})
  };
}

function annotateFeature(target, helperId, options = {}) {
  if (!target) return target;
  target.userData = featureUserData(helperId, {
    ...options,
    userData: {
      ...asObject(target.userData),
      ...asObject(options.userData)
    }
  });
  return target;
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    for (const entry of material) entry?.dispose?.();
    return;
  }
  material?.dispose?.();
}

export function createImmersiveWorldColorFieldMaterial(THREE, {
  name = 'immersive-world-color-field-material',
  color = '#ffffff',
  opacity = 1,
  transparent = opacity < 1,
  vertexColors = false,
  side = THREE.DoubleSide,
  depthWrite = true,
  depthTest = true,
  toneMapped = false,
  userData = {}
} = {}) {
  if (!THREE) throw new Error('createImmersiveWorldColorFieldMaterial requires THREE.');
  const material = new THREE.MeshBasicMaterial({
    name,
    color,
    transparent,
    opacity: boundedNumber(opacity, 1, { min: 0, max: 1 }),
    vertexColors,
    side,
    depthWrite,
    depthTest,
    toneMapped
  });
  return annotateFeature(material, WEBGPU_NATIVE_HELPER_IDS.COLOR_FIELD_MATERIAL, {
    userData,
    webgpuSafeSurface: 'MeshBasicMaterial color field'
  });
}

export function createImmersiveWorldProceduralMarkMaterial(THREE, {
  name = 'immersive-world-procedural-mark-material',
  color = '#ffffff',
  opacity = 0.72,
  transparent = true,
  vertexColors = false,
  side = THREE.DoubleSide,
  depthWrite = false,
  depthTest = true,
  toneMapped = false,
  userData = {}
} = {}) {
  if (!THREE) throw new Error('createImmersiveWorldProceduralMarkMaterial requires THREE.');
  const material = new THREE.MeshBasicMaterial({
    name,
    color,
    transparent,
    opacity: boundedNumber(opacity, 0.72, { min: 0, max: 1 }),
    vertexColors,
    side,
    depthWrite,
    depthTest,
    toneMapped
  });
  return annotateFeature(material, WEBGPU_NATIVE_HELPER_IDS.PROCEDURAL_MARK_MATERIAL, {
    userData,
    webgpuSafeSurface: 'MeshBasicMaterial procedural marks'
  });
}

export function createImmersiveWorldPointParticleField(THREE, {
  name = 'immersive-world-point-particle-field',
  seed = 'point-particle-field',
  salt = name,
  count = 256,
  spread = [1, 1, 1],
  palette = ['#ffffff'],
  size = 0.035,
  opacity = 0.48,
  depthWrite = false,
  depthTest = true,
  userData = {},
  materialUserData = {}
} = {}) {
  if (!THREE) throw new Error('createImmersiveWorldPointParticleField requires THREE.');
  const safeCount = positiveInteger(count, 256, { min: 1, max: MAX_POINT_PARTICLE_COUNT });
  const safeSize = boundedNumber(size, 0.035, { min: 0.001, max: 0.12 });
  const safeOpacity = boundedNumber(opacity, 0.48, { min: 0, max: 1 });
  const [spreadX, spreadY, spreadZ] = vectorComponents(spread, [1, 1, 1], { max: 100000 }).map(Math.abs);
  const random = createSeededRandom(seed, salt);
  const colors = resolvePalette(THREE, palette);
  const positions = new Float32Array(safeCount * 3);
  const colorValues = new Float32Array(safeCount * 3);

  for (let index = 0; index < safeCount; index += 1) {
    positions[index * 3] = (random() - 0.5) * spreadX;
    positions[index * 3 + 1] = (random() - 0.5) * spreadY;
    positions[index * 3 + 2] = (random() - 0.5) * spreadZ;
    const color = colors[Math.floor(random() * colors.length)] || colors[0];
    colorValues[index * 3] = color.r;
    colorValues[index * 3 + 1] = color.g;
    colorValues[index * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colorValues, 3));
  const material = new THREE.PointsMaterial({
    name: `${name}-material`,
    size: safeSize,
    sizeAttenuation: true,
    transparent: safeOpacity < 1,
    opacity: safeOpacity,
    vertexColors: true,
    depthWrite,
    depthTest,
    toneMapped: false
  });
  annotateFeature(material, WEBGPU_NATIVE_HELPER_IDS.POINT_PARTICLE_FIELD, {
    userData: materialUserData,
    budget: { count: safeCount, size: safeSize },
    webgpuSafeSurface: 'PointsMaterial point particle field'
  });

  const points = new THREE.Points(geometry, material);
  points.name = name;
  annotateFeature(points, WEBGPU_NATIVE_HELPER_IDS.POINT_PARTICLE_FIELD, {
    userData,
    budget: { count: safeCount, size: safeSize },
    webgpuSafeSurface: 'Points BufferGeometry particle field'
  });
  points.object = points;
  points.points = points;
  points.dispose = function disposeImmersiveWorldPointParticleField() {
    geometry.dispose?.();
    disposeMaterial(material);
  };
  return points;
}

export function createImmersiveWorldInstancedMarkField(THREE, {
  name = 'immersive-world-instanced-mark-field',
  seed = 'instanced-mark-field',
  salt = name,
  count = 128,
  spread = [1, 1, 1],
  size = [0.08, 0.025, 1],
  palette = ['#ffffff'],
  opacity = 0.72,
  depthWrite = false,
  depthTest = true,
  userData = {},
  materialUserData = {}
} = {}) {
  if (!THREE) throw new Error('createImmersiveWorldInstancedMarkField requires THREE.');
  const safeCount = positiveInteger(count, 128, { min: 1, max: MAX_INSTANCED_MARK_COUNT });
  const [spreadX, spreadY, spreadZ] = vectorComponents(spread, [1, 1, 1], { max: 100000 }).map(Math.abs);
  const [width, height] = vectorComponents(size, [0.08, 0.025, 1], { max: 1000 }).map(Math.abs);
  const safeOpacity = boundedNumber(opacity, 0.72, { min: 0, max: 1 });
  const random = createSeededRandom(seed, salt);
  const colors = resolvePalette(THREE, palette);
  const geometry = new THREE.PlaneGeometry(Math.max(0.0001, width), Math.max(0.0001, height), 1, 1);
  const material = createImmersiveWorldProceduralMarkMaterial(THREE, {
    name: `${name}-material`,
    color: colors[0] || '#ffffff',
    opacity: safeOpacity,
    depthWrite,
    depthTest,
    vertexColors: colors.length > 1,
    userData: materialUserData
  });
  const mesh = new THREE.InstancedMesh(geometry, material, safeCount);
  const dummy = new THREE.Object3D();

  mesh.name = name;
  for (let index = 0; index < safeCount; index += 1) {
    dummy.position.set(
      (random() - 0.5) * spreadX,
      (random() - 0.5) * spreadY,
      (random() - 0.5) * spreadZ
    );
    dummy.rotation.set(0, 0, random() * TAU);
    const scale = boundedNumber(0.55 + random() * 0.9, 1, { min: 0.1, max: 2 });
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    if (typeof mesh.setColorAt === 'function') {
      mesh.setColorAt(index, colors[Math.floor(random() * colors.length)] || colors[0]);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  annotateFeature(mesh, WEBGPU_NATIVE_HELPER_IDS.INSTANCED_MARK_FIELD, {
    userData,
    budget: { count: safeCount, width, height },
    webgpuSafeSurface: 'InstancedMesh procedural mark field'
  });
  mesh.object = mesh;
  mesh.mesh = mesh;
  mesh.dispose = function disposeImmersiveWorldInstancedMarkField() {
    geometry.dispose?.();
    disposeMaterial(material);
  };
  return mesh;
}

export function createImmersiveWorldWebGPUNativeUtilities(THREE) {
  return Object.freeze({
    createColorFieldMaterial: (options = {}) => createImmersiveWorldColorFieldMaterial(THREE, options),
    createProceduralMarkMaterial: (options = {}) => createImmersiveWorldProceduralMarkMaterial(THREE, options),
    createPointParticleField: (options = {}) => createImmersiveWorldPointParticleField(THREE, options),
    createInstancedMarkField: (options = {}) => createImmersiveWorldInstancedMarkField(THREE, options)
  });
}
