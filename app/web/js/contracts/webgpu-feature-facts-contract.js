const DEFAULT_FEATURE_FACT_FIELD_LIMITS = Object.freeze({
  kind: 80,
  id: 120,
  family: 120,
  api: 160,
  factory: 120,
  material: 120,
  surface: 160,
  reason: 160
});

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value, maxLen = null) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return Number.isFinite(Number(maxLen)) && Number(maxLen) > 0
    ? text.slice(0, Number(maxLen))
    : text;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined && entry !== '')
  );
}

export function normalizeWebGPUFeatureFact(entry = null, {
  defaultReason = null,
  fieldLimits = DEFAULT_FEATURE_FACT_FIELD_LIMITS
} = {}) {
  if (!isObject(entry)) return null;
  const limits = isObject(fieldLimits) ? fieldLimits : DEFAULT_FEATURE_FACT_FIELD_LIMITS;
  const fact = compactObject({
    kind: normalizeText(
      entry.kind || (entry.helperId || entry.api ? 'webgpu-native-helper' : entry.factoryId || entry.materialFactoryId ? 'material-factory' : null),
      limits.kind
    ),
    id: normalizeText(entry.id || entry.helperId || entry.factoryId || entry.materialFactoryId, limits.id),
    family: normalizeText(entry.family || entry.featureFamily || entry.factoryCategory, limits.family),
    api: normalizeText(entry.api, limits.api),
    factory: normalizeText(entry.factory || entry.factoryId || entry.materialFactoryId, limits.factory),
    material: normalizeText(entry.material || entry.materialType, limits.material),
    surface: normalizeText(entry.surface || entry.runtimeSurface || entry.webgpuSafeSurface, limits.surface),
    reason: normalizeText(entry.reason || defaultReason, limits.reason)
  });
  return Object.keys(fact).length ? fact : null;
}

export function normalizeWebGPUFeatureFacts(entries = [], {
  limit = 24,
  defaultReason = null,
  fieldLimits = DEFAULT_FEATURE_FACT_FIELD_LIMITS
} = {}) {
  const source = Array.isArray(entries) ? entries : [];
  const max = Math.max(0, Math.floor(Number(limit) || 0));
  const seen = new Set();
  const out = [];
  for (const entry of source) {
    const fact = normalizeWebGPUFeatureFact(entry, { defaultReason, fieldLimits });
    if (!fact) continue;
    const key = JSON.stringify(fact);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(fact);
    if (max > 0 && out.length >= max) break;
  }
  return out;
}
