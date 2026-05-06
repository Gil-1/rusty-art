import {
  findActiveIndex,
  getNeighborFiles
} from './main-navigation.js';
import { setActiveArtworkState } from './main-presentation-state.js';

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

export function prefetchArtworkFiles(files = [], fetchArtwork) {
  const scheduled = [];

  files.forEach((file) => {
    if (!file) return;
    try {
      scheduled.push(file);
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
  render = {}
} = {}) {
  let loadToken = 0;

  function getState() {
    return getPresentationState() || {};
  }

  function updateState(updater) {
    const nextState = typeof updater === 'function' ? updater(getState()) : updater;
    setPresentationState(nextState);
    return nextState;
  }

  function invalidate() {
    loadToken += 1;
    return loadToken;
  }

  function isCurrent(token) {
    return token === loadToken;
  }

  async function loadByFile(file, { manifest } = {}) {
    if (!file) return { status: 'missing-file' };

    const token = invalidate();
    render.setLoading?.(true, manifest, getActiveIndex());

    try {
      const art = await fetchArtwork(file);
      if (!isCurrent(token)) return { status: 'stale' };

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
          shouldContinue: () => isCurrent(token),
          waitForRenderedFrame: captureMode
        });
        if (!applied) return { status: isCurrent(token) ? 'not-applied' : 'stale' };
      }

      if (!isCurrent(token)) return { status: 'stale' };

      render.renderMeta?.(art);
      render.updateHeroNow?.(art);

      updateState((state) => setActiveArtworkState(state, {
        file,
        index: effectPlan.activeIndex
      }));

      if (effectPlan.shouldRequestDeferredSceneBoot) {
        runtimeController?.requestDeferredSceneBoot?.();
      }

      prefetchArtworkFiles(effectPlan.neighborFiles, fetchArtwork);
      if (effectPlan.clearFallback) render.showFallback?.('', true);
      render.refreshActiveArchiveItem?.(effectPlan.refreshActiveArchiveItem);
      if (effectPlan.syncQuickControls) {
        render.syncQuickControls?.(manifest, effectPlan.activeIndex);
      }
      if (effectPlan.requestAdaptiveOverlayFrame) {
        render.requestAdaptiveOverlayFrame?.();
      }

      return {
        status: 'loaded',
        file,
        art,
        activeIndex: effectPlan.activeIndex,
        effectPlan
      };
    } catch (error) {
      if (!isCurrent(token)) return { status: 'stale-error', error };
      render.showFallback?.(`Could not load this artwork: ${error.message}`, true);
      render.showStatus?.('Artwork load failed. Retry or pick another archive card.', 'error');
      throw error;
    } finally {
      if (isCurrent(token)) {
        render.setLoading?.(false, manifest, getActiveIndex());
      }
    }
  }

  return {
    invalidate,
    isCurrent,
    loadByFile
  };
}
