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

export function applySceneCameraRuntimeConfig(sceneAdapter, camCfg = {}) {
  sceneAdapter.controls.autoRotate = camCfg.autoRotate === true;
  sceneAdapter.controls.autoRotateSpeed = Number.isFinite(camCfg.autoRotateSpeed) ? camCfg.autoRotateSpeed : 0.35;
  if (Number.isFinite(camCfg.minDistance)) sceneAdapter.controls.minDistance = camCfg.minDistance;
  if (Number.isFinite(camCfg.maxDistance)) sceneAdapter.controls.maxDistance = camCfg.maxDistance;
  sceneAdapter.cameraBeats = Array.isArray(camCfg.beats) && camCfg.beats.length >= 2 ? camCfg.beats : null;
  sceneAdapter.cameraCycleSeconds = Number.isFinite(camCfg.cycleSeconds) ? camCfg.cycleSeconds : 24;
  sceneAdapter.cameraMotionEnabled = camCfg.motionEnabled === true;
  sceneAdapter.resetCameraForArtwork(camCfg);
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
  applySceneCameraRuntimeConfig(sceneAdapter, sceneCfg.camera || {});

  sceneAdapter.breathing = resolveBreathingConfig(sceneCfg);
  sceneAdapter.postBase = resolvePostBase(sceneCfg);
  sceneAdapter.renderer.toneMappingExposure = sceneAdapter.postBase.exposure;
  sceneAdapter.postUniforms.uContrast.value = sceneAdapter.postBase.contrast;
  sceneAdapter.postUniforms.uSaturation.value = sceneAdapter.postBase.saturation;
  sceneAdapter.postUniforms.uVignette.value = sceneAdapter.postBase.vignette;
  sceneAdapter.postUniforms.uDistortion.value = sceneAdapter.postBase.distortion * sceneAdapter.motionIntensity;

  return true;
}
