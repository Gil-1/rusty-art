import {
  buildArchiveCountPresentationFacts,
  buildArchiveCardPresentationFacts,
  buildFallbackPresentationFacts,
  getGalleryPresentationItems,
  buildGalleryTriggerPresentationFacts,
  buildLoadingPresentationFacts,
  buildStatusPresentationFacts,
  resolvePublicArtworkHeroFacts,
  resolvePublicArtworkPresentationFacts,
  sourceLabel as normalizeSourceLabel
} from './public-artwork-presentation-facts.js';

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sourceLabel(source) {
  return normalizeSourceLabel(source);
}

const STATUS_BASE_CLASSES = 'status-banner relative z-[3] rounded-lg border px-3 py-2 text-sm shadow-lg backdrop-blur transition [body.capture-mode_&]:hidden';
const STATUS_LEVEL_CLASSES = Object.freeze({
  info: 'border-cyan-200/40 bg-neutral-950/90 text-slate-100',
  warning: 'border-amber-200/55 bg-amber-950/70 text-amber-50',
  error: 'border-rose-200/55 bg-rose-950/75 text-rose-50'
});

const GALLERY_TRIGGER_KICKER_CLASSES = 'gallery-trigger-kicker block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap pr-10 text-[0.66rem] font-semibold text-cyan-200/90 max-[700px]:pr-9';
const GALLERY_TRIGGER_LABEL_CLASSES = 'gallery-trigger-label block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] font-semibold leading-snug text-slate-50';
const GALLERY_TRIGGER_POSITION_CLASSES = 'quick-position pointer-events-none absolute right-1.5 top-1 text-[0.58rem] font-medium leading-none text-slate-400 empty:hidden max-[700px]:right-1 max-[700px]:top-1.5 max-[700px]:text-[0.52rem]';

const META_CONTEXT_GRID_CLASSES = 'meta-context-grid grid gap-0 divide-y divide-slate-500/30 md:grid-cols-[1.1fr_0.72fr_0.9fr] md:divide-x md:divide-y-0';
const META_CONTEXT_BLOCK_CLASSES = 'meta-context-block min-w-0 py-3 first:pt-0 last:pb-0 max-[700px]:py-2 md:px-4 md:py-0 md:first:pl-0 md:last:pr-0';
const META_CONTEXT_KICKER_CLASSES = 'm-0 inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-normal text-cyan-200';
const META_CONTEXT_BODY_CLASSES = 'm-0 mt-2 text-sm leading-relaxed text-slate-300 max-[700px]:hidden';
const META_CONTEXT_ROW_CLASSES = 'm-0 mt-2 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 text-sm text-slate-200 max-[700px]:grid-cols-[4.8rem_minmax(0,1fr)] max-[700px]:text-xs';
const META_CONTEXT_LABEL_CLASSES = 'text-xs font-semibold uppercase text-slate-400';
const META_ACTION_CLASSES = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-cyan-200/50 bg-cyan-200/10 px-3 text-xs font-semibold text-cyan-50 no-underline transition hover:border-cyan-100 hover:bg-cyan-100/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 max-[700px]:min-h-9';
const META_SECONDARY_LINK_CLASSES = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-slate-500/50 bg-white/5 px-3 text-xs font-semibold text-slate-100 no-underline transition hover:border-cyan-200/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200';
const META_TAG_LIST_CLASSES = 'inline-flex min-w-0 flex-wrap gap-1.5 align-middle';
const META_TAG_CLASSES = 'inline-flex max-w-full items-center rounded-full border border-slate-500/35 bg-white/5 px-2 py-0.5 text-[0.68rem] font-medium text-slate-200';
const PALETTE_SWATCHES_CLASSES = 'palette-swatches inline-flex flex-wrap gap-2 align-middle';
const PALETTE_SWATCH_CLASSES = 'palette-swatch inline-flex items-center gap-1.5 text-slate-300';
const PALETTE_SWATCH_COLOR_CLASSES = 'palette-swatch-color size-3 shrink-0 border border-white/50 shadow-[0_0_0_1px_rgba(5,10,18,0.22)]';

const ICON_CLASSES = 'size-4 shrink-0';
const ICON_PATHS = Object.freeze({
  external: '<path d="M14 3h7v7"></path><path d="M10 14 21 3"></path><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path>',
  fingerprint: '<path d="M2 12c0-5.52 4.48-10 10-10a10 10 0 0 1 10 10"></path><path d="M6 12a6 6 0 0 1 12 0c0 5-3 7-3 10"></path><path d="M10 12a2 2 0 0 1 4 0c0 3-1 4-2 6"></path><path d="M6.5 16c.5 2 1.7 3.7 3.5 5"></path>',
  link: '<path d="M10 13a5 5 0 0 0 7.07 0l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15"></path><path d="M14 11a5 5 0 0 0-7.07 0l-2 2A5 5 0 0 0 12 20.07l1.15-1.15"></path>',
  cpu: '<rect width="16" height="16" x="4" y="4" rx="2"></rect><rect width="6" height="6" x="9" y="9" rx="1"></rect><path d="M9 1v3"></path><path d="M15 1v3"></path><path d="M9 20v3"></path><path d="M15 20v3"></path><path d="M20 9h3"></path><path d="M20 14h3"></path><path d="M1 9h3"></path><path d="M1 14h3"></path>',
  sliders: '<path d="M4 21v-7"></path><path d="M4 10V3"></path><path d="M12 21v-9"></path><path d="M12 8V3"></path><path d="M20 21v-5"></path><path d="M20 12V3"></path><path d="M2 14h4"></path><path d="M10 8h4"></path><path d="M18 16h4"></path>'
});

const ARCHIVE_CARD_CLASSES = [
  'archive-card',
  'flex h-full min-w-0 cursor-pointer flex-col rounded-lg border border-slate-500/40 bg-neutral-950/80 p-3 text-slate-100 shadow-lg transition',
  'hover:-translate-y-0.5 hover:border-cyan-200/60 hover:bg-slate-900/90',
  'aria-[current=true]:border-cyan-200 aria-[current=true]:shadow-[0_0_0_1px_rgba(125,249,255,0.24)_inset]',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200'
].join(' ');
const ARCHIVE_THUMB_CLASSES = 'archive-thumb mb-3 overflow-hidden rounded-lg border border-white/10 bg-neutral-900/70';
const ARCHIVE_THUMB_IMAGE_CLASSES = 'block aspect-video w-full object-cover';
const ARCHIVE_CARD_HEAD_CLASSES = 'archive-card-head mb-2 flex items-center justify-between gap-3';
const ARCHIVE_DATE_CLASSES = 'archive-date m-0 text-xs font-semibold text-amber-100';
const ARCHIVE_SOURCE_CLASSES = 'archive-source m-0 text-[0.68rem] font-semibold uppercase text-cyan-200';
const ARCHIVE_TITLE_CLASSES = 'archive-title m-0 text-sm font-semibold leading-snug text-white';
const ARCHIVE_NEWS_CLASSES = 'archive-news m-0 mt-auto line-clamp-2 pt-3 text-xs leading-relaxed text-slate-300';
const ARCHIVE_ARTIST_CLASSES = 'archive-artist m-0 mt-3 text-xs text-rose-200';

export function applyStatusFacts(statusBanner, facts = {}) {
  if (!statusBanner) return facts;
  statusBanner.className = `${STATUS_BASE_CLASSES} ${STATUS_LEVEL_CLASSES[facts.level] || STATUS_LEVEL_CLASSES.info}`;
  if (facts.hidden) {
    statusBanner.hidden = true;
    statusBanner.textContent = '';
    if (typeof statusBanner.removeAttribute === 'function') {
      statusBanner.removeAttribute('data-level');
    } else if (statusBanner.dataset) {
      delete statusBanner.dataset.level;
    }
    return facts;
  }

  statusBanner.hidden = false;
  statusBanner.dataset.level = facts.level || 'info';
  statusBanner.textContent = facts.message || '';
  return facts;
}

export function showStatus(statusBanner, message = '', level = 'info') {
  return applyStatusFacts(statusBanner, buildStatusPresentationFacts(message, level));
}

export function applyFallbackFacts({ fallbackPanel, fallbackMessage, retryLoad }, facts = {}) {
  if (!fallbackPanel || !fallbackMessage) return facts;
  if (facts.hidden) {
    fallbackPanel.hidden = true;
    fallbackMessage.textContent = '';
    if (retryLoad) retryLoad.hidden = true;
    return facts;
  }

  fallbackPanel.hidden = false;
  fallbackMessage.textContent = facts.message || '';
  if (retryLoad) retryLoad.hidden = Boolean(facts.retryHidden);
  return facts;
}

export function showFallback({ fallbackPanel, fallbackMessage, retryLoad }, message = '', showRetry = true) {
  return applyFallbackFacts(
    { fallbackPanel, fallbackMessage, retryLoad },
    buildFallbackPresentationFacts(message, { showRetry })
  );
}

function renderPaletteSwatches(palette = []) {
  if (!palette.length) return '';
  return `<span class="${PALETTE_SWATCHES_CLASSES}">${palette.map((entry) => (
    `<span class="${PALETTE_SWATCH_CLASSES}" title="${escapeHtml(`${entry.label}: ${entry.value}`)}">` +
      `<span class="${PALETTE_SWATCH_COLOR_CLASSES}" style="background:${escapeHtml(entry.value)}"></span>` +
      `<span>${escapeHtml(entry.label)}</span>` +
    '</span>'
  )).join('')}</span>`;
}

function renderIcon(name, className = ICON_CLASSES) {
  const paths = ICON_PATHS[name];
  if (!paths) return '';
  return `<svg class="${className}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function renderSectionKicker(label, icon) {
  return `<p class="${META_CONTEXT_KICKER_CLASSES}">${renderIcon(icon)}<span>${escapeHtml(label)}</span></p>`;
}

function renderTagList(items = []) {
  const tags = items
    .map((item) => humanizeMetaValue(item?.label || item))
    .filter(Boolean)
    .slice(0, 5);
  if (!tags.length) return '';
  return `<span class="${META_TAG_LIST_CLASSES}">${tags.map((tag) => `<span class="${META_TAG_CLASSES}">${escapeHtml(tag)}</span>`).join('')}</span>`;
}

function normalizeComparableText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function updateHeroNow({ heroNowTitle, heroNowSub, heroNowHeadline }, artOrFacts) {
  if (!heroNowTitle || !heroNowSub) return;

  const hero = resolvePublicArtworkHeroFacts(artOrFacts);

  heroNowTitle.textContent = hero.title;
  heroNowSub.textContent = hero.subtitle;
  if (heroNowHeadline) {
    const duplicateHeadline = normalizeComparableText(hero.headline) === normalizeComparableText(hero.title);
    heroNowHeadline.hidden = duplicateHeadline;
    heroNowHeadline.textContent = duplicateHeadline ? '' : hero.headline;
  }
  return hero;
}

export function updateArchiveCount(archiveCount, renderedArchiveCount, manifest) {
  const facts = buildArchiveCountPresentationFacts(renderedArchiveCount, manifest);
  if (!archiveCount || !facts.available) return facts;
  archiveCount.textContent = facts.label;
  return facts;
}

export function applyLoadingFacts({ artFirst, loadState, quickPicker, galleryTrigger, quickPrev, quickNext }, facts = {}) {
  if (artFirst) artFirst.classList.toggle('is-loading', Boolean(facts.artFirstLoading));
  if (loadState) loadState.hidden = Boolean(facts.loadStateHidden);
  const galleryControl = galleryTrigger || quickPicker;
  if (galleryControl) galleryControl.disabled = Boolean(facts.galleryTriggerDisabled ?? facts.quickPickerDisabled);
  if (quickPrev) quickPrev.disabled = Boolean(facts.quickPrevDisabled);
  if (quickNext) quickNext.disabled = Boolean(facts.quickNextDisabled);
  return facts;
}

export function applySceneProgressFacts({ sceneProgress, sceneProgressBar, sceneProgressLabel }, facts = {}) {
  if (!sceneProgress) return facts;
  const active = facts.active !== false && !facts.hidden;
  sceneProgress.hidden = !active;
  sceneProgress.setAttribute('aria-busy', String(active));
  const progress = Math.max(0, Math.min(1, Number(facts.progress) || 0));
  if (sceneProgressBar) sceneProgressBar.style.width = `${Math.round(progress * 100)}%`;
  if (sceneProgressLabel) sceneProgressLabel.textContent = facts.label || 'Preparing scene';
  return facts;
}

export function setLoadingState(elements, isLoading, manifest, activeIndex) {
  return applyLoadingFacts(elements, buildLoadingPresentationFacts({ isLoading, manifest, activeIndex }));
}

export function populateQuickPicker(quickPicker, manifest, { compact = false, activeIndex = -1 } = {}) {
  if (!quickPicker || !manifest?.items) return;
  const item = manifest.items[activeIndex] || null;
  const facts = buildGalleryTriggerPresentationFacts(item, { compact });
  const existingPosition = quickPicker.querySelector?.('#quick-position')?.textContent || '';

  const metadataLabel = facts.metadataLabel || facts.label || 'Artwork archive';
  const titleLabel = facts.titleLabel || facts.label || 'Open gallery';
  quickPicker.innerHTML = facts.options
    ? facts.options
      .map((option) => `<option value="${escapeHtml(option.value)}" title="${escapeHtml(option.fullLabel)}">${escapeHtml(option.label)}</option>`)
      .join('')
    : `<span id="quick-position" class="${GALLERY_TRIGGER_POSITION_CLASSES}" aria-live="polite">${escapeHtml(existingPosition)}</span><span class="${GALLERY_TRIGGER_KICKER_CLASSES}">${escapeHtml(metadataLabel)}</span><span class="${GALLERY_TRIGGER_LABEL_CLASSES}">${escapeHtml(titleLabel)}</span>`;
  quickPicker.title = facts.fullLabel || '';
  quickPicker.setAttribute?.('aria-label', facts.actionLabel || 'Open artwork gallery');
  return facts;
}

export function renderGalleryList(galleryList, manifest, { activeFile = null, onSelect = () => {} } = {}) {
  if (!galleryList || !manifest?.items) return null;
  galleryList.innerHTML = '';

  const cards = getGalleryPresentationItems(manifest).map((item) => {
    const facts = buildArchiveCardPresentationFacts(item);
    const active = Boolean(facts.file && facts.file === activeFile);
    const card = createArchiveCardElement(item, {
      activate: () => onSelect(facts)
    }, { active });
    galleryList.appendChild?.(card);
    return { ...facts, active, ariaCurrent: active ? 'true' : 'false' };
  });

  return { cards };
}

function renderContextRow(label, value, { html = false } = {}) {
  const available = html ? String(value || '').trim() : String(value ?? '').trim();
  if (!available) return '';
  return `
    <p class="${META_CONTEXT_ROW_CLASSES}">
      <span class="${META_CONTEXT_LABEL_CLASSES}">${escapeHtml(label)}</span>
      <span>${html ? value : escapeHtml(value)}</span>
    </p>
  `;
}

function renderContextLink(link, className = META_SECONDARY_LINK_CLASSES, icon = 'external') {
  if (!link?.href || !link?.label) return '';
  return `<a class="${className}" href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">${renderIcon(icon)}<span>${escapeHtml(link.label)}</span></a>`;
}

function humanizeMetaValue(value, fallback = '') {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  const normalized = text.toLowerCase();
  if (normalized === 'webgl-only') return 'WebGL';
  if (normalized === 'webgpu-only') return 'WebGPU';
  const words = text
    .replace(/[-_]+/g, ' ')
    .replace(/\bwebgl\b/ig, 'WebGL')
    .replace(/\bwebgpu\b/ig, 'WebGPU')
    .trim();
  return words ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : fallback;
}

function moduleCountLabel(count, fallback = '') {
  const value = Number(count);
  if (Number.isFinite(value) && value > 0) {
    return `${value} generated module${value === 1 ? '' : 's'}`;
  }
  return fallback;
}

function rendererModeLabel(mode = '') {
  const normalized = String(mode || '').trim().toLowerCase();
  if (normalized === 'webgpu') return 'WebGPURenderer';
  if (normalized === 'webgpu-webgl2-backend') return 'WebGPURenderer';
  if (normalized === 'webgl-legacy') return 'WebGLRenderer';
  return humanizeMetaValue(mode);
}

function rendererBackendLabel(backend = '') {
  const normalized = String(backend || '').trim().toLowerCase();
  if (normalized === 'webgpu') return 'WebGPU';
  if (normalized === 'webgl2') return 'WebGL2';
  if (normalized === 'webgl1') return 'WebGL1';
  return humanizeMetaValue(backend);
}

function renderRuntimeRendererLabel(rendererDiagnostics = null) {
  if (!rendererDiagnostics?.rendererMode && !rendererDiagnostics?.rendererBackend) return '';
  const backend = rendererBackendLabel(rendererDiagnostics.rendererBackend);
  if (backend) {
    return rendererDiagnostics.rendererMode === 'webgpu-webgl2-backend'
      ? `Three.js ${backend} backend`
      : `Three.js ${backend}`;
  }
  return rendererModeLabel(rendererDiagnostics.rendererMode);
}

function renderSceneSummary(facts) {
  const rationale = facts.rationale || {};
  const brief = rationale.creativeBrief || {};
  const palette = renderPaletteSwatches(brief.palette);
  const moduleLabel = moduleCountLabel(brief.moduleCount, brief.modulesLabel);
  const expression = ['tension', 'structure', 'motion', 'urgency', 'contrast']
    .map((key) => brief.expression?.[key] ? `${key} ${brief.expression[key]}` : null)
    .filter(Boolean)
    .join(' · ');
  const rows = [
    renderContextRow('Scene', humanizeMetaValue(brief.environment)),
    renderContextRow('Signal', rationale.signal),
    renderContextRow('Emotion', rationale.emotion),
    renderContextRow('Rationale', rationale.selectionRationale),
    renderContextRow('Visual map', rationale.visualMapping),
    renderContextRow('Image', brief.image),
    renderContextRow('Arc', brief.arc),
    renderContextRow('Composition', brief.composition),
    renderContextRow('Motif', brief.motif),
    palette ? renderContextRow('Palette', palette, { html: true }) : '',
    renderContextRow('Expression', expression),
    brief.keyParts?.length ? renderContextRow(brief.kind === 'immersive-world' ? 'World parts' : 'Key parts', renderTagList(brief.keyParts), { html: true }) : '',
    renderContextRow('Modules', moduleLabel),
    renderContextRow('Trace', brief.translationTraceLabel),
    renderContextRow('Quality', facts.quality?.summary),
    renderContextRow('Note', facts.quality?.rendererNote)
  ].filter(Boolean);

  return rows.length
    ? rows.join('')
    : '<p class="m-0 mt-2 text-sm text-slate-400">No additional scene brief is available.</p>';
}

function renderTechnicalRows(brief = {}, rendererDiagnostics = null) {
  const runtimeLabel = renderRuntimeRendererLabel(rendererDiagnostics);
  const rows = [
    runtimeLabel ? renderContextRow('Runtime', runtimeLabel) : '',
    renderContextRow('Contract', humanizeMetaValue(brief.rendererStatus)),
    renderContextRow('Fallback', humanizeMetaValue(rendererDiagnostics?.rendererFallbackReason || brief.rendererFallbackReason))
  ].filter(Boolean);

  return rows.length
    ? rows.join('')
    : '<p class="m-0 mt-2 text-sm text-slate-400">Renderer details unavailable.</p>';
}

export function renderMeta(meta, artOrFacts, sceneInitError, rendererDiagnostics = null) {
  const { meta: facts } = resolvePublicArtworkPresentationFacts(artOrFacts, { sceneInitError });
  if (!meta) return facts;

  const articleLink = facts.links.article.available ? renderContextLink(facts.links.article, META_ACTION_CLASSES) : '';
  const artistLinks = facts.links.artist.items.map((link) => renderContextLink(link)).join('');
  const brief = facts.rationale.creativeBrief || {};
  const sourceLabel = `${facts.news.source}${facts.links.article.available ? ' original article' : ' article'}`;
  const technicalRows = renderTechnicalRows(brief, rendererDiagnostics);

  meta.innerHTML = `
    <div class="${META_CONTEXT_GRID_CLASSES}">
      <section class="${META_CONTEXT_BLOCK_CLASSES}">
        ${renderSectionKicker('Scene details', 'sliders')}
        ${renderSceneSummary(facts)}
      </section>

      <section class="${META_CONTEXT_BLOCK_CLASSES}">
        ${renderSectionKicker('Sources', 'link')}
        ${renderContextRow('Influence', facts.artist)}
        <p class="${META_CONTEXT_BODY_CLASSES}">${escapeHtml(sourceLabel)}</p>
        <div class="mt-3 flex flex-wrap gap-2">
          ${articleLink || '<span class="text-xs text-slate-400">Article link unavailable</span>'}
          ${artistLinks}
        </div>
      </section>

      <section class="${META_CONTEXT_BLOCK_CLASSES}">
        ${renderSectionKicker('Technical details', 'cpu')}
        ${technicalRows}
      </section>
    </div>
  `;
  return facts;
}

function normalizeArchiveCardCommands(commandsOrActivate) {
  if (typeof commandsOrActivate === 'function') {
    return { activate: commandsOrActivate };
  }
  const commands = commandsOrActivate && typeof commandsOrActivate === 'object' ? commandsOrActivate : {};
  return {
    activate: typeof commands.activate === 'function' ? commands.activate : () => {}
  };
}

export function createArchiveCardElement(itemOrFacts, commandsOrActivate, options = {}) {
  const facts = buildArchiveCardPresentationFacts(itemOrFacts);
  const commands = normalizeArchiveCardCommands(commandsOrActivate);
  const active = Boolean(options.active || (options.activeFile && facts.file === options.activeFile));
  const li = document.createElement('li');
  li.dataset.file = facts.file;
  li.className = active ? `${ARCHIVE_CARD_CLASSES} active` : ARCHIVE_CARD_CLASSES;
  li.setAttribute('role', 'button');
  li.setAttribute('tabindex', '0');
  li.setAttribute('aria-current', active ? 'true' : 'false');
  li.innerHTML = `
    ${facts.thumbnail ? `
      <div class="${ARCHIVE_THUMB_CLASSES}">
        <img class="${ARCHIVE_THUMB_IMAGE_CLASSES}" src="${escapeHtml(facts.thumbnail.src)}" alt="${escapeHtml(facts.thumbnail.altText)}" loading="lazy" decoding="async">
      </div>
    ` : ''}
    <div class="${ARCHIVE_CARD_HEAD_CLASSES}">
      <p class="${ARCHIVE_DATE_CLASSES}">${escapeHtml(facts.date)}</p>
      <p class="${ARCHIVE_SOURCE_CLASSES}">${escapeHtml(facts.source)}</p>
    </div>
    <h3 class="${ARCHIVE_TITLE_CLASSES}">${escapeHtml(facts.title)}</h3>
    <p class="${ARCHIVE_NEWS_CLASSES}">${escapeHtml(facts.newsTitle)}</p>
    <p class="${ARCHIVE_ARTIST_CLASSES}">Artist influence: ${escapeHtml(facts.artist)}</p>
  `;

  li.addEventListener('click', () => commands.activate(facts));
  li.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      commands.activate(facts);
    }
  });

  return li;
}
