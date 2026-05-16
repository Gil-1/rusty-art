export const RENDERER_MODES = Object.freeze({
  WEBGL_LEGACY: 'webgl-legacy',
  WEBGPU: 'webgpu',
  WEBGPU_WEBGL2_BACKEND: 'webgpu-webgl2-backend'
});

export const POST_PROCESSING_MODES = Object.freeze({
  WEBGL_GLSL_POST: 'webgl-glsl-post',
  WEBGPU_TSL_POST: 'webgpu-tsl-post'
});

const WEBGPU_REQUEST_ALIASES = new Set(['webgpu', 'gpu']);
const WEBGPU_WEBGL2_REQUEST_ALIASES = new Set([
  'webgpu-webgl2',
  'webgpu-webgl2-backend',
  'webgpu-force-webgl',
  'webgpu-force-webgl2',
  'webgpu-forced-webgl2',
  'webgl2-backend'
]);
const WEBGL_LEGACY_REQUEST_ALIASES = new Set([
  '',
  'auto',
  'default',
  'legacy',
  'webgl',
  'webgl-legacy'
]);

export function normalizeRendererModeRequest(value = null) {
  const raw = String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
  if (WEBGPU_REQUEST_ALIASES.has(raw)) return RENDERER_MODES.WEBGPU;
  if (WEBGPU_WEBGL2_REQUEST_ALIASES.has(raw)) return RENDERER_MODES.WEBGPU_WEBGL2_BACKEND;
  if (WEBGL_LEGACY_REQUEST_ALIASES.has(raw)) return RENDERER_MODES.WEBGL_LEGACY;
  return RENDERER_MODES.WEBGL_LEGACY;
}

export function resolveRendererRequestFromSearchParams(input = '') {
  const params = input instanceof URLSearchParams
    ? input
    : new URLSearchParams(typeof input === 'string' ? input : input?.search || '');
  const explicit = params.get('renderer') || params.get('rendererMode') || params.get('renderBackend');
  if (explicit != null) return normalizeRendererModeRequest(explicit);
  const webgpu = params.get('webgpu');
  if (webgpu === '1' || webgpu === 'true') return RENDERER_MODES.WEBGPU;
  if (webgpu === 'webgl2' || webgpu === 'force-webgl2') return RENDERER_MODES.WEBGPU_WEBGL2_BACKEND;
  return RENDERER_MODES.WEBGL_LEGACY;
}

export function normalizePostProcessingModeRequest(value = null) {
  const raw = String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
  if (raw === 'tsl' || raw === 'webgpu-tsl' || raw === POST_PROCESSING_MODES.WEBGPU_TSL_POST) {
    return POST_PROCESSING_MODES.WEBGPU_TSL_POST;
  }
  return POST_PROCESSING_MODES.WEBGL_GLSL_POST;
}

export function resolvePostProcessingRequestFromSearchParams(input = '') {
  const params = input instanceof URLSearchParams
    ? input
    : new URLSearchParams(typeof input === 'string' ? input : input?.search || '');
  return normalizePostProcessingModeRequest(
    params.get('post')
      || params.get('postProcessing')
      || params.get('outputColorTransform')
  );
}
