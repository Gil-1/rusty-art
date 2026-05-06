import { createArtworkFetcher, loadManifestWithFallback } from './main-data.js';
import { createArchiveInteractionController } from './main-archive-interaction-controller.js';
import { syncQuickControls } from './main-navigation.js';
import { createCaptureStateController } from './main-capture-state.js';
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
  resetHeadlineExpandedEffects,
  resetChromeUiForBootEffects,
  toggleHeadlineExpandedEffects,
  toggleMobileChromeEffects
} from './main-chrome-effects.js';
import {
  createInitialPresentationState,
  PRESENTATION_STORAGE_KEYS
} from './main-presentation-state.js';
import { createRuntimeController } from './main-runtime-controller.js';
import {
  bindRuntimeShellEvents,
  queryRuntimeDomRefs,
  resolveRuntimeShellOptions,
  startRuntimeShell
} from './main-runtime-shell.js';
import {
  createAdaptiveOverlaySession,
  estimateArtworkLuma
} from './main-adaptive-overlay-controller.js';
import {
  createArchiveCardElement,
  populateQuickPicker as populateQuickPickerUi,
  renderMeta as renderMetaUi,
  setLoadingState,
  showFallback as showFallbackUi,
  showStatus as showStatusUi,
  updateArchiveCount as updateArchiveCountUi,
  updateHeroNow as updateHeroNowUi
} from './main-render.js';

const PAGE_SIZE = 12;

const shellOptions = resolveRuntimeShellOptions({
  windowRef: window,
  storage: localStorage,
  storageKeys: PRESENTATION_STORAGE_KEYS
});
const {
  captureMode,
  forcedView,
  requestedIndex,
  requestedArtworkSlug,
  prefersReducedMotion
} = shellOptions;
const {
  artFirst,
  canvas,
  meta,
  archiveList,
  loadMoreButton,
  heroNowTitle,
  heroNowSub,
  heroNowHeadline,
  archiveCount,
  quickPrev,
  quickNext,
  quickPicker,
  quickPosition,
  loadState,
  modeStory,
  modeLab,
  modeFocus,
  modeReducedMotion,
  metaModeStory,
  metaModeLab,
  statusBanner,
  fallbackPanel,
  fallbackMessage,
  retryLoad,
  heroHeadlineToggle,
  mobileChromeToggle
} = queryRuntimeDomRefs(document);
let currentArtworkLumaEstimate = null;
let quickPickerCompact = false;
let viewportRefreshTimer = null;
let presentationState = createInitialPresentationState({
  storedViewMode: shellOptions.storedViewMode,
  storedFocusMode: shellOptions.storedFocusMode,
  storedMotionMode: shellOptions.storedMotionMode,
  prefersReducedMotion,
  captureMode,
  forcedView,
  isMobileViewport: isMobileViewport(),
  scrollY: window.scrollY
});

const fetchArtwork = createArtworkFetcher();
const captureStateController = createCaptureStateController({ captureMode });
const adaptiveOverlaySession = createAdaptiveOverlaySession({
  canvas,
  body: document.body,
  documentRef: document,
  windowRef: window,
  captureMode,
  getEstimatedLuma: () => currentArtworkLumaEstimate
});
const runtimeController = createRuntimeController({
  canvas,
  captureMode,
  captureStateController,
  fetchArtwork,
  getActiveFile: () => presentationState.activeFile,
  getMotionIntensity: () => sceneMotionIntensity(),
  onSceneBooted: () => {
    applyAdaptiveOverlay();
    startAdaptiveOverlayLoop();
  },
  onSceneStatusChange: () => syncRenderStatus()
});

const archiveController = createArchiveInteractionController({
  pageSize: PAGE_SIZE,
  captureMode,
  requestedIndex,
  requestedArtworkSlug,
  loadManifest: loadManifestWithFallback,
  fetchArtwork,
  runtimeController,
  captureStateController,
  getPresentationState: () => presentationState,
  setPresentationState: (nextState) => {
    presentationState = nextState;
  },
  isMobileViewport,
  getScrollY: () => window.scrollY,
  estimateArtworkLuma,
  createArchiveCardElement,
  render: {
    onBeforeManifestLoad: () => {
      if (captureMode) {
        document.body.classList.add('capture-mode');
      }
      applyViewMode(presentationState.viewMode);
      setFocusMode(presentationState.focusMode);
      applyMotionMode(presentationState.motionMode);
      updateMobileChromeState();
      resetUiForBoot();
    },
    showStatus,
    showFallback,
    syncRenderStatus,
    populateQuickPicker,
    updateArchiveCount,
    setLoading,
    setCurrentArtworkLumaEstimate: (lumaEstimate) => {
      currentArtworkLumaEstimate = lumaEstimate;
    },
    renderMeta,
    updateHeroNow,
    refreshActiveArchiveItem,
    syncQuickControls: (nextManifest, activeIndex) => {
      syncQuickControls({ manifest: nextManifest, activeIndex, quickPrev, quickNext, quickPicker, quickPosition });
    },
    requestAdaptiveOverlayFrame: () => adaptiveOverlaySession.requestFrame(),
    startAdaptiveOverlayLoop,
    appendArchiveItem: (archiveCard) => {
      archiveList.appendChild(archiveCard);
    },
    setLoadMoreVisible: (visible) => {
      if (loadMoreButton) {
        loadMoreButton.style.display = visible ? 'inline-flex' : 'none';
      }
    },
    showEmptyArchive,
    applyViewMode,
    setFocusMode,
    applyMotionMode
  }
});

function isMobileViewport() {
  return shellOptions.isMobileViewport();
}

function updateMobileChromeState() {
  presentationState = applyMobileChromeEffects(presentationState, {
    body: document.body,
    mobileChromeToggle,
    captureMode,
    isMobileViewport: isMobileViewport(),
    scrollY: window.scrollY
  });
}

function markMobileChromeInteraction() {
  presentationState = markMobileChromeInteractionEffects(presentationState, {
    body: document.body,
    mobileChromeToggle,
    captureMode,
    isMobileViewport: isMobileViewport(),
    scrollY: window.scrollY
  });
}

function refreshViewportUi() {
  if (viewportRefreshTimer != null) {
    clearTimeout(viewportRefreshTimer);
  }

  viewportRefreshTimer = window.setTimeout(() => {
    viewportRefreshTimer = null;
    const manifest = archiveController.getManifest();
    if (manifest?.items?.length) {
      const shouldCompactPicker = isMobileViewport();
      if (shouldCompactPicker !== quickPickerCompact) {
        populateQuickPicker(manifest);
        syncQuickControls({ manifest, activeIndex: presentationState.activeIndex, quickPrev, quickNext, quickPicker, quickPosition });
      }
    }
    updateMobileChromeState();
  }, 120);
}

function applyAdaptiveOverlay() {
  return adaptiveOverlaySession.apply();
}

function startAdaptiveOverlayLoop() {
  return adaptiveOverlaySession.start();
}

function syncRenderStatus() {
  const sceneInitError = runtimeController.getSceneInitError();
  const manifestFallbackReason = archiveController.getManifestFallbackReason();
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

function sceneMotionIntensity() {
  return presentationState.motionMode === 'reduced' ? 0.42 : 1;
}

function showStatus(message = '', level = 'info') {
  showStatusUi(statusBanner, message, level);
}

function showFallback(message = '', showRetry = true) {
  showFallbackUi({ fallbackPanel, fallbackMessage, retryLoad }, message, showRetry);
}

function updateHeroNow(art) {
  updateHeroNowUi({ heroNowTitle, heroNowSub, heroNowHeadline }, art);
  presentationState = resetHeadlineExpandedEffects(presentationState, {
    heroNowHeadline,
    heroHeadlineToggle
  });
}

function updateArchiveCount(renderedCount = archiveController.getRenderedArchiveCount(), manifest = archiveController.getManifest()) {
  updateArchiveCountUi(archiveCount, renderedCount, manifest);
}

function setLoading(isLoading, manifest = archiveController.getManifest(), activeIndex = presentationState.activeIndex) {
  setLoadingState({ artFirst, loadState, quickPicker, quickPrev, quickNext }, isLoading, manifest, activeIndex);
}

function populateQuickPicker(manifest = archiveController.getManifest()) {
  if (!quickPicker || !manifest?.items) return;
  const selectedValue = presentationState.activeIndex >= 0 ? String(presentationState.activeIndex) : quickPicker.value;
  quickPickerCompact = isMobileViewport();
  populateQuickPickerUi(quickPicker, manifest, { compact: quickPickerCompact });

  if (selectedValue && quickPicker.querySelector(`option[value="${selectedValue}"]`)) {
    quickPicker.value = selectedValue;
  }
}

function applyViewMode(nextMode) {
  presentationState = applyViewModeEffects(presentationState, nextMode, {
    modeStory,
    modeLab,
    metaModeStory,
    metaModeLab
  });
}

function setFocusMode(enabled) {
  presentationState = setFocusModeEffects(presentationState, enabled, { modeFocus });
}

function applyMotionMode(nextMode) {
  presentationState = applyMotionModeEffects(presentationState, nextMode, {
    modeReducedMotion,
    onMotionChange: () => runtimeController.updateMotionIntensity()
  });
}

function renderMeta(art) {
  renderMetaUi(meta, art, runtimeController.getSceneInitError());
}

function refreshActiveArchiveItem() {
  archiveList.querySelectorAll('li[data-file]').forEach((li) => {
    const isActive = li.dataset.file === presentationState.activeFile;
    li.classList.toggle('active', isActive);
    li.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
}

function resetUiForBoot() {
  currentArtworkLumaEstimate = null;
  adaptiveOverlaySession.reset();
  presentationState = resetChromeUiForBootEffects(presentationState, {
    archiveList,
    quickPicker,
    quickPosition,
    heroNowHeadline,
    heroHeadlineToggle,
    loadMoreButton,
    showFallback
  });
}

function showEmptyArchive() {
  presentationState = applyEmptyArchiveEffects(presentationState, {
    refs: {
      meta,
      heroNowTitle,
      heroNowSub,
      heroNowHeadline,
      heroHeadlineToggle,
      archiveCount,
      quickPicker,
      quickPosition,
      quickPrev,
      quickNext,
      loadMoreButton
    },
    showStatus
  });
}

function init() {
  return archiveController.init();
}

function handleInitError(err) {
  presentationState = applyInitErrorEffects(presentationState, {
    error: err,
    refs: {
      meta,
      heroNowTitle,
      heroNowSub,
      heroNowHeadline,
      heroHeadlineToggle,
      quickPicker,
      quickPosition,
      quickPrev,
      quickNext,
      loadMoreButton
    },
    showFallback,
    showStatus,
    captureStateController,
    sceneAssemblyReport: err.sceneAssemblyReport || runtimeController.getScene()?.getAssemblyReport?.() || null
  });
}

bindRuntimeShellEvents({
  refs: {
    loadMoreButton,
    retryLoad,
    quickPrev,
    quickNext,
    quickPicker,
    modeStory,
    modeLab,
    modeFocus,
    modeReducedMotion,
    metaModeStory,
    metaModeLab,
    mobileChromeToggle,
    heroHeadlineToggle
  },
  documentRef: document,
  windowRef: window,
  actions: {
    onLoadMore: () => archiveController.appendArchiveItems(),
    onRetryLoad: () => {
      init().catch((err) => {
        showFallback(`Still failing to load: ${err.message}`, true);
        showStatus('Retry failed. Check generated data files and network access.', 'error');
      });
    },
    onQuickPrevious: () => archiveController.handleQuickPrevious().catch(() => {}),
    onQuickNext: () => archiveController.handleQuickNext().catch(() => {}),
    onQuickPickerChange: (event) => archiveController.handleQuickPickerChange(event).catch(() => {}),
    onViewMode: applyViewMode,
    onToggleFocus: () => setFocusMode(!presentationState.focusMode),
    onToggleReducedMotion: () => applyMotionMode(presentationState.motionMode === 'reduced' ? 'full' : 'reduced'),
    onToggleMobileChrome: () => {
      presentationState = toggleMobileChromeEffects(presentationState, {
        body: document.body,
        mobileChromeToggle,
        captureMode,
        isMobileViewport: isMobileViewport(),
        scrollY: window.scrollY
      });
    },
    onToggleHeadline: () => {
      presentationState = toggleHeadlineExpandedEffects(presentationState, {
        heroNowHeadline,
        heroHeadlineToggle
      });
    },
    onPointerDown: markMobileChromeInteraction,
    onScroll: () => {
      if (!isMobileViewport()) return;
      updateMobileChromeState();
    },
    onViewportChange: refreshViewportUi,
    onKeydown: (event) => archiveController.handleKeyboardCommand(event)
  }
});

startRuntimeShell({ init, onError: handleInitError });
