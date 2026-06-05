import {
  buildArtworkShareRouteHref,
  resolveArtworkRouteSlug
} from './contracts/public-artwork-routes.js';

export const RUSTY_SITE_NAME = 'Rusty Art';
export const DEFAULT_SHARE_TITLE = 'Rusty Art - Daily Belgian News Abstractions';
export const DEFAULT_SHARE_DESCRIPTION = 'Daily Belgian headlines translated into calm, meaningful abstract artwork.';
export const DEFAULT_OG_IMAGE_SIZE = Object.freeze({ width: 1080, height: 720 });

const MANAGED_META_SELECTOR = 'meta[data-rusty-share-meta], link[data-rusty-share-meta]';

function asObject(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function normalizedText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function stripTags(value) {
  return normalizedText(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(value, maxLength) {
  const text = stripTags(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function sourceLabel(value) {
  return normalizedText(value, 'unknown').toUpperCase();
}

function pickArtworkImage(art = {}, item = {}) {
  const artImage = asObject(art.image);
  const itemImage = asObject(item.image);
  return normalizedText(
    artImage.publicJpeg
      || itemImage.publicJpeg
      || artImage.thumbnailJpeg
      || item.thumbnailJpeg
      || itemImage.thumbnailJpeg
  );
}

function pickArtworkImageAlt(art = {}, item = {}, title = '') {
  const artImage = asObject(art.image);
  const itemImage = asObject(item.image);
  return normalizedText(
    artImage.altText
      || itemImage.altText,
    `${title || RUSTY_SITE_NAME} preview image.`
  );
}

function absoluteUrl(value, { locationRef = globalThis.location, documentRef = globalThis.document, siteUrl = '' } = {}) {
  const text = normalizedText(value);
  if (!text) return '';
  const origin = normalizedText(siteUrl)
    || (locationRef?.origin && !/^null$/i.test(locationRef.origin) ? locationRef.origin : '');
  const base = origin || documentRef?.baseURI || locationRef?.href || 'http://localhost/';
  try {
    return new URL(text, base).href;
  } catch {
    return text;
  }
}

function withoutSearchOrHash(url) {
  try {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    return parsed.href;
  } catch {
    return url;
  }
}

function buildCanonicalHref(item, options = {}) {
  const href = buildArtworkShareRouteHref(item, {
    locationRef: options.locationRef,
    includeSearch: false,
    includeHash: false
  }) || '/';
  return withoutSearchOrHash(absoluteUrl(href, options));
}

function buildDescription({ title, artist, date, newsTitle, source }) {
  const parts = [
    `A Rusty Art abstract news translation of "${newsTitle || title}".`,
    artist ? `Artist influence: ${artist}.` : '',
    source || date ? [source ? sourceLabel(source) : '', date].filter(Boolean).join(' - ') : ''
  ].filter(Boolean);
  return truncate(parts.join(' '), 220);
}

export function resolvePublicArtworkShareMetadata({
  art = {},
  item = {},
  locationRef = globalThis.location,
  documentRef = globalThis.document,
  siteUrl = ''
} = {}) {
  const artNews = asObject(art.news);
  const artInspiration = asObject(art.inspiration);
  const mergedItem = {
    ...item,
    id: art.id || item.id,
    slug: art.slug || item.slug,
    title: art.title || item.title,
    date: art.date || item.date,
    artist: artInspiration.artist || item.artist,
    newsTitle: artNews.title || item.newsTitle,
    source: artNews.source || item.source,
    image: {
      ...asObject(item.image),
      ...asObject(art.image)
    },
    thumbnailJpeg: item.thumbnailJpeg
  };

  const title = normalizedText(mergedItem.title, 'Untitled piece');
  const artist = normalizedText(mergedItem.artist, 'Unknown artist');
  const newsTitle = normalizedText(mergedItem.newsTitle, title);
  const date = normalizedText(mergedItem.date);
  const source = normalizedText(mergedItem.source);
  const slug = resolveArtworkRouteSlug(mergedItem);
  const imagePath = pickArtworkImage(art, mergedItem);
  const pageTitle = `${title} | ${RUSTY_SITE_NAME}`;
  const canonicalUrl = slug
    ? buildCanonicalHref(mergedItem, { locationRef, documentRef, siteUrl })
    : withoutSearchOrHash(absoluteUrl('/', { locationRef, documentRef, siteUrl }));
  const imageUrl = absoluteUrl(imagePath, { locationRef, documentRef, siteUrl });
  const description = buildDescription({ title, artist, date, newsTitle, source });
  const imageAlt = pickArtworkImageAlt(art, mergedItem, title);

  return {
    slug,
    title: pageTitle,
    plainTitle: title,
    description,
    canonicalUrl,
    imageUrl,
    imageAlt,
    imageWidth: DEFAULT_OG_IMAGE_SIZE.width,
    imageHeight: DEFAULT_OG_IMAGE_SIZE.height,
    siteName: RUSTY_SITE_NAME,
    type: slug ? 'article' : 'website',
    locale: 'en_US',
    date,
    artist,
    newsTitle,
    source: sourceLabel(source),
    routeHref: slug ? buildArtworkShareRouteHref(mergedItem, { locationRef }) : null,
    analytics: {
      artwork_id: normalizedText(art.id || item.id),
      artwork_slug: slug,
      artwork_title: title,
      artwork_artist: artist,
      artwork_source: sourceLabel(source),
      artwork_date: date
    }
  };
}

function setAttributeValue(element, name, value) {
  if (value == null || value === '') element.removeAttribute?.(name);
  else element.setAttribute?.(name, String(value));
}

function upsertManagedElement(documentRef, selector, createElement) {
  let element = documentRef.querySelector?.(selector);
  if (!element) {
    element = createElement();
    documentRef.head?.appendChild?.(element);
  }
  element.setAttribute('data-rusty-share-meta', 'true');
  return element;
}

function upsertMeta(documentRef, attrName, attrValue, content) {
  if (!content) return null;
  const selector = `meta[${attrName}="${attrValue}"]`;
  const meta = upsertManagedElement(documentRef, selector, () => {
    const element = documentRef.createElement('meta');
    element.setAttribute(attrName, attrValue);
    return element;
  });
  meta.setAttribute('content', content);
  return meta;
}

function upsertCanonical(documentRef, href) {
  if (!href) return null;
  const link = upsertManagedElement(documentRef, 'link[rel="canonical"]', () => {
    const element = documentRef.createElement('link');
    element.setAttribute('rel', 'canonical');
    return element;
  });
  link.setAttribute('href', href);
  return link;
}

export function applyPublicArtworkShareMetadata(documentRef = globalThis.document, metadata = {}) {
  if (!documentRef?.head) return metadata;

  documentRef.querySelectorAll?.(MANAGED_META_SELECTOR)?.forEach((element) => element.remove?.());
  if (metadata.title) documentRef.title = metadata.title;
  upsertCanonical(documentRef, metadata.canonicalUrl);

  upsertMeta(documentRef, 'name', 'description', metadata.description);
  upsertMeta(documentRef, 'property', 'og:title', metadata.title);
  upsertMeta(documentRef, 'property', 'og:description', metadata.description);
  upsertMeta(documentRef, 'property', 'og:type', metadata.type);
  upsertMeta(documentRef, 'property', 'og:url', metadata.canonicalUrl);
  upsertMeta(documentRef, 'property', 'og:site_name', metadata.siteName);
  upsertMeta(documentRef, 'property', 'og:locale', metadata.locale);
  upsertMeta(documentRef, 'property', 'og:image', metadata.imageUrl);
  upsertMeta(documentRef, 'property', 'og:image:secure_url', metadata.imageUrl);
  upsertMeta(documentRef, 'property', 'og:image:type', metadata.imageUrl ? 'image/jpeg' : '');
  upsertMeta(documentRef, 'property', 'og:image:width', metadata.imageWidth);
  upsertMeta(documentRef, 'property', 'og:image:height', metadata.imageHeight);
  upsertMeta(documentRef, 'property', 'og:image:alt', metadata.imageAlt);
  upsertMeta(documentRef, 'property', 'article:published_time', metadata.date);
  upsertMeta(documentRef, 'name', 'twitter:card', metadata.imageUrl ? 'summary_large_image' : 'summary');
  upsertMeta(documentRef, 'name', 'twitter:title', metadata.title);
  upsertMeta(documentRef, 'name', 'twitter:description', metadata.description);
  upsertMeta(documentRef, 'name', 'twitter:image', metadata.imageUrl);
  upsertMeta(documentRef, 'name', 'twitter:image:alt', metadata.imageAlt);

  documentRef.documentElement?.setAttribute?.('prefix', 'og: https://ogp.me/ns# article: https://ogp.me/ns/article#');
  return metadata;
}

export function createPublicArtworkShareMetadataController({
  windowRef = globalThis.window,
  documentRef = globalThis.document,
  siteUrl = ''
} = {}) {
  let lastMetadata = null;

  function update({ art = {}, item = {}, manifest = null } = {}) {
    const metadata = resolvePublicArtworkShareMetadata({
      art,
      item,
      locationRef: windowRef?.location,
      documentRef,
      siteUrl
    });
    lastMetadata = applyPublicArtworkShareMetadata(documentRef, metadata);
    return {
      metadata: lastMetadata,
      manifestCount: manifest?.items?.length || null
    };
  }

  return {
    update,
    getMetadata: () => lastMetadata
  };
}
