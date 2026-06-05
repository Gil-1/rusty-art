import test from 'node:test';
import assert from 'node:assert/strict';

import { startAnalytics, trackAnalyticsPageView } from '../app/web/js/analytics.js';

test('analytics treats missing Vite env as empty config', () => {
  assert.doesNotThrow(() => startAnalytics({
    env: undefined,
    windowRef: {},
    documentRef: {}
  }));
});

test('analytics installs Google tag from PUBLIC_GTM_ID', () => {
  const appendedScripts = [];
  const windowRef = {
    location: new URL('https://rusty.test/')
  };
  const documentRef = {
    title: 'Rusty Art',
    referrer: '',
    getElementById: () => null,
    createElement: () => ({}),
    head: {
      appendChild: (script) => appendedScripts.push(script)
    }
  };

  startAnalytics({
    env: { PUBLIC_GTM_ID: 'G-TEST123' },
    windowRef,
    documentRef
  });

  assert.equal(windowRef.__rustyAnalytics.googleTagId, 'G-TEST123');
  assert.equal(appendedScripts[0].id, 'rusty-google-tag-script');
  assert.equal(appendedScripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-TEST123');
  assert.equal(windowRef.dataLayer.length, 2);
  assert.equal(Array.from(windowRef.dataLayer[0])[0], 'js');
  assert.deepEqual(Array.from(windowRef.dataLayer[1]).slice(0, 2), ['config', 'G-TEST123']);
  assert.equal(Array.from(windowRef.dataLayer[1])[2].page_path, '/');
});

test('analytics pushes virtual page views through gtag config', () => {
  const gtagCalls = [];
  const windowRef = {
    __rustyAnalytics: { googleTagId: 'G-TEST123' },
    gtag: (...args) => gtagCalls.push(args),
    location: new URL('https://rusty.test/art/example/')
  };
  const documentRef = {
    title: 'Example | Rusty Art',
    referrer: ''
  };

  const result = trackAnalyticsPageView({
    windowRef,
    documentRef,
    context: { artwork_slug: 'example' }
  });

  assert.equal(result.status, 'gtag');
  assert.deepEqual(gtagCalls[0].slice(0, 2), ['config', 'G-TEST123']);
  assert.equal(gtagCalls[0][2].page_path, '/art/example/');
  assert.equal(gtagCalls[0][2].artwork_slug, 'example');
});
