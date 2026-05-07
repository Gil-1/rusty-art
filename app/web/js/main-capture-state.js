import {
  CAPTURE_READINESS_GLOBAL,
  CAPTURE_READINESS_REFRESH_GLOBAL,
  CAPTURE_CANVAS_ID,
  CAPTURE_READY_DATASET_KEY,
  CAPTURE_READY_DATASET_VALUES,
  applyCaptureReadinessPatch,
  attachCaptureReadinessSnapshot,
  collectCaptureCanvasReadinessFacts,
  createCaptureReadinessState,
  isCaptureReadinessReady
} from './contracts/capture-readiness-contract.js';

function resolveDocument({ body = null, target = null, documentRef = null } = {}) {
  if (documentRef) return documentRef;
  if (body?.ownerDocument) return body.ownerDocument;
  if (target?.document) return target.document;
  return typeof document !== 'undefined' ? document : null;
}

export function createCaptureStateController({
  captureMode = false,
  body = typeof document !== 'undefined' ? document.body : null,
  target = globalThis,
  documentRef = null,
  canvas = null,
  canvasId = CAPTURE_CANVAS_ID
} = {}) {
  let state = null;
  const effectiveDocument = resolveDocument({ body, target, documentRef });

  function collectCanvasFacts() {
    return collectCaptureCanvasReadinessFacts({
      documentRef: effectiveDocument,
      canvas,
      canvasId
    });
  }

  function publish() {
    if (!state) return null;
    state = attachCaptureReadinessSnapshot(state, {
      canvasFacts: collectCanvasFacts()
    });
    target[CAPTURE_READINESS_GLOBAL] = state;
    target[CAPTURE_READINESS_REFRESH_GLOBAL] = refresh;
    if (captureMode && body?.dataset) {
      body.dataset[CAPTURE_READY_DATASET_KEY] = isCaptureReadinessReady(state)
        ? CAPTURE_READY_DATASET_VALUES.ready
        : CAPTURE_READY_DATASET_VALUES.pending;
    }
    return state.readinessDecision;
  }

  function refresh() {
    return publish();
  }

  function reset() {
    state = createCaptureReadinessState({ captureMode });
    publish();
  }

  function update(patch = {}) {
    if (!state) {
      state = createCaptureReadinessState({ captureMode });
    }
    state = applyCaptureReadinessPatch(state, patch).state;
    publish();
  }

  return {
    reset,
    update,
    refresh
  };
}
