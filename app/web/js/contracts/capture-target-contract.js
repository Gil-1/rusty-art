import { buildPublicArchiveReadModel } from './public-archive-read-model.js';

export const CAPTURE_TARGET_TYPES = Object.freeze({
  ARCHIVE_INDEX: 'archive-index',
  ARCHIVE_SLUG: 'archive-slug',
  CANDIDATE: 'candidate',
  FIXTURE: 'fixture',
  LATEST: 'latest'
});

function normalizeStoryView(value = 'story') {
  const normalized = String(value || '').trim();
  return normalized || 'story';
}

function normalizeArchiveIndex(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.trunc(numeric));
}

function normalizeOptionalArchiveIndex(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (numeric < 0) return null;
  return Math.trunc(numeric);
}

function parseOptionalIndex(value) {
  if (value == null) return null;
  return Number.parseInt(String(value), 10);
}

function normalizeArchiveFacts(facts = {}) {
  const source = /** @type {Record<string, any>} */ (facts && typeof facts === 'object' ? facts : {});
  const manifest = source.manifest && typeof source.manifest === 'object'
    ? /** @type {Record<string, any>} */ (source.manifest)
    : null;
  const activeLatestIndex = normalizeOptionalArchiveIndex(source.activeLatestIndex ?? manifest?.activeLatestIndex);
  if (manifest && activeLatestIndex != null) {
    return {
      manifest,
      activeLatestIndex,
      latestPointer: source.latestPointer || manifest.latestPointer || null,
      diagnostics: Array.isArray(source.diagnostics) ? source.diagnostics : []
    };
  }

  if (!manifest) {
    return {
      manifest: null,
      activeLatestIndex: null,
      latestPointer: source.latestPointer || null,
      diagnostics: ['archive manifest unavailable']
    };
  }

  return buildPublicArchiveReadModel(/** @type {any} */ ({
    manifest,
    latest: source.latest || null,
    diagnostics: Array.isArray(source.diagnostics) ? source.diagnostics : []
  }));
}

function resolveManifestItemByIndex(manifest, index) {
  if (index == null || !Array.isArray(manifest?.items)) return null;
  return manifest.items[index] || null;
}

export function normalizeCaptureTargetType(target = {}) {
  const source = /** @type {Record<string, any>} */ (target && typeof target === 'object' ? target : {});
  const raw = String(source.type || source.kind || '').trim().toLowerCase();
  if (raw === 'archive-slug' || raw === 'slug') return CAPTURE_TARGET_TYPES.ARCHIVE_SLUG;
  if (raw === 'candidate' || raw === 'unpublished-candidate') return CAPTURE_TARGET_TYPES.CANDIDATE;
  if (raw === 'fixture' || raw === 'public-archive-fixture') return CAPTURE_TARGET_TYPES.FIXTURE;
  if (raw === 'latest') return CAPTURE_TARGET_TYPES.LATEST;
  return CAPTURE_TARGET_TYPES.ARCHIVE_INDEX;
}

export function normalizeCaptureTarget(target = {}) {
  const source = /** @type {Record<string, any>} */ (target && typeof target === 'object' ? target : {});
  const type = normalizeCaptureTargetType(source);
  const view = normalizeStoryView(source.view);
  const baseParams = { capture: 1, view };

  if (type === CAPTURE_TARGET_TYPES.ARCHIVE_SLUG) {
    const slug = String(source.slug || source.value || '').trim();
    if (!slug) {
      throw new Error('Archive slug capture target requires a non-empty slug.');
    }
    return {
      type,
      view,
      slug,
      routeParams: { ...baseParams, slug },
      label: source.label || `archive-slug:${slug}`
    };
  }

  const index = normalizeArchiveIndex(source.index ?? source.value);
  if (type === CAPTURE_TARGET_TYPES.CANDIDATE) {
    return {
      type,
      view,
      index,
      candidateId: source.candidateId || source.id || null,
      routeParams: { ...baseParams, index },
      label: source.label || `candidate:${source.candidateId || source.id || index}`
    };
  }

  if (type === CAPTURE_TARGET_TYPES.FIXTURE) {
    return {
      type,
      view,
      index,
      fixtureId: source.fixtureId || source.id || null,
      routeParams: { ...baseParams, index },
      label: source.label || `fixture:${source.fixtureId || source.id || index}`
    };
  }

  if (type === CAPTURE_TARGET_TYPES.LATEST) {
    return {
      type,
      view,
      index: null,
      semanticTarget: CAPTURE_TARGET_TYPES.LATEST,
      unresolved: true,
      routeParams: { ...baseParams, target: CAPTURE_TARGET_TYPES.LATEST },
      label: source.label || 'latest'
    };
  }

  return {
    type: CAPTURE_TARGET_TYPES.ARCHIVE_INDEX,
    view,
    index,
    routeParams: { ...baseParams, index },
    label: source.label || `archive-index:${index}`
  };
}

export function resolveCaptureTargetAgainstArchiveFacts(target = {}, archiveFacts = {}) {
  const normalized = normalizeCaptureTarget(target);
  if (normalized.type !== CAPTURE_TARGET_TYPES.LATEST) return normalized;

  const readModel = normalizeArchiveFacts(archiveFacts);
  const resolvedIndex = normalizeOptionalArchiveIndex(readModel.activeLatestIndex);
  if (resolvedIndex == null) return normalized;

  const item = resolveManifestItemByIndex(readModel.manifest, resolvedIndex);
  return {
    ...normalized,
    index: resolvedIndex,
    resolvedIndex,
    unresolved: false,
    routeParams: {
      capture: 1,
      view: normalized.view,
      index: resolvedIndex
    },
    resolvedTarget: {
      type: CAPTURE_TARGET_TYPES.ARCHIVE_INDEX,
      index: resolvedIndex,
      id: item?.id || readModel.latestPointer?.latestId || null,
      file: item?.file || readModel.latestPointer?.latestFile || null,
      source: 'public-archive-read-model'
    }
  };
}

/**
 * @param {string|URLSearchParams|{search?: string}} input
 */
export function resolveCaptureTargetFromSearchParams(input = '') {
  const params = input instanceof URLSearchParams
    ? input
    : new URLSearchParams(typeof input === 'string' ? input : input?.search || '');
  const slug = params.get('slug');
  const indexParam = params.get('index');
  const mode = params.get('target') || params.get('type') || (slug ? 'archive-slug' : indexParam == null ? 'latest' : 'archive-index');
  const requestedIndex = parseOptionalIndex(indexParam);
  const target = normalizeCaptureTarget({
    type: mode,
    view: params.get('view'),
    index: requestedIndex,
    slug,
    candidateId: params.get('candidateId') || params.get('candidate') || null,
    fixtureId: params.get('fixtureId') || params.get('fixture') || null
  });

  return {
    captureMode: params.get('capture') === '1',
    forcedView: params.get('view'),
    requestedIndex: target.type === CAPTURE_TARGET_TYPES.LATEST ? null : requestedIndex,
    requestedArtworkSlug: slug,
    target
  };
}
