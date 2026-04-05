export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sourceLabel(source) {
  const value = String(source || 'unknown').trim();
  return value ? value.toUpperCase() : 'UNKNOWN';
}

export function showStatus(statusBanner, message = '', level = 'info') {
  if (!statusBanner) return;
  if (!message) {
    statusBanner.hidden = true;
    statusBanner.textContent = '';
    statusBanner.removeAttribute('data-level');
    return;
  }

  statusBanner.hidden = false;
  statusBanner.dataset.level = level;
  statusBanner.textContent = message;
}

export function showFallback({ fallbackPanel, fallbackMessage, retryLoad }, message = '', showRetry = true) {
  if (!fallbackPanel || !fallbackMessage) return;
  if (!message) {
    fallbackPanel.hidden = true;
    if (retryLoad) retryLoad.hidden = true;
    return;
  }

  fallbackPanel.hidden = false;
  fallbackMessage.textContent = message;
  if (retryLoad) retryLoad.hidden = !showRetry;
}

function renderScoreChips(breakdown) {
  const entries = Object.entries(breakdown || {});
  if (!entries.length) return '<span class="small">No quality breakdown available.</span>';

  return `<div>${entries
    .map(([label, value]) => `<span class="score-chip">${escapeHtml(label)}: ${Number(value).toFixed(1)}</span>`)
    .join(' ')}</div>`;
}

export function updateHeroNow({ heroNowTitle, heroNowSub, heroNowHeadline }, art) {
  if (!heroNowTitle || !heroNowSub) return;

  const title = art?.title || 'Untitled piece';
  const artist = art?.inspiration?.artist || 'Unknown artist';
  const source = sourceLabel(art?.news?.source);

  heroNowTitle.textContent = title;
  heroNowSub.textContent = `${artist} influence · ${source} headline · ${art?.date || 'Unknown date'}`;
  if (heroNowHeadline) {
    heroNowHeadline.textContent = art?.news?.title || 'Headline context unavailable.';
  }
}

export function updateArchiveCount(archiveCount, renderedArchiveCount, manifest) {
  if (!archiveCount || !manifest?.items) return;
  archiveCount.textContent = `${renderedArchiveCount}/${manifest.items.length} loaded`;
}

export function setLoadingState({ artFirst, loadState, quickPicker, quickPrev, quickNext }, isLoading, manifest, activeIndex) {
  const hasLoopableArchive = (manifest?.items?.length || 0) > 1 && activeIndex >= 0;
  if (artFirst) artFirst.classList.toggle('is-loading', isLoading);
  if (loadState) loadState.hidden = !isLoading;
  if (quickPicker) quickPicker.disabled = isLoading;
  if (quickPrev) quickPrev.disabled = isLoading || !hasLoopableArchive;
  if (quickNext) quickNext.disabled = isLoading || !hasLoopableArchive;
}

function formatQuickPickerLabel(item, compact = false) {
  const date = String(item?.date || 'Unknown date').trim() || 'Unknown date';
  const artist = String(item?.artist || 'Unknown artist').trim() || 'Unknown artist';
  const title = String(item?.title || 'Untitled').trim() || 'Untitled';
  const fullLabel = `${date} · ${artist} · ${title}`;

  if (!compact) {
    return { label: fullLabel, fullLabel };
  }

  const compactArtist = artist.length > 22 ? `${artist.slice(0, 21)}…` : artist;
  return {
    label: `${date} · ${compactArtist}`,
    fullLabel
  };
}

export function populateQuickPicker(quickPicker, manifest, { compact = false } = {}) {
  if (!quickPicker || !manifest?.items) return;

  quickPicker.innerHTML = manifest.items
    .map((item, index) => {
      const { label, fullLabel } = formatQuickPickerLabel(item, compact);
      return `<option value="${index}" title="${escapeHtml(fullLabel)}">${escapeHtml(label)}</option>`;
    })
    .join('');
}

export function renderMeta(meta, art, sceneInitError) {
  const rationale = art.rationale || {};
  const selection = rationale.selection || {};
  const intent = rationale.intent || art.artFramework?.intent || {};
  const quality = art.qualityScore || art.artFramework?.quality || {};
  const heuristic = quality.heuristic || {};
  const calibration = quality.calibration || {};
  const breakdown = quality.breakdown || heuristic.breakdown || {};
  const alignment = quality.alignment || art.artFramework?.quality?.alignment || {};
  const priorityTerms = Array.isArray(selection.priorityTerms) ? selection.priorityTerms : [];
  const mappings = Array.isArray(art.newsVisualMappings) ? art.newsVisualMappings : [];
  const artistLinks = art.inspiration?.links || {};
  const styleCard = art.inspiration?.styleCard || {};

  const hasRealLink = typeof art.news?.link === 'string' && /^https?:\/\//i.test(art.news.link) && !/example\.com/i.test(art.news.link);
  const articleLink = hasRealLink
    ? `<a href="${escapeHtml(art.news.link)}" target="_blank" rel="noreferrer">Open article</a>`
    : '<span class="small">Article link unavailable (fallback headline).</span>';

  const artistLinkItems = [
    artistLinks.wikipedia
      ? `<a href="${escapeHtml(artistLinks.wikipedia)}" target="_blank" rel="noreferrer">Wikipedia</a>`
      : null,
    artistLinks.reference
      ? `<a href="${escapeHtml(artistLinks.reference)}" target="_blank" rel="noreferrer">Reference</a>`
      : null
  ].filter(Boolean);

  meta.innerHTML = `
    <div class="meta-header">
      <h3>${escapeHtml(art.title || 'Untitled')}</h3>
      <p>${escapeHtml(art.date || 'Unknown date')} · Inspired by ${escapeHtml(art.inspiration?.artist || 'Unknown artist')}</p>
    </div>

    <section class="meta-section">
      <h4>News provenance</h4>
      <p class="meta-line"><span class="small">Headline:</span> ${escapeHtml(art.news?.title || 'No headline')}</p>
      <p class="meta-line"><span class="small">Source:</span> ${escapeHtml(sourceLabel(art.news?.source))}</p>
      <p class="meta-line">${articleLink}</p>
      <div class="meta-links">
        ${artistLinkItems.length ? artistLinkItems.join('') : '<span class="small">Artist links unavailable.</span>'}
      </div>
    </section>

    <section class="meta-section">
      <h4>Art direction</h4>
      <p class="meta-line"><span class="small">Signal:</span> ${escapeHtml(intent.signal || 'Translate top headline signal into abstract form.')}</p>
      <p class="meta-line"><span class="small">Emotion:</span> ${escapeHtml(intent.emotion || 'Measured tension.')}</p>
      <p class="meta-line"><span class="small">Tension / Balance / Motion:</span> ${escapeHtml(intent.tension || 'n/a')} · ${escapeHtml(intent.balance || 'n/a')} · ${escapeHtml(intent.motion || 'n/a')}</p>
      <p class="meta-line"><span class="small">Style card:</span> ${escapeHtml(Object.values(styleCard).join(' · ') || 'default')}</p>
      <p class="meta-line"><span class="small">Selection rationale:</span> ${escapeHtml(selection.whyHeadline || 'Top-ranked daily headline.')}</p>
      <p class="meta-line"><span class="small">Signal terms:</span> ${escapeHtml(priorityTerms.length ? priorityTerms.join(', ') : 'none')}</p>
      <p class="meta-line"><span class="small">Visual mapping:</span> ${escapeHtml(mappings.slice(0, 2).map((m) => m.visualDecision).join(' | ') || 'n/a')}</p>
    </section>

    <section class="meta-section meta-section--quality">
      <h4>Quality lens</h4>
      <p class="meta-line"><span class="small">Score:</span> ${quality.score != null ? `${Number(quality.score).toFixed(1)} / 100` : 'n/a'}</p>
      <p class="meta-line"><span class="small">Heuristic:</span> ${heuristic.score != null ? Number(heuristic.score).toFixed(1) : 'n/a'} ·
      <span class="small">Feedback-calibrated:</span> ${quality.score != null ? Number(quality.score).toFixed(1) : 'n/a'}</p>
      ${renderScoreChips(breakdown)}
      <p class="meta-line"><span class="small">Alignment:</span> total ${alignment.totalAlign ?? 'n/a'} · title ${alignment.components?.title?.score ?? 'n/a'} · style ${alignment.components?.style?.score ?? 'n/a'} · emotional ${alignment.components?.emotional?.score ?? 'n/a'}</p>
      <p class="meta-line"><span class="small">Calibration sample:</span> ${calibration.sampleCount ?? 0} · trust ${calibration.trustWeight ?? 0}</p>
      <p class="small">${escapeHtml(quality.summary || rationale.qualitySummary || 'Score blends heuristics with user-feedback calibration and explicit penalties.')}</p>
      ${sceneInitError ? `<p class="small">Renderer note: ${escapeHtml(sceneInitError.message)}</p>` : ''}
    </section>
  `;
}

export function createArchiveCardElement(item, activate) {
  const li = document.createElement('li');
  li.dataset.file = item.file;
  li.className = 'archive-card';
  li.setAttribute('role', 'button');
  li.setAttribute('tabindex', '0');
  li.innerHTML = `
    <div class="archive-card-head">
      <p class="archive-date">${escapeHtml(item.date)}</p>
      <p class="archive-source">${escapeHtml(sourceLabel(item.source))}</p>
    </div>
    <h3 class="archive-title">${escapeHtml(item.title)}</h3>
    <p class="archive-news">${escapeHtml(item.newsTitle || 'headline unavailable')}</p>
    <p class="archive-artist">Artist influence: ${escapeHtml(item.artist)}</p>
  `;

  li.addEventListener('click', activate);
  li.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  });

  return li;
}
