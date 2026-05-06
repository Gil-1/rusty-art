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
