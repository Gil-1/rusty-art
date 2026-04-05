export function applyViewMode(nextMode, { modeStory, modeLab, metaModeStory, metaModeLab, body = document.body, storage = localStorage } = {}) {
  const viewMode = nextMode === 'lab' ? 'lab' : 'story';
  body.dataset.viewMode = viewMode;
  storage.setItem('rusty:view-mode', viewMode);

  const storyOn = viewMode === 'story';
  if (modeStory) modeStory.setAttribute('aria-pressed', String(storyOn));
  if (modeLab) modeLab.setAttribute('aria-pressed', String(!storyOn));
  if (metaModeStory) metaModeStory.setAttribute('aria-pressed', String(storyOn));
  if (metaModeLab) metaModeLab.setAttribute('aria-pressed', String(!storyOn));

  return viewMode;
}

export function setFocusMode(enabled, { modeFocus, body = document.body, storage = localStorage } = {}) {
  const focusMode = Boolean(enabled);
  body.classList.toggle('focus-mode', focusMode);
  storage.setItem('rusty:focus-mode', focusMode ? '1' : '0');
  if (modeFocus) modeFocus.setAttribute('aria-pressed', String(focusMode));
  return focusMode;
}

export function applyMotionMode(nextMode, { modeReducedMotion, onMotionChange = null, body = document.body, storage = localStorage } = {}) {
  const motionMode = nextMode === 'reduced' ? 'reduced' : 'full';
  body.dataset.motionMode = motionMode;
  storage.setItem('rusty:motion-mode', motionMode);

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
