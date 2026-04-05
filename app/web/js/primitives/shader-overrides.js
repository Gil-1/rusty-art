import * as THREE from 'three';
import { hslStringToColor } from './utils.js';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asText(value, maxLen = 20_000) {
  const text = String(value || '').trim();
  if (!text) return null;
  return text.slice(0, maxLen);
}

function injectMainIntro(source, intro) {
  const payload = asText(intro, 6_000);
  if (!payload) return source;
  return source.replace(/void\s+main\s*\(\s*\)\s*\{/, (signature) => `${signature}\n${payload}\n`);
}

function injectMainOutro(source, outro) {
  const payload = asText(outro, 6_000);
  if (!payload) return source;
  const closeIndex = source.lastIndexOf('}');
  if (closeIndex < 0) return `${source}\n${payload}\n`;
  return `${source.slice(0, closeIndex)}\n${payload}\n${source.slice(closeIndex)}`;
}

function applyShaderHooks(source, hooks = {}, stage = 'fragment') {
  if (!isObject(hooks) || typeof source !== 'string') return source;
  const prefix = asText(hooks[`${stage}Prefix`], 8_000);
  const intro = hooks[`${stage}MainIntro`];
  const outro = hooks[`${stage}MainOutro`];

  let next = prefix ? `${prefix}\n${source}` : source;
  next = injectMainIntro(next, intro);
  next = injectMainOutro(next, outro);
  return next;
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

function mergeUniforms(baseUniforms, uniformOverrides = {}, sceneCfg) {
  const merged = { ...baseUniforms };
  if (!isObject(uniformOverrides)) return merged;

  for (const [key, rawValue] of Object.entries(uniformOverrides)) {
    const uniformName = asText(key, 64);
    if (!uniformName) continue;
    const normalizedValue = normalizeUniformValue(rawValue, sceneCfg);
    if (normalizedValue == null) continue;
    merged[uniformName] = { value: normalizedValue };
  }

  return merged;
}

export function createShaderMaterialWithOverride({
  primitive,
  sceneCfg,
  uniforms,
  vertexShader,
  fragmentShader,
  materialOptions = {}
}) {
  const override = isObject(primitive?.shaderOverride) ? primitive.shaderOverride : null;
  const mode = asText(override?.mode, 24)?.toLowerCase() || 'uniforms';

  let finalVertexShader = vertexShader;
  let finalFragmentShader = fragmentShader;

  if (mode === 'replace') {
    const vertexOverride = asText(override?.glsl?.vertex, 16_000);
    const fragmentOverride = asText(override?.glsl?.fragment, 20_000);
    if (vertexOverride) finalVertexShader = vertexOverride;
    if (fragmentOverride) finalFragmentShader = fragmentOverride;
  }

  if (mode === 'hooks') {
    finalVertexShader = applyShaderHooks(finalVertexShader, override?.hooks, 'vertex');
    finalFragmentShader = applyShaderHooks(finalFragmentShader, override?.hooks, 'fragment');
  }

  finalVertexShader = sanitizeShaderSource(finalVertexShader);
  finalFragmentShader = sanitizeShaderSource(finalFragmentShader);

  const finalUniforms = mergeUniforms(uniforms, override?.uniforms || {}, sceneCfg);

  return new THREE.ShaderMaterial({
    ...materialOptions,
    uniforms: finalUniforms,
    vertexShader: finalVertexShader,
    fragmentShader: finalFragmentShader
  });
}
