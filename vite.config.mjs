import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

import { createRuntimeDataCopyPlan, executeRuntimeDataCopyPlan } from './pipeline/core/web-runtime/runtime-data-copy-plan.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(__dirname, 'app/web');
const WEB_DIST = path.join(__dirname, 'app/web-dist');
const GA4_PATTERN = /^G-[A-Z0-9]{4,}$/;
const GTM_PATTERN = /^GTM-[A-Z0-9]+$/;
const CROSS_DOMAIN_LINKER_DOMAINS = Object.freeze([
  'edge-solutions.be',
  'rusty-art.edge-solutions.be'
]);

function cleanAnalyticsId(value, pattern) {
  const id = String(value || '').trim();
  return pattern.test(id) ? id : '';
}

function buildAnalyticsPageContextScript({ gaMeasurementId = '' } = {}) {
  return `
    window.dataLayer = window.dataLayer || [];
    window.__rustyAnalytics = window.__rustyAnalytics || {};
    window.__rustyAnalytics.pageContext = {
      ga_measurement_id: ${JSON.stringify(gaMeasurementId)},
      page_location: window.location.href,
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
      page_referrer: document.referrer || undefined,
      page_hostname: window.location.hostname
    };
  `;
}

function analyticsHtmlPlugin() {
  return {
    name: 'rusty-analytics-html',
    transformIndexHtml() {
      const gaMeasurementId = cleanAnalyticsId(process.env.PUBLIC_GA_MEASUREMENT_ID, GA4_PATTERN);
      const gtmId = cleanAnalyticsId(process.env.PUBLIC_GTM_ID, GTM_PATTERN);
      const tags = [];

      if (gtmId) {
        tags.push({
          tag: 'script',
          attrs: { id: 'rusty-analytics-context' },
          children: buildAnalyticsPageContextScript({ gaMeasurementId }),
          injectTo: 'head'
        });
        tags.push({
          tag: 'script',
          attrs: { id: 'rusty-gtm-init' },
          children: `
            window.__rustyAnalytics.gtmId = '${gtmId}';
            window.dataLayer.push(window.__rustyAnalytics.pageContext);
            window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
            (function(w,d,s,l,i){
              var f=d.getElementsByTagName(s)[0], j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
              j.id='rusty-gtm-script';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
          injectTo: 'head'
        });
        tags.push({
          tag: 'noscript',
          children: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          injectTo: 'body-prepend'
        });
      }

      if (gaMeasurementId && !gtmId) {
        if (!gtmId) {
          tags.push({
            tag: 'script',
            attrs: { id: 'rusty-analytics-context' },
            children: buildAnalyticsPageContextScript({ gaMeasurementId }),
            injectTo: 'head'
          });
        }
        tags.push({
          tag: 'script',
          attrs: {
            id: 'rusty-ga4-script',
            async: true,
            src: `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`
          },
          injectTo: 'head'
        });
        tags.push({
          tag: 'script',
          attrs: { id: 'rusty-ga4-init' },
          children: `
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = window.gtag || gtag;
            window.__rustyAnalytics.gaMeasurementId = '${gaMeasurementId}';
            gtag('js', new Date());
            gtag('set', window.__rustyAnalytics.pageContext);
            gtag('config', '${gaMeasurementId}', Object.assign({}, window.__rustyAnalytics.pageContext, {
              cookie_domain: 'auto',
              linker: { domains: ${JSON.stringify(CROSS_DOMAIN_LINKER_DOMAINS)} }
            }));
          `,
          injectTo: 'head'
        });
      }

      return tags;
    }
  };
}

function copyRuntimeDataPlugin() {
  return {
    name: 'copy-runtime-data',
    async closeBundle() {
      const plan = createRuntimeDataCopyPlan({ webRoot: WEB_ROOT, distDir: WEB_DIST });
      await executeRuntimeDataCopyPlan(plan);
    }
  };
}

export default defineConfig({
  root: WEB_ROOT,
  base: './',
  envPrefix: ['VITE_', 'PUBLIC_'],
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  preview: {
    host: '127.0.0.1',
    port: 4173
  },
  build: {
    outDir: WEB_DIST,
    emptyOutDir: true
  },
  plugins: [analyticsHtmlPlugin(), copyRuntimeDataPlugin()]
});
