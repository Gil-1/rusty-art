import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeGeneratedModuleShaderMaterials,
} from '../app/web/js/immersive-world-scene.js';

function objectWithMaterials(materials) {
  return {
    isObject3D: true,
    traverse(callback) {
      callback({ material: materials });
    },
  };
}

test('normalizes generated shader materials that reference uScale without declaring it', () => {
  const material = {
    uniforms: { uScale: { value: 1 } },
    vertexShader: 'void main(){ gl_PointSize = uScale; }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(1.0); }',
    needsUpdate: false,
  };

  const result = normalizeGeneratedModuleShaderMaterials(objectWithMaterials(material));

  assert.equal(result.patchedUniforms, 1);
  assert.match(material.vertexShader, /^uniform float uScale;\n/);
  assert.equal(material.needsUpdate, true);
});

test('does not duplicate existing uScale declarations', () => {
  const material = {
    uniforms: { uScale: { value: 1 } },
    vertexShader: 'uniform float uScale;\nvoid main(){ gl_PointSize = uScale; }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(1.0); }',
    needsUpdate: false,
  };

  const result = normalizeGeneratedModuleShaderMaterials(objectWithMaterials(material));

  assert.equal(result.patchedUniforms, 0);
  assert.equal(material.vertexShader.match(/uniform float uScale;/g).length, 1);
  assert.equal(material.needsUpdate, false);
});

test('keeps GLSL version directives first when adding uScale declarations', () => {
  const material = {
    uniforms: { uScale: { value: 1 } },
    vertexShader: '#version 300 es\nvoid main(){ gl_PointSize = uScale; }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(1.0); }',
  };

  normalizeGeneratedModuleShaderMaterials(objectWithMaterials(material));

  assert.match(material.vertexShader, /^#version 300 es\nuniform float uScale;\n/);
});
