import { createArchiveInteractionController } from './main-archive-interaction-controller.js';

function cloneFacts(facts, controller) {
  const manifest = controller?.getManifest?.() || null;
  return {
    status: facts.status,
    initCount: facts.initCount,
    lastInitStatus: facts.lastInitStatus,
    manifestCount: manifest?.items?.length ?? facts.manifestCount,
    activeLoads: facts.activeLoads,
    staleSelections: facts.staleSelections,
    sceneBoots: facts.sceneBoots
  };
}

export function createPublicArchiveRuntimeSession({
  createArchiveInteractionControllerFn = createArchiveInteractionController,
  runtimeController = null,
  captureStateController = null,
  render = {},
  ...controllerOptions
} = {}) {
  const facts = {
    status: 'created',
    initCount: 0,
    lastInitStatus: null,
    manifestCount: 0,
    activeLoads: 0,
    staleSelections: 0,
    sceneBoots: 0
  };

  const trackedRuntimeController = {
    ...runtimeController,
    async bootSceneNow(...args) {
      facts.sceneBoots += 1;
      return runtimeController?.bootSceneNow?.(...args);
    },
    requestDeferredSceneBoot(...args) {
      facts.sceneBoots += 1;
      return runtimeController?.requestDeferredSceneBoot?.(...args);
    }
  };

  const controller = createArchiveInteractionControllerFn({
    ...controllerOptions,
    runtimeController: trackedRuntimeController,
    captureStateController,
    render
  });

  async function trackLoad(operation) {
    facts.activeLoads += 1;
    try {
      const result = await operation();
      if (result?.status && String(result.status).startsWith('stale')) {
        facts.staleSelections += 1;
      }
      return result;
    } finally {
      facts.activeLoads = Math.max(0, facts.activeLoads - 1);
    }
  }

  async function init() {
    facts.status = 'initializing';
    facts.initCount += 1;
    try {
      const result = await controller.init();
      facts.lastInitStatus = result?.status || null;
      facts.manifestCount = result?.manifest?.items?.length || 0;
      facts.status = result?.status === 'empty' ? 'empty' : 'ready';
      return result;
    } catch (error) {
      facts.status = 'failed';
      facts.lastInitStatus = 'failed';
      throw error;
    }
  }

  return {
    init,
    loadArtworkByFile: (file) => trackLoad(() => controller.loadArtworkByFile(file)),
    loadArtworkByIndex: (index) => trackLoad(() => controller.loadArtworkByIndex(index)),
    loadArtworkByStep: (step) => trackLoad(() => controller.loadArtworkByStep(step)),
    loadArtworkFromRoute: (route) => trackLoad(() => controller.loadArtworkFromRoute(route)),
    appendArchiveItems: (...args) => controller.appendArchiveItems(...args),
    handleQuickPrevious: () => trackLoad(() => controller.handleQuickPrevious()),
    handleQuickNext: () => trackLoad(() => controller.handleQuickNext()),
    handleQuickPickerChange: (eventOrValue) => trackLoad(() => controller.handleQuickPickerChange(eventOrValue)),
    handleKeyboardCommand: (...args) => controller.handleKeyboardCommand(...args),
    getManifest: (...args) => controller.getManifest(...args),
    getManifestFallbackReason: (...args) => controller.getManifestFallbackReason(...args),
    getRenderedArchiveCount: (...args) => controller.getRenderedArchiveCount(...args),
    getController: () => controller,
    getFacts: () => cloneFacts(facts, controller)
  };
}
