import {
  clampManifestIndex,
  wrapManifestIndex
} from './main-navigation.js';
import { findManifestIndexByArtworkSlug } from './contracts/public-artwork-routes.js';
import { createArtworkLoadTransaction } from './main-artwork-load-transaction.js';
import {
  resetPresentationBootState,
  selectInitialArtworkIndex
} from './main-presentation-state.js';

const DEFAULT_PAGE_SIZE = 12;

function isTypingTarget(target) {
  const tag = target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
}

export function createArchiveInteractionController({
  pageSize = DEFAULT_PAGE_SIZE,
  captureMode = false,
  requestedIndex = null,
  requestedArtworkSlug = null,
  loadManifest,
  fetchArtwork,
  runtimeController,
  captureStateController,
  getPresentationState = () => ({}),
  setPresentationState = () => {},
  isMobileViewport = () => false,
  getScrollY = () => 0,
  estimateArtworkLuma = () => null,
  createArchiveCardElement = null,
  render = {}
} = {}) {
  let manifest = null;
  let manifestFallbackReason = '';
  let renderedArchiveCount = 0;

  function getManifest() {
    return manifest;
  }

  function getManifestFallbackReason() {
    return manifestFallbackReason;
  }

  function getRenderedArchiveCount() {
    return renderedArchiveCount;
  }

  function getState() {
    return getPresentationState() || {};
  }

  function updateState(updater) {
    const nextState = typeof updater === 'function' ? updater(getState()) : updater;
    setPresentationState(nextState);
    return nextState;
  }

  function currentActiveIndex() {
    return getState().activeIndex ?? -1;
  }

  function currentActiveFile() {
    return getState().activeFile ?? null;
  }

  const artworkLoadTransaction = createArtworkLoadTransaction({
    captureMode,
    fetchArtwork,
    runtimeController,
    captureStateController,
    getPresentationState,
    setPresentationState,
    getActiveIndex: currentActiveIndex,
    estimateArtworkLuma,
    render
  });

  function resetForBoot() {
    artworkLoadTransaction.invalidate();
    manifest = null;
    manifestFallbackReason = '';
    renderedArchiveCount = 0;

    runtimeController?.resetDeferredSceneBoot?.();
    updateState((state) => resetPresentationBootState(state, {
      isMobileViewport: isMobileViewport(),
      scrollY: getScrollY()
    }));
    if (captureMode) captureStateController?.reset?.();
    render.onBeforeManifestLoad?.();
    render.showStatus?.('Loading archive…');
  }

  async function loadArtworkByFile(file) {
    return artworkLoadTransaction.loadByFile(file, { manifest });
  }

  function loadArtworkByIndex(index) {
    const clamped = clampManifestIndex(manifest, index);
    if (clamped == null || !manifest?.items?.[clamped]) return Promise.resolve({ status: 'missing-index' });
    const file = manifest.items[clamped].file;
    if (file === currentActiveFile()) return Promise.resolve({ status: 'current', file });
    return loadArtworkByFile(file);
  }

  function loadArtworkByStep(step) {
    const current = wrapManifestIndex(manifest, currentActiveIndex());
    if (current == null) return Promise.resolve({ status: 'missing-index' });
    const next = wrapManifestIndex(manifest, current + step);
    if (next == null) return Promise.resolve({ status: 'missing-index' });
    return loadArtworkByIndex(next);
  }

  function appendArchiveItems() {
    if (!manifest?.items?.length) return { appended: 0, renderedArchiveCount };

    const start = renderedArchiveCount;
    const nextChunk = manifest.items.slice(start, start + pageSize);

    nextChunk.forEach((item) => {
      const activate = () => {
        loadArtworkByFile(item.file).catch(() => {});
      };
      const archiveCard = typeof createArchiveCardElement === 'function'
        ? createArchiveCardElement(item, activate)
        : { item, activate };
      render.appendArchiveItem?.(archiveCard, item);
    });

    render.refreshActiveArchiveItem?.(currentActiveFile());
    renderedArchiveCount += nextChunk.length;
    render.updateArchiveCount?.(renderedArchiveCount, manifest);
    render.setLoadMoreVisible?.(renderedArchiveCount < manifest.items.length);

    return {
      appended: nextChunk.length,
      renderedArchiveCount,
      hasMore: renderedArchiveCount < manifest.items.length
    };
  }

  async function init() {
    resetForBoot();

    const result = await loadManifest();
    manifest = result.manifest;
    manifestFallbackReason = result.fallback ? result.fallbackReason : '';
    captureStateController?.update?.({
      manifestLoaded: true,
      manifestCount: manifest.items.length
    });

    if (!manifest.items.length) {
      manifestFallbackReason = '';
      render.showEmptyArchive?.(manifest);
      captureStateController?.update?.({
        renderReady: false,
        error: 'No artwork available yet.'
      });
      return { status: 'empty', manifest };
    }

    render.syncRenderStatus?.();
    render.populateQuickPicker?.(manifest, currentActiveIndex());
    render.updateArchiveCount?.(renderedArchiveCount, manifest);

    const slugIndex = findManifestIndexByArtworkSlug(manifest, requestedArtworkSlug);
    const targetIndex = selectInitialArtworkIndex({ manifest, requestedIndex, slugIndex });
    await loadArtworkByIndex(targetIndex);

    if (captureMode) {
      await runtimeController?.bootSceneNow?.();
    } else {
      await runtimeController?.bootSceneNow?.();
      render.startAdaptiveOverlayLoop?.();
    }

    return { status: 'ready', manifest };
  }

  function handleQuickPrevious() {
    return loadArtworkByStep(-1);
  }

  function handleQuickNext() {
    return loadArtworkByStep(1);
  }

  function handleQuickPickerChange(eventOrValue) {
    const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
    const nextIndex = Number(value);
    if (Number.isNaN(nextIndex)) return Promise.resolve({ status: 'invalid-index' });
    return loadArtworkByIndex(nextIndex);
  }

  function handleKeyboardCommand(event) {
    if (isTypingTarget(event.target) || captureMode) return false;

    const key = String(event.key || '');

    if (!manifest?.items?.length) return false;

    if (key === 'ArrowLeft') {
      event.preventDefault?.();
      return loadArtworkByStep(-1).catch(() => {});
    }

    if (key === 'ArrowRight') {
      event.preventDefault?.();
      return loadArtworkByStep(1).catch(() => {});
    }

    if (key === 'Home') {
      event.preventDefault?.();
      return loadArtworkByIndex(0).catch(() => {});
    }

    if (key === 'End') {
      event.preventDefault?.();
      return loadArtworkByIndex(manifest.items.length - 1).catch(() => {});
    }

    return false;
  }

  return {
    init,
    loadArtworkByFile,
    loadArtworkByIndex,
    loadArtworkByStep,
    appendArchiveItems,
    handleQuickPrevious,
    handleQuickNext,
    handleQuickPickerChange,
    handleKeyboardCommand,
    getManifest,
    getManifestFallbackReason,
    getRenderedArchiveCount
  };
}
