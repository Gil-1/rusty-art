import { resolveCaptureTargetFromSearchParams } from './contracts/capture-target-contract.js';
import {
  resolvePostProcessingRequestFromSearchParams,
  resolveRendererRequestFromSearchParams
} from './renderer-mode-request.js';

export const MOBILE_BREAKPOINT = 700;

export function resolveRuntimeShellOptions({
  windowRef = window,
  storage = localStorage,
  storageKeys = {
    viewMode: 'rusty:view-mode',
    focusMode: 'rusty:focus-mode',
    motionMode: 'rusty:motion-mode'
  },
  breakpoint = MOBILE_BREAKPOINT
} = {}) {
  const captureRoute = resolveCaptureTargetFromSearchParams(windowRef.location?.search || '');
  const rendererRequest = resolveRendererRequestFromSearchParams(windowRef.location?.search || '');
  const postProcessingRequest = resolvePostProcessingRequestFromSearchParams(windowRef.location?.search || '');
  return {
    captureMode: captureRoute.captureMode,
    forcedView: captureRoute.forcedView,
    requestedIndex: captureRoute.requestedIndex,
    requestedArtworkSlug: captureRoute.requestedArtworkSlug,
    captureTarget: captureRoute.target,
    rendererRequest,
    postProcessingRequest,
    prefersReducedMotion: windowRef.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    storedViewMode: storage.getItem(storageKeys.viewMode),
    storedFocusMode: storage.getItem(storageKeys.focusMode),
    storedMotionMode: storage.getItem(storageKeys.motionMode),
    isMobileViewport: () => windowRef.innerWidth <= breakpoint,
    getScrollY: () => windowRef.scrollY || 0
  };
}

export function queryRuntimeDomRefs(documentRef = document) {
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
    quickPicker: documentRef.getElementById('quick-picker'),
    quickPosition: documentRef.getElementById('quick-position'),
    loadState: documentRef.getElementById('load-state'),
    sceneProgress: documentRef.getElementById('scene-progress'),
    sceneProgressBar: documentRef.getElementById('scene-progress-bar'),
    sceneProgressLabel: documentRef.getElementById('scene-progress-label'),
    modeStory: documentRef.getElementById('mode-story'),
    modeLab: documentRef.getElementById('mode-lab'),
    modeFocus: documentRef.getElementById('mode-focus'),
    metaModeStory: documentRef.getElementById('meta-mode-story'),
    metaModeLab: documentRef.getElementById('meta-mode-lab'),
    statusBanner: documentRef.getElementById('status-banner'),
    fallbackPanel: documentRef.getElementById('fallback-panel'),
    fallbackMessage: documentRef.getElementById('fallback-message'),
    retryLoad: documentRef.getElementById('retry-load'),
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
    modeStory,
    modeLab,
    modeFocus,
    metaModeStory,
    metaModeLab,
    mobileChromeToggle,
    heroHeadlineToggle
  } = refs;

  addRuntimeShellBinding(bindings, facts, loadMoreButton, 'click', () => actions.onLoadMore?.());
  addRuntimeShellBinding(bindings, facts, retryLoad, 'click', () => actions.onRetryLoad?.());
  addRuntimeShellBinding(bindings, facts, quickPrev, 'click', () => actions.onQuickPrevious?.());
  addRuntimeShellBinding(bindings, facts, quickNext, 'click', () => actions.onQuickNext?.());
  addRuntimeShellBinding(bindings, facts, quickPicker, 'change', (event) => actions.onQuickPickerChange?.(event));
  addRuntimeShellBinding(bindings, facts, modeStory, 'click', () => actions.onViewMode?.('story'));
  addRuntimeShellBinding(bindings, facts, modeLab, 'click', () => actions.onViewMode?.('lab'));
  addRuntimeShellBinding(bindings, facts, metaModeStory, 'click', () => actions.onViewMode?.('story'));
  addRuntimeShellBinding(bindings, facts, metaModeLab, 'click', () => actions.onViewMode?.('lab'));
  addRuntimeShellBinding(bindings, facts, modeFocus, 'click', () => actions.onToggleFocus?.());
  addRuntimeShellBinding(bindings, facts, mobileChromeToggle, 'click', () => actions.onToggleMobileChrome?.());
  addRuntimeShellBinding(bindings, facts, heroHeadlineToggle, 'click', () => actions.onToggleHeadline?.());

  addRuntimeShellBinding(bindings, facts, documentRef, 'pointerdown', () => actions.onPointerDown?.(), { passive: true });
  addRuntimeShellBinding(bindings, facts, documentRef, 'keydown', (event) => actions.onKeydown?.(event));
  addRuntimeShellBinding(bindings, facts, windowRef, 'scroll', () => actions.onScroll?.(), { passive: true });
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
