export const CAPTURE_READINESS_GLOBAL = '__RUSTY_CAPTURE_STATE';
export const CAPTURE_READINESS_REFRESH_GLOBAL = '__RUSTY_REFRESH_CAPTURE_READINESS';
export const CAPTURE_CANVAS_ID = 'art-canvas';
export const CAPTURE_READY_DATASET_KEY = 'captureReady';
export const CAPTURE_READY_DATASET_VALUES = Object.freeze({
  pending: '0',
  ready: '1'
});

export const CAPTURE_PIXEL_THRESHOLDS = Object.freeze({
  probeWidth: 48,
  probeHeight: 48,
  luminanceMin: 6,
  dynamicRangeMin: 7,
  nonBlackPixelMin: 24
});

export const CAPTURE_READINESS_REASON_CODES = Object.freeze({
  stateMissing: 'capture-state-missing',
  renderReady: 'render-ready',
  pixelSignalReady: 'pixel-signal-ready',
  sceneInitError: 'scene-init-error',
  runtimeError: 'runtime-error',
  manifestPending: 'manifest-pending',
  artworkPending: 'artwork-pending',
  scenePending: 'scene-pending',
  renderPending: 'render-pending',
  canvasMissing: 'canvas-missing',
  canvasHidden: 'canvas-hidden',
  canvasUnsized: 'canvas-unsized',
  canvasContextMissing: 'canvas-context-missing',
  canvasProbeError: 'canvas-probe-error',
  pixelSignalPending: 'pixel-signal-pending'
});

export const CAPTURE_READINESS_PATCH_KEYS = Object.freeze([
  'manifestLoaded',
  'manifestCount',
  'artworkLoaded',
  'artworkId',
  'activeFile',
  'sceneInitialized',
  'sceneInitError',
  'sceneAssemblyReport',
  'renderReady',
  'renderedArtworkId',
  'error'
]);

const CAPTURE_READINESS_PATCH_KEY_SET = new Set(CAPTURE_READINESS_PATCH_KEYS);

export const CAPTURE_READINESS_DEFAULT_STATE = Object.freeze({
  captureMode: true,
  manifestLoaded: false,
  manifestCount: 0,
  artworkLoaded: false,
  artworkId: null,
  sceneInitialized: false,
  sceneInitError: null,
  sceneAssemblyReport: null,
  renderReady: false,
  error: null
});

function timestamp(value = null) {
  const normalized = String(value || '').trim();
  return normalized || new Date().toISOString();
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function errorText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeNullableString(value) {
  const text = String(value || '').trim();
  return text || null;
}

function normalizePixelThresholds(thresholds = CAPTURE_PIXEL_THRESHOLDS) {
  const source = isObject(thresholds) ? thresholds : {};
  return {
    probeWidth: Math.max(1, Math.floor(normalizeNumber(source.probeWidth, CAPTURE_PIXEL_THRESHOLDS.probeWidth))),
    probeHeight: Math.max(1, Math.floor(normalizeNumber(source.probeHeight, CAPTURE_PIXEL_THRESHOLDS.probeHeight))),
    luminanceMin: normalizeNumber(source.luminanceMin, CAPTURE_PIXEL_THRESHOLDS.luminanceMin),
    dynamicRangeMin: normalizeNumber(source.dynamicRangeMin, CAPTURE_PIXEL_THRESHOLDS.dynamicRangeMin),
    nonBlackPixelMin: Math.max(0, Math.floor(normalizeNumber(source.nonBlackPixelMin, CAPTURE_PIXEL_THRESHOLDS.nonBlackPixelMin)))
  };
}

function createReason(code, message, details = null) {
  return {
    code,
    message,
    details: isObject(details) ? details : null
  };
}

function isCanvasLike(value, view = null) {
  if (!value || typeof value !== 'object') return false;
  const CanvasCtor = view?.HTMLCanvasElement || globalThis.HTMLCanvasElement;
  if (typeof CanvasCtor === 'function' && value instanceof CanvasCtor) return true;
  return typeof value.getContext === 'function' && value.width != null && value.height != null;
}

function readCanvasStyle(canvas, view = null) {
  if (typeof view?.getComputedStyle === 'function') return view.getComputedStyle(canvas);
  if (typeof globalThis.getComputedStyle === 'function') return globalThis.getComputedStyle(canvas);
  return canvas?.style || {};
}

function createEmptyPixelProbe(options = {}) {
  const source = isObject(options) ? options : {};
  return {
    inspected: Boolean(source.inspected),
    ready: false,
    dynamicRange: null,
    nonBlack: null,
    minLuminance: null,
    maxLuminance: null,
    passesDynamicRange: false,
    passesNonBlack: false,
    thresholds: normalizePixelThresholds(source.thresholds),
    error: errorText(source.error)
  };
}

function normalizePixelProbeFacts(value = null) {
  if (!isObject(value)) return createEmptyPixelProbe();
  const thresholds = normalizePixelThresholds(value.thresholds);
  const dynamicRange = value.dynamicRange == null ? null : normalizeNumber(value.dynamicRange, 0);
  const nonBlack = value.nonBlack == null ? null : normalizeNumber(value.nonBlack, 0);
  const passesDynamicRange = dynamicRange != null && dynamicRange > thresholds.dynamicRangeMin;
  const passesNonBlack = nonBlack != null && nonBlack > thresholds.nonBlackPixelMin;
  return {
    inspected: Boolean(value.inspected),
    ready: Boolean(value.ready || (passesDynamicRange && passesNonBlack)),
    dynamicRange,
    nonBlack,
    minLuminance: value.minLuminance == null ? null : normalizeNumber(value.minLuminance, 0),
    maxLuminance: value.maxLuminance == null ? null : normalizeNumber(value.maxLuminance, 0),
    passesDynamicRange,
    passesNonBlack,
    thresholds,
    error: errorText(value.error)
  };
}

export function normalizeCaptureCanvasReadinessFacts(value = null) {
  if (!isObject(value)) {
    return {
      inspected: false,
      canvasId: CAPTURE_CANVAS_ID,
      present: false,
      visible: false,
      sized: false,
      width: null,
      height: null,
      pixelProbe: createEmptyPixelProbe(),
      error: null
    };
  }

  return {
    inspected: Boolean(value.inspected),
    canvasId: normalizeNullableString(value.canvasId) || CAPTURE_CANVAS_ID,
    present: Boolean(value.present),
    visible: Boolean(value.visible),
    sized: Boolean(value.sized),
    width: value.width == null ? null : normalizeNumber(value.width, 0),
    height: value.height == null ? null : normalizeNumber(value.height, 0),
    pixelProbe: normalizePixelProbeFacts(value.pixelProbe),
    error: errorText(value.error)
  };
}

export function collectCaptureCanvasReadinessFacts({
  documentRef = null,
  canvas = null,
  canvasId = CAPTURE_CANVAS_ID,
  thresholds = CAPTURE_PIXEL_THRESHOLDS
} = {}) {
  const normalizedThresholds = normalizePixelThresholds(thresholds);
  const view = documentRef?.defaultView || globalThis.window || globalThis;
  const resolvedCanvas = canvas || documentRef?.getElementById?.(canvasId) || null;
  const base = {
    inspected: true,
    canvasId,
    present: false,
    visible: false,
    sized: false,
    width: null,
    height: null,
    pixelProbe: createEmptyPixelProbe({ thresholds: normalizedThresholds }),
    error: null
  };

  if (!isCanvasLike(resolvedCanvas, view)) {
    return {
      ...base,
      error: documentRef ? null : 'document-unavailable'
    };
  }

  const width = normalizeNumber(resolvedCanvas.width, 0);
  const height = normalizeNumber(resolvedCanvas.height, 0);
  const style = readCanvasStyle(resolvedCanvas, view);
  const visible = style.display !== 'none' && style.visibility !== 'hidden';
  const sized = width > 0 && height > 0;
  const canvasFacts = {
    ...base,
    present: true,
    visible,
    sized,
    width,
    height
  };

  if (!visible || !sized) return canvasFacts;

  try {
    const probeCanvas = documentRef?.createElement?.('canvas');
    if (!probeCanvas) {
      return {
        ...canvasFacts,
        pixelProbe: createEmptyPixelProbe({ thresholds: normalizedThresholds, inspected: true, error: 'probe-canvas-unavailable' })
      };
    }

    probeCanvas.width = normalizedThresholds.probeWidth;
    probeCanvas.height = normalizedThresholds.probeHeight;
    const ctx = probeCanvas.getContext?.('2d', { willReadFrequently: true });
    if (!ctx) {
      return {
        ...canvasFacts,
        pixelProbe: createEmptyPixelProbe({ thresholds: normalizedThresholds, inspected: true, error: 'canvas-context-unavailable' })
      };
    }

    ctx.drawImage(resolvedCanvas, 0, 0, normalizedThresholds.probeWidth, normalizedThresholds.probeHeight);
    const { data } = ctx.getImageData(0, 0, normalizedThresholds.probeWidth, normalizedThresholds.probeHeight);

    let min = 255;
    let max = 0;
    let nonBlack = 0;

    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (lum > normalizedThresholds.luminanceMin) nonBlack += 1;
      if (lum < min) min = lum;
      if (lum > max) max = lum;
    }

    const dynamicRange = max - min;
    return {
      ...canvasFacts,
      pixelProbe: normalizePixelProbeFacts({
        inspected: true,
        dynamicRange,
        nonBlack,
        minLuminance: min,
        maxLuminance: max,
        thresholds: normalizedThresholds
      })
    };
  } catch (error) {
    return {
      ...canvasFacts,
      pixelProbe: createEmptyPixelProbe({ thresholds: normalizedThresholds, inspected: true, error: error?.message || error })
    };
  }
}

export function createCaptureReadinessFacts(state = null, { canvasFacts = null } = {}) {
  const source = isObject(state) ? state : {};
  const sceneInitError = errorText(source.sceneInitError);
  const runtimeError = errorText(source.error);
  return {
    statePresent: isObject(state),
    captureMode: source.captureMode === true,
    manifestLoaded: source.manifestLoaded === true,
    manifestCount: normalizeNumber(source.manifestCount, 0),
    artworkLoaded: source.artworkLoaded === true,
    artworkId: normalizeNullableString(source.artworkId),
    activeFile: normalizeNullableString(source.activeFile),
    sceneInitialized: source.sceneInitialized === true,
    sceneInitError,
    sceneAssemblyReportPresent: source.sceneAssemblyReport != null,
    renderReady: source.renderReady === true,
    renderedArtworkId: normalizeNullableString(source.renderedArtworkId),
    error: runtimeError,
    hasError: Boolean(sceneInitError || runtimeError),
    canvas: normalizeCaptureCanvasReadinessFacts(canvasFacts)
  };
}

function normalizeCaptureReadinessFacts(value = null) {
  if (!isObject(value)) return createCaptureReadinessFacts(null);
  return {
    statePresent: value.statePresent === true,
    captureMode: value.captureMode === true,
    manifestLoaded: value.manifestLoaded === true,
    manifestCount: normalizeNumber(value.manifestCount, 0),
    artworkLoaded: value.artworkLoaded === true,
    artworkId: normalizeNullableString(value.artworkId),
    activeFile: normalizeNullableString(value.activeFile),
    sceneInitialized: value.sceneInitialized === true,
    sceneInitError: errorText(value.sceneInitError),
    sceneAssemblyReportPresent: value.sceneAssemblyReportPresent === true,
    renderReady: value.renderReady === true,
    renderedArtworkId: normalizeNullableString(value.renderedArtworkId),
    error: errorText(value.error),
    hasError: Boolean(errorText(value.sceneInitError) || errorText(value.error)),
    canvas: normalizeCaptureCanvasReadinessFacts(value.canvas)
  };
}

export function evaluateCaptureReadinessFacts(facts = null) {
  const normalized = normalizeCaptureReadinessFacts(facts);
  const reasons = [];

  if (!normalized.statePresent) {
    reasons.push(createReason(
      CAPTURE_READINESS_REASON_CODES.stateMissing,
      'Capture readiness state has not been published.'
    ));
    return {
      status: 'inactive',
      ready: false,
      terminal: false,
      error: null,
      reasons,
      reasonCodes: reasons.map((reason) => reason.code)
    };
  }

  if (normalized.renderReady) {
    reasons.push(createReason(
      CAPTURE_READINESS_REASON_CODES.renderReady,
      'Browser runtime reported a rendered artwork frame.',
      { renderedArtworkId: normalized.renderedArtworkId }
    ));
    return {
      status: 'ready',
      ready: true,
      terminal: true,
      error: null,
      reasons,
      reasonCodes: reasons.map((reason) => reason.code)
    };
  }

  if (normalized.canvas.pixelProbe.ready) {
    reasons.push(createReason(
      CAPTURE_READINESS_REASON_CODES.pixelSignalReady,
      'Canvas pixel probe detected rendered, non-black visual signal.',
      {
        dynamicRange: normalized.canvas.pixelProbe.dynamicRange,
        nonBlack: normalized.canvas.pixelProbe.nonBlack
      }
    ));
    return {
      status: 'ready',
      ready: true,
      terminal: true,
      error: null,
      reasons,
      reasonCodes: reasons.map((reason) => reason.code)
    };
  }

  if (normalized.sceneInitError) {
    reasons.push(createReason(
      CAPTURE_READINESS_REASON_CODES.sceneInitError,
      'Scene initialization reported an error.',
      { error: normalized.sceneInitError }
    ));
    return {
      status: 'error',
      ready: false,
      terminal: true,
      error: normalized.sceneInitError,
      reasons,
      reasonCodes: reasons.map((reason) => reason.code)
    };
  }

  if (normalized.error) {
    reasons.push(createReason(
      CAPTURE_READINESS_REASON_CODES.runtimeError,
      'Browser runtime reported an error.',
      { error: normalized.error }
    ));
    return {
      status: 'error',
      ready: false,
      terminal: true,
      error: normalized.error,
      reasons,
      reasonCodes: reasons.map((reason) => reason.code)
    };
  }

  if (!normalized.manifestLoaded) {
    reasons.push(createReason(CAPTURE_READINESS_REASON_CODES.manifestPending, 'Manifest has not loaded yet.'));
  }
  if (!normalized.artworkLoaded) {
    reasons.push(createReason(CAPTURE_READINESS_REASON_CODES.artworkPending, 'Artwork payload has not loaded yet.'));
  }
  if (!normalized.sceneInitialized) {
    reasons.push(createReason(CAPTURE_READINESS_REASON_CODES.scenePending, 'Scene has not initialized yet.'));
  }

  if (normalized.canvas.inspected) {
    if (!normalized.canvas.present) {
      reasons.push(createReason(CAPTURE_READINESS_REASON_CODES.canvasMissing, 'Artwork canvas is not available for probing.'));
    } else if (!normalized.canvas.visible) {
      reasons.push(createReason(CAPTURE_READINESS_REASON_CODES.canvasHidden, 'Artwork canvas is hidden.'));
    } else if (!normalized.canvas.sized) {
      reasons.push(createReason(CAPTURE_READINESS_REASON_CODES.canvasUnsized, 'Artwork canvas has no drawable size.'));
    } else if (normalized.canvas.pixelProbe.error) {
      reasons.push(createReason(
        normalized.canvas.pixelProbe.error === 'canvas-context-unavailable'
          ? CAPTURE_READINESS_REASON_CODES.canvasContextMissing
          : CAPTURE_READINESS_REASON_CODES.canvasProbeError,
        'Canvas pixel probe could not complete.',
        { error: normalized.canvas.pixelProbe.error }
      ));
    } else {
      reasons.push(createReason(
        CAPTURE_READINESS_REASON_CODES.pixelSignalPending,
        'Canvas pixel probe has not detected enough rendered visual signal.',
        {
          dynamicRange: normalized.canvas.pixelProbe.dynamicRange,
          nonBlack: normalized.canvas.pixelProbe.nonBlack,
          thresholds: normalized.canvas.pixelProbe.thresholds
        }
      ));
    }
  } else {
    reasons.push(createReason(CAPTURE_READINESS_REASON_CODES.renderPending, 'Render readiness has not been observed yet.'));
  }

  if (!reasons.length) {
    reasons.push(createReason(CAPTURE_READINESS_REASON_CODES.renderPending, 'Render readiness is still pending.'));
  }

  return {
    status: 'pending',
    ready: false,
    terminal: false,
    error: null,
    reasons,
    reasonCodes: reasons.map((reason) => reason.code)
  };
}

export function createCaptureReadinessSnapshot(state = null, { canvasFacts = null } = {}) {
  const facts = createCaptureReadinessFacts(state, { canvasFacts });
  return {
    facts,
    decision: evaluateCaptureReadinessFacts(facts)
  };
}

export function attachCaptureReadinessSnapshot(state = null, { canvasFacts = null } = {}) {
  const source = isObject(state) ? state : createCaptureReadinessState();
  const snapshot = createCaptureReadinessSnapshot(source, { canvasFacts });
  return {
    ...source,
    readinessFacts: snapshot.facts,
    readinessDecision: snapshot.decision
  };
}

export function createCaptureReadinessState({ now = null, captureMode = true } = {}) {
  const startedAt = timestamp(now);
  const state = {
    startedAt,
    updatedAt: startedAt,
    ...CAPTURE_READINESS_DEFAULT_STATE,
    captureMode: Boolean(captureMode)
  };
  return attachCaptureReadinessSnapshot(state);
}

export function normalizeCaptureReadinessPatch(patch = {}) {
  const source = isObject(patch) ? patch : {};
  const normalized = {};
  const rejectedKeys = [];

  for (const [key, value] of Object.entries(source)) {
    if (!CAPTURE_READINESS_PATCH_KEY_SET.has(key)) {
      rejectedKeys.push(key);
      continue;
    }
    normalized[key] = value;
  }

  return {
    patch: normalized,
    rejectedKeys
  };
}

export function applyCaptureReadinessPatch(state, patch = {}, { now = null } = {}) {
  const normalized = normalizeCaptureReadinessPatch(patch);
  const current = isObject(state) ? state : createCaptureReadinessState({ now });
  const updatedAt = timestamp(now);
  return {
    state: attachCaptureReadinessSnapshot({
      ...current,
      ...normalized.patch,
      updatedAt
    }),
    rejectedKeys: normalized.rejectedKeys
  };
}

export function classifyCaptureReadinessState(state = null) {
  const decision = createCaptureReadinessSnapshot(state).decision;
  return {
    status: decision.status,
    ready: decision.ready,
    terminal: decision.terminal,
    error: decision.error,
    reasons: decision.reasons,
    reasonCodes: decision.reasonCodes
  };
}

export function isCaptureReadinessReady(state = null) {
  return classifyCaptureReadinessState(state).ready;
}

export function normalizeCaptureReadinessDiagnostics(state = null) {
  const snapshot = createCaptureReadinessSnapshot(state, {
    canvasFacts: isObject(state?.readinessFacts) ? state.readinessFacts.canvas : null
  });
  const classification = snapshot.decision;
  return {
    status: classification.status,
    ready: classification.ready,
    terminal: classification.terminal,
    error: classification.error,
    reasons: classification.reasons,
    reasonCodes: classification.reasonCodes,
    facts: snapshot.facts,
    state: isObject(state) ? state : null
  };
}
