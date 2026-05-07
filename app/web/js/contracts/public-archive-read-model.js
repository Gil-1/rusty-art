export const PUBLIC_ARCHIVE_STORAGE_ORDER = 'newest-first';
export const PUBLIC_ARCHIVE_PRESENTATION_ORDER = 'oldest-first';

function cloneItems(items) {
  return Array.isArray(items) ? items.slice() : [];
}

function normalizeOrder(value, fallback) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === PUBLIC_ARCHIVE_PRESENTATION_ORDER) return PUBLIC_ARCHIVE_PRESENTATION_ORDER;
  if (normalized === PUBLIC_ARCHIVE_STORAGE_ORDER) return PUBLIC_ARCHIVE_STORAGE_ORDER;
  return fallback;
}

function nonEmptyString(value) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

function findManifestItemIndex(items, { latestId = null, latestFile = null } = {}) {
  return items.findIndex((item) => (
    (latestId && item?.id === latestId)
    || (latestFile && item?.file === latestFile)
  ));
}

function normalizeCandidateKey(candidate) {
  return candidate?.file || candidate?.id || `${candidate?.source || 'candidate'}:${candidate?.manifestIndex ?? 'none'}`;
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

export function normalizeManifestOrdering(manifest, {
  presentationOrder = PUBLIC_ARCHIVE_PRESENTATION_ORDER
} = {}) {
  if (!manifest || !Array.isArray(manifest.items)) return manifest;
  const storageOrder = normalizeOrder(manifest.storageOrder, PUBLIC_ARCHIVE_STORAGE_ORDER);
  const resolvedPresentationOrder = normalizeOrder(presentationOrder, PUBLIC_ARCHIVE_PRESENTATION_ORDER);
  const items = cloneItems(manifest.items);
  const presentationItems = storageOrder === resolvedPresentationOrder ? items : items.reverse();
  return {
    ...manifest,
    storageOrder,
    presentationOrder: resolvedPresentationOrder,
    items: presentationItems
  };
}

export function resolveLatestPointer(latest = null, manifest = null) {
  const latestId = nonEmptyString(latest?.latestId || latest?.id || manifest?.latestId);
  const latestFile = nonEmptyString(latest?.latestFile || latest?.file);
  const items = cloneItems(manifest?.items);
  const activeLatestIndex = findManifestItemIndex(items, { latestId, latestFile });

  return {
    latestId,
    latestFile,
    generatedAt: latest?.generatedAt || null,
    activeLatestIndex
  };
}

export function buildLatestArtworkCandidates({ manifest = null, latest = null } = {}) {
  const items = cloneItems(manifest?.items);
  const latestPointer = resolveLatestPointer(latest, manifest);
  const candidates = [];
  const diagnostics = [];
  const explicitLatestHasFacts = Boolean(
    nonEmptyString(latest?.latestId || latest?.id)
    || nonEmptyString(latest?.latestFile || latest?.file)
  );

  function pushCandidate(candidate) {
    const key = normalizeCandidateKey(candidate);
    if (candidates.some((entry) => normalizeCandidateKey(entry) === key)) return;
    candidates.push(candidate);
  }

  if (latestPointer.latestFile) {
    const manifestIndex = findManifestItemIndex(items, {
      latestId: latestPointer.latestId,
      latestFile: latestPointer.latestFile
    });
    pushCandidate({
      source: 'latest-file',
      id: latestPointer.latestId || items[manifestIndex]?.id || null,
      file: latestPointer.latestFile,
      manifestIndex,
      reason: 'latest-pointer-file'
    });
  }

  if (latestPointer.latestId) {
    const manifestIndex = findManifestItemIndex(items, { latestId: latestPointer.latestId });
    const item = manifestIndex >= 0 ? items[manifestIndex] : null;
    pushCandidate({
      source: 'latest-id',
      id: latestPointer.latestId,
      file: item?.file || null,
      manifestIndex,
      reason: item ? 'latest-pointer-id-manifest-match' : 'latest-pointer-id-default-file'
    });
  }

  if (items[0]) {
    pushCandidate({
      source: 'manifest-first',
      id: items[0]?.id || null,
      file: items[0]?.file || null,
      manifestIndex: 0,
      reason: 'manifest-storage-order-fallback'
    });
  }

  if (latest && !explicitLatestHasFacts) {
    diagnostics.push('latest pointer has no latestId or latestFile');
  }
  if (!candidates.length) {
    diagnostics.push('no latest artwork candidates available');
  }

  return {
    latestPointer,
    candidates,
    diagnostics
  };
}

/**
 * @param {any} options
 */
export function buildPublicArchiveReadModel({
  manifest,
  latest = null,
  fallback = false,
  fallbackReason = null,
  diagnostics = [],
  presentationOrder = PUBLIC_ARCHIVE_PRESENTATION_ORDER,
  latestArtwork = null
} = /** @type {any} */ ({})) {
  const normalizedManifest = normalizeManifestOrdering(manifest, { presentationOrder });
  const latestCandidatePlan = buildLatestArtworkCandidates({ manifest: normalizedManifest, latest });
  const latestPointer = latestCandidatePlan.latestPointer;
  const effectiveLatestId = latestPointer.latestId || normalizedManifest?.latestId || null;
  const activeLatestIndex = latestPointer.activeLatestIndex >= 0
    ? latestPointer.activeLatestIndex
    : (Array.isArray(normalizedManifest?.items)
      ? normalizedManifest.items.findIndex((item) => item?.id === effectiveLatestId)
      : -1);
  const allDiagnostics = [
    ...(Array.isArray(diagnostics) ? diagnostics : []),
    ...latestCandidatePlan.diagnostics
  ];

  return {
    manifest: normalizedManifest ? {
      ...normalizedManifest,
      latestId: effectiveLatestId || normalizedManifest.latestId,
      latestPointer,
      activeLatestIndex,
      diagnostics: allDiagnostics
    } : normalizedManifest,
    ordering: normalizedManifest ? {
      storageOrder: normalizedManifest.storageOrder,
      presentationOrder: normalizedManifest.presentationOrder
    } : null,
    latestPointer,
    latestArtworkCandidates: latestCandidatePlan.candidates,
    latestArtwork,
    activeLatestIndex,
    fallback,
    fallbackReason,
    diagnostics: allDiagnostics
  };
}
