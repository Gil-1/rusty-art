const GA4_PATTERN = /^G-[A-Z0-9]{4,}$/;
const GTM_PATTERN = /^GTM-[A-Z0-9]+$/;
const CROSS_DOMAIN_LINKER_DOMAINS = Object.freeze([
  'edge-solutions.be',
  'rusty-art.edge-solutions.be'
]);
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
    gaMeasurementId: cleanAnalyticsId(source.PUBLIC_GA_MEASUREMENT_ID, GA4_PATTERN)
      || cleanAnalyticsId(publicGtmId, GA4_PATTERN),
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

function readPageContext({ windowRef = window, documentRef = document, gaMeasurementId = '' } = {}) {
  const locationRef = windowRef.location;
  return compactAnalyticsParams({
    ga_measurement_id: gaMeasurementId,
    page_location: locationRef.href,
    page_path: `${locationRef.pathname}${locationRef.search}`,
    page_title: documentRef.title?.trim(),
    page_referrer: documentRef.referrer?.trim(),
    page_hostname: locationRef.hostname
  });
}

function mergeAnalyticsContext({ windowRef = window, documentRef = document, gaMeasurementId = '', context = {} } = {}) {
  const pageContext = {
    ...readPageContext({ windowRef, documentRef, gaMeasurementId }),
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

function installGoogleTagManager(gtmId, { windowRef = window, documentRef = document, gaMeasurementId = '' } = {}) {
  if (!gtmId) return;
  if (windowRef.__rustyAnalytics?.gtmId === gtmId) return;
  windowRef.__rustyAnalytics = windowRef.__rustyAnalytics || {};
  windowRef.__rustyAnalytics.gtmId = gtmId;
  if (gaMeasurementId) windowRef.__rustyAnalytics.gaMeasurementId = gaMeasurementId;
  ensureDataLayer(windowRef).push(mergeAnalyticsContext({ windowRef, documentRef, gaMeasurementId }));
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

function installGoogleAnalytics(gaMeasurementId, { windowRef = window, documentRef = document } = {}) {
  if (!gaMeasurementId) return;
  if (windowRef.__rustyAnalytics?.gaMeasurementId === gaMeasurementId) return;
  windowRef.__rustyAnalytics = windowRef.__rustyAnalytics || {};
  windowRef.__rustyAnalytics.gaMeasurementId = gaMeasurementId;
  ensureDataLayer(windowRef);
  windowRef.gtag = windowRef.gtag || function gtag() {
    windowRef.dataLayer.push(arguments);
  };
  appendScript({
    documentRef,
    id: 'rusty-ga4-script',
    src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`
  });
  windowRef.gtag('js', new Date());
  windowRef.gtag('set', mergeAnalyticsContext({ windowRef, documentRef, gaMeasurementId }));
  windowRef.gtag('config', gaMeasurementId, {
    send_page_view: false,
    cookie_domain: 'auto',
    linker: { domains: CROSS_DOMAIN_LINKER_DOMAINS }
  });
  windowRef.gtag('config', gaMeasurementId, {
    ...mergeAnalyticsContext({ windowRef, documentRef, gaMeasurementId }),
    cookie_domain: 'auto',
    linker: { domains: CROSS_DOMAIN_LINKER_DOMAINS }
  });
}

export function startAnalytics(options = {}) {
  const config = readAnalyticsConfig(options.env);
  if (config.gtmId) {
    installGoogleTagManager(config.gtmId, { ...options, gaMeasurementId: config.gaMeasurementId });
    return;
  }
  installGoogleAnalytics(config.gaMeasurementId, options);
}

export function trackAnalyticsPageView({
  windowRef = window,
  documentRef = document,
  context = {}
} = {}) {
  const gaMeasurementId = windowRef.__rustyAnalytics?.gaMeasurementId || '';
  const pageContext = mergeAnalyticsContext({ windowRef, documentRef, gaMeasurementId, context });

  if (typeof windowRef.gtag === 'function' && gaMeasurementId) {
    windowRef.gtag('event', 'page_view', {
      ...pageContext,
      send_to: gaMeasurementId
    });
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
