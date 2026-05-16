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

function elementFact(element = {}, index = 0, extra = {}) {
  return {
    index,
    id: element?.id || null,
    moduleType: element?.moduleType || null,
    role: element?.role || null,
    layer: element?.layer || null,
    ...extra
  };
}

function summarizeCustomModuleRuntime(report = null) {
  const rejected = Array.isArray(report?.rejected) ? report.rejected : [];
  return {
    requested: Number(report?.requested || 0),
    accepted: (Array.isArray(report?.accepted) ? report.accepted : []).map((entry) => ({
      id: entry?.id || null,
      family: entry?.family || null,
      kind: entry?.kind || null
    })),
    rejected: rejected.map((entry) => ({
      id: entry?.id || null,
      reason: entry?.reason || null
    })),
    warnings: rejected.map((entry) => ({
      id: entry?.id || null,
      warning: entry?.reason || 'custom-module-rejected'
    }))
  };
}

function finalizeSceneAssemblyReport(report) {
  const summary = {
    requested: report.requested.length,
    active: report.active.length,
    built: report.built.length,
    dropped: report.dropped.length,
    missing: report.missing.length,
    errored: report.errored.length,
    customModuleWarnings: report.customModuleRuntime.warnings.length
  };
  return Object.freeze({
    ...report,
    summary: Object.freeze(summary),
    requested: Object.freeze(report.requested.slice()),
    active: Object.freeze(report.active.slice()),
    built: Object.freeze(report.built.slice()),
    dropped: Object.freeze(report.dropped.slice()),
    missing: Object.freeze(report.missing.slice()),
    errored: Object.freeze(report.errored.slice()),
    customModuleRuntime: Object.freeze({
      ...report.customModuleRuntime,
      accepted: Object.freeze(report.customModuleRuntime.accepted.slice()),
      rejected: Object.freeze(report.customModuleRuntime.rejected.slice()),
      warnings: Object.freeze(report.customModuleRuntime.warnings.slice())
    })
  });
}

export function createSceneAssemblyReport({ requestedElements = [], activeElements = [], customModuleReport = null } = {}) {
  return {
    version: 1,
    requested: requestedElements.map((element, index) => elementFact(element, index)),
    active: activeElements.map((element, index) => elementFact(element, index)),
    built: [],
    dropped: [],
    missing: [],
    errored: [],
    customModuleRuntime: summarizeCustomModuleRuntime(customModuleReport)
  };
}

export function rebuildSceneElements({
  group,
  requestedElements = null,
  activeElements = [],
  sceneCfg = {},
  seed = 0,
  elementBuilders,
  buildElementObject,
  moduleOverrideResolver
} = {}) {
  const animations = [];
  const uniformTargets = [];
  const assemblyReport = createSceneAssemblyReport({
    requestedElements: requestedElements || activeElements,
    activeElements,
    customModuleReport: sceneCfg.customModuleReport || null
  });

  activeElements.forEach((element, index) => {
    const moduleOverride = moduleOverrideResolver?.resolve?.(element) || null;
    const builderElement = prepareBuilderElement(element, moduleOverride);
    const hasBuilder = elementBuilders?.has?.(builderElement.moduleType) === true;
    let built;
    try {
      built = buildElementObject({
        element: builderElement,
        sceneCfg,
        seed,
        index,
        builders: elementBuilders
      });
    } catch (error) {
      assemblyReport.errored.push(elementFact(builderElement, index, {
        reason: 'builder-error',
        message: error?.message || String(error)
      }));
      error.sceneAssemblyReport = finalizeSceneAssemblyReport(assemblyReport);
      throw error;
    }
    if (!built?.obj) {
      const dropped = elementFact(builderElement, index, {
        reason: hasBuilder ? 'builder-returned-empty' : 'missing-builder'
      });
      assemblyReport.dropped.push(dropped);
      if (!hasBuilder) assemblyReport.missing.push(dropped);
      return;
    }

    applyElementRenderOrder(built.obj, builderElement, index);
    group.add(built.obj);
    assemblyReport.built.push(elementFact(builderElement, index, {
      renderOrder: built.obj.renderOrder,
      overridden: Boolean(moduleOverride)
    }));
    animations.push(buildAnimationRecord({
      obj: built.obj,
      animation: builderElement.animation || {},
      seed,
      element: builderElement,
      index
    }));
    appendUniformTargets(uniformTargets, built.uniforms);
  });

  return { animations, uniformTargets, assemblyReport: finalizeSceneAssemblyReport(assemblyReport) };
}

export function applySceneEnvironment(scene, sceneCfg = {}) {
  const environmentBackground = createMaterializationEnvironmentBackground(sceneCfg);
  scene.background = environmentBackground || new THREE.Color(sceneCfg.palette?.bg || '#090b12');
  scene.fog = new THREE.FogExp2(sceneCfg.palette?.bg || '#090b12', sceneCfg.fogDensity || 0.035);
}

function hashSeedText(text = '') {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp01(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(1, numeric));
}

function colorComponents(color) {
  return [color.r, color.g, color.b].map((entry) => Math.max(0, Math.min(255, Math.round(entry * 255))));
}

function seededCellNoise(x, y, seed) {
  let value = (x * 374761393 + y * 668265263 + seed * 1442695041) >>> 0;
  value ^= value >>> 13;
  value = Math.imul(value, 1274126177) >>> 0;
  value ^= value >>> 16;
  return (value >>> 0) / 0xffffffff;
}

export function createMaterializationEnvironmentBackground(sceneCfg = {}) {
  const layer = sceneCfg?.materialization?.environmentLayer;
  if (!layer?.enabled || layer.renderSurface !== 'scene-background-texture') return null;

  const size = 64;
  const colorA = new THREE.Color(resolveSceneColor(sceneCfg, layer.colorA || 'palette.bg', sceneCfg.palette?.bg || '#090b12'));
  const colorB = new THREE.Color(resolveSceneColor(sceneCfg, layer.colorB || 'palette.secondary', sceneCfg.palette?.secondary || '#8899cc'));
  const a = colorComponents(colorA);
  const b = colorComponents(colorB);
  const textureFacts = isObject(layer.texture) ? layer.texture : {};
  const grain = clamp01(textureFacts.grain, 0.24);
  const wash = clamp01(textureFacts.wash, 0.5);
  const seed = hashSeedText(`${sceneCfg?.seeds?.runSeed || sceneCfg?.seed || 0}:${layer.role || 'environment'}`);
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = x / Math.max(1, size - 1);
      const ny = y / Math.max(1, size - 1);
      const softBand = 0.5 + 0.5 * Math.sin((nx * 1.7 + ny * 1.15) * Math.PI * (1.2 + wash));
      const paperNoise = seededCellNoise(x, y, seed) - 0.5;
      const t = Math.max(0, Math.min(1, softBand * wash + ny * (1 - wash) + paperNoise * grain * 0.38));
      const shade = paperNoise * grain * 42;
      const offset = (y * size + x) * 4;
      data[offset] = Math.max(0, Math.min(255, Math.round(a[0] + (b[0] - a[0]) * t + shade)));
      data[offset + 1] = Math.max(0, Math.min(255, Math.round(a[1] + (b[1] - a[1]) * t + shade)));
      data[offset + 2] = Math.max(0, Math.min(255, Math.round(a[2] + (b[2] - a[2]) * t + shade)));
      data[offset + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.needsUpdate = true;
  if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData = {
    materializationEnvironment: true,
    role: layer.role || null,
    renderSurface: layer.renderSurface,
    textureKind: textureFacts.kind || null
  };
  return texture;
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
