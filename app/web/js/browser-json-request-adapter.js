export const DEFAULT_BROWSER_JSON_REQUEST_TIMEOUT_MS = 9000;

const TIMEOUT_ABORT_REASON = 'browser-json-request-timeout';

function resolveGlobalFunction(name) {
  const fn = globalThis?.[name];
  return typeof fn === 'function' ? fn.bind(globalThis) : null;
}

function formatErrorMessage(error) {
  if (!error) return 'unknown error';
  if (typeof error === 'string') return error;
  return error.message || String(error);
}

function isAbortLike(error) {
  return error?.name === 'AbortError' || error?.code === 20;
}

function abortController(controller, reason) {
  try {
    controller.abort(reason);
  } catch {
    controller.abort();
  }
}

function normalizeTimeoutMs(timeoutMs) {
  const normalized = Number(timeoutMs);
  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error('Browser JSON request adapter requires a non-negative timeoutMs value.');
  }
  return normalized;
}

export function resolveBrowserRequestPath(path, { baseHref = null, documentRef = globalThis?.document } = {}) {
  const text = String(path ?? '');
  const base = String(baseHref || documentRef?.baseURI || '').trim();
  if (!base) return text;

  try {
    return new URL(text, base).href;
  } catch {
    return text;
  }
}

export function createBrowserJsonRequestAdapter({
  fetchImpl = resolveGlobalFunction('fetch'),
  AbortControllerImpl = globalThis?.AbortController,
  setTimeoutFn = resolveGlobalFunction('setTimeout'),
  clearTimeoutFn = resolveGlobalFunction('clearTimeout'),
  documentRef = globalThis?.document,
  baseHref = null,
  timeoutMs = DEFAULT_BROWSER_JSON_REQUEST_TIMEOUT_MS
} = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('Browser JSON request adapter requires fetch.');
  if (typeof AbortControllerImpl !== 'function') throw new Error('Browser JSON request adapter requires AbortController.');
  if (typeof setTimeoutFn !== 'function') throw new Error('Browser JSON request adapter requires setTimeout.');
  if (typeof clearTimeoutFn !== 'function') throw new Error('Browser JSON request adapter requires clearTimeout.');

  const defaultTimeoutMs = normalizeTimeoutMs(timeoutMs);

  async function fetchJson(path, {
    timeoutMs: requestTimeoutMs = defaultTimeoutMs,
    signal = null,
    baseHref: requestBaseHref = null
  } = {}) {
    const timeoutLimitMs = normalizeTimeoutMs(requestTimeoutMs);
    const requestPath = resolveBrowserRequestPath(path, {
      baseHref: requestBaseHref || baseHref,
      documentRef
    });
    const controller = new AbortControllerImpl();
    let timeoutFired = false;
    let externalAbortFired = false;
    let externalAbortHandler = null;

    const timer = setTimeoutFn(() => {
      timeoutFired = true;
      abortController(controller, new Error(TIMEOUT_ABORT_REASON));
    }, timeoutLimitMs);

    if (signal && typeof signal.addEventListener === 'function') {
      externalAbortHandler = () => {
        externalAbortFired = true;
        abortController(controller, signal.reason || new Error('aborted'));
      };
      if (signal.aborted) {
        externalAbortHandler();
      } else {
        signal.addEventListener('abort', externalAbortHandler, { once: true });
      }
    }

    try {
      const response = await fetchImpl(requestPath, { signal: controller.signal });
      if (!response?.ok) throw new Error(`HTTP ${response?.status ?? 'unknown'}`);

      try {
        return await response.json();
      } catch (error) {
        throw new Error(`Malformed JSON (${formatErrorMessage(error)})`);
      }
    } catch (error) {
      const abortReasonMessage = formatErrorMessage(controller.signal?.reason);
      if (timeoutFired || abortReasonMessage === TIMEOUT_ABORT_REASON) {
        throw new Error(`Request timed out for ${path}`);
      }
      if (externalAbortFired || isAbortLike(error) || controller.signal?.aborted) {
        throw new Error(`Request aborted for ${path}`);
      }
      throw new Error(`Cannot load ${path}: ${formatErrorMessage(error)}`);
    } finally {
      clearTimeoutFn(timer);
      if (signal && externalAbortHandler && typeof signal.removeEventListener === 'function') {
        signal.removeEventListener('abort', externalAbortHandler);
      }
    }
  }

  return {
    timeoutMs: defaultTimeoutMs,
    fetchJson,
    requestJson: fetchJson
  };
}
