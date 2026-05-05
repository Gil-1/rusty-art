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
