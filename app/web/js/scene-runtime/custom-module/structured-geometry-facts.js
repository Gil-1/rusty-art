import { normalizeStructuredGeometryType } from '../../contracts/custom-module-compiler-contract.js';
import { clamp, isObject, toBoolean } from './runtime-utils.js';
import { buildStructuredGeometryPrimitiveFacts } from './structured-geometry-registry.js';

export const NO_DSL_VALUE = Symbol('structured-dsl-no-value');

function readStructuredDslParamValue(name, { params = {}, spec = null } = {}) {
  const key = String(name || '').trim();
  if (!key) return undefined;
  if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== undefined) {
    return params[key];
  }
  const schema = isObject(spec?.paramsSchema) ? spec.paramsSchema : {};
  const definition = isObject(schema[key]) ? schema[key] : null;
  if (definition && Object.prototype.hasOwnProperty.call(definition, 'default')) {
    return definition.default;
  }
  return undefined;
}

export function resolveStructuredDslReference(name, context = {}, fallback = NO_DSL_VALUE) {
  const key = String(name || '').trim();
  if (!key) return fallback;
  if (key === 'palette') {
    return Array.isArray(context.materialPalette) && context.materialPalette.length
      ? context.materialPalette.slice()
      : fallback;
  }
  if (key.startsWith('palette.')) {
    const paletteKey = key.slice('palette.'.length);
    return context.sceneCfg?.palette?.[paletteKey] ?? fallback;
  }
  const paramValue = readStructuredDslParamValue(key, context);
  return paramValue !== undefined ? paramValue : fallback;
}

export function resolveStructuredDslValue(expr, context = {}, fallback = NO_DSL_VALUE) {
  if (expr === undefined || expr === null) {
    return fallback === NO_DSL_VALUE ? expr : fallback;
  }
  if (Array.isArray(expr)) {
    return expr.map((entry) => resolveStructuredDslValue(entry, context, entry));
  }
  if (typeof expr === 'number' || typeof expr === 'boolean') return expr;
  if (typeof expr === 'string') {
    const trimmed = expr.trim();
    if (!trimmed) return fallback === NO_DSL_VALUE ? trimmed : fallback;
    const isReference = trimmed.startsWith('$') || /^palette\./.test(trimmed) || /^[A-Za-z_][\w.-]*$/.test(trimmed);
    if (!isReference) return trimmed;
    const referenceKey = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
    const referenceValue = resolveStructuredDslReference(referenceKey, context, NO_DSL_VALUE);
    return referenceValue === NO_DSL_VALUE
      ? (fallback === NO_DSL_VALUE ? trimmed : fallback)
      : referenceValue;
  }
  if (isObject(expr)) {
    if (Array.isArray(expr.mul) && expr.mul.length) {
      return expr.mul
        .map((entry) => Number(resolveStructuredDslValue(entry, context, 1)))
        .reduce((acc, value) => acc * value, 1);
    }
    if (Array.isArray(expr.add) && expr.add.length) {
      return expr.add
        .map((entry) => Number(resolveStructuredDslValue(entry, context, 0)))
        .reduce((acc, value) => acc + value, 0);
    }
    if (Array.isArray(expr.sub) && expr.sub.length) {
      const [first, ...rest] = expr.sub;
      return rest.reduce(
        (acc, entry) => acc - Number(resolveStructuredDslValue(entry, context, 0)),
        Number(resolveStructuredDslValue(first, context, 0))
      );
    }
    if (Array.isArray(expr.div) && expr.div.length) {
      const [first, ...rest] = expr.div;
      return rest.reduce((acc, entry) => {
        const divisor = Number(resolveStructuredDslValue(entry, context, 1));
        return divisor === 0 ? acc : acc / divisor;
      }, Number(resolveStructuredDslValue(first, context, 0)));
    }
    if (Object.prototype.hasOwnProperty.call(expr, 'index') && Object.prototype.hasOwnProperty.call(expr, 'from')) {
      return resolveStructuredColorValue(expr, context, fallback === NO_DSL_VALUE ? '#ffffff' : fallback);
    }
  }
  return fallback === NO_DSL_VALUE ? expr : fallback;
}

export function resolveStructuredNumber(expr, context = {}, fallback = 0) {
  const resolved = resolveStructuredDslValue(expr, context, fallback);
  const numeric = Number(resolved);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function resolveStructuredBoolean(expr, context = {}, fallback = false) {
  const resolved = resolveStructuredDslValue(expr, context, fallback);
  return toBoolean(resolved, fallback);
}

export function resolveStructuredPalette(materialSpec = {}, context = {}) {
  if (Array.isArray(materialSpec.colorRamp) && materialSpec.colorRamp.length) {
    return materialSpec.colorRamp;
  }
  const colors = resolveStructuredDslValue(materialSpec.colors, context, NO_DSL_VALUE);
  if (Array.isArray(colors) && colors.length) return colors;
  const baseColor = resolveStructuredDslValue(materialSpec.color, context, NO_DSL_VALUE);
  if (typeof baseColor === 'string' && baseColor.trim()) return [baseColor.trim()];
  return [
    context.sceneCfg?.palette?.primary || '#ffffff',
    context.sceneCfg?.palette?.secondary || '#9aa8ff',
    context.sceneCfg?.palette?.glow || context.sceneCfg?.palette?.anchor || '#f2d7a6'
  ].filter(Boolean);
}

export function resolveStructuredColorValue(expr, context = {}, fallback = '#ffffff') {
  if (Array.isArray(expr) && expr.length === 3 && expr.every(Number.isFinite)) return expr.slice();
  if (isObject(expr) && Object.prototype.hasOwnProperty.call(expr, 'index')) {
    const sourceRef = String(expr.from || '$palette').trim();
    const sourceValue = sourceRef.startsWith('$')
      ? resolveStructuredDslReference(sourceRef.slice(1), context, NO_DSL_VALUE)
      : resolveStructuredDslReference(sourceRef, context, NO_DSL_VALUE);
    const palette = Array.isArray(sourceValue) && sourceValue.length
      ? sourceValue
      : (Array.isArray(context.materialPalette) && context.materialPalette.length ? context.materialPalette : [fallback]);
    return palette[Math.max(0, Math.floor(Number(expr.index) || 0))] ?? expr.fallback ?? fallback;
  }
  const resolved = resolveStructuredDslValue(expr, context, fallback);
  if (Array.isArray(resolved) && resolved.length === 3 && resolved.every(Number.isFinite)) return resolved.slice();
  return resolved;
}

export function resolveStructuredVector3(expr, context = {}, fallback = [0, 0, 0]) {
  if (Array.isArray(expr) && expr.length === 3) {
    return expr.map((entry, index) => resolveStructuredNumber(entry, context, fallback[index] ?? 0));
  }
  if (isObject(expr)) {
    return [
      resolveStructuredNumber(expr.x, context, fallback[0] ?? 0),
      resolveStructuredNumber(expr.y, context, fallback[1] ?? 0),
      resolveStructuredNumber(expr.z, context, fallback[2] ?? 0)
    ];
  }
  if (typeof expr === 'number' && Number.isFinite(expr)) {
    return [expr, expr, expr];
  }
  return fallback.slice();
}

export function resolveStructuredTransformFacts(node = {}, context = {}) {
  const explicitPosition = Array.isArray(node.position) || isObject(node.position)
    ? node.position
    : (Number.isFinite(node?.z) ? [0, 0, Number(node.z)] : null);
  const position = explicitPosition
    ? resolveStructuredVector3(explicitPosition, context, [0, 0, 0])
    : [0, 0, 0];
  const rotation = Array.isArray(node.rotation)
    ? resolveStructuredVector3(node.rotation, context, [0, 0, 0])
    : [
        resolveStructuredNumber(node.rotationX, context, 0),
        resolveStructuredNumber(node.rotationY, context, 0),
        resolveStructuredNumber(node.rotationZ ?? node.rotation, context, 0),
      ];
  const scale = resolveStructuredVector3(node.scale, context, [1, 1, 1]);
  return { position, rotation, scale };
}

export function buildStructuredGeometryExecutionFacts(node = {}, context = {}) {
  const type = normalizeStructuredGeometryType(node.type || node.primitive);
  const transform = resolveStructuredTransformFacts(node, context);
  return buildStructuredGeometryPrimitiveFacts({
    type: type || 'group',
    node,
    context,
    transform,
    helpers: {
      buildChildFacts: buildStructuredGeometryExecutionFacts,
      clamp,
      isObject,
      resolveBoolean: resolveStructuredBoolean,
      resolveColorValue: resolveStructuredColorValue,
      resolveNumber: resolveStructuredNumber,
      resolveStructuredPalette,
      resolveVector3: resolveStructuredVector3
    }
  });
}
