import * as THREE from 'three';

export function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

export function resolveBlend(mode) {
  if (mode === 'additive') return THREE.AdditiveBlending;
  return THREE.NormalBlending;
}

export function hslStringToColor(value, fallback = '#ffffff') {
  if (!value || typeof value !== 'string') return new THREE.Color(fallback);
  return new THREE.Color(value);
}
