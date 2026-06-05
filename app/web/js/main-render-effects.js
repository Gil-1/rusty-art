import { syncQuickControls as syncQuickControlsUi } from './main-navigation.js';
import {
  applyMotionModeEffects
} from './main-modes.js';
import {
  applyEmptyArchiveEffects,
  applyInitErrorEffects,
  applyMobileChromeEffects,
  markMobileChromeInteractionEffects,
  resetChromeUiForBootEffects,
  resetHeadlineExpandedEffects,
  toggleHeadlineExpandedEffects,
  toggleMobileChromeEffects
} from './main-chrome-effects.js';
import {
  populateQuickPicker as populateQuickPickerUi,
  applySceneProgressFacts,
  renderGalleryList as renderGalleryListUi,
  renderMeta as renderMetaUi,
  setLoadingState,
  showFallback as showFallbackUi,
  showStatus as showStatusUi,
  updateArchiveCount as updateArchiveCountUi,
  updateHeroNow as updateHeroNowUi
} from './main-render.js';

function noop() {}

function resolveController(getArchiveController) {
  return typeof getArchiveController === 'function' ? getArchiveController() : null;
}

function cloneFacts(facts) {
  return {
    currentArtworkLumaEstimate: facts.currentArtworkLumaEstimate,
    quickPickerCompact: facts.quickPickerCompact,
    viewportRefreshPending: facts.viewportRefreshTimer != null
  };
}

export function createRuntimeRenderEffects({
  refs = {},
  body = null,
  windowRef = globalThis.window,
  captureMode = false,
  isMobileViewport = () => false,
  getScrollY = () => 0,
  getPresentationState = () => ({}),
  setPresentationState = noop,
  getArchiveController = () => null,
  runtimeController = null,
  captureStateController = null,
  adaptiveOverlaySession = null
} = {}) {
  const facts = {
    currentArtworkLumaEstimate: null,
    quickPickerCompact: false,
    viewportRefreshTimer: null
  };

  function getState() {
    return getPresentationState() || {};
  }

  function updateState(updater) {
    const nextState = typeof updater === 'function' ? updater(getState()) : updater;
    setPresentationState(nextState);
    return nextState;
  }

  function showStatus(message = '', level = 'info') {
    return showStatusUi(refs.statusBanner, message, level);
  }

  function showFallback(message = '', showRetry = true) {
    return showFallbackUi({
      fallbackPanel: refs.fallbackPanel,
      fallbackMessage: refs.fallbackMessage,
      retryLoad: refs.retryLoad
    }, message, showRetry);
  }

  function galleryTrigger() {
    return refs.galleryTrigger || refs.quickPicker;
  }

  function isGalleryOpen() {
    return Boolean(refs.galleryDialog && !refs.galleryDialog.hidden);
  }

  function closeGallery({ restoreFocus = true } = {}) {
    if (!refs.galleryDialog) return false;
    refs.galleryDialog.hidden = true;
    refs.galleryDialog.setAttribute?.('aria-hidden', 'true');
    body?.classList?.remove?.('gallery-open');
    galleryTrigger()?.setAttribute?.('aria-expanded', 'false');
    if (restoreFocus) galleryTrigger()?.focus?.({ preventScroll: true });
    return true;
  }

  function selectGalleryArtwork(facts = {}) {
    const file = facts.file || null;
    closeGallery();
    if (!file) return Promise.resolve({ status: 'missing-file' });
    if (file === getState().activeFile) return Promise.resolve({ status: 'current', file });
    return resolveController(getArchiveController)?.loadArtworkByFile?.(file) || Promise.resolve({ status: 'missing-controller', file });
  }

  function renderGallery(manifest = resolveController(getArchiveController)?.getManifest?.()) {
    if (captureMode || !refs.galleryList || !manifest?.items) return null;
    return renderGalleryListUi(refs.galleryList, manifest, {
      activeFile: getState().activeFile,
      onSelect: (cardFacts) => selectGalleryArtwork(cardFacts).catch?.(() => {})
    });
  }

  function openGallery() {
    const trigger = galleryTrigger();
    const manifest = resolveController(getArchiveController)?.getManifest?.();
    if (captureMode || !refs.galleryDialog || trigger?.disabled || !manifest?.items?.length) return false;
    renderGallery(manifest);
    refs.galleryDialog.hidden = false;
    refs.galleryDialog.setAttribute?.('aria-hidden', 'false');
    body?.classList?.add?.('gallery-open');
    trigger?.setAttribute?.('aria-expanded', 'true');
    refs.galleryClose?.focus?.({ preventScroll: true });
    return true;
  }

  function handleGalleryKeydown(event) {
    if (!isGalleryOpen()) return false;
    if (event?.key === 'Escape') {
      event.preventDefault?.();
      closeGallery();
    }
    return true;
  }

  function updateMobileChromeState() {
    return updateState((state) => applyMobileChromeEffects(state, {
      body,
      mobileChromeToggle: refs.mobileChromeToggle,
      captureMode,
      isMobileViewport: isMobileViewport(),
      scrollY: getScrollY()
    }));
  }

  function markMobileChromeInteraction() {
    return updateState((state) => markMobileChromeInteractionEffects(state, {
      body,
      mobileChromeToggle: refs.mobileChromeToggle,
      captureMode,
      isMobileViewport: isMobileViewport(),
      scrollY: getScrollY()
    }));
  }

  function applyMotionMode(nextMode) {
    return updateState((state) => applyMotionModeEffects(state, nextMode, {
      body,
      onMotionChange: () => runtimeController?.updateMotionIntensity?.()
    }));
  }

  function resetUiForBoot() {
    facts.currentArtworkLumaEstimate = null;
    adaptiveOverlaySession?.reset?.();
    closeGallery({ restoreFocus: false });
    if (galleryTrigger()) galleryTrigger().disabled = true;
    return updateState((state) => resetChromeUiForBootEffects(state, {
      archiveList: refs.archiveList,
      quickPicker: galleryTrigger(),
      quickPosition: refs.quickPosition,
      heroNowHeadline: refs.heroNowHeadline,
      heroHeadlineToggle: refs.heroHeadlineToggle,
      loadMoreButton: refs.loadMoreButton,
      showFallback
    }));
  }

  function updateHeroNow(art) {
    const result = updateHeroNowUi({
      heroNowTitle: refs.heroNowTitle,
      heroNowSub: refs.heroNowSub,
      heroNowHeadline: refs.heroNowHeadline
    }, art);
    updateState((state) => resetHeadlineExpandedEffects(state, {
      heroNowHeadline: refs.heroNowHeadline,
      heroHeadlineToggle: refs.heroHeadlineToggle
    }));
    return result;
  }

  function updateArchiveCount(
    renderedCount = resolveController(getArchiveController)?.getRenderedArchiveCount?.(),
    manifest = resolveController(getArchiveController)?.getManifest?.()
  ) {
    return updateArchiveCountUi(refs.archiveCount, renderedCount, manifest);
  }

  function setLoading(
    isLoading,
    manifest = resolveController(getArchiveController)?.getManifest?.(),
    activeIndex = getState().activeIndex
  ) {
    return setLoadingState({
      artFirst: refs.artFirst,
      loadState: refs.loadState,
      quickPicker: refs.quickPicker,
      galleryTrigger: refs.galleryTrigger,
      quickPrev: refs.quickPrev,
      quickNext: refs.quickNext
    }, isLoading, manifest, activeIndex);
  }

  function setSceneProgress(progress = {}) {
    return applySceneProgressFacts({
      sceneProgress: refs.sceneProgress,
      sceneProgressBar: refs.sceneProgressBar,
      sceneProgressLabel: refs.sceneProgressLabel
    }, progress);
  }

  function populateQuickPicker(manifest = resolveController(getArchiveController)?.getManifest?.(), activeIndex = getState().activeIndex) {
    const trigger = galleryTrigger();
    if (!trigger || !manifest?.items) return null;
    const state = getState();
    const selectedIndex = activeIndex >= 0 ? activeIndex : state.activeIndex;
    facts.quickPickerCompact = true;
    const pickerFacts = populateQuickPickerUi(trigger, manifest, {
      compact: facts.quickPickerCompact,
      activeIndex: selectedIndex
    });
    refs.quickPosition = trigger.querySelector?.('#quick-position') || refs.quickPosition;
    renderGallery(manifest);
    return pickerFacts;
  }

  function renderMeta(art) {
    return renderMetaUi(refs.meta, art, runtimeController?.getSceneInitError?.());
  }

  function refreshActiveArchiveItem(activeFile = getState().activeFile) {
    [refs.archiveList, refs.galleryList].forEach((list) => {
      list?.querySelectorAll?.('li[data-file]')?.forEach((li) => {
        const isActive = li.dataset.file === activeFile;
        li.classList?.toggle?.('active', isActive);
        li.setAttribute?.('aria-current', isActive ? 'true' : 'false');
      });
    });
  }

  function syncQuickControls(manifest, activeIndex) {
    const result = syncQuickControlsUi({
      manifest,
      activeIndex,
      quickPrev: refs.quickPrev,
      quickNext: refs.quickNext,
      quickPicker: galleryTrigger(),
      quickPosition: refs.quickPosition
    });
    populateQuickPicker(manifest, activeIndex);
    return result;
  }

  function syncRenderStatus() {
    const sceneInitError = runtimeController?.getSceneInitError?.();
    const manifestFallbackReason = resolveController(getArchiveController)?.getManifestFallbackReason?.() || '';
    const sceneWarning = sceneInitError
      ? `Renderer unavailable (${sceneInitError.message}). Metadata view still works.`
      : '';

    if (manifestFallbackReason && sceneWarning) {
      showStatus(`${manifestFallbackReason} ${sceneWarning}`, 'warning');
      return;
    }
    if (manifestFallbackReason) {
      showStatus(manifestFallbackReason, 'warning');
      return;
    }
    if (sceneWarning) {
      showStatus(sceneWarning, 'warning');
      return;
    }
    showStatus('');
  }

  function startAdaptiveOverlayLoop() {
    return adaptiveOverlaySession?.start?.();
  }

  function requestAdaptiveOverlayFrame() {
    return adaptiveOverlaySession?.requestFrame?.();
  }

  function applyAdaptiveOverlay() {
    return adaptiveOverlaySession?.apply?.();
  }

  function showEmptyArchive() {
    return updateState((state) => applyEmptyArchiveEffects(state, {
      refs,
      showStatus
    }));
  }

  function applyInitError(error) {
    return updateState((state) => applyInitErrorEffects(state, {
      error,
      refs,
      showFallback,
      showStatus,
      captureStateController,
      sceneAssemblyReport: error?.sceneAssemblyReport || runtimeController?.getScene?.()?.getAssemblyReport?.() || null
    }));
  }

  function refreshViewportUi() {
    if (facts.viewportRefreshTimer != null) {
      windowRef?.clearTimeout?.(facts.viewportRefreshTimer);
    }

    facts.viewportRefreshTimer = windowRef?.setTimeout?.(() => {
      facts.viewportRefreshTimer = null;
      const controller = resolveController(getArchiveController);
      const manifest = controller?.getManifest?.();
      if (manifest?.items?.length) {
        const shouldCompactPicker = true;
        if (shouldCompactPicker !== facts.quickPickerCompact) {
          populateQuickPicker(manifest);
          syncQuickControls(manifest, getState().activeIndex);
        }
      }
      updateMobileChromeState();
    }, 120) ?? null;
  }

  function toggleMobileChrome() {
    return updateState((state) => toggleMobileChromeEffects(state, {
      body,
      mobileChromeToggle: refs.mobileChromeToggle,
      captureMode,
      isMobileViewport: isMobileViewport(),
      scrollY: getScrollY()
    }));
  }

  function toggleHeadline() {
    return updateState((state) => toggleHeadlineExpandedEffects(state, {
      heroNowHeadline: refs.heroNowHeadline,
      heroHeadlineToggle: refs.heroHeadlineToggle
    }));
  }

  function onBeforeManifestLoad() {
    if (captureMode) {
      body?.classList?.add?.('capture-mode');
    }
    const state = getState();
    applyMotionMode(state.motionMode);
    updateMobileChromeState();
    resetUiForBoot();
  }

  function appendArchiveItem(archiveCard) {
    refs.archiveList?.appendChild?.(archiveCard);
  }

  function setLoadMoreVisible(visible) {
    if (refs.loadMoreButton) {
      refs.loadMoreButton.style.display = visible ? 'inline-flex' : 'none';
    }
  }

  const render = {
    onBeforeManifestLoad,
    showStatus,
    showFallback,
    syncRenderStatus,
    populateQuickPicker,
    updateArchiveCount,
    setLoading,
    setCurrentArtworkLumaEstimate: (lumaEstimate) => {
      facts.currentArtworkLumaEstimate = lumaEstimate;
    },
    renderMeta,
    renderGallery,
    setSceneProgress,
    updateHeroNow,
    refreshActiveArchiveItem,
    syncQuickControls,
    requestAdaptiveOverlayFrame,
    startAdaptiveOverlayLoop,
    appendArchiveItem,
    setLoadMoreVisible,
    showEmptyArchive,
    applyMotionMode
  };

  return {
    render,
    showStatus,
    showFallback,
    updateMobileChromeState,
    markMobileChromeInteraction,
    refreshViewportUi,
    applyAdaptiveOverlay,
    startAdaptiveOverlayLoop,
    applyMotionMode,
    toggleMobileChrome,
    toggleHeadline,
    openGallery,
    closeGallery,
    handleGalleryKeydown,
    applyInitError,
    getCurrentArtworkLumaEstimate: () => facts.currentArtworkLumaEstimate,
    getFacts: () => cloneFacts(facts)
  };
}
