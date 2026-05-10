import { addSceneLighting, applySceneEnvironment, rebuildSceneElements } from './scene-assembly.js';
import {
  applyPipelinePatches,
  buildModuleOverrideResolver,
  prepareRuntimeSceneConfig,
  resolveBreathingConfig,
  resolvePostBase,
  selectActiveSceneElements
} from './scene-config.js';
import { disposeObjectTree, loadElementRuntime } from './scene-runtime.js';

function clearSceneGroup(group, disposeObjectTreeFn) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    disposeObjectTreeFn(child);
  }
}

export function sanitizeSceneCameraRuntimeConfig(camCfg = {}) {
  const source = camCfg && typeof camCfg === 'object' && !Array.isArray(camCfg) ? camCfg : {};
  const sanitized = {};

  if (source.autoRotate === true) sanitized.autoRotate = true;
  else if (source.autoRotate === false) sanitized.autoRotate = false;
  if (Number.isFinite(source.autoRotateSpeed)) sanitized.autoRotateSpeed = source.autoRotateSpeed;
  if (Number.isFinite(source.cycleSeconds)) sanitized.cycleSeconds = source.cycleSeconds;
  if (source.motionEnabled === true) sanitized.motionEnabled = true;
  else if (source.motionEnabled === false) sanitized.motionEnabled = false;
  if (Array.isArray(source.beats) && source.beats.length >= 2) sanitized.beats = source.beats;
  if (source.materializationFraming && typeof source.materializationFraming === 'object' && !Array.isArray(source.materializationFraming)) {
    sanitized.materializationFraming = source.materializationFraming;
  }

  return sanitized;
}

export function applySceneCameraRuntimeConfig(sceneAdapter, camCfg = {}) {
  const cameraConfig = sanitizeSceneCameraRuntimeConfig(camCfg);
  sceneAdapter.controls.autoRotate = cameraConfig.autoRotate === true;
  sceneAdapter.controls.autoRotateSpeed = Number.isFinite(cameraConfig.autoRotateSpeed) ? cameraConfig.autoRotateSpeed : 0.35;
  sceneAdapter.cameraBeats = Array.isArray(cameraConfig.beats) && cameraConfig.beats.length >= 2 ? cameraConfig.beats : null;
  sceneAdapter.cameraCycleSeconds = Number.isFinite(cameraConfig.cycleSeconds) ? cameraConfig.cycleSeconds : 24;
  sceneAdapter.cameraMotionEnabled = cameraConfig.motionEnabled === true;
  sceneAdapter.resetCameraForArtwork(cameraConfig);
}

export async function applySceneConfigSession(sceneAdapter, config, {
  applyToken,
  getCurrentApplyToken = () => applyToken,
  loadElementRuntimeFn = loadElementRuntime,
  disposeObjectTreeFn = disposeObjectTree
} = {}) {
  const { buildElementObject, loadElementBuilders } = await loadElementRuntimeFn();
  if (applyToken !== getCurrentApplyToken()) return false;

  clearSceneGroup(sceneAdapter.group, disposeObjectTreeFn);
  sceneAdapter.animations = [];
  sceneAdapter.uniformTargets = [];

  const { sceneCfg, elements } = prepareRuntimeSceneConfig(config);

  sceneAdapter.styleFingerprint = {
    ...sceneAdapter.styleFingerprint,
    ...(sceneCfg.styleFingerprint || {})
  };

  const customModules = Array.isArray(sceneCfg.sceneAuthoring?.customModules)
    ? sceneCfg.sceneAuthoring.customModules
    : [];
  const moduleOverrideResolver = buildModuleOverrideResolver(sceneCfg.sceneAuthoring?.moduleOverrides || []);
  const activeElements = selectActiveSceneElements(sceneCfg, elements);

  const {
    builders: elementBuilders,
    customModuleReport,
    pipelinePatches
  } = await loadElementBuilders(activeElements, customModules);
  if (applyToken !== getCurrentApplyToken()) return false;
  sceneAdapter.customModuleReport = customModuleReport || null;
  sceneCfg.customModuleReport = customModuleReport || sceneCfg.customModuleReport || null;
  applyPipelinePatches(sceneCfg, pipelinePatches);

  let rebuilt;
  try {
    rebuilt = rebuildSceneElements({
      group: sceneAdapter.group,
      requestedElements: elements,
      activeElements,
      sceneCfg,
      seed: config.seed,
      elementBuilders,
      buildElementObject,
      moduleOverrideResolver
    });
  } catch (error) {
    sceneAdapter.sceneAssemblyReport = error?.sceneAssemblyReport || null;
    throw error;
  }

  sceneAdapter.animations = rebuilt.animations;
  sceneAdapter.uniformTargets = rebuilt.uniformTargets;
  sceneAdapter.sceneAssemblyReport = rebuilt.assemblyReport || null;

  applySceneEnvironment(sceneAdapter.scene, sceneCfg);
  addSceneLighting(sceneAdapter.group, sceneCfg);

  sceneAdapter.motionSpeed = sceneCfg.motionSpeed || 0.001;
  sceneAdapter.currentTension = sceneCfg.expression?.tension ?? 0.5;
  applySceneCameraRuntimeConfig(sceneAdapter, {
    ...(sceneCfg.camera || {}),
    materializationFraming: sceneCfg.camera?.materializationFraming || sceneCfg.materialization?.framing || null
  });

  sceneAdapter.breathing = resolveBreathingConfig(sceneCfg);
  sceneAdapter.postBase = resolvePostBase(sceneCfg);
  sceneAdapter.renderer.toneMappingExposure = sceneAdapter.postBase.exposure;
  sceneAdapter.postUniforms.uContrast.value = sceneAdapter.postBase.contrast;
  sceneAdapter.postUniforms.uSaturation.value = sceneAdapter.postBase.saturation;
  sceneAdapter.postUniforms.uVignette.value = sceneAdapter.postBase.vignette;
  sceneAdapter.postUniforms.uDistortion.value = sceneAdapter.postBase.distortion * sceneAdapter.motionIntensity;

  return true;
}
