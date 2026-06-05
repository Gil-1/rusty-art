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

export function applyStatusFacts(statusBanner, facts = {}) {
  if (!statusBanner) return facts;
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

function renderScoreChips(breakdown = []) {
  if (!breakdown.length) return '';

  return `<div>${breakdown
    .map((item) => `<span class="score-chip">${escapeHtml(item.label)}: ${escapeHtml(item.value)}</span>`)
    .join(' ')}</div>`;
}

function renderPaletteSwatches(palette = []) {
  if (!palette.length) return '';
  return `<span class="palette-swatches">${palette.map((entry) => (
    `<span class="palette-swatch" title="${escapeHtml(`${entry.label}: ${entry.value}`)}">` +
      `<span class="palette-swatch-color" style="background:${escapeHtml(entry.value)}"></span>` +
      `<span>${escapeHtml(entry.label)}</span>` +
    '</span>'
  )).join('')}</span>`;
}

function renderMetaLine(label, value, { html = false } = {}) {
  const available = html ? String(value || '').trim() : String(value ?? '').trim();
  if (!available) return '';
  return `<p class="meta-line"><span class="small">${escapeHtml(label)}:</span> ${html ? value : escapeHtml(value)}</p>`;
}

function renderCreativeBriefList(items = [], label = 'Key parts') {
  if (!items.length) return '';
  return `
    <div class="meta-line">
      <span class="small">${escapeHtml(label)}:</span>
      <ul class="meta-list">
        ${items.map((item) => `
          <li>
            <span>${escapeHtml(item.label)}</span>
            ${item.detail ? `<span class="small">${escapeHtml(item.detail)}</span>` : ''}
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
      <section class="meta-section">
        <h4>Art direction</h4>
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
    <section class="meta-section">
      <h4>Art direction</h4>
      ${rows.join('')}
      ${partList}
    </section>
  `;
}

function renderQualitySection(quality = {}) {
  if (!quality.available) return '';
  const scoreRows = [
    renderMetaLine('Score', quality.score),
    quality.heuristicScore || quality.feedbackCalibratedScore
      ? renderMetaLine(
          'Heuristic / Feedback-calibrated',
          [quality.heuristicScore, quality.feedbackCalibratedScore].filter(Boolean).join(' · ')
        )
      : ''
  ].filter(Boolean);
  const breakdown = quality.breakdown?.length ? renderScoreChips(quality.breakdown) : '';
  const alignment = [
    quality.alignment?.total ? `total ${quality.alignment.total}` : null,
    quality.alignment?.title ? `title ${quality.alignment.title}` : null,
    quality.alignment?.style ? `style ${quality.alignment.style}` : null,
    quality.alignment?.emotional ? `emotional ${quality.alignment.emotional}` : null
  ].filter(Boolean).join(' · ');
  const calibration = [
    quality.calibration?.sampleCount ? `sample ${quality.calibration.sampleCount}` : null,
    quality.calibration?.trustWeight ? `trust ${quality.calibration.trustWeight}` : null
  ].filter(Boolean).join(' · ');
  return `
    <section class="meta-section meta-section--quality">
      <h4>Quality lens</h4>
      ${scoreRows.join('')}
      ${breakdown}
      ${renderMetaLine('Alignment', alignment)}
      ${renderMetaLine('Calibration', calibration)}
      ${quality.summary ? `<p class="small">${escapeHtml(quality.summary)}</p>` : ''}
      ${quality.rendererNote ? `<p class="small">${escapeHtml(quality.rendererNote)}</p>` : ''}
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

  const metadataLabel = facts.metadataLabel || facts.label || 'Artwork archive';
  const titleLabel = facts.titleLabel || facts.label || 'Open gallery';
  quickPicker.innerHTML = facts.options
    ? facts.options
      .map((option) => `<option value="${escapeHtml(option.value)}" title="${escapeHtml(option.fullLabel)}">${escapeHtml(option.label)}</option>`)
      .join('')
    : `<span class="gallery-trigger-kicker">${escapeHtml(metadataLabel)}</span><span class="gallery-trigger-label">${escapeHtml(titleLabel)}</span>`;
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
    ? `<a href="${escapeHtml(facts.links.article.href)}" target="_blank" rel="noreferrer">${escapeHtml(facts.links.article.label)}</a>`
    : '';
  const artistLinkItems = facts.links.artist.items.map((link) => (
    `<a href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`
  ));
  const artistLinks = artistLinkItems.length ? `<div class="meta-links">${artistLinkItems.join('')}</div>` : '';
  const qualitySection = renderQualitySection(facts.quality);

  meta.innerHTML = `
    <div class="meta-header">
      <h3>${escapeHtml(facts.title)}</h3>
      <p>${escapeHtml(facts.date)} · Inspired by ${escapeHtml(facts.artist)}</p>
    </div>

    <section class="meta-section">
      <h4>News provenance</h4>
      <p class="meta-line"><span class="small">Headline:</span> ${escapeHtml(facts.news.headline)}</p>
      <p class="meta-line"><span class="small">Source:</span> ${escapeHtml(facts.news.source)}</p>
      ${articleLink ? `<p class="meta-line">${articleLink}</p>` : ''}
      ${artistLinks}
    </section>

    ${renderArtDirectionSection(facts)}
    ${qualitySection}
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
  li.className = active ? 'archive-card active' : 'archive-card';
  li.setAttribute('role', 'button');
  li.setAttribute('tabindex', '0');
  li.setAttribute('aria-current', active ? 'true' : 'false');
  li.innerHTML = `
    ${facts.thumbnail ? `
      <div class="archive-thumb">
        <img src="${escapeHtml(facts.thumbnail.src)}" alt="${escapeHtml(facts.thumbnail.altText)}" loading="lazy" decoding="async">
      </div>
    ` : ''}
    <div class="archive-card-head">
      <p class="archive-date">${escapeHtml(facts.date)}</p>
      <p class="archive-source">${escapeHtml(facts.source)}</p>
    </div>
    <h3 class="archive-title">${escapeHtml(facts.title)}</h3>
    <p class="archive-news">${escapeHtml(facts.newsTitle)}</p>
    <p class="archive-artist">Artist influence: ${escapeHtml(facts.artist)}</p>
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
