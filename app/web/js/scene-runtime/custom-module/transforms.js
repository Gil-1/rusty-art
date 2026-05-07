import { isObject } from './runtime-utils.js';
import {
  resolveRuntimePosition,
  resolveRuntimeScale
} from '../../primitives/element-params.js';

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

  return resolveRuntimePosition({
    primitive: {
      offset: legacyOffset || params.offset,
      offsetX: params.offsetX,
      offsetY: params.offsetY,
      offsetZ: params.offsetZ,
      z: params.z
    },
    params: {},
    fallback: fallbackPosition
  });
}

export function resolveLegacyScale(params = {}, target) {
  const fallbackScale = [target.scale.x, target.scale.y, target.scale.z];
  return resolveRuntimeScale({
    primitive: {
      scaleX: params.scaleX,
      scaleY: params.scaleY,
      scaleZ: params.scaleZ
    },
    params: {},
    fallback: fallbackScale,
    numericScaleMode: 'uniform'
  });
}

export function applyTransform(target, params = {}) {
  const position = normalizeVector3(params.position, resolveLegacyPosition(params, target));
  const rotation = normalizeVector3(params.rotation, [target.rotation.x, target.rotation.y, target.rotation.z]);
  const scaleRaw = params.scale;
  const scale = typeof scaleRaw === 'number'
    ? [scaleRaw, scaleRaw, scaleRaw]
    : normalizeVector3(scaleRaw, resolveLegacyScale(params, target));

  target.position.set(position[0], position[1], position[2]);
  target.rotation.set(rotation[0], rotation[1], rotation[2]);
  target.scale.set(scale[0], scale[1], scale[2]);
}

/** @param {any} options */
export function buildTransformParams({ params = {}, primitive = {}, dsl = {}, defaultPosition = [0, 0, 0], defaultRotation = [0, 0, 0], defaultScale = 1 }) {
  const explicitPosition = params.position || primitive?.position || dsl.position;
  const explicitScale = params.scale || primitive?.scale || dsl.scale;
  const hasAxisScale = params.scaleX !== undefined
    || params.scaleY !== undefined
    || params.scaleZ !== undefined
    || primitive?.scaleX !== undefined
    || primitive?.scaleY !== undefined
    || primitive?.scaleZ !== undefined;
  return {
    position: explicitPosition,
    rotation: params.rotation || primitive?.rotation || dsl.rotation || defaultRotation,
    scale: explicitScale || (hasAxisScale ? undefined : defaultScale),
    offset: params.offset || primitive?.offset,
    offsetX: params.offsetX ?? primitive?.offsetX,
    offsetY: params.offsetY ?? primitive?.offsetY,
    offsetZ: params.offsetZ ?? primitive?.offsetZ,
    scaleX: params.scaleX ?? primitive?.scaleX,
    scaleY: params.scaleY ?? primitive?.scaleY,
    scaleZ: params.scaleZ ?? primitive?.scaleZ,
    z: params.z ?? primitive?.z,
    defaultPosition
  };
}
