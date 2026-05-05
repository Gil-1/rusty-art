export const PUBLIC_ARCHIVE_STORAGE_ORDER = 'newest-first';
export const PUBLIC_ARCHIVE_PRESENTATION_ORDER = 'oldest-first';

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

export function normalizeManifestOrdering(manifest) {
  if (!manifest || !Array.isArray(manifest.items)) return manifest;
  const storageOrder = manifest.storageOrder || PUBLIC_ARCHIVE_STORAGE_ORDER;
  const presentationItems = storageOrder === PUBLIC_ARCHIVE_PRESENTATION_ORDER
    ? manifest.items.slice()
    : manifest.items.slice().reverse();
  return {
    ...manifest,
    storageOrder,
    presentationOrder: PUBLIC_ARCHIVE_PRESENTATION_ORDER,
    items: presentationItems
  };
}

export function resolveLatestPointer(latest = null, manifest = null) {
  const latestId = latest?.latestId || latest?.id || manifest?.latestId || null;
  const latestFile = latest?.latestFile || latest?.file || null;
  const activeLatestIndex = Array.isArray(manifest?.items)
    ? manifest.items.findIndex((item) => item?.id === latestId || (latestFile && item?.file === latestFile))
    : -1;

  return {
    latestId,
    latestFile,
    generatedAt: latest?.generatedAt || null,
    activeLatestIndex
  };
}

export function buildPublicArchiveReadModel({ manifest, latest = null, fallback = false, fallbackReason = null, diagnostics = [] } = {}) {
  const normalizedManifest = normalizeManifestOrdering(manifest);
  const latestPointer = resolveLatestPointer(latest, normalizedManifest);
  const effectiveLatestId = latestPointer.latestId || normalizedManifest?.latestId || null;
  const activeLatestIndex = latestPointer.activeLatestIndex >= 0
    ? latestPointer.activeLatestIndex
    : (Array.isArray(normalizedManifest?.items)
      ? normalizedManifest.items.findIndex((item) => item?.id === effectiveLatestId)
      : -1);

  return {
    manifest: normalizedManifest ? {
      ...normalizedManifest,
      latestId: effectiveLatestId || normalizedManifest.latestId,
      latestPointer,
      activeLatestIndex,
      diagnostics
    } : normalizedManifest,
    latestPointer,
    activeLatestIndex,
    fallback,
    fallbackReason,
    diagnostics
  };
}

export async function loadPublicArchiveManifest({ fetchJson, manifestPath = './data/manifest.json', latestPath = './data/latest.json' } = {}) {
  return loadPublicArchiveReadModel({ fetchJson, manifestPath, latestPath });
}

export async function loadPublicArchiveReadModel({ fetchJson, manifestPath = './data/manifest.json', latestPath = './data/latest.json' } = {}) {
  if (typeof fetchJson !== 'function') throw new Error('Public archive client requires a fetchJson function.');

  try {
    const data = await fetchJson(manifestPath);
    if (!Array.isArray(data?.items)) throw new Error('Manifest payload malformed');
    try {
      const latest = await fetchJson(latestPath);
      return buildPublicArchiveReadModel({ manifest: data, latest, fallback: false });
    } catch (latestError) {
      return buildPublicArchiveReadModel({
        manifest: data,
        latest: null,
        fallback: false,
        diagnostics: [`latest pointer unavailable (${latestError.message})`]
      });
    }
  } catch (manifestError) {
    try {
      const latest = await fetchJson(latestPath);
      if (!latest?.latestFile) throw new Error('latest.json missing latestFile');
      const art = await fetchJson(latest.latestFile);
      return buildPublicArchiveReadModel({
        manifest: normalizeManifestFromArtwork(art, latest.latestFile),
        latest,
        fallback: true,
        fallbackReason: `Archive manifest unavailable (${manifestError.message}). Showing latest piece only.`
      });
    } catch (latestError) {
      throw new Error(`Manifest failed (${manifestError.message}); latest fallback failed (${latestError.message})`);
    }
  }
}

export function createPublicArtworkFetcher({ fetchJson } = {}) {
  if (typeof fetchJson !== 'function') throw new Error('Public archive client requires a fetchJson function.');
  const artCache = new Map();

  return function fetchArtwork(file) {
    if (!artCache.has(file)) {
      const request = fetchJson(file).catch((error) => {
        artCache.delete(file);
        throw error;
      });
      artCache.set(file, request);
    }
    return artCache.get(file);
  };
}
