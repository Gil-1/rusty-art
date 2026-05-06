import {
  defaultShaderUniformValue,
  ensureShaderUniformDefaults as ensureShaderUniformDefaultsContract,
  inferShaderUniformType,
  normalizeShaderUniformValue,
  parseShaderUniformDeclarations,
  sanitizeShaderSource
} from '../../primitives/shader-contract.js';
import { asText, isObject } from './runtime-utils.js';

function hasMainFunction(source = '') {
  return /void\s+main\s*\(/.test(String(source || ''));
}

export function normalizeParamUniformName(key = '') {
  const normalized = String(key || '').trim().replace(/[^A-Za-z0-9_]/g, '_');
  return normalized ? `uParam_${normalized}` : null;
}

export function inferParamUniformType(schema = {}, value = undefined) {
  return inferShaderUniformType(schema, value);
}

export function buildParamUniformBindings(spec, params = {}, sceneCfg = null) {
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

export function rewriteSnippetParamReferences(source = '', bindings = []) {
  let next = String(source || '');
  for (const binding of bindings) {
    next = next.replace(new RegExp(`\\bparams\\.${binding.key}\\b`, 'g'), binding.uniformName);
  }
  return next;
}

export function wrapFragmentSnippet(source = '', bindings = []) {
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

/** @param {any} options */
export function prepareCustomShaderSources({ spec, params = {}, sceneCfg = null, vertexFallback, fragmentFallback } = {}) {
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

export function normalizeUniformValue(value, sceneCfg) {
  return normalizeShaderUniformValue(value, sceneCfg);
}

export function applyUniformMap(uniforms, map, sceneCfg) {
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

export function parseUniformDeclarations(shaderSource = '') {
  return parseShaderUniformDeclarations(shaderSource);
}

/** @param {any} options */
export function defaultUniformValue(type, name, options = {}) {
  return defaultShaderUniformValue(type, name, options);
}

/** @param {any} options */
export function ensureShaderUniformDefaults(uniforms, options = {}) {
  return ensureShaderUniformDefaultsContract(uniforms, options);
}
