import test from 'node:test';
import assert from 'node:assert/strict';

import { builders } from '../app/web/js/primitives/shader-family.js';

function baseSceneCfg() {
  return {
    palette: {
      bg: '#111111',
      primary: '#222222',
      secondary: '#333333',
      glow: '#444444',
      anchor: '#555555'
    },
    flowField: 0.5,
    distortion: 0.25,
    post: { vignette: 0.2 },
    expression: { tension: 0.3 },
    anchorOffsetX: 0
  };
}

test('flow-noise-slab keeps authored transform overrides', () => {
  const built = builders['flow-noise-slab']({
    primitive: {
      moduleType: 'flow-noise-slab',
      opacity: 0.4,
      scaleX: 1.7,
      scaleY: 0.6,
      offsetZ: -4.4,
      rotationZ: 0.41
    },
    sceneCfg: baseSceneCfg()
  });

  assert.equal(built.obj.scale.x, 1.7);
  assert.equal(built.obj.scale.y, 0.6);
  assert.equal(built.obj.position.z, -4.4);
  assert.equal(built.obj.rotation.z, 0.41);
});

test('flow-noise-slab still applies defaults when no authored transform overrides exist', () => {
  const built = builders['flow-noise-slab']({
    primitive: {
      moduleType: 'flow-noise-slab',
      opacity: 0.4
    },
    sceneCfg: baseSceneCfg()
  });

  assert.equal(built.obj.scale.x, 1.1);
  assert.equal(built.obj.scale.y, 0.8);
  assert.equal(built.obj.position.z, -2.6);
  assert.equal(built.obj.rotation.z, 0.13);
});

test('shader-family plane builders disable frustum culling for shader-deformed content', () => {
  const built = builders['shader-field-plane']({
    primitive: {
      moduleType: 'shader-field-plane',
      opacity: 0.5
    },
    sceneCfg: baseSceneCfg()
  });

  assert.equal(built.obj.frustumCulled, false);
});

test('agent-shader-plane honors legacy top-level scale, offset, and z fields', () => {
  const built = builders['agent-shader-plane']({
    primitive: {
      moduleType: 'agent-shader-plane',
      scale: [5.4, 3.6],
      offset: [0.32, 0.06],
      z: -0.18,
      opacity: 0.5
    },
    sceneCfg: baseSceneCfg()
  });

  assert.equal(built.obj.scale.x, 5.4);
  assert.equal(built.obj.scale.y, 3.6);
  assert.equal(built.obj.position.x, 0.32);
  assert.equal(built.obj.position.y, 0.06);
  assert.equal(built.obj.position.z, -0.18);
});

test('anchor-core honors legacy offset arrays', () => {
  const built = builders['anchor-core']({
    primitive: {
      moduleType: 'anchor-core',
      scale: 0.42,
      offset: [0.92, 0.38, 0.2],
      opacity: 0.5,
      color: 'anchor'
    },
    sceneCfg: baseSceneCfg()
  });

  assert.equal(built.obj.position.x, 0.92);
  assert.equal(built.obj.position.y, 0.38);
  assert.equal(built.obj.position.z, 0.2);
});
