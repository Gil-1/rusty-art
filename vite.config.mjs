import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import { createRuntimeDataCopyPlan, executeRuntimeDataCopyPlan } from './pipeline/core/web-runtime/runtime-data-copy-plan.mjs';
import {
  DEFAULT_SHARE_DESCRIPTION,
  DEFAULT_SHARE_TITLE,
  RUSTY_SITE_NAME,
  resolvePublicArtworkShareMetadata
} from './app/web/js/public-artwork-share-metadata.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(__dirname, 'app/web');
const WEB_DIST = path.join(__dirname, 'app/web-dist');
const DEFAULT_PUBLIC_SITE_URL = 'https://rusty-art.edge-solutions.be/';
const PUBLIC_SITE_URL = String(process.env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL).trim();
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

function resolveAnalyticsIds(env = process.env) {
  const publicGtmId = String(env.PUBLIC_GTM_ID || '').trim();
  return {
    gaMeasurementId: cleanAnalyticsId(env.PUBLIC_GA_MEASUREMENT_ID, GA4_PATTERN)
      || cleanAnalyticsId(publicGtmId, GA4_PATTERN),
    gtmId: cleanAnalyticsId(publicGtmId, GTM_PATTERN)
  };
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
      const { gaMeasurementId, gtmId } = resolveAnalyticsIds();
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
      await generateArtworkSharePages({ webRoot: WEB_ROOT, distDir: WEB_DIST, siteUrl: PUBLIC_SITE_URL });
    }
  };
}

function htmlAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function htmlText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderMetaTag(attributeName, attributeValue, content) {
  const text = String(content ?? '').trim();
  if (!text) return '';
  return `    <meta ${attributeName}="${htmlAttribute(attributeValue)}" content="${htmlAttribute(text)}" data-rusty-share-meta="true" />`;
}

function renderShareMetaBlock(metadata = {}) {
  const tags = [
    `    <link rel="canonical" href="${htmlAttribute(metadata.canonicalUrl)}" data-rusty-share-meta="true" />`,
    renderMetaTag('name', 'description', metadata.description),
    renderMetaTag('property', 'og:title', metadata.title),
    renderMetaTag('property', 'og:description', metadata.description),
    renderMetaTag('property', 'og:type', metadata.type),
    renderMetaTag('property', 'og:url', metadata.canonicalUrl),
    renderMetaTag('property', 'og:site_name', metadata.siteName || RUSTY_SITE_NAME),
    renderMetaTag('property', 'og:locale', metadata.locale),
    renderMetaTag('property', 'og:image', metadata.imageUrl),
    renderMetaTag('property', 'og:image:secure_url', metadata.imageUrl),
    renderMetaTag('property', 'og:image:type', metadata.imageUrl ? 'image/jpeg' : ''),
    renderMetaTag('property', 'og:image:width', metadata.imageWidth),
    renderMetaTag('property', 'og:image:height', metadata.imageHeight),
    renderMetaTag('property', 'og:image:alt', metadata.imageAlt),
    renderMetaTag('property', 'article:published_time', metadata.date),
    renderMetaTag('name', 'twitter:card', metadata.imageUrl ? 'summary_large_image' : 'summary'),
    renderMetaTag('name', 'twitter:title', metadata.title),
    renderMetaTag('name', 'twitter:description', metadata.description),
    renderMetaTag('name', 'twitter:image', metadata.imageUrl),
    renderMetaTag('name', 'twitter:image:alt', metadata.imageAlt)
  ].filter(Boolean);

  return [
    '    <!-- rusty-share-meta:start -->',
    ...tags,
    '    <!-- rusty-share-meta:end -->'
  ].join('\n');
}

function removeManagedShareBlocks(html) {
  return String(html)
    .replace(/\s*<!-- rusty-share-base:start -->[\s\S]*?<!-- rusty-share-base:end -->/g, '')
    .replace(/\s*<!-- rusty-share-meta:start -->[\s\S]*?<!-- rusty-share-meta:end -->/g, '')
    .replace(/\s*<meta\b[^>]*\bdata-rusty-share-meta="true"[^>]*>/g, '')
    .replace(/\s*<link\b[^>]*\bdata-rusty-share-meta="true"[^>]*>/g, '');
}

function injectShareHtml(html, metadata, { baseHref = '' } = {}) {
  const clean = removeManagedShareBlocks(html)
    .replace(/<html\b([^>]*)>/i, '<html$1 prefix="og: https://ogp.me/ns# article: https://ogp.me/ns/article#">')
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlText(metadata.title || DEFAULT_SHARE_TITLE)}</title>`);
  const baseBlock = baseHref
    ? `    <!-- rusty-share-base:start -->\n    <base href="${htmlAttribute(baseHref)}" />\n    <!-- rusty-share-base:end -->`
    : '';
  const block = [baseBlock, renderShareMetaBlock(metadata)].filter(Boolean).join('\n');

  if (/<title>[\s\S]*?<\/title>/i.test(clean)) {
    return clean.replace(/(<title>[\s\S]*?<\/title>)/i, `$1\n${block}`);
  }
  return clean.replace('</head>', `${block}\n  </head>`);
}

function createBuildLocation(siteUrl = '') {
  const url = new URL(siteUrl || 'http://localhost/');
  return {
    href: url.href,
    origin: url.origin,
    pathname: url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`,
    search: '',
    hash: ''
  };
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function readArtworkForManifestItem(webRoot, item = {}) {
  const file = String(item.file || '').replace(/^\.\//, '');
  if (!file || file.includes('..')) return {};
  try {
    return await readJson(path.join(webRoot, file));
  } catch {
    return {};
  }
}

function withRootCanonical(metadata, locationRef) {
  const rootUrl = new URL(locationRef.pathname || '/', locationRef.origin || locationRef.href);
  return {
    ...metadata,
    canonicalUrl: rootUrl.href,
    type: 'website'
  };
}

async function generateArtworkSharePages({ webRoot, distDir, siteUrl = '' }) {
  const indexPath = path.join(distDir, 'index.html');
  const sourceHtml = await fs.readFile(indexPath, 'utf8');
  const manifest = await readJson(path.join(webRoot, 'data/manifest.json'));
  const items = Array.isArray(manifest.items) ? manifest.items : [];
  const locationRef = createBuildLocation(siteUrl);
  const latestItem = items.find((item) => item.id === manifest.latestId) || items[0] || null;

  if (!latestItem) {
    const fallbackMetadata = {
      title: DEFAULT_SHARE_TITLE,
      description: DEFAULT_SHARE_DESCRIPTION,
      canonicalUrl: new URL(locationRef.pathname || '/', locationRef.href).href,
      siteName: RUSTY_SITE_NAME,
      type: 'website',
      locale: 'en_US'
    };
    await fs.writeFile(indexPath, injectShareHtml(sourceHtml, fallbackMetadata), 'utf8');
    return;
  }

  const latestArt = await readArtworkForManifestItem(webRoot, latestItem);
  const rootMetadata = withRootCanonical(resolvePublicArtworkShareMetadata({
    art: latestArt,
    item: latestItem,
    locationRef,
    siteUrl
  }), locationRef);
  await fs.writeFile(indexPath, injectShareHtml(sourceHtml, rootMetadata), 'utf8');

  await Promise.all(items.map(async (item) => {
    const art = await readArtworkForManifestItem(webRoot, item);
    const metadata = resolvePublicArtworkShareMetadata({
      art,
      item,
      locationRef,
      siteUrl
    });
    if (!metadata.slug) return;
    const shareDir = path.join(distDir, 'art', metadata.slug);
    await fs.mkdir(shareDir, { recursive: true });
    await fs.writeFile(
      path.join(shareDir, 'index.html'),
      injectShareHtml(sourceHtml, metadata, { baseHref: '../../' }),
      'utf8'
    );
  }));
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
  plugins: [tailwindcss(), analyticsHtmlPlugin(), copyRuntimeDataPlugin()]
});
