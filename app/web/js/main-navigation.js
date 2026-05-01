export function clampManifestIndex(manifest, index) {
  if (!manifest?.items?.length) return null;
  return Math.max(0, Math.min(index, manifest.items.length - 1));
}

export function normalizeArtworkSlug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&[^;\s]+;/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildArtworkFullSlug(item = {}) {
  return normalizeArtworkSlug([
    item.id,
    item.artist,
    item.newsTitle
  ].filter(Boolean).join(' '));
}

export function findManifestIndexByArtworkSlug(manifest, slug) {
  if (!manifest?.items?.length) return null;
  const target = normalizeArtworkSlug(slug);
  if (!target) return null;
  const index = manifest.items.findIndex((item) => (
    buildArtworkFullSlug(item) === target
    || normalizeArtworkSlug(item?.slug) === target
    || normalizeArtworkSlug(item?.id) === target
  ));
  return index >= 0 ? index : null;
}

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

  const prevIndex = (activeIndex + 1) % size;
  const nextIndex = (activeIndex - 1 + size) % size;
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
  if (quickPicker && activeIndex >= 0) quickPicker.value = String(activeIndex);
  if (quickPosition && activeIndex >= 0) {
    quickPosition.textContent = `${activeIndex + 1} / ${manifest.items.length} loop`;
  }
}
