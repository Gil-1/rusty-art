import * as THREE from 'three';
import { hashString, hslStringToColor, mulberry32, resolveBlend } from './utils.js';
import { createShaderMaterialWithOverride } from './shader-overrides.js';
import { createParticleFamilyCatalog } from './particle-family-catalog.js';
import {
  resolveRuntimeCount,
  resolveRuntimeSpreadVector,
  resolveRuntimeTransformFacts
} from './element-params.js';

const PARTICLE_VERTEX = `
attribute float aScale;
attribute float aPhase;
uniform float uTime;
uniform float uTurbulence;
uniform float uFlow;
uniform float uSize;
varying float vDepth;
varying float vEnergy;

void main() {
  vec3 p = position;
  float waveA = sin((p.x + aPhase) * 1.35 + uTime * (0.55 + uFlow * 0.8));
  float waveB = cos((p.y - aPhase) * 1.1 - uTime * (0.48 + uFlow * 0.62));
  float waveC = sin((p.z + p.x * 0.3) * 1.8 + uTime * (0.74 + uFlow));

  p.xy += vec2(waveA, waveB) * (0.08 + uTurbulence * 0.42);
  p.z += waveC * (0.12 + uTurbulence * 0.55);

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float perspective = clamp(1.6 / (-mvPosition.z + 2.0), 0.35, 3.2);
  gl_PointSize = uSize * aScale * perspective;

  vDepth = clamp((-mvPosition.z - 2.0) / 16.0, 0.0, 1.0);
  vEnergy = 0.55 + 0.45 * sin(uTime * 0.7 + aPhase * 6.2831);
}
`;

const PARTICLE_FRAGMENT = `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uGlow;
uniform float uFogStrength;
varying float vDepth;
varying float vEnergy;

void main() {
  vec2 uv = gl_PointCoord.xy - 0.5;
  float dist = length(uv);
  float core = smoothstep(0.36, 0.03, dist);
  float halo = smoothstep(0.62, 0.14, dist);
  float glow = max(core, halo * (0.6 + uGlow * 0.8));
  float fogFade = mix(1.0, 0.28, vDepth * uFogStrength);
  float alpha = glow * uOpacity * fogFade * (0.8 + vEnergy * 0.2);

  if (alpha < 0.01) discard;
  vec3 color = uColor * (0.88 + vEnergy * (0.28 + uGlow * 0.32));
  gl_FragColor = vec4(color, alpha);
}
`;

function normalizeSpreadVector(value, fallback = [4.6, 4.6, 1.6]) {
  return resolveRuntimeSpreadVector(value, fallback);
}

function createShaderParticleCloud({ primitive, palette, seed, index, sceneCfg }) {
  const rand = mulberry32((seed ^ hashString(`${primitive.type}:${primitive.role}:${index}`)) >>> 0);
  const count = resolveRuntimeCount({ primitive, fallback: 100, min: 1 });
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const phases = new Float32Array(count);

  const [spreadX, spreadY, spreadZ] = normalizeSpreadVector(primitive.spread, [4.6, 4.6, 1.6]);
  const spread = Math.max(spreadX, spreadY, 0.2);
  const depth = primitive.depth ?? spreadZ;
  const jitter = primitive.jitter ?? 0.3;
  const swirl = primitive.swirl ?? 0.2;

  for (let i = 0; i < count; i += 1) {
    const radial = 1.2 + rand() * spread;
    const angle = i * (0.08 + swirl * 0.08) + rand() * 1.5;
    positions[i * 3 + 0] = Math.cos(angle) * radial * (spreadX / spread) + (rand() - 0.5) * jitter;
    positions[i * 3 + 1] = Math.sin(angle) * radial * (spreadY / spread) + (rand() - 0.5) * jitter;
    positions[i * 3 + 2] = (rand() - 0.5) * depth;
    scales[i] = 0.75 + rand() * 1.5;
    phases[i] = rand();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const uniforms = {
    uTime: { value: 0 },
    uTurbulence: { value: sceneCfg.turbulence ?? 0.35 },
    uFlow: { value: sceneCfg.flowField ?? 0.5 },
    uSize: { value: (primitive.size ?? 0.12) * 120 },
    uColor: { value: hslStringToColor(palette[primitive.color], '#ffffff') },
    uOpacity: { value: primitive.opacity ?? 0.8 },
    uGlow: { value: sceneCfg.bloom ?? 0.45 },
    uFogStrength: { value: Math.min(1.2, (sceneCfg.fogDensity ?? 0.05) * 10) }
  };

  const material = createShaderMaterialWithOverride({
    primitive,
    sceneCfg,
    uniforms,
    vertexShader: PARTICLE_VERTEX,
    fragmentShader: PARTICLE_FRAGMENT,
    materialOptions: {
      transparent: true,
      depthWrite: false,
      blending: resolveBlend(primitive.blend)
    }
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  const params = primitive?.params || {};
  const transform = resolveRuntimeTransformFacts({
    primitive,
    params,
    fallbackPosition: [0, 0, 0],
    fallbackScale: [1, 1, 1],
    numericScaleMode: 'preserve-z'
  });
  points.position.set(transform.position[0], transform.position[1], transform.position[2]);
  points.scale.set(transform.scale[0], transform.scale[1], 1);
  const rotationZ = transform.rotationZ;
  if (Number.isFinite(rotationZ)) points.rotation.z = rotationZ;
  return { obj: points, uniforms };
}

function createParticleStream({ primitive, sceneCfg, seed, index }) {
  const rand = mulberry32((seed ^ hashString(`stream:${index}`)) >>> 0);
  const group = new THREE.Group();
  const strands = 8;
  const color = sceneCfg.palette[primitive.color] || sceneCfg.palette.primary;

  for (let s = 0; s < strands; s += 1) {
    const points = [];
    const phase = rand() * Math.PI * 2;
    for (let i = 0; i < 84; i += 1) {
      const t = i / 83;
      const x = (t - 0.5) * 10.5;
      const y = Math.sin(t * Math.PI * (4 + rand() * 2) + phase) * (0.7 + (primitive.intensity ?? 0.6));
      const z = Math.cos(t * Math.PI * 2 + phase) * 0.8 + (rand() - 0.5) * 0.4;
      points.push(new THREE.Vector3(x, y, z));
    }
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: (primitive.opacity ?? 0.38) * (0.7 + rand() * 0.4) })
    ));
  }

  return group;
}

function createAgentParticleSystem({ primitive, sceneCfg, seed, index }) {
  const params = primitive?.params || {};
  return createShaderParticleCloud({
    primitive: {
      ...primitive,
      count: resolveRuntimeCount({ primitive, params, fallback: 320, min: 24, max: 2400 }),
      spread: Math.max(0.8, Math.min(18, Number(params.spread ?? primitive.spread ?? 5.4) || 5.4)),
      depth: Math.max(0.2, Math.min(8, Number(params.depth ?? primitive.depth ?? 2.4) || 2.4)),
      jitter: Math.max(0, Math.min(1.4, Number(params.jitter ?? primitive.jitter ?? 0.34) || 0.34)),
      swirl: Math.max(0, Math.min(2.2, Number(params.swirl ?? primitive.swirl ?? 0.5) || 0.5)),
      size: Math.max(0.01, Math.min(0.42, Number(params.size ?? primitive.size ?? 0.1) || 0.1)),
      opacity: Math.max(0.05, Math.min(0.98, Number(params.opacity ?? primitive.opacity ?? 0.72) || 0.72)),
      blend: params.blend || primitive.blend || 'additive'
    },
    palette: sceneCfg.palette,
    seed,
    index,
    sceneCfg
  });
}

const particleFactories = {
  'particle-cloud': ({ primitive, sceneCfg, seed, index }) => (
    createShaderParticleCloud({ primitive, palette: sceneCfg.palette, seed, index, sceneCfg })
  ),
  'particle-shell': ({ primitive, sceneCfg, seed, index }) => (
    createShaderParticleCloud({
      primitive: {
        ...primitive,
        count: primitive.count || 180,
        size: primitive.size || 0.09,
        blend: 'additive'
      },
      palette: sceneCfg.palette,
      seed,
      index,
      sceneCfg
    })
  ),
  'particle-stream': ({ primitive, sceneCfg, seed, index }) => ({
    obj: createParticleStream({ primitive, sceneCfg, seed, index }),
    uniforms: null
  }),
  'agent-particle-system': ({ primitive, sceneCfg, seed, index }) => (
    createAgentParticleSystem({ primitive, sceneCfg, seed, index })
  )
};

export const particleFamilyCatalog = createParticleFamilyCatalog({
  factories: particleFactories
});

export const { builders } = particleFamilyCatalog;

export function buildRuntimeModule(moduleType, args) {
  return particleFamilyCatalog.buildRuntimeModule(moduleType, args);
}

export function buildParticleModule(moduleType, args) {
  return particleFamilyCatalog.buildParticleModule(moduleType, args);
}
