import * as THREE from 'three';
import { hashString, mulberry32 } from './utils.js';
import { createShaderMaterialWithOverride } from './shader-overrides.js';
import { createGeometryFamilyCatalog } from './geometry-family-catalog.js';
import {
  resolveRuntimePosition,
  resolveRuntimeScale
} from './element-params.js';

const GEOMETRY_OVERRIDE_VERTEX = `
varying vec3 vPosition;
void main() {
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const GEOMETRY_OVERRIDE_FRAGMENT = `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec3 vPosition;

void main() {
  float pulse = 0.5 + 0.5 * sin(length(vPosition.xy) * 2.4 + vPosition.z * 1.6 + uTime * 0.8);
  vec3 color = mix(uColorA, uColorB, pulse);
  gl_FragColor = vec4(color, uOpacity);
}
`;

function resolveLegacyPosition(primitive = {}, params = {}, fallback = [0, 0, 0]) {
  return resolveRuntimePosition({ primitive, params, fallback });
}

function resolveLegacyScale(primitive = {}, params = {}, fallback = [1, 1, 1]) {
  return resolveRuntimeScale({ primitive, params, fallback, numericScaleMode: 'uniform' });
}

function finiteNumber(value, fallback = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampNumber(value, min, max, fallback) {
  const numeric = finiteNumber(value, fallback);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function resolveVector3(value) {
  if (Array.isArray(value) && value.length >= 3) {
    const out = value.slice(0, 3).map(Number);
    return out.every(Number.isFinite) ? out : null;
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const out = [Number(value.x), Number(value.y), Number(value.z ?? 0)];
    return out.every(Number.isFinite) ? out : null;
  }
  return null;
}

function createMotifArmature({ primitive, sceneCfg, seed }) {
  const motif = primitive.motif || sceneCfg.motif || 'flow';
  const color = sceneCfg.palette[primitive.color] || sceneCfg.palette.glow;
  const opacity = primitive.opacity ?? 0.45;

  if (motif === 'orbits') {
    const grp = new THREE.Group();
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(3.4, 0.06, 12, 128),
      new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity })
    );
    const torus2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.6, 0.04, 10, 96),
      new THREE.MeshBasicMaterial({ color: sceneCfg.palette.secondary, wireframe: true, transparent: true, opacity: opacity * 0.7 })
    );
    torus2.rotation.x = 1.1;
    grp.add(torus);
    grp.add(torus2);
    return grp;
  }

  if (motif === 'grid') {
    const grid = new THREE.GridHelper(9, 14, color, sceneCfg.palette.secondary);
    grid.material.transparent = true;
    grid.material.opacity = opacity;
    grid.rotation.x = 1.2;
    grid.position.y = -1.3;
    return grid;
  }

  if (motif === 'clusters') {
    const group = new THREE.Group();
    const rand = mulberry32((seed ^ 0xa5a5a5a5) >>> 0);
    for (let i = 0; i < 7; i += 1) {
      const g = new THREE.IcosahedronGeometry(0.22 + rand() * 0.36, 0);
      const m = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity });
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set((rand() - 0.5) * 5.8, (rand() - 0.5) * 3.9, (rand() - 0.5) * 2.2);
      group.add(mesh);
    }
    return group;
  }

  if (motif === 'fracture') {
    const pts = [];
    for (let i = 0; i < 16; i += 1) {
      const x = -5 + i * (10 / 15);
      const y = (i % 2 === 0 ? -1 : 1) * (0.26 + (i % 3) * 0.21);
      pts.push(new THREE.Vector3(x, y, (i % 4) * 0.24));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(
      g,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
  }

  const curvePts = [];
  for (let i = 0; i < 128; i += 1) {
    const t = i / 127;
    curvePts.push(new THREE.Vector3((t - 0.5) * 8.8, Math.sin(t * Math.PI * 3.4) * 1.5, Math.sin(t * Math.PI * 1.4) * 0.5));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curvePts),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
}

function createRibbon({ primitive, sceneCfg, style }) {
  const color = sceneCfg.palette[primitive.color] || sceneCfg.palette.secondary;
  const intensity = primitive.intensity ?? 0.6;
  const params = primitive?.params || {};
  const points = [];

  for (let i = 0; i < 100; i += 1) {
    const t = i / 99;
    const x = (t - 0.5) * 9.2;
    let y = 0;
    let z = 0;

    if (style === 'orbit') {
      y = Math.sin(t * Math.PI * 2.5) * (0.8 + intensity * 0.9);
      z = Math.cos(t * Math.PI * 2.5) * 0.64;
    } else if (style === 'shear') {
      y = ((t - 0.5) * 2) * (1 + intensity);
      z = Math.sin(t * Math.PI * 3.3) * 0.58;
    } else {
      y = Math.sin(t * Math.PI * 3.7) * (0.52 + intensity * 0.95);
      z = Math.sin(t * Math.PI * 1.9) * 0.52;
    }

    points.push(new THREE.Vector3(x, y, z));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: primitive.opacity ?? 0.45 })
  );
  line.position.set(
    Number(params.offsetX ?? primitive.offsetX ?? 0),
    Number(params.offsetY ?? primitive.offsetY ?? 0),
    Number(params.offsetZ ?? primitive.offsetZ ?? 0)
  );
  line.scale.set(
    Number(params.scaleX ?? primitive.scaleX ?? 1),
    Number(params.scaleY ?? primitive.scaleY ?? 1),
    1
  );
  const rotationArray = Array.isArray(params.rotation)
    ? params.rotation
    : (Array.isArray(primitive.rotation) ? primitive.rotation : null);
  const rotationZ = Number(params.rotationZ ?? primitive.rotationZ ?? rotationArray?.[2] ?? 0);
  if (Number.isFinite(rotationZ)) line.rotation.z = rotationZ;
  return line;
}

function resolveFaultLineSegment(primitive = {}, params = {}) {
  const segment = Array.isArray(params.segment) && params.segment.length >= 2
    ? { start: params.segment[0], end: params.segment[1] }
    : (params.segment && typeof params.segment === 'object' && !Array.isArray(params.segment) ? params.segment : null);
  const start = resolveVector3(params.start) || resolveVector3(segment?.start) || resolveVector3(primitive.start);
  const end = resolveVector3(params.end) || resolveVector3(segment?.end) || resolveVector3(primitive.end);
  return start && end ? { start, end } : null;
}

function resolveFaultLineLength(primitive = {}, params = {}) {
  const size = Array.isArray(params.size) ? params.size : null;
  return finiteNumber(
    params.length
      ?? params.markLength
      ?? params.segmentLength
      ?? params.boundedLength
      ?? primitive.length
      ?? primitive.markLength
      ?? primitive.segmentLength
      ?? primitive.boundedLength
      ?? size?.[0],
    null
  );
}

function hasBoundedFaultLineIntent(primitive = {}, params = {}) {
  if (resolveFaultLineSegment(primitive, params)) return true;
  if (params.boundedMark === true || params.bounded === true || primitive.boundedMark === true || primitive.bounded === true) return true;
  return resolveFaultLineLength(primitive, params) != null;
}

function buildBoundedFaultLinePoints({ primitive = {}, params = {}, intensity = 0.6 }) {
  const length = clampNumber(resolveFaultLineLength(primitive, params), 0.08, 10, 2.4);
  const markWidth = clampNumber(
    params.markWidth
      ?? params.thickness
      ?? params.height
      ?? params.width
      ?? primitive.markWidth
      ?? primitive.thickness
      ?? primitive.height
      ?? primitive.width,
    0.01,
    2.4,
    0.14
  );
  const fractureAmount = clampNumber(
    params.fractureAmount ?? params.fracture ?? params.jitter ?? primitive.fractureAmount ?? primitive.fracture ?? primitive.jitter,
    0,
    1,
    0.16
  );
  const depth = clampNumber(params.depth ?? primitive.depth, 0, 1.5, markWidth * 0.42);
  const points = [];

  for (let i = 0; i < 18; i += 1) {
    const t = i / 17;
    const x = (t - 0.5) * length;
    const alternating = i % 2 === 0 ? -1 : 1;
    const y = alternating * markWidth * (0.34 + fractureAmount * 0.2 + (i % 3) * 0.035)
      + Math.sin(t * Math.PI * 3.0) * markWidth * fractureAmount * 0.16;
    const z = ((i % 4) - 1.5) * depth * (0.24 + intensity * 0.12);
    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

function createFaultLine({ primitive, sceneCfg }) {
  const color = sceneCfg.palette[primitive.color] || sceneCfg.palette.glow;
  const intensity = primitive.intensity ?? 0.6;
  const params = primitive?.params || {};
  const width = Math.max(0.02, Math.min(0.32, Number(params.width ?? primitive.width ?? 0.14) || 0.14));
  const jitter = Math.max(0.02, Math.min(0.6, Number(params.jitter ?? primitive.jitter ?? 0.14) || 0.14));
  const [offsetX, offsetY, offsetZ] = resolveLegacyPosition(primitive, params, [0, 0, 0]);
  const rotationArray = Array.isArray(params.rotation)
    ? params.rotation
    : (Array.isArray(primitive.rotation) ? primitive.rotation : null);
  const rotationZ = Number(params.rotationZ ?? primitive.rotationZ ?? rotationArray?.[2] ?? 0);
  const points = [];
  const segment = resolveFaultLineSegment(primitive, params);

  if (hasBoundedFaultLineIntent(primitive, params) && !segment) {
    points.push(...buildBoundedFaultLinePoints({ primitive, params, intensity }));
  } else {
    for (let i = 0; i < 18; i += 1) {
      if (segment) {
        const t = i / 17;
        const centerX = THREE.MathUtils.lerp(segment.start[0], segment.end[0], t);
        const centerY = THREE.MathUtils.lerp(segment.start[1], segment.end[1], t);
        const centerZ = THREE.MathUtils.lerp(segment.start[2], segment.end[2], t);
        const bend = Math.sin(t * Math.PI * 3.0) * (jitter * 0.38);
        const flare = (i % 2 === 0 ? -1 : 1) * (width * 0.7 + intensity * 0.08);
        points.push(new THREE.Vector3(
          centerX + bend,
          centerY + flare,
          centerZ + ((i % 3) - 1) * (0.02 + jitter * 0.08)
        ));
        continue;
      }

      const x = -5 + i * (10 / 17);
      const y = (i % 2 === 0 ? -1 : 1) * (width + intensity * 0.54 + (i % 3) * jitter * 0.42);
      const z = ((i % 4) - 1.5) * (0.08 + jitter * 0.7);
      points.push(new THREE.Vector3(x, y, z));
    }
  }

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: primitive.opacity ?? 0.46 })
  );
  line.position.set(offsetX, offsetY, offsetZ);
  if (Number.isFinite(rotationZ)) line.rotation.z = rotationZ;
  return line;
}

function createSignalWeave({ primitive, sceneCfg, seed, index }) {
  const color = sceneCfg.palette[primitive.color] || sceneCfg.palette.secondary;
  const rand = mulberry32((seed ^ hashString(`weave:${index}`)) >>> 0);
  const group = new THREE.Group();
  const params = primitive?.params || {};
  const strandCountHint = Number(params.laneCount ?? params.strandCount ?? primitive.strandCount ?? 0);
  const strands = Math.max(3, Math.round(Number.isFinite(strandCountHint) && strandCountHint > 0 ? strandCountHint : 3 + (primitive.intensity ?? 0.5) * 6));
  const opacity = primitive.opacity ?? 0.36;
  const offsetX = Number(params.offsetX ?? primitive.offsetX ?? 0);
  const offsetY = Number(params.offsetY ?? primitive.offsetY ?? 0);
  const offsetZ = Number(params.offsetZ ?? primitive.offsetZ ?? 0);
  const scaleX = Number(params.scaleX ?? primitive.scaleX ?? 1);
  const scaleY = Number(params.scaleY ?? primitive.scaleY ?? 1);

  for (let s = 0; s < strands; s += 1) {
    const phase = rand() * Math.PI * 2;
    const amp = 0.25 + rand() * (0.55 + (primitive.intensity ?? 0.5) * 0.7);
    const tilt = (rand() - 0.5) * 0.7;
    const depth = (rand() - 0.5) * 1.6;
    const points = [];

    for (let i = 0; i < 56; i += 1) {
      const t = i / 55;
      const x = (t - 0.5) * 9;
      const y = Math.sin((t * Math.PI * (2 + rand() * 2.2)) + phase) * amp + tilt * (t - 0.5);
      const z = depth + Math.cos((t * Math.PI * 2.6) + phase * 0.6) * (0.1 + (primitive.intensity ?? 0.5) * 0.2);
      points.push(new THREE.Vector3(x, y, z));
    }

    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacity * (0.72 + rand() * 0.35) })
    ));
  }

  group.position.set(offsetX, offsetY, offsetZ);
  group.scale.set(scaleX, scaleY, 1);
  return group;
}

function createNodeCluster({ primitive, sceneCfg, seed, index }) {
  const color = sceneCfg.palette[primitive.color] || sceneCfg.palette.secondary;
  const rand = mulberry32((seed ^ hashString(`cluster:${index}`)) >>> 0);
  const group = new THREE.Group();
  const amount = 5 + Math.floor((primitive.intensity ?? 0.6) * 4);

  for (let i = 0; i < amount; i += 1) {
    const g = new THREE.OctahedronGeometry(0.16 + rand() * 0.26, 0);
    const m = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: primitive.opacity ?? 0.42 });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set((rand() - 0.5) * 6.4, (rand() - 0.5) * 4.4, (rand() - 0.5) * 2.4);
    group.add(mesh);
  }

  return group;
}

function createKandinskyBurst({ primitive, sceneCfg }) {
  const color = sceneCfg.palette[primitive.color] || sceneCfg.palette.glow;
  const group = new THREE.Group();
  const rays = 14;

  for (let i = 0; i < rays; i += 1) {
    const angle = (i / rays) * Math.PI * 2;
    const len = 1.3 + (i % 4) * 0.45;
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(angle) * len, Math.sin(angle) * len, ((i % 3) - 1) * 0.16)
    ];
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: primitive.opacity ?? 0.45 })
    ));
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.35, 64),
    new THREE.MeshBasicMaterial({ color: sceneCfg.palette.secondary, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
  );
  group.add(ring);
  return group;
}

function createSpiralSigil({ primitive, sceneCfg }) {
  const color = sceneCfg.palette[primitive.color] || sceneCfg.palette.anchor;
  const points = [];
  for (let i = 0; i < 240; i += 1) {
    const t = i / 239;
    const angle = t * Math.PI * 7.5;
    const radius = 0.2 + t * 3;
    points.push(new THREE.Vector3(Math.cos(angle) * radius * 0.45, Math.sin(angle) * radius * 0.34, (t - 0.5) * 1.2));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: primitive.opacity ?? 0.42 })
  );
}

function createMiroGlyphs({ primitive, sceneCfg, seed, index }) {
  const rand = mulberry32((seed ^ hashString(`miro:${index}`)) >>> 0);
  const group = new THREE.Group();
  for (let i = 0; i < 9; i += 1) {
    const r = 0.12 + rand() * 0.26;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 16, 16),
      new THREE.MeshBasicMaterial({
        color: rand() > 0.5 ? sceneCfg.palette.primary : sceneCfg.palette.secondary,
        transparent: true,
        opacity: primitive.opacity ?? 0.5
      })
    );
    mesh.position.set((rand() - 0.5) * 7, (rand() - 0.5) * 4.4, (rand() - 0.5) * 2.1);
    group.add(mesh);
  }
  return group;
}

function createConcentricDiscs({ primitive, sceneCfg }) {
  const group = new THREE.Group();
  const colorA = sceneCfg.palette.primary;
  const colorB = sceneCfg.palette.secondary;
  for (let i = 0; i < 5; i += 1) {
    const radius = 0.6 + i * 0.48;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius, radius + 0.16, 96),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? colorA : colorB,
        transparent: true,
        opacity: primitive.opacity ? primitive.opacity * 0.86 : 0.38,
        side: THREE.DoubleSide
      })
    );
    ring.rotation.z = i * 0.3;
    ring.position.z = (i - 2) * 0.08;
    group.add(ring);
  }
  return group;
}

function createSuprematistPlanes({ primitive, sceneCfg, seed, index }) {
  const rand = mulberry32((seed ^ hashString(`sup:${index}`)) >>> 0);
  const group = new THREE.Group();
  const params = primitive?.params || {};
  for (let i = 0; i < 6; i += 1) {
    const w = 0.8 + rand() * 2.2;
    const h = 0.4 + rand() * 1.2;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? sceneCfg.palette.anchor : sceneCfg.palette.secondary,
        transparent: true,
        opacity: primitive.opacity ?? 0.48,
        side: THREE.DoubleSide
      })
    );
    mesh.position.set((rand() - 0.5) * 7, (rand() - 0.5) * 4.6, (rand() - 0.5) * 1.6);
    mesh.rotation.z = (rand() - 0.5) * 1.4;
    group.add(mesh);
  }
  const position = resolveLegacyPosition(primitive, params, [0, 0, 0]);
  const scale = resolveLegacyScale(primitive, params, [1, 1, 1]);
  group.position.set(position[0], position[1], position[2]);
  group.scale.set(scale[0], scale[1], scale[2]);
  return group;
}

function createKleeCells({ primitive, sceneCfg, seed, index }) {
  const rand = mulberry32((seed ^ hashString(`klee:${index}`)) >>> 0);
  const group = new THREE.Group();
  const cols = 7;
  const rows = 4;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.75, 0.58),
        new THREE.MeshBasicMaterial({
          color: rand() > 0.45 ? sceneCfg.palette.primary : sceneCfg.palette.secondary,
          transparent: true,
          opacity: 0.18 + rand() * 0.25,
          side: THREE.DoubleSide
        })
      );
      mesh.position.set((x - (cols - 1) / 2) * 0.82, (y - (rows - 1) / 2) * 0.66, (rand() - 0.5) * 0.55);
      group.add(mesh);
    }
  }
  group.scale.set(1.05, 1.05, 1);
  group.position.y = 0.1;
  return group;
}

function createColorFieldStack({ sceneCfg }) {
  const group = new THREE.Group();
  const softness = sceneCfg.styleFingerprint?.edgeSoftness ?? 0.28;
  const layers = [
    { w: 8.6, h: 2.5, color: sceneCfg.palette.primary, y: 1.45, opacity: 0.46 },
    { w: 9, h: 3.1, color: sceneCfg.palette.secondary, y: -0.1, opacity: 0.42 },
    { w: 8.2, h: 2.4, color: sceneCfg.palette.glow, y: -1.65, opacity: 0.28 }
  ];

  layers.forEach((layer, idx) => {
    const baseOpacity = layer.opacity * (1 - softness * 0.25);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(layer.w, layer.h),
      new THREE.MeshBasicMaterial({ color: layer.color, transparent: true, opacity: baseOpacity, side: THREE.DoubleSide })
    );
    plane.position.set(0, layer.y, -0.7 + idx * 0.06);
    group.add(plane);

    const glaze = new THREE.Mesh(
      new THREE.PlaneGeometry(layer.w * (1 + softness * 0.14), layer.h * (1 + softness * 0.1)),
      new THREE.MeshBasicMaterial({ color: layer.color, transparent: true, opacity: baseOpacity * (0.35 + softness * 0.3), side: THREE.DoubleSide })
    );
    glaze.position.set(0.06 * (idx - 1), layer.y + 0.04 * (idx - 1), -0.74 + idx * 0.06);
    group.add(glaze);
  });

  return group;
}

function createOpStripes({ primitive, sceneCfg }) {
  const group = new THREE.Group();
  const amount = 22;
  const warp = sceneCfg.styleFingerprint?.stripeWarp ?? 0.14;
  const cadence = sceneCfg.styleFingerprint?.cadenceBias ?? 0;
  for (let i = 0; i < amount; i += 1) {
    const t = i / (amount - 1);
    const y = (t - 0.5) * 6.2;
    const width = 8.8 + Math.sin(t * Math.PI * (3.2 + warp)) * (0.8 + warp * 0.8);
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 0.18),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? sceneCfg.palette.primary : sceneCfg.palette.secondary,
        transparent: true,
        opacity: (primitive.opacity ?? 0.52) * (1 + warp * 0.18),
        side: THREE.DoubleSide
      })
    );
    stripe.position.set(0, y, Math.sin(t * Math.PI * (2.1 + warp * 0.7)) * (0.35 + warp * 0.45));
    stripe.rotation.z = Math.sin(t * Math.PI * (1.4 + cadence * 0.4)) * (0.09 + warp * 0.18);
    group.add(stripe);
  }
  return group;
}

function createInstanceGrid({ primitive, sceneCfg }) {
  const color = sceneCfg.palette[primitive.color] || sceneCfg.palette.secondary;
  const grid = new THREE.GridHelper(12, 24, color, sceneCfg.palette.glow);
  grid.material.transparent = true;
  grid.material.opacity = primitive.opacity ?? 0.32;
  grid.rotation.x = Math.PI / 2.6;
  return grid;
}

function createPolyhedronArray({ primitive, sceneCfg, seed, index }) {
  const rand = mulberry32((seed ^ hashString(`poly:${index}`)) >>> 0);
  const group = new THREE.Group();
  const params = primitive?.params || {};
  const count = 12;
  for (let i = 0; i < count; i += 1) {
    const size = 0.2 + rand() * 0.55;
    const geom = new THREE.IcosahedronGeometry(size, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? sceneCfg.palette.anchor : sceneCfg.palette.secondary,
      wireframe: true,
      transparent: true,
      opacity: primitive.opacity ?? 0.42
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set((rand() - 0.5) * 9, (rand() - 0.5) * 5.4, (rand() - 0.5) * 3.4);
    group.add(mesh);
  }
  const position = resolveLegacyPosition(primitive, params, [0, 0, 0]);
  const scale = resolveLegacyScale(primitive, params, [1, 1, 1]);
  group.position.set(position[0], position[1], position[2]);
  group.scale.set(scale[0], scale[1], scale[2]);
  return group;
}

function createAgentGeometry({ primitive, sceneCfg, seed, index }) {
  const rand = mulberry32((seed ^ hashString(`agent-geometry:${index}`)) >>> 0);
  const group = new THREE.Group();
  const params = primitive?.params || {};
  const geometryName = String(params.geometry || params.shape || primitive.geometry || primitive.shape || 'icosahedron').toLowerCase();
  const shapeFamily = String(params.shapeFamily || params.family || '').toLowerCase();
  const tierCount = Math.max(0, Math.round(Number(params.tierCount ?? primitive.tierCount ?? 0) || 0));
  const count = Math.max(1, Math.round(Number(params.count ?? primitive.count ?? 10) || 10));
  const spread = Math.max(0.5, Math.min(12, Number(params.spread ?? primitive.spread ?? 4.4) || 4.4));
  const depth = Math.max(0.2, Math.min(6, Number(params.depth ?? primitive.depth ?? 2.1) || 2.1));
  const wireframe = params.wireframe === true || primitive.wireframe === true;
  const opacity = primitive.opacity ?? (Number(params.opacity ?? 0.44) || 0.44);
  const intensity = primitive.intensity ?? (Number(params.intensity ?? 0.58) || 0.58);
  const color = sceneCfg.palette[primitive.color] || sceneCfg.palette.secondary;
  const offsetX = Number(params.offsetX ?? primitive.offsetX ?? 0);
  const offsetY = Number(params.offsetY ?? primitive.offsetY ?? 0);
  const offsetZ = Number(params.offsetZ ?? primitive.offsetZ ?? 0);
  const shouldBuildTiered = tierCount >= 2 || /(step|tier|altar|podium|triptych)/.test(shapeFamily);

  function makeGeometry(size = 0.3) {
    if (geometryName.includes('sphere')) return new THREE.SphereGeometry(size, 18, 18);
    if (geometryName.includes('box')) return new THREE.BoxGeometry(size * 1.2, size * 1.2, size * 1.2);
    if (geometryName.includes('torus')) return new THREE.TorusGeometry(size * 1.15, size * 0.24, 12, 48);
    if (geometryName.includes('cone')) return new THREE.ConeGeometry(size * 0.8, size * 1.7, 12);
    if (geometryName.includes('line')) return new THREE.TorusKnotGeometry(size * 0.7, size * 0.12, 72, 12);
    return new THREE.IcosahedronGeometry(size, 0);
  }

  if (shouldBuildTiered) {
    const resolvedTiers = Math.max(2, tierCount || 3);
    const tierSpread = Math.max(0.8, Math.min(8, Number(params.spread ?? primitive.spread ?? 2.4) || 2.4));
    const tierDepth = Math.max(0.18, Math.min(2.8, Number(params.depth ?? primitive.depth ?? 0.8) || 0.8));
    const tierHeight = Math.max(0.14, Math.min(0.9, Number(params.tierHeight ?? primitive.tierHeight ?? 0.28) || 0.28));
    for (let i = 0; i < resolvedTiers; i += 1) {
      const width = Math.max(0.7, tierSpread * (1 - i * 0.16));
      const height = Math.max(0.16, tierHeight * (1 + (resolvedTiers - i) * 0.14));
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, tierDepth),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          wireframe,
          opacity: opacity * (0.88 - i * 0.08)
        })
      );
      box.position.set(0, -0.8 + i * (height + 0.08), -i * 0.08);
      group.add(box);
    }
    group.position.set(offsetX, offsetY, offsetZ);
    return group;
  }

  for (let i = 0; i < count; i += 1) {
    const size = 0.14 + rand() * (0.3 + intensity * 0.42);
    const mesh = new THREE.Mesh(
      makeGeometry(size),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        wireframe,
        opacity: opacity * (0.72 + rand() * 0.38)
      })
    );
    mesh.position.set(
      (rand() - 0.5) * spread * 2,
      (rand() - 0.5) * spread * 1.2,
      (rand() - 0.5) * depth
    );
    mesh.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    group.add(mesh);
  }

  group.position.set(offsetX, offsetY, offsetZ);
  return group;
}

function createAgentCompositeRig({ primitive, sceneCfg, seed, index }) {
  const params = primitive?.params || {};
  const group = new THREE.Group();

  group.add(createMotifArmature({ primitive: { ...primitive, motif: params.motif || primitive.motif || sceneCfg.motif }, sceneCfg, seed }));
  group.add(createSignalWeave({ primitive: { ...primitive, intensity: Number(params.weaveIntensity ?? primitive.intensity ?? 0.56) }, sceneCfg, seed, index }));

  if ((primitive.intensity ?? 0.5) > 0.46) {
    group.add(createNodeCluster({ primitive: { ...primitive, intensity: Number(params.clusterIntensity ?? primitive.intensity ?? 0.56) }, sceneCfg, seed, index }));
  }

  if ((primitive.intensity ?? 0.5) > 0.62 || params.includeFaultLine === true) {
    group.add(createFaultLine({ primitive: { ...primitive, intensity: Number(params.faultIntensity ?? primitive.intensity ?? 0.6) }, sceneCfg }));
  }

  const baseScale = Math.max(0.4, Math.min(2.4, Number(params.scale ?? 1) || 1));
  group.scale.set(baseScale, baseScale, baseScale);
  return group;
}

function hasShaderOverride(primitive) {
  return Boolean(primitive?.shaderOverride && typeof primitive.shaderOverride === 'object');
}

function makeOverrideMaterial({ primitive, sceneCfg, sourceMaterial }) {
  const primaryColor = sourceMaterial?.color?.isColor
    ? sourceMaterial.color.clone()
    : new THREE.Color(sceneCfg.palette?.[primitive?.color] || sceneCfg.palette?.secondary || '#9aa8ff');
  const secondaryColor = new THREE.Color(sceneCfg.palette?.glow || sceneCfg.palette?.secondary || '#ffffff');
  const opacity = Number.isFinite(sourceMaterial?.opacity)
    ? sourceMaterial.opacity
    : (primitive?.opacity ?? 0.42);

  return createShaderMaterialWithOverride({
    primitive,
    sceneCfg,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uColorA: { value: primaryColor },
      uColorB: { value: secondaryColor }
    },
    vertexShader: GEOMETRY_OVERRIDE_VERTEX,
    fragmentShader: GEOMETRY_OVERRIDE_FRAGMENT,
    materialOptions: {
      transparent: sourceMaterial?.transparent ?? true,
      depthWrite: sourceMaterial?.depthWrite ?? false,
      side: sourceMaterial?.side ?? THREE.DoubleSide,
      blending: sourceMaterial?.blending ?? THREE.NormalBlending,
      wireframe: sourceMaterial?.wireframe === true
    }
  });
}

function applyGeometryShaderOverride({ primitive, sceneCfg, built }) {
  if (!built?.obj || !hasShaderOverride(primitive)) return built;

  const collectedUniforms = [];
  built.obj.traverse((child) => {
    if (!child?.material) return;

    if (Array.isArray(child.material)) {
      child.material = child.material.map((entry) => {
        const replacement = makeOverrideMaterial({ primitive, sceneCfg, sourceMaterial: entry });
        if (replacement?.uniforms) collectedUniforms.push(replacement.uniforms);
        return replacement;
      });
      child.frustumCulled = false;
      return;
    }

    const replacement = makeOverrideMaterial({ primitive, sceneCfg, sourceMaterial: child.material });
    child.material = replacement;
    child.frustumCulled = false;
    if (replacement?.uniforms) collectedUniforms.push(replacement.uniforms);
  });

  if (!collectedUniforms.length) return built;
  return {
    ...built,
    uniforms: collectedUniforms
  };
}

function wrapGeometryBuilder(factory) {
  return (args) => {
    const built = factory(args);
    return applyGeometryShaderOverride({
      primitive: args?.primitive,
      sceneCfg: args?.sceneCfg,
      built
    });
  };
}

const geometryFactories = {
  'motif-armature': ({ primitive, sceneCfg, seed }) => ({ obj: createMotifArmature({ primitive, sceneCfg, seed }), uniforms: null }),
  'orbit-ribbon': ({ primitive, sceneCfg }) => ({ obj: createRibbon({ primitive, sceneCfg, style: 'orbit' }), uniforms: null }),
  'shear-ribbon': ({ primitive, sceneCfg }) => ({ obj: createRibbon({ primitive, sceneCfg, style: 'shear' }), uniforms: null }),
  'drift-ribbon': ({ primitive, sceneCfg }) => ({ obj: createRibbon({ primitive, sceneCfg, style: 'drift' }), uniforms: null }),
  'fault-line': ({ primitive, sceneCfg }) => ({ obj: createFaultLine({ primitive, sceneCfg }), uniforms: null }),
  'signal-weave': ({ primitive, sceneCfg, seed, index }) => ({ obj: createSignalWeave({ primitive, sceneCfg, seed, index }), uniforms: null }),
  'node-cluster': ({ primitive, sceneCfg, seed, index }) => ({ obj: createNodeCluster({ primitive, sceneCfg, seed, index }), uniforms: null }),
  'kandinsky-burst': ({ primitive, sceneCfg }) => ({ obj: createKandinskyBurst({ primitive, sceneCfg }), uniforms: null }),
  'spiral-sigil': ({ primitive, sceneCfg }) => ({ obj: createSpiralSigil({ primitive, sceneCfg }), uniforms: null }),
  'miro-glyphs': ({ primitive, sceneCfg, seed, index }) => ({ obj: createMiroGlyphs({ primitive, sceneCfg, seed, index }), uniforms: null }),
  'concentric-discs': ({ primitive, sceneCfg }) => ({ obj: createConcentricDiscs({ primitive, sceneCfg }), uniforms: null }),
  'suprematist-planes': ({ primitive, sceneCfg, seed, index }) => ({ obj: createSuprematistPlanes({ primitive, sceneCfg, seed, index }), uniforms: null }),
  'klee-cells': ({ primitive, sceneCfg, seed, index }) => ({ obj: createKleeCells({ primitive, sceneCfg, seed, index }), uniforms: null }),
  'color-field-stack': ({ sceneCfg }) => ({ obj: createColorFieldStack({ sceneCfg }), uniforms: null }),
  'op-stripes': ({ primitive, sceneCfg }) => ({ obj: createOpStripes({ primitive, sceneCfg }), uniforms: null }),
  'instance-grid': ({ primitive, sceneCfg }) => ({ obj: createInstanceGrid({ primitive, sceneCfg }), uniforms: null }),
  'polyhedron-array': ({ primitive, sceneCfg, seed, index }) => ({ obj: createPolyhedronArray({ primitive, sceneCfg, seed, index }), uniforms: null }),
  'agent-geometry': ({ primitive, sceneCfg, seed, index }) => ({ obj: createAgentGeometry({ primitive, sceneCfg, seed, index }), uniforms: null }),
  'agent-composite-rig': ({ primitive, sceneCfg, seed, index }) => ({ obj: createAgentCompositeRig({ primitive, sceneCfg, seed, index }), uniforms: null })
};

export const geometryFamilyCatalog = createGeometryFamilyCatalog({
  factories: geometryFactories,
  wrapBuilder: (factory) => wrapGeometryBuilder(factory)
});

export const { builders } = geometryFamilyCatalog;

export function buildRuntimeModule(moduleType, args) {
  return geometryFamilyCatalog.buildRuntimeModule(moduleType, args);
}

export function buildGeometryModule(moduleType, args) {
  return geometryFamilyCatalog.buildGeometryModule(moduleType, args);
}
