export const PRESENTATION_STORAGE_KEYS = {
  viewMode: 'rusty:view-mode',
  focusMode: 'rusty:focus-mode',
  motionMode: 'rusty:motion-mode'
};

export function createInitialPresentationState({
  storedViewMode = null,
  storedFocusMode = null,
  storedMotionMode = null,
  prefersReducedMotion = false,
  captureMode = false,
  forcedView = null,
  isMobileViewport = false,
  scrollY = 0
} = {}) {
  return {
    activeFile: null,
    activeIndex: -1,
    viewMode: forcedView === 'lab' ? 'lab' : storedViewMode === 'lab' ? 'lab' : 'story',
    focusMode: captureMode ? false : storedFocusMode === '1',
    motionMode: captureMode ? 'reduced' : storedMotionMode === 'reduced' ? 'reduced' : prefersReducedMotion ? 'reduced' : 'full',
    headlineExpanded: false,
    mobileChromePinned: Boolean(isMobileViewport && scrollY > 28),
    mobileChromeExpanded: false
  };
}

export function setActiveArtworkState(state, { file = null, index = -1 } = {}) {
  return { ...state, activeFile: file, activeIndex: index };
}

export function resetPresentationBootState(state, { isMobileViewport = false, scrollY = 0 } = {}) {
  return {
    ...state,
    activeFile: null,
    activeIndex: -1,
    headlineExpanded: false,
    mobileChromePinned: Boolean(isMobileViewport && scrollY > 28),
    mobileChromeExpanded: false
  };
}

export function setViewModeState(state, nextMode) {
  return { ...state, viewMode: nextMode === 'lab' ? 'lab' : 'story' };
}

export function setFocusModeState(state, enabled) {
  return { ...state, focusMode: Boolean(enabled) };
}

export function setMotionModeState(state, nextMode) {
  return { ...state, motionMode: nextMode === 'reduced' ? 'reduced' : 'full' };
}

export function setHeadlineExpandedState(state, expanded) {
  return { ...state, headlineExpanded: Boolean(expanded) };
}

export function selectInitialArtworkIndex({ manifest, requestedIndex = null, slugIndex = null } = {}) {
  if (!manifest?.items?.length) return null;
  if (slugIndex != null) return slugIndex;
  if (requestedIndex != null && !Number.isNaN(requestedIndex)) return Math.max(0, requestedIndex);

  if (Number.isInteger(manifest.activeLatestIndex) && manifest.activeLatestIndex >= 0) {
    return manifest.activeLatestIndex;
  }

  if (manifest.latestId) {
    const latestIndex = manifest.items.findIndex((item) => item?.id === manifest.latestId);
    if (latestIndex >= 0) return latestIndex;
  }

  return Math.max(0, manifest.items.length - 1);
}

export function deriveMobileChromeState(state, { captureMode = false, isMobileViewport = false, scrollY = 0 } = {}) {
  if (captureMode || !isMobileViewport) {
    return {
      ...state,
      mobileChromeExpanded: false,
      mobileChromeCompact: false,
      mobileChromeToggleHidden: true
    };
  }

  const mobileChromePinned = state.mobileChromePinned || scrollY > 28;
  const mobileChromeExpanded = mobileChromePinned ? state.mobileChromeExpanded : false;

  return {
    ...state,
    mobileChromePinned,
    mobileChromeExpanded,
    mobileChromeCompact: mobileChromePinned,
    mobileChromeToggleHidden: !mobileChromePinned
  };
}

export function markMobileChromeInteractionState(state, { captureMode = false, isMobileViewport = false } = {}) {
  if (!isMobileViewport || captureMode || state.mobileChromePinned) return state;
  return { ...state, mobileChromePinned: true };
}

export function toggleMobileChromeExpandedState(state) {
  return { ...state, mobileChromeExpanded: !state.mobileChromeExpanded };
}
