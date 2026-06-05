import test from 'node:test';
import assert from 'node:assert/strict';

import { createRuntimeController } from '../app/web/js/main-runtime-controller.js';

function createArtwork(id, rendererProfile) {
  return {
    id,
    artCreationMethod: 'immersive-world-v1',
    rendererProfile
  };
}

function createDeferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function createControllerWithFakeScene({ onImport = null } = {}) {
  const scenes = [];
  let importCallCount = 0;
  class FakeArtworkScene {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.createdFor = options.art;
      this.applied = [];
      this.disposed = false;
      this.stopped = false;
      scenes.push(this);
    }

    canRenderArtwork(art) {
      return art?.rendererProfile === this.createdFor?.rendererProfile;
    }

    async applyConfig(art) {
      this.applied.push(art.id);
      return true;
    }

    getRendererDiagnostics() {
      return {
        rendererMode: this.createdFor?.rendererProfile || null,
        rendererBackend: this.createdFor?.rendererProfile || null
      };
    }

    getAssemblyReport() {
      return null;
    }

    dispose() {
      this.disposed = true;
    }

    stop() {
      this.stopped = true;
    }
  }

  const controller = createRuntimeController({
    canvas: { style: {} },
    captureStateController: { update() {} },
    fetchArtwork: async () => null,
    getActiveFile: () => null,
    getMotionIntensity: () => 1,
    importImmersiveWorldSceneModule: async () => {
      importCallCount += 1;
      await onImport?.(importCallCount);
      return { ArtworkScene: FakeArtworkScene };
    },
    observerFactory: null,
    windowRef: {
      navigator: {},
      setTimeout: (fn) => setTimeout(fn, 0),
      clearTimeout
    }
  });

  return { controller, scenes, getImportCallCount: () => importCallCount };
}

test('runtime controller recreates immersive scene when renderer profile changes', async () => {
  const { controller, scenes } = createControllerWithFakeScene();

  await controller.applyArtworkToScene({ file: './data/artworks/latest.json', art: createArtwork('latest', 'webgpu') });
  await controller.applyArtworkToScene({ file: './data/artworks/legacy.json', art: createArtwork('legacy', 'webgl') });

  assert.equal(scenes.length, 2);
  assert.equal(scenes[0].disposed, true);
  assert.equal(scenes[0].stopped, true);
  assert.deepEqual(scenes[0].applied, ['latest']);
  assert.deepEqual(scenes[1].applied, ['legacy']);
});

test('runtime controller reuses immersive scene when renderer profile stays compatible', async () => {
  const { controller, scenes } = createControllerWithFakeScene();

  await controller.applyArtworkToScene({ file: './data/artworks/a.json', art: createArtwork('a', 'webgl') });
  await controller.applyArtworkToScene({ file: './data/artworks/b.json', art: createArtwork('b', 'webgl') });

  assert.equal(scenes.length, 1);
  assert.equal(scenes[0].disposed, false);
  assert.deepEqual(scenes[0].applied, ['a', 'b']);
});

test('runtime controller rechecks renderer profile after in-flight immersive scene load', async () => {
  const firstImport = createDeferred();
  const { controller, scenes, getImportCallCount } = createControllerWithFakeScene({
    onImport: (callCount) => (callCount === 1 ? firstImport.promise : null)
  });

  const firstScenePromise = controller.ensureScene({ art: createArtwork('latest', 'webgpu') });
  const secondScenePromise = controller.ensureScene({ art: createArtwork('legacy', 'webgl') });

  assert.equal(getImportCallCount(), 1);
  assert.equal(scenes.length, 0);

  firstImport.resolve();
  const [firstScene, secondScene] = await Promise.all([firstScenePromise, secondScenePromise]);

  assert.notEqual(firstScene, secondScene);
  assert.equal(scenes.length, 2);
  assert.equal(scenes[0].disposed, true);
  assert.equal(scenes[0].stopped, true);
  assert.equal(scenes[1].createdFor.id, 'legacy');
  assert.equal(getImportCallCount(), 2);
});
