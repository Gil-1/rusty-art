import { isObject } from './runtime-utils.js';

export function normalizeVector3(value, fallback = [0, 0, 0]) {
  if (Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)) {
    return [value[0], value[1], value[2]];
  }
  if (isObject(value) && Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z)) {
    return [value.x, value.y, value.z];
  }
  return fallback;
}

export function resolveLegacyPosition(params = {}, target) {
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

export function applyTransform(target, params = {}) {
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

/** @param {any} options */
export function buildTransformParams({ params = {}, primitive = {}, dsl = {}, defaultPosition = [0, 0, 0], defaultRotation = [0, 0, 0], defaultScale = 1 }) {
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
