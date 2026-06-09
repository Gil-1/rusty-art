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
  captureProfile = null,
  rendererRequest = 'webgl-legacy',
  postProcessingRequest = 'webgl-glsl-post',
  captureStateController,
  fetchArtwork,
  getActiveFile,
  getMotionIntensity,
  importSceneModule = () => import('./scene.js'),
  importImmersiveWorldSceneModule = () => import('./immersive-world-scene.js'),
  importWebGPUProjectSceneModule = () => import('./webgpu-diagnostic-scene.js'),
  onSceneBooted = () => {},
  onSceneStatusChange = () => {},
  onSceneLoadProgress = () => {},
  onCanvasReplaced = () => {},
  windowRef = typeof window !== 'undefined' ? window : globalThis,
  navigatorRef = windowRef.navigator || (typeof navigator !== 'undefined' ? navigator : null),
  observerFactory = typeof IntersectionObserver !== 'undefined'
    ? (callback, options) => new IntersectionObserver(callback, options)
    : null,
  setTimeoutFn = windowRef.setTimeout?.bind(windowRef) || globalThis.setTimeout,
  clearTimeoutFn = windowRef.clearTimeout?.bind(windowRef) || globalThis.clearTimeout
} = {}) {
  let scene = null;
  let sceneKind = null;
  let sceneInitError = null;
  let sceneLoadPromise = null;
  let sceneLoadKind = null;
  let deferredSceneBootScheduler = null;
  let activeCanvas = canvas;

  function emitSceneProgress(progress, label, active = true) {
    onSceneLoadProgress({ active, hidden: !active, progress, label });
  }

  function setCanvasVisible(visible) {
    if (activeCanvas?.style) activeCanvas.style.display = visible ? '' : 'none';
  }

  function getScene() {
    return scene;
  }

  function getSceneKind() {
    return sceneKind;
  }

  function getSceneInitError() {
    return sceneInitError;
  }

  function getRendererDiagnostics() {
    return scene?.getRendererDiagnostics?.() || null;
  }

  function hasSceneLoadInFlight() {
    return Boolean(sceneLoadPromise);
  }

  function resolveSceneKind(art = null) {
    if (String(art?.artCreationMethod || '').trim() === 'webgpu-project-diagnostic-v1') {
      return 'webgpu-project-diagnostic-v1';
    }
    return String(art?.artCreationMethod || '').trim() === 'immersive-world-v1'
      ? 'immersive-world-v1'
      : 'legacy';
  }

  function replaceRendererCanvas() {
    const previousCanvas = activeCanvas;
    const documentRef = previousCanvas?.ownerDocument || windowRef.document || null;
    if (!previousCanvas || !documentRef?.createElement) return activeCanvas;

    const nextCanvas = typeof previousCanvas.cloneNode === 'function'
      ? previousCanvas.cloneNode(false)
      : documentRef.createElement('canvas');
    nextCanvas.width = previousCanvas.width || nextCanvas.width;
    nextCanvas.height = previousCanvas.height || nextCanvas.height;
    if (!nextCanvas.id && previousCanvas.id) nextCanvas.id = previousCanvas.id;
    if (!nextCanvas.className && previousCanvas.className) nextCanvas.className = previousCanvas.className;
    if (nextCanvas.style && previousCanvas.style?.display) nextCanvas.style.display = previousCanvas.style.display;

    if (typeof previousCanvas.replaceWith === 'function') {
      previousCanvas.replaceWith(nextCanvas);
    } else if (previousCanvas.parentNode?.replaceChild) {
      previousCanvas.parentNode.replaceChild(nextCanvas, previousCanvas);
    } else {
      return activeCanvas;
    }

    activeCanvas = nextCanvas;
    onCanvasReplaced(nextCanvas, previousCanvas);
    return activeCanvas;
  }

  function disposeScene({ replaceCanvas = false } = {}) {
    scene?.dispose?.();
    scene?.stop?.();
    scene = null;
    sceneKind = null;
    if (replaceCanvas) replaceRendererCanvas();
  }

  async function ensureScene({ art = null } = {}) {
    const targetSceneKind = resolveSceneKind(art);
    if (scene && sceneKind === targetSceneKind) {
      const canReuseScene = typeof scene.canRenderArtwork !== 'function'
        || scene.canRenderArtwork(art, {
          rendererRequest,
          postProcessingRequest,
          captureMode,
          navigatorRef
      });
      if (canReuseScene) return scene;
      disposeScene({ replaceCanvas: true });
    }
    if (sceneLoadPromise && sceneLoadKind === targetSceneKind) {
      await sceneLoadPromise;
      return ensureScene({ art });
    }
    if (sceneLoadPromise && sceneLoadKind !== targetSceneKind) {
      await sceneLoadPromise;
      return ensureScene({ art });
    }
    if (scene && sceneKind !== targetSceneKind) disposeScene({ replaceCanvas: true });
    sceneLoadKind = targetSceneKind;

    sceneLoadPromise = (async () => {
      try {
        emitSceneProgress(0.08, 'Preparing renderer');
        const module = targetSceneKind === 'webgpu-project-diagnostic-v1'
          ? await importWebGPUProjectSceneModule()
          : targetSceneKind === 'immersive-world-v1'
            ? await importImmersiveWorldSceneModule()
            : await importSceneModule();
        emitSceneProgress(0.24, 'Loading scene modules');
        const { ArtworkScene } = module;
        scene = new ArtworkScene(activeCanvas, {
          rendererRequest,
          postProcessingRequest,
          captureMode,
          captureProfile,
          art,
          sceneKind: targetSceneKind,
          navigatorRef,
          onLoadProgress: (event = {}) => {
            const progress = Number.isFinite(event.progress) ? event.progress : 0.5;
            emitSceneProgress(progress, event.label || 'Assembling scene');
          }
        });
        sceneKind = targetSceneKind;
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
        sceneLoadKind = null;
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
    if (!file || !shouldContinue()) return false;
    const activeScene = await ensureScene({ art });
    if (!activeScene || !shouldContinue()) return false;

    emitSceneProgress(0.38, 'Assembling artwork');
    captureStateController?.update({ artworkLoaded: true, artworkId: art?.id || null });
    let applied;
    try {
      applied = await activeScene.applyConfig(art);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      captureStateController?.update({
        renderReady: false,
        error: error.message,
        sceneAssemblyReport: error.sceneAssemblyReport || activeScene.getAssemblyReport?.() || null
      });
      emitSceneProgress(1, 'Scene failed', false);
      throw err;
    }
    if (!applied || !shouldContinue()) return false;

    emitSceneProgress(0.92, 'Rendering first frame');
    if (waitForRenderedFrame && typeof activeScene.waitForRenderedFrame === 'function') {
      await activeScene.waitForRenderedFrame(3000);
      if (!shouldContinue()) return false;
    }

    const rendererDiagnostics = activeScene.getRendererDiagnostics?.() || {};
    captureStateController?.update({
      sceneInitialized: true,
      sceneInitError: null,
      renderReady: true,
      error: null,
      renderedArtworkId: art?.id || null,
      rendererMode: rendererDiagnostics.rendererMode || null,
      rendererBackend: rendererDiagnostics.rendererBackend || null,
      selectedRendererMode: rendererDiagnostics.selectedRendererMode || null,
      selectedRendererBackend: rendererDiagnostics.selectedRendererBackend || null,
      actualRendererMode: rendererDiagnostics.actualRendererMode || null,
      actualRendererBackend: rendererDiagnostics.actualRendererBackend || null,
      rendererProof: rendererDiagnostics.rendererProof || null,
      rendererFallbackReason: rendererDiagnostics.rendererFallbackReason || null,
      outputColorTransformMode: rendererDiagnostics.outputColorTransformMode || null,
      compatibilityMode: rendererDiagnostics.compatibilityMode ?? null,
      requestedAntialias: rendererDiagnostics.requestedAntialias ?? null,
      requestedSamples: rendererDiagnostics.requestedSamples ?? null,
      currentSamples: rendererDiagnostics.currentSamples ?? null,
      effectiveSamples: rendererDiagnostics.effectiveSamples ?? null,
      samplesDegraded: rendererDiagnostics.samplesDegraded === true,
      outputBufferType: rendererDiagnostics.outputBufferType || null,
      textureFormatFacts: Array.isArray(rendererDiagnostics.textureFormatFacts) ? rendererDiagnostics.textureFormatFacts : [],
      sceneAssemblyReport: activeScene.getAssemblyReport?.() || null
    });
    emitSceneProgress(1, 'Scene ready', false);
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

    const activeFileAtStart = getActiveFile();
    let activeArtAtStart = null;
    if (activeFileAtStart) {
      try {
        activeArtAtStart = await fetchArtwork(activeFileAtStart);
      } catch {
        activeArtAtStart = null;
      }
    }

    const loadedScene = await ensureScene({ art: activeArtAtStart });
    if (!loadedScene) {
      captureStateController?.update({
        renderReady: false,
        error: sceneInitError?.message || 'Scene initialization failed.'
      });
      onSceneStatusChange();
      emitSceneProgress(1, 'Renderer unavailable', false);
      return null;
    }

    if (captureMode) loadedScene.setCaptureMode?.(true, 1.234, { captureProfile });
    if (activeFileAtStart && activeArtAtStart && getActiveFile() === activeFileAtStart) {
      captureStateController?.update({ activeFile: activeFileAtStart });
      await applyArtworkToScene({
        file: activeFileAtStart,
        art: activeArtAtStart,
        shouldContinue: () => Boolean(scene) && getActiveFile() === activeFileAtStart,
        waitForRenderedFrame: true
      });
    } else {
      await applyActiveArtworkToScene();
    }
    if (!captureMode) updateMotionIntensity();
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
    getSceneKind,
    getSceneInitError,
    getRendererDiagnostics,
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
