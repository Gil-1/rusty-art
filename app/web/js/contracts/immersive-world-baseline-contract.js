export const NEUTRAL_WEBGPU_LIGHTING_MODE = 'neutral-webgpu';
export const NEUTRAL_WEBGPU_TONE_MAPPING = 'neutral';

export const NEUTRAL_WEBGPU_ENVIRONMENT = Object.freeze({
  color: '#73777d',
  fieldColor: '#73777d',
  fogDensity: 0
});

export const NEUTRAL_WEBGPU_LIGHTING = Object.freeze({
  mode: NEUTRAL_WEBGPU_LIGHTING_MODE,
  ambientColor: '#ffffff',
  ambientIntensity: 0.3,
  environmentIntensity: 1,
  keyColor: '#ffffff',
  keyIntensity: 3,
  keyPosition: Object.freeze([5, 8, 6]),
  keyTarget: Object.freeze([0, 0, -5]),
  rimColor: '#ffffff',
  rimIntensity: 0,
  rimPosition: Object.freeze([-5, 2, -4]),
  shadows: Object.freeze({
    enabled: true,
    mapSize: 2048,
    bounds: 18,
    near: 0.5,
    far: 80,
    bias: 0,
    normalBias: 0
  })
});

export const NEUTRAL_WEBGPU_OUTPUT_COLOR_TRANSFORM = Object.freeze({
  toneMapping: NEUTRAL_WEBGPU_TONE_MAPPING,
  contrast: 1,
  saturation: 1,
  exposure: 1,
  vignette: 0,
  hueShift: 0,
  distortion: 0
});

export function buildNeutralWebGPULighting(owner) {
  return {
    ...NEUTRAL_WEBGPU_LIGHTING,
    owner,
    keyPosition: [...NEUTRAL_WEBGPU_LIGHTING.keyPosition],
    keyTarget: [...NEUTRAL_WEBGPU_LIGHTING.keyTarget],
    rimPosition: [...NEUTRAL_WEBGPU_LIGHTING.rimPosition],
    shadows: { ...NEUTRAL_WEBGPU_LIGHTING.shadows }
  };
}

export function buildNeutralWebGPUOutputColorTransform(owner, mode = 'final-color-contrast-only') {
  return {
    ...NEUTRAL_WEBGPU_OUTPUT_COLOR_TRANSFORM,
    owner,
    mode
  };
}
