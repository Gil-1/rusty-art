import { RenderPipeline, Vector2 } from 'three/webgpu';
import {
  atan,
  clamp,
  cos,
  dot,
  float,
  Fn,
  mat3,
  mix,
  pass,
  sin,
  smoothstep,
  sqrt,
  uniform,
  uv,
  vec2,
  vec3,
  vec4
} from 'three/tsl';

export const WEBGPU_TSL_OUTPUT_COLOR_TRANSFORM_MODE = 'webgpu-tsl-post';

export function createTslPostProcessingControls({
  uniformFactory = uniform
} = {}) {
  return {
    uTime: uniformFactory(0),
    uContrast: uniformFactory(1),
    uSaturation: uniformFactory(1),
    uVignette: uniformFactory(0),
    uDistortion: uniformFactory(0),
    uHueShift: uniformFactory(0),
    uExposureMul: uniformFactory(1),
    uResolution: uniformFactory(new Vector2(1, 1))
  };
}

function setControlValue(control, value) {
  if (!control) return null;
  control.value = value;
  return value;
}

function setResolutionValue(control, width, height) {
  if (!control) return null;
  const resolvedWidth = Math.max(1, Math.round(Number(width) || 1));
  const resolvedHeight = Math.max(1, Math.round(Number(height) || 1));
  if (typeof control.value?.set === 'function') {
    control.value.set(resolvedWidth, resolvedHeight);
  } else {
    control.value = { width: resolvedWidth, height: resolvedHeight };
  }
  return { width: resolvedWidth, height: resolvedHeight };
}

export function applyTslPostProcessingControls(controls, {
  time = 0,
  contrast = 1,
  saturation = 1,
  vignette = 0,
  distortion = 0,
  hueShift = 0,
  exposure = 1,
  width = null,
  height = null
} = {}) {
  const facts = {
    outputColorTransformMode: WEBGPU_TSL_OUTPUT_COLOR_TRANSFORM_MODE,
    time: setControlValue(controls.uTime, Number.isFinite(Number(time)) ? Number(time) : 0),
    contrast: setControlValue(controls.uContrast, Number(contrast)),
    saturation: setControlValue(controls.uSaturation, Number(saturation)),
    vignette: setControlValue(controls.uVignette, Number(vignette)),
    distortion: setControlValue(controls.uDistortion, Number(distortion)),
    hueShift: setControlValue(controls.uHueShift, Number(hueShift)),
    exposure: setControlValue(controls.uExposureMul, Number(exposure)),
    resolution: null
  };

  if (width != null || height != null) {
    facts.resolution = setResolutionValue(controls.uResolution, width, height);
  }
  return facts;
}

export function applyOutputColorTransformToTslControls(controls, transform = {}, frameFacts = {}) {
  return applyTslPostProcessingControls(controls, {
    time: frameFacts.elapsedSeconds ?? frameFacts.time ?? 0,
    contrast: transform.contrast ?? 1,
    saturation: transform.saturation ?? 1,
    vignette: transform.vignette ?? 0,
    distortion: transform.distortion ?? 0,
    hueShift: transform.hueShift ?? 0,
    exposure: transform.exposure ?? 1,
    width: frameFacts.width ?? frameFacts.renderTargetSize?.width ?? null,
    height: frameFacts.height ?? frameFacts.renderTargetSize?.height ?? null
  });
}

function buildHueShiftNode(colorNode, shiftNode) {
  const toYiq = mat3(
    0.299, 0.587, 0.114,
    0.596, -0.275, -0.321,
    0.212, -0.523, 0.311
  );
  const toRgb = mat3(
    1.0, 0.956, 0.621,
    1.0, -0.272, -0.647,
    1.0, -1.106, 1.703
  );
  const yiq = toYiq.mul(colorNode);
  const hue = atan(yiq.z, yiq.y).add(shiftNode);
  const chroma = sqrt(yiq.y.mul(yiq.y).add(yiq.z.mul(yiq.z)));
  const shifted = vec3(yiq.x, chroma.mul(cos(hue)), chroma.mul(sin(hue)));
  return clamp(toRgb.mul(shifted), 0, 1);
}

export function createTslPostProcessingOutputNode(inputTextureNode, controls, {
  vignetteMode = 'legacy'
} = {}) {
  return Fn(() => {
    const baseUv = uv();
    const center = baseUv.sub(vec2(0.5));
    const wave = sin(baseUv.y.mul(8).add(controls.uTime.mul(0.8)))
      .mul(cos(baseUv.x.mul(6.5).sub(controls.uTime.mul(0.7))));
    const sampleUv = baseUv.add(center.mul(wave).mul(controls.uDistortion).mul(0.012));
    const sampled = inputTextureNode.sample(sampleUv);
    const hueShifted = buildHueShiftNode(sampled.rgb, controls.uHueShift);
    const luma = dot(hueShifted, vec3(0.2126, 0.7152, 0.0722));
    const saturated = mix(vec3(luma), hueShifted, controls.uSaturation);
    const color = saturated.sub(0.5).mul(controls.uContrast).add(0.5).mul(controls.uExposureMul);
    const vignetteMask = smoothstep(0.95, 0.16, center.length().mul(float(1).add(controls.uVignette)));
    const vignette = vignetteMode === 'immersive'
      ? mix(1, vignetteMask, clamp(controls.uVignette, 0, 1))
      : vignetteMask;
    return vec4(color.mul(vignette), sampled.a);
  })();
}

export function createTslRenderPipeline({
  renderer,
  scene,
  camera,
  controls = createTslPostProcessingControls(),
  RenderPipelineClass = RenderPipeline,
  passFn = pass,
  outputNodeFactory = createTslPostProcessingOutputNode,
  vignetteMode = 'legacy'
} = {}) {
  if (!renderer) throw new Error('TSL post processing requires a renderer.');
  if (!scene || !camera) throw new Error('TSL post processing requires a scene and camera.');

  const scenePass = passFn(scene, camera);
  const scenePassColor = typeof scenePass.getTextureNode === 'function'
    ? scenePass.getTextureNode('output')
    : scenePass;
  const outputNode = outputNodeFactory(scenePassColor, controls, { vignetteMode });
  const renderPipeline = new RenderPipelineClass(renderer, outputNode);
  renderPipeline.outputColorTransform = true;

  return {
    mode: WEBGPU_TSL_OUTPUT_COLOR_TRANSFORM_MODE,
    controls,
    scenePass,
    outputNode,
    renderPipeline,
    render: () => renderPipeline.render(),
    dispose() {
      renderPipeline.dispose?.();
      scenePass.dispose?.();
    }
  };
}
