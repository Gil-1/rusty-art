import { createArtworkFetcher, loadManifestWithFallback } from './main-data.js';
import {
  clampManifestIndex,
  findActiveIndex,
  getNeighborFiles,
  syncQuickControls,
  wrapManifestIndex
} from './main-navigation.js';
import { findManifestIndexByArtworkSlug } from './public-artwork-routes.js';
import { createCaptureStateController } from './main-capture-state.js';
import { applyMotionMode as applyMotionModeUi, applyViewMode as applyViewModeUi, setFocusMode as setFocusModeUi } from './main-modes.js';
import {
  createInitialPresentationState,
  deriveMobileChromeState,
  markMobileChromeInteractionState,
  PRESENTATION_STORAGE_KEYS,
  resetPresentationBootState,
  selectInitialArtworkIndex,
  setActiveArtworkState,
  setFocusModeState,
  setHeadlineExpandedState,
  setMotionModeState,
  setViewModeState,
  toggleMobileChromeExpandedState
} from './main-presentation-state.js';
import { createRuntimeController } from './main-runtime-controller.js';
import {
  clamp,
  computeAdaptiveOverlayState,
  estimateArtworkLuma
} from './main-adaptive-overlay-controller.js';
import {
  createArchiveCardElement,
  populateQuickPicker as populateQuickPickerUi,
  renderMeta as renderMetaUi,
  setLoadingState,
  showFallback as showFallbackUi,
  showStatus as showStatusUi,
  updateArchiveCount as updateArchiveCountUi,
  updateHeroNow as updateHeroNowUi
} from './main-render.js';

const PAGE_SIZE = 12;

const query = new URLSearchParams(window.location.search);
const captureMode = query.get('capture') === '1';
const forcedView = query.get('view');
const requestedIndexParam = query.get('index');
const requestedIndex = requestedIndexParam == null ? null : Number.parseInt(requestedIndexParam, 10);
const requestedArtworkSlug = query.get('slug');

const artFirst = document.querySelector('.art-first');
const canvas = document.getElementById('art-canvas');
const meta = document.getElementById('meta');
const archiveList = document.getElementById('archive-list');
const loadMoreButton = document.getElementById('load-more');
const heroNowTitle = document.getElementById('hero-now-title');
const heroNowSub = document.getElementById('hero-now-sub');
const heroNowHeadline = document.getElementById('hero-now-headline');
const archiveCount = document.getElementById('archive-count');
const quickPrev = document.getElementById('quick-prev');
const quickNext = document.getElementById('quick-next');
const quickPicker = document.getElementById('quick-picker');
const quickPosition = document.getElementById('quick-position');
const loadState = document.getElementById('load-state');
const modeStory = document.getElementById('mode-story');
const modeLab = document.getElementById('mode-lab');
const modeFocus = document.getElementById('mode-focus');
const modeReducedMotion = document.getElementById('mode-reduced-motion');
const metaModeStory = document.getElementById('meta-mode-story');
const metaModeLab = document.getElementById('meta-mode-lab');
const statusBanner = document.getElementById('status-banner');
const fallbackPanel = document.getElementById('fallback-panel');
const fallbackMessage = document.getElementById('fallback-message');
const retryLoad = document.getElementById('retry-load');
const heroHeadlineToggle = document.getElementById('hero-headline-toggle');
const mobileChromeToggle = document.getElementById('mobile-chrome-toggle');

const MOBILE_BREAKPOINT = 700;

let manifest = null;
let renderedArchiveCount = 0;
let manifestFallbackReason = '';
const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let loadToken = 0;
let adaptiveOverlayTimer = null;
let overlayProbeCanvas = null;
let overlayProbeCtx = null;
let smoothedOverlayLuma = null;
let currentArtworkLumaEstimate = null;
let quickPickerCompact = false;
let viewportRefreshTimer = null;
let presentationState = createInitialPresentationState({
  storedViewMode: localStorage.getItem(PRESENTATION_STORAGE_KEYS.viewMode),
  storedFocusMode: localStorage.getItem(PRESENTATION_STORAGE_KEYS.focusMode),
  storedMotionMode: localStorage.getItem(PRESENTATION_STORAGE_KEYS.motionMode),
  prefersReducedMotion,
  captureMode,
  forcedView,
  isMobileViewport: isMobileViewport(),
  scrollY: window.scrollY
});

const fetchArtwork = createArtworkFetcher();
const captureStateController = createCaptureStateController({ captureMode });
const runtimeController = createRuntimeController({
  canvas,
  captureMode,
  captureStateController,
  fetchArtwork,
  getActiveFile: () => presentationState.activeFile,
  getMotionIntensity: () => sceneMotionIntensity(),
  onSceneBooted: () => {
    applyAdaptiveOverlay();
    startAdaptiveOverlayLoop();
  },
  onSceneStatusChange: () => syncRenderStatus()
});

function isMobileViewport() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function updateMobileChromeState() {
  presentationState = deriveMobileChromeState(presentationState, {
    captureMode,
    isMobileViewport: isMobileViewport(),
    scrollY: window.scrollY
  });

  if (captureMode || !isMobileViewport()) {
    document.body.classList.remove('mobile-chrome-compact', 'mobile-chrome-expanded');
    if (mobileChromeToggle) {
      mobileChromeToggle.hidden = true;
      mobileChromeToggle.setAttribute('aria-expanded', 'false');
    }
    return;
  }

  const shouldCompact = presentationState.mobileChromeCompact;
  document.body.classList.toggle('mobile-chrome-compact', shouldCompact);
  document.body.classList.toggle('mobile-chrome-expanded', shouldCompact && presentationState.mobileChromeExpanded);

  if (mobileChromeToggle) {
    mobileChromeToggle.hidden = presentationState.mobileChromeToggleHidden;
    mobileChromeToggle.textContent = presentationState.mobileChromeExpanded ? 'Hide controls' : 'More controls';
    mobileChromeToggle.setAttribute('aria-expanded', presentationState.mobileChromeExpanded ? 'true' : 'false');
  }
}

function markMobileChromeInteraction() {
  presentationState = markMobileChromeInteractionState(presentationState, {
    captureMode,
    isMobileViewport: isMobileViewport()
  });
  updateMobileChromeState();
}

function refreshViewportUi() {
  if (viewportRefreshTimer != null) {
    clearTimeout(viewportRefreshTimer);
  }

  viewportRefreshTimer = window.setTimeout(() => {
    viewportRefreshTimer = null;
    if (manifest?.items?.length) {
      const shouldCompactPicker = isMobileViewport();
      if (shouldCompactPicker !== quickPickerCompact) {
        populateQuickPicker();
        syncQuickControls({ manifest, activeIndex: presentationState.activeIndex, quickPrev, quickNext, quickPicker, quickPosition });
      }
    }
    updateMobileChromeState();
  }, 120);
}

function updateHeadlineToggleState() {
  if (!heroNowHeadline || !heroHeadlineToggle) return;
  const text = (heroNowHeadline.textContent || '').trim();
  const needsClamp = text.length > 140;

  if (!needsClamp) {
    presentationState = setHeadlineExpandedState(presentationState, false);
    heroNowHeadline.classList.remove('is-expanded');
    heroHeadlineToggle.hidden = true;
    heroHeadlineToggle.setAttribute('aria-expanded', 'false');
    return;
  }

  heroNowHeadline.classList.toggle('is-expanded', presentationState.headlineExpanded);
  heroHeadlineToggle.hidden = false;
  heroHeadlineToggle.textContent = presentationState.headlineExpanded ? 'Less' : 'More';
  heroHeadlineToggle.setAttribute('aria-expanded', presentationState.headlineExpanded ? 'true' : 'false');
}

function ensureOverlayProbe() {
  if (overlayProbeCtx) return overlayProbeCtx;
  overlayProbeCanvas = document.createElement('canvas');
  overlayProbeCanvas.width = 36;
  overlayProbeCanvas.height = 24;
  overlayProbeCtx = overlayProbeCanvas.getContext('2d', { willReadFrequently: true });
  return overlayProbeCtx;
}

function sampleCanvasLuma() {
  if (!canvas || canvas.width <= 0 || canvas.height <= 0 || canvas.style.display === 'none') return null;
  const ctx = ensureOverlayProbe();
  if (!ctx) return null;

  let data;
  try {
    ctx.clearRect(0, 0, overlayProbeCanvas.width, overlayProbeCanvas.height);
    ctx.drawImage(canvas, 0, 0, overlayProbeCanvas.width, overlayProbeCanvas.height);
    ({ data } = ctx.getImageData(0, 0, overlayProbeCanvas.width, overlayProbeCanvas.height));
  } catch {
    return null;
  }

  if (!data.length) return null;

  let weighted = 0;
  let totalWeight = 0;
  let visiblePixels = 0;
  const pixelCount = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    const x = pixel % overlayProbeCanvas.width;
    const y = Math.floor(pixel / overlayProbeCanvas.width);
    const alpha = data[i + 3] / 255;
    if (alpha <= 0.025) continue;
    const nx = (x / Math.max(1, overlayProbeCanvas.width - 1)) - 0.5;
    const ny = (y / Math.max(1, overlayProbeCanvas.height - 1)) - 0.5;
    const centerBias = 1 - Math.min(1, Math.sqrt((nx * nx * 1.2) + (ny * ny)) * 1.2);
    const weight = (0.45 + centerBias * 0.55) * alpha;
    const lum = (data[i] + data[i + 1] + data[i + 2]) / (255 * 3);
    weighted += lum * weight;
    totalWeight += weight;
    visiblePixels += 1;
  }

  if (visiblePixels < pixelCount * 0.12 || totalWeight <= 0) return null;
  return clamp(weighted / totalWeight, 0, 1);
}

function applyAdaptiveOverlay() {
  if (captureMode) return;
  const sampledLuma = sampleCanvasLuma();
  const overlayState = computeAdaptiveOverlayState({
    sampledLuma,
    estimatedLuma: currentArtworkLumaEstimate,
    previousSmoothedLuma: smoothedOverlayLuma
  });
  smoothedOverlayLuma = overlayState.smoothedLuma;

  Object.entries(overlayState.cssVariables).forEach(([name, value]) => {
    document.body.style.setProperty(name, value.toFixed(3));
  });
}

function startAdaptiveOverlayLoop() {
  if (captureMode || adaptiveOverlayTimer != null) return;
  applyAdaptiveOverlay();
  adaptiveOverlayTimer = window.setInterval(applyAdaptiveOverlay, 1200);
}

function syncRenderStatus() {
  const sceneInitError = runtimeController.getSceneInitError();
  const sceneWarning = sceneInitError
    ? `Renderer unavailable (${sceneInitError.message}). Metadata view still works.`
    : '';

  if (manifestFallbackReason && sceneWarning) {
    showStatus(`${manifestFallbackReason} ${sceneWarning}`, 'warning');
    return;
  }
  if (manifestFallbackReason) {
    showStatus(manifestFallbackReason, 'warning');
    return;
  }
  if (sceneWarning) {
    showStatus(sceneWarning, 'warning');
    return;
  }
  showStatus('');
}

function sceneMotionIntensity() {
  return presentationState.motionMode === 'reduced' ? 0.42 : 1;
}

function showStatus(message = '', level = 'info') {
  showStatusUi(statusBanner, message, level);
}

function showFallback(message = '', showRetry = true) {
  showFallbackUi({ fallbackPanel, fallbackMessage, retryLoad }, message, showRetry);
}

function updateHeroNow(art) {
  updateHeroNowUi({ heroNowTitle, heroNowSub, heroNowHeadline }, art);
  presentationState = setHeadlineExpandedState(presentationState, false);
  updateHeadlineToggleState();
}

function updateArchiveCount() {
  updateArchiveCountUi(archiveCount, renderedArchiveCount, manifest);
}

function setLoading(isLoading) {
  setLoadingState({ artFirst, loadState, quickPicker, quickPrev, quickNext }, isLoading, manifest, presentationState.activeIndex);
}

function populateQuickPicker() {
  if (!quickPicker || !manifest?.items) return;
  const selectedValue = presentationState.activeIndex >= 0 ? String(presentationState.activeIndex) : quickPicker.value;
  quickPickerCompact = isMobileViewport();
  populateQuickPickerUi(quickPicker, manifest, { compact: quickPickerCompact });

  if (selectedValue && quickPicker.querySelector(`option[value="${selectedValue}"]`)) {
    quickPicker.value = selectedValue;
  }
}

function applyViewMode(nextMode) {
  presentationState = setViewModeState(presentationState, nextMode);
  presentationState = setViewModeState(presentationState, applyViewModeUi(presentationState.viewMode, { modeStory, modeLab, metaModeStory, metaModeLab }));
}

function setFocusMode(enabled) {
  presentationState = setFocusModeState(presentationState, enabled);
  presentationState = setFocusModeState(presentationState, setFocusModeUi(presentationState.focusMode, { modeFocus }));
}

function applyMotionMode(nextMode) {
  presentationState = setMotionModeState(presentationState, nextMode);
  presentationState = setMotionModeState(presentationState, applyMotionModeUi(presentationState.motionMode, {
    modeReducedMotion,
    onMotionChange: () => runtimeController.updateMotionIntensity()
  }));
}

function renderMeta(art) {
  renderMetaUi(meta, art, runtimeController.getSceneInitError());
}

function refreshActiveArchiveItem() {
  archiveList.querySelectorAll('li[data-file]').forEach((li) => {
    const isActive = li.dataset.file === presentationState.activeFile;
    li.classList.toggle('active', isActive);
    li.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
}

async function loadArtworkByFile(file) {
  const token = ++loadToken;
  setLoading(true);

  try {
    const art = await fetchArtwork(file);
    if (token !== loadToken) return;

    currentArtworkLumaEstimate = estimateArtworkLuma(art);

    captureStateController.update({ artworkLoaded: true, artworkId: art?.id || null, renderReady: false });

    if (runtimeController.getScene()) {
      const applied = await runtimeController.applyArtworkToScene({
        file,
        art,
        shouldContinue: () => token === loadToken,
        waitForRenderedFrame: captureMode
      });
      if (!applied) return;
    }
    renderMeta(art);
    updateHeroNow(art);
    presentationState = setActiveArtworkState(presentationState, { file, index: findActiveIndex(manifest, file) });

    if (!runtimeController.getScene() && !captureMode) runtimeController.requestDeferredSceneBoot();

    const { prevFile, nextFile } = getNeighborFiles(manifest, presentationState.activeIndex);
    if (prevFile) fetchArtwork(prevFile);
    if (nextFile) fetchArtwork(nextFile);

    showFallback('');
    refreshActiveArchiveItem();
    syncQuickControls({ manifest, activeIndex: presentationState.activeIndex, quickPrev, quickNext, quickPicker, quickPosition });
    window.requestAnimationFrame(() => applyAdaptiveOverlay());
  } catch (error) {
    showFallback(`Could not load this artwork: ${error.message}`, true);
    showStatus('Artwork load failed. Retry or pick another archive card.', 'error');
    throw error;
  } finally {
    if (token === loadToken) setLoading(false);
  }
}

function loadArtworkByIndex(index) {
  const clamped = clampManifestIndex(manifest, index);
  if (clamped == null) return Promise.resolve();
  const file = manifest.items[clamped].file;
  if (file === presentationState.activeFile) return Promise.resolve();
  return loadArtworkByFile(file);
}

function loadArtworkByStep(step) {
  const current = wrapManifestIndex(manifest, presentationState.activeIndex);
  if (current == null) return Promise.resolve();
  const next = wrapManifestIndex(manifest, current + step);
  if (next == null) return Promise.resolve();
  return loadArtworkByIndex(next);
}

function appendArchiveItems() {
  if (!manifest?.items?.length) return;
  const start = renderedArchiveCount;
  const nextChunk = manifest.items.slice(start, start + PAGE_SIZE);

  nextChunk.forEach((item) => {
    const li = createArchiveCardElement(item, () => {
      loadArtworkByFile(item.file).catch(() => {});
    });
    archiveList.appendChild(li);
  });

  refreshActiveArchiveItem();

  renderedArchiveCount += nextChunk.length;
  updateArchiveCount();
  if (loadMoreButton) {
    loadMoreButton.style.display = renderedArchiveCount >= manifest.items.length ? 'none' : 'inline-flex';
  }
}

function resetUiForBoot() {
  renderedArchiveCount = 0;
  presentationState = setActiveArtworkState(presentationState, { file: null, index: -1 });
  presentationState = setHeadlineExpandedState(presentationState, false);
  currentArtworkLumaEstimate = null;
  smoothedOverlayLuma = null;
  presentationState = deriveMobileChromeState(
    setHeadlineExpandedState(presentationState, false),
    { captureMode, isMobileViewport: isMobileViewport(), scrollY: window.scrollY }
  );
  archiveList.innerHTML = '';
  if (quickPicker) quickPicker.innerHTML = '';
  if (quickPosition) quickPosition.textContent = '';
  updateHeadlineToggleState();
  if (loadMoreButton) loadMoreButton.style.display = 'inline-flex';
  showFallback('');
}

async function init() {
  runtimeController.resetDeferredSceneBoot();
  manifestFallbackReason = '';
  presentationState = resetPresentationBootState(presentationState, {
    isMobileViewport: isMobileViewport(),
    scrollY: window.scrollY
  });

  if (captureMode) {
    captureStateController.reset();
  }

  if (captureMode) {
    document.body.classList.add('capture-mode');
  }

  applyViewMode(presentationState.viewMode);
  setFocusMode(presentationState.focusMode);
  applyMotionMode(presentationState.motionMode);
  updateMobileChromeState();

  resetUiForBoot();
  showStatus('Loading archive…');

  const { manifest: nextManifest, fallback, fallbackReason } = await loadManifestWithFallback();
  manifest = nextManifest;
  manifestFallbackReason = fallback ? fallbackReason : '';
  captureStateController.update({ manifestLoaded: true, manifestCount: manifest.items.length });

  if (!manifest.items.length) {
    manifestFallbackReason = '';
    showStatus('No artwork available yet.', 'warning');
    meta.textContent = 'No artwork generated yet. Run: npm run daily';
    if (heroNowTitle) heroNowTitle.textContent = 'No pieces yet';
    if (heroNowSub) heroNowSub.textContent = 'Run the daily pipeline to generate the first artwork.';
    if (heroNowHeadline) heroNowHeadline.textContent = 'Headline context unavailable.';
    updateHeadlineToggleState();
    if (archiveCount) archiveCount.textContent = '0/0 loaded';
    if (quickPicker) quickPicker.disabled = true;
    if (quickPosition) quickPosition.textContent = '0 / 0';
    if (quickPrev) quickPrev.disabled = true;
    if (quickNext) quickNext.disabled = true;
    if (loadMoreButton) loadMoreButton.style.display = 'none';
    captureStateController.update({
      renderReady: false,
      error: 'No artwork available yet.'
    });
    return;
  }

  syncRenderStatus();

  populateQuickPicker();
  updateArchiveCount();

  const slugIndex = findManifestIndexByArtworkSlug(manifest, requestedArtworkSlug);
  const targetIndex = selectInitialArtworkIndex({ manifest, requestedIndex, slugIndex });
  await loadArtworkByIndex(targetIndex);

  if (captureMode) {
    await runtimeController.bootSceneNow();
  } else {
    runtimeController.requestDeferredSceneBoot();
    startAdaptiveOverlayLoop();
  }

  if (!captureMode) {
    appendArchiveItems();
  }
}

if (loadMoreButton) {
  loadMoreButton.addEventListener('click', appendArchiveItems);
}

if (retryLoad) {
  retryLoad.addEventListener('click', () => {
    init().catch((err) => {
      showFallback(`Still failing to load: ${err.message}`, true);
      showStatus('Retry failed. Check generated data files and network access.', 'error');
    });
  });
}

if (quickPrev) {
  quickPrev.addEventListener('click', () => {
    // Left arrow => older artwork in oldest-first ordering.
    loadArtworkByStep(-1).catch(() => {});
  });
}

if (quickNext) {
  quickNext.addEventListener('click', () => {
    // Right arrow => newer artwork in oldest-first ordering.
    loadArtworkByStep(1).catch(() => {});
  });
}

if (quickPicker) {
  quickPicker.addEventListener('change', (event) => {
    const nextIndex = Number(event.target.value);
    if (!Number.isNaN(nextIndex)) loadArtworkByIndex(nextIndex).catch(() => {});
  });
}

if (modeStory) {
  modeStory.addEventListener('click', () => applyViewMode('story'));
}

if (modeLab) {
  modeLab.addEventListener('click', () => applyViewMode('lab'));
}

if (metaModeStory) {
  metaModeStory.addEventListener('click', () => applyViewMode('story'));
}

if (metaModeLab) {
  metaModeLab.addEventListener('click', () => applyViewMode('lab'));
}

if (modeFocus) {
  modeFocus.addEventListener('click', () => setFocusMode(!presentationState.focusMode));
}

if (modeReducedMotion) {
  modeReducedMotion.addEventListener('click', () => applyMotionMode(presentationState.motionMode === 'reduced' ? 'full' : 'reduced'));
}

if (mobileChromeToggle) {
  mobileChromeToggle.addEventListener('click', () => {
    presentationState = toggleMobileChromeExpandedState(presentationState);
    updateMobileChromeState();
  });
}

if (heroHeadlineToggle) {
  heroHeadlineToggle.addEventListener('click', () => {
    presentationState = setHeadlineExpandedState(presentationState, !presentationState.headlineExpanded);
    updateHeadlineToggleState();
  });
}

document.addEventListener('pointerdown', () => {
  markMobileChromeInteraction();
}, { passive: true });

window.addEventListener('scroll', () => {
  if (!isMobileViewport()) return;
  updateMobileChromeState();
}, { passive: true });

window.addEventListener('resize', refreshViewportUi);
window.addEventListener('orientationchange', refreshViewportUi);

document.addEventListener('keydown', (event) => {
  const tag = event.target?.tagName;
  const isTypingContext =
    tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable;

  if (isTypingContext || captureMode) return;

  if (event.key.toLowerCase() === 'f') {
    event.preventDefault();
    setFocusMode(!presentationState.focusMode);
    return;
  }

  if (event.key.toLowerCase() === 'i') {
    event.preventDefault();
    applyViewMode(presentationState.viewMode === 'story' ? 'lab' : 'story');
    return;
  }

  if (event.key.toLowerCase() === 'm') {
    event.preventDefault();
    applyMotionMode(presentationState.motionMode === 'reduced' ? 'full' : 'reduced');
    return;
  }

  if (!manifest?.items?.length) return;

  const step = event.shiftKey ? 5 : 1;

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    loadArtworkByStep(-step).catch(() => {});
    return;
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    loadArtworkByStep(step).catch(() => {});
    return;
  }

  if (event.key === 'Home') {
    event.preventDefault();
    loadArtworkByIndex(0).catch(() => {});
    return;
  }

  if (event.key === 'End') {
    event.preventDefault();
    loadArtworkByIndex(manifest.items.length - 1).catch(() => {});
  }
});

init().catch((err) => {
  meta.textContent = `Error: ${err.message}`;
  if (heroNowTitle) heroNowTitle.textContent = 'Error while loading';
  if (heroNowSub) heroNowSub.textContent = err.message;
  if (heroNowHeadline) heroNowHeadline.textContent = 'Try retrying or regenerating data files.';
  updateHeadlineToggleState();
  if (quickPicker) quickPicker.disabled = true;
  if (quickPosition) quickPosition.textContent = '0 / 0';
  if (quickPrev) quickPrev.disabled = true;
  if (quickNext) quickNext.disabled = true;
  if (loadMoreButton) loadMoreButton.style.display = 'none';
  showFallback(`Cannot initialize experience: ${err.message}`, true);
  showStatus('Initialization failed. See details below.', 'error');
  captureStateController.update({
    renderReady: false,
    error: err.message || String(err),
    sceneAssemblyReport: err.sceneAssemblyReport || runtimeController.getScene()?.getAssemblyReport?.() || null
  });
});
