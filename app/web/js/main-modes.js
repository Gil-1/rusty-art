import {
  PRESENTATION_STORAGE_KEYS,
  setMotionModeState
} from './main-presentation-state.js';

function defaultStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export function applyMotionMode(nextMode, {
  onMotionChange = null,
  storage = defaultStorage(),
  storageKeys = PRESENTATION_STORAGE_KEYS
} = {}) {
  const motionMode = nextMode === 'reduced' ? 'reduced' : 'full';
  storage?.setItem?.(storageKeys.motionMode, motionMode);

  if (typeof onMotionChange === 'function') {
    onMotionChange(motionMode);
  }

  return motionMode;
}

export function applyMotionModeEffects(state, nextMode, options = {}) {
  const requestedState = setMotionModeState(state, nextMode);
  return setMotionModeState(requestedState, applyMotionMode(requestedState.motionMode, options));
}
