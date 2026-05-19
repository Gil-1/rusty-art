import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import {
  createMaterializationEnvironmentBackground,
} from '../app/web/js/scene-assembly.js';

function textureBytes(texture) {
  return Array.from(texture.image.data.slice(0, 12));
}

test('legacy full-frame artwork ground keeps palette.bg as the canvas ground', () => {
  const sceneCfg = {
    palette: {
      bg: '#f2ead8',
      secondary: '#167c78',
    },
    materialization: {
      environmentLayer: {
        enabled: true,
        role: 'full-frame-artwork-ground',
        renderSurface: 'scene-background-texture',
        colorA: 'palette.bg',
        colorB: 'palette.secondary',
        texture: {
          grain: 0,
          wash: 1,
        },
      },
    },
  };

  const neutralGround = createMaterializationEnvironmentBackground(sceneCfg);
  const explicitBgGround = createMaterializationEnvironmentBackground({
    ...sceneCfg,
    materialization: {
      environmentLayer: {
        ...sceneCfg.materialization.environmentLayer,
        colorB: 'palette.bg',
      },
    },
  });

  assert.deepEqual(textureBytes(neutralGround), textureBytes(explicitBgGround));
  assert.deepEqual(textureBytes(neutralGround).slice(0, 4), [242, 234, 216, 255]);
  assert.equal(neutralGround.magFilter, THREE.LinearFilter);
  assert.equal(neutralGround.minFilter, THREE.LinearFilter);
  assert.equal(neutralGround.generateMipmaps, false);
});

test('non-ground environment layers may still use a chromatic background wash', () => {
  const baseScene = {
    palette: {
      bg: '#f2ead8',
      secondary: '#167c78',
    },
    materialization: {
      environmentLayer: {
        enabled: true,
        role: 'immersive-atmosphere',
        renderSurface: 'scene-background-texture',
        colorA: 'palette.bg',
        colorB: 'palette.secondary',
        texture: {
          grain: 0,
          wash: 1,
        },
      },
    },
  };

  const chromatic = createMaterializationEnvironmentBackground(baseScene);
  const neutral = createMaterializationEnvironmentBackground({
    ...baseScene,
    materialization: {
      environmentLayer: {
        ...baseScene.materialization.environmentLayer,
        colorB: 'palette.bg',
      },
    },
  });

  assert.notDeepEqual(textureBytes(chromatic), textureBytes(neutral));
});
