export function normalizeArtworkSlug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&[^;\s]+;/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildArtworkFullSlug(item = {}) {
  return normalizeArtworkSlug([
    item.id,
    item.artist,
    item.newsTitle
  ].filter(Boolean).join(' '));
}

export function resolveArtworkRouteSlug(item = {}) {
  return normalizeArtworkSlug(item.slug || item.id || buildArtworkFullSlug(item));
}

export function findManifestIndexByArtworkSlug(manifest, slug) {
  if (!manifest?.items?.length) return null;
  const target = normalizeArtworkSlug(slug);
  if (!target) return null;
  const index = manifest.items.findIndex((item) => (
    buildArtworkFullSlug(item) === target
    || normalizeArtworkSlug(item?.slug) === target
    || normalizeArtworkSlug(item?.id) === target
  ));
  return index >= 0 ? index : null;
}

const ARTWORK_ROUTE_PARAMS = Object.freeze([
  'slug',
  'index',
  'target',
  'type',
  'candidateId',
  'candidate',
  'fixtureId',
  'fixture',
  'partId',
  'part',
  'previewId',
  'preview'
]);

function readSearchParams(locationRef = {}) {
  return new URLSearchParams(String(locationRef.search || ''));
}

function readPathname(locationRef = {}) {
  return String(locationRef.pathname || '/') || '/';
}

function encodePathSegment(value) {
  return encodeURIComponent(String(value || '')).replace(/%2F/gi, '-');
}

function readRouteBasePath(locationRef = {}) {
  const pathname = readPathname(locationRef);
  const match = pathname.match(/^(.*?\/)?art\/[^/]+\/?$/);
  if (match) return match[1] || '/';
  if (pathname.endsWith('/')) return pathname;
  return pathname.replace(/[^/]*$/, '') || '/';
}

function readArtworkPathRouteSlug(locationRef = {}) {
  const match = readPathname(locationRef).match(/(?:^|\/)art\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function buildArtworkQueryRouteHref(item = {}, { locationRef = globalThis.location } = {}) {
  const slug = resolveArtworkRouteSlug(item);
  if (!slug) return null;

  const params = readSearchParams(locationRef);
  ARTWORK_ROUTE_PARAMS.forEach((name) => params.delete(name));
  params.set('slug', slug);

  const query = params.toString();
  const hash = String(locationRef?.hash || '');
  return `${readPathname(locationRef)}${query ? `?${query}` : ''}${hash}`;
}

export function buildArtworkShareRouteHref(item = {}, {
  locationRef = globalThis.location,
  includeSearch = true,
  includeHash = true
} = {}) {
  const slug = resolveArtworkRouteSlug(item);
  if (!slug) return null;

  const params = readSearchParams(locationRef);
  ARTWORK_ROUTE_PARAMS.forEach((name) => params.delete(name));
  const query = includeSearch ? params.toString() : '';
  const hash = includeHash ? String(locationRef?.hash || '') : '';
  const basePath = readRouteBasePath(locationRef).replace(/\/?$/, '/');
  return `${basePath}art/${encodePathSegment(slug)}/${query ? `?${query}` : ''}${hash}`;
}

export function readArtworkRouteFromLocation(locationRef = globalThis.location) {
  const params = readSearchParams(locationRef);
  const index = Number.parseInt(String(params.get('index') || ''), 10);
  return {
    slug: params.get('slug') || readArtworkPathRouteSlug(locationRef),
    index: Number.isFinite(index) && index >= 0 ? index : null
  };
}
