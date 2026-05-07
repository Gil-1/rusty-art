export {
  PUBLIC_ARTWORK_HERO_FACT_FIELDS,
  PUBLIC_ARTWORK_META_FACT_FIELDS,
  PUBLIC_ARTWORK_PRESENTATION_REQUIRED_PAYLOAD_PATHS,
  PUBLIC_ARTWORK_PRESENTATION_SECTIONS,
  validatePublicArtworkPresentationFacts,
  validatePublicArtworkPresentationPayload
} from './contracts/public-artwork-presentation-contract.js';

function asObject(value, fallback = {}) {
  return value && typeof value === 'object' ? value : fallback;
}

function normalizedText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function normalizedOptionalText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function normalizedColor(value) {
  const text = normalizedOptionalText(value);
  return text && /^#[0-9a-f]{3,8}$/i.test(text) ? text : null;
}

function labelValue(value, fallback = 'n/a') {
  return value == null ? fallback : String(value);
}

function compactMetric(value, fallback = 'n/a') {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return number.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function numericLabel(value, { suffix = '', fallback = 'n/a' } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return `${number.toFixed(1)}${suffix}`;
}

function firstPresent(...values) {
  for (const value of values) {
    if (value != null) return value;
  }
  return null;
}

const LEGACY_INTENT_FIELDS = Object.freeze(['signal', 'emotion', 'tension', 'balance', 'motion']);

function hasLegacyIntent(intent = {}) {
  const source = asObject(intent);
  return LEGACY_INTENT_FIELDS.some((field) => normalizedOptionalText(source[field]));
}

function buildPaletteFacts(palette = {}) {
  return Object.entries(asObject(palette))
    .map(([label, value]) => ({
      label: normalizedText(label),
      value: normalizedColor(value)
    }))
    .filter((entry) => entry.label && entry.value)
    .slice(0, 6);
}

function buildScenePartFacts(elements = []) {
  if (!Array.isArray(elements)) return [];
  return elements
    .map((element) => {
      const source = asObject(element);
      const read = normalizedOptionalText(source.expectedRead);
      const purpose = normalizedOptionalText(source.scenePurpose);
      const role = normalizedOptionalText(source.role);
      const layer = normalizedOptionalText(source.layer);
      const moduleType = normalizedOptionalText(source.moduleType);
      const label = read || purpose || moduleType || normalizedOptionalText(source.id);
      return label ? {
        label,
        detail: purpose && purpose !== label ? purpose : null,
        role,
        layer,
        moduleType
      } : null;
    })
    .filter(Boolean)
    .slice(0, 4);
}

function buildModuleFacts(report = {}) {
  const accepted = Array.isArray(report?.accepted) ? report.accepted : [];
  return accepted
    .map((module) => normalizedOptionalText(module?.id || module?.moduleId || module?.moduleType || module?.name))
    .filter(Boolean)
    .slice(0, 6);
}

function buildTranslationTraceFacts(mappings = []) {
  if (!Array.isArray(mappings)) return [];
  return mappings
    .map((mapping) => normalizedOptionalText(mapping?.visualDecision))
    .filter(Boolean)
    .slice(0, 4);
}

function buildCreativeBriefFacts({ source, mappings }) {
  const scene = asObject(source.scene);
  const sceneAuthoring = asObject(scene.sceneAuthoring);
  const artisticIntent = asObject(sceneAuthoring.artisticIntent);
  const expression = asObject(scene.expression);
  const palette = buildPaletteFacts(scene.palette);
  const keyParts = buildScenePartFacts(scene.elements);
  const modules = buildModuleFacts(scene.customModuleReport);
  const translationTrace = buildTranslationTraceFacts(mappings);

  return {
    image: normalizedText(artisticIntent.statement, 'Scene authoring brief unavailable.'),
    arc: normalizedText(artisticIntent.emotionalArc, 'Emotional arc unavailable.'),
    composition: normalizedText(artisticIntent.compositionLogic, 'Composition logic unavailable.'),
    motif: normalizedText(artisticIntent.motif, normalizedText(scene.motif, 'n/a')),
    palette,
    paletteLabel: palette.length ? palette.map((entry) => `${entry.label} ${entry.value}`).join(' · ') : 'n/a',
    keyParts,
    keyPartsLabel: keyParts.length ? keyParts.map((part) => part.label).join(' · ') : 'n/a',
    expression: {
      tension: compactMetric(expression.tension),
      structure: compactMetric(expression.structure),
      motion: compactMetric(expression.motion),
      urgency: compactMetric(expression.urgency),
      contrast: compactMetric(expression.contrast)
    },
    modules,
    modulesLabel: modules.length ? modules.join(', ') : 'n/a',
    translationTrace,
    translationTraceLabel: translationTrace.length ? translationTrace.join(' | ') : 'n/a'
  };
}

export function sourceLabel(source) {
  const value = String(source || 'unknown').trim();
  return value ? value.toUpperCase() : 'UNKNOWN';
}

export function isPublicArticleLink(link) {
  const value = normalizedOptionalText(link);
  return Boolean(value && /^https?:\/\//i.test(value) && !/example\.com/i.test(value));
}

export function buildPublicArtworkHeroFacts(art = {}) {
  const source = asObject(art);
  const inspiration = asObject(source.inspiration);
  const news = asObject(source.news);
  const title = normalizedText(source.title, 'Untitled piece');
  const artist = normalizedText(inspiration.artist, 'Unknown artist');
  const date = normalizedText(source.date, 'Unknown date');
  const headline = normalizedText(news.title, 'Headline context unavailable.');

  return {
    title,
    artist,
    date,
    headline,
    source: sourceLabel(news.source),
    subtitle: `${artist} influence · ${sourceLabel(news.source)} headline · ${date}`
  };
}

export function buildPublicArtworkLinkFacts(art = {}) {
  const source = asObject(art);
  const news = asObject(source.news);
  const inspiration = asObject(source.inspiration);
  const artistLinks = asObject(inspiration.links);
  const articleHref = normalizedOptionalText(news.link);
  const articleAvailable = isPublicArticleLink(articleHref);
  const artistLinkFacts = [
    ['Wikipedia', artistLinks.wikipedia],
    ['Reference', artistLinks.reference]
  ]
    .map(([label, href]) => ({ label, href: normalizedOptionalText(href) }))
    .filter((link) => link.href);

  return {
    article: {
      available: articleAvailable,
      href: articleAvailable ? articleHref : null,
      label: articleAvailable ? 'Open article' : 'Article link unavailable (fallback headline).'
    },
    artist: {
      items: artistLinkFacts,
      fallbackLabel: 'Artist links unavailable.'
    }
  };
}

export function buildPublicArtworkRationaleFacts(art = {}) {
  const source = asObject(art);
  const rationale = asObject(source.rationale);
  const selection = asObject(rationale.selection);
  const rationaleIntent = asObject(rationale.intent);
  const frameworkIntent = asObject(source.artFramework?.intent);
  const legacyIntent = hasLegacyIntent(rationaleIntent) || hasLegacyIntent(frameworkIntent);
  const intent = hasLegacyIntent(rationaleIntent) ? rationaleIntent : hasLegacyIntent(frameworkIntent) ? frameworkIntent : {};
  const inspiration = asObject(source.inspiration);
  const styleCard = asObject(inspiration.styleCard);
  const priorityTerms = Array.isArray(selection.priorityTerms)
    ? selection.priorityTerms.map((term) => normalizedText(term)).filter(Boolean)
    : [];
  const mappings = Array.isArray(source.newsVisualMappings) ? source.newsVisualMappings : [];
  const visualMapping = mappings
    .slice(0, 2)
    .map((mapping) => mapping?.visualDecision)
    .join(' | ') || 'n/a';
  const styleCardLabel = Object.values(styleCard)
    .map((value) => normalizedText(value))
    .filter(Boolean)
    .join(' · ') || 'default';

  return {
    legacyIntent,
    signal: normalizedText(intent.signal, 'Translate top headline signal into abstract form.'),
    emotion: normalizedText(intent.emotion, 'Measured tension.'),
    tension: normalizedText(intent.tension, 'n/a'),
    balance: normalizedText(intent.balance, 'n/a'),
    motion: normalizedText(intent.motion, 'n/a'),
    styleCard: styleCardLabel,
    selectionRationale: normalizedText(selection.whyHeadline, 'Top-ranked daily headline.'),
    signalTerms: priorityTerms,
    signalTermsLabel: priorityTerms.length ? priorityTerms.join(', ') : 'none',
    visualMapping,
    creativeBrief: buildCreativeBriefFacts({ source, mappings })
  };
}

export function buildPublicArtworkQualityFacts(art = {}, { sceneInitError = null } = {}) {
  const source = asObject(art);
  const rationale = asObject(source.rationale);
  const frameworkQuality = asObject(source.artFramework?.quality);
  const quality = asObject(firstPresent(source.qualityScore, source.artFramework?.quality));
  const heuristic = asObject(quality.heuristic);
  const calibration = asObject(quality.calibration);
  const breakdown = asObject(firstPresent(quality.breakdown, heuristic.breakdown));
  const alignment = asObject(firstPresent(quality.alignment, frameworkQuality.alignment));
  const alignmentComponents = asObject(alignment.components);

  return {
    score: numericLabel(quality.score, { suffix: ' / 100' }),
    heuristicScore: numericLabel(heuristic.score),
    feedbackCalibratedScore: numericLabel(quality.score),
    breakdown: Object.entries(breakdown).map(([label, value]) => ({
      label,
      value: numericLabel(value)
    })),
    alignment: {
      total: labelValue(alignment.totalAlign),
      title: labelValue(alignmentComponents.title?.score),
      style: labelValue(alignmentComponents.style?.score),
      emotional: labelValue(alignmentComponents.emotional?.score)
    },
    calibration: {
      sampleCount: labelValue(calibration.sampleCount, '0'),
      trustWeight: labelValue(calibration.trustWeight, '0')
    },
    summary: normalizedText(
      firstPresent(quality.summary, rationale.qualitySummary),
      'Score blends heuristics with user-feedback calibration and explicit penalties.'
    ),
    rendererNote: sceneInitError?.message ? `Renderer note: ${sceneInitError.message}` : null
  };
}

export function buildPublicArtworkMetadataFacts(art = {}, { sceneInitError = null } = {}) {
  const source = asObject(art);
  const inspiration = asObject(source.inspiration);
  const news = asObject(source.news);

  return {
    title: normalizedText(source.title, 'Untitled'),
    date: normalizedText(source.date, 'Unknown date'),
    artist: normalizedText(inspiration.artist, 'Unknown artist'),
    news: {
      headline: normalizedText(news.title, 'No headline'),
      source: sourceLabel(news.source)
    },
    links: buildPublicArtworkLinkFacts(source),
    rationale: buildPublicArtworkRationaleFacts(source),
    quality: buildPublicArtworkQualityFacts(source, { sceneInitError })
  };
}

export function buildPublicArtworkPresentationFacts(art = {}, { sceneInitError = null } = {}) {
  return {
    hero: buildPublicArtworkHeroFacts(art),
    meta: buildPublicArtworkMetadataFacts(art, { sceneInitError })
  };
}

export function isPublicArtworkPresentationFacts(value) {
  return Boolean(value && typeof value === 'object' && value.hero && value.meta);
}

export function isPublicArtworkHeroFacts(value) {
  return Boolean(value && typeof value === 'object' && 'title' in value && 'subtitle' in value && 'headline' in value);
}

export function resolvePublicArtworkPresentationFacts(value = {}, options = {}) {
  if (isPublicArtworkPresentationFacts(value)) return value;
  return buildPublicArtworkPresentationFacts(value, options);
}

export function resolvePublicArtworkHeroFacts(value = {}, options = {}) {
  if (isPublicArtworkHeroFacts(value)) return value;
  return resolvePublicArtworkPresentationFacts(value, options).hero;
}

export function buildArchiveCardPresentationFacts(item = {}) {
  return {
    file: normalizedText(item.file),
    date: normalizedText(item.date, 'Unknown date'),
    source: sourceLabel(item.source),
    title: normalizedText(item.title, 'Untitled piece'),
    newsTitle: normalizedText(item.newsTitle, 'headline unavailable'),
    artist: normalizedText(item.artist, 'Unknown artist')
  };
}

export function buildArchiveCountPresentationFacts(renderedArchiveCount = 0, manifest = {}) {
  const items = Array.isArray(manifest?.items) ? manifest.items : null;
  if (!items) {
    return {
      available: false,
      renderedCount: 0,
      totalCount: 0,
      label: ''
    };
  }

  const rendered = Number(renderedArchiveCount);
  const renderedCount = Number.isFinite(rendered) ? Math.max(0, rendered) : 0;
  const totalCount = items.length;

  return {
    available: true,
    renderedCount,
    totalCount,
    label: `${renderedCount}/${totalCount} loaded`
  };
}

export function buildQuickPickerPresentationFacts(item = {}, { compact = false } = {}) {
  const date = normalizedText(item.date, 'Unknown date');
  const artist = normalizedText(item.artist, 'Unknown artist');
  const title = normalizedText(item.title, 'Untitled');
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

export function buildQuickPickerOptionsPresentationFacts(manifest = {}, { compact = false } = {}) {
  const items = Array.isArray(manifest?.items) ? manifest.items : [];

  return {
    options: items.map((item, index) => {
      const facts = buildQuickPickerPresentationFacts(item, { compact });
      return {
        value: String(index),
        label: facts.label,
        fullLabel: facts.fullLabel
      };
    })
  };
}

export function buildLoadingPresentationFacts({ isLoading = false, manifest = {}, activeIndex = -1 } = {}) {
  const loading = Boolean(isLoading);
  const itemCount = Array.isArray(manifest?.items) ? manifest.items.length : 0;
  const hasLoopableArchive = itemCount > 1 && activeIndex >= 0;

  return {
    isLoading: loading,
    hasLoopableArchive,
    artFirstLoading: loading,
    loadStateHidden: !loading,
    quickPickerDisabled: loading,
    quickPrevDisabled: loading || !hasLoopableArchive,
    quickNextDisabled: loading || !hasLoopableArchive
  };
}

export function buildStatusPresentationFacts(message = '', level = 'info') {
  const text = normalizedText(message);
  const normalizedLevel = normalizedText(level, 'info');

  return {
    hidden: !text,
    message: text,
    level: text ? normalizedLevel : null
  };
}

export function buildFallbackPresentationFacts(message = '', { showRetry = true } = {}) {
  const text = normalizedText(message);

  return {
    hidden: !text,
    message: text,
    showRetry: Boolean(showRetry),
    retryHidden: !text || !showRetry
  };
}

export function buildPublicArtworkViewPresentationFacts({
  art = {},
  manifest = {},
  renderedArchiveCount = 0,
  isLoading = false,
  activeIndex = -1,
  sceneInitError = null,
  statusMessage = '',
  statusLevel = 'info',
  fallbackMessage = '',
  showRetry = true,
  compactQuickPicker = false
} = {}) {
  const artworkFacts = resolvePublicArtworkPresentationFacts(art, { sceneInitError });

  return {
    ...artworkFacts,
    archive: {
      count: buildArchiveCountPresentationFacts(renderedArchiveCount, manifest),
      cards: (Array.isArray(manifest?.items) ? manifest.items : []).map((item) => buildArchiveCardPresentationFacts(item)),
      quickPicker: buildQuickPickerOptionsPresentationFacts(manifest, { compact: compactQuickPicker })
    },
    loading: buildLoadingPresentationFacts({ isLoading, manifest, activeIndex }),
    status: buildStatusPresentationFacts(statusMessage, statusLevel),
    fallback: buildFallbackPresentationFacts(fallbackMessage, { showRetry })
  };
}
