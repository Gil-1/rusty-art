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
const EDGE_SOLUTIONS_URL = 'https://edge-solutions.be/';
const EDGE_SOLUTIONS_LLMS_URL = 'https://edge-solutions.be/llms.txt';
const PUBLIC_SITE_URL = String(process.env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL).trim();
const GOOGLE_TAG_PATTERN = /^G-[A-Z0-9]+$/;
const LLMS_RECENT_ARTWORK_LIMIT = 20;

function cleanAnalyticsId(value, pattern) {
  const id = String(value || '').trim();
  return pattern.test(id) ? id : '';
}

function resolveAnalyticsIds(env = process.env) {
  const publicGtmId = String(env.PUBLIC_GTM_ID || '').trim();
  return {
    googleTagId: cleanAnalyticsId(publicGtmId, GOOGLE_TAG_PATTERN)
  };
}

function buildGoogleTagInitScript(googleTagId) {
  const googleTagIdLiteral = JSON.stringify(googleTagId);
  return `
    window.dataLayer = window.dataLayer || [];
    window.__rustyAnalytics = window.__rustyAnalytics || {};
    window.__rustyAnalytics.googleTagId = ${googleTagIdLiteral};
    window.__rustyAnalytics.pageContext = {
      page_location: window.location.href,
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
      page_referrer: document.referrer || undefined,
      page_hostname: window.location.hostname
    };
    function gtag(){dataLayer.push(arguments);}
    window.gtag = window.gtag || gtag;
    window.gtag('js', new Date());
    window.gtag('config', ${googleTagIdLiteral}, window.__rustyAnalytics.pageContext);
  `;
}

function analyticsHtmlPlugin() {
  return {
    name: 'rusty-analytics-html',
    transformIndexHtml() {
      const { googleTagId } = resolveAnalyticsIds();
      const tags = [];

      if (googleTagId) {
        tags.push({
          tag: 'script',
          attrs: {
            id: 'rusty-google-tag-script',
            async: true,
            src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleTagId)}`
          },
          injectTo: 'head'
        });
        tags.push({
          tag: 'script',
          attrs: { id: 'rusty-google-tag-init' },
          children: buildGoogleTagInitScript(googleTagId),
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
      await generatePublicDiscoveryFiles({ webRoot: WEB_ROOT, distDir: WEB_DIST, siteUrl: PUBLIC_SITE_URL });
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
  let clean = removeManagedShareBlocks(html)
    .replace(/<html\b([^>]*)>/i, '<html$1 prefix="og: https://ogp.me/ns# article: https://ogp.me/ns/article#">')
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlText(metadata.title || DEFAULT_SHARE_TITLE)}</title>`);

  if (metadata.artworkRoute && metadata.plainTitle) {
    clean = clean.replace(
      /(<h1\b[^>]*\bid="hero-now-title"[^>]*>)[\s\S]*?(<\/h1>)/i,
      `$1${htmlText(metadata.plainTitle)}$2`
    );
  }

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

function buildRootHref(locationRef) {
  return new URL(locationRef.pathname || '/', locationRef.origin || locationRef.href).href;
}

function buildSiteHref(pathname, locationRef) {
  const baseUrl = new URL(locationRef.pathname || '/', locationRef.origin || locationRef.href);
  return new URL(String(pathname || '').replace(/^\/+/, ''), baseUrl).href;
}

function buildPublicFileHref(file, locationRef) {
  return buildSiteHref(String(file || '').replace(/^\.\//, ''), locationRef);
}

function xmlText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function markdownInline(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .trim();
}

function truncateMarkdownInline(value, maxLength) {
  const text = markdownInline(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function sitemapLastmod(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function renderSitemapXml(entries) {
  const seen = new Set();
  const urls = [];

  for (const entry of entries) {
    const loc = String(entry?.loc || '').trim();
    if (!loc || seen.has(loc)) continue;
    seen.add(loc);
    urls.push({
      loc,
      lastmod: sitemapLastmod(entry.lastmod)
    });
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.flatMap((entry) => [
      '  <url>',
      `    <loc>${xmlText(entry.loc)}</loc>`,
      entry.lastmod ? `    <lastmod>${xmlText(entry.lastmod)}</lastmod>` : '',
      '  </url>'
    ].filter(Boolean)),
    '</urlset>',
    ''
  ].join('\n');
}

function renderRobotsTxt({ sitemapUrl }) {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemapUrl}`,
    ''
  ].join('\n');
}

function renderLlmsTxt({
  rootUrl,
  sitemapUrl,
  manifestUrl,
  latestUrl,
  latestArtworkUrl,
  latestArtworkDataUrl,
  recentArtworks = []
}) {
  const lines = [
    `# ${RUSTY_SITE_NAME}`,
    '',
    `> ${DEFAULT_SHARE_DESCRIPTION}`,
    '',
    'Rusty Art is a public Edge Solutions project and static artwork archive. Each published piece turns one Belgian headline into an abstract visual scene with public metadata, share imagery, and a canonical artwork URL.',
    '',
    'Edge Solutions is Gil Guminski\'s Belgium and Wallonia-facing freelance website for practical AI automation and real-time 3D / XR applications. Rusty Art is a visible public project from Edge Solutions.',
    '',
    'Use visible public page content, public archive data, and linked public sources only. Do not infer fake clients, testimonials, awards, metrics, logos, pricing, or private implementation details from this website.',
    '',
    'The public JSON files are archive data. Private Edge Solutions generation automation, prompts, credentials, and diagnostics are not part of this website.',
    '',
    '## Project Context',
    `- [Edge Solutions](${EDGE_SOLUTIONS_URL}): Parent website for the freelance AI automation and real-time 3D / XR practice behind Rusty Art.`,
    `- [Edge Solutions llms.txt](${EDGE_SOLUTIONS_LLMS_URL}): Canonical AI-facing summary, localized pages, public links, and interpretation notes for the parent site.`,
    '',
    '## Primary Pages',
    `- [Rusty Art](${rootUrl}): Latest artwork, live scene, and gallery entry point.`
  ];

  if (latestArtworkUrl) {
    lines.push(`- [Latest artwork](${latestArtworkUrl}): Canonical share page for the current latest archive item.`);
  }

  lines.push(
    '',
    '## Public Archive Data',
    `- [Archive manifest](${manifestUrl}): Complete public archive index with artwork IDs, titles, dates, sources, image paths, and JSON file paths.`,
    `- [Latest pointer](${latestUrl}): Public pointer to the latest artwork JSON file.`
  );
  if (latestArtworkDataUrl) {
    lines.push(`- [Latest artwork JSON](${latestArtworkDataUrl}): Full public metadata and scene configuration for the current latest artwork.`);
  }
  lines.push(`- [Sitemap](${sitemapUrl}): Exhaustive canonical URL list for indexable public pages, including all artwork pages.`);

  if (recentArtworks.length) {
    lines.push('', '## Recent Artworks');
    for (const entry of recentArtworks.slice(0, LLMS_RECENT_ARTWORK_LIMIT)) {
      const title = truncateMarkdownInline(entry.metadata.newsTitle || entry.metadata.artworkTitle, 140);
      const facts = [
        entry.metadata.artist ? `artist influence: ${markdownInline(entry.metadata.artist)}` : '',
        entry.item?.date ? `date: ${markdownInline(entry.item.date)}` : '',
        entry.metadata.source ? `source: ${markdownInline(entry.metadata.source)}` : ''
      ].filter(Boolean).join('; ');
      lines.push(`- [${title}](${entry.metadata.canonicalUrl}): ${facts || 'Public artwork archive page.'}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

async function collectArtworkDiscoveryEntries({ webRoot, items, locationRef, siteUrl = '' }) {
  const entries = await Promise.all(items.map(async (item) => {
    const art = await readArtworkForManifestItem(webRoot, item);
    const metadata = resolvePublicArtworkShareMetadata({
      art,
      item,
      locationRef,
      siteUrl,
      forceArtworkRoute: true
    });
    if (!metadata.slug || !metadata.canonicalUrl) return null;

    return {
      art,
      item,
      metadata,
      lastmod: sitemapLastmod(art.generatedAt || item.generatedAt || item.date)
    };
  }));

  return entries.filter(Boolean);
}

async function generatePublicDiscoveryFiles({ webRoot, distDir, siteUrl = '' }) {
  const manifest = await readJson(path.join(webRoot, 'data/manifest.json'));
  const items = Array.isArray(manifest.items) ? manifest.items : [];
  const locationRef = createBuildLocation(siteUrl);
  const rootUrl = buildRootHref(locationRef);
  const sitemapUrl = buildSiteHref('sitemap.xml', locationRef);
  const manifestUrl = buildSiteHref('data/manifest.json', locationRef);
  const latestUrl = buildSiteHref('data/latest.json', locationRef);
  const artworkEntries = await collectArtworkDiscoveryEntries({ webRoot, items, locationRef, siteUrl });
  const latestArtwork = artworkEntries.find((entry) => entry.item?.id === manifest.latestId) || artworkEntries[0] || null;

  await Promise.all([
    fs.writeFile(
      path.join(distDir, 'sitemap.xml'),
      renderSitemapXml([
        {
          loc: rootUrl,
          lastmod: manifest.generatedAt || latestArtwork?.lastmod
        },
        ...artworkEntries.map((entry) => ({
          loc: entry.metadata.canonicalUrl,
          lastmod: entry.lastmod
        }))
      ]),
      'utf8'
    ),
    fs.writeFile(
      path.join(distDir, 'robots.txt'),
      renderRobotsTxt({ sitemapUrl }),
      'utf8'
    ),
    fs.writeFile(
      path.join(distDir, 'llms.txt'),
      renderLlmsTxt({
        rootUrl,
        sitemapUrl,
        manifestUrl,
        latestUrl,
        latestArtworkUrl: latestArtwork?.metadata?.canonicalUrl || '',
        latestArtworkDataUrl: latestArtwork?.item?.file ? buildPublicFileHref(latestArtwork.item.file, locationRef) : '',
        recentArtworks: artworkEntries
      }),
      'utf8'
    )
  ]);
}

function withRootCanonical(metadata, locationRef) {
  return {
    ...metadata,
    canonicalUrl: buildRootHref(locationRef),
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
      siteUrl,
      forceArtworkRoute: true
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
