import test from 'node:test';
import assert from 'node:assert/strict';

import { builders } from '../app/web/js/primitives/geometry-family.js';

function baseSceneCfg() {
  return {
    palette: {
      bg: '#111111',
      primary: '#222222',
      secondary: '#333333',
      glow: '#444444',
      anchor: '#f6d36b'
    }
  };
}

test('fault-line honors authored start and end segment hints', () => {
  const built = builders['fault-line']({
    primitive: {
      moduleType: 'fault-line',
      color: 'anchor',
      opacity: 0.95,
      intensity: 0.92,
      start: [-0.08, -1.1, 0.12],
      end: [0.18, 1.18, 0.16]
    },
    sceneCfg: baseSceneCfg(),
    seed: 1,
    index: 0
  });

  const positions = Array.from(built.obj.geometry.attributes.position.array);
  const xs = positions.filter((_, index) => index % 3 === 0);
  const ys = positions.filter((_, index) => index % 3 === 1);
  const zs = positions.filter((_, index) => index % 3 === 2);

  assert.ok(Math.min(...xs) > -0.4, 'fault line should stay near authored x segment, not span the full scene');
  assert.ok(Math.max(...xs) < 0.5, 'fault line should stay near authored x segment, not span the full scene');
  assert.ok(Math.min(...ys) < -1.0, 'fault line should preserve the lower authored reach');
  assert.ok(Math.max(...ys) > 1.0, 'fault line should preserve the upper authored reach');
  assert.ok(Math.min(...zs) >= 0.0, 'fault line should preserve forward authored z placement');
  assert.ok(Math.max(...zs) <= 0.3, 'fault line should preserve forward authored z placement');
});

test('fault-line honors legacy scalar offset as x offset', () => {
  const built = builders['fault-line']({
    primitive: {
      moduleType: 'fault-line',
      color: 'anchor',
      opacity: 0.95,
      intensity: 0.92,
      offset: 0.18
    },
    sceneCfg: baseSceneCfg(),
    seed: 1,
    index: 0
  });

  assert.equal(built.obj.position.x, 0.18);
});

test('suprematist-planes honors legacy offset arrays', () => {
  const built = builders['suprematist-planes']({
    primitive: {
      moduleType: 'suprematist-planes',
      offset: [0, -0.24, 0.05],
      opacity: 0.5
    },
    sceneCfg: baseSceneCfg(),
    seed: 1,
    index: 0
  });

  assert.equal(built.obj.position.y, -0.24);
  assert.equal(built.obj.position.z, 0.05);
});

test('polyhedron-array honors legacy scalar scale', () => {
  const built = builders['polyhedron-array']({
    primitive: {
      moduleType: 'polyhedron-array',
      scale: 0.12,
      opacity: 0.5
    },
    sceneCfg: baseSceneCfg(),
    seed: 1,
    index: 0
  });

  assert.equal(built.obj.scale.x, 0.12);
  assert.equal(built.obj.scale.y, 0.12);
  assert.equal(built.obj.scale.z, 0.12);
});
