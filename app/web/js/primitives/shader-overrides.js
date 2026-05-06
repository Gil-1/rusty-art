import * as THREE from 'three';
import {
  inferShaderUniformType,
  normalizeShaderUniformValue,
  sanitizeShaderSource as sanitizeShaderSourceContract
} from './shader-contract.js';

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

function trimTrailingSemicolon(value = '') {
  return String(value || '').trim().replace(/;\s*$/, '').trim();
}

function looksLikeShaderStatement(value = '') {
  const text = trimTrailingSemicolon(value);
  if (!text) return false;
  return /(^|\s)(float|vec2|vec3|vec4|int|bool)\s+[A-Za-z_]\w*/.test(text)
    || /(^|\s)(if|for|while|discard|return)\b/.test(text)
    || /(^|[^!<>=])=(?!=)/.test(text)
    || /[{}]/.test(text)
    || /\+\+|--/.test(text);
}

function applyFragmentHookShorthand(source, hooks = {}) {
  if (!isObject(hooks) || typeof source !== 'string') return source;

  const colorize = asText(hooks.colorize, 8_000);
  const fragmentColorHook = asText(hooks.fragmentColor, 8_000);
  const alphaHook = asText(hooks.alpha, 8_000);
  if (!colorize && !fragmentColorHook && !alphaHook) return source;

  return source.replace(
    /gl_FragColor\s*=\s*vec4\(\s*([A-Za-z_]\w*(?:\.[rgba]{1,4})?)\s*,\s*([A-Za-z_]\w*(?:\.[rgba]{1,4})?)\s*\)\s*;/,
    (_match, colorExpr, alphaExpr) => {
      const lines = [
        `vec3 fragmentColor = ${colorExpr};`
      ];
      const helperAliases = buildFragmentHookAliases(source, [colorize, fragmentColorHook, alphaHook]);
      const hasColorBinding = /\bvec[34]\s+color\b/.test(source);
      const needsColorAlias = !hasColorBinding && /\bcolor\./.test([colorize, fragmentColorHook, alphaHook].filter(Boolean).join(' '));

      if (alphaExpr !== 'alpha') {
        lines.push(`float alpha = ${alphaExpr};`);
      }
      if (needsColorAlias) {
        lines.push('vec4 color = vec4(fragmentColor, alpha);');
      }
      lines.push(...helperAliases);

      if (colorize) {
        lines.push(`fragmentColor = ${trimTrailingSemicolon(colorize)};`);
      }

      if (fragmentColorHook) {
        const normalizedHook = normalizeFragmentHookCode(source, fragmentColorHook);
        if (looksLikeShaderStatement(normalizedHook)) {
          lines.push(normalizedHook);
          if (needsColorAlias) {
            lines.push('fragmentColor = color.rgb;');
            lines.push('alpha = color.a;');
          } else if (/\bcolor\b/.test(normalizedHook)) {
            lines.push('fragmentColor = color;');
          }
        } else {
          lines.push(`fragmentColor = ${trimTrailingSemicolon(normalizedHook)};`);
        }
      }

      if (alphaHook) {
        const normalizedAlphaHook = normalizeFragmentHookCode(source, alphaHook);
        if (looksLikeShaderStatement(normalizedAlphaHook)) {
          lines.push(normalizedAlphaHook);
        } else {
          lines.push(`alpha = ${trimTrailingSemicolon(normalizedAlphaHook)};`);
        }
      }

      lines.push('gl_FragColor = vec4(fragmentColor, alpha);');
      return lines.join('\n');
    }
  );
}

function mergeHookSnippet(hooks = {}, glsl = {}, stage = 'fragment') {
  const snippet = asText(glsl?.[stage], stage === 'vertex' ? 16_000 : 20_000);
  if (!snippet || /void\s+main\s*\(/.test(snippet)) return hooks;

  const key = `${stage}MainIntro`;
  const existing = asText(hooks?.[key], 8_000);
  return {
    ...(isObject(hooks) ? hooks : {}),
    [key]: [existing, snippet].filter(Boolean).join('\n')
  };
}

function inferUniformDeclaration(name, value) {
  const uniformName = asText(name, 64);
  if (!uniformName) return null;
  return `uniform ${inferShaderUniformType({}, value)} ${uniformName};`;
}

function ensureUniformDeclarations(source, uniformOverrides = {}) {
  if (!isObject(uniformOverrides) || typeof source !== 'string') return source;
  const declarations = [];
  for (const [name, value] of Object.entries(uniformOverrides)) {
    const declaration = inferUniformDeclaration(name, value);
    const uniformName = asText(name, 64);
    if (!declaration || !uniformName) continue;
    if (new RegExp(`uniform\\s+\\w+\\s+${uniformName}\\s*;`).test(source)) continue;
    declarations.push(declaration);
  }
  if (!declarations.length) return source;
  return `${declarations.join('\n')}\n${source}`;
}

function buildFragmentHookAliases(source, snippets = []) {
  const combined = snippets.filter(Boolean).join(' ');
  const aliases = [];
  if (/\binstanceSeed\b/.test(combined) && !/\bfloat\s+instanceSeed\b/.test(source)) {
    aliases.push('float instanceSeed = 0.0;');
  }
  return aliases;
}

function normalizeFragmentHookCode(source, value = '') {
  let next = String(value || '').trim();
  if (!next) return next;
  next = next.replace(/\bcolor\.a\b/g, 'alpha');
  if (/\bfloat\s+n\s*=/.test(source)) {
    next = next.replace(/\bnoise\b(?!\s*\()/g, 'n');
  }
  if (!/\bvEdge\b/.test(source) && /\bvPosition\b/.test(source)) {
    next = next.replace(/\bvEdge\b/g, 'vPosition.x');
  }
  if (!/\binstanceSeed\b/.test(source)) {
    next = next.replace(/\binstanceSeed\b/g, '0.0');
  }
  return next;
}

export function sanitizeShaderSource(source = '') {
  return sanitizeShaderSourceContract(source);
}

function normalizeUniformValue(value, sceneCfg) {
  return normalizeShaderUniformValue(value, sceneCfg);
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
    const vertexHooks = mergeHookSnippet(override?.hooks, override?.glsl, 'vertex');
    const fragmentHooks = mergeHookSnippet(override?.hooks, override?.glsl, 'fragment');
    finalVertexShader = applyShaderHooks(finalVertexShader, vertexHooks, 'vertex');
    finalFragmentShader = applyShaderHooks(finalFragmentShader, fragmentHooks, 'fragment');
    finalFragmentShader = applyFragmentHookShorthand(finalFragmentShader, fragmentHooks);
  }

  finalVertexShader = ensureUniformDeclarations(finalVertexShader, override?.uniforms || {});
  finalFragmentShader = ensureUniformDeclarations(finalFragmentShader, override?.uniforms || {});

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
