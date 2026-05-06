import {
  PRESENTATION_STORAGE_KEYS,
  setFocusModeState,
  setMotionModeState,
  setViewModeState
} from './main-presentation-state.js';

function defaultBody() {
  return typeof document !== 'undefined' ? document.body : null;
}

function defaultStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export function applyViewMode(nextMode, {
  modeStory,
  modeLab,
  metaModeStory,
  metaModeLab,
  body = defaultBody(),
  storage = defaultStorage(),
  storageKeys = PRESENTATION_STORAGE_KEYS
} = {}) {
  const viewMode = nextMode === 'lab' ? 'lab' : 'story';
  if (body?.dataset) body.dataset.viewMode = viewMode;
  storage?.setItem?.(storageKeys.viewMode, viewMode);

  const storyOn = viewMode === 'story';
  if (modeStory) modeStory.setAttribute('aria-pressed', String(storyOn));
  if (modeLab) modeLab.setAttribute('aria-pressed', String(!storyOn));
  if (metaModeStory) metaModeStory.setAttribute('aria-pressed', String(storyOn));
  if (metaModeLab) metaModeLab.setAttribute('aria-pressed', String(!storyOn));

  return viewMode;
}

export function setFocusMode(enabled, {
  modeFocus,
  body = defaultBody(),
  storage = defaultStorage(),
  storageKeys = PRESENTATION_STORAGE_KEYS
} = {}) {
  const focusMode = Boolean(enabled);
  body?.classList?.toggle?.('focus-mode', focusMode);
  storage?.setItem?.(storageKeys.focusMode, focusMode ? '1' : '0');
  if (modeFocus) modeFocus.setAttribute('aria-pressed', String(focusMode));
  return focusMode;
}

export function applyMotionMode(nextMode, {
  modeReducedMotion,
  onMotionChange = null,
  body = defaultBody(),
  storage = defaultStorage(),
  storageKeys = PRESENTATION_STORAGE_KEYS
} = {}) {
  const motionMode = nextMode === 'reduced' ? 'reduced' : 'full';
  if (body?.dataset) body.dataset.motionMode = motionMode;
  storage?.setItem?.(storageKeys.motionMode, motionMode);

  const reduced = motionMode === 'reduced';
  if (modeReducedMotion) {
    modeReducedMotion.setAttribute('aria-pressed', String(reduced));
    modeReducedMotion.textContent = reduced ? 'Motion: calm' : 'Calm motion';
  }

  if (typeof onMotionChange === 'function') {
    onMotionChange(motionMode);
  }

  return motionMode;
}

export function applyViewModeEffects(state, nextMode, options = {}) {
  const requestedState = setViewModeState(state, nextMode);
  return setViewModeState(requestedState, applyViewMode(requestedState.viewMode, options));
}

export function setFocusModeEffects(state, enabled, options = {}) {
  const requestedState = setFocusModeState(state, enabled);
  return setFocusModeState(requestedState, setFocusMode(requestedState.focusMode, options));
}

export function applyMotionModeEffects(state, nextMode, options = {}) {
  const requestedState = setMotionModeState(state, nextMode);
  return setMotionModeState(requestedState, applyMotionMode(requestedState.motionMode, options));
}
