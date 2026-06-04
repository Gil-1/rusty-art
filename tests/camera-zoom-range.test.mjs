import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { DEFAULT_RENDERING_CONFIG } from '../app/web/js/contracts/rendering-config-contract.js';

const EXPECTED_MIN_DISTANCE = 7.8;
const EXPECTED_MAX_DISTANCE = 32;

test('rendering config defaults use the tuned camera zoom range', () => {
  assert.equal(DEFAULT_RENDERING_CONFIG.camera.minDistance, EXPECTED_MIN_DISTANCE);
  assert.equal(DEFAULT_RENDERING_CONFIG.camera.maxDistance, EXPECTED_MAX_DISTANCE);
});

test('legacy scene constructors use the same camera zoom range', async () => {
  const sceneSource = await readFile(new URL('../app/web/js/scene.js', import.meta.url), 'utf8');
  const immersiveSource = await readFile(new URL('../app/web/js/immersive-world-scene.js', import.meta.url), 'utf8');

  for (const source of [sceneSource, immersiveSource]) {
    assert.match(source, /minDistance:\s*7\.8,/);
    assert.match(source, /maxDistance:\s*32,/);
  }
});
