import * as THREE from 'three';
import { POST_FRAGMENT, POST_VERTEX } from './scene-shaders.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export const MAX_RENDER_PIXEL_RATIO = 2.25;
export const PREFERRED_RENDER_TARGET_SAMPLES = 4;

export function resolveRendererPixelRatio(devicePixelRatio = 1) {
  const ratio = Number(devicePixelRatio);
  return clamp(Number.isFinite(ratio) && ratio > 0 ? ratio : 1, 1, MAX_RENDER_PIXEL_RATIO);
}

export function resolveRenderTargetSamples(maxSamples = 0, preferredSamples = PREFERRED_RENDER_TARGET_SAMPLES) {
  const max = Math.max(0, Math.floor(Number(maxSamples) || 0));
  const preferred = Math.max(0, Math.floor(Number(preferredSamples) || 0));
  return Math.min(max, preferred);
}

export function resolveRenderTargetSize(width, height, pixelRatio = 1) {
  const ratio = resolveRendererPixelRatio(pixelRatio);
  return {
    width: Math.max(1, Math.round((Number(width) || 1) * ratio)),
    height: Math.max(1, Math.round((Number(height) || 1) * ratio))
  };
}

const ELEMENT_LAYER_RENDER_ORDER = {
  background: 0,
  backdrop: 0,
  atmosphere: 0,
  midground: 1,
  middle: 1,
  foreground: 2,
  accent: 3,
  overlay: 4
};

export function resolveElementRenderOrder(element = {}, index = 0) {
  const layer = String(element?.layer || element?.params?.layer || '').trim().toLowerCase();
  const rank = Object.prototype.hasOwnProperty.call(ELEMENT_LAYER_RENDER_ORDER, layer)
    ? ELEMENT_LAYER_RENDER_ORDER[layer]
    : 1;
  return rank * 1000 + Math.max(0, Number(index) || 0);
}

export function applyElementRenderOrder(obj, element = {}, index = 0) {
  if (!obj) return null;
  const renderOrder = resolveElementRenderOrder(element, index);
  obj.renderOrder = renderOrder;
  if (typeof obj.traverse === 'function') {
    obj.traverse((child) => {
      child.renderOrder = renderOrder;
    });
  }
  return renderOrder;
}

export function createArtworkRenderer(canvas, devicePixelRatio = 1) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(resolveRendererPixelRatio(devicePixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  return renderer;
}

export function createPostRenderTarget(renderer) {
  const samples = resolveRenderTargetSamples(renderer?.capabilities?.maxSamples);
  const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: true,
    stencilBuffer: false,
    samples
  });
  return { renderTarget, samples };
}

export function createPostPass(renderTarget, {
  vertexShader = POST_VERTEX,
  fragmentShader = POST_FRAGMENT,
  toneMapped = null
} = {}) {
  const postScene = new THREE.Scene();
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postUniforms = {
    uTexture: { value: renderTarget.texture },
    uTime: { value: 0 },
    uContrast: { value: 1.08 },
    uSaturation: { value: 1.04 },
    uVignette: { value: 0.26 },
    uDistortion: { value: 0.24 },
    uHueShift: { value: 0 },
    uExposureMul: { value: 1 },
    uResolution: { value: new THREE.Vector2(1, 1) }
  };

  const postQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: postUniforms,
      vertexShader,
      fragmentShader,
      depthWrite: false,
      depthTest: false
    })
  );
  if (toneMapped !== null) postQuad.material.toneMapped = Boolean(toneMapped);
  postScene.add(postQuad);

  return { postScene, postCamera, postUniforms, postQuad };
}

export function resizeSceneRenderTargets({ canvas, renderer, renderTarget, postUniforms, camera }) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width || canvas.clientWidth || 1));
  const height = Math.max(1, Math.round(rect.height || canvas.clientHeight || 1));
  const renderTargetSize = resolveRenderTargetSize(width, height, renderer.getPixelRatio());

  renderer.setSize(width, height, false);
  renderTarget.setSize(renderTargetSize.width, renderTargetSize.height);
  postUniforms.uResolution.value.set(renderTargetSize.width, renderTargetSize.height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  return { width, height, renderTargetSize };
}
