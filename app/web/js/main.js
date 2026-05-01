import { createArtworkFetcher, loadManifestWithFallback } from './main-data.js';
import {
  clampManifestIndex,
  findActiveIndex,
  findManifestIndexByArtworkSlug,
  getNeighborFiles,
  syncQuickControls,
  wrapManifestIndex
} from './main-navigation.js';
import { createCaptureStateController } from './main-capture-state.js';
import { applyMotionMode as applyMotionModeUi, applyViewMode as applyViewModeUi, setFocusMode as setFocusModeUi } from './main-modes.js';
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

let scene = null;
let sceneInitError = null;
let sceneLoadPromise = null;
let deferredSceneObserver = null;
let deferredSceneIdleHandle = null;
let deferredSceneTimer = null;
let deferredSceneBootRequested = false;

let manifest = null;
let renderedArchiveCount = 0;
let activeFile = null;
let activeIndex = -1;
let manifestFallbackReason = '';
let viewMode = localStorage.getItem('rusty:view-mode') || 'story';
let focusMode = localStorage.getItem('rusty:focus-mode') === '1';
const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let motionMode = localStorage.getItem('rusty:motion-mode') || (prefersReducedMotion ? 'reduced' : 'full');
let loadToken = 0;
let headlineExpanded = false;
let adaptiveOverlayTimer = null;
let overlayProbeCanvas = null;
let overlayProbeCtx = null;
let smoothedOverlayLuma = null;
let currentArtworkLumaEstimate = null;
let quickPickerCompact = false;
let mobileChromePinned = false;
let mobileChromeExpanded = false;
let viewportRefreshTimer = null;

const fetchArtwork = createArtworkFetcher();
const captureStateController = createCaptureStateController({ captureMode });

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isMobileViewport() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function toLinearSrgb(channel) {
  const normalized = clamp(channel / 255, 0, 1);
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function rgbToLuma(r, g, b) {
  const rr = toLinearSrgb(r);
  const gg = toLinearSrgb(g);
  const bb = toLinearSrgb(b);
  return clamp((0.2126 * rr) + (0.7152 * gg) + (0.0722 * bb), 0, 1);
}

function parseColorToRgb(colorValue) {
  const raw = String(colorValue || '').trim();
  if (!raw) return null;

  const hexMatch = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return {
        r: Number.parseInt(hex[0] + hex[0], 16),
        g: Number.parseInt(hex[1] + hex[1], 16),
        b: Number.parseInt(hex[2] + hex[2], 16)
      };
    }
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16)
    };
  }

  const rgbMatch = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (!rgbMatch) return null;
  const parts = rgbMatch[1].split(',').map((part) => part.trim());
  if (parts.length < 3) return null;

  const parseChannel = (token) => {
    if (token.endsWith('%')) {
      const percent = Number.parseFloat(token.slice(0, -1));
      if (!Number.isFinite(percent)) return null;
      return clamp((percent / 100) * 255, 0, 255);
    }
    const numeric = Number.parseFloat(token);
    return Number.isFinite(numeric) ? clamp(numeric, 0, 255) : null;
  };

  const r = parseChannel(parts[0]);
  const g = parseChannel(parts[1]);
  const b = parseChannel(parts[2]);
  if (r == null || g == null || b == null) return null;
  return { r, g, b };
}

function parseColorToLuma(colorValue) {
  const rgb = parseColorToRgb(colorValue);
  if (!rgb) return null;
  return rgbToLuma(rgb.r, rgb.g, rgb.b);
}

function estimateArtworkLuma(art) {
  const palette = art?.scene?.palette || {};
  const weightedPalette = [
    { color: palette.bg, weight: 0.44 },
    { color: palette.primary, weight: 0.19 },
    { color: palette.secondary, weight: 0.17 },
    { color: palette.anchor, weight: 0.1 },
    { color: palette.glow, weight: 0.1 }
  ];

  let weighted = 0;
  let total = 0;

  weightedPalette.forEach(({ color, weight }) => {
    const luma = parseColorToLuma(color);
    if (luma == null) return;
    weighted += luma * weight;
    total += weight;
  });

  const baseLuma = total > 0 ? weighted / total : 0.46;
  const exposure = Number(art?.scene?.post?.exposure || 1);
  const exposureFactor = Number.isFinite(exposure) ? clamp(exposure, 0.75, 1.45) : 1;
  return clamp(baseLuma * exposureFactor, 0, 1);
}

function updateMobileChromeState() {
  if (captureMode || !isMobileViewport()) {
    document.body.classList.remove('mobile-chrome-compact', 'mobile-chrome-expanded');
    if (mobileChromeToggle) {
      mobileChromeToggle.hidden = true;
      mobileChromeToggle.setAttribute('aria-expanded', 'false');
    }
    mobileChromeExpanded = false;
    return;
  }

  if (window.scrollY > 28) {
    mobileChromePinned = true;
  }

  const shouldCompact = mobileChromePinned;
  document.body.classList.toggle('mobile-chrome-compact', shouldCompact);

  if (!shouldCompact) {
    mobileChromeExpanded = false;
  }

  document.body.classList.toggle('mobile-chrome-expanded', shouldCompact && mobileChromeExpanded);

  if (mobileChromeToggle) {
    mobileChromeToggle.hidden = !shouldCompact;
    mobileChromeToggle.textContent = mobileChromeExpanded ? 'Hide controls' : 'More controls';
    mobileChromeToggle.setAttribute('aria-expanded', mobileChromeExpanded ? 'true' : 'false');
  }
}

function markMobileChromeInteraction() {
  if (!isMobileViewport() || captureMode || mobileChromePinned) return;
  mobileChromePinned = true;
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
        syncQuickControls({ manifest, activeIndex, quickPrev, quickNext, quickPicker, quickPosition });
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
    headlineExpanded = false;
    heroNowHeadline.classList.remove('is-expanded');
    heroHeadlineToggle.hidden = true;
    heroHeadlineToggle.setAttribute('aria-expanded', 'false');
    return;
  }

  heroNowHeadline.classList.toggle('is-expanded', headlineExpanded);
  heroHeadlineToggle.hidden = false;
  heroHeadlineToggle.textContent = headlineExpanded ? 'Less' : 'More';
  heroHeadlineToggle.setAttribute('aria-expanded', headlineExpanded ? 'true' : 'false');
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
  const luma = sampledLuma ?? currentArtworkLumaEstimate ?? 0.46;

  smoothedOverlayLuma = smoothedOverlayLuma == null
    ? luma
    : (smoothedOverlayLuma * 0.74) + (luma * 0.26);

  const scrimTop = clamp(0.1 + smoothedOverlayLuma * 0.24, 0.1, 0.34);
  const scrimMid = clamp(0.52 + smoothedOverlayLuma * 0.38, 0.52, 0.9);
  const scrimBottom = clamp(0.66 + smoothedOverlayLuma * 0.28, 0.66, 0.94);
  const panelAlpha = clamp(0.6 + smoothedOverlayLuma * 0.3, 0.6, 0.93);
  const chipAlpha = clamp(0.74 + smoothedOverlayLuma * 0.24, 0.74, 0.97);

  document.body.style.setProperty('--overlay-scrim-top', scrimTop.toFixed(3));
  document.body.style.setProperty('--overlay-scrim-mid', scrimMid.toFixed(3));
  document.body.style.setProperty('--overlay-scrim-bottom', scrimBottom.toFixed(3));
  document.body.style.setProperty('--overlay-panel-alpha', panelAlpha.toFixed(3));
  document.body.style.setProperty('--overlay-chip-alpha', chipAlpha.toFixed(3));
}

function startAdaptiveOverlayLoop() {
  if (captureMode || adaptiveOverlayTimer != null) return;
  applyAdaptiveOverlay();
  adaptiveOverlayTimer = window.setInterval(applyAdaptiveOverlay, 1200);
}

async function ensureScene() {
  if (scene) return scene;
  if (sceneLoadPromise) return sceneLoadPromise;

  sceneLoadPromise = (async () => {
    try {
      const { ArtworkScene } = await import('./scene.js');
      scene = new ArtworkScene(canvas);
      sceneInitError = null;
      canvas.style.display = '';
      captureStateController.update({ sceneInitialized: true, sceneInitError: null, error: null });
      return scene;
    } catch (err) {
      sceneInitError = err instanceof Error ? err : new Error(String(err));
      canvas.style.display = 'none';
      captureStateController.update({
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

  if (deferredSceneIdleHandle != null && typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(deferredSceneIdleHandle);
  }
  deferredSceneIdleHandle = null;

  if (deferredSceneTimer != null) {
    clearTimeout(deferredSceneTimer);
    deferredSceneTimer = null;
  }
}

function syncRenderStatus() {
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
  return motionMode === 'reduced' ? 0.42 : 1;
}

async function applyActiveArtworkToScene() {
  if (!scene || !activeFile) return;
  const fileAtStart = activeFile;
  captureStateController.update({ activeFile: fileAtStart });
  const art = await fetchArtwork(fileAtStart);
  if (!scene || activeFile !== fileAtStart) return;
  captureStateController.update({ artworkLoaded: true, artworkId: art?.id || null });
  const applied = await scene.applyConfig(art);
  if (!applied) return;
  if (typeof scene.waitForRenderedFrame === 'function') {
    await scene.waitForRenderedFrame(3000);
  }
  captureStateController.update({
    sceneInitialized: true,
    sceneInitError: null,
    renderReady: true,
    error: null,
    renderedArtworkId: art?.id || null
  });
}

async function bootSceneNow() {
  clearDeferredSceneHooks();

  const loadedScene = await ensureScene();
  if (!loadedScene) {
    captureStateController.update({ renderReady: false, error: sceneInitError?.message || 'Scene initialization failed.' });
    syncRenderStatus();
    return null;
  }

  await applyActiveArtworkToScene();
  if (scene) {
    scene.setMotionIntensity(sceneMotionIntensity());
    if (captureMode) scene.setCaptureMode(true, 1.234);
  }
  applyAdaptiveOverlay();
  startAdaptiveOverlayLoop();
  syncRenderStatus();
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

  if (typeof IntersectionObserver !== 'undefined' && canvas) {
    deferredSceneObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        trigger();
      }
    }, { rootMargin: '120px' });
    deferredSceneObserver.observe(canvas);
  }

  if (typeof window.requestIdleCallback === 'function') {
    deferredSceneIdleHandle = window.requestIdleCallback(trigger, { timeout: 1800 });
  } else {
    deferredSceneTimer = window.setTimeout(trigger, 700);
  }
}

function showStatus(message = '', level = 'info') {
  showStatusUi(statusBanner, message, level);
}

function showFallback(message = '', showRetry = true) {
  showFallbackUi({ fallbackPanel, fallbackMessage, retryLoad }, message, showRetry);
}

function updateHeroNow(art) {
  updateHeroNowUi({ heroNowTitle, heroNowSub, heroNowHeadline }, art);
  headlineExpanded = false;
  updateHeadlineToggleState();
}

function updateArchiveCount() {
  updateArchiveCountUi(archiveCount, renderedArchiveCount, manifest);
}

function setLoading(isLoading) {
  setLoadingState({ artFirst, loadState, quickPicker, quickPrev, quickNext }, isLoading, manifest, activeIndex);
}

function populateQuickPicker() {
  if (!quickPicker || !manifest?.items) return;
  const selectedValue = activeIndex >= 0 ? String(activeIndex) : quickPicker.value;
  quickPickerCompact = isMobileViewport();
  populateQuickPickerUi(quickPicker, manifest, { compact: quickPickerCompact });

  if (selectedValue && quickPicker.querySelector(`option[value="${selectedValue}"]`)) {
    quickPicker.value = selectedValue;
  }
}

function applyViewMode(nextMode) {
  viewMode = applyViewModeUi(nextMode, { modeStory, modeLab, metaModeStory, metaModeLab });
}

function setFocusMode(enabled) {
  focusMode = setFocusModeUi(enabled, { modeFocus });
}

function applyMotionMode(nextMode) {
  motionMode = applyMotionModeUi(nextMode, {
    modeReducedMotion,
    onMotionChange: () => scene?.setMotionIntensity(sceneMotionIntensity())
  });
}

function renderMeta(art) {
  renderMetaUi(meta, art, sceneInitError);
}

function refreshActiveArchiveItem() {
  archiveList.querySelectorAll('li[data-file]').forEach((li) => {
    const isActive = li.dataset.file === activeFile;
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

    if (scene) {
      const applied = await scene.applyConfig(art);
      if (!applied || token !== loadToken) return;
      if (captureMode && typeof scene.waitForRenderedFrame === 'function') {
        await scene.waitForRenderedFrame(3000);
      }
      captureStateController.update({
        sceneInitialized: true,
        sceneInitError: null,
        renderReady: true,
        error: null,
        renderedArtworkId: art?.id || null
      });
    }
    renderMeta(art);
    updateHeroNow(art);
    activeFile = file;
    activeIndex = findActiveIndex(manifest, file);

    if (!scene && !captureMode) requestDeferredSceneBoot();

    const { prevFile, nextFile } = getNeighborFiles(manifest, activeIndex);
    if (prevFile) fetchArtwork(prevFile);
    if (nextFile) fetchArtwork(nextFile);

    showFallback('');
    refreshActiveArchiveItem();
    syncQuickControls({ manifest, activeIndex, quickPrev, quickNext, quickPicker, quickPosition });
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
  if (file === activeFile) return Promise.resolve();
  return loadArtworkByFile(file);
}

function loadArtworkByStep(step) {
  const current = wrapManifestIndex(manifest, activeIndex);
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
  activeFile = null;
  activeIndex = -1;
  headlineExpanded = false;
  currentArtworkLumaEstimate = null;
  smoothedOverlayLuma = null;
  mobileChromeExpanded = false;
  archiveList.innerHTML = '';
  if (quickPicker) quickPicker.innerHTML = '';
  if (quickPosition) quickPosition.textContent = '';
  updateHeadlineToggleState();
  if (loadMoreButton) loadMoreButton.style.display = 'inline-flex';
  showFallback('');
}

async function init() {
  clearDeferredSceneHooks();
  deferredSceneBootRequested = false;
  manifestFallbackReason = '';
  mobileChromePinned = isMobileViewport() && window.scrollY > 28;
  mobileChromeExpanded = false;

  if (captureMode) {
    captureStateController.reset();
  }

  if (captureMode) {
    document.body.classList.add('capture-mode');
  }

  applyViewMode(forcedView === 'lab' ? 'lab' : viewMode);
  setFocusMode(captureMode ? false : focusMode);
  applyMotionMode(captureMode ? 'reduced' : motionMode);
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

  const defaultIndex = Math.max(0, manifest.items.length - 1);
  const slugIndex = findManifestIndexByArtworkSlug(manifest, requestedArtworkSlug);
  const targetIndex = slugIndex != null
    ? slugIndex
    : requestedIndex == null || Number.isNaN(requestedIndex)
      ? defaultIndex
      : Math.max(0, requestedIndex);
  await loadArtworkByIndex(targetIndex);

  if (captureMode) {
    await bootSceneNow();
  } else {
    requestDeferredSceneBoot();
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
  modeFocus.addEventListener('click', () => setFocusMode(!focusMode));
}

if (modeReducedMotion) {
  modeReducedMotion.addEventListener('click', () => applyMotionMode(motionMode === 'reduced' ? 'full' : 'reduced'));
}

if (mobileChromeToggle) {
  mobileChromeToggle.addEventListener('click', () => {
    mobileChromeExpanded = !mobileChromeExpanded;
    updateMobileChromeState();
  });
}

if (heroHeadlineToggle) {
  heroHeadlineToggle.addEventListener('click', () => {
    headlineExpanded = !headlineExpanded;
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
    setFocusMode(!focusMode);
    return;
  }

  if (event.key.toLowerCase() === 'i') {
    event.preventDefault();
    applyViewMode(viewMode === 'story' ? 'lab' : 'story');
    return;
  }

  if (event.key.toLowerCase() === 'm') {
    event.preventDefault();
    applyMotionMode(motionMode === 'reduced' ? 'full' : 'reduced');
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
  captureStateController.update({ renderReady: false, error: err.message || String(err) });
});
