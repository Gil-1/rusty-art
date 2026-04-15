import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { compileCustomModuleRegistry } from '../app/web/js/scene-custom-module-runtime.js';

function buildCustomShaderMaterial({ transparent, doubleSided }) {
  const { builders } = compileCustomModuleRegistry({
    customModules: [
      {
        id: 'cm.test.material-flags',
        family: 'shader',
        kind: 'dsl',
        seedPolicy: 'deterministic',
        source: {
          dsl: {
            primitive: 'plane',
            material: 'shader',
            transparent,
            doubleSided,
            width: 1,
            height: 1
          },
          glsl: {
            vertex: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
            fragment: 'precision highp float; varying vec2 vUv; void main(){ gl_FragColor = vec4(vUv, 0.0, 1.0); }'
          }
        }
      }
    ]
  });

  const builder = builders.get('cm.test.material-flags');
  assert.ok(builder, 'builder should be registered');
  const built = builder({
    primitive: { moduleType: 'cm.test.material-flags', opacity: 1 },
    sceneCfg: { palette: { primary: '#ffffff', secondary: '#000000' } },
    seed: 1,
    index: 0
  });
  return built.obj.material;
}

test('custom shader modules honor opaque single-sided authored flags', () => {
  const material = buildCustomShaderMaterial({ transparent: false, doubleSided: false });
  assert.equal(material.transparent, false);
  assert.equal(material.depthWrite, true);
  assert.equal(material.side, THREE.FrontSide);
});

test('custom shader modules honor transparent double-sided authored flags', () => {
  const material = buildCustomShaderMaterial({ transparent: true, doubleSided: true });
  assert.equal(material.transparent, true);
  assert.equal(material.depthWrite, false);
  assert.equal(material.side, THREE.DoubleSide);
});
