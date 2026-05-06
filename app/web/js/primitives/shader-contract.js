import * as THREE from 'three';
import { hashString, hslStringToColor } from './utils.js';

export function isShaderContractObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function asShaderText(value, maxLen = 20_000) {
  const text = String(value || '').trim();
  if (!text) return null;
  return text.slice(0, maxLen);
}

function containsDynamicShaderReference(expression = '') {
  return /\b(?:v[A-Z]\w*|u[A-Z]\w*|uv|position|normal|gl_[A-Za-z_]\w*)\b/.test(expression);
}

function hoistRuntimeInitializedGlobals(source = '') {
  if (typeof source !== 'string' || !source.includes('void main')) return source;

  const mainIndex = source.search(/void\s+main\s*\(\s*\)\s*\{/);
  if (mainIndex < 0) return source;

  const preamble = source.slice(0, mainIndex);
  const body = source.slice(mainIndex);
  const statements = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < preamble.length; i += 1) {
    const char = preamble[i];
    if (char === '{') depth += 1;
    else if (char === '}') depth = Math.max(0, depth - 1);
    else if (char === ';' && depth === 0) {
      statements.push(preamble.slice(start, i + 1));
      start = i + 1;
    }
  }

  const trailing = preamble.slice(start);
  const hoisted = [];
  const kept = [];

  for (const statement of statements) {
    const trimmed = statement.trim();
    const match = trimmed.match(/^(float|vec2|vec3|vec4|int|bool)\s+[A-Za-z_]\w*\s*=\s*([\s\S]+);$/);
    if (match && containsDynamicShaderReference(match[2])) {
      hoisted.push(trimmed);
      continue;
    }
    kept.push(statement);
  }

  if (!hoisted.length) return source;

  const rewrittenBody = body.replace(/void\s+main\s*\(\s*\)\s*\{/, (signature) => `${signature}\n${hoisted.join('\n')}\n`);
  return `${kept.join('')}${trailing}${rewrittenBody}`;
}

export function sanitizeShaderSource(source = '') {
  return hoistRuntimeInitializedGlobals(source);
}

export function inferShaderUniformType(schema = {}, value = undefined) {
  const declared = String(schema?.type || '').trim().toLowerCase();
  if (declared === 'boolean' || typeof value === 'boolean') return 'bool';
  if (declared === 'vec2' || (Array.isArray(value) && value.length === 2)) return 'vec2';
  if (declared === 'vec3' || (Array.isArray(value) && value.length === 3)) return 'vec3';
  if (declared === 'vec4' || (Array.isArray(value) && value.length === 4)) return 'vec4';
  if (declared === 'int') return 'int';
  if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('hsl(') || value.startsWith('palette.'))) return 'vec3';
  return 'float';
}

export function normalizeShaderUniformValue(value, sceneCfg) {
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

  if (isShaderContractObject(value)) {
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

export function parseShaderUniformDeclarations(shaderSource = '') {
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

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

export function defaultShaderUniformValue(type, name, options = {}) {
  const { sceneCfg, seed = 0, moduleId = 'cm', index = 0 } = options;
  const key = String(name || '').toLowerCase();
  const seedNorm = ((hashString(`${moduleId}:${seed}:${index}:${name}`) % 10_000) / 10_000);

  if (type === 'float') {
    if (key === 'utime' || key.includes('time')) return 0;
    if (key.includes('opacity') || key.includes('alpha')) return 0.68;
    if (key.includes('density')) return 0.62;
    if (key.includes('soft') || key.includes('falloff')) return 0.45;
    if (key.includes('flow')) return Number(clampNumber(sceneCfg?.flowField, 0, 1, 0.5).toFixed(3));
    if (key.includes('distort') || key.includes('jitter') || key.includes('noise')) {
      return Number(clampNumber(sceneCfg?.distortion, 0, 1, 0.2).toFixed(3));
    }
    if (key.includes('seed') || key.includes('phase')) return Number(seedNorm.toFixed(6));
    if (key.includes('intensity') || key.includes('glow')) return 0.58;
    return 0.5;
  }

  if (type === 'int') return key.includes('count') ? 12 : 1;
  if (type === 'bool') return true;
  if (type === 'vec2') return key.includes('resolution') ? new THREE.Vector2(1, 1) : new THREE.Vector2(0.5, 0.5);

  if (type === 'vec3') {
    if (key.includes('bg')) return hslStringToColor(sceneCfg?.palette?.bg || '#10131f', '#10131f');
    if (key.includes('anchor')) return hslStringToColor(sceneCfg?.palette?.anchor || '#ffffff', '#ffffff');
    if (key.includes('secondary')) return hslStringToColor(sceneCfg?.palette?.secondary || '#99a8ff', '#99a8ff');
    if (key.includes('primary')) return hslStringToColor(sceneCfg?.palette?.primary || '#ffffff', '#ffffff');
    if (key.includes('colorb') || key.endsWith('b')) return hslStringToColor(sceneCfg?.palette?.secondary || '#99a8ff', '#99a8ff');
    if (key.includes('glow')) return hslStringToColor(sceneCfg?.palette?.glow || '#ffffff', '#ffffff');
    return hslStringToColor(sceneCfg?.palette?.primary || '#ffffff', '#ffffff');
  }

  if (type === 'vec4') return new THREE.Vector4(1, 1, 1, 1);
  return null;
}

export function ensureShaderUniformDefaults(uniforms, options = {}) {
  const {
    vertexShader = '',
    fragmentShader = '',
    sceneCfg,
    seed = 0,
    moduleId = 'cm',
    index = 0
  } = options;
  const out = { ...uniforms };
  const declarations = [...parseShaderUniformDeclarations(vertexShader), ...parseShaderUniformDeclarations(fragmentShader)];
  const seen = new Set();

  for (const declaration of declarations) {
    if (!declaration?.name || seen.has(declaration.name)) continue;
    seen.add(declaration.name);
    if (Object.prototype.hasOwnProperty.call(out, declaration.name)) continue;

    const fallback = defaultShaderUniformValue(declaration.type, declaration.name, {
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
