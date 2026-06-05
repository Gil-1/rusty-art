const GOOGLE_TAG_PATTERN = /^G-[A-Z0-9]+$/;
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
    googleTagId: cleanAnalyticsId(publicGtmId, GOOGLE_TAG_PATTERN)
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

function ensureGoogleTagFunction(windowRef = window) {
  if (typeof windowRef.gtag === 'function') return windowRef.gtag;
  windowRef.gtag = function gtag() {
    ensureDataLayer(windowRef).push(arguments);
  };
  return windowRef.gtag;
}

function appendScript({ documentRef = document, id, src }) {
  if (documentRef.getElementById?.(id)) return;
  const script = documentRef.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  documentRef.head?.appendChild?.(script);
}

function installGoogleTag(googleTagId, { windowRef = window, documentRef = document } = {}) {
  if (!googleTagId) return;
  if (windowRef.__rustyAnalytics?.googleTagId === googleTagId && typeof windowRef.gtag === 'function') return;
  windowRef.__rustyAnalytics = windowRef.__rustyAnalytics || {};
  windowRef.__rustyAnalytics.googleTagId = googleTagId;
  const gtag = ensureGoogleTagFunction(windowRef);
  appendScript({
    documentRef,
    id: 'rusty-google-tag-script',
    src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleTagId)}`
  });
  gtag('js', new Date());
  gtag('config', googleTagId, mergeAnalyticsContext({ windowRef, documentRef }));
}

export function startAnalytics(options = {}) {
  const config = readAnalyticsConfig(options.env);
  if (config.googleTagId) {
    installGoogleTag(config.googleTagId, options);
  }
}

export function trackAnalyticsPageView({
  windowRef = window,
  documentRef = document,
  context = {}
} = {}) {
  const pageContext = mergeAnalyticsContext({ windowRef, documentRef, context });
  const googleTagId = windowRef.__rustyAnalytics?.googleTagId;

  if (googleTagId && typeof windowRef.gtag === 'function') {
    windowRef.gtag('config', googleTagId, pageContext);
    return { status: 'gtag', pageContext };
  }

  if (Array.isArray(windowRef.dataLayer)) {
    windowRef.dataLayer.push({
      ...pageContext,
      event: 'page_view'
    });
    return { status: 'dataLayer', pageContext };
  }

  return { status: 'skipped', pageContext };
}
