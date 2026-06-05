import test from 'node:test';
import assert from 'node:assert/strict';

import { startAnalytics } from '../app/web/js/analytics.js';

test('analytics treats missing Vite env as empty config', () => {
  assert.doesNotThrow(() => startAnalytics({
    env: undefined,
    windowRef: {},
    documentRef: {}
  }));
});
