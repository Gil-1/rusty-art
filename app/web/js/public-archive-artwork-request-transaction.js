function normalizeFiles(files = []) {
  return (Array.isArray(files) ? files : []).filter(Boolean);
}

function cloneFacts(facts, requestSession) {
  return {
    activeToken: facts.activeToken,
    activeFile: facts.activeFile,
    loadsStarted: facts.loadsStarted,
    loadsCompleted: facts.loadsCompleted,
    staleCancellations: facts.staleCancellations.slice(),
    staleResults: facts.staleResults.slice(),
    prefetches: facts.prefetches.slice(),
    requestSessionFacts: typeof requestSession?.getFacts === 'function' ? requestSession.getFacts() : null
  };
}

export function createArchiveArtworkRequestTransaction({
  fetchArtwork,
  requestSession = fetchArtwork?.requestSession || null
} = {}) {
  let localTokenCounter = 0;
  let activeLoad = null;
  const facts = {
    activeToken: null,
    activeFile: null,
    loadsStarted: 0,
    loadsCompleted: 0,
    staleCancellations: [],
    staleResults: [],
    prefetches: []
  };

  function cancelActiveLoad(reason = 'stale-artwork-load') {
    if (!activeLoad || activeLoad.completed) return false;

    const cancelled = {
      token: activeLoad.token,
      file: activeLoad.file,
      reason
    };
    facts.staleCancellations.push(cancelled);
    requestSession?.cancelActiveRequest?.(reason);
    activeLoad.completed = true;
    activeLoad = null;
    facts.activeToken = null;
    facts.activeFile = null;
    return true;
  }

  function beginLoad(file, { label = 'artwork-load', cancelStale = true } = {}) {
    if (cancelStale) cancelActiveLoad('stale-artwork-load');

    const requestScope = requestSession?.createRequestScope?.({
      cancelStale: false,
      label
    }) || null;
    const token = requestScope?.token ?? ++localTokenCounter;
    let completed = false;
    const load = {
      token,
      file,
      completed: false,
      requestScope
    };

    activeLoad = load;
    facts.activeToken = token;
    facts.activeFile = file;
    facts.loadsStarted += 1;

    function isStale() {
      if (completed || load.completed) return true;
      if (typeof requestScope?.isStale === 'function') return requestScope.isStale();
      return activeLoad !== load || token !== localTokenCounter;
    }

    function recordStaleResult(status = 'stale') {
      facts.staleResults.push({ token, file, status });
    }

    return {
      token,
      file,
      signal: requestScope?.signal || null,
      isCurrent: () => !isStale(),
      isStale,
      async fetch() {
        if (typeof fetchArtwork !== 'function') {
          throw new Error('Archive artwork request transaction requires a fetchArtwork function.');
        }
        return fetchArtwork(file, {
          signal: requestScope?.signal || null
        });
      },
      prefetchFiles(files = [], options = {}) {
        const scheduled = normalizeFiles(files);
        if (!scheduled.length) return scheduled;

        scheduled.forEach((prefetchFile) => {
          facts.prefetches.push({
            token,
            file: prefetchFile,
            status: 'scheduled'
          });
        });

        try {
          if (typeof fetchArtwork?.prefetch === 'function') {
            Promise.resolve(fetchArtwork.prefetch(scheduled, options)).catch(() => {});
          } else {
            scheduled.forEach((prefetchFile) => {
              Promise.resolve(fetchArtwork?.(prefetchFile, options)).catch(() => {});
            });
          }
        } catch {
          // Neighbor prefetch is advisory; active selection behavior must not depend on it.
        }

        return scheduled;
      },
      complete(status = 'completed') {
        if (!completed && !load.completed) {
          facts.loadsCompleted += 1;
          requestScope?.complete?.();
        }
        completed = true;
        load.completed = true;
        if (status && String(status).startsWith('stale')) {
          recordStaleResult(status);
        }
        if (activeLoad === load) {
          activeLoad = null;
          facts.activeToken = null;
          facts.activeFile = null;
        }
      },
      getFacts: () => cloneFacts(facts, requestSession)
    };
  }

  function isCurrent(token) {
    return Boolean(activeLoad && !activeLoad.completed && activeLoad.token === token);
  }

  return {
    beginLoad,
    cancelActiveLoad,
    invalidate: () => {
      cancelActiveLoad('invalidated');
      return ++localTokenCounter;
    },
    isCurrent,
    getFacts: () => cloneFacts(facts, requestSession)
  };
}
