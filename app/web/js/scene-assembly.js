import * as THREE from 'three';
import {
  appendUniformTargets,
  buildAnimationRecord,
  isObject,
  normalizeVector3,
  prepareBuilderElement,
  resolveSceneColor,
  toFiniteNumber
} from './scene-config.js';
import { applyElementRenderOrder } from './scene-rendering.js';

export function rebuildSceneElements({
  group,
  activeElements = [],
  sceneCfg = {},
  seed = 0,
  elementBuilders,
  buildElementObject,
  moduleOverrideResolver
} = {}) {
  const animations = [];
  const uniformTargets = [];

  activeElements.forEach((element, index) => {
    const moduleOverride = moduleOverrideResolver?.resolve?.(element) || null;
    const builderElement = prepareBuilderElement(element, moduleOverride);
    const built = buildElementObject({
      element: builderElement,
      sceneCfg,
      seed,
      index,
      builders: elementBuilders
    });
    if (!built?.obj) return;

    applyElementRenderOrder(built.obj, builderElement, index);
    group.add(built.obj);
    animations.push(buildAnimationRecord({
      obj: built.obj,
      animation: builderElement.animation || {},
      seed,
      element: builderElement,
      index
    }));
    appendUniformTargets(uniformTargets, built.uniforms);
  });

  return { animations, uniformTargets };
}

export function applySceneEnvironment(scene, sceneCfg = {}) {
  scene.background = new THREE.Color(sceneCfg.palette?.bg || '#090b12');
  scene.fog = new THREE.FogExp2(sceneCfg.palette?.bg || '#090b12', sceneCfg.fogDensity || 0.035);
}

export function addSceneLighting(group, sceneCfg = {}) {
  const lightingCfg = isObject(sceneCfg.lighting) ? sceneCfg.lighting : {};
  const ambientCfg = isObject(lightingCfg.ambient) ? lightingCfg.ambient : {};
  const keyCfg = isObject(lightingCfg.key) ? lightingCfg.key : {};
  const rimCfg = isObject(lightingCfg.rim) ? lightingCfg.rim : {};

  const ambient = new THREE.AmbientLight(
    resolveSceneColor(sceneCfg, ambientCfg.color, sceneCfg.palette?.secondary || '#8899cc'),
    toFiniteNumber(ambientCfg.intensity, 0.6)
  );

  const key = new THREE.DirectionalLight(
    resolveSceneColor(sceneCfg, keyCfg.color, sceneCfg.palette?.glow || '#ffffff'),
    toFiniteNumber(keyCfg.intensity, 0.95)
  );
  const keyPos = normalizeVector3(keyCfg.position, [2.6, 3.4, 6.6]);
  key.position.set(keyPos[0], keyPos[1], keyPos[2]);

  const rim = new THREE.PointLight(
    resolveSceneColor(sceneCfg, rimCfg.color, sceneCfg.palette?.anchor || '#ffffff'),
    toFiniteNumber(rimCfg.intensity, 0.9),
    toFiniteNumber(rimCfg.distance, 16),
    toFiniteNumber(rimCfg.decay, 2)
  );
  const rimPos = normalizeVector3(rimCfg.position, [-2.4, -1.4, 4.8]);
  rim.position.set(rimPos[0], rimPos[1], rimPos[2]);

  group.add(ambient);
  group.add(key);
  group.add(rim);

  return { ambient, key, rim };
}
