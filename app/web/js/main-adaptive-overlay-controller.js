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
