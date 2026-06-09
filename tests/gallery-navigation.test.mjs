import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  buildPublicArtworkHeroFacts,
  buildGalleryPresentationFacts,
  buildGalleryTriggerPresentationFacts,
  buildLoadingPresentationFacts
} from '../app/web/js/public-artwork-presentation-facts.js';
import {
  applyLoadingFacts,
  createArchiveCardElement,
  populateQuickPicker,
  renderGalleryList
} from '../app/web/js/main-render.js';
import { createRuntimeRenderEffects } from '../app/web/js/main-render-effects.js';
import { createArchiveInteractionController } from '../app/web/js/main-archive-interaction-controller.js';
import { createArtworkRouteHistoryController } from '../app/web/js/main-artwork-route-history.js';
import { installRuntimeShellEventBindings } from '../app/web/js/main-runtime-shell.js';
import {
  buildArtworkQueryRouteHref,
  buildArtworkShareRouteHref,
  readArtworkRouteFromLocation,
  resolveArtworkRouteSlug
} from '../app/web/js/public-artwork-routes.js';
import { resolvePublicArtworkShareMetadata } from '../app/web/js/public-artwork-share-metadata.js';
import { createBrowserJsonRequestAdapter } from '../app/web/js/browser-json-request-adapter.js';
import {
  normalizePublicRuntimeUrl,
  resolvePublicRuntimeBaseHref
} from '../app/web/js/immersive-world-scene.js';

const manifest = {
  items: [
    {
      file: './data/artworks/a.json',
      date: '2026-06-05',
      source: 'vrt',
      title: 'Signal garden',
      newsTitle: 'A headline in bloom',
      artist: 'Larry Zox',
      thumbnailJpeg: './data/media/a/thumb-320.jpg',
      image: { altText: 'A bright abstract garden.' }
    },
    {
      file: './data/artworks/b.json',
      date: '2026-06-04',
      source: 'lalibre',
      title: 'Quiet field',
      newsTitle: 'A calmer headline',
      artist: 'Helen Frankenthaler',
      thumbnailJpeg: './data/media/b/thumb-320.jpg',
      image: { altText: 'A quiet field.' }
    }
  ]
};

let activeElement = null;

function createClassList(element, initial = '') {
  let values = new Set(String(initial).split(/\s+/).filter(Boolean));
  const sync = () => {
    element.className = [...values].join(' ');
  };
  return {
    add(...names) {
      names.forEach((name) => values.add(name));
      sync();
    },
    remove(...names) {
      names.forEach((name) => values.delete(name));
      sync();
    },
    toggle(name, force) {
      const enabled = force == null ? !values.has(name) : Boolean(force);
      if (enabled) values.add(name);
      else values.delete(name);
      sync();
      return enabled;
    },
    contains(name) {
      return values.has(name);
    },
    setFromClassName(value) {
      values = new Set(String(value).split(/\s+/).filter(Boolean));
    }
  };
}

function createElementStub(tagName = 'div', id = '') {
  const element = {
    id,
    tagName: tagName.toUpperCase(),
    nodeName: tagName.toUpperCase(),
    dataset: {},
    attributes: {},
    style: {},
    children: [],
    listeners: {},
    disabled: false,
    hidden: false,
    title: '',
    textContent: '',
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
    querySelectorAll(selector) {
      if (selector === 'li[data-file]') {
        return this.children.filter((child) => child.tagName === 'LI' && child.dataset.file);
      }
      return [];
    },
    querySelector() {
      return null;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    addEventListener(name, listener) {
      this.listeners[name] = listener;
    },
    removeEventListener(name) {
      delete this.listeners[name];
    },
    focus(options) {
      activeElement = this;
      this.focusOptions = options;
    }
  };

  let html = '';
  Object.defineProperty(element, 'innerHTML', {
    get() {
      return html;
    },
    set(value) {
      html = String(value);
      if (html === '') this.children = [];
    }
  });

  const classList = createClassList(element);
  let className = '';
  Object.defineProperty(element, 'className', {
    get() {
      return className;
    },
    set(value) {
      className = String(value || '');
      classList.setFromClassName(className);
    }
  });
  element.classList = classList;

  return element;
}

function installDocumentStub({ baseURI = undefined } = {}) {
  activeElement = null;
  globalThis.document = {
    baseURI,
    createElement: (tagName) => createElementStub(tagName)
  };
}

function createRefs() {
  const galleryTrigger = createElementStub('button', 'gallery-trigger');
  const galleryDialog = createElementStub('div', 'gallery-dialog');
  galleryDialog.hidden = true;
  return {
    artFirst: createElementStub('section', 'art-first'),
    loadState: createElementStub('span', 'load-state'),
    quickPrev: createElementStub('button', 'quick-prev'),
    quickNext: createElementStub('button', 'quick-next'),
    quickPicker: galleryTrigger,
    galleryTrigger,
    galleryDialog,
    galleryClose: createElementStub('button', 'gallery-close'),
    galleryList: createElementStub('ul', 'gallery-list'),
    quickPosition: createElementStub('span', 'quick-position')
  };
}

function createWindowStub() {
  return {
    setTimeout: (fn) => {
      fn();
      return 1;
    },
    clearTimeout() {}
  };
}

test('gallery presentation facts show newest cards first, trusted thumbnails, and current state', () => {
  const triggerFacts = buildGalleryTriggerPresentationFacts(manifest.items[1]);
  const galleryFacts = buildGalleryPresentationFacts(manifest, { activeFile: manifest.items[1].file });

  assert.equal(triggerFacts.label, '2026-06-04 · Helen Frankenthaler');
  assert.equal(triggerFacts.metadataLabel, '2026-06-04 · Helen Frankenthaler');
  assert.equal(triggerFacts.titleLabel, 'Quiet field');
  assert.equal(triggerFacts.fullLabel, '2026-06-04 · Helen Frankenthaler · Quiet field');
  assert.equal(galleryFacts.cards.map((card) => card.file).join(','), './data/artworks/b.json,./data/artworks/a.json');
  assert.deepEqual(galleryFacts.cards[1].thumbnail, {
    src: './data/media/a/thumb-320.jpg',
    altText: 'A bright abstract garden.'
  });
  assert.equal(galleryFacts.cards[0].active, true);
  assert.equal(galleryFacts.cards[0].ariaCurrent, 'true');
});

test('now showing hero promotes the news headline as the visible title', () => {
  const facts = buildPublicArtworkHeroFacts({
    title: 'Signal garden',
    date: '2026-06-05',
    news: {
      title: 'A headline in bloom',
      source: 'vrt'
    },
    inspiration: {
      artist: 'Larry Zox'
    }
  });

  assert.equal(facts.title, 'A headline in bloom');
  assert.equal(facts.artworkTitle, 'Signal garden');
  assert.match(facts.subtitle, /Signal garden/);
});

test('runtime gallery trigger uses both visible lines for artwork context', () => {
  installDocumentStub();
  const refs = createRefs();
  const effects = createRuntimeRenderEffects({
    refs,
    getPresentationState: () => ({ activeFile: manifest.items[1].file, activeIndex: 1 }),
    getArchiveController: () => ({ getManifest: () => manifest }),
    isMobileViewport: () => false
  });

  effects.render.populateQuickPicker(manifest, 1);

  assert.match(refs.galleryTrigger.innerHTML, /2026-06-04 · Helen Frankenthaler/);
  assert.match(refs.galleryTrigger.innerHTML, /Quiet field/);
  assert.doesNotMatch(refs.galleryTrigger.innerHTML, />Gallery</);
  assert.equal(refs.galleryTrigger.title, '2026-06-04 · Helen Frankenthaler · Quiet field');
  assert.equal(refs.galleryTrigger.attributes['aria-label'], 'Open artwork gallery, current artwork: 2026-06-04 · Helen Frankenthaler · Quiet field');
});

test('mobile title surfaces wrap instead of truncating', () => {
  const html = fs.readFileSync(new URL('../app/web/index.html', import.meta.url), 'utf8');
  const heroTitleClasses = html.match(/<h1 id="hero-now-title" class="([^"]+)"/)?.[1] || '';
  const galleryTriggerClasses = html.match(/<button id="gallery-trigger" class="([^"]+)"/)?.[1] || '';

  assert.doesNotMatch(heroTitleClasses, /line-clamp|truncate|text-ellipsis|whitespace-nowrap|overflow-hidden/);
  assert.doesNotMatch(galleryTriggerClasses, /overflow-hidden/);

  installDocumentStub();
  const quickPicker = createElementStub('button', 'gallery-trigger');
  populateQuickPicker(quickPicker, manifest, { activeIndex: 0 });

  assert.doesNotMatch(quickPicker.innerHTML, /text-ellipsis|whitespace-nowrap|overflow-hidden/);
});

test('archive card renderer marks the active gallery card as current', () => {
  installDocumentStub();
  const card = createArchiveCardElement(manifest.items[0], () => {}, { active: true });

  assert.match(card.className, /\barchive-card\b/);
  assert.match(card.className, /\bactive\b/);
  assert.equal(card.attributes['aria-current'], 'true');
  assert.doesNotMatch(card.innerHTML, /Current artwork/);
  assert.match(card.innerHTML, /src="\.\/data\/media\/a\/thumb-320\.jpg"/);
});

test('archive card thumbnails stay rooted when the browser URL is an artwork route', () => {
  installDocumentStub({ baseURI: 'https://rusty.test/gallery/art/current-piece/' });
  const card = createArchiveCardElement(manifest.items[0], () => {}, {
    baseHref: 'https://rusty.test/gallery/'
  });

  assert.match(card.innerHTML, /src="https:\/\/rusty\.test\/gallery\/data\/media\/a\/thumb-320\.jpg"/);
  assert.doesNotMatch(card.innerHTML, /gallery\/art\/current-piece\/data\/media/);
});

test('gallery list thumbnails stay rooted when the browser URL is an artwork route', () => {
  installDocumentStub({ baseURI: 'https://rusty.test/gallery/art/current-piece/' });
  const galleryList = createElementStub('ul', 'gallery-list');

  renderGalleryList(galleryList, manifest, { baseHref: 'https://rusty.test/gallery/' });

  assert.match(galleryList.children[0].innerHTML, /src="https:\/\/rusty\.test\/gallery\/data\/media\/b\/thumb-320\.jpg"/);
  assert.doesNotMatch(galleryList.children[0].innerHTML, /gallery\/art\/current-piece\/data\/media/);
});

test('gallery list renders cards and activates by pointer or keyboard', () => {
  installDocumentStub();
  const galleryList = createElementStub('ul', 'gallery-list');
  const selections = [];

  const facts = renderGalleryList(galleryList, manifest, {
    activeFile: manifest.items[0].file,
    onSelect: (cardFacts) => selections.push(cardFacts.file)
  });

  assert.equal(galleryList.children.length, 2);
  assert.equal(facts.cards[1].ariaCurrent, 'true');
  galleryList.children[0].listeners.click({});
  galleryList.children[1].listeners.keydown({ key: 'Enter', preventDefault() {} });
  assert.deepEqual(selections, [manifest.items[1].file, manifest.items[0].file]);
});

test('runtime gallery opens, closes on Escape, and restores trigger focus', () => {
  installDocumentStub();
  const refs = createRefs();
  const body = createElementStub('body', 'body');
  let state = { activeFile: manifest.items[0].file, activeIndex: 0 };
  const effects = createRuntimeRenderEffects({
    refs,
    body,
    windowRef: createWindowStub(),
    getPresentationState: () => state,
    setPresentationState: (nextState) => { state = nextState; },
    getArchiveController: () => ({ getManifest: () => manifest })
  });
  let prevented = false;

  effects.render.populateQuickPicker(manifest, 0);
  assert.equal(refs.galleryList.children.length, 2);
  assert.equal(effects.openGallery(), true);
  assert.equal(refs.galleryDialog.hidden, false);
  assert.equal(refs.galleryTrigger.attributes['aria-expanded'], 'true');
  assert.equal(activeElement, refs.galleryClose);

  assert.equal(effects.handleGalleryKeydown({ key: 'Escape', preventDefault: () => { prevented = true; } }), true);
  assert.equal(prevented, true);
  assert.equal(refs.galleryDialog.hidden, true);
  assert.equal(refs.galleryTrigger.attributes['aria-expanded'], 'false');
  assert.equal(activeElement, refs.galleryTrigger);
});

test('gallery current selection closes without redundant load and other selection reuses load path', () => {
  installDocumentStub();
  const refs = createRefs();
  const body = createElementStub('body', 'body');
  const loadedFiles = [];
  let state = { activeFile: manifest.items[0].file, activeIndex: 0 };
  const controller = {
    getManifest: () => manifest,
    loadArtworkByFile: (file) => {
      loadedFiles.push(file);
      return Promise.resolve({ status: 'loaded', file });
    }
  };
  const effects = createRuntimeRenderEffects({
    refs,
    body,
    windowRef: createWindowStub(),
    getPresentationState: () => state,
    setPresentationState: (nextState) => { state = nextState; },
    getArchiveController: () => controller
  });

  effects.render.populateQuickPicker(manifest, 0);
  effects.openGallery();
  refs.galleryList.children[1].listeners.click({});
  assert.deepEqual(loadedFiles, []);
  assert.equal(refs.galleryDialog.hidden, true);
  assert.equal(activeElement, refs.galleryTrigger);

  effects.openGallery();
  refs.galleryList.children[0].listeners.click({});
  assert.deepEqual(loadedFiles, [manifest.items[1].file]);
  assert.equal(refs.galleryDialog.hidden, true);
  assert.equal(activeElement, refs.galleryTrigger);
});

test('capture mode does not render or open the gallery', () => {
  installDocumentStub();
  const refs = createRefs();
  const effects = createRuntimeRenderEffects({
    refs,
    body: createElementStub('body', 'body'),
    windowRef: createWindowStub(),
    captureMode: true,
    getPresentationState: () => ({ activeFile: manifest.items[0].file, activeIndex: 0 }),
    getArchiveController: () => ({ getManifest: () => manifest })
  });

  effects.render.populateQuickPicker(manifest, 0);
  assert.equal(refs.galleryList.children.length, 0);
  assert.equal(effects.openGallery(), false);
  assert.equal(refs.galleryDialog.hidden, true);
});

test('loading facts disable quick controls and gallery trigger', () => {
  const facts = buildLoadingPresentationFacts({ isLoading: true, manifest, activeIndex: 0 });
  const refs = createRefs();

  applyLoadingFacts({
    artFirst: refs.artFirst,
    loadState: refs.loadState,
    galleryTrigger: refs.galleryTrigger,
    quickPrev: refs.quickPrev,
    quickNext: refs.quickNext
  }, facts);

  assert.equal(facts.galleryTriggerDisabled, true);
  assert.equal(refs.galleryTrigger.disabled, true);
  assert.equal(refs.quickPrev.disabled, true);
  assert.equal(refs.quickNext.disabled, true);
});

test('runtime shell binds gallery trigger, close, backdrop, and keydown events', () => {
  const galleryTrigger = createElementStub('button', 'gallery-trigger');
  const galleryClose = createElementStub('button', 'gallery-close');
  const galleryDialog = createElementStub('div', 'gallery-dialog');
  const documentRef = createElementStub('document', 'document');
  const windowRef = createElementStub('window', 'window');
  let opened = 0;
  let closed = 0;
  let key = '';

  installRuntimeShellEventBindings({
    refs: { galleryTrigger, galleryClose, galleryDialog },
    documentRef,
    windowRef,
    actions: {
      onOpenGallery: () => { opened += 1; },
      onCloseGallery: () => { closed += 1; },
      onKeydown: (event) => { key = event.key; }
    }
  });

  galleryTrigger.listeners.click({ target: galleryTrigger });
  galleryClose.listeners.click({ target: galleryClose });
  galleryDialog.listeners.click({ target: galleryDialog });
  documentRef.listeners.keydown({ key: 'Escape' });

  assert.equal(opened, 1);
  assert.equal(closed, 2);
  assert.equal(key, 'Escape');
});

test('artwork route helpers build static query slug routes', () => {
  const item = {
    id: '2026-06-04-0626z-example-artwork',
    artist: 'Larry Zox',
    newsTitle: 'Example headline'
  };
  const locationRef = {
    pathname: '/',
    search: '?index=12&target=latest&renderer=webgpu&utm_source=share',
    hash: '#story'
  };

  assert.equal(resolveArtworkRouteSlug(item), item.id);
  assert.equal(
    buildArtworkQueryRouteHref(item, { locationRef }),
    '/?renderer=webgpu&utm_source=share&slug=2026-06-04-0626z-example-artwork#story'
  );
  assert.equal(
    buildArtworkShareRouteHref(item, { locationRef }),
    '/art/2026-06-04-0626z-example-artwork/?renderer=webgpu&utm_source=share#story'
  );
  assert.deepEqual(readArtworkRouteFromLocation({ pathname: '/art/abc/', search: '' }), {
    slug: 'abc',
    index: null
  });
  assert.deepEqual(readArtworkRouteFromLocation({ search: '?slug=abc&index=3' }), {
    slug: 'abc',
    index: 3
  });
});

test('browser JSON adapter resolves relative archive requests against the stable app base URI', async () => {
  let requestedUrl = null;
  const adapter = createBrowserJsonRequestAdapter({
    baseHref: 'https://rusty.test/gallery/',
    documentRef: { baseURI: 'https://rusty.test/gallery/art/current-piece/' },
    fetchImpl: async (url) => {
      requestedUrl = String(url);
      return {
        ok: true,
        json: async () => ({ ok: true })
      };
    }
  });

  await adapter.fetchJson('./data/artworks/a.json');

  assert.equal(requestedUrl, 'https://rusty.test/gallery/data/artworks/a.json');
});

test('immersive world generated module URLs stay rooted when browser URL is an artwork route', () => {
  const baseHref = resolvePublicRuntimeBaseHref('https://rusty.test/gallery/assets/immersive-world-scene-abcd.js');
  const moduleUrl = normalizePublicRuntimeUrl('./data/immersive-world/generated-modules/example.mjs', {
    expectedDir: 'data/immersive-world/generated-modules',
    baseHref
  });

  assert.equal(baseHref, 'https://rusty.test/gallery/');
  assert.equal(moduleUrl, 'https://rusty.test/gallery/data/immersive-world/generated-modules/example.mjs');
});

test('artwork share metadata resolves canonical URL and public image', () => {
  const item = {
    id: '2026-06-04-0626z-example-artwork',
    artist: 'Larry Zox',
    title: 'Signal garden',
    newsTitle: 'Example headline',
    date: '2026-06-04',
    source: 'vrt'
  };
  const art = {
    ...item,
    news: { title: item.newsTitle, source: item.source },
    inspiration: { artist: item.artist },
    image: {
      openGraphJpeg: './data/media/example/og-1200x630.jpg',
      altText: 'Signal garden by Larry Zox.'
    }
  };
  const metadata = resolvePublicArtworkShareMetadata({
    art,
    item,
    locationRef: new URL('https://rusty.test/gallery/'),
    siteUrl: 'https://rusty.test/gallery/',
    forceArtworkRoute: true
  });

  assert.equal(metadata.title, 'Example headline | Rusty Art');
  assert.equal(metadata.plainTitle, 'Example headline');
  assert.equal(metadata.canonicalUrl, 'https://rusty.test/gallery/art/2026-06-04-0626z-example-artwork/');
  assert.equal(metadata.imageUrl, 'https://rusty.test/gallery/data/media/example/og-1200x630.jpg');
  assert.match(metadata.description, /Example headline/);
  assert.equal(metadata.imageWidth, 1200);
  assert.equal(metadata.imageHeight, 630);
});

test('root share metadata keeps the site title while reusing the latest open graph image', () => {
  const item = {
    id: '2026-06-04-0626z-example-artwork',
    artist: 'Larry Zox',
    title: 'Signal garden',
    newsTitle: 'Example headline',
    date: '2026-06-04',
    source: 'vrt',
    image: {
      openGraphJpeg: './data/media/example/og-1200x630.jpg'
    }
  };
  const metadata = resolvePublicArtworkShareMetadata({
    item,
    locationRef: new URL('https://rusty.test/gallery/'),
    siteUrl: 'https://rusty.test/gallery/'
  });

  assert.equal(metadata.artworkRoute, false);
  assert.equal(metadata.title, 'Rusty Art — Daily Belgian News Abstractions');
  assert.equal(metadata.type, 'website');
  assert.equal(metadata.canonicalUrl, 'https://rusty.test/gallery/');
  assert.equal(metadata.imageUrl, 'https://rusty.test/gallery/data/media/example/og-1200x630.jpg');
  assert.equal(metadata.date, '');
});

test('artwork route history pushes new slugs and replaces duplicates', () => {
  const calls = [];
  const locationRef = new URL('https://rusty.test/?slug=old&renderer=webgpu');
  const history = {
    state: { preserved: true },
    pushState(state, title, href) {
      calls.push({ method: 'pushState', state, title, href });
      this.state = state;
      locationRef.href = new URL(href, locationRef.href).href;
    },
    replaceState(state, title, href) {
      calls.push({ method: 'replaceState', state, title, href });
      this.state = state;
      locationRef.href = new URL(href, locationRef.href).href;
    }
  };
  const windowRef = { history, location: locationRef };
  const controller = createArtworkRouteHistoryController({ windowRef });
  const item = {
    id: '2026-06-05-0629z-next-artwork',
    file: './data/artworks/next.json'
  };

  assert.deepEqual(controller.readCurrentRoute(), { slug: 'old', index: null });
  assert.equal(controller.syncLoadedArtworkRoute({ item, activeIndex: 0 }).status, 'pushed');
  assert.equal(calls[0].method, 'pushState');
  assert.equal(calls[0].href, '/art/2026-06-05-0629z-next-artwork/?renderer=webgpu');
  assert.equal(calls[0].state.rustyArtworkRoute.file, item.file);

  assert.equal(controller.syncLoadedArtworkRoute({ item, activeIndex: 0 }).status, 'replaced');
  assert.equal(calls[1].method, 'replaceState');
});

test('archive controller syncs routes for user loads but not route restores', async () => {
  const routeManifest = {
    latestId: 'latest-piece',
    items: [
      { id: 'latest-piece', file: './data/artworks/latest.json' },
      { id: 'older-piece', file: './data/artworks/older.json' }
    ]
  };
  const routeChanges = [];
  let state = { activeFile: null, activeIndex: -1 };
  const controller = createArchiveInteractionController({
    loadManifest: async () => ({ manifest: routeManifest }),
    fetchArtwork: async (file) => ({ id: file, title: file }),
    runtimeController: {
      bootSceneNow: async () => {},
      requestDeferredSceneBoot() {}
    },
    getPresentationState: () => state,
    setPresentationState: (nextState) => { state = nextState; },
    onArtworkRouteChange: (change) => routeChanges.push(change),
    render: {}
  });

  await controller.init();
  assert.deepEqual(routeChanges, []);

  await controller.loadArtworkByFile(routeManifest.items[1].file);
  assert.equal(routeChanges.length, 1);
  assert.equal(routeChanges[0].action, 'push');
  assert.equal(routeChanges[0].item.id, 'older-piece');

  await controller.loadArtworkFromRoute({ slug: 'latest-piece' });
  assert.equal(routeChanges.length, 1);
  assert.equal(state.activeFile, routeManifest.items[0].file);
});
