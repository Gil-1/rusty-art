import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { bindOrbitInput } from '../app/web/js/scene-camera.js';

function createSceneStub() {
  const listeners = new Map();
  const windowListeners = new Map();
  const windowTarget = {
    addEventListener(type, handler, options) {
      windowListeners.set(type, { handler, options });
    },
    removeEventListener() {}
  };
  const canvas = {
    ownerDocument: { defaultView: windowTarget },
    addEventListener(type, handler, options) {
      listeners.set(type, { handler, options });
    },
    removeEventListener() {},
    setPointerCapture() {},
    releasePointerCapture() {}
  };

  return {
    listeners,
    windowListeners,
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
        minDistance: 7.8,
        maxDistance: 32,
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

function touchListEvent(points, overrides = {}) {
  return {
    touches: points.map(([clientX, clientY]) => ({ clientX, clientY })),
    preventDefault() {},
    ...overrides
  };
}

function gestureEvent(scale, overrides = {}) {
  return {
    scale,
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

test('two-finger touch pinch prevents viewport zoom and changes camera distance', () => {
  const { scene, windowListeners } = createSceneStub();
  bindOrbitInput(scene);

  const touchstart = windowListeners.get('touchstart');
  const touchmove = windowListeners.get('touchmove');

  assert.ok(touchstart, 'touchstart listener should be registered');
  assert.ok(touchmove, 'touchmove listener should be registered');
  assert.equal(touchstart.options?.passive, false);
  assert.equal(touchmove.options?.passive, false);
  assert.equal(touchstart.options?.capture, true);
  assert.equal(touchmove.options?.capture, true);

  let prevented = 0;
  const countPrevented = () => {
    prevented += 1;
  };

  touchstart.handler(touchListEvent([[100, 100], [200, 100]], { preventDefault: countPrevented }));

  const initialRadius = scene.orbit.radius;
  touchmove.handler(touchListEvent([[100, 100], [220, 100]], { preventDefault: countPrevented }));

  assert.equal(scene.orbit.radius, initialRadius * (100 / 120));
  assert.equal(scene.orbit.userControlLocked, true);
  assert.equal(scene.orbit.dragging, false);
  assert.equal(prevented, 2);
});

test('safari gesture pinch is cancelled and drives camera zoom as a fallback', () => {
  const { scene, windowListeners } = createSceneStub();
  bindOrbitInput(scene);

  const gesturestart = windowListeners.get('gesturestart');
  const gesturechange = windowListeners.get('gesturechange');

  assert.ok(gesturestart, 'gesturestart listener should be registered');
  assert.ok(gesturechange, 'gesturechange listener should be registered');
  assert.equal(gesturestart.options?.passive, false);
  assert.equal(gesturechange.options?.passive, false);
  assert.equal(gesturestart.options?.capture, true);
  assert.equal(gesturechange.options?.capture, true);

  let prevented = 0;
  const countPrevented = () => {
    prevented += 1;
  };

  gesturestart.handler(gestureEvent(1, { preventDefault: countPrevented }));

  const initialRadius = scene.orbit.radius;
  gesturechange.handler(gestureEvent(1.25, { preventDefault: countPrevented }));

  assert.ok(Math.abs(scene.orbit.radius - (initialRadius / 1.25)) < 0.000001);
  assert.equal(scene.orbit.userControlLocked, true);
  assert.equal(scene.orbit.dragging, false);
  assert.equal(prevented, 2);
});

test('camera zoom clamps allow more dezoom and less max zoom', () => {
  const { scene, listeners } = createSceneStub();
  bindOrbitInput(scene);

  const wheel = listeners.get('wheel');
  assert.ok(wheel, 'wheel listener should be registered');

  scene.orbit.radius = 31.5;
  wheel.handler({
    deltaY: 1,
    preventDefault() {}
  });
  assert.equal(scene.orbit.radius, 32);

  scene.orbit.radius = 8;
  wheel.handler({
    deltaY: -1,
    preventDefault() {}
  });
  assert.equal(scene.orbit.radius, 7.8);
});

test('mobile viewport does not opt out of user scaling', async () => {
  const html = await readFile(new URL('../app/web/index.html', import.meta.url), 'utf8');
  const viewport = html.match(/<meta\s+name="viewport"\s+content="([^"]*)"\s*\/?>/);

  assert.ok(viewport, 'missing viewport meta tag');
  assert.doesNotMatch(viewport[1], /user-scalable\s*=\s*no/i);
  assert.doesNotMatch(viewport[1], /maximum-scale\s*=\s*1(?:\.0+)?/i);
});
