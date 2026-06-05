import { startAnalytics } from './analytics.js';
import { createArtworkFetcher, loadManifestWithFallback } from './main-data.js';
import { createPublicArchiveRuntimeSession } from './public-archive-runtime-session.js';
import { createCaptureStateController } from './main-capture-state.js';
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
import { createRuntimeRenderEffects } from './main-render-effects.js';
import { createArchiveCardElement } from './main-render.js';

const PAGE_SIZE = 12;

startAnalytics();

const shellOptions = resolveRuntimeShellOptions({
  windowRef: window,
  storage: localStorage,
  storageKeys: PRESENTATION_STORAGE_KEYS
});
const {
  captureMode,
  captureProfile,
  requestedIndex,
  requestedArtworkSlug,
  rendererRequest,
  postProcessingRequest,
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
  galleryTrigger,
  galleryDialog,
  galleryClose,
  galleryList,
  quickPosition,
  loadState,
  sceneProgress,
  sceneProgressBar,
  sceneProgressLabel,
  statusBanner,
  fallbackPanel,
  fallbackMessage,
  retryLoad,
  heroHeadlineToggle,
  mobileChromeToggle
} = queryRuntimeDomRefs(document);
let presentationState = createInitialPresentationState({
  storedMotionMode: shellOptions.storedMotionMode,
  prefersReducedMotion,
  captureMode,
  isMobileViewport: isMobileViewport(),
  scrollY: window.scrollY
});

const fetchArtwork = createArtworkFetcher();
const captureStateController = createCaptureStateController({ captureMode });
let archiveController = null;
let renderEffects = null;
const adaptiveOverlaySession = createAdaptiveOverlaySession({
  canvas,
  body: document.body,
  documentRef: document,
  windowRef: window,
  captureMode,
  getEstimatedLuma: () => renderEffects?.getCurrentArtworkLumaEstimate?.() ?? null
});
const runtimeController = createRuntimeController({
  canvas,
  captureMode,
  captureProfile,
  rendererRequest,
  postProcessingRequest,
  captureStateController,
  fetchArtwork,
  getActiveFile: () => presentationState.activeFile,
  getMotionIntensity: () => sceneMotionIntensity(),
  onSceneBooted: () => {
    renderEffects?.applyAdaptiveOverlay?.();
    renderEffects?.startAdaptiveOverlayLoop?.();
  },
  onSceneStatusChange: () => renderEffects?.render?.syncRenderStatus?.(),
  onSceneLoadProgress: (progress) => renderEffects?.render?.setSceneProgress?.(progress)
});

renderEffects = createRuntimeRenderEffects({
  refs: {
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
    galleryTrigger,
    galleryDialog,
    galleryClose,
    galleryList,
    quickPosition,
    loadState,
    sceneProgress,
    sceneProgressBar,
    sceneProgressLabel,
    statusBanner,
    fallbackPanel,
    fallbackMessage,
    retryLoad,
    heroHeadlineToggle,
    mobileChromeToggle
  },
  body: document.body,
  windowRef: window,
  captureMode,
  isMobileViewport,
  getScrollY: () => window.scrollY,
  getPresentationState: () => presentationState,
  setPresentationState: (nextState) => {
    presentationState = nextState;
  },
  getArchiveController: () => archiveController,
  runtimeController,
  captureStateController,
  adaptiveOverlaySession
});

archiveController = createPublicArchiveRuntimeSession({
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
  render: renderEffects.render
});

function isMobileViewport() {
  return shellOptions.isMobileViewport();
}

function sceneMotionIntensity() {
  return presentationState.motionMode === 'reduced' ? 0.42 : 1;
}

function init() {
  return archiveController.init();
}

bindRuntimeShellEvents({
  refs: {
    loadMoreButton,
    retryLoad,
    quickPrev,
    quickNext,
    quickPicker,
    galleryTrigger,
    galleryDialog,
    galleryClose,
    mobileChromeToggle,
    heroHeadlineToggle
  },
  documentRef: document,
  windowRef: window,
  actions: {
    onLoadMore: () => archiveController.appendArchiveItems(),
    onRetryLoad: () => {
      init().catch((err) => {
        renderEffects.showFallback(`Still failing to load: ${err.message}`, true);
        renderEffects.showStatus('Retry failed. Check generated data files and network access.', 'error');
      });
    },
    onQuickPrevious: () => archiveController.handleQuickPrevious().catch(() => {}),
    onQuickNext: () => archiveController.handleQuickNext().catch(() => {}),
    onQuickPickerChange: (event) => archiveController.handleQuickPickerChange(event).catch(() => {}),
    onOpenGallery: renderEffects.openGallery,
    onCloseGallery: renderEffects.closeGallery,
    onToggleMobileChrome: renderEffects.toggleMobileChrome,
    onToggleHeadline: renderEffects.toggleHeadline,
    onPointerDown: (event) => {
      if (event?.target?.closest?.('.topline, .now-chip, .gallery-dialog, button, a, summary')) return;
      renderEffects.markMobileChromeInteraction();
    },
    onScroll: () => {
      if (!isMobileViewport()) return;
      renderEffects.updateMobileChromeState();
    },
    onViewportChange: renderEffects.refreshViewportUi,
    onKeydown: (event) => {
      if (renderEffects.handleGalleryKeydown(event)) return true;
      return archiveController.handleKeyboardCommand(event);
    }
  }
});

startRuntimeShell({ init, onError: (error) => renderEffects.applyInitError(error) });
