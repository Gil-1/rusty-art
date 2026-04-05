export function createCaptureStateController({ captureMode = false, body = document.body, target = globalThis } = {}) {
  let state = null;

  function reset() {
    if (!captureMode) return;
    state = {
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      captureMode: true,
      manifestLoaded: false,
      manifestCount: 0,
      artworkLoaded: false,
      artworkId: null,
      sceneInitialized: false,
      sceneInitError: null,
      renderReady: false,
      error: null
    };
    target.__RUSTY_CAPTURE_STATE = state;
    body.dataset.captureReady = '0';
  }

  function update(patch = {}) {
    if (!captureMode || !state) return;
    state = {
      ...state,
      ...patch,
      updatedAt: new Date().toISOString()
    };
    target.__RUSTY_CAPTURE_STATE = state;
    if (state.renderReady) {
      body.dataset.captureReady = '1';
    }
  }

  return {
    reset,
    update
  };
}
