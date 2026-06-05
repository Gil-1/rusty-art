import { startAnalytics, trackAnalyticsPageView } from './analytics.js';
import {
  createArtworkFetcher,
  createBrowserJsonRequestAdapter,
  loadManifestWithFallback
} from './main-data.js';
import { createPublicArchiveRuntimeSession } from './public-archive-runtime-session.js';
import { createCaptureStateController } from './main-capture-state.js';
import {
  createInitialPresentationState,
  PRESENTATION_STORAGE_KEYS
} from './main-presentation-state.js';
import { createRuntimeController } from './main-runtime-controller.js';
import { createArtworkRouteHistoryController } from './main-artwork-route-history.js';
import { createPublicArtworkShareMetadataController } from './public-artwork-share-metadata.js';
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

function resolvePublicArchiveBaseHref(moduleUrl = import.meta.url) {
  try {
    const url = new URL(moduleUrl);
    const rootMatch = url.pathname.match(/^(.*\/)(?:assets|js)\/[^/]*$/);
    url.pathname = rootMatch ? rootMatch[1] : url.pathname.replace(/[^/]*$/, '');
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return './';
  }
}

const publicArchiveBaseHref = resolvePublicArchiveBaseHref();
const publicArchiveRequestAdapter = createBrowserJsonRequestAdapter({
  baseHref: publicArchiveBaseHref
});

startAnalytics();

function resetDocumentScroll(windowRef = window, documentRef = document) {
  try {
    if ('scrollRestoration' in windowRef.history) {
      windowRef.history.scrollRestoration = 'manual';
    }
  } catch {}
  if (documentRef?.documentElement) documentRef.documentElement.scrollTop = 0;
  if (documentRef?.body) documentRef.body.scrollTop = 0;
  windowRef.scrollTo?.(0, 0);
}

resetDocumentScroll();

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
  storyContextPanel,
  storyToggle,
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

const fetchArtwork = createArtworkFetcher({ requestAdapter: publicArchiveRequestAdapter });
const captureStateController = createCaptureStateController({ captureMode });
const artworkRouteHistory = createArtworkRouteHistoryController({ windowRef: window, captureMode });
const shareMetadataController = createPublicArtworkShareMetadataController({
  windowRef: window,
  documentRef: document,
  siteUrl: import.meta.env.PUBLIC_SITE_URL
});
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
    storyContextPanel,
    storyToggle,
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
  adaptiveOverlaySession,
  publicArchiveBaseHref
});

archiveController = createPublicArchiveRuntimeSession({
  pageSize: PAGE_SIZE,
  captureMode,
  requestedIndex,
  requestedArtworkSlug,
  loadManifest: () => loadManifestWithFallback({ requestAdapter: publicArchiveRequestAdapter }),
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
  createArchiveCardElement: (item, commandsOrActivate, options = {}) => createArchiveCardElement(item, commandsOrActivate, {
    ...options,
    baseHref: publicArchiveBaseHref
  }),
  onArtworkRouteChange: (routeChange) => artworkRouteHistory.syncLoadedArtworkRoute(routeChange),
  render: {
    ...renderEffects.render,
    updateShareMetadata: (change) => {
      const result = shareMetadataController.update(change);
      if (change?.routeAction && change.routeAction !== 'none') {
        trackAnalyticsPageView({
          windowRef: window,
          documentRef: document,
          context: result.metadata?.analytics || {}
        });
      }
      return result;
    }
  },
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

function isElementWithin(element, target) {
  return Boolean(element && target && (element === target || element.contains?.(target)));
}

function forwardWheelToCanvas(event) {
  if (!canvas || event?.target === canvas) return false;
  if (typeof WheelEvent !== 'function' || typeof canvas.dispatchEvent !== 'function') return false;

  canvas.dispatchEvent(new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    composed: true,
    deltaX: event.deltaX,
    deltaY: event.deltaY,
    deltaZ: event.deltaZ,
    deltaMode: event.deltaMode,
    clientX: event.clientX,
    clientY: event.clientY,
    screenX: event.screenX,
    screenY: event.screenY,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey
  }));
  return true;
}

function handleWheelRouting(event) {
  if (event?.target === canvas) return false;
  if (galleryDialog && !galleryDialog.hidden) {
    if (isElementWithin(galleryList, event?.target)) return false;
    event?.preventDefault?.();
    resetDocumentScroll();
    return true;
  }

  event?.preventDefault?.();
  resetDocumentScroll();
  forwardWheelToCanvas(event);
  return true;
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
    storyToggle,
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
    onToggleStoryContext: renderEffects.toggleStoryContext,
    onToggleHeadline: renderEffects.toggleHeadline,
    onPointerDown: (event) => {
      if (event?.target?.closest?.('.topline, .now-chip, .story-context-panel, .gallery-dialog, button, a, summary')) return;
      renderEffects.markMobileChromeInteraction();
    },
    onWheel: handleWheelRouting,
    onPopState: () => {
      if (captureMode) return false;
      return archiveController.loadArtworkFromRoute(artworkRouteHistory.readCurrentRoute(), { routeAction: 'popstate' }).catch((error) => {
        renderEffects.showStatus(`Could not restore artwork from browser history: ${error.message}`, 'error');
      });
    },
    onViewportChange: renderEffects.refreshViewportUi,
    onKeydown: (event) => {
      if (renderEffects.handleGalleryKeydown(event)) return true;
      if (renderEffects.handleStoryContextKeydown(event)) return true;
      return archiveController.handleKeyboardCommand(event);
    }
  }
});

startRuntimeShell({ init, onError: (error) => renderEffects.applyInitError(error) });
