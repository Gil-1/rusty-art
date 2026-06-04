import test from 'node:test';
import assert from 'node:assert/strict';

import { buildArchiveCardPresentationFacts } from '../app/web/js/public-artwork-presentation-facts.js';
import { createArchiveCardElement } from '../app/web/js/main-render.js';
import { normalizeManifestFromArtwork } from '../app/web/js/contracts/public-archive-read-model.js';

function installDocumentStub() {
  globalThis.document = {
    createElement(tagName) {
      return {
        tagName,
        dataset: {},
        className: '',
        attributes: {},
        innerHTML: '',
        listeners: {},
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
        addEventListener(name, listener) {
          this.listeners[name] = listener;
        },
      };
    },
  };
}

test('archive card facts normalize trusted thumbnail metadata', () => {
  const facts = buildArchiveCardPresentationFacts({
    file: './data/artworks/art-1.json',
    date: '2026-06-04',
    source: 'lalibre',
    title: 'Signal field',
    newsTitle: 'Headline',
    artist: 'Larry Zox',
    image: {
      thumbnailJpeg: './data/media/art-1/thumb-320.jpg',
      altText: 'A warm hard-edge field.',
    },
  });

  assert.deepEqual(facts.thumbnail, {
    src: './data/media/art-1/thumb-320.jpg',
    altText: 'A warm hard-edge field.',
  });
});

test('archive card facts reject missing or untrusted thumbnails', () => {
  assert.equal(buildArchiveCardPresentationFacts({ thumbnailJpeg: '../secret.jpg' }).thumbnail, null);
  assert.equal(buildArchiveCardPresentationFacts({ thumbnailJpeg: 'https://example.com/thumb.jpg' }).thumbnail, null);
  assert.equal(buildArchiveCardPresentationFacts({ thumbnailJpeg: './data/media/art-1/thumb-320.png' }).thumbnail, null);
});

test('archive card renderer includes image only when thumbnail is present', () => {
  installDocumentStub();

  const withThumb = createArchiveCardElement({
    file: './data/artworks/art-1.json',
    title: 'Signal field',
    artist: 'Larry Zox',
    thumbnailJpeg: './data/media/art-1/thumb-320.jpg',
    image: { altText: 'Signal thumbnail.' },
  });
  const withoutThumb = createArchiveCardElement({
    file: './data/artworks/art-2.json',
    title: 'Text only',
  });

  assert.match(withThumb.innerHTML, /<img src="\.\/data\/media\/art-1\/thumb-320\.jpg"/);
  assert.match(withThumb.innerHTML, /alt="Signal thumbnail\."/);
  assert.doesNotMatch(withoutThumb.innerHTML, /<img /);
});

test('fallback manifest entries carry thumbnail metadata from artwork image fields', () => {
  const manifest = normalizeManifestFromArtwork({
    id: 'art-1',
    title: 'Signal field',
    image: {
      thumbnailJpeg: './data/media/art-1/thumb-320.jpg',
      altText: 'Signal thumbnail.',
    },
  }, './data/artworks/art-1.json');

  assert.equal(manifest.items[0].thumbnailJpeg, './data/media/art-1/thumb-320.jpg');
  assert.equal(manifest.items[0].image.altText, 'Signal thumbnail.');
});
