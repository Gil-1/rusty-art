export function clampManifestIndex(manifest, index) {
  if (!manifest?.items?.length) return null;
  return Math.max(0, Math.min(index, manifest.items.length - 1));
}

export {
  buildArtworkFullSlug,
  findManifestIndexByArtworkSlug,
  normalizeArtworkSlug
} from './public-artwork-routes.js';

export function wrapManifestIndex(manifest, index) {
  if (!manifest?.items?.length) return null;
  const size = manifest.items.length;
  const normalized = Number.isFinite(index) ? Math.trunc(index) : 0;
  return ((normalized % size) + size) % size;
}

export function findActiveIndex(manifest, file) {
  if (!manifest?.items?.length) return -1;
  return manifest.items.findIndex((item) => item.file === file);
}

export function getNeighborFiles(manifest, activeIndex) {
  const size = manifest?.items?.length || 0;
  if (!size || activeIndex < 0 || activeIndex >= size) {
    return { prevFile: null, nextFile: null };
  }
  if (size === 1) {
    return { prevFile: null, nextFile: null };
  }

  const prevIndex = (activeIndex - 1 + size) % size;
  const nextIndex = (activeIndex + 1) % size;
  return {
    prevFile: manifest.items[prevIndex]?.file,
    nextFile: manifest.items[nextIndex]?.file
  };
}

export function syncQuickControls({ manifest, activeIndex, quickPrev, quickNext, quickPicker, quickPosition }) {
  if (!manifest?.items?.length) return;
  const hasLoopableArchive = manifest.items.length > 1 && activeIndex >= 0;

  if (quickPrev) quickPrev.disabled = !hasLoopableArchive;
  if (quickNext) quickNext.disabled = !hasLoopableArchive;
  if (quickPicker && activeIndex >= 0) {
    quickPicker.dataset.activeIndex = String(activeIndex);
    if (quickPicker.tagName === 'SELECT') quickPicker.value = String(activeIndex);
  }
  if (quickPosition && activeIndex >= 0) {
    quickPosition.textContent = `${activeIndex + 1} / ${manifest.items.length} loop`;
  }
}
