import {
  deriveMobileChromeState,
  markMobileChromeInteractionState,
  setHeadlineExpandedState,
  toggleMobileChromeExpandedState
} from './main-presentation-state.js';

const HEADLINE_CLAMP_THRESHOLD = 140;

function defaultBody() {
  return typeof document !== 'undefined' ? document.body : null;
}

function resolveViewportFlag(value) {
  return typeof value === 'function' ? Boolean(value()) : Boolean(value);
}

function setDisabled(element, disabled) {
  if (element) element.disabled = disabled;
}

function setDisplay(element, display) {
  if (element?.style) element.style.display = display;
}

export function applyMobileChromeEffects(state, {
  body = defaultBody(),
  mobileChromeToggle = null,
  captureMode = false,
  isMobileViewport = false,
  scrollY = 0
} = {}) {
  const mobileViewport = resolveViewportFlag(isMobileViewport);
  const nextState = deriveMobileChromeState(state, {
    captureMode,
    isMobileViewport: mobileViewport,
    scrollY
  });

  if (captureMode || !mobileViewport) {
    body?.classList?.remove?.('mobile-chrome-compact', 'mobile-chrome-expanded');
    if (mobileChromeToggle) {
      mobileChromeToggle.hidden = true;
      mobileChromeToggle.setAttribute?.('aria-expanded', 'false');
    }
    return nextState;
  }

  const shouldCompact = nextState.mobileChromeCompact;
  body?.classList?.toggle?.('mobile-chrome-compact', shouldCompact);
  body?.classList?.toggle?.('mobile-chrome-expanded', shouldCompact && nextState.mobileChromeExpanded);

  if (mobileChromeToggle) {
    mobileChromeToggle.hidden = nextState.mobileChromeToggleHidden;
    mobileChromeToggle.textContent = nextState.mobileChromeExpanded ? 'Hide controls' : 'More controls';
    mobileChromeToggle.setAttribute?.('aria-expanded', nextState.mobileChromeExpanded ? 'true' : 'false');
  }

  return nextState;
}

export function markMobileChromeInteractionEffects(state, options = {}) {
  const mobileViewport = resolveViewportFlag(options.isMobileViewport);
  const nextState = markMobileChromeInteractionState(state, {
    captureMode: options.captureMode,
    isMobileViewport: mobileViewport
  });

  return applyMobileChromeEffects(nextState, {
    ...options,
    isMobileViewport: mobileViewport
  });
}

export function toggleMobileChromeEffects(state, options = {}) {
  return applyMobileChromeEffects(toggleMobileChromeExpandedState(state), options);
}

export function applyHeadlineToggleEffects(state, {
  heroNowHeadline = null,
  heroHeadlineToggle = null,
  clampThreshold = HEADLINE_CLAMP_THRESHOLD
} = {}) {
  if (!heroNowHeadline || !heroHeadlineToggle) return state;

  const text = (heroNowHeadline.textContent || '').trim();
  const needsClamp = text.length > clampThreshold;

  if (!needsClamp) {
    const nextState = setHeadlineExpandedState(state, false);
    heroNowHeadline.classList?.remove?.('is-expanded');
    heroHeadlineToggle.hidden = true;
    heroHeadlineToggle.setAttribute?.('aria-expanded', 'false');
    return nextState;
  }

  heroNowHeadline.classList?.toggle?.('is-expanded', state.headlineExpanded);
  heroHeadlineToggle.hidden = false;
  heroHeadlineToggle.textContent = state.headlineExpanded ? 'Less' : 'More';
  heroHeadlineToggle.setAttribute?.('aria-expanded', state.headlineExpanded ? 'true' : 'false');
  return state;
}

export function toggleHeadlineExpandedEffects(state, options = {}) {
  return applyHeadlineToggleEffects(setHeadlineExpandedState(state, !state.headlineExpanded), options);
}

export function resetHeadlineExpandedEffects(state, options = {}) {
  return applyHeadlineToggleEffects(setHeadlineExpandedState(state, false), options);
}

export function resetChromeUiForBootEffects(state, {
  archiveList = null,
  quickPicker = null,
  quickPosition = null,
  heroNowHeadline = null,
  heroHeadlineToggle = null,
  loadMoreButton = null,
  showFallback = null
} = {}) {
  if (archiveList) archiveList.innerHTML = '';
  if (quickPicker) quickPicker.innerHTML = '';
  if (quickPosition) quickPosition.textContent = '';
  const nextState = applyHeadlineToggleEffects(state, { heroNowHeadline, heroHeadlineToggle });
  setDisplay(loadMoreButton, 'inline-flex');
  showFallback?.('', true);
  return nextState;
}

export function applyEmptyArchiveEffects(state, {
  refs = {},
  showStatus = null
} = {}) {
  const {
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
  } = refs;

  showStatus?.('No artwork available yet.', 'warning');
  if (meta) meta.textContent = 'No artwork generated yet. Run: pnpm run daily';
  if (heroNowTitle) heroNowTitle.textContent = 'No pieces yet';
  if (heroNowSub) heroNowSub.textContent = 'Run the daily pipeline to generate the first artwork.';
  if (heroNowHeadline) heroNowHeadline.textContent = 'Headline context unavailable.';
  const nextState = applyHeadlineToggleEffects(state, { heroNowHeadline, heroHeadlineToggle });
  if (archiveCount) archiveCount.textContent = '0/0 loaded';
  setDisabled(quickPicker, true);
  if (quickPosition) quickPosition.textContent = '0 / 0';
  setDisabled(quickPrev, true);
  setDisabled(quickNext, true);
  setDisplay(loadMoreButton, 'none');
  return nextState;
}

export function applyInitErrorEffects(state, {
  error,
  refs = {},
  showFallback = null,
  showStatus = null,
  captureStateController = null,
  sceneAssemblyReport = null
} = {}) {
  const {
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
  } = refs;
  const message = error?.message || String(error);

  if (meta) meta.textContent = `Error: ${message}`;
  if (heroNowTitle) heroNowTitle.textContent = 'Error while loading';
  if (heroNowSub) heroNowSub.textContent = message;
  if (heroNowHeadline) heroNowHeadline.textContent = 'Try retrying or regenerating data files.';
  const nextState = applyHeadlineToggleEffects(state, { heroNowHeadline, heroHeadlineToggle });
  setDisabled(quickPicker, true);
  if (quickPosition) quickPosition.textContent = '0 / 0';
  setDisabled(quickPrev, true);
  setDisabled(quickNext, true);
  setDisplay(loadMoreButton, 'none');
  showFallback?.(`Cannot initialize experience: ${message}`, true);
  showStatus?.('Initialization failed. See details below.', 'error');
  captureStateController?.update?.({
    renderReady: false,
    error: message,
    sceneAssemblyReport
  });
  return nextState;
}
