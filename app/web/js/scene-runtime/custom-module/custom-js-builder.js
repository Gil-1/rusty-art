import * as THREE from 'three';
import { hashString, hslStringToColor, mulberry32, resolveBlend } from '../../primitives/utils.js';
import { isObject } from './runtime-utils.js';

export function createCustomJsBuilder(spec, runtime = globalThis) {
  const jsEnabled = runtime.__DAILY_SCENE_CUSTOM_JS__ === true;
  const jsRegistry = isObject(runtime.__DAILY_SCENE_CUSTOM_JS_BUILDERS__)
    ? runtime.__DAILY_SCENE_CUSTOM_JS_BUILDERS__
    : {};
  if (!jsEnabled) {
    return { builder: null, reason: 'custom-js-disabled' };
  }
  const jsBuilder = jsRegistry[spec.id];
  if (typeof jsBuilder !== 'function') {
    return { builder: null, reason: 'custom-js-builder-missing' };
  }
  return {
    builder: ({ primitive, sceneCfg, seed, index }) => jsBuilder({
      THREE,
      primitive,
      sceneCfg,
      seed,
      index,
      utils: { hashString, mulberry32, hslStringToColor, resolveBlend }
    }),
    reason: null
  };
}
