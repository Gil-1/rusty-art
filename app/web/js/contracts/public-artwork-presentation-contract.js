function pathValue(source, pathParts) {
  return pathParts.reduce((current, part) => current?.[part], source);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export const PUBLIC_ARTWORK_PRESENTATION_SECTIONS = Object.freeze(['hero', 'meta']);
export const PUBLIC_ARTWORK_HERO_FACT_FIELDS = Object.freeze([
  'title',
  'artist',
  'date',
  'headline',
  'source',
  'subtitle'
]);
export const PUBLIC_ARTWORK_META_FACT_FIELDS = Object.freeze([
  'title',
  'date',
  'artist',
  'news',
  'links',
  'rationale',
  'quality'
]);
export const PUBLIC_ARTWORK_PRESENTATION_REQUIRED_PAYLOAD_PATHS = Object.freeze([
  Object.freeze(['date']),
  Object.freeze(['title']),
  Object.freeze(['news', 'title']),
  Object.freeze(['news', 'source']),
  Object.freeze(['inspiration', 'artist'])
]);

function addMissingFactError(errors, section, field) {
  errors.push({
    code: 'presentation-fact-missing',
    path: [section, field],
    message: `${section}.${field} must be present for public artwork presentation`
  });
}

export function validatePublicArtworkPresentationFacts(facts = {}) {
  const errors = [];
  if (!isObject(facts)) {
    return {
      pass: false,
      errors: [{
        code: 'presentation-facts-malformed',
        path: [],
        message: 'public artwork presentation facts must be an object'
      }]
    };
  }

  for (const field of PUBLIC_ARTWORK_HERO_FACT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(isObject(facts.hero) ? facts.hero : {}, field)) {
      addMissingFactError(errors, 'hero', field);
    }
  }
  for (const field of PUBLIC_ARTWORK_META_FACT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(isObject(facts.meta) ? facts.meta : {}, field)) {
      addMissingFactError(errors, 'meta', field);
    }
  }

  return { pass: errors.length === 0, errors };
}

export function validatePublicArtworkPresentationPayload(payload = {}) {
  const errors = [];
  for (const pathParts of PUBLIC_ARTWORK_PRESENTATION_REQUIRED_PAYLOAD_PATHS) {
    if (!hasText(pathValue(payload, pathParts))) {
      errors.push({
        code: 'presentation-source-field-missing',
        path: pathParts,
        message: `${pathParts.join('.')} must be a non-empty string for public artwork presentation`
      });
    }
  }
  return { pass: errors.length === 0, errors };
}
