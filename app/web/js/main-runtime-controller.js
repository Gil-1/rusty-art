export function createRuntimeController({
  canvas,
  captureMode = false,
  captureStateController,
  fetchArtwork,
  getActiveFile,
  getMotionIntensity,
  importSceneModule = () => import('./scene.js'),
  onSceneBooted = () => {},
  onSceneStatusChange = () => {},
  windowRef = typeof window !== 'undefined' ? window : globalThis,
  observerFactory = typeof IntersectionObserver !== 'undefined'
    ? (callback, options) => new IntersectionObserver(callback, options)
    : null,
  setTimeoutFn = windowRef.setTimeout?.bind(windowRef) || globalThis.setTimeout,
  clearTimeoutFn = windowRef.clearTimeout?.bind(windowRef) || globalThis.clearTimeout
} = {}) {
  let scene = null;
  let sceneInitError = null;
  let sceneLoadPromise = null;
  let deferredSceneObserver = null;
  let deferredSceneIdleHandle = null;
  let deferredSceneTimer = null;
  let deferredSceneBootRequested = false;

  function setCanvasVisible(visible) {
    if (canvas?.style) canvas.style.display = visible ? '' : 'none';
  }

  function getScene() {
    return scene;
  }

  function getSceneInitError() {
    return sceneInitError;
  }

  function hasSceneLoadInFlight() {
    return Boolean(sceneLoadPromise);
  }

  async function ensureScene() {
    if (scene) return scene;
    if (sceneLoadPromise) return sceneLoadPromise;

    sceneLoadPromise = (async () => {
      try {
        const { ArtworkScene } = await importSceneModule();
        scene = new ArtworkScene(canvas);
        sceneInitError = null;
        setCanvasVisible(true);
        captureStateController?.update({ sceneInitialized: true, sceneInitError: null, error: null });
        return scene;
      } catch (err) {
        sceneInitError = err instanceof Error ? err : new Error(String(err));
        setCanvasVisible(false);
        captureStateController?.update({
          sceneInitialized: false,
          sceneInitError: sceneInitError.message,
          renderReady: false,
          error: sceneInitError.message
        });
        return null;
      } finally {
        sceneLoadPromise = null;
      }
    })();

    return sceneLoadPromise;
  }

  function clearDeferredSceneHooks() {
    if (deferredSceneObserver) {
      deferredSceneObserver.disconnect();
      deferredSceneObserver = null;
    }

    if (deferredSceneIdleHandle != null && typeof windowRef.cancelIdleCallback === 'function') {
      windowRef.cancelIdleCallback(deferredSceneIdleHandle);
    }
    deferredSceneIdleHandle = null;

    if (deferredSceneTimer != null) {
      clearTimeoutFn(deferredSceneTimer);
      deferredSceneTimer = null;
    }
  }

  function resetDeferredSceneBoot() {
    clearDeferredSceneHooks();
    deferredSceneBootRequested = false;
  }

  function updateMotionIntensity() {
    scene?.setMotionIntensity?.(getMotionIntensity());
  }

  async function applyArtworkToScene({ file, art, shouldContinue = () => true, waitForRenderedFrame = captureMode } = {}) {
    if (!scene || !file || !shouldContinue()) return false;

    captureStateController?.update({ artworkLoaded: true, artworkId: art?.id || null });
    let applied;
    try {
      applied = await scene.applyConfig(art);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      captureStateController?.update({
        renderReady: false,
        error: error.message,
        sceneAssemblyReport: error.sceneAssemblyReport || scene.getAssemblyReport?.() || null
      });
      throw err;
    }
    if (!applied || !shouldContinue()) return false;

    if (waitForRenderedFrame && typeof scene.waitForRenderedFrame === 'function') {
      await scene.waitForRenderedFrame(3000);
      if (!shouldContinue()) return false;
    }

    captureStateController?.update({
      sceneInitialized: true,
      sceneInitError: null,
      renderReady: true,
      error: null,
      renderedArtworkId: art?.id || null,
      sceneAssemblyReport: scene.getAssemblyReport?.() || null
    });
    return true;
  }

  async function applyActiveArtworkToScene() {
    if (!scene) return false;
    const fileAtStart = getActiveFile();
    if (!fileAtStart) return false;

    captureStateController?.update({ activeFile: fileAtStart });
    const art = await fetchArtwork(fileAtStart);
    return applyArtworkToScene({
      file: fileAtStart,
      art,
      shouldContinue: () => Boolean(scene) && getActiveFile() === fileAtStart,
      waitForRenderedFrame: true
    });
  }

  async function bootSceneNow() {
    clearDeferredSceneHooks();

    const loadedScene = await ensureScene();
    if (!loadedScene) {
      captureStateController?.update({
        renderReady: false,
        error: sceneInitError?.message || 'Scene initialization failed.'
      });
      onSceneStatusChange();
      return null;
    }

    await applyActiveArtworkToScene();
    updateMotionIntensity();
    if (captureMode) loadedScene.setCaptureMode?.(true, 1.234);
    onSceneBooted();
    onSceneStatusChange();
    return loadedScene;
  }

  function requestDeferredSceneBoot() {
    if (captureMode) {
      void bootSceneNow();
      return;
    }
    if (deferredSceneBootRequested || scene || sceneLoadPromise) return;

    deferredSceneBootRequested = true;

    const trigger = () => {
      if (scene || sceneLoadPromise) return;
      void bootSceneNow();
    };

    if (observerFactory && canvas) {
      deferredSceneObserver = observerFactory((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trigger();
        }
      }, { rootMargin: '120px' });
      deferredSceneObserver?.observe?.(canvas);
    }

    if (typeof windowRef.requestIdleCallback === 'function') {
      deferredSceneIdleHandle = windowRef.requestIdleCallback(trigger, { timeout: 1800 });
    } else {
      deferredSceneTimer = setTimeoutFn(trigger, 700);
    }
  }

  return {
    getScene,
    getSceneInitError,
    hasSceneLoadInFlight,
    ensureScene,
    bootSceneNow,
    requestDeferredSceneBoot,
    clearDeferredSceneHooks,
    resetDeferredSceneBoot,
    applyActiveArtworkToScene,
    applyArtworkToScene,
    updateMotionIntensity
  };
}
