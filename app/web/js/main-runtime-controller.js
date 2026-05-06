export function createDeferredSceneBootScheduler({
  canvas = null,
  captureMode = false,
  bootSceneNow = () => {},
  hasScene = () => false,
  hasSceneLoadInFlight = () => false,
  windowRef = typeof window !== 'undefined' ? window : globalThis,
  observerFactory = typeof IntersectionObserver !== 'undefined'
    ? (callback, options) => new IntersectionObserver(callback, options)
    : null,
  setTimeoutFn = windowRef.setTimeout?.bind(windowRef) || globalThis.setTimeout,
  clearTimeoutFn = windowRef.clearTimeout?.bind(windowRef) || globalThis.clearTimeout,
  rootMargin = '120px',
  idleTimeoutMs = 1800,
  timerFallbackMs = 700
} = {}) {
  let observer = null;
  let idleHandle = null;
  let timer = null;
  let requested = false;
  let cancelled = false;
  let triggered = false;
  let triggerCount = 0;
  let lastTriggerSource = null;

  function hasBootStarted() {
    return Boolean(hasScene() || hasSceneLoadInFlight());
  }

  function clearScheduledHooks() {
    if (observer) {
      observer.disconnect?.();
      observer = null;
    }

    if (idleHandle != null && typeof windowRef.cancelIdleCallback === 'function') {
      windowRef.cancelIdleCallback(idleHandle);
    }
    idleHandle = null;

    if (timer != null) {
      clearTimeoutFn(timer);
      timer = null;
    }
  }

  function trigger(source) {
    if (cancelled || triggered || hasBootStarted()) return false;
    triggered = true;
    clearScheduledHooks();
    triggerCount += 1;
    lastTriggerSource = source;
    void bootSceneNow({ source });
    return true;
  }

  function request() {
    if (captureMode) {
      trigger('capture');
      return getFacts();
    }
    if (requested || hasBootStarted()) return getFacts();

    requested = true;
    cancelled = false;
    triggered = false;

    if (observerFactory && canvas) {
      observer = observerFactory((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trigger('intersection');
        }
      }, { rootMargin });
      observer?.observe?.(canvas);
    }

    if (typeof windowRef.requestIdleCallback === 'function') {
      idleHandle = windowRef.requestIdleCallback(() => trigger('idle'), { timeout: idleTimeoutMs });
    } else {
      timer = setTimeoutFn(() => trigger('timer'), timerFallbackMs);
    }

    return getFacts();
  }

  function reset() {
    clearScheduledHooks();
    requested = false;
    cancelled = false;
    triggered = false;
    return getFacts();
  }

  function cancel() {
    clearScheduledHooks();
    requested = false;
    cancelled = true;
    triggered = false;
    return getFacts();
  }

  function getFacts() {
    return {
      captureMode,
      requested,
      cancelled,
      triggered,
      hasObserver: Boolean(observer),
      hasIdleHandle: idleHandle != null,
      hasTimer: timer != null,
      triggerCount,
      lastTriggerSource,
      rootMargin,
      idleTimeoutMs,
      timerFallbackMs
    };
  }

  return {
    request,
    reset,
    cancel,
    clearScheduledHooks,
    getFacts
  };
}

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
  let deferredSceneBootScheduler = null;

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
    deferredSceneBootScheduler?.clearScheduledHooks();
  }

  function resetDeferredSceneBoot() {
    deferredSceneBootScheduler?.reset();
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
    return deferredSceneBootScheduler?.request();
  }

  deferredSceneBootScheduler = createDeferredSceneBootScheduler({
    canvas,
    captureMode,
    bootSceneNow,
    hasScene: () => Boolean(scene),
    hasSceneLoadInFlight: () => Boolean(sceneLoadPromise),
    windowRef,
    observerFactory,
    setTimeoutFn,
    clearTimeoutFn
  });

  return {
    getScene,
    getSceneInitError,
    hasSceneLoadInFlight,
    ensureScene,
    bootSceneNow,
    requestDeferredSceneBoot,
    clearDeferredSceneHooks,
    resetDeferredSceneBoot,
    getDeferredSceneBootFacts: () => deferredSceneBootScheduler?.getFacts(),
    applyActiveArtworkToScene,
    applyArtworkToScene,
    updateMotionIntensity
  };
}
