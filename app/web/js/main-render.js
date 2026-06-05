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

const META_HEADER_CLASSES = 'meta-header';
const META_SECTION_CLASSES = 'meta-section border-t border-slate-500/35 pt-4';
const META_HEADING_CLASSES = 'm-0 mb-3 text-sm font-semibold uppercase text-cyan-200';
const META_TITLE_CLASSES = 'm-0 font-serif text-xl font-semibold leading-tight text-white';
const META_SUBTITLE_CLASSES = 'm-0 mt-1 text-sm text-slate-400';
const META_LINE_CLASSES = 'meta-line m-0 my-1';
const META_SMALL_CLASSES = 'small text-slate-400';
const META_LIST_CLASSES = 'meta-list mt-2 list-disc space-y-1 pl-5';
const META_LINK_CLASSES = 'text-cyan-100 underline underline-offset-2 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200';
const META_LINKS_CLASSES = 'meta-links flex flex-wrap gap-2';
const PALETTE_SWATCHES_CLASSES = 'palette-swatches inline-flex flex-wrap gap-2 align-middle';
const PALETTE_SWATCH_CLASSES = 'palette-swatch inline-flex items-center gap-1.5 text-slate-300';
const PALETTE_SWATCH_COLOR_CLASSES = 'palette-swatch-color size-3 shrink-0 border border-white/50 shadow-[0_0_0_1px_rgba(5,10,18,0.22)]';

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

function renderMetaLine(label, value, { html = false } = {}) {
  const available = html ? String(value || '').trim() : String(value ?? '').trim();
  if (!available) return '';
  return `<p class="${META_LINE_CLASSES}"><span class="${META_SMALL_CLASSES}">${escapeHtml(label)}:</span> ${html ? value : escapeHtml(value)}</p>`;
}

function renderCreativeBriefList(items = [], label = 'Key parts') {
  if (!items.length) return '';
  return `
    <div class="${META_LINE_CLASSES}">
      <span class="${META_SMALL_CLASSES}">${escapeHtml(label)}:</span>
      <ul class="${META_LIST_CLASSES}">
        ${items.map((item) => `
          <li>
            <span>${escapeHtml(item.label)}</span>
            ${item.detail ? `<span class="${META_SMALL_CLASSES} block">${escapeHtml(item.detail)}</span>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function renderArtDirectionSection(facts) {
  const rationale = facts.rationale;
  if (rationale.legacyIntent) {
    const rows = [
      renderMetaLine('Signal', rationale.signal),
      renderMetaLine('Emotion', rationale.emotion),
      renderMetaLine(
        'Tension / Balance / Motion',
        [rationale.tension, rationale.balance, rationale.motion].filter(Boolean).join(' · ')
      ),
      renderMetaLine('Style card', rationale.styleCard),
      renderMetaLine('Selection rationale', rationale.selectionRationale),
      renderMetaLine('Signal terms', rationale.signalTermsLabel),
      renderMetaLine('Visual mapping', rationale.visualMapping)
    ].filter(Boolean);
    if (!rows.length) return '';
    return `
      <section class="${META_SECTION_CLASSES}">
        <h4 class="${META_HEADING_CLASSES}">Art direction</h4>
        ${rows.join('')}
      </section>
    `;
  }

  const brief = rationale.creativeBrief || {};
  const palette = renderPaletteSwatches(brief.palette);
  const expression = ['tension', 'structure', 'motion', 'urgency', 'contrast']
    .map((key) => brief.expression?.[key] ? `${key} ${brief.expression[key]}` : null)
    .filter(Boolean)
    .join(' · ');
  const rows = [
    renderMetaLine('Image', brief.image),
    renderMetaLine('Arc', brief.arc),
    renderMetaLine('Composition', brief.composition),
    renderMetaLine('Motif', brief.motif),
    palette ? renderMetaLine('Palette', palette, { html: true }) : '',
    renderMetaLine('Expression', expression),
    renderMetaLine('Environment', brief.environment),
    renderMetaLine('Renderer', brief.rendererStatus),
    renderMetaLine('Modules', brief.modulesLabel),
    renderMetaLine('Translation trace', brief.translationTraceLabel),
    renderMetaLine('Selection rationale', rationale.selectionRationale)
  ].filter(Boolean);
  const partList = renderCreativeBriefList(
    brief.keyParts,
    brief.kind === 'immersive-world' ? 'World parts' : 'Key parts'
  );
  if (!rows.length && !partList) return '';
  return `
    <section class="${META_SECTION_CLASSES}">
      <h4 class="${META_HEADING_CLASSES}">Art direction</h4>
      ${rows.join('')}
      ${partList}
    </section>
  `;
}

export function updateHeroNow({ heroNowTitle, heroNowSub, heroNowHeadline }, artOrFacts) {
  if (!heroNowTitle || !heroNowSub) return;

  const hero = resolvePublicArtworkHeroFacts(artOrFacts);

  heroNowTitle.textContent = hero.title;
  heroNowSub.textContent = hero.subtitle;
  if (heroNowHeadline) {
    heroNowHeadline.textContent = hero.headline;
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

export function renderMeta(meta, artOrFacts, sceneInitError) {
  const { meta: facts } = resolvePublicArtworkPresentationFacts(artOrFacts, { sceneInitError });
  const articleLink = facts.links.article.available
    ? `<a class="${META_LINK_CLASSES}" href="${escapeHtml(facts.links.article.href)}" target="_blank" rel="noreferrer">${escapeHtml(facts.links.article.label)}</a>`
    : '';
  const artistLinkItems = facts.links.artist.items.map((link) => (
    `<a class="${META_LINK_CLASSES}" href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`
  ));
  const artistLinks = artistLinkItems.length ? `<div class="${META_LINKS_CLASSES}">${artistLinkItems.join('')}</div>` : '';
  meta.innerHTML = `
    <div class="${META_HEADER_CLASSES}">
      <h3 class="${META_TITLE_CLASSES}">${escapeHtml(facts.title)}</h3>
      <p class="${META_SUBTITLE_CLASSES}">${escapeHtml(facts.date)} · Inspired by ${escapeHtml(facts.artist)}</p>
    </div>

    <section class="${META_SECTION_CLASSES}">
      <h4 class="${META_HEADING_CLASSES}">News provenance</h4>
      <p class="${META_LINE_CLASSES}"><span class="${META_SMALL_CLASSES}">Headline:</span> ${escapeHtml(facts.news.headline)}</p>
      <p class="${META_LINE_CLASSES}"><span class="${META_SMALL_CLASSES}">Source:</span> ${escapeHtml(facts.news.source)}</p>
      ${articleLink ? `<p class="${META_LINE_CLASSES}">${articleLink}</p>` : ''}
      ${artistLinks}
    </section>

    ${renderArtDirectionSection(facts)}
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
