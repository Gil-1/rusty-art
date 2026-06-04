import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { bindOrbitInput } from '../app/web/js/scene-camera.js';

function createSceneStub() {
  const listeners = new Map();
  const canvas = {
    addEventListener(type, handler, options) {
      listeners.set(type, { handler, options });
    },
    removeEventListener() {},
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
        phiVel: 0,
        radius: 12
      },
      controls: {
        minDistance: 6,
        maxDistance: 24,
        dampingFactor: 0.08
      }
    }
  };
}

function touchEvent(pointerId, clientX, clientY, overrides = {}) {
  return {
    isPrimary: pointerId === 1,
    pointerType: 'touch',
    pointerId,
    clientX,
    clientY,
    preventDefault() {},
    ...overrides
  };
}

test('art canvas owns touch gestures for camera zoom', async () => {
  const styles = await readFile(new URL('../app/web/styles.css', import.meta.url), 'utf8');
  const canvasRule = styles.match(/#art-canvas\s*{[^}]*}/);

  assert.ok(canvasRule, 'missing #art-canvas rule');
  assert.match(canvasRule[0], /touch-action:\s*none;/);
  assert.doesNotMatch(canvasRule[0], /touch-action:\s*pinch-zoom;/);
});

test('two-finger pinch changes artwork camera distance', () => {
  const { scene, listeners } = createSceneStub();
  bindOrbitInput(scene);

  const pointerdown = listeners.get('pointerdown');
  const pointermove = listeners.get('pointermove');

  assert.ok(pointerdown, 'pointerdown listener should be registered');
  assert.ok(pointermove, 'pointermove listener should be registered');
  assert.equal(pointerdown.options?.passive, false);
  assert.equal(pointermove.options?.passive, false);

  let prevented = 0;
  const countPrevented = () => {
    prevented += 1;
  };

  pointerdown.handler(touchEvent(1, 100, 100, { preventDefault: countPrevented }));
  pointerdown.handler(touchEvent(2, 200, 100, { preventDefault: countPrevented }));

  const initialRadius = scene.orbit.radius;
  pointermove.handler(touchEvent(2, 220, 100, { preventDefault: countPrevented }));

  assert.equal(scene.orbit.radius, initialRadius * (100 / 120));
  assert.equal(scene.orbit.userControlLocked, true);
  assert.equal(scene.orbit.dragging, false);

  const zoomedInRadius = scene.orbit.radius;
  pointermove.handler(touchEvent(2, 160, 100, { preventDefault: countPrevented }));

  assert.equal(scene.orbit.radius, zoomedInRadius * (120 / 60));
  assert.equal(prevented, 4);
});

test('mobile viewport does not opt out of user scaling', async () => {
  const html = await readFile(new URL('../app/web/index.html', import.meta.url), 'utf8');
  const viewport = html.match(/<meta\s+name="viewport"\s+content="([^"]*)"\s*\/?>/);

  assert.ok(viewport, 'missing viewport meta tag');
  assert.doesNotMatch(viewport[1], /user-scalable\s*=\s*no/i);
  assert.doesNotMatch(viewport[1], /maximum-scale\s*=\s*1(?:\.0+)?/i);
});
