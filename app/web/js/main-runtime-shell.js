import { resolveCaptureTargetFromSearchParams } from './contracts/capture-target-contract.js';
import { readArtworkRouteFromLocation } from './contracts/public-artwork-routes.js';
import {
  resolvePostProcessingRequestFromSearchParams,
  resolveRendererRequestFromSearchParams
} from './renderer-mode-request.js';

export const MOBILE_BREAKPOINT = 700;

export function resolveRuntimeShellOptions({
  windowRef = window,
  storage = localStorage,
  storageKeys = {
    motionMode: 'rusty:motion-mode'
  },
  breakpoint = MOBILE_BREAKPOINT
} = {}) {
  const captureRoute = resolveCaptureTargetFromSearchParams(windowRef.location?.search || '');
  const artworkRoute = readArtworkRouteFromLocation(windowRef.location);
  const rendererRequest = resolveRendererRequestFromSearchParams(windowRef.location?.search || '');
  const postProcessingRequest = resolvePostProcessingRequestFromSearchParams(windowRef.location?.search || '');
  return {
    captureMode: captureRoute.captureMode,
    captureProfile: captureRoute.captureProfile,
    requestedIndex: captureRoute.requestedIndex ?? artworkRoute.index,
    requestedArtworkSlug: captureRoute.requestedArtworkSlug || artworkRoute.slug,
    captureTarget: captureRoute.target,
    rendererRequest,
    postProcessingRequest,
    prefersReducedMotion: windowRef.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    storedMotionMode: storage.getItem(storageKeys.motionMode),
    isMobileViewport: () => windowRef.innerWidth <= breakpoint,
    getScrollY: () => windowRef.scrollY || 0
  };
}

export function queryRuntimeDomRefs(documentRef = document) {
  const galleryTrigger = documentRef.getElementById('gallery-trigger');
  return {
    artFirst: documentRef.querySelector('.art-first'),
    canvas: documentRef.getElementById('art-canvas'),
    meta: documentRef.getElementById('meta'),
    archiveList: documentRef.getElementById('archive-list'),
    loadMoreButton: documentRef.getElementById('load-more'),
    heroNowTitle: documentRef.getElementById('hero-now-title'),
    heroNowSub: documentRef.getElementById('hero-now-sub'),
    heroNowHeadline: documentRef.getElementById('hero-now-headline'),
    archiveCount: documentRef.getElementById('archive-count'),
    quickPrev: documentRef.getElementById('quick-prev'),
    quickNext: documentRef.getElementById('quick-next'),
    quickPicker: galleryTrigger,
    galleryTrigger,
    galleryDialog: documentRef.getElementById('gallery-dialog'),
    galleryClose: documentRef.getElementById('gallery-close'),
    galleryList: documentRef.getElementById('gallery-list'),
    quickPosition: documentRef.getElementById('quick-position'),
    loadState: documentRef.getElementById('load-state'),
    sceneProgress: documentRef.getElementById('scene-progress'),
    sceneProgressBar: documentRef.getElementById('scene-progress-bar'),
    sceneProgressLabel: documentRef.getElementById('scene-progress-label'),
    statusBanner: documentRef.getElementById('status-banner'),
    fallbackPanel: documentRef.getElementById('fallback-panel'),
    fallbackMessage: documentRef.getElementById('fallback-message'),
    retryLoad: documentRef.getElementById('retry-load'),
    storyContextPanel: documentRef.getElementById('story-context-panel'),
    storyToggle: documentRef.getElementById('story-toggle'),
    heroHeadlineToggle: documentRef.getElementById('hero-headline-toggle'),
    mobileChromeToggle: documentRef.getElementById('mobile-chrome-toggle')
  };
}

function addRuntimeShellBinding(bindings, facts, target, type, handler, options) {
  if (!target?.addEventListener) return;
  target.addEventListener(type, handler, options);
  bindings.push({ target, type, handler, options });
  facts.push({ targetId: target.id || target.nodeName || 'runtime-target', type, passive: Boolean(options?.passive) });
}

export function installRuntimeShellEventBindings({
  refs = {},
  documentRef = document,
  windowRef = window,
  actions = {}
} = {}) {
  const bindings = [];
  const facts = [];
  const {
    loadMoreButton,
    retryLoad,
    quickPrev,
    quickNext,
    quickPicker,
    galleryTrigger = quickPicker,
    galleryDialog,
    galleryClose,
    mobileChromeToggle,
    storyToggle,
    heroHeadlineToggle
  } = refs;

  addRuntimeShellBinding(bindings, facts, loadMoreButton, 'click', () => actions.onLoadMore?.());
  addRuntimeShellBinding(bindings, facts, retryLoad, 'click', () => actions.onRetryLoad?.());
  addRuntimeShellBinding(bindings, facts, quickPrev, 'click', () => actions.onQuickPrevious?.());
  addRuntimeShellBinding(bindings, facts, quickNext, 'click', () => actions.onQuickNext?.());
  if (quickPicker && quickPicker !== galleryTrigger) {
    addRuntimeShellBinding(bindings, facts, quickPicker, 'change', (event) => actions.onQuickPickerChange?.(event));
  }
  addRuntimeShellBinding(bindings, facts, galleryTrigger, 'click', () => actions.onOpenGallery?.());
  addRuntimeShellBinding(bindings, facts, galleryClose, 'click', () => actions.onCloseGallery?.());
  addRuntimeShellBinding(bindings, facts, galleryDialog, 'click', (event) => {
    if (event.target === galleryDialog) actions.onCloseGallery?.();
  });
  addRuntimeShellBinding(bindings, facts, mobileChromeToggle, 'click', () => actions.onToggleMobileChrome?.());
  addRuntimeShellBinding(bindings, facts, storyToggle, 'click', () => actions.onToggleStoryContext?.());
  addRuntimeShellBinding(bindings, facts, heroHeadlineToggle, 'click', () => actions.onToggleHeadline?.());

  addRuntimeShellBinding(bindings, facts, documentRef, 'pointerdown', (event) => actions.onPointerDown?.(event), { passive: true });
  addRuntimeShellBinding(bindings, facts, documentRef, 'wheel', (event) => actions.onWheel?.(event), { passive: false, capture: true });
  addRuntimeShellBinding(bindings, facts, documentRef, 'keydown', (event) => actions.onKeydown?.(event));
  addRuntimeShellBinding(bindings, facts, windowRef, 'popstate', (event) => actions.onPopState?.(event));
  addRuntimeShellBinding(bindings, facts, windowRef, 'resize', () => actions.onViewportChange?.());
  addRuntimeShellBinding(bindings, facts, windowRef, 'orientationchange', () => actions.onViewportChange?.());

  let disposed = false;
  return {
    facts,
    dispose() {
      if (disposed) return;
      disposed = true;
      bindings.splice(0).forEach(({ target, type, handler, options }) => {
        target.removeEventListener?.(type, handler, options);
      });
    },
    getFacts() {
      return {
        disposed,
        bindingCount: bindings.length,
        bindings: facts.slice()
      };
    }
  };
}

export function bindRuntimeShellEvents(options = {}) {
  return installRuntimeShellEventBindings(options);
}

export function startRuntimeShell({ init, onError } = {}) {
  return Promise.resolve()
    .then(() => init())
    .catch((error) => onError?.(error));
}
