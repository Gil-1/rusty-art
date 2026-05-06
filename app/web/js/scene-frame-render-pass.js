import { applyPrimitiveAnimations } from './scene-animations.js';

function resolveElapsedFrameTime(scene, { getElapsedTime } = {}) {
  if (scene.captureMode) return scene.captureTime;
  if (typeof getElapsedTime === 'function') return getElapsedTime(scene);
  return scene.clock.getElapsedTime();
}

export function computeSceneFrameFacts(scene, options = {}) {
  const t = resolveElapsedFrameTime(scene, options);
  const motion = scene.motionIntensity ?? 1;
  const timeScale = 0.2 + motion * 0.8;
  const motionT = t * timeScale;
  const speed = (scene.motionSpeed || 0.001) * timeScale;
  const breathing = scene.breathing || {};
  const styleFingerprint = scene.styleFingerprint || {};
  const postBase = scene.postBase || {};
  const currentTension = scene.currentTension;
  const breathA = Math.sin(motionT * 0.11 + breathing.phaseA * Math.PI * 2);
  const breathB = Math.sin(motionT * 0.07 + breathing.phaseB * Math.PI * 2);

  return {
    t,
    motion,
    timeScale,
    motionT,
    speed,
    breathA,
    breathB,
    currentTension,
    styleFingerprint,
    uniformTargetFacts: {
      uTime: motionT,
      cameraPosition: scene.camera.position,
      uTension: currentTension
    },
    postUniformFacts: {
      uTime: motionT,
      uHueShift: breathA * breathing.hueShift * motion + (styleFingerprint.temperatureBias || 0) * 0.006,
      uSaturation: postBase.saturation * (1 + breathB * breathing.saturationAmplitude * motion),
      uContrast: postBase.contrast * (1 + (styleFingerprint.edgeHardness || 0.5) * 0.06 * (0.45 + motion * 0.55)),
      uVignette: postBase.vignette + currentTension * 0.04,
      uDistortion: postBase.distortion * motion,
      uExposureMul: 1 + breathA * breathing.exposureAmplitude * motion
    },
    animationFacts: {
      motionT,
      speed,
      motion,
      styleFingerprint
    },
    cameraFacts: {
      t,
      motionT,
      speed,
      motion
    }
  };
}

export function applySceneFrameUniformFacts(scene, frameFacts) {
  const { uniformTargetFacts, postUniformFacts } = frameFacts;

  scene.uniformTargets.forEach((uniforms) => {
    if (uniforms.uTime) uniforms.uTime.value = uniformTargetFacts.uTime;
    if (uniforms.uCameraPos) uniforms.uCameraPos.value.copy(uniformTargetFacts.cameraPosition);
    if (uniforms.uTension) uniforms.uTension.value = uniformTargetFacts.uTension;
  });

  scene.postUniforms.uTime.value = postUniformFacts.uTime;
  scene.postUniforms.uHueShift.value = postUniformFacts.uHueShift;
  scene.postUniforms.uSaturation.value = postUniformFacts.uSaturation;
  scene.postUniforms.uContrast.value = postUniformFacts.uContrast;
  scene.postUniforms.uVignette.value = postUniformFacts.uVignette;
  scene.postUniforms.uDistortion.value = postUniformFacts.uDistortion;
  scene.postUniforms.uExposureMul.value = postUniformFacts.uExposureMul;
}

export function applySceneFrameRenderPass(scene, frameFacts, {
  applyAnimations = applyPrimitiveAnimations,
  updateCameraForFrame = (cameraFacts) => scene.cameraInteraction.updateForFrame(cameraFacts),
  setRenderTarget = (target) => scene.renderer.setRenderTarget(target),
  renderMainScene = () => scene.renderer.render(scene.scene, scene.camera),
  renderPostScene = () => scene.renderer.render(scene.postScene, scene.postCamera)
} = {}) {
  applySceneFrameUniformFacts(scene, frameFacts);

  applyAnimations({
    animations: scene.animations,
    motionT: frameFacts.animationFacts.motionT,
    speed: frameFacts.animationFacts.speed,
    motion: frameFacts.animationFacts.motion,
    styleFingerprint: frameFacts.animationFacts.styleFingerprint
  });

  updateCameraForFrame(frameFacts.cameraFacts);

  setRenderTarget(scene.renderTarget);
  renderMainScene();
  setRenderTarget(null);
  renderPostScene();
}

export function renderSceneFramePass(scene, options = {}) {
  const frameFacts = computeSceneFrameFacts(scene, options);
  applySceneFrameRenderPass(scene, frameFacts, options);
  return frameFacts;
}
