export function clamp(value, min, max, fallback = min) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

export function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

export function isFullscreenPlaneDsl(dsl = {}) {
  const plane = String(dsl.plane || dsl.primitive || '').trim().toLowerCase();
  return plane === 'fullscreen' || plane === 'full-screen';
}

/** @param {any} options */
export function resolveDepthWrite({ params = {}, dsl = {}, isTransparent = true } = {}) {
  return toBoolean(params.depthWrite, toBoolean(dsl.depthWrite, !isTransparent));
}

/** @param {any} options */
export function resolveDepthTest({ params = {}, dsl = {}, isFullscreenPlane = false } = {}) {
  return toBoolean(params.depthTest, toBoolean(dsl.depthTest, !isFullscreenPlane));
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
export function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function asText(value, _maxLen = 128) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  return normalized;
}
