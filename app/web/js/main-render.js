import {
  buildArchiveCountPresentationFacts,
  buildArchiveCardPresentationFacts,
  buildFallbackPresentationFacts,
  buildLoadingPresentationFacts,
  buildQuickPickerOptionsPresentationFacts,
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
  if (!breakdown.length) return '<span class="small">No quality breakdown available.</span>';

  return `<div>${breakdown
    .map((item) => `<span class="score-chip">${escapeHtml(item.label)}: ${escapeHtml(item.value)}</span>`)
    .join(' ')}</div>`;
}

function renderPaletteSwatches(palette = []) {
  if (!palette.length) return '<span class="small">n/a</span>';
  return `<span class="palette-swatches">${palette.map((entry) => (
    `<span class="palette-swatch" title="${escapeHtml(`${entry.label}: ${entry.value}`)}">` +
      `<span class="palette-swatch-color" style="background:${escapeHtml(entry.value)}"></span>` +
      `<span>${escapeHtml(entry.label)}</span>` +
    '</span>'
  )).join('')}</span>`;
}

function renderCreativeBriefList(items = []) {
  if (!items.length) return '<p class="meta-line"><span class="small">Key parts:</span> n/a</p>';
  return `
    <div class="meta-line">
      <span class="small">Key parts:</span>
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
    return `
      <section class="meta-section">
        <h4>Art direction</h4>
        <p class="meta-line"><span class="small">Signal:</span> ${escapeHtml(rationale.signal)}</p>
        <p class="meta-line"><span class="small">Emotion:</span> ${escapeHtml(rationale.emotion)}</p>
        <p class="meta-line"><span class="small">Tension / Balance / Motion:</span> ${escapeHtml(rationale.tension)} · ${escapeHtml(rationale.balance)} · ${escapeHtml(rationale.motion)}</p>
        <p class="meta-line"><span class="small">Style card:</span> ${escapeHtml(rationale.styleCard)}</p>
        <p class="meta-line"><span class="small">Selection rationale:</span> ${escapeHtml(rationale.selectionRationale)}</p>
        <p class="meta-line"><span class="small">Signal terms:</span> ${escapeHtml(rationale.signalTermsLabel)}</p>
        <p class="meta-line"><span class="small">Visual mapping:</span> ${escapeHtml(rationale.visualMapping)}</p>
      </section>
    `;
  }

  const brief = rationale.creativeBrief || {};
  return `
    <section class="meta-section">
      <h4>Art direction</h4>
      <p class="meta-line"><span class="small">Image:</span> ${escapeHtml(brief.image)}</p>
      <p class="meta-line"><span class="small">Arc:</span> ${escapeHtml(brief.arc)}</p>
      <p class="meta-line"><span class="small">Composition:</span> ${escapeHtml(brief.composition)}</p>
      <p class="meta-line"><span class="small">Motif:</span> ${escapeHtml(brief.motif)}</p>
      <p class="meta-line"><span class="small">Palette:</span> ${renderPaletteSwatches(brief.palette)}</p>
      ${renderCreativeBriefList(brief.keyParts)}
      <p class="meta-line"><span class="small">Expression:</span> tension ${escapeHtml(brief.expression?.tension)} · structure ${escapeHtml(brief.expression?.structure)} · motion ${escapeHtml(brief.expression?.motion)} · urgency ${escapeHtml(brief.expression?.urgency)} · contrast ${escapeHtml(brief.expression?.contrast)}</p>
      <p class="meta-line"><span class="small">Modules:</span> ${escapeHtml(brief.modulesLabel)}</p>
      <p class="meta-line"><span class="small">Translation trace:</span> ${escapeHtml(brief.translationTraceLabel)}</p>
      <p class="meta-line"><span class="small">Selection rationale:</span> ${escapeHtml(rationale.selectionRationale)}</p>
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

export function applyLoadingFacts({ artFirst, loadState, quickPicker, quickPrev, quickNext }, facts = {}) {
  if (artFirst) artFirst.classList.toggle('is-loading', Boolean(facts.artFirstLoading));
  if (loadState) loadState.hidden = Boolean(facts.loadStateHidden);
  if (quickPicker) quickPicker.disabled = Boolean(facts.quickPickerDisabled);
  if (quickPrev) quickPrev.disabled = Boolean(facts.quickPrevDisabled);
  if (quickNext) quickNext.disabled = Boolean(facts.quickNextDisabled);
  return facts;
}

export function setLoadingState(elements, isLoading, manifest, activeIndex) {
  return applyLoadingFacts(elements, buildLoadingPresentationFacts({ isLoading, manifest, activeIndex }));
}

export function populateQuickPicker(quickPicker, manifest, { compact = false } = {}) {
  if (!quickPicker || !manifest?.items) return;
  const facts = buildQuickPickerOptionsPresentationFacts(manifest, { compact });

  quickPicker.innerHTML = facts.options
    .map((option) => `<option value="${escapeHtml(option.value)}" title="${escapeHtml(option.fullLabel)}">${escapeHtml(option.label)}</option>`)
    .join('');
  return facts;
}

export function renderMeta(meta, artOrFacts, sceneInitError) {
  const { meta: facts } = resolvePublicArtworkPresentationFacts(artOrFacts, { sceneInitError });
  const articleLink = facts.links.article.available
    ? `<a href="${escapeHtml(facts.links.article.href)}" target="_blank" rel="noreferrer">${escapeHtml(facts.links.article.label)}</a>`
    : `<span class="small">${escapeHtml(facts.links.article.label)}</span>`;
  const artistLinkItems = facts.links.artist.items.map((link) => (
    `<a href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`
  ));

  meta.innerHTML = `
    <div class="meta-header">
      <h3>${escapeHtml(facts.title)}</h3>
      <p>${escapeHtml(facts.date)} · Inspired by ${escapeHtml(facts.artist)}</p>
    </div>

    <section class="meta-section">
      <h4>News provenance</h4>
      <p class="meta-line"><span class="small">Headline:</span> ${escapeHtml(facts.news.headline)}</p>
      <p class="meta-line"><span class="small">Source:</span> ${escapeHtml(facts.news.source)}</p>
      <p class="meta-line">${articleLink}</p>
      <div class="meta-links">
        ${artistLinkItems.length ? artistLinkItems.join('') : `<span class="small">${escapeHtml(facts.links.artist.fallbackLabel)}</span>`}
      </div>
    </section>

    ${renderArtDirectionSection(facts)}

    <section class="meta-section meta-section--quality">
      <h4>Quality lens</h4>
      <p class="meta-line"><span class="small">Score:</span> ${escapeHtml(facts.quality.score)}</p>
      <p class="meta-line"><span class="small">Heuristic:</span> ${escapeHtml(facts.quality.heuristicScore)} ·
      <span class="small">Feedback-calibrated:</span> ${escapeHtml(facts.quality.feedbackCalibratedScore)}</p>
      ${renderScoreChips(facts.quality.breakdown)}
      <p class="meta-line"><span class="small">Alignment:</span> total ${escapeHtml(facts.quality.alignment.total)} · title ${escapeHtml(facts.quality.alignment.title)} · style ${escapeHtml(facts.quality.alignment.style)} · emotional ${escapeHtml(facts.quality.alignment.emotional)}</p>
      <p class="meta-line"><span class="small">Calibration sample:</span> ${escapeHtml(facts.quality.calibration.sampleCount)} · trust ${escapeHtml(facts.quality.calibration.trustWeight)}</p>
      <p class="small">${escapeHtml(facts.quality.summary)}</p>
      ${facts.quality.rendererNote ? `<p class="small">${escapeHtml(facts.quality.rendererNote)}</p>` : ''}
    </section>
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

export function createArchiveCardElement(itemOrFacts, commandsOrActivate) {
  const facts = buildArchiveCardPresentationFacts(itemOrFacts);
  const commands = normalizeArchiveCardCommands(commandsOrActivate);
  const li = document.createElement('li');
  li.dataset.file = facts.file;
  li.className = 'archive-card';
  li.setAttribute('role', 'button');
  li.setAttribute('tabindex', '0');
  li.innerHTML = `
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
