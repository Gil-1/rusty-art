import { normalizeStructuredGeometryType } from '../../contracts/custom-module-compiler-contract.js';
import { clamp, isObject, toBoolean } from './runtime-utils.js';

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

function materialFacts({ color, opacity, wireframe = false } = {}) {
  return {
    color,
    opacity,
    wireframe: wireframe === true
  };
}

function lerp(a, b, t) {
  return a + ((b - a) * t);
}

export function buildStructuredGeometryExecutionFacts(node = {}, context = {}) {
  const type = normalizeStructuredGeometryType(node.type || node.primitive);
  const transform = resolveStructuredTransformFacts(node, context);
  if (!type) {
    return { type: 'group', geometry: { kind: 'group' }, transform, children: [] };
  }

  if (type === 'group') {
    return {
      type,
      geometry: { kind: 'group' },
      transform,
      children: (Array.isArray(node.children) ? node.children : [])
        .map((child) => buildStructuredGeometryExecutionFacts(child, context))
    };
  }

  const materialSpec = isObject(context.dsl?.material) ? context.dsl.material : {};
  const palette = Array.isArray(context.materialPalette) && context.materialPalette.length
    ? context.materialPalette
    : resolveStructuredPalette(materialSpec, context);
  const childContext = { ...context, materialPalette: palette };

  if (type === 'ellipse-rings') {
    const ringCount = Math.max(1, Math.round(resolveStructuredNumber(node.ringsExpr ?? node.rings, childContext, 4)));
    const width = clamp(resolveStructuredNumber(node.widthExpr ?? node.width, childContext, 1.2), 0.05, 40, 1.2);
    const height = clamp(resolveStructuredNumber(node.heightExpr ?? node.height, childContext, 1.8), 0.05, 40, 1.8);
    const stroke = clamp(resolveStructuredNumber(node.strokeExpr ?? node.stroke ?? node.lineWidth, childContext, 0.08), 0.005, 2, 0.08);
    const rotationZ = resolveStructuredNumber(node.rotationExpr ?? node.rotationZ ?? node.rotation, childContext, 0);
    const segments = Math.max(24, Math.round(resolveStructuredNumber(node.segments, childContext, 128)));
    const opacity = clamp(resolveStructuredNumber(materialSpec.opacity, childContext, 0.92), 0.02, 1, 0.92);
    const rings = [];

    for (let i = 0; i < ringCount; i += 1) {
      const ratio = Math.max(0.18, 1 - (i * 0.18));
      rings.push({
        width: width * ratio,
        height: height * ratio,
        lineWidth: stroke,
        segments,
        rotationZ,
        positionZ: Number(node.z || 0) + (i * 0.01),
        material: materialFacts({
          color: resolveStructuredColorValue(palette[i] ?? palette[palette.length - 1] ?? '#ffffff', childContext, '#ffffff'),
          opacity
        })
      });
    }

    return { type, geometry: { kind: 'ellipse-rings', rings }, transform, materialPalette: palette };
  }

  if (type === 'stacked-rects') {
    const count = Math.max(1, Math.round(resolveStructuredNumber(node.countExpr ?? node.count, childContext, 9)));
    const width = clamp(resolveStructuredNumber(node.widthExpr ?? node.width, childContext, 2), 0.01, 40, 2);
    const height = clamp(resolveStructuredNumber(node.heightExpr ?? node.height, childContext, 0.08), 0.005, 4, 0.08);
    const [yMin, yMax] = Array.isArray(node.yRange) && node.yRange.length >= 2
      ? [resolveStructuredNumber(node.yRange[0], childContext, -1), resolveStructuredNumber(node.yRange[1], childContext, 1)]
      : [-1, 1];
    const centerBias = clamp(resolveStructuredNumber(node.centerBiasExpr ?? node.centerBias, childContext, 1), 0.2, 2.2, 1);
    const opacity = clamp(resolveStructuredNumber(materialSpec.opacity, childContext, 0.78), 0.02, 1, 0.78);
    const color = resolveStructuredColorValue(node.color ?? materialSpec.color ?? palette[0] ?? '#ffffff', childContext, '#ffffff');
    const rects = [];

    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : (i / (count - 1));
      const normalized = (t * 2) - 1;
      const weighted = Math.sign(normalized) * Math.pow(Math.abs(normalized), centerBias);
      rects.push({
        width,
        height,
        position: [0, lerp(yMin, yMax, (weighted + 1) / 2), i * 0.001],
        material: materialFacts({ color, opacity })
      });
    }

    return { type, geometry: { kind: 'stacked-rects', rects }, transform, materialPalette: palette };
  }

  if (type === 'tube-path') {
    const path = (Array.isArray(node.path) ? node.path : [])
      .map((entry) => resolveStructuredVector3(entry, childContext, [0, 0, 0]));
    const closed = resolveStructuredBoolean(node.closed, childContext, false);
    return {
      type,
      geometry: {
        kind: 'tube-path',
        path,
        closed,
        radialSegments: Math.max(3, Math.round(resolveStructuredNumber(node.radialSegments, childContext, 12))),
        radius: clamp(resolveStructuredNumber(node.radiusExpr ?? node.radius ?? node.thickness, childContext, 0.08), 0.005, 2, 0.08),
        material: materialFacts({
          color: resolveStructuredColorValue(node.color ?? materialSpec.color ?? palette[0] ?? '#ffffff', childContext, '#ffffff'),
          opacity: clamp(resolveStructuredNumber(materialSpec.opacity, childContext, 0.84), 0.02, 1, 0.84)
        })
      },
      transform,
      materialPalette: palette
    };
  }

  if (type === 'ellipse-ring') {
    return {
      type,
      geometry: {
        kind: 'ellipse-ring',
        width: clamp(resolveStructuredNumber(node.width, childContext, 1), 0.01, 40, 1),
        height: clamp(resolveStructuredNumber(node.height, childContext, 1.4), 0.01, 40, 1.4),
        lineWidth: clamp(resolveStructuredNumber(node.lineWidth ?? node.stroke ?? node.thickness, childContext, 0.08), 0.005, 2, 0.08),
        material: materialFacts({
          color: resolveStructuredColorValue(node.color ?? materialSpec.color ?? palette[0] ?? '#ffffff', childContext, '#ffffff'),
          opacity: clamp(resolveStructuredNumber(node.strokeOpacity ?? node.opacity ?? materialSpec.opacity, childContext, 0.9), 0.02, 1, 0.9)
        })
      },
      transform,
      materialPalette: palette
    };
  }

  if (type === 'rect') {
    return {
      type,
      geometry: {
        kind: 'rect',
        width: clamp(resolveStructuredNumber(node.width, childContext, 1), 0.01, 40, 1),
        height: clamp(resolveStructuredNumber(node.height, childContext, 0.1), 0.005, 10, 0.1),
        material: materialFacts({
          color: resolveStructuredColorValue(node.color ?? materialSpec.color ?? palette[0] ?? '#ffffff', childContext, '#ffffff'),
          opacity: clamp(resolveStructuredNumber(node.opacity ?? materialSpec.opacity, childContext, 0.84), 0.02, 1, 0.84)
        })
      },
      transform,
      materialPalette: palette
    };
  }

  return {
    type,
    geometry: {
      kind: 'ellipse',
      width: clamp(resolveStructuredNumber(node.width, childContext, 0.4), 0.01, 20, 0.4),
      height: clamp(resolveStructuredNumber(node.height, childContext, 0.4), 0.01, 20, 0.4),
      material: materialFacts({
        color: resolveStructuredColorValue(node.color ?? materialSpec.color ?? palette[0] ?? '#ffffff', childContext, '#ffffff'),
        opacity: clamp(resolveStructuredNumber(node.opacity ?? node.fillOpacity ?? materialSpec.opacity, childContext, 0.84), 0.02, 1, 0.84)
      })
    },
    transform,
    materialPalette: palette
  };
}
