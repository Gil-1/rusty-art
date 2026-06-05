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

function createFakeCanvas() {
  const canvas = {
    id: 'art-canvas',
    className: 'art-canvas',
    style: {},
    width: 300,
    height: 150,
    ownerDocument: null,
    cloneNode() {
      const next = createFakeCanvas();
      next.id = this.id;
      next.className = this.className;
      next.width = this.width;
      next.height = this.height;
      return next;
    },
    replaceWith(next) {
      this.replacedWith = next;
      next.replacedFrom = this;
    }
  };
  canvas.ownerDocument = { createElement: () => createFakeCanvas() };
  return canvas;
}

function createControllerWithFakeScene({ onImport = null } = {}) {
  const scenes = [];
  const replacedCanvases = [];
  const canvas = createFakeCanvas();
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
    canvas,
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
    onCanvasReplaced: (nextCanvas, previousCanvas) => {
      replacedCanvases.push({ nextCanvas, previousCanvas });
    },
    windowRef: {
      navigator: {},
      setTimeout: (fn) => setTimeout(fn, 0),
      clearTimeout
    }
  });

  return { controller, scenes, canvas, replacedCanvases, getImportCallCount: () => importCallCount };
}

test('runtime controller recreates immersive scene when renderer profile changes', async () => {
  const { controller, scenes, replacedCanvases } = createControllerWithFakeScene();

  await controller.applyArtworkToScene({ file: './data/artworks/latest.json', art: createArtwork('latest', 'webgpu') });
  await controller.applyArtworkToScene({ file: './data/artworks/legacy.json', art: createArtwork('legacy', 'webgl') });

  assert.equal(scenes.length, 2);
  assert.equal(scenes[0].disposed, true);
  assert.equal(scenes[0].stopped, true);
  assert.equal(replacedCanvases.length, 1);
  assert.notEqual(scenes[0].canvas, scenes[1].canvas);
  assert.deepEqual(scenes[0].applied, ['latest']);
  assert.deepEqual(scenes[1].applied, ['legacy']);
});

test('runtime controller recreates immersive scene when renderer profile changes back to webgpu', async () => {
  const { controller, scenes, replacedCanvases } = createControllerWithFakeScene();

  await controller.applyArtworkToScene({ file: './data/artworks/legacy.json', art: createArtwork('legacy', 'webgl') });
  await controller.applyArtworkToScene({ file: './data/artworks/latest.json', art: createArtwork('latest', 'webgpu') });

  assert.equal(scenes.length, 2);
  assert.equal(scenes[0].disposed, true);
  assert.equal(scenes[0].stopped, true);
  assert.equal(replacedCanvases.length, 1);
  assert.notEqual(scenes[0].canvas, scenes[1].canvas);
  assert.deepEqual(scenes[0].applied, ['legacy']);
  assert.deepEqual(scenes[1].applied, ['latest']);
});

test('runtime controller reuses immersive scene when renderer profile stays compatible', async () => {
  const { controller, scenes, replacedCanvases } = createControllerWithFakeScene();

  await controller.applyArtworkToScene({ file: './data/artworks/a.json', art: createArtwork('a', 'webgl') });
  await controller.applyArtworkToScene({ file: './data/artworks/b.json', art: createArtwork('b', 'webgl') });

  assert.equal(scenes.length, 1);
  assert.equal(scenes[0].disposed, false);
  assert.equal(replacedCanvases.length, 0);
  assert.deepEqual(scenes[0].applied, ['a', 'b']);
});

test('runtime controller rechecks renderer profile after in-flight immersive scene load', async () => {
  const firstImport = createDeferred();
  const { controller, scenes, replacedCanvases, getImportCallCount } = createControllerWithFakeScene({
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
  assert.equal(replacedCanvases.length, 1);
  assert.notEqual(firstScene.canvas, secondScene.canvas);
  assert.equal(scenes[1].createdFor.id, 'legacy');
  assert.equal(getImportCallCount(), 2);
});
