export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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

export function parseColorToRgb(colorValue) {
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

export function parseColorToLuma(colorValue) {
  const rgb = parseColorToRgb(colorValue);
  if (!rgb) return null;
  return rgbToLuma(rgb.r, rgb.g, rgb.b);
}

export function estimateArtworkLuma(art) {
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

export function computeAdaptiveOverlayState({
  sampledLuma = null,
  estimatedLuma = null,
  previousSmoothedLuma = null
} = {}) {
  const luma = sampledLuma ?? estimatedLuma ?? 0.46;
  const smoothedLuma = previousSmoothedLuma == null
    ? luma
    : (previousSmoothedLuma * 0.74) + (luma * 0.26);

  return {
    smoothedLuma,
    cssVariables: {
      '--overlay-scrim-top': clamp(0.1 + smoothedLuma * 0.24, 0.1, 0.34),
      '--overlay-scrim-mid': clamp(0.52 + smoothedLuma * 0.38, 0.52, 0.9),
      '--overlay-scrim-bottom': clamp(0.66 + smoothedLuma * 0.28, 0.66, 0.94),
      '--overlay-panel-alpha': clamp(0.6 + smoothedLuma * 0.3, 0.6, 0.93),
      '--overlay-chip-alpha': clamp(0.74 + smoothedLuma * 0.24, 0.74, 0.97)
    }
  };
}

export function createCanvasLumaSampler({
  canvas = null,
  documentRef = typeof document !== 'undefined' ? document : null,
  width = 36,
  height = 24
} = {}) {
  let probeCanvas = null;
  let probeCtx = null;

  function ensureProbe() {
    if (probeCtx) return probeCtx;
    if (!documentRef?.createElement) return null;
    probeCanvas = documentRef.createElement('canvas');
    probeCanvas.width = width;
    probeCanvas.height = height;
    probeCtx = probeCanvas.getContext?.('2d', { willReadFrequently: true }) || null;
    return probeCtx;
  }

  function sample() {
    if (!canvas || canvas.width <= 0 || canvas.height <= 0 || canvas.style?.display === 'none') return null;
    const ctx = ensureProbe();
    if (!ctx || !probeCanvas) return null;

    let data;
    try {
      ctx.clearRect(0, 0, probeCanvas.width, probeCanvas.height);
      ctx.drawImage(canvas, 0, 0, probeCanvas.width, probeCanvas.height);
      ({ data } = ctx.getImageData(0, 0, probeCanvas.width, probeCanvas.height));
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
      const x = pixel % probeCanvas.width;
      const y = Math.floor(pixel / probeCanvas.width);
      const alpha = data[i + 3] / 255;
      if (alpha <= 0.025) continue;
      const nx = (x / Math.max(1, probeCanvas.width - 1)) - 0.5;
      const ny = (y / Math.max(1, probeCanvas.height - 1)) - 0.5;
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

  function dispose() {
    probeCanvas = null;
    probeCtx = null;
  }

  return {
    sample,
    dispose,
    getFacts: () => ({
      width,
      height,
      hasProbeCanvas: Boolean(probeCanvas),
      hasContext: Boolean(probeCtx)
    })
  };
}

export function createAdaptiveOverlaySession({
  canvas = null,
  body = typeof document !== 'undefined' ? document.body : null,
  documentRef = typeof document !== 'undefined' ? document : null,
  windowRef = typeof window !== 'undefined' ? window : globalThis,
  captureMode = false,
  getEstimatedLuma = () => null,
  intervalMs = 1200,
  sampler = createCanvasLumaSampler({ canvas, documentRef }),
  setIntervalFn = windowRef.setInterval?.bind(windowRef) || globalThis.setInterval,
  clearIntervalFn = windowRef.clearInterval?.bind(windowRef) || globalThis.clearInterval,
  requestAnimationFrameFn = windowRef.requestAnimationFrame?.bind(windowRef)
} = {}) {
  let timer = null;
  let smoothedLuma = null;

  function apply() {
    if (captureMode) return null;
    const sampledLuma = sampler?.sample?.() ?? null;
    const overlayState = computeAdaptiveOverlayState({
      sampledLuma,
      estimatedLuma: getEstimatedLuma(),
      previousSmoothedLuma: smoothedLuma
    });
    smoothedLuma = overlayState.smoothedLuma;

    Object.entries(overlayState.cssVariables).forEach(([name, value]) => {
      body?.style?.setProperty?.(name, value.toFixed(3));
    });

    return overlayState;
  }

  function requestFrame() {
    if (captureMode) return null;
    if (typeof requestAnimationFrameFn === 'function') {
      return requestAnimationFrameFn(() => apply());
    }
    return apply();
  }

  function start() {
    if (captureMode || timer != null) return getFacts();
    apply();
    timer = setIntervalFn(() => apply(), intervalMs);
    return getFacts();
  }

  function stop() {
    if (timer != null) {
      clearIntervalFn(timer);
      timer = null;
    }
    return getFacts();
  }

  function reset() {
    smoothedLuma = null;
    return getFacts();
  }

  function dispose() {
    stop();
    sampler?.dispose?.();
    smoothedLuma = null;
    return getFacts();
  }

  function getFacts() {
    return {
      captureMode,
      intervalMs,
      isRunning: timer != null,
      smoothedLuma,
      sampler: sampler?.getFacts?.() || null
    };
  }

  return {
    apply,
    requestFrame,
    start,
    stop,
    reset,
    dispose,
    getFacts
  };
}
