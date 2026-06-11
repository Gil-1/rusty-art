import { MeshBasicNodeMaterial, PointsNodeMaterial } from 'three/webgpu';
import {
  clamp as tslClamp,
  cos,
  dot,
  floor,
  fract,
  Fn,
  mix,
  positionLocal,
  sin,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3
} from 'three/tsl';
import {
  WEBGPU_NATIVE_HELPER_IDS,
  buildWebGPUNativeHelperFeatureFacts
} from './contracts/webgpu-material-factory-catalog.js';
import {
  createImmersiveWorldAnimatedDirectionSpaceSkyboxShell,
  updateImmersiveWorldAnimatedDirectionSpaceSkyboxShellControls
} from './immersive-world-skybox.js';

const TAU = Math.PI * 2;
const MAX_POINT_PARTICLE_COUNT = 1500;
const MAX_INSTANCED_MARK_COUNT = 600;
const ANIMATED_COLOR_FIELD_CONTROLS = Symbol('rusty-art-animated-color-field-controls');
const SCRAPED_PAINT_GRAIN_CONTROLS = Symbol('rusty-art-scraped-paint-grain-controls');
const ANIMATED_POINT_PARTICLE_CONTROLS = Symbol('rusty-art-animated-point-particle-controls');
const ANIMATED_INSTANCED_MARK_CONTROLS = Symbol('rusty-art-animated-instanced-mark-controls');

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
    rendererSurface: facts.runtimeSurface,
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

function animatedColorFieldPalette(THREE, {
  palette = null,
  color = '#ffffff',
  secondaryColor = '#8fb7ff',
  accentColor = '#111827'
} = {}) {
  const colors = resolvePalette(THREE, palette, [color, secondaryColor, accentColor]);
  return [
    colors[0] || assignColor(THREE, new THREE.Color(), color),
    colors[1] || colors[0] || assignColor(THREE, new THREE.Color(), secondaryColor),
    colors[2] || colors[1] || colors[0] || assignColor(THREE, new THREE.Color(), accentColor)
  ];
}

function createAnimatedColorFieldColorNode(controls) {
  return Fn(() => {
    const coordinates = uv().mul(controls.uBandScale);
    const fieldTime = controls.uTime.mul(controls.uFlowSpeed).mul(controls.uMotionIntensity).add(controls.uPhase);
    const diagonal = coordinates.x.add(coordinates.y.mul(0.65));
    const wave = sin(diagonal.mul(TAU).add(fieldTime)).mul(0.5).add(0.5);
    const band = smoothstep(controls.uEdgeLow, controls.uEdgeHigh, wave);
    const accent = cos(coordinates.y.mul(TAU * 0.7).sub(fieldTime.mul(0.73)))
      .mul(0.5)
      .add(0.5)
      .mul(controls.uAccentStrength);
    return mix(mix(controls.uColorA, controls.uColorB, band), controls.uColorC, accent);
  })();
}

function frameTimeFacts(frameFacts = {}) {
  const elapsed = Number(frameFacts.elapsedSeconds ?? frameFacts.time ?? 0);
  const delta = Number(frameFacts.deltaSeconds ?? 0);
  const motion = Number(frameFacts.motionIntensity ?? 1);
  return {
    time: Number.isFinite(elapsed) ? elapsed : 0,
    deltaSeconds: Number.isFinite(delta) ? delta : 0,
    motionIntensity: Number.isFinite(motion) ? clamp(motion, 0, 1) : 1,
    captureMode: frameFacts.captureMode === true
  };
}

function updateAnimatedColorFieldMaterialControls(material, frameFacts = {}) {
  const controls = material?.[ANIMATED_COLOR_FIELD_CONTROLS];
  if (!controls) return null;
  const facts = frameTimeFacts(frameFacts);
  controls.uniforms.uTime.value = facts.time;
  controls.uniforms.uMotionIntensity.value = facts.motionIntensity;
  const publicFacts = {
    helperId: controls.helperId,
    materialFactoryId: controls.materialFactoryId,
    featureFamily: controls.featureFamily,
    mode: 'frame-facts-elapsed-seconds',
    captureMode: facts.captureMode,
    time: facts.time,
    elapsedSeconds: facts.time,
    deltaSeconds: facts.deltaSeconds,
    motionIntensity: facts.motionIntensity
  };
  material.userData = {
    ...asObject(material.userData),
    webgpuTimeControlFacts: publicFacts
  };
  return publicFacts;
}

export function createImmersiveWorldAnimatedColorFieldMaterial(THREE, {
  name = 'immersive-world-animated-color-field-material',
  palette = null,
  color = '#ffffff',
  secondaryColor = '#8fb7ff',
  accentColor = '#111827',
  opacity = 1,
  transparent = opacity < 1,
  side = THREE.DoubleSide,
  depthWrite = true,
  depthTest = true,
  toneMapped = false,
  flowSpeed = 0.35,
  bandScale = 1.65,
  edgeSoftness = 0.18,
  accentStrength = 0.22,
  phase = 0,
  time = 0,
  userData = {}
} = {}) {
  if (!THREE) throw new Error('createImmersiveWorldAnimatedColorFieldMaterial requires THREE.');
  const safeOpacity = boundedNumber(opacity, 1, { min: 0, max: 1 });
  const safeFlowSpeed = boundedNumber(flowSpeed, 0.35, { min: 0, max: 4 });
  const safeBandScale = boundedNumber(bandScale, 1.65, { min: 0.05, max: 24 });
  const safeEdge = boundedNumber(edgeSoftness, 0.18, { min: 0.01, max: 0.49 });
  const safeAccentStrength = boundedNumber(accentStrength, 0.22, { min: 0, max: 1 });
  const safePhase = boundedNumber(phase, 0, { min: -100000, max: 100000 });
  const [primary, secondary, accent] = animatedColorFieldPalette(THREE, {
    palette,
    color,
    secondaryColor,
    accentColor
  });
  const controls = {
    uTime: uniform(boundedNumber(time, 0, { min: -100000, max: 100000 })),
    uMotionIntensity: uniform(1),
    uFlowSpeed: uniform(safeFlowSpeed),
    uBandScale: uniform(safeBandScale),
    uEdgeLow: uniform(safeEdge),
    uEdgeHigh: uniform(1 - safeEdge),
    uAccentStrength: uniform(safeAccentStrength),
    uPhase: uniform(safePhase),
    uOpacity: uniform(safeOpacity),
    uColorA: uniform(primary.clone()),
    uColorB: uniform(secondary.clone()),
    uColorC: uniform(accent.clone())
  };
  const material = new MeshBasicNodeMaterial({
    name,
    transparent: Boolean(transparent),
    opacity: safeOpacity,
    side,
    depthWrite,
    depthTest,
    toneMapped
  });
  material.colorNode = createAnimatedColorFieldColorNode(controls);
  material.opacityNode = controls.uOpacity;
  annotateFeature(material, WEBGPU_NATIVE_HELPER_IDS.ANIMATED_COLOR_FIELD_MATERIAL, {
    userData: {
      ...asObject(userData),
      webgpuTimeControls: {
        mode: 'frame-facts-elapsed-seconds',
        liveMode: 'elapsedSeconds',
        captureMode: 'frozen-by-capture-frame-facts',
        uniform: 'uTime'
      }
    },
    budget: {
      colorStops: Array.isArray(palette) ? Math.min(palette.length, 8) : 3,
      flowSpeed: safeFlowSpeed,
      bandScale: safeBandScale
    },
    webgpuSafeSurface: 'MeshBasicNodeMaterial TSL animated color field'
  });
  Object.defineProperty(material, ANIMATED_COLOR_FIELD_CONTROLS, {
    configurable: true,
    value: {
      helperId: WEBGPU_NATIVE_HELPER_IDS.ANIMATED_COLOR_FIELD_MATERIAL,
      materialFactoryId: 'color-field',
      featureFamily: 'color-field',
      uniforms: controls
    }
  });
  updateAnimatedColorFieldMaterialControls(material, { elapsedSeconds: time, time, motionIntensity: 1, deltaSeconds: 0 });
  return material;
}

function scrapedPaintGrainPalette(THREE, {
  palette = null,
  color = '#f3ead7',
  secondaryColor = '#8f5638',
  scrapeColor = '#17130f'
} = {}) {
  const colors = resolvePalette(THREE, palette, [color, secondaryColor, scrapeColor]);
  return [
    colors[0] || assignColor(THREE, new THREE.Color(), color),
    colors[1] || colors[0] || assignColor(THREE, new THREE.Color(), secondaryColor),
    colors[2] || colors[1] || colors[0] || assignColor(THREE, new THREE.Color(), scrapeColor)
  ];
}

function createScrapedPaintGrainColorNode(controls) {
  return Fn(() => {
    const coordinates = uv().mul(controls.uBandScale);
    const fieldTime = controls.uTime
      .mul(controls.uFlowSpeed)
      .mul(controls.uMotionIntensity)
      .add(controls.uPhase);
    const distortion = sin(coordinates.y.mul(TAU).add(fieldTime))
      .mul(controls.uDistortionStrength);
    const bandWave = sin(coordinates.x.add(distortion).mul(TAU).add(fieldTime))
      .mul(0.5)
      .add(0.5);
    const band = smoothstep(0.18, 0.82, bandWave);
    const scrapeWave = sin(coordinates.x.mul(controls.uScrapeScale).add(fieldTime.mul(1.7)))
      .mul(cos(coordinates.y.mul(controls.uScrapeScale).sub(fieldTime.mul(0.9))))
      .mul(0.5)
      .add(0.5);
    const scrape = smoothstep(0.55, 0.92, scrapeWave).mul(controls.uScrapeStrength);
    const grainCell = floor(coordinates.mul(controls.uGrainScale).add(vec2(fieldTime.mul(0.17), fieldTime.mul(0.11))));
    const grain = fract(sin(dot(grainCell, vec2(12.9898, 78.233))).mul(43758.5453123))
      .sub(0.5)
      .mul(controls.uGrainStrength);
    const paint = mix(controls.uColorA, controls.uColorB, band);
    return tslClamp(mix(paint, controls.uColorC, scrape).add(grain), 0, 1);
  })();
}

function updateScrapedPaintGrainMaterialControls(material, frameFacts = {}) {
  const controls = material?.[SCRAPED_PAINT_GRAIN_CONTROLS];
  if (!controls) return null;
  const facts = frameTimeFacts(frameFacts);
  const motionIntensity = clamp(facts.motionIntensity * controls.baseMotionIntensity, 0, 1);
  controls.uniforms.uTime.value = facts.time;
  controls.uniforms.uMotionIntensity.value = motionIntensity;
  const publicFacts = {
    helperId: controls.helperId,
    materialFactoryId: controls.materialFactoryId,
    featureFamily: controls.featureFamily,
    mode: 'frame-facts-elapsed-seconds',
    captureMode: facts.captureMode,
    time: facts.time,
    elapsedSeconds: facts.time,
    deltaSeconds: facts.deltaSeconds,
    motionIntensity
  };
  material.userData = {
    ...asObject(material.userData),
    webgpuTimeControlFacts: publicFacts
  };
  return publicFacts;
}

export function createImmersiveWorldScrapedPaintGrainMaterial(THREE, {
  name = 'immersive-world-scraped-paint-grain-material',
  palette = null,
  color = '#f3ead7',
  secondaryColor = '#8f5638',
  scrapeColor = '#17130f',
  opacity = 0.88,
  transparent = opacity < 1,
  side = THREE.DoubleSide,
  depthWrite = true,
  depthTest = true,
  toneMapped = false,
  grainStrength = 0.28,
  scrapeStrength = 0.36,
  bandScale = 2.4,
  distortionStrength = 0.12,
  flowSpeed = 0.16,
  motionIntensity = 1,
  phase = 0,
  time = 0,
  userData = {}
} = {}) {
  if (!THREE) throw new Error('createImmersiveWorldScrapedPaintGrainMaterial requires THREE.');
  const safeOpacity = boundedNumber(opacity, 0.88, { min: 0, max: 1 });
  const safeGrainStrength = boundedNumber(grainStrength, 0.28, { min: 0, max: 1 });
  const safeScrapeStrength = boundedNumber(scrapeStrength, 0.36, { min: 0, max: 1 });
  const safeBandScale = boundedNumber(bandScale, 2.4, { min: 0.05, max: 32 });
  const safeDistortionStrength = boundedNumber(distortionStrength, 0.12, { min: 0, max: 1 });
  const safeFlowSpeed = boundedNumber(flowSpeed, 0.16, { min: 0, max: 4 });
  const safeMotionIntensity = boundedNumber(motionIntensity, 1, { min: 0, max: 1 });
  const safePhase = boundedNumber(phase, 0, { min: -100000, max: 100000 });
  const [primary, secondary, scrape] = scrapedPaintGrainPalette(THREE, {
    palette,
    color,
    secondaryColor,
    scrapeColor
  });
  const controls = {
    uTime: uniform(boundedNumber(time, 0, { min: -100000, max: 100000 })),
    uMotionIntensity: uniform(safeMotionIntensity),
    uFlowSpeed: uniform(safeFlowSpeed),
    uBandScale: uniform(safeBandScale),
    uGrainScale: uniform(Math.max(4, safeBandScale * 28)),
    uScrapeScale: uniform(Math.max(0.1, safeBandScale * 7)),
    uGrainStrength: uniform(safeGrainStrength),
    uScrapeStrength: uniform(safeScrapeStrength),
    uDistortionStrength: uniform(safeDistortionStrength),
    uPhase: uniform(safePhase),
    uOpacity: uniform(safeOpacity),
    uColorA: uniform(primary.clone()),
    uColorB: uniform(secondary.clone()),
    uColorC: uniform(scrape.clone())
  };
  const material = new MeshBasicNodeMaterial({
    name,
    transparent: Boolean(transparent),
    opacity: safeOpacity,
    side,
    depthWrite,
    depthTest,
    toneMapped
  });
  material.colorNode = createScrapedPaintGrainColorNode(controls);
  material.opacityNode = controls.uOpacity;
  annotateFeature(material, WEBGPU_NATIVE_HELPER_IDS.SCRAPED_PAINT_GRAIN_MATERIAL, {
    userData: {
      ...asObject(userData),
      webgpuTimeControls: {
        mode: 'frame-facts-elapsed-seconds',
        liveMode: 'elapsedSeconds',
        captureMode: 'frozen-by-capture-frame-facts',
        uniform: 'uTime'
      },
      webgpuArtDirectionParameters: {
        palette: Array.isArray(palette) ? Math.min(palette.length, 8) : 3,
        opacity: safeOpacity,
        grainStrength: safeGrainStrength,
        scrapeStrength: safeScrapeStrength,
        bandScale: safeBandScale,
        distortionStrength: safeDistortionStrength,
        flowSpeed: safeFlowSpeed,
        motionIntensity: safeMotionIntensity
      }
    },
    budget: {
      colorStops: Array.isArray(palette) ? Math.min(palette.length, 8) : 3,
      opacity: safeOpacity,
      grainStrength: safeGrainStrength,
      scrapeStrength: safeScrapeStrength,
      bandScale: safeBandScale,
      distortionStrength: safeDistortionStrength,
      flowSpeed: safeFlowSpeed,
      motionIntensity: safeMotionIntensity
    },
    webgpuSafeSurface: 'MeshBasicNodeMaterial TSL scraped paint grain'
  });
  Object.defineProperty(material, SCRAPED_PAINT_GRAIN_CONTROLS, {
    configurable: true,
    value: {
      helperId: WEBGPU_NATIVE_HELPER_IDS.SCRAPED_PAINT_GRAIN_MATERIAL,
      materialFactoryId: 'scraped-paint-grain-surface',
      featureFamily: 'paint-grain-surface',
      baseMotionIntensity: safeMotionIntensity,
      uniforms: controls
    }
  });
  updateScrapedPaintGrainMaterialControls(material, { elapsedSeconds: time, time, motionIntensity: 1, deltaSeconds: 0 });
  return material;
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

function createAnimatedPointParticlePositionNode(controls) {
  return Fn(() => {
    const base = positionLocal;
    const fieldTime = controls.uTime
      .mul(controls.uFlowSpeed)
      .mul(controls.uMotionIntensity)
      .add(controls.uPhase);
    const radius = controls.uMotionRadius.mul(controls.uMotionIntensity);
    const offsetX = sin(base.y.mul(2.17).add(fieldTime)).mul(radius);
    const offsetY = cos(base.x.mul(1.73).sub(fieldTime.mul(0.71))).mul(radius.mul(0.62));
    const offsetZ = sin(base.x.add(base.y).mul(1.31).add(fieldTime.mul(1.23))).mul(radius.mul(0.78));
    return base.add(vec3(offsetX, offsetY, offsetZ));
  })();
}

function updateAnimatedPointParticleFieldControls(material, frameFacts = {}) {
  const controls = material?.[ANIMATED_POINT_PARTICLE_CONTROLS];
  if (!controls) return null;
  const facts = frameTimeFacts(frameFacts);
  const motionIntensity = clamp(facts.motionIntensity * controls.baseMotionIntensity, 0, 1);
  controls.uniforms.uTime.value = facts.time;
  controls.uniforms.uMotionIntensity.value = motionIntensity;
  const publicFacts = {
    helperId: controls.helperId,
    materialFactoryId: controls.materialFactoryId,
    featureFamily: controls.featureFamily,
    mode: 'frame-facts-elapsed-seconds',
    captureMode: facts.captureMode,
    time: facts.time,
    elapsedSeconds: facts.time,
    deltaSeconds: facts.deltaSeconds,
    motionIntensity,
    count: controls.count
  };
  material.userData = {
    ...asObject(material.userData),
    webgpuTimeControlFacts: publicFacts
  };
  if (controls.object) {
    controls.object.userData = {
      ...asObject(controls.object.userData),
      webgpuTimeControlFacts: publicFacts
    };
  }
  return publicFacts;
}

export function createImmersiveWorldAnimatedPointParticleField(THREE, {
  name = 'immersive-world-animated-point-particle-field',
  seed = 'animated-point-particle-field',
  salt = name,
  count = null,
  density = null,
  spread = [1, 1, 1],
  palette = ['#ffffff'],
  size = 0.035,
  opacity = 0.48,
  depthWrite = false,
  depthTest = true,
  motionRadius = 0.12,
  flowSpeed = 0.35,
  motionIntensity = 1,
  phase = 0,
  time = 0,
  userData = {},
  materialUserData = {}
} = {}) {
  if (!THREE) throw new Error('createImmersiveWorldAnimatedPointParticleField requires THREE.');
  const safeDensity = boundedNumber(density, 1, { min: 0, max: 1 });
  const requestedCount = count == null && density != null
    ? Math.max(1, Math.round(MAX_POINT_PARTICLE_COUNT * safeDensity))
    : count;
  const safeCount = positiveInteger(requestedCount, 256, { min: 1, max: MAX_POINT_PARTICLE_COUNT });
  const safeSize = boundedNumber(size, 0.035, { min: 0.001, max: 0.12 });
  const safeOpacity = boundedNumber(opacity, 0.48, { min: 0, max: 1 });
  const safeMotionRadius = boundedNumber(motionRadius, 0.12, { min: 0, max: 0.6 });
  const safeFlowSpeed = boundedNumber(flowSpeed, 0.35, { min: 0, max: 4 });
  const safeMotionIntensity = boundedNumber(motionIntensity, 1, { min: 0, max: 1 });
  const safePhase = boundedNumber(phase, 0, { min: -100000, max: 100000 });
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
  const controls = {
    uTime: uniform(boundedNumber(time, 0, { min: -100000, max: 100000 })),
    uMotionIntensity: uniform(safeMotionIntensity),
    uFlowSpeed: uniform(safeFlowSpeed),
    uMotionRadius: uniform(safeMotionRadius),
    uPhase: uniform(safePhase),
    uOpacity: uniform(safeOpacity)
  };
  const material = new PointsNodeMaterial({
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
  material.positionNode = createAnimatedPointParticlePositionNode(controls);
  material.opacityNode = controls.uOpacity;
  const budget = {
    count: safeCount,
    density: safeDensity,
    size: safeSize,
    opacity: safeOpacity,
    motionRadius: safeMotionRadius,
    flowSpeed: safeFlowSpeed,
    motionIntensity: safeMotionIntensity
  };
  const timeControls = {
    mode: 'frame-facts-elapsed-seconds',
    liveMode: 'elapsedSeconds',
    captureMode: 'frozen-by-capture-frame-facts',
    uniform: 'uTime'
  };
  annotateFeature(material, WEBGPU_NATIVE_HELPER_IDS.ANIMATED_POINT_PARTICLE_FIELD, {
    userData: {
      ...asObject(materialUserData),
      webgpuTimeControls: timeControls,
      webgpuArtDirectionParameters: budget
    },
    budget,
    webgpuSafeSurface: 'PointsNodeMaterial TSL animated point particle field'
  });
  const controlState = {
    helperId: WEBGPU_NATIVE_HELPER_IDS.ANIMATED_POINT_PARTICLE_FIELD,
    materialFactoryId: 'soft-particles',
    featureFamily: 'point-particle-field',
    baseMotionIntensity: safeMotionIntensity,
    count: safeCount,
    object: null,
    uniforms: controls
  };
  Object.defineProperty(material, ANIMATED_POINT_PARTICLE_CONTROLS, {
    configurable: true,
    value: controlState
  });

  const points = new THREE.Points(geometry, material);
  points.name = name;
  controlState.object = points;
  annotateFeature(points, WEBGPU_NATIVE_HELPER_IDS.ANIMATED_POINT_PARTICLE_FIELD, {
    userData: {
      ...asObject(userData),
      webgpuTimeControls: timeControls,
      webgpuArtDirectionParameters: budget
    },
    budget,
    webgpuSafeSurface: 'Points BufferGeometry TSL animated particle field'
  });
  updateAnimatedPointParticleFieldControls(material, { elapsedSeconds: time, time, motionIntensity: 1, deltaSeconds: 0 });
  points.object = points;
  points.points = points;
  points.dispose = function disposeImmersiveWorldAnimatedPointParticleField() {
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

function writeAnimatedInstancedMarkMatrices(mesh, controls, facts) {
  const flowTime = facts.time * controls.flowSpeed + controls.phase;
  const motionRadius = controls.motionRadius * facts.motionIntensity;
  const dummy = controls.dummy;
  for (let index = 0; index < controls.count; index += 1) {
    const phase = controls.phases[index];
    const offsetX = Math.sin(flowTime + phase) * motionRadius;
    const offsetY = Math.cos(flowTime * 0.73 + phase * 1.31) * motionRadius * 0.58;
    const offsetZ = Math.sin(flowTime * 1.17 + phase * 0.67) * motionRadius * 0.42;
    const base = index * 3;
    const wobble = Math.sin(flowTime * 0.81 + phase) * controls.rotationJitter * facts.motionIntensity;
    const pulse = 1 + Math.sin(flowTime * 1.11 + phase) * controls.scalePulse * facts.motionIntensity;
    const scale = controls.baseScales[index] * Math.max(0.1, pulse);
    dummy.position.set(
      controls.basePositions[base] + offsetX,
      controls.basePositions[base + 1] + offsetY,
      controls.basePositions[base + 2] + offsetZ
    );
    dummy.rotation.set(0, 0, controls.baseRotations[index] + wobble);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function updateAnimatedInstancedMarkFieldControls(mesh, frameFacts = {}) {
  const controls = mesh?.[ANIMATED_INSTANCED_MARK_CONTROLS];
  if (!controls) return null;
  const facts = frameTimeFacts(frameFacts);
  const motionIntensity = clamp(facts.motionIntensity * controls.baseMotionIntensity, 0, 1);
  const publicFacts = {
    helperId: controls.helperId,
    materialFactoryId: controls.materialFactoryId,
    featureFamily: controls.featureFamily,
    mode: 'frame-facts-elapsed-seconds',
    captureMode: facts.captureMode,
    time: facts.time,
    elapsedSeconds: facts.time,
    deltaSeconds: facts.deltaSeconds,
    motionIntensity,
    count: controls.count
  };
  writeAnimatedInstancedMarkMatrices(mesh, controls, { ...facts, motionIntensity });
  mesh.userData = {
    ...asObject(mesh.userData),
    webgpuTimeControlFacts: publicFacts
  };
  return publicFacts;
}

export function createImmersiveWorldAnimatedInstancedMarkField(THREE, {
  name = 'immersive-world-animated-instanced-mark-field',
  seed = 'animated-instanced-mark-field',
  salt = name,
  count = null,
  density = null,
  spread = [1, 1, 1],
  size = [0.08, 0.025, 1],
  palette = ['#ffffff'],
  opacity = 0.72,
  depthWrite = false,
  depthTest = true,
  motionRadius = 0.14,
  flowSpeed = 0.32,
  motionIntensity = 1,
  rotationJitter = 0.45,
  scalePulse = 0.18,
  phase = 0,
  time = 0,
  userData = {},
  materialUserData = {}
} = {}) {
  if (!THREE) throw new Error('createImmersiveWorldAnimatedInstancedMarkField requires THREE.');
  const safeDensity = boundedNumber(density, 1, { min: 0, max: 1 });
  const requestedCount = count == null && density != null
    ? Math.max(1, Math.round(MAX_INSTANCED_MARK_COUNT * safeDensity))
    : count;
  const safeCount = positiveInteger(requestedCount, 128, { min: 1, max: MAX_INSTANCED_MARK_COUNT });
  const [spreadX, spreadY, spreadZ] = vectorComponents(spread, [1, 1, 1], { max: 100000 }).map(Math.abs);
  const [rawWidth, rawHeight] = vectorComponents(size, [0.08, 0.025, 1], { max: 1000 }).map(Math.abs);
  const width = boundedNumber(rawWidth, 0.08, { min: 0.0001, max: 0.6 });
  const height = boundedNumber(rawHeight, 0.025, { min: 0.0001, max: 0.3 });
  const safeOpacity = boundedNumber(opacity, 0.72, { min: 0, max: 1 });
  const safeMotionRadius = boundedNumber(motionRadius, 0.14, { min: 0, max: 0.8 });
  const safeFlowSpeed = boundedNumber(flowSpeed, 0.32, { min: 0, max: 4 });
  const safeMotionIntensity = boundedNumber(motionIntensity, 1, { min: 0, max: 1 });
  const safeRotationJitter = boundedNumber(rotationJitter, 0.45, { min: 0, max: Math.PI });
  const safeScalePulse = boundedNumber(scalePulse, 0.18, { min: 0, max: 0.75 });
  const safePhase = boundedNumber(phase, 0, { min: -100000, max: 100000 });
  const random = createSeededRandom(seed, salt);
  const colors = resolvePalette(THREE, palette);
  const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
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
  const basePositions = new Float32Array(safeCount * 3);
  const baseRotations = new Float32Array(safeCount);
  const baseScales = new Float32Array(safeCount);
  const phases = new Float32Array(safeCount);
  const dummy = new THREE.Object3D();

  mesh.name = name;
  for (let index = 0; index < safeCount; index += 1) {
    basePositions[index * 3] = (random() - 0.5) * spreadX;
    basePositions[index * 3 + 1] = (random() - 0.5) * spreadY;
    basePositions[index * 3 + 2] = (random() - 0.5) * spreadZ;
    baseRotations[index] = random() * TAU;
    baseScales[index] = boundedNumber(0.55 + random() * 0.9, 1, { min: 0.1, max: 2 });
    phases[index] = random() * TAU;
    if (typeof mesh.setColorAt === 'function') {
      mesh.setColorAt(index, colors[Math.floor(random() * colors.length)] || colors[0]);
    }
  }
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  const budget = {
    count: safeCount,
    density: safeDensity,
    width,
    height,
    opacity: safeOpacity,
    motionRadius: safeMotionRadius,
    flowSpeed: safeFlowSpeed,
    motionIntensity: safeMotionIntensity,
    rotationJitter: safeRotationJitter,
    scalePulse: safeScalePulse
  };
  const timeControls = {
    mode: 'frame-facts-elapsed-seconds',
    liveMode: 'elapsedSeconds',
    captureMode: 'frozen-by-capture-frame-facts',
    object: 'instanceMatrix'
  };
  annotateFeature(mesh, WEBGPU_NATIVE_HELPER_IDS.ANIMATED_INSTANCED_MARK_FIELD, {
    userData: {
      ...asObject(userData),
      webgpuTimeControls: timeControls,
      webgpuArtDirectionParameters: budget
    },
    budget,
    webgpuSafeSurface: 'InstancedMesh frame-fact animated mark field'
  });
  Object.defineProperty(mesh, ANIMATED_INSTANCED_MARK_CONTROLS, {
    configurable: true,
    value: {
      helperId: WEBGPU_NATIVE_HELPER_IDS.ANIMATED_INSTANCED_MARK_FIELD,
      materialFactoryId: 'procedural-marks',
      featureFamily: 'instanced-marks',
      count: safeCount,
      baseMotionIntensity: safeMotionIntensity,
      motionRadius: safeMotionRadius,
      flowSpeed: safeFlowSpeed,
      rotationJitter: safeRotationJitter,
      scalePulse: safeScalePulse,
      phase: safePhase,
      basePositions,
      baseRotations,
      baseScales,
      phases,
      dummy
    }
  });
  updateAnimatedInstancedMarkFieldControls(mesh, { elapsedSeconds: time, time, motionIntensity: 1, deltaSeconds: 0 });
  mesh.object = mesh;
  mesh.mesh = mesh;
  mesh.dispose = function disposeImmersiveWorldAnimatedInstancedMarkField() {
    geometry.dispose?.();
    disposeMaterial(material);
  };
  return mesh;
}

export function createImmersiveWorldWebGPUNativeUtilities(THREE) {
  return Object.freeze({
    createColorFieldMaterial: (options = {}) => createImmersiveWorldColorFieldMaterial(THREE, options),
    createAnimatedColorFieldMaterial: (options = {}) => createImmersiveWorldAnimatedColorFieldMaterial(THREE, options),
    createAnimatedDirectionSpaceSkyboxShell: (options = {}) => createImmersiveWorldAnimatedDirectionSpaceSkyboxShell(THREE, options),
    createScrapedPaintGrainMaterial: (options = {}) => createImmersiveWorldScrapedPaintGrainMaterial(THREE, options),
    createProceduralMarkMaterial: (options = {}) => createImmersiveWorldProceduralMarkMaterial(THREE, options),
    createPointParticleField: (options = {}) => createImmersiveWorldPointParticleField(THREE, options),
    createAnimatedPointParticleField: (options = {}) => createImmersiveWorldAnimatedPointParticleField(THREE, options),
    createInstancedMarkField: (options = {}) => createImmersiveWorldInstancedMarkField(THREE, options),
    createAnimatedInstancedMarkField: (options = {}) => createImmersiveWorldAnimatedInstancedMarkField(THREE, options)
  });
}

export function updateImmersiveWorldWebGPUNativeMaterialControls(target, frameFacts = {}) {
  const facts = [];
  const seenMaterials = new Set();
  const seenObjects = new Set();
  const updateMaterial = (material) => {
    if (Array.isArray(material)) {
      material.forEach(updateMaterial);
      return;
    }
    if (!material || seenMaterials.has(material)) return;
    seenMaterials.add(material);
    const updated = updateAnimatedColorFieldMaterialControls(material, frameFacts);
    if (updated) facts.push(updated);
    const paintUpdated = updateScrapedPaintGrainMaterialControls(material, frameFacts);
    if (paintUpdated) facts.push(paintUpdated);
    const particleUpdated = updateAnimatedPointParticleFieldControls(material, frameFacts);
    if (particleUpdated) facts.push(particleUpdated);
    const skyboxUpdated = updateImmersiveWorldAnimatedDirectionSpaceSkyboxShellControls(material, frameFacts);
    if (skyboxUpdated?.facts?.length) facts.push(...skyboxUpdated.facts);
  };
  const updateObject = (object) => {
    if (!object || seenObjects.has(object)) return;
    seenObjects.add(object);
    const marksUpdated = updateAnimatedInstancedMarkFieldControls(object, frameFacts);
    if (marksUpdated) facts.push(marksUpdated);
  };

  if (Array.isArray(target)) {
    target.forEach((entry) => updateImmersiveWorldWebGPUNativeMaterialControls(entry, frameFacts).facts.forEach((fact) => facts.push(fact)));
  } else if (target?.isMaterial) {
    updateMaterial(target);
  } else if (target?.isObject3D || typeof target?.traverse === 'function') {
    target.traverse?.((child) => {
      updateObject(child);
      updateMaterial(child.material);
    });
  } else {
    updateObject(target?.object || target?.mesh || target?.points || target);
    updateMaterial(target?.material || target);
  }

  return {
    updated: facts.length,
    facts
  };
}
