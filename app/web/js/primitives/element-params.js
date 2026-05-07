export function toFiniteNumber(value, fallback = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function isFiniteVector(value, length = 3) {
  return Array.isArray(value)
    && value.length >= length
    && value.slice(0, length).every((entry) => Number.isFinite(Number(entry)));
}

export function resolveRuntimePosition({ primitive = {}, params = {}, fallback = [0, 0, 0] } = {}) {
  if (isFiniteVector(params.position, 3)) return params.position.slice(0, 3).map(Number);
  if (isFiniteVector(primitive.position, 3)) return primitive.position.slice(0, 3).map(Number);

  const legacyOffset = Array.isArray(primitive.offset) && primitive.offset.length >= 2
    ? primitive.offset
    : null;

  return [
    Number(params.offsetX ?? primitive.offsetX ?? (typeof primitive.offset === 'number' ? primitive.offset : legacyOffset?.[0]) ?? fallback[0]),
    Number(params.offsetY ?? primitive.offsetY ?? legacyOffset?.[1] ?? fallback[1]),
    Number(params.offsetZ ?? primitive.offsetZ ?? primitive.z ?? legacyOffset?.[2] ?? fallback[2])
  ];
}

export function resolveRuntimeScale({
  primitive = {},
  params = {},
  fallback = [1, 1, 1],
  numericScaleMode = 'preserve-z'
} = {}) {
  const numericParamScale = toFiniteNumber(params.scale, null);
  if (numericParamScale != null) {
    const z = numericScaleMode === 'uniform' ? numericParamScale : fallback[2];
    return [numericParamScale, numericParamScale, z];
  }

  const numericPrimitiveScale = toFiniteNumber(primitive.scale, null);
  if (numericPrimitiveScale != null) {
    const z = numericScaleMode === 'uniform' ? numericPrimitiveScale : fallback[2];
    return [numericPrimitiveScale, numericPrimitiveScale, z];
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

export function resolveRuntimeRotationZ({ primitive = {}, params = {}, fallback = 0 } = {}) {
  const paramsRotation = Array.isArray(params.rotation) ? params.rotation : null;
  const primitiveRotation = Array.isArray(primitive.rotation) ? primitive.rotation : null;
  return toFiniteNumber(params.rotationZ ?? primitive.rotationZ ?? paramsRotation?.[2] ?? primitiveRotation?.[2], fallback);
}

export function resolveRuntimeOpacity({ primitive = {}, params = {}, fallback = 1 } = {}) {
  return toFiniteNumber(params.opacity ?? primitive.opacity, fallback);
}

export function resolveRuntimeCount({ primitive = {}, params = {}, fallback = 1, min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const count = Math.round(toFiniteNumber(params.count ?? primitive.count, fallback) || fallback);
  return Math.max(min, Math.min(max, count));
}

export function resolveRuntimeSpreadVector(value, fallback = [4.6, 4.6, 1.6]) {
  if (isFiniteVector(value, 3)) return value.slice(0, 3).map(Number);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const x = toFiniteNumber(value.x, null);
    const y = toFiniteNumber(value.y, null);
    const z = toFiniteNumber(value.z, null);
    if (x != null && y != null && z != null) return [x, y, z];
  }
  const numeric = toFiniteNumber(value, null);
  if (numeric != null) return [numeric, numeric, fallback[2]];
  return fallback;
}

export function resolveRuntimeTransformFacts({
  primitive = {},
  params = {},
  fallbackPosition = [0, 0, 0],
  fallbackScale = [1, 1, 1],
  fallbackRotationZ = 0,
  numericScaleMode = 'preserve-z'
} = {}) {
  return {
    position: resolveRuntimePosition({ primitive, params, fallback: fallbackPosition }),
    scale: resolveRuntimeScale({ primitive, params, fallback: fallbackScale, numericScaleMode }),
    rotationZ: resolveRuntimeRotationZ({ primitive, params, fallback: fallbackRotationZ })
  };
}
