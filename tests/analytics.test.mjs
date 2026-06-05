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

test('analytics pushes virtual page views through dataLayer for GTM-only installs', () => {
  const windowRef = {
    __rustyAnalytics: { gtmId: 'GTM-TEST' },
    dataLayer: [],
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

  assert.equal(result.status, 'dataLayer');
  assert.equal(windowRef.dataLayer[0].event, 'page_view');
  assert.equal(windowRef.dataLayer[0].page_path, '/art/example/');
  assert.equal(windowRef.dataLayer[0].artwork_slug, 'example');
});
