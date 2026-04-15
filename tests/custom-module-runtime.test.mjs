import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { compileCustomModuleRegistry } from '../app/web/js/scene-custom-module-runtime.js';

function createShaderBuilder({ transparent, doubleSided }) {
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
  return builder;
}

test('custom shader modules honor opaque single-sided authored flags', () => {
  const builder = createShaderBuilder({ transparent: false, doubleSided: false });
  const built = builder({
    primitive: { moduleType: 'cm.test.material-flags', opacity: 1 },
    sceneCfg: { palette: { primary: '#ffffff', secondary: '#000000' } },
    seed: 1,
    index: 0
  });
  const material = built.obj.material;
  assert.equal(material.transparent, false);
  assert.equal(material.depthWrite, true);
  assert.equal(material.side, THREE.FrontSide);
});

test('custom shader modules honor transparent double-sided authored flags', () => {
  const builder = createShaderBuilder({ transparent: true, doubleSided: true });
  const built = builder({
    primitive: { moduleType: 'cm.test.material-flags', opacity: 1 },
    sceneCfg: { palette: { primary: '#ffffff', secondary: '#000000' } },
    seed: 1,
    index: 0
  });
  const material = built.obj.material;
  assert.equal(material.transparent, true);
  assert.equal(material.depthWrite, false);
  assert.equal(material.side, THREE.DoubleSide);
});

test('custom shader modules honor top-level element transforms', () => {
  const builder = createShaderBuilder({ transparent: true, doubleSided: true });
  const built = builder({
    primitive: {
      moduleType: 'cm.test.material-flags',
      opacity: 1,
      position: [0, 0.66, 0.14],
      scale: [0.42, 0.42, 1],
      rotation: [0, 0, 0.25]
    },
    sceneCfg: { palette: { primary: '#ffffff', secondary: '#000000' } },
    seed: 1,
    index: 0
  });

  assert.equal(built.obj.position.x, 0);
  assert.equal(built.obj.position.y, 0.66);
  assert.equal(built.obj.position.z, 0.14);
  assert.equal(built.obj.scale.x, 0.42);
  assert.equal(built.obj.scale.y, 0.42);
  assert.equal(built.obj.scale.z, 1);
  assert.equal(built.obj.rotation.z, 0.25);
});

test('custom shader modules disable frustum culling for shader-deformed content', () => {
  const builder = createShaderBuilder({ transparent: true, doubleSided: true });
  const built = builder({
    primitive: { moduleType: 'cm.test.material-flags', opacity: 1 },
    sceneCfg: { palette: { primary: '#ffffff', secondary: '#000000' } },
    seed: 1,
    index: 0
  });

  assert.equal(built.obj.frustumCulled, false);
});

test('custom shader modules honor legacy top-level offset and z fields', () => {
  const builder = createShaderBuilder({ transparent: true, doubleSided: true });
  const built = builder({
    primitive: {
      moduleType: 'cm.test.material-flags',
      opacity: 1,
      offset: [0.18, 0.02, 0.07],
      scale: [0.34, 1.05, 1]
    },
    sceneCfg: { palette: { primary: '#ffffff', secondary: '#000000' } },
    seed: 1,
    index: 0
  });

  assert.equal(built.obj.position.x, 0.18);
  assert.equal(built.obj.position.y, 0.02);
  assert.equal(built.obj.position.z, 0.07);
  assert.equal(built.obj.scale.x, 0.34);
  assert.equal(built.obj.scale.y, 1.05);
  assert.equal(built.obj.scale.z, 1);
});

test('custom shader modules map named palette uniforms to the intended scene colors', () => {
  const { builders } = compileCustomModuleRegistry({
    customModules: [
      {
        id: 'cm.test.palette-uniforms',
        family: 'shader',
        kind: 'dsl',
        seedPolicy: 'deterministic',
        source: {
          dsl: { width: 1, height: 1 },
          glsl: {
            vertex: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
            fragment: 'uniform vec3 uBgColor; uniform vec3 uPrimary; uniform vec3 uSecondary; uniform vec3 uAnchor; uniform vec3 uGlow; void main(){ gl_FragColor = vec4(uGlow, 1.0); }'
          }
        }
      }
    ]
  });

  const builder = builders.get('cm.test.palette-uniforms');
  const built = builder({
    primitive: { moduleType: 'cm.test.palette-uniforms', opacity: 1 },
    sceneCfg: {
      palette: {
        bg: '#221814',
        primary: '#6f2c18',
        secondary: '#8eb8c8',
        anchor: '#8eb8c8',
        glow: '#f2d7a6'
      }
    },
    seed: 1,
    index: 0
  });

  assert.equal(built.uniforms.uBgColor.value.getHexString(), '221814');
  assert.equal(built.uniforms.uPrimary.value.getHexString(), '6f2c18');
  assert.equal(built.uniforms.uSecondary.value.getHexString(), '8eb8c8');
  assert.equal(built.uniforms.uAnchor.value.getHexString(), '8eb8c8');
  assert.equal(built.uniforms.uGlow.value.getHexString(), 'f2d7a6');
});
