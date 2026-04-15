import * as THREE from 'three';
import { hashString, hslStringToColor, mulberry32, resolveBlend } from './primitives/utils.js';
import { sanitizeShaderSource } from './primitives/shader-overrides.js';

const CUSTOM_FAMILIES = new Set(['shader', 'geometry', 'particle', 'post', 'camera', 'lighting']);
const CUSTOM_KINDS = new Set(['dsl', 'js']);
const PIPELINE_FAMILIES = new Set(['post', 'camera', 'lighting']);
const EXECUTABLE_DSL_KEYS = Object.freeze({
  shader: new Set(['width', 'height', 'opacity', 'position', 'rotation', 'scale', 'blend']),
  geometry: new Set(['count', 'spread', 'depth', 'shape', 'wireframe', 'opacity', 'position', 'rotation', 'scale', 'width', 'height', 'gridWidth', 'gridHeight', 'segmentsX', 'segmentsY', 'cellCount', 'blend']),
  particle: new Set(['count', 'spread', 'size', 'opacity', 'position', 'rotation', 'scale', 'blend'])
});
const NON_EXECUTABLE_PATCH_KEYS = new Set(['moduleType', 'generate', 'material', 'animation', 'description', 'notes', 'intent', 'previewIntent']);

const DEFAULT_SHADER_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const DEFAULT_SHADER_FRAGMENT = `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float wave = 0.5 + 0.5 * sin((uv.x * 6.0 + uv.y * 4.0) + uTime * 0.6);
  vec3 color = mix(uColorA, uColorB, wave);
  gl_FragColor = vec4(color, uOpacity);
}
`;

const DEFAULT_PARTICLE_VERTEX = `
attribute float aScale;
uniform float uTime;
uniform float uSize;
void main() {
  vec3 p = position;
  p.xy += vec2(sin(uTime + p.z), cos(uTime * 0.7 + p.x)) * 0.05;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float perspective = clamp(1.6 / (-mvPosition.z + 2.0), 0.3, 3.0);
  gl_PointSize = uSize * aScale * perspective;
}
`;

const DEFAULT_PARTICLE_FRAGMENT = `
uniform vec3 uColorA;
uniform float uOpacity;
void main() {
  vec2 uv = gl_PointCoord.xy - 0.5;
  float d = length(uv);
  float alpha = smoothstep(0.5, 0.05, d) * uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(uColorA, alpha);
}
`;

function clamp(value, min, max, fallback = min) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asText(value, _maxLen = 128) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  return normalized;
}

function normalizeFamily(value) {
  const family = asText(value, 24)?.toLowerCase();
  if (!family || !CUSTOM_FAMILIES.has(family)) return null;
  return family;
}

function normalizeKind(value) {
  const kind = asText(value, 16)?.toLowerCase();
  if (!kind || !CUSTOM_KINDS.has(kind)) return 'dsl';
  return kind;
}

function normalizeBudgets(raw = {}) {
  const source = isObject(raw) ? raw : {};
  const maxInstances = Number(source.maxInstances);
  const maxShaderOpsHint = Number(source.maxShaderOpsHint);
  return {
    maxInstances: Number.isFinite(maxInstances) && maxInstances > 0 ? Math.round(maxInstances) : 2_000,
    maxShaderOpsHint: Number.isFinite(maxShaderOpsHint) ? maxShaderOpsHint : 1,
    mobileSafe: source.mobileSafe !== false
  };
}

function normalizeSource(raw = {}) {
  const source = isObject(raw) ? raw : {};
  const glsl = isObject(source.glsl) ? source.glsl : {};
  return {
    dsl: isObject(source.dsl) ? source.dsl : {},
    glsl: {
      vertex: asText(glsl.vertex, 16_000),
      fragment: asText(glsl.fragment, 20_000)
    },
    js: asText(source.js, 32_000)
  };
}

function hasNonEmptyValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (isObject(value)) return Object.keys(value).length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value != null;
}

function hasExecutableDslConfig(family, dsl = {}) {
  const source = isObject(dsl) ? dsl : {};
  const allowedKeys = EXECUTABLE_DSL_KEYS[family];
  if (!allowedKeys) return false;
  return Object.entries(source).some(([key, value]) => allowedKeys.has(key) && hasNonEmptyValue(value));
}

function hasExecutablePipelinePatch(spec) {
  const sourceDsl = isObject(spec?.source?.dsl) ? spec.source.dsl : {};
  const patch = isObject(sourceDsl.patch) ? sourceDsl.patch : sourceDsl;
  return Object.entries(patch).some(([key, value]) => !NON_EXECUTABLE_PATCH_KEYS.has(key) && hasNonEmptyValue(value));
}

function isPlaceholderFragmentShader(source = '') {
  const fragment = String(source || '').replace(/\s+/g, ' ').trim();
  if (!fragment) return false;
  return /gl_FragColor\s*=\s*vec4\(\s*1(?:\.0+)?\s*\)\s*;/i.test(fragment)
    || /gl_FragColor\s*=\s*vec4\(\s*1(?:\.0+)?\s*,\s*1(?:\.0+)?\s*,\s*1(?:\.0+)?\s*,\s*1(?:\.0+)?\s*\)\s*;/i.test(fragment)
    || /gl_FragColor\s*=\s*vec4\(\s*vec3\(\s*1(?:\.0+)?\s*\)\s*,\s*1(?:\.0+)?\s*\)\s*;/i.test(fragment);
}

function validateCustomModuleSpec(spec) {
  if (PIPELINE_FAMILIES.has(spec.family)) {
    return hasExecutablePipelinePatch(spec)
      ? { ok: true, reason: null }
      : { ok: false, reason: 'pipeline-patch-not-executable' };
  }

  if (spec.kind === 'js') {
    return { ok: true, reason: null };
  }

  const hasShaderSource = Boolean(spec?.source?.glsl?.vertex || spec?.source?.glsl?.fragment);
  const hasExecutableDsl = hasExecutableDslConfig(spec.family, spec?.source?.dsl || {});
  const hasPatchOnlyDsl = isObject(spec?.source?.dsl?.patch);

  if (isPlaceholderFragmentShader(spec?.source?.glsl?.fragment || '')) {
    return { ok: false, reason: 'placeholder-fragment-shader' };
  }

  if (!hasShaderSource && !hasExecutableDsl) {
    return {
      ok: false,
      reason: hasPatchOnlyDsl ? 'prose-only-dsl-patch' : 'missing-executable-source'
    };
  }

  return { ok: true, reason: null };
}

function hasMainFunction(source = '') {
  return /void\s+main\s*\(/.test(String(source || ''));
}

function normalizeParamUniformName(key = '') {
  const normalized = String(key || '').trim().replace(/[^A-Za-z0-9_]/g, '_');
  return normalized ? `uParam_${normalized}` : null;
}

function inferParamUniformType(schema = {}, value = undefined) {
  const declared = String(schema?.type || '').trim().toLowerCase();
  if (declared === 'boolean' || typeof value === 'boolean') return 'bool';
  if (declared === 'vec2' || (Array.isArray(value) && value.length === 2)) return 'vec2';
  if (declared === 'vec3' || (Array.isArray(value) && value.length === 3)) return 'vec3';
  if (declared === 'vec4' || (Array.isArray(value) && value.length === 4)) return 'vec4';
  if (declared === 'int') return 'int';
  return 'float';
}

function buildParamUniformBindings(spec, params = {}, sceneCfg = null) {
  const schema = isObject(spec?.paramsSchema) ? spec.paramsSchema : {};
  const bindings = [];

  for (const [key, definition] of Object.entries(schema)) {
    const uniformName = normalizeParamUniformName(key);
    if (!uniformName) continue;
    const explicitValue = params[key];
    const fallbackValue = isObject(definition) ? definition.default : undefined;
    const value = explicitValue !== undefined ? explicitValue : fallbackValue;
    const normalizedValue = normalizeUniformValue(value, sceneCfg);
    if (normalizedValue == null) continue;

    bindings.push({
      key,
      uniformName,
      glslType: inferParamUniformType(definition, value),
      value: normalizedValue
    });
  }

  return bindings;
}

function rewriteSnippetParamReferences(source = '', bindings = []) {
  let next = String(source || '');
  for (const binding of bindings) {
    next = next.replace(new RegExp(`\\bparams\\.${binding.key}\\b`, 'g'), binding.uniformName);
  }
  return next;
}

function wrapFragmentSnippet(source = '', bindings = []) {
  const rewritten = rewriteSnippetParamReferences(source, bindings).trim();
  const declarations = bindings.map((binding) => `uniform ${binding.glslType} ${binding.uniformName};`).join('\n');
  return `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;
uniform float uOpacity;
${declarations}
varying vec2 vUv;

void main() {
  vec3 outColor = mix(uColorA, uColorB, 0.5 + 0.5 * (vUv.y - 0.5));
  float outAlpha = uOpacity;
  ${rewritten}
  gl_FragColor = vec4(outColor, outAlpha);
}
`;
}

function prepareCustomShaderSources({ spec, params = {}, sceneCfg = null, vertexFallback, fragmentFallback } = {}) {
  const bindings = buildParamUniformBindings(spec, params, sceneCfg);
  const rawVertex = spec?.source?.glsl?.vertex || vertexFallback;
  const rawFragment = spec?.source?.glsl?.fragment || fragmentFallback;
  const vertexShader = sanitizeShaderSource(rawVertex);
  const fragmentShader = sanitizeShaderSource(
    hasMainFunction(rawFragment)
      ? rawFragment
      : wrapFragmentSnippet(rawFragment, bindings)
  );

  return {
    vertexShader,
    fragmentShader,
    paramUniforms: Object.fromEntries(bindings.map((binding) => [binding.uniformName, { value: binding.value }]))
  };
}

function normalizeUniformValue(value, sceneCfg) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.startsWith('palette.')) {
      const key = value.slice('palette.'.length);
      return hslStringToColor(sceneCfg?.palette?.[key] || '#ffffff', '#ffffff');
    }
    if (value.startsWith('#') || value.startsWith('hsl(')) {
      return hslStringToColor(value, '#ffffff');
    }
    return value;
  }

  if (Array.isArray(value) && value.every(Number.isFinite)) {
    if (value.length === 2) return new THREE.Vector2(value[0], value[1]);
    if (value.length === 3) return new THREE.Vector3(value[0], value[1], value[2]);
    if (value.length === 4) return new THREE.Vector4(value[0], value[1], value[2], value[3]);
  }

  if (isObject(value)) {
    if (Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z) && Number.isFinite(value.w)) {
      return new THREE.Vector4(value.x, value.y, value.z, value.w);
    }
    if (Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z)) {
      return new THREE.Vector3(value.x, value.y, value.z);
    }
    if (Number.isFinite(value.x) && Number.isFinite(value.y)) {
      return new THREE.Vector2(value.x, value.y);
    }
    if (Number.isFinite(value.r) && Number.isFinite(value.g) && Number.isFinite(value.b)) {
      return new THREE.Color(value.r, value.g, value.b);
    }
  }

  return null;
}

function applyUniformMap(uniforms, map, sceneCfg) {
  if (!isObject(map)) return uniforms;
  const out = { ...uniforms };
  for (const [key, value] of Object.entries(map)) {
    const name = asText(key, 48);
    if (!name) continue;
    const normalizedValue = normalizeUniformValue(value, sceneCfg);
    if (normalizedValue == null) continue;
    out[name] = { value: normalizedValue };
  }
  return out;
}

function parseUniformDeclarations(shaderSource = '') {
  if (typeof shaderSource !== 'string' || !shaderSource.trim()) return [];
  const declarations = [];
  const re = /uniform\s+(float|vec2|vec3|vec4|int|bool)\s+([A-Za-z_]\w*)\s*;/g;
  let match = re.exec(shaderSource);
  while (match) {
    declarations.push({ type: match[1], name: match[2] });
    match = re.exec(shaderSource);
  }
  return declarations;
}

function defaultUniformValue(type, name, { sceneCfg, seed = 0, moduleId = 'cm', index = 0 } = {}) {
  const key = String(name || '').toLowerCase();
  const seedNorm = ((hashString(`${moduleId}:${seed}:${index}:${name}`) % 10_000) / 10_000);

  if (type === 'float') {
    if (key === 'utime' || key.includes('time')) return 0;
    if (key.includes('opacity') || key.includes('alpha')) return 0.68;
    if (key.includes('density')) return 0.62;
    if (key.includes('soft') || key.includes('falloff')) return 0.45;
    if (key.includes('flow')) return Number(clamp(sceneCfg?.flowField, 0, 1, 0.5).toFixed(3));
    if (key.includes('distort') || key.includes('jitter') || key.includes('noise')) {
      return Number(clamp(sceneCfg?.distortion, 0, 1, 0.2).toFixed(3));
    }
    if (key.includes('seed') || key.includes('phase')) return Number(seedNorm.toFixed(6));
    if (key.includes('intensity') || key.includes('glow')) return 0.58;
    return 0.5;
  }

  if (type === 'int') {
    if (key.includes('count')) return 12;
    return 1;
  }

  if (type === 'bool') {
    return true;
  }

  if (type === 'vec2') {
    if (key.includes('resolution')) return new THREE.Vector2(1, 1);
    return new THREE.Vector2(0.5, 0.5);
  }

  if (type === 'vec3') {
    if (key.includes('bg')) {
      return hslStringToColor(sceneCfg?.palette?.bg || '#10131f', '#10131f');
    }
    if (key.includes('anchor')) {
      return hslStringToColor(sceneCfg?.palette?.anchor || '#ffffff', '#ffffff');
    }
    if (key.includes('secondary')) {
      return hslStringToColor(sceneCfg?.palette?.secondary || '#99a8ff', '#99a8ff');
    }
    if (key.includes('primary')) {
      return hslStringToColor(sceneCfg?.palette?.primary || '#ffffff', '#ffffff');
    }
    if (key.includes('colorb') || key.endsWith('b')) {
      return hslStringToColor(sceneCfg?.palette?.secondary || '#99a8ff', '#99a8ff');
    }
    if (key.includes('glow')) {
      return hslStringToColor(sceneCfg?.palette?.glow || '#ffffff', '#ffffff');
    }
    return hslStringToColor(sceneCfg?.palette?.primary || '#ffffff', '#ffffff');
  }

  if (type === 'vec4') {
    return new THREE.Vector4(1, 1, 1, 1);
  }

  return null;
}

function ensureShaderUniformDefaults(uniforms, {
  vertexShader = '',
  fragmentShader = '',
  sceneCfg,
  seed = 0,
  moduleId = 'cm',
  index = 0
} = {}) {
  const out = { ...uniforms };
  const declarations = [...parseUniformDeclarations(vertexShader), ...parseUniformDeclarations(fragmentShader)];
  const seen = new Set();

  for (const declaration of declarations) {
    if (!declaration?.name || seen.has(declaration.name)) continue;
    seen.add(declaration.name);
    if (Object.prototype.hasOwnProperty.call(out, declaration.name)) continue;

    const fallback = defaultUniformValue(declaration.type, declaration.name, {
      sceneCfg,
      seed,
      moduleId,
      index
    });
    if (fallback == null) continue;
    out[declaration.name] = { value: fallback };
  }

  return out;
}

function normalizeVector3(value, fallback = [0, 0, 0]) {
  if (Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)) {
    return [value[0], value[1], value[2]];
  }
  if (isObject(value) && Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z)) {
    return [value.x, value.y, value.z];
  }
  return fallback;
}

function resolveLegacyPosition(params = {}, target) {
  const legacyOffset = Array.isArray(params.offset) && params.offset.length >= 2
    ? params.offset
    : null;
  const fallbackPosition = Array.isArray(params.defaultPosition) && params.defaultPosition.length === 3
    ? params.defaultPosition
    : [target.position.x, target.position.y, target.position.z];

  return [
    Number(params.offsetX ?? legacyOffset?.[0] ?? fallbackPosition[0]),
    Number(params.offsetY ?? legacyOffset?.[1] ?? fallbackPosition[1]),
    Number(params.offsetZ ?? params.z ?? legacyOffset?.[2] ?? fallbackPosition[2])
  ];
}

function applyTransform(target, params = {}) {
  const position = normalizeVector3(params.position, resolveLegacyPosition(params, target));
  const rotation = normalizeVector3(params.rotation, [target.rotation.x, target.rotation.y, target.rotation.z]);
  const scaleRaw = params.scale;
  const scale = typeof scaleRaw === 'number'
    ? [scaleRaw, scaleRaw, scaleRaw]
    : normalizeVector3(scaleRaw, [target.scale.x, target.scale.y, target.scale.z]);

  target.position.set(position[0], position[1], position[2]);
  target.rotation.set(rotation[0], rotation[1], rotation[2]);
  target.scale.set(scale[0], scale[1], scale[2]);
}

function buildTransformParams({ params = {}, primitive = {}, dsl = {}, defaultPosition = [0, 0, 0], defaultRotation = [0, 0, 0], defaultScale = 1 }) {
  const explicitPosition = params.position || primitive?.position || dsl.position;
  return {
    position: explicitPosition,
    rotation: params.rotation || primitive?.rotation || dsl.rotation || defaultRotation,
    scale: params.scale || primitive?.scale || dsl.scale || defaultScale,
    offset: params.offset || primitive?.offset,
    offsetX: params.offsetX ?? primitive?.offsetX,
    offsetY: params.offsetY ?? primitive?.offsetY,
    offsetZ: params.offsetZ ?? primitive?.offsetZ,
    z: params.z ?? primitive?.z,
    defaultPosition
  };
}

function createDslShaderBuilder(spec) {
  return ({ primitive, sceneCfg, seed = 0, index = 0 }) => {
    const dsl = isObject(spec.source.dsl) ? spec.source.dsl : {};
    const params = isObject(primitive?.params) ? primitive.params : {};
    const width = clamp(params.width ?? dsl.width, 0.2, 120, 8);
    const height = clamp(params.height ?? dsl.height, 0.2, 120, 6);
    const isTransparent = toBoolean(params.transparent, toBoolean(dsl.transparent, true));
    const isDoubleSided = toBoolean(params.doubleSided, toBoolean(dsl.doubleSided, true));
    const { vertexShader, fragmentShader, paramUniforms } = prepareCustomShaderSources({
      spec,
      params,
      sceneCfg,
      vertexFallback: DEFAULT_SHADER_VERTEX,
      fragmentFallback: DEFAULT_SHADER_FRAGMENT
    });

    const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
    const uniforms = ensureShaderUniformDefaults(applyUniformMap({
      uTime: { value: 0 },
      uOpacity: { value: clamp(params.opacity ?? primitive?.opacity ?? dsl.opacity, 0.02, 1, 0.68) },
      uColorA: { value: hslStringToColor(sceneCfg?.palette?.primary || '#ffffff', '#ffffff') },
      uColorB: { value: hslStringToColor(sceneCfg?.palette?.secondary || '#99a8ff', '#99a8ff') },
      ...paramUniforms
    }, {
      ...(isObject(dsl.uniforms) ? dsl.uniforms : {}),
      ...(isObject(params.uniforms) ? params.uniforms : {})
    }, sceneCfg), {
      vertexShader,
      fragmentShader,
      sceneCfg,
      seed,
      moduleId: spec.id,
      index
    });

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: isTransparent,
      depthWrite: !isTransparent,
      side: isDoubleSided ? THREE.DoubleSide : THREE.FrontSide,
      blending: resolveBlend(params.blend || dsl.blend || primitive?.blend || 'normal')
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    applyTransform(mesh, buildTransformParams({ params, primitive, dsl, defaultPosition: [0, 0, -1.2] }));

    return { obj: mesh, uniforms };
  };
}

function makeShapeGeometry(shape, size = 1) {
  const id = String(shape || 'icosahedron').toLowerCase();
  if (id.includes('sphere')) return new THREE.SphereGeometry(size, 16, 16);
  if (id.includes('box')) return new THREE.BoxGeometry(size, size, size);
  if (id.includes('torus')) return new THREE.TorusGeometry(size * 0.8, size * 0.2, 10, 48);
  if (id.includes('cone')) return new THREE.ConeGeometry(size * 0.7, size * 1.5, 12);
  return new THREE.IcosahedronGeometry(size, 0);
}

function createDslGeometryBuilder(spec) {
  return ({ primitive, sceneCfg, seed = 0, index = 0 }) => {
    const dsl = isObject(spec.source.dsl) ? spec.source.dsl : {};
    const params = isObject(primitive?.params) ? primitive.params : {};
    const hasShaderSource = Boolean(spec.source.glsl.vertex || spec.source.glsl.fragment);

    if (hasShaderSource) {
      const width = clamp(params.width ?? dsl.width ?? dsl.gridWidth, 0.3, 120, 7.2);
      const height = clamp(params.height ?? dsl.height ?? dsl.gridHeight, 0.3, 120, 5.4);
      const segmentsX = Math.round(clamp(params.segmentsX ?? dsl.segmentsX ?? dsl.cellCount, 1, 240, 32));
      const segmentsY = Math.round(clamp(params.segmentsY ?? dsl.segmentsY ?? dsl.cellCount, 1, 240, 20));
      const isTransparent = toBoolean(params.transparent, toBoolean(dsl.transparent, true));
      const isDoubleSided = toBoolean(params.doubleSided, toBoolean(dsl.doubleSided, true));
      const { vertexShader, fragmentShader, paramUniforms } = prepareCustomShaderSources({
        spec,
        params,
        sceneCfg,
        vertexFallback: DEFAULT_SHADER_VERTEX,
        fragmentFallback: DEFAULT_SHADER_FRAGMENT
      });

      const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
      const uniforms = ensureShaderUniformDefaults(applyUniformMap({
        uTime: { value: 0 },
        uOpacity: { value: clamp(params.opacity ?? primitive?.opacity ?? dsl.opacity, 0.02, 1, 0.54) },
        uColorA: { value: hslStringToColor(sceneCfg?.palette?.primary || '#ffffff', '#ffffff') },
        uColorB: { value: hslStringToColor(sceneCfg?.palette?.secondary || '#99a8ff', '#99a8ff') },
        ...paramUniforms
      }, {
        ...(isObject(dsl.uniforms) ? dsl.uniforms : {}),
        ...(isObject(params.uniforms) ? params.uniforms : {})
      }, sceneCfg), {
        vertexShader,
        fragmentShader,
        sceneCfg,
        seed,
        moduleId: spec.id,
        index
      });

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: isTransparent,
        depthWrite: !isTransparent,
        side: isDoubleSided ? THREE.DoubleSide : THREE.FrontSide,
        blending: resolveBlend(params.blend || dsl.blend || primitive?.blend || 'normal')
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      applyTransform(mesh, buildTransformParams({ params, primitive, dsl, defaultPosition: [0, 0, 0] }));
      return { obj: mesh, uniforms };
    }

    const requestedCount = Number(params.count ?? dsl.count ?? spec.budgets.maxInstances ?? 16);
    const unclampedCount = Number.isFinite(requestedCount) ? Math.round(requestedCount) : 16;
    const count = Number.isFinite(spec.budgets.maxInstances) && spec.budgets.maxInstances > 0
      ? Math.max(1, Math.min(unclampedCount, Math.round(spec.budgets.maxInstances)))
      : Math.max(1, unclampedCount);
    const spread = clamp(params.spread ?? dsl.spread, 0.2, 30, 5);
    const depth = clamp(params.depth ?? dsl.depth, 0.1, 12, 2.5);
    const shape = asText(params.shape || dsl.shape || primitive?.shape, 48) || 'icosahedron';
    const wireframe = params.wireframe === true || dsl.wireframe === true;

    const group = new THREE.Group();
    const rand = mulberry32((seed ^ hashString(`${spec.id}:${index}`)) >>> 0);
    const color = hslStringToColor(
      sceneCfg?.palette?.[primitive?.color] || sceneCfg?.palette?.secondary || '#9aa8ff',
      '#9aa8ff'
    );

    for (let i = 0; i < count; i += 1) {
      const size = 0.08 + rand() * 0.5;
      const mesh = new THREE.Mesh(
        makeShapeGeometry(shape, size),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          wireframe,
          opacity: clamp(params.opacity ?? primitive?.opacity ?? dsl.opacity, 0.04, 1, 0.48)
        })
      );
      mesh.position.set(
        (rand() - 0.5) * spread * 2,
        (rand() - 0.5) * spread * 1.3,
        (rand() - 0.5) * depth
      );
      mesh.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      group.add(mesh);
    }

    applyTransform(group, buildTransformParams({ params, primitive, dsl, defaultPosition: [0, 0, 0] }));

    return { obj: group, uniforms: null };
  };
}

function createDslParticleBuilder(spec) {
  return ({ primitive, sceneCfg, seed = 0, index = 0 }) => {
    const dsl = isObject(spec.source.dsl) ? spec.source.dsl : {};
    const params = isObject(primitive?.params) ? primitive.params : {};
    const requestedCount = Number(params.count ?? dsl.count ?? spec.budgets.maxInstances ?? 220);
    const unclampedCount = Number.isFinite(requestedCount) ? Math.round(requestedCount) : 220;
    const count = Number.isFinite(spec.budgets.maxInstances) && spec.budgets.maxInstances > 0
      ? Math.max(8, Math.min(unclampedCount, Math.round(spec.budgets.maxInstances)))
      : Math.max(8, unclampedCount);
    const spread = clamp(params.spread ?? dsl.spread, 0.2, 40, 6);
    const size = clamp(params.size ?? dsl.size, 0.002, 1, 0.08);

    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const rand = mulberry32((seed ^ hashString(`${spec.id}:particle:${index}`)) >>> 0);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (rand() - 0.5) * spread * 2;
      positions[i * 3 + 1] = (rand() - 0.5) * spread * 1.2;
      positions[i * 3 + 2] = (rand() - 0.5) * spread * 0.7;
      scales[i] = 0.55 + rand() * 1.75;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const hasShaderSource = Boolean(spec.source.glsl.vertex || spec.source.glsl.fragment);
    if (hasShaderSource) {
      const { vertexShader, fragmentShader, paramUniforms } = prepareCustomShaderSources({
        spec,
        params,
        sceneCfg,
        vertexFallback: DEFAULT_PARTICLE_VERTEX,
        fragmentFallback: DEFAULT_PARTICLE_FRAGMENT
      });
      const uniforms = ensureShaderUniformDefaults(applyUniformMap({
        uTime: { value: 0 },
        uSize: { value: size * 120 },
        uOpacity: { value: clamp(params.opacity ?? primitive?.opacity ?? dsl.opacity, 0.03, 1, 0.72) },
        uColorA: { value: hslStringToColor(sceneCfg?.palette?.primary || '#ffffff', '#ffffff') },
        ...paramUniforms
      }, {
        ...(isObject(dsl.uniforms) ? dsl.uniforms : {}),
        ...(isObject(params.uniforms) ? params.uniforms : {})
      }, sceneCfg), {
        vertexShader,
        fragmentShader,
        sceneCfg,
        seed,
        moduleId: spec.id,
        index
      });

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: resolveBlend(params.blend || dsl.blend || primitive?.blend || 'additive')
      });

      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      applyTransform(points, buildTransformParams({ params, primitive, dsl, defaultPosition: [0, 0, 0] }));
      return { obj: points, uniforms };
    }

    const material = new THREE.PointsMaterial({
      color: sceneCfg?.palette?.[primitive?.color] || sceneCfg?.palette?.primary || '#ffffff',
      size: size * 3,
      transparent: true,
      opacity: clamp(params.opacity ?? primitive?.opacity ?? dsl.opacity, 0.03, 1, 0.72),
      depthWrite: false,
      blending: resolveBlend(params.blend || dsl.blend || primitive?.blend || 'additive')
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    applyTransform(points, buildTransformParams({ params, primitive, dsl, defaultPosition: [0, 0, 0] }));

    return { obj: points, uniforms: null };
  };
}

function fingerprintCustomModule(entry) {
  return hashString(JSON.stringify(entry)).toString(16).padStart(8, '0');
}

function normalizePipelinePatch(spec, raw = {}) {
  const sourceDsl = isObject(spec?.source?.dsl) ? spec.source.dsl : {};
  const sourcePatch = isObject(sourceDsl.patch) ? sourceDsl.patch : sourceDsl;
  const rawPatch = isObject(raw?.patch) ? raw.patch : {};
  const paramsSchema = isObject(spec?.paramsSchema) ? spec.paramsSchema : {};
  return {
    id: spec.id,
    family: spec.family,
    kind: spec.kind,
    seedPolicy: spec.seedPolicy,
    patch: {
      ...sourcePatch,
      ...rawPatch
    },
    paramsSchema,
    budgets: spec.budgets
  };
}

function createCustomBuilder(spec) {
  if (PIPELINE_FAMILIES.has(spec.family)) {
    return { builder: null, reason: 'pipeline-family' };
  }

  if (spec.kind === 'js') {
    const jsEnabled = globalThis.__DAILY_SCENE_CUSTOM_JS__ === true;
    const jsRegistry = isObject(globalThis.__DAILY_SCENE_CUSTOM_JS_BUILDERS__)
      ? globalThis.__DAILY_SCENE_CUSTOM_JS_BUILDERS__
      : {};
    if (!jsEnabled) {
      return { builder: null, reason: 'custom-js-disabled' };
    }
    const jsBuilder = jsRegistry[spec.id];
    if (typeof jsBuilder !== 'function') {
      return { builder: null, reason: 'custom-js-builder-missing' };
    }
    return {
      builder: ({ primitive, sceneCfg, seed, index }) => jsBuilder({
        THREE,
        primitive,
        sceneCfg,
        seed,
        index,
        utils: { hashString, mulberry32, hslStringToColor, resolveBlend }
      }),
      reason: null
    };
  }

  if (spec.family === 'shader') return { builder: createDslShaderBuilder(spec), reason: null };
  if (spec.family === 'geometry') return { builder: createDslGeometryBuilder(spec), reason: null };
  if (spec.family === 'particle') return { builder: createDslParticleBuilder(spec), reason: null };
  return { builder: null, reason: 'unknown-family' };
}

export function compileCustomModuleRegistry({ customModules = [], baseModuleTypes = [] } = {}) {
  const requested = Array.isArray(customModules) ? customModules : [];
  const maxModulesRaw = Number(globalThis.__DAILY_SCENE_CUSTOM_MODULES_MAX__);
  const maxModules = Number.isFinite(maxModulesRaw) && maxModulesRaw > 0
    ? Math.floor(maxModulesRaw)
    : null;
  const baseSet = new Set((Array.isArray(baseModuleTypes) ? baseModuleTypes : []).map((entry) => asText(entry, 64)).filter(Boolean));

  const registry = {
    builders: new Map(),
    moduleTypeToFamily: {},
    pipelinePatches: {
      post: [],
      camera: [],
      lighting: []
    },
    report: {
      requested: requested.length,
      accepted: [],
      rejected: []
    }
  };

  const seen = new Set();
  const entries = maxModules ? requested.slice(0, maxModules) : requested;
  if (maxModules && requested.length > maxModules) {
    registry.report.rejected.push({
      id: null,
      reason: 'custom-module-soft-limit-truncated',
      details: { configuredLimit: maxModules }
    });
  }

  entries.forEach((raw, index) => {
    if (!isObject(raw)) {
      registry.report.rejected.push({ id: null, reason: 'invalid-module-entry', details: { index } });
      return;
    }

    const id = asText(raw.id, 64);
    if (!id) {
      registry.report.rejected.push({ id: null, reason: 'missing-id', details: { index } });
      return;
    }
    if (seen.has(id)) {
      registry.report.rejected.push({ id, reason: 'duplicate-id' });
      return;
    }
    seen.add(id);

    const family = normalizeFamily(raw.family);
    if (!family) {
      registry.report.rejected.push({ id, reason: 'invalid-family' });
      return;
    }

    const kind = normalizeKind(raw.kind);
    const seedPolicy = asText(raw.seedPolicy, 48) || 'deterministic';
    if (seedPolicy !== 'deterministic') {
      registry.report.rejected.push({ id, reason: 'non-deterministic-seed-policy' });
      return;
    }

    if (baseSet.has(id) && raw.allowOverride !== true) {
      registry.report.rejected.push({ id, reason: 'module-id-collides-with-built-in' });
      return;
    }

    const spec = {
      id,
      family,
      kind,
      seedPolicy,
      paramsSchema: isObject(raw.paramsSchema) ? raw.paramsSchema : {},
      source: normalizeSource(raw.source),
      budgets: normalizeBudgets(raw.budgets)
    };

    const executableValidation = validateCustomModuleSpec(spec);
    if (!executableValidation.ok) {
      registry.report.rejected.push({ id, reason: executableValidation.reason || 'missing-executable-source' });
      return;
    }

    if (PIPELINE_FAMILIES.has(spec.family)) {
      const patch = normalizePipelinePatch(spec, raw);
      registry.pipelinePatches[spec.family].push(patch);
      registry.report.accepted.push({
        id,
        family,
        kind,
        fingerprint: fingerprintCustomModule(spec),
        budgets: spec.budgets
      });
      return;
    }

    const { builder, reason } = createCustomBuilder(spec);
    if (typeof builder !== 'function') {
      registry.report.rejected.push({ id, reason: reason || 'builder-unavailable' });
      return;
    }

    registry.builders.set(id, builder);
    registry.moduleTypeToFamily[id] = family;
    registry.report.accepted.push({
      id,
      family,
      kind,
      fingerprint: fingerprintCustomModule(spec),
      budgets: spec.budgets
    });
  });

  return registry;
}
