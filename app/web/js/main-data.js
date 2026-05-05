const FETCH_TIMEOUT_MS = 9000;

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

export async function fetchJsonWithTimeout(path, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);

  try {
    const response = await fetch(path, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request timed out for ${path}`);
    }
    throw new Error(`Cannot load ${path}: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
}

export async function loadManifestWithFallback() {
  return loadPublicArchiveManifest({ fetchJson: fetchJsonWithTimeout });
}

export function createArtworkFetcher() {
  return createPublicArtworkFetcher({ fetchJson: fetchJsonWithTimeout });
}
