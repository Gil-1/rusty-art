export const DEFAULT_PUBLIC_ARCHIVE_PREFETCH_BUDGET = 2;

function resolveFetchJson({ fetchJson, requestAdapter } = {}) {
  if (typeof fetchJson === 'function') return fetchJson;
  if (typeof requestAdapter?.fetchJson === 'function') return requestAdapter.fetchJson.bind(requestAdapter);
  if (typeof requestAdapter?.requestJson === 'function') return requestAdapter.requestJson.bind(requestAdapter);
  throw new Error('Public archive client requires a fetchJson function or request adapter.');
}

function formatErrorMessage(error) {
  if (!error) return 'unknown error';
  return error.message || String(error);
}

function normalizePrefetchBudget(prefetchBudget) {
  const normalized = Number(prefetchBudget);
  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error('Public archive request session requires a non-negative prefetchBudget value.');
  }
  return Math.floor(normalized);
}

function abortController(controller, reason) {
  try {
    controller.abort(reason);
  } catch {
    controller.abort();
  }
}

function createAbortController(AbortControllerImpl) {
  return typeof AbortControllerImpl === 'function' ? new AbortControllerImpl() : null;
}

function cloneFacts(facts, artworkCache, activeScope) {
  return {
    requestsStarted: facts.requestsStarted,
    requestsCompleted: facts.requestsCompleted,
    activeToken: activeScope && !activeScope.completed ? activeScope.token : null,
    staleCancellations: facts.staleCancellations.slice(),
    fallbackLoads: facts.fallbackLoads.slice(),
    prefetches: facts.prefetches.slice(),
    artworkCache: {
      keys: [...artworkCache.keys()],
      hits: facts.artworkCacheHits,
      misses: facts.artworkCacheMisses
    }
  };
}

export function createPublicArchiveRequestSession({
  fetchJson,
  requestAdapter,
  AbortControllerImpl = globalThis?.AbortController,
  prefetchBudget = DEFAULT_PUBLIC_ARCHIVE_PREFETCH_BUDGET
} = {}) {
  const requestJson = resolveFetchJson({ fetchJson, requestAdapter });
  const maxPrefetches = normalizePrefetchBudget(prefetchBudget);
  const artworkCache = new Map();
  const facts = {
    requestsStarted: 0,
    requestsCompleted: 0,
    staleCancellations: [],
    fallbackLoads: [],
    prefetches: [],
    artworkCacheHits: 0,
    artworkCacheMisses: 0
  };

  let tokenCounter = 0;
  let activeScope = null;
  let activePrefetches = 0;

  function recordFallbackFact(fact = {}) {
    facts.fallbackLoads.push({
      type: fact.type || 'fallback',
      status: fact.status || 'recorded',
      file: fact.file || null,
      reason: fact.reason || null,
      error: fact.error || null
    });
  }

  function cancelActiveRequest(reason = 'stale-request') {
    const scope = activeScope;
    if (!scope || scope.completed) return false;

    let aborted = false;
    if (scope.controller && !scope.controller.signal?.aborted) {
      abortController(scope.controller, new Error(reason));
      aborted = true;
    }

    scope.completed = true;
    facts.staleCancellations.push({
      token: scope.token,
      label: scope.label,
      reason,
      aborted
    });
    activeScope = null;
    return true;
  }

  function requestJsonWithOptions(path, options = {}) {
    return requestJson(path, options);
  }

  function createRequestScope({ cancelStale = false, label = 'archive-request' } = {}) {
    if (cancelStale) cancelActiveRequest('stale-request');

    const controller = createAbortController(AbortControllerImpl);
    const scope = {
      token: ++tokenCounter,
      label,
      controller,
      completed: false
    };
    activeScope = scope;
    facts.requestsStarted += 1;

    return {
      token: scope.token,
      signal: controller?.signal || null,
      isStale: () => scope.token !== tokenCounter,
      requestJson: (path, options = {}) => requestJsonWithOptions(path, {
        ...options,
        signal: options.signal || controller?.signal || null
      }),
      complete: () => {
        if (!scope.completed) facts.requestsCompleted += 1;
        scope.completed = true;
        if (activeScope === scope) activeScope = null;
      }
    };
  }

  function fetchArtwork(file, options = {}) {
    if (!file) return Promise.reject(new Error('Public archive artwork file is required.'));
    if (artworkCache.has(file)) {
      facts.artworkCacheHits += 1;
      return artworkCache.get(file);
    }

    facts.artworkCacheMisses += 1;
    const request = Promise.resolve(requestJsonWithOptions(file, options)).catch((error) => {
      artworkCache.delete(file);
      throw error;
    });
    artworkCache.set(file, request);
    return request;
  }

  async function prefetchArtwork(file, options = {}) {
    if (!file) {
      return { status: 'skipped', file: null, reason: 'missing-file' };
    }
    if (activePrefetches >= maxPrefetches) {
      const skipped = { file, status: 'skipped', reason: 'prefetch-budget-exhausted' };
      facts.prefetches.push(skipped);
      return skipped;
    }

    const prefetchFact = { file, status: 'pending', error: null };
    facts.prefetches.push(prefetchFact);
    activePrefetches += 1;

    try {
      await fetchArtwork(file, options);
      prefetchFact.status = 'loaded';
      return { status: 'loaded', file };
    } catch (error) {
      prefetchFact.status = 'failed';
      prefetchFact.error = formatErrorMessage(error);
      return { status: 'failed', file, error };
    } finally {
      activePrefetches -= 1;
    }
  }

  function prefetchArtworkFiles(files = [], options = {}) {
    return Promise.all((Array.isArray(files) ? files : []).map((file) => prefetchArtwork(file, options)));
  }

  function getFacts() {
    return cloneFacts(facts, artworkCache, activeScope);
  }

  return {
    createRequestScope,
    cancelActiveRequest,
    requestJson: requestJsonWithOptions,
    fetchArtwork,
    prefetchArtwork,
    prefetchArtworkFiles,
    recordFallbackFact,
    getFacts
  };
}
