import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { applyImmersiveWorldTextureQuality } from '../app/web/js/immersive-world-scene.js';

function objectWithMaterial(material) {
  return {
    traverse(callback) {
      callback({ material });
    }
  };
}

test('immersive world texture quality normalizes accepted advanced material maps', () => {
  const rgbData = new Uint8Array([
    255, 0, 0,
    0, 255, 0,
    0, 0, 255,
    255, 255, 255
  ]);
  const rgbaData = new Uint8Array([
    255, 255, 255, 255,
    200, 180, 120, 255,
    80, 120, 220, 255,
    0, 0, 0, 255
  ]);
  const rgbTexture = new THREE.DataTexture(rgbData, 2, 2, THREE.RGBFormat, THREE.UnsignedByteType);
  const rgbaTexture = new THREE.DataTexture(rgbaData, 2, 2, THREE.RGBAFormat, THREE.UnsignedByteType);
  rgbTexture.colorSpace = THREE.SRGBColorSpace;
  rgbTexture.wrapS = THREE.RepeatWrapping;
  rgbTexture.wrapT = THREE.MirroredRepeatWrapping;
  rgbTexture.flipY = false;
  rgbTexture.minFilter = THREE.NearestFilter;
  rgbTexture.magFilter = THREE.NearestFilter;
  rgbTexture.generateMipmaps = true;
  const material = new THREE.MeshPhysicalMaterial({
    clearcoatMap: rgbTexture,
    sheenColorMap: rgbaTexture,
    transmissionMap: rgbaTexture
  });

  const facts = applyImmersiveWorldTextureQuality(objectWithMaterial(material), { THREE });

  assert.equal(rgbTexture.format, THREE.RGBAFormat);
  assert.equal(rgbTexture.image.data.length, 16);
  assert.equal(rgbTexture.image.width, 2);
  assert.equal(rgbTexture.image.height, 2);
  assert.equal(rgbTexture.colorSpace, THREE.SRGBColorSpace);
  assert.equal(rgbTexture.wrapS, THREE.RepeatWrapping);
  assert.equal(rgbTexture.wrapT, THREE.MirroredRepeatWrapping);
  assert.equal(rgbTexture.flipY, false);
  assert.equal(rgbTexture.minFilter, THREE.LinearFilter);
  assert.equal(rgbTexture.magFilter, THREE.LinearFilter);
  assert.equal(rgbTexture.generateMipmaps, false);
  assert.equal(facts.inspectedTextures, 2);
  assert.equal(facts.normalizedTextures >= 1, true);
  assert.equal(facts.unsupportedTextures, 0);
  assert.deepEqual(
    facts.textureFormatFacts.find((entry) => entry.field === 'clearcoatMap'),
    {
      field: 'clearcoatMap',
      textureType: 'DataTexture',
      format: 'RGBAFormat',
      type: 'UnsignedByteType',
      colorSpace: 'SRGBColorSpace',
      width: 2,
      height: 2,
      status: 'normalized',
      reason: 'rgb-unsigned-byte-to-rgba',
      changed: true
    }
  );
  assert.equal(
    facts.textureFormatFacts.some((entry) => entry.field === 'clearcoatMap' && entry.reason === 'rgb-unsigned-byte-to-rgba'),
    true
  );
  assert.equal(
    facts.textureFormatFacts.some((entry) => entry.field === 'sheenColorMap' && entry.reason === 'rgba-unsigned-byte'),
    true
  );
});

test('immersive world texture quality rejects unsupported RGB data texture uploads deterministically', () => {
  const texture = new THREE.DataTexture(new Uint8Array([255, 0, 0, 0]), 2, 2, THREE.RGBFormat, THREE.UnsignedByteType);
  const material = new THREE.MeshPhysicalMaterial({ specularColorMap: texture });

  assert.throws(
    () => applyImmersiveWorldTextureQuality(objectWithMaterial(material), { THREE }),
    /Unsupported WebGPU texture upload for specularColorMap/
  );
});

test('immersive world texture quality rejects unsupported RGB canvas-style uploads deterministically', () => {
  const texture = new THREE.Texture({ width: 2, height: 2 });
  texture.isCanvasTexture = true;
  texture.format = THREE.RGBFormat;
  texture.type = THREE.UnsignedByteType;
  const material = new THREE.MeshPhysicalMaterial({ specularColorMap: texture });

  assert.throws(
    () => applyImmersiveWorldTextureQuality(objectWithMaterial(material), { THREE }),
    /Unsupported WebGPU texture upload for specularColorMap/
  );
});

test('immersive world texture quality accepts RGBA canvas-style unsigned-byte uploads', () => {
  const texture = new THREE.Texture({ width: 2, height: 2 });
  texture.isCanvasTexture = true;
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.UnsignedByteType;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.flipY = true;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = true;
  const material = new THREE.MeshPhysicalMaterial({ clearcoatMap: texture });

  const facts = applyImmersiveWorldTextureQuality(objectWithMaterial(material), { THREE });

  assert.equal(facts.unsupportedTextures, 0);
  assert.equal(texture.colorSpace, THREE.SRGBColorSpace);
  assert.equal(texture.wrapS, THREE.RepeatWrapping);
  assert.equal(texture.wrapT, THREE.MirroredRepeatWrapping);
  assert.equal(texture.flipY, true);
  assert.equal(texture.minFilter, THREE.LinearFilter);
  assert.equal(texture.magFilter, THREE.LinearFilter);
  assert.equal(texture.generateMipmaps, false);
  assert.deepEqual(
    facts.textureFormatFacts.find((entry) => entry.field === 'clearcoatMap'),
    {
      field: 'clearcoatMap',
      textureType: 'CanvasTexture',
      format: 'RGBAFormat',
      type: 'UnsignedByteType',
      colorSpace: 'SRGBColorSpace',
      width: 2,
      height: 2,
      status: 'safe',
      reason: 'rgba-unsigned-byte',
      changed: false
    }
  );
  assert.equal(
    facts.textureFormatFacts.some((entry) => entry.field === 'clearcoatMap' && entry.reason === 'rgba-unsigned-byte'),
    true
  );
});
