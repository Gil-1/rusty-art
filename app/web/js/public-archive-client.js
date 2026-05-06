import { createPublicArchiveRequestSession } from './public-archive-request-session.js';

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

function resolveRequestSession({ requestSession, fetchJson, requestAdapter } = {}) {
  if (requestSession && typeof requestSession.requestJson === 'function') return requestSession;
  return createPublicArchiveRequestSession({ fetchJson, requestAdapter });
}

function createRequestScope(session, { cancelStale = false, label = 'archive-read-model' } = {}) {
  if (typeof session.createRequestScope === 'function') {
    return session.createRequestScope({ cancelStale, label });
  }
  return {
    requestJson: session.requestJson.bind(session),
    complete: () => {}
  };
}

function withRequestSessionFacts(readModel, session) {
  return {
    ...readModel,
    requestSessionFacts: typeof session.getFacts === 'function' ? session.getFacts() : null
  };
}

export async function loadPublicArchiveManifest({
  fetchJson,
  requestAdapter,
  requestSession,
  manifestPath = './data/manifest.json',
  latestPath = './data/latest.json',
  cancelStale = false
} = {}) {
  return loadPublicArchiveReadModel({ fetchJson, requestAdapter, requestSession, manifestPath, latestPath, cancelStale });
}

export async function loadPublicArchiveReadModel({
  fetchJson,
  requestAdapter,
  requestSession,
  manifestPath = './data/manifest.json',
  latestPath = './data/latest.json',
  cancelStale = false
} = {}) {
  const session = resolveRequestSession({ requestSession, fetchJson, requestAdapter });
  const scope = createRequestScope(session, { cancelStale, label: 'archive-read-model' });
  const requestJson = scope.requestJson;
  let scopeCompleted = false;

  function finishReadModel(readModel) {
    if (!scopeCompleted) {
      scope.complete();
      scopeCompleted = true;
    }
    return withRequestSessionFacts(readModel, session);
  }

  try {
    const data = await requestJson(manifestPath);
    if (!Array.isArray(data?.items)) throw new Error('Manifest payload malformed');
    try {
      const latest = await requestJson(latestPath);
      return finishReadModel(buildPublicArchiveReadModel({ manifest: data, latest, fallback: false }));
    } catch (latestError) {
      session.recordFallbackFact?.({
        type: 'latest-pointer',
        status: 'unavailable',
        reason: latestError.message
      });
      return finishReadModel(buildPublicArchiveReadModel({
        manifest: data,
        latest: null,
        fallback: false,
        diagnostics: [`latest pointer unavailable (${latestError.message})`]
      }));
    }
  } catch (manifestError) {
    try {
      const latest = await requestJson(latestPath);
      if (!latest?.latestFile) throw new Error('latest.json missing latestFile');
      const art = await requestJson(latest.latestFile);
      session.recordFallbackFact?.({
        type: 'manifest-to-latest-artwork',
        status: 'loaded',
        file: latest.latestFile,
        reason: manifestError.message
      });
      return finishReadModel(buildPublicArchiveReadModel({
        manifest: normalizeManifestFromArtwork(art, latest.latestFile),
        latest,
        fallback: true,
        fallbackReason: `Archive manifest unavailable (${manifestError.message}). Showing latest piece only.`
      }));
    } catch (latestError) {
      session.recordFallbackFact?.({
        type: 'manifest-to-latest-artwork',
        status: 'failed',
        reason: manifestError.message,
        error: latestError.message
      });
      if (!scopeCompleted) {
        scope.complete();
        scopeCompleted = true;
      }
      throw new Error(`Manifest failed (${manifestError.message}); latest fallback failed (${latestError.message})`);
    }
  } finally {
    if (!scopeCompleted) scope.complete();
  }
}

export function createPublicArtworkFetcher({ fetchJson, requestAdapter, requestSession } = {}) {
  const session = resolveRequestSession({ requestSession, fetchJson, requestAdapter });
  const fetchArtwork = function fetchArtwork(file, options = {}) {
    if (typeof session.fetchArtwork === 'function') return session.fetchArtwork(file, options);
    return session.requestJson(file, options);
  };

  fetchArtwork.prefetch = (files, options = {}) => {
    if (typeof session.prefetchArtworkFiles === 'function') return session.prefetchArtworkFiles(files, options);
    return Promise.all((Array.isArray(files) ? files : []).map((file) => fetchArtwork(file, options).catch((error) => ({
      status: 'failed',
      file,
      error
    }))));
  };
  fetchArtwork.requestSession = session;
  fetchArtwork.getRequestSessionFacts = () => (typeof session.getFacts === 'function' ? session.getFacts() : null);

  return fetchArtwork;
}

export { createPublicArchiveRequestSession };
