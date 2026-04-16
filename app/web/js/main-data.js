const FETCH_TIMEOUT_MS = 9000;

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

export function normalizeManifestFromArtwork(art, file) {
  return {
    version: 1,
    generatedAt: art?.generatedAt || new Date().toISOString(),
    latestId: art?.id || 'latest',
    total: 1,
    items: [
      {
        id: art?.id || 'latest',
        date: art?.date || 'Unknown date',
        title: art?.title || 'Untitled piece',
        artist: art?.inspiration?.artist || 'Unknown artist',
        newsTitle: art?.news?.title || 'headline unavailable',
        source: art?.news?.source || 'unknown',
        file
      }
    ]
  };
}

export async function loadManifestWithFallback() {
  try {
    const data = await fetchJsonWithTimeout('./data/manifest.json');
    if (!Array.isArray(data?.items)) throw new Error('Manifest payload malformed');
    return { manifest: data, fallback: false };
  } catch (manifestError) {
    try {
      const latest = await fetchJsonWithTimeout('./data/latest.json');
      if (!latest?.latestFile) throw new Error('latest.json missing latestFile');
      const art = await fetchJsonWithTimeout(latest.latestFile);
      return {
        manifest: normalizeManifestFromArtwork(art, latest.latestFile),
        fallback: true,
        fallbackReason: `Archive manifest unavailable (${manifestError.message}). Showing latest piece only.`
      };
    } catch (latestError) {
      throw new Error(`Manifest failed (${manifestError.message}); latest fallback failed (${latestError.message})`);
    }
  }
}

export function createArtworkFetcher() {
  const artCache = new Map();

  function fetchArtwork(file) {
    if (!artCache.has(file)) {
      const request = fetchJsonWithTimeout(file).catch((error) => {
        artCache.delete(file);
        throw error;
      });
      artCache.set(file, request);
    }
    return artCache.get(file);
  }

  return fetchArtwork;
}
