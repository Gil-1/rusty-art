import {
  buildArtworkQueryRouteHref,
  readArtworkRouteFromLocation,
  resolveArtworkRouteSlug
} from './contracts/public-artwork-routes.js';

const HISTORY_STATE_KEY = 'rustyArtworkRoute';

function canUseHistory(windowRef) {
  return Boolean(
    windowRef?.history
    && typeof windowRef.history.pushState === 'function'
    && typeof windowRef.history.replaceState === 'function'
    && windowRef.location
  );
}

function absoluteHref(href, locationRef) {
  try {
    return new URL(href, locationRef.href).href;
  } catch {
    return href;
  }
}

function createHistoryState(windowRef, item, activeIndex) {
  const currentState = windowRef.history.state && typeof windowRef.history.state === 'object'
    ? windowRef.history.state
    : {};
  return {
    ...currentState,
    [HISTORY_STATE_KEY]: {
      slug: resolveArtworkRouteSlug(item),
      file: item?.file || null,
      activeIndex
    }
  };
}

export function createArtworkRouteHistoryController({
  windowRef = globalThis.window,
  captureMode = false
} = {}) {
  function syncLoadedArtworkRoute({ item, activeIndex = -1, action = 'push' } = {}) {
    if (captureMode || !item || !canUseHistory(windowRef)) {
      return { status: 'skipped' };
    }

    const href = buildArtworkQueryRouteHref(item, { locationRef: windowRef.location });
    if (!href) return { status: 'missing-route' };

    const state = createHistoryState(windowRef, item, activeIndex);
    const currentHref = windowRef.location.href;
    const nextHref = absoluteHref(href, windowRef.location);
    const method = action === 'replace' || currentHref === nextHref ? 'replaceState' : 'pushState';

    windowRef.history[method](state, '', href);
    return {
      status: method === 'replaceState' ? 'replaced' : 'pushed',
      href
    };
  }

  function readCurrentRoute() {
    return readArtworkRouteFromLocation(windowRef?.location);
  }

  return {
    readCurrentRoute,
    syncLoadedArtworkRoute
  };
}
