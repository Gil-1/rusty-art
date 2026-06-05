import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGalleryPresentationFacts,
  buildGalleryTriggerPresentationFacts,
  buildLoadingPresentationFacts
} from '../app/web/js/public-artwork-presentation-facts.js';
import {
  applyLoadingFacts,
  createArchiveCardElement,
  renderGalleryList
} from '../app/web/js/main-render.js';
import { createRuntimeRenderEffects } from '../app/web/js/main-render-effects.js';
import { installRuntimeShellEventBindings } from '../app/web/js/main-runtime-shell.js';

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

function installDocumentStub() {
  activeElement = null;
  globalThis.document = {
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

test('gallery presentation facts preserve manifest order, trusted thumbnails, and current state', () => {
  const triggerFacts = buildGalleryTriggerPresentationFacts(manifest.items[1]);
  const galleryFacts = buildGalleryPresentationFacts(manifest, { activeFile: manifest.items[1].file });

  assert.match(triggerFacts.label, /2026-06-04/);
  assert.match(triggerFacts.fullLabel, /Quiet field/);
  assert.equal(galleryFacts.cards.map((card) => card.file).join(','), './data/artworks/a.json,./data/artworks/b.json');
  assert.deepEqual(galleryFacts.cards[0].thumbnail, {
    src: './data/media/a/thumb-320.jpg',
    altText: 'A bright abstract garden.'
  });
  assert.equal(galleryFacts.cards[1].active, true);
  assert.equal(galleryFacts.cards[1].ariaCurrent, 'true');
});

test('archive card renderer marks the active gallery card as current', () => {
  installDocumentStub();
  const card = createArchiveCardElement(manifest.items[0], () => {}, { active: true });

  assert.equal(card.className, 'archive-card active');
  assert.equal(card.attributes['aria-current'], 'true');
  assert.match(card.innerHTML, /Current artwork/);
  assert.match(card.innerHTML, /<img src="\.\/data\/media\/a\/thumb-320\.jpg"/);
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
  assert.equal(facts.cards[0].ariaCurrent, 'true');
  galleryList.children[1].listeners.click({});
  galleryList.children[0].listeners.keydown({ key: 'Enter', preventDefault() {} });
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
  refs.galleryList.children[0].listeners.click({});
  assert.deepEqual(loadedFiles, []);
  assert.equal(refs.galleryDialog.hidden, true);
  assert.equal(activeElement, refs.galleryTrigger);

  effects.openGallery();
  refs.galleryList.children[1].listeners.click({});
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
