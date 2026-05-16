export const CUSTOM_FAMILIES = new Set(['shader', 'geometry', 'particle', 'post', 'camera', 'lighting']);
export const CUSTOM_KINDS = new Set(['dsl', 'js']);
export const PIPELINE_FAMILIES = new Set(['post', 'camera', 'lighting']);
export const WEBGL_ONLY_CUSTOM_SHADER_SURFACES = Object.freeze([
  'source.glsl raw GLSL',
  'THREE.ShaderMaterial',
  'THREE.RawShaderMaterial',
  'onBeforeCompile shader overrides',
  'custom JS shader surfaces'
]);
export const EXECUTABLE_DSL_KEYS = Object.freeze({
  shader: new Set(['width', 'height', 'opacity', 'position', 'rotation', 'scale', 'blend', 'plane', 'primitive', 'depthTest', 'depthWrite', 'transparent', 'doubleSided']),
  geometry: new Set(['geometry', 'material', 'count', 'spread', 'depth', 'shape', 'wireframe', 'opacity', 'position', 'rotation', 'scale', 'width', 'height', 'gridWidth', 'gridHeight', 'segmentsX', 'segmentsY', 'cellCount', 'blend']),
  particle: new Set(['count', 'spread', 'size', 'opacity', 'position', 'rotation', 'scale', 'blend'])
});
export const NON_EXECUTABLE_PATCH_KEYS = new Set(['moduleType', 'generate', 'material', 'animation', 'description', 'notes', 'intent', 'previewIntent']);
export const STRUCTURED_GEOMETRY_TYPES = new Set(['group', 'ellipse-ring', 'ellipse', 'ellipse-rings', 'stacked-rects', 'tube-path', 'rect']);
export const STRUCTURED_GEOMETRY_ALIASES = Object.freeze({
  ellipsering: 'ellipse-ring',
  ellipserings: 'ellipse-rings',
  ring: 'ellipse-ring',
  rings: 'ellipse-rings',
  concentricrings: 'ellipse-rings',
  ovalrings: 'ellipse-rings',
  gaterings: 'ellipse-rings',
  stackedrects: 'stacked-rects',
  tubepath: 'tube-path'
});

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asText(value, _maxLen = 128) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  return normalized;
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

export function fingerprintCustomModule(entry) {
  return hashString(JSON.stringify(entry)).toString(16).padStart(8, '0');
}

export function normalizeStructuredGeometryType(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
  if (!normalized) return '';
  if (STRUCTURED_GEOMETRY_ALIASES[normalized]) return STRUCTURED_GEOMETRY_ALIASES[normalized];
  return normalized;
}

function sortedSetValues(values) {
  return [...values].sort();
}

function executableDslKeysManifest() {
  return Object.fromEntries(
    Object.entries(EXECUTABLE_DSL_KEYS).map(([family, keys]) => [family, sortedSetValues(keys)])
  );
}

export function getCustomModuleRuntimeCapabilityManifest({ allowJs = false, customJsBuilderIds = [] } = {}) {
  return Object.freeze({
    families: sortedSetValues(CUSTOM_FAMILIES),
    kinds: sortedSetValues(CUSTOM_KINDS),
    pipelineFamilies: sortedSetValues(PIPELINE_FAMILIES),
    executableDslKeys: executableDslKeysManifest(),
    nonExecutablePatchKeys: sortedSetValues(NON_EXECUTABLE_PATCH_KEYS),
    webglOnlyShaderSurfaces: WEBGL_ONLY_CUSTOM_SHADER_SURFACES.slice(),
    structuredGeometryTypes: sortedSetValues(STRUCTURED_GEOMETRY_TYPES),
    structuredGeometryAliases: { ...STRUCTURED_GEOMETRY_ALIASES },
    js: {
      allowed: allowJs === true,
      builderIds: (Array.isArray(customJsBuilderIds) ? customJsBuilderIds : [])
        .map((entry) => asText(entry, 96))
        .filter(Boolean)
        .sort()
    },
    defaultBudgets: normalizeBudgets({})
  });
}

export function hasStructuredGeometryDsl(node) {
  if (!isObject(node)) return false;
  const type = normalizeStructuredGeometryType(node.type || node.primitive);
  if (!type) return false;
  if (type === 'group') {
    return Array.isArray(node.children) && node.children.length > 0 && node.children.every((child) => hasStructuredGeometryDsl(child));
  }
  return STRUCTURED_GEOMETRY_TYPES.has(type);
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
  if (family === 'geometry' && hasStructuredGeometryDsl(source.geometry)) return true;
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

export function validateCustomModuleSpec(spec) {
  if (PIPELINE_FAMILIES.has(spec.family)) {
    return hasExecutablePipelinePatch(spec)
      ? { ok: true, reason: null }
      : { ok: false, reason: 'pipeline-patch-not-executable' };
  }

  if (spec.kind === 'js') return { ok: true, reason: null };

  const hasShaderSource = Boolean(spec?.source?.glsl?.vertex || spec?.source?.glsl?.fragment);
  const hasExecutableDsl = hasExecutableDslConfig(spec.family, spec?.source?.dsl || {});
  const hasPatchOnlyDsl = isObject(spec?.source?.dsl?.patch);
  const hasUnsupportedStructuredGeometry = spec.family === 'geometry'
    && isObject(spec?.source?.dsl?.geometry)
    && !hasStructuredGeometryDsl(spec.source.dsl.geometry);

  if (isPlaceholderFragmentShader(spec?.source?.glsl?.fragment || '')) {
    return { ok: false, reason: 'placeholder-fragment-shader' };
  }
  if (hasUnsupportedStructuredGeometry) {
    return { ok: false, reason: 'unsupported-structured-geometry-dsl' };
  }
  if (!hasShaderSource && !hasExecutableDsl) {
    return { ok: false, reason: hasPatchOnlyDsl ? 'prose-only-dsl-patch' : 'missing-executable-source' };
  }
  return { ok: true, reason: null };
}

export function normalizePipelinePatch(spec, raw = {}) {
  const sourceDsl = isObject(spec?.source?.dsl) ? spec.source.dsl : {};
  const sourcePatch = isObject(sourceDsl.patch) ? sourceDsl.patch : sourceDsl;
  const rawPatch = isObject(raw?.patch) ? raw.patch : {};
  const paramsSchema = isObject(spec?.paramsSchema) ? spec.paramsSchema : {};
  return {
    id: spec.id,
    family: spec.family,
    kind: spec.kind,
    seedPolicy: spec.seedPolicy,
    patch: { ...sourcePatch, ...rawPatch },
    paramsSchema,
    budgets: spec.budgets
  };
}

export function compileCustomModuleContract({ customModules = [], baseModuleTypes = [], maxModules = null, allowJs = false } = {}) {
  const requested = Array.isArray(customModules) ? customModules : [];
  const baseSet = new Set((Array.isArray(baseModuleTypes) ? baseModuleTypes : []).map((entry) => asText(entry, 64)).filter(Boolean));
  const entries = maxModules ? requested.slice(0, maxModules) : requested;
  const seen = new Set();
  const acceptedSpecs = [];
  const moduleTypeToFamily = {};
  const pipelinePatches = { post: [], camera: [], lighting: [] };
  const report = { requested: requested.length, accepted: [], rejected: [] };

  if (maxModules && requested.length > maxModules) {
    report.rejected.push({ id: null, reason: 'custom-module-soft-limit-truncated', details: { configuredLimit: maxModules } });
  }

  entries.forEach((raw, index) => {
    if (!isObject(raw)) {
      report.rejected.push({ id: null, reason: 'invalid-module-entry', details: { index } });
      return;
    }

    const id = asText(raw.id, 64);
    if (!id) {
      report.rejected.push({ id: null, reason: 'missing-id', details: { index } });
      return;
    }
    if (seen.has(id)) {
      report.rejected.push({ id, reason: 'duplicate-id' });
      return;
    }
    seen.add(id);

    const family = normalizeFamily(raw.family);
    if (!family) {
      report.rejected.push({ id, reason: 'invalid-family' });
      return;
    }

    const kind = normalizeKind(raw.kind);
    const seedPolicy = asText(raw.seedPolicy, 48) || 'deterministic';
    if (seedPolicy !== 'deterministic') {
      report.rejected.push({ id, reason: 'non-deterministic-seed-policy' });
      return;
    }

    if (baseSet.has(id) && raw.allowOverride !== true) {
      report.rejected.push({ id, reason: 'module-id-collides-with-built-in' });
      return;
    }

    if (kind === 'js' && allowJs !== true) {
      report.rejected.push({ id, reason: 'custom-js-disabled' });
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
      report.rejected.push({ id, reason: executableValidation.reason || 'missing-executable-source' });
      return;
    }

    if (PIPELINE_FAMILIES.has(spec.family)) {
      pipelinePatches[spec.family].push(normalizePipelinePatch(spec, raw));
    } else {
      moduleTypeToFamily[id] = family;
    }

    const reportEntry = {
      id,
      family,
      kind,
      fingerprint: fingerprintCustomModule(spec),
      budgets: spec.budgets
    };
    report.accepted.push(reportEntry);
    acceptedSpecs.push({ spec, raw, reportEntry });
  });

  return { requested, acceptedSpecs, moduleTypeToFamily, pipelinePatches, report };
}
