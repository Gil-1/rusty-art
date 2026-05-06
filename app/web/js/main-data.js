import {
  createBrowserJsonRequestAdapter,
  DEFAULT_BROWSER_JSON_REQUEST_TIMEOUT_MS
} from './browser-json-request-adapter.js';

const FETCH_TIMEOUT_MS = DEFAULT_BROWSER_JSON_REQUEST_TIMEOUT_MS;
let defaultJsonRequestAdapter = null;

export {
  createBrowserJsonRequestAdapter,
  DEFAULT_BROWSER_JSON_REQUEST_TIMEOUT_MS
};

export {
  createPublicArtworkFetcher,
  loadPublicArchiveManifest,
  loadPublicArchiveReadModel,
  buildPublicArchiveReadModel,
  normalizeManifestFromArtwork,
  normalizeManifestOrdering
} from './public-archive-client.js';

import {
  createPublicArtworkFetcher,
  loadPublicArchiveManifest
} from './public-archive-client.js';

function getDefaultJsonRequestAdapter() {
  if (!defaultJsonRequestAdapter) {
    defaultJsonRequestAdapter = createBrowserJsonRequestAdapter({ timeoutMs: FETCH_TIMEOUT_MS });
  }
  return defaultJsonRequestAdapter;
}

export async function fetchJsonWithTimeout(path, timeoutMs = FETCH_TIMEOUT_MS) {
  return createBrowserJsonRequestAdapter({ timeoutMs }).fetchJson(path);
}

export async function loadManifestWithFallback({ requestAdapter = null, fetchJson = null, manifestPath, latestPath } = {}) {
  return loadPublicArchiveManifest({
    requestAdapter: requestAdapter || (fetchJson ? null : getDefaultJsonRequestAdapter()),
    fetchJson,
    manifestPath,
    latestPath
  });
}

export function createArtworkFetcher({ requestAdapter = null, fetchJson = null } = {}) {
  return createPublicArtworkFetcher({
    requestAdapter: requestAdapter || (fetchJson ? null : getDefaultJsonRequestAdapter()),
    fetchJson
  });
}
