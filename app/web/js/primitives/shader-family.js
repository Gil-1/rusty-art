import * as THREE from 'three';
import { hslStringToColor } from './utils.js';
import { createShaderMaterialWithOverride } from './shader-overrides.js';

const HAZE_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const HAZE_FRAGMENT = `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;
uniform float uOpacity;
uniform float uIntensity;
uniform float uVignette;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += noise(p) * amp;
    p = p * 2.03 + vec2(12.34, 7.89);
    amp *= 0.5;
  }
  return sum;
}

void main() {
  vec2 uv = vUv;
  vec2 centered = uv - 0.5;

  float t = uTime * (0.08 + uIntensity * 0.16);
  float nA = fbm(uv * (2.1 + uIntensity * 1.8) + vec2(t, -t * 0.6));
  float nB = fbm(uv.yx * (1.8 + uIntensity * 1.4) + vec2(-t * 0.7, t));
  float flow = smoothstep(0.18, 0.88, mix(nA, nB, 0.5));

  vec3 color = mix(uColorA, uColorB, flow * (0.6 + uIntensity * 0.4));
  float vignette = smoothstep(0.88, 0.16, length(centered) * (1.1 + uVignette));
  float alpha = uOpacity * (0.4 + flow * 0.6) * vignette;

  gl_FragColor = vec4(color, alpha);
}
`;

const ANCHOR_VERTEX = `
uniform float uTime;
uniform float uDistortion;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vec3 p = position;
  float wobble = sin(p.y * 3.2 + uTime * 1.6) * cos(p.x * 2.6 - uTime * 1.2);
  p += normal * wobble * (0.06 + uDistortion * 0.22);

  vec4 worldPos = modelMatrix * vec4(p, 1.0);
  vec4 mvPosition = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPosition;

  vNormal = normalize(mat3(modelMatrix) * normal);
  vWorldPos = worldPos.xyz;
}
`;

const ANCHOR_FRAGMENT = `
uniform vec3 uColor;
uniform vec3 uAuraColor;
uniform vec3 uCameraPos;
uniform float uTime;
uniform float uIntensity;
uniform float uOpacity;
uniform float uTension;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vec3 viewDir = normalize(uCameraPos - vWorldPos);
  float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 1.7 + uTension * 0.5);
  float pulse = 0.62 + 0.38 * sin(uTime * mix(0.5, 1.7, uTension));
  vec3 color = mix(uColor, uAuraColor, fresnel * 0.9) * (0.84 + pulse * (0.24 + uTension * 0.18));
  float alpha = clamp(uOpacity * (0.7 + fresnel * (0.45 + uTension * 0.25)), 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`;

const SHADER_FIELD_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SHADER_FIELD_FRAGMENT = `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;
uniform float uFlow;
uniform float uDistortion;
uniform float uOpacity;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(91.1, 17.3))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv;
  float t = uTime * (0.1 + uFlow * 0.3);
  vec2 warp = vec2(sin(uv.y * 7.0 + t), cos(uv.x * 5.4 - t * 0.9)) * uDistortion * 0.08;
  float n = noise((uv + warp) * (2.2 + uFlow * 3.2));
  float bands = 0.5 + 0.5 * sin((uv.x + n * 0.4 + t * 0.2) * (8.0 + uFlow * 14.0));
  vec3 color = mix(uColorA, uColorB, bands * 0.75 + n * 0.25);
  gl_FragColor = vec4(color, uOpacity);
}
`;

function isFiniteVec3Array(value) {
  return Array.isArray(value) && value.length === 3 && value.every((entry) => Number.isFinite(Number(entry)));
}

function resolvePlanePosition({ params = {}, primitive = {}, fallback = [0, 0, 0] }) {
  if (isFiniteVec3Array(params.position)) return params.position.map(Number);
  if (isFiniteVec3Array(primitive.position)) return primitive.position.map(Number);

  const legacyOffset = Array.isArray(primitive.offset) && primitive.offset.length >= 2
    ? primitive.offset
    : null;

  return [
    Number(params.offsetX ?? primitive.offsetX ?? legacyOffset?.[0] ?? fallback[0]),
    Number(params.offsetY ?? primitive.offsetY ?? legacyOffset?.[1] ?? fallback[1]),
    Number(params.offsetZ ?? primitive.offsetZ ?? primitive.z ?? fallback[2])
  ];
}

function resolvePlaneScale({ params = {}, primitive = {}, fallback = [1, 1, 1] }) {
  if (typeof params.scale === 'number' && Number.isFinite(params.scale)) {
    return [params.scale, params.scale, fallback[2]];
  }
  if (typeof primitive.scale === 'number' && Number.isFinite(primitive.scale)) {
    return [primitive.scale, primitive.scale, fallback[2]];
  }

  const legacyScale = Array.isArray(primitive.scale) && primitive.scale.length >= 2
    ? primitive.scale
    : null;

  return [
    Number(params.scaleX ?? primitive.scaleX ?? legacyScale?.[0] ?? fallback[0]),
    Number(params.scaleY ?? primitive.scaleY ?? legacyScale?.[1] ?? fallback[1]),
    Number(params.scaleZ ?? primitive.scaleZ ?? legacyScale?.[2] ?? fallback[2])
  ];
}

function createShaderFieldPlane({ primitive, sceneCfg }) {
  const params = primitive?.params || {};
  const colorAKey = params.colorA || primitive.colorA || primitive.color || 'bg';
  const colorBKey = params.colorB || primitive.colorB || 'secondary';
  const geometry = new THREE.PlaneGeometry(22, 14, 1, 1);
  const uniforms = {
    uColorA: { value: hslStringToColor(sceneCfg.palette[colorAKey], '#10131f') },
    uColorB: { value: hslStringToColor(sceneCfg.palette[colorBKey], '#7788ff') },
    uTime: { value: 0 },
    uFlow: { value: Number(params.flow ?? sceneCfg.flowField ?? 0.5) },
    uDistortion: { value: Number(params.distortion ?? sceneCfg.distortion ?? 0.4) },
    uOpacity: { value: Number(params.opacity ?? primitive.opacity ?? 0.62) }
  };

  const material = createShaderMaterialWithOverride({
    primitive,
    sceneCfg,
    uniforms,
    vertexShader: SHADER_FIELD_VERTEX,
    fragmentShader: SHADER_FIELD_FRAGMENT,
    materialOptions: {
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    }
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const position = resolvePlanePosition({ params, primitive, fallback: [0, 0, -1.8] });
  mesh.position.set(position[0], position[1], position[2]);
  const scale = resolvePlaneScale({ params, primitive, fallback: [1, 1, 1] });
  mesh.scale.set(scale[0], scale[1], scale[2]);
  const rotationZ = Number(params.rotationZ ?? primitive.rotationZ ?? 0);
  if (Number.isFinite(rotationZ)) mesh.rotation.z = rotationZ;
  return { obj: mesh, uniforms };
}

function createFlowNoiseSlab({ primitive, sceneCfg }) {
  const params = primitive?.params || {};
  const out = createShaderFieldPlane({ primitive: { ...primitive, opacity: (primitive.opacity ?? 0.42) * 0.75 }, sceneCfg });

  const hasScaleOverride = Number.isFinite(Number(params.scaleX))
    || Number.isFinite(Number(params.scaleY))
    || Number.isFinite(Number(primitive?.scaleX))
    || Number.isFinite(Number(primitive?.scaleY));
  if (!hasScaleOverride) {
    out.obj.scale.set(1.1, 0.8, 1);
  }

  const hasPositionOverride = (Array.isArray(params.position) && params.position.length === 3)
    || Number.isFinite(Number(params.offsetZ))
    || Number.isFinite(Number(primitive?.offsetZ));
  if (!hasPositionOverride) {
    out.obj.position.z = -2.6;
  }

  const hasRotationOverride = Number.isFinite(Number(params.rotationZ))
    || Number.isFinite(Number(primitive?.rotationZ));
  if (!hasRotationOverride) {
    out.obj.rotation.z = 0.13;
  }

  return out;
}

function createVolumetricHaze({ primitive, sceneCfg }) {
  const params = primitive?.params || {};
  const geometry = new THREE.PlaneGeometry(24, 14, 1, 1);
  const uniforms = {
    uColorA: { value: hslStringToColor(sceneCfg.palette[params.colorA || primitive.colorA || primitive.color || 'bg'], '#10131f') },
    uColorB: { value: hslStringToColor(sceneCfg.palette[params.colorB || primitive.colorB || 'secondary'], '#7788ff') },
    uTime: { value: 0 },
    uOpacity: { value: Number(params.opacity ?? primitive.opacity ?? 0.35) },
    uIntensity: { value: Number(params.intensity ?? primitive.intensity ?? 0.5) },
    uVignette: { value: sceneCfg.post?.vignette ?? 0.25 }
  };

  const material = createShaderMaterialWithOverride({
    primitive,
    sceneCfg,
    uniforms,
    vertexShader: HAZE_VERTEX,
    fragmentShader: HAZE_FRAGMENT,
    materialOptions: {
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    }
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const position = resolvePlanePosition({ params, primitive, fallback: [0, 0, -4.2] });
  mesh.position.set(position[0], position[1], position[2]);
  const scale = resolvePlaneScale({ params, primitive, fallback: [1, 1, 1] });
  mesh.scale.set(scale[0], scale[1], scale[2]);
  const rotationZ = Number(params.rotationZ ?? primitive.rotationZ ?? 0);
  if (Number.isFinite(rotationZ)) mesh.rotation.z = rotationZ;
  return { obj: mesh, uniforms };
}

function createAnchorCore({ primitive, sceneCfg }) {
  const group = new THREE.Group();
  const motif = primitive.motif || sceneCfg.motif || 'flow';
  const scale = primitive.size ?? 1;
  const params = primitive?.params || {};

  let geometry;
  if (motif === 'grid') {
    geometry = new THREE.BoxGeometry(1.3, 1.3, 1.3, 14, 14, 14);
  } else if (motif === 'fracture') {
    geometry = new THREE.TetrahedronGeometry(1.0, 3);
  } else if (motif === 'clusters') {
    geometry = new THREE.DodecahedronGeometry(0.95, 1);
  } else if (motif === 'orbits') {
    geometry = new THREE.TorusKnotGeometry(0.62, 0.22, 128, 20, 2, 5);
  } else {
    geometry = new THREE.IcosahedronGeometry(0.9, 2);
  }

  const uniforms = {
    uTime: { value: 0 },
    uDistortion: { value: sceneCfg.distortion ?? 0.3 },
    uColor: { value: hslStringToColor(sceneCfg.palette[primitive.color] || sceneCfg.palette.anchor, '#d9ddff') },
    uAuraColor: { value: hslStringToColor(sceneCfg.palette[primitive.auraColor] || sceneCfg.palette.glow, '#ffffff') },
    uCameraPos: { value: new THREE.Vector3(0, 0, 12) },
    uIntensity: { value: primitive.intensity ?? 0.6 },
    uOpacity: { value: primitive.opacity ?? 0.7 },
    uTension: { value: sceneCfg.expression?.tension ?? 0.5 }
  };

  const core = new THREE.Mesh(
    geometry,
    createShaderMaterialWithOverride({
      primitive,
      sceneCfg,
      uniforms,
      vertexShader: ANCHOR_VERTEX,
      fragmentShader: ANCHOR_FRAGMENT,
      materialOptions: {
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }
    })
  );
  core.scale.setScalar(scale);
  group.add(core);

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 32, 32),
    new THREE.MeshBasicMaterial({
      color: sceneCfg.palette.glow,
      transparent: true,
      opacity: 0.16 + (primitive.intensity ?? 0.6) * 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  aura.scale.setScalar(scale * 1.25);
  group.add(aura);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.035, 8, 120),
    new THREE.MeshBasicMaterial({
      color: sceneCfg.palette.secondary,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  ring.rotation.x = 1.07;
  ring.scale.setScalar(scale * 1.04);
  group.add(ring);

  const pos = Array.isArray(params.position) ? params.position : null;
  if (pos && pos.length === 3 && pos.every(Number.isFinite)) {
    group.position.set(pos[0], pos[1], pos[2]);
  } else {
    group.position.set(
      Number(params.offsetX ?? primitive.offsetX ?? sceneCfg.anchorOffsetX ?? 0),
      Number(params.offsetY ?? primitive.offsetY ?? 0),
      Number(params.offsetZ ?? primitive.offsetZ ?? 0)
    );
  }
  group.scale.setScalar(Number(params.scale ?? primitive.scale ?? 1) * scale);
  const rotationZ = Number(params.rotationZ ?? primitive.rotationZ ?? 0);
  if (Number.isFinite(rotationZ)) group.rotation.z = rotationZ;
  group.traverse((child) => {
    child.frustumCulled = false;
  });

  return { obj: group, uniforms };
}

function createAgentShaderPlane({ primitive, sceneCfg }) {
  const params = primitive?.params || {};
  const out = createShaderFieldPlane({
    primitive: {
      ...primitive,
      opacity: Math.max(0.04, Math.min(0.94, Number(params.opacity ?? primitive.opacity ?? 0.56) || 0.56))
    },
    sceneCfg: {
      ...sceneCfg,
      flowField: Math.max(0.02, Math.min(0.98, Number(params.flow ?? sceneCfg.flowField ?? 0.5) || 0.5)),
      distortion: Math.max(0.02, Math.min(0.98, Number(params.distortion ?? sceneCfg.distortion ?? 0.35) || 0.35))
    }
  });

  const scale = resolvePlaneScale({ params, primitive, fallback: [1, 1, 1] });
  out.obj.scale.set(
    Math.max(0.2, Math.min(6, scale[0] || 1)),
    Math.max(0.2, Math.min(6, scale[1] || 1)),
    scale[2] || 1
  );

  const position = resolvePlanePosition({ params, primitive, fallback: [0, 0, out.obj.position.z ?? -1.8] });
  out.obj.position.set(position[0], position[1], position[2]);

  const rotationZ = Number(params.rotationZ ?? 0);
  if (Number.isFinite(rotationZ)) out.obj.rotation.z = rotationZ;

  return out;
}

export const builders = {
  'shader-field-plane': ({ primitive, sceneCfg }) => createShaderFieldPlane({ primitive, sceneCfg }),
  'flow-noise-slab': ({ primitive, sceneCfg }) => createFlowNoiseSlab({ primitive, sceneCfg }),
  'volumetric-haze': ({ primitive, sceneCfg }) => createVolumetricHaze({ primitive, sceneCfg }),
  'anchor-core': ({ primitive, sceneCfg }) => createAnchorCore({ primitive, sceneCfg }),
  'agent-shader-plane': ({ primitive, sceneCfg }) => createAgentShaderPlane({ primitive, sceneCfg })
};
