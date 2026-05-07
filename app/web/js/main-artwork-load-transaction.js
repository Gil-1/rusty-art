import {
  findActiveIndex,
  getNeighborFiles
} from './main-navigation.js';
import { setActiveArtworkState } from './main-presentation-state.js';
import { createArchiveArtworkRequestTransaction } from './public-archive-artwork-request-transaction.js';

export function planLoadedArtworkEffects({
  file,
  art,
  manifest,
  activeIndex = findActiveIndex(manifest, file),
  lumaEstimate = null,
  hasScene = false,
  captureMode = false,
  getNeighborFilesFn = getNeighborFiles
} = {}) {
  const { prevFile, nextFile } = getNeighborFilesFn(manifest, activeIndex);

  return {
    file,
    art,
    activeIndex,
    lumaEstimate,
    captureUpdate: {
      artworkLoaded: true,
      artworkId: art?.id || null,
      renderReady: false
    },
    shouldApplyScene: Boolean(hasScene),
    shouldRequestDeferredSceneBoot: !hasScene && !captureMode,
    neighborFiles: [prevFile, nextFile].filter(Boolean),
    clearFallback: true,
    refreshActiveArchiveItem: file,
    syncQuickControls: true,
    requestAdaptiveOverlayFrame: true
  };
}

export function prefetchArtworkFiles(files = [], fetchArtwork, requestScope = null) {
  const scheduled = files.filter(Boolean);
  if (requestScope && typeof requestScope.prefetchFiles === 'function') {
    return requestScope.prefetchFiles(scheduled);
  }

  try {
    if (typeof fetchArtwork?.prefetch === 'function') {
      Promise.resolve(fetchArtwork.prefetch(scheduled)).catch(() => {});
      return scheduled;
    }
  } catch {
    return scheduled;
  }

  scheduled.forEach((file) => {
    try {
      Promise.resolve(fetchArtwork?.(file)).catch(() => {});
    } catch {
      // Neighbor prefetch is best-effort and must not affect the active load.
    }
  });

  return scheduled;
}

export function createArtworkLoadTransaction({
  captureMode = false,
  fetchArtwork,
  runtimeController,
  captureStateController,
  getPresentationState = () => ({}),
  setPresentationState = () => {},
  getActiveIndex = () => -1,
  estimateArtworkLuma = () => null,
  requestTransaction = null,
  render = {}
} = {}) {
  const artworkRequestTransaction = requestTransaction || createArchiveArtworkRequestTransaction({ fetchArtwork });

  function getState() {
    return getPresentationState() || {};
  }

  function updateState(updater) {
    const nextState = typeof updater === 'function' ? updater(getState()) : updater;
    setPresentationState(nextState);
    return nextState;
  }

  function invalidate() {
    return artworkRequestTransaction.invalidate();
  }

  function isCurrent(token) {
    return artworkRequestTransaction.isCurrent(token);
  }

  async function loadByFile(file, { manifest } = {}) {
    if (!file) return { status: 'missing-file' };

    const requestScope = artworkRequestTransaction.beginLoad(file, {
      label: 'active-artwork-load',
      cancelStale: true
    });
    render.setLoading?.(true, manifest, getActiveIndex());
    let finalStatus = null;

    try {
      const art = await requestScope.fetch();
      if (requestScope.isStale()) {
        finalStatus = 'stale';
        return { status: 'stale', requestFacts: requestScope.getFacts() };
      }

      const effectPlan = planLoadedArtworkEffects({
        file,
        art,
        manifest,
        lumaEstimate: estimateArtworkLuma(art),
        hasScene: Boolean(runtimeController?.getScene?.()),
        captureMode
      });

      render.setCurrentArtworkLumaEstimate?.(effectPlan.lumaEstimate, art);
      captureStateController?.update?.(effectPlan.captureUpdate);

      if (effectPlan.shouldApplyScene) {
        const applied = await runtimeController.applyArtworkToScene({
          file,
          art,
          shouldContinue: () => requestScope.isCurrent(),
          waitForRenderedFrame: captureMode
        });
        if (!applied) {
          finalStatus = requestScope.isCurrent() ? 'not-applied' : 'stale';
          return { status: finalStatus, requestFacts: requestScope.getFacts() };
        }
      }

      if (requestScope.isStale()) {
        finalStatus = 'stale';
        return { status: 'stale', requestFacts: requestScope.getFacts() };
      }

      render.renderMeta?.(art);
      render.updateHeroNow?.(art);

      updateState((state) => setActiveArtworkState(state, {
        file,
        index: effectPlan.activeIndex
      }));

      if (effectPlan.shouldRequestDeferredSceneBoot) {
        runtimeController?.requestDeferredSceneBoot?.();
      }

      prefetchArtworkFiles(effectPlan.neighborFiles, fetchArtwork, requestScope);
      if (effectPlan.clearFallback) render.showFallback?.('', true);
      render.refreshActiveArchiveItem?.(effectPlan.refreshActiveArchiveItem);
      if (effectPlan.syncQuickControls) {
        render.syncQuickControls?.(manifest, effectPlan.activeIndex);
      }
      if (effectPlan.requestAdaptiveOverlayFrame) {
        render.requestAdaptiveOverlayFrame?.();
      }

      finalStatus = 'loaded';
      return {
        status: 'loaded',
        file,
        art,
        activeIndex: effectPlan.activeIndex,
        effectPlan,
        requestFacts: requestScope.getFacts()
      };
    } catch (error) {
      if (requestScope.isStale()) {
        finalStatus = 'stale-error';
        return { status: 'stale-error', error, requestFacts: requestScope.getFacts() };
      }
      render.showFallback?.(`Could not load this artwork: ${error.message}`, true);
      render.showStatus?.('Artwork load failed. Retry or pick another archive card.', 'error');
      throw error;
    } finally {
      if (requestScope.isCurrent()) {
        render.setLoading?.(false, manifest, getActiveIndex());
      }
      requestScope.complete(finalStatus);
    }
  }

  return {
    invalidate,
    isCurrent,
    loadByFile,
    getRequestFacts: () => artworkRequestTransaction.getFacts()
  };
}
