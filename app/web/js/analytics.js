const GTM_PATTERN = /^GTM-[A-Z0-9]+$/;
const EMPTY_ANALYTICS_ENV = Object.freeze({});

function readDefaultAnalyticsEnv() {
  return import.meta.env || EMPTY_ANALYTICS_ENV;
}

function cleanAnalyticsId(value, pattern) {
  const id = String(value || '').trim();
  return pattern.test(id) ? id : '';
}

function resolveAnalyticsIds(env = readDefaultAnalyticsEnv()) {
  const source = env || EMPTY_ANALYTICS_ENV;
  const publicGtmId = String(source.PUBLIC_GTM_ID || '').trim();
  return {
    gtmId: cleanAnalyticsId(publicGtmId, GTM_PATTERN)
  };
}

function compactAnalyticsParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  );
}

function readAnalyticsConfig(env = readDefaultAnalyticsEnv()) {
  return resolveAnalyticsIds(env);
}

function readPageContext({ windowRef = window, documentRef = document } = {}) {
  const locationRef = windowRef.location;
  return compactAnalyticsParams({
    page_location: locationRef.href,
    page_path: `${locationRef.pathname}${locationRef.search}`,
    page_title: documentRef.title?.trim(),
    page_referrer: documentRef.referrer?.trim(),
    page_hostname: locationRef.hostname
  });
}

function mergeAnalyticsContext({ windowRef = window, documentRef = document, context = {} } = {}) {
  const pageContext = {
    ...readPageContext({ windowRef, documentRef }),
    ...compactAnalyticsParams(context)
  };
  windowRef.__rustyAnalytics = windowRef.__rustyAnalytics || {};
  windowRef.__rustyAnalytics.pageContext = pageContext;
  return pageContext;
}

function ensureDataLayer(windowRef = window) {
  windowRef.dataLayer = windowRef.dataLayer || [];
  return windowRef.dataLayer;
}

function appendScript({ documentRef = document, id, src }) {
  if (documentRef.getElementById(id)) return;
  const script = documentRef.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  documentRef.head.appendChild(script);
}

function installGoogleTagManager(gtmId, { windowRef = window, documentRef = document } = {}) {
  if (!gtmId) return;
  if (windowRef.__rustyAnalytics?.gtmId === gtmId) return;
  windowRef.__rustyAnalytics = windowRef.__rustyAnalytics || {};
  windowRef.__rustyAnalytics.gtmId = gtmId;
  ensureDataLayer(windowRef).push(mergeAnalyticsContext({ windowRef, documentRef }));
  ensureDataLayer(windowRef).push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js'
  });
  appendScript({
    documentRef,
    id: 'rusty-gtm-script',
    src: `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
  });
}

export function startAnalytics(options = {}) {
  const config = readAnalyticsConfig(options.env);
  if (config.gtmId) {
    installGoogleTagManager(config.gtmId, options);
  }
}

export function trackAnalyticsPageView({
  windowRef = window,
  documentRef = document,
  context = {}
} = {}) {
  const pageContext = mergeAnalyticsContext({ windowRef, documentRef, context });

  if (Array.isArray(windowRef.dataLayer)) {
    windowRef.dataLayer.push({
      ...pageContext,
      event: 'page_view'
    });
    return { status: 'dataLayer', pageContext };
  }

  return { status: 'skipped', pageContext };
}
