import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { bindOrbitInput } from '../app/web/js/scene-camera.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesPath = path.resolve(__dirname, '../app/web/styles.css');

function createSceneStub() {
  const listeners = new Map();
  const canvas = {
    addEventListener(type, handler, options) {
      listeners.set(type, { handler, options });
    },
    setPointerCapture() {},
    releasePointerCapture() {}
  };

  return {
    listeners,
    scene: {
      canvas,
      orbit: {
        dragging: false,
        userControlLocked: false,
        lastX: 0,
        lastY: 0,
        thetaVel: 0,
        phiVel: 0
      },
      controls: {
        maxDistance: 100,
        minDistance: 1,
        dampingFactor: 0.1,
        autoRotate: false,
        autoRotateSpeed: 0
      }
    }
  };
}

test('canvas touch drag prevents default browser panning and uses reduced touch sensitivity', () => {
  const { scene, listeners } = createSceneStub();
  bindOrbitInput(scene);

  const pointerdown = listeners.get('pointerdown');
  const pointermove = listeners.get('pointermove');

  assert.ok(pointerdown, 'pointerdown listener should be registered');
  assert.ok(pointermove, 'pointermove listener should be registered');
  assert.equal(pointerdown.options?.passive, false);
  assert.equal(pointermove.options?.passive, false);

  let preventedDown = false;
  pointerdown.handler({
    isPrimary: true,
    pointerType: 'touch',
    clientX: 100,
    clientY: 120,
    pointerId: 1,
    preventDefault() {
      preventedDown = true;
    }
  });

  assert.equal(preventedDown, true);
  assert.equal(scene.orbit.dragging, true);

  let preventedMove = false;
  pointermove.handler({
    pointerType: 'touch',
    clientX: 130,
    clientY: 150,
    preventDefault() {
      preventedMove = true;
    }
  });

  assert.equal(preventedMove, true);
  assert.equal(scene.orbit.thetaVel, -(30 * 0.0036 * 0.2));
  assert.equal(scene.orbit.phiVel, -(30 * 0.0028 * 0.2));
});

test('art canvas CSS disables touch-action scrolling', () => {
  const styles = fs.readFileSync(stylesPath, 'utf8');
  assert.match(styles, /#art-canvas\s*\{[^}]*touch-action:\s*none\s*;/s);
});
