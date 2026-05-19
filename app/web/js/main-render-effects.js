import { syncQuickControls as syncQuickControlsUi } from './main-navigation.js';
import {
  applyMotionModeEffects,
  applyViewModeEffects,
  setFocusModeEffects
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

  function applyViewMode(nextMode) {
    return updateState((state) => applyViewModeEffects(state, nextMode, {
      modeStory: refs.modeStory,
      modeLab: refs.modeLab,
      metaModeStory: refs.metaModeStory,
      metaModeLab: refs.metaModeLab,
      body
    }));
  }

  function setFocusMode(enabled) {
    return updateState((state) => setFocusModeEffects(state, enabled, {
      modeFocus: refs.modeFocus,
      body
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
    return updateState((state) => resetChromeUiForBootEffects(state, {
      archiveList: refs.archiveList,
      quickPicker: refs.quickPicker,
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

  function populateQuickPicker(manifest = resolveController(getArchiveController)?.getManifest?.()) {
    if (!refs.quickPicker || !manifest?.items) return null;
    const state = getState();
    const selectedValue = state.activeIndex >= 0 ? String(state.activeIndex) : refs.quickPicker.value;
    facts.quickPickerCompact = isMobileViewport();
    const pickerFacts = populateQuickPickerUi(refs.quickPicker, manifest, { compact: facts.quickPickerCompact });

    if (selectedValue && refs.quickPicker.querySelector?.(`option[value="${selectedValue}"]`)) {
      refs.quickPicker.value = selectedValue;
    }
    return pickerFacts;
  }

  function renderMeta(art) {
    return renderMetaUi(refs.meta, art, runtimeController?.getSceneInitError?.());
  }

  function refreshActiveArchiveItem(activeFile = getState().activeFile) {
    refs.archiveList?.querySelectorAll?.('li[data-file]')?.forEach((li) => {
      const isActive = li.dataset.file === activeFile;
      li.classList.toggle('active', isActive);
      li.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  function syncQuickControls(manifest, activeIndex) {
    return syncQuickControlsUi({
      manifest,
      activeIndex,
      quickPrev: refs.quickPrev,
      quickNext: refs.quickNext,
      quickPicker: refs.quickPicker,
      quickPosition: refs.quickPosition
    });
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
        const shouldCompactPicker = isMobileViewport();
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
    applyViewMode(state.viewMode);
    setFocusMode(state.focusMode);
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
    setSceneProgress,
    updateHeroNow,
    refreshActiveArchiveItem,
    syncQuickControls,
    requestAdaptiveOverlayFrame,
    startAdaptiveOverlayLoop,
    appendArchiveItem,
    setLoadMoreVisible,
    showEmptyArchive,
    applyViewMode,
    setFocusMode,
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
    applyViewMode,
    setFocusMode,
    applyMotionMode,
    toggleMobileChrome,
    toggleHeadline,
    applyInitError,
    getCurrentArtworkLumaEstimate: () => facts.currentArtworkLumaEstimate,
    getFacts: () => cloneFacts(facts)
  };
}
