import test from 'node:test';
import assert from 'node:assert/strict';

import { createRendererAnimationLoopAdapter, createSceneFrameLifecycle } from '../app/web/js/scene-frame-lifecycle.js';

test('scene frame lifecycle uses renderer animation loop when available and clears it on stop', () => {
  const calls = [];
  const renderer = {
    setAnimationLoop(callback) {
      calls.push(callback);
    }
  };
  const lifecycle = createSceneFrameLifecycle({
    onResize() {},
    onFrame() {},
    timing: {
      requestAnimationFrame() { throw new Error('requestAnimationFrame should not be used'); },
      cancelAnimationFrame() {},
      setTimeout,
      clearTimeout
    },
    animationLoopAdapter: createRendererAnimationLoopAdapter(renderer)
  });

  lifecycle.start();
  assert.equal(lifecycle.getFacts().usingAnimationLoop, true);
  assert.equal(typeof calls[0], 'function');

  lifecycle.stop();
  assert.equal(calls.at(-1), null);
  assert.equal(lifecycle.getFacts().usingAnimationLoop, false);
});

test('scene frame lifecycle falls back when renderer animation loop seam reports unavailable', () => {
  const loopCalls = [];
  const scheduledFrames = [];
  const cancelledFrames = [];
  const lifecycle = createSceneFrameLifecycle({
    onResize() {},
    onFrame() {},
    timing: {
      requestAnimationFrame(callback) {
        scheduledFrames.push(callback);
        return scheduledFrames.length;
      },
      cancelAnimationFrame(frameId) {
        cancelledFrames.push(frameId);
      },
      setTimeout,
      clearTimeout
    },
    animationLoopAdapter: createRendererAnimationLoopAdapter({
      setAnimationLoop(callback) {
        loopCalls.push(callback);
        return false;
      }
    })
  });

  lifecycle.start();
  assert.equal(lifecycle.getFacts().usingAnimationLoop, false);
  assert.equal(lifecycle.getFacts().scheduledAnimationFrame, true);
  assert.equal(typeof loopCalls[0], 'function');

  lifecycle.stop();
  assert.deepEqual(cancelledFrames, [1]);
});
