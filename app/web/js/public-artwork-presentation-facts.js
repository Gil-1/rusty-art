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

const UNAVAILABLE_META_TOKEN_PATTERN = /^(?:n\/a|na|none|null|unavailable)$/i;

function normalizedPublicDecisionText(value) {
  const text = normalizedOptionalText(value);
  if (!text || UNAVAILABLE_META_TOKEN_PATTERN.test(text)) return null;
  const cleaned = text
    .split(/\s+/)
    .filter((part) => {
      const token = part.replace(/^[,;|]+|[,;|]+$/g, '');
      return token
        && !UNAVAILABLE_META_TOKEN_PATTERN.test(token)
        && !/^[a-z0-9_.-]+=(?:n\/a|na|none|null|unavailable)$/i.test(token);
    })
    .join(' ')
    .trim();
  return cleaned || null;
}

function resolveDocumentBaseHref({ baseHref = null, documentRef = globalThis?.document } = {}) {
  return normalizedOptionalText(baseHref) || normalizedOptionalText(documentRef?.baseURI);
}

function resolveTrustedRelativeHref(path, options = {}) {
  const base = resolveDocumentBaseHref(options);
  if (!base) return path;

  try {
    return new URL(path, base).href;
  } catch {
    return path;
  }
}

function normalizedTrustedRelativeJpeg(value, options = {}) {
  const text = normalizedOptionalText(value);
  if (!text || text.includes('..')) return null;
  return /^\.\/data\/[A-Za-z0-9._/-]+\.jpg$/i.test(text)
    ? resolveTrustedRelativeHref(text, options)
    : null;
}

function normalizedColor(value) {
  const text = normalizedOptionalText(value);
  return text && /^#[0-9a-f]{3,8}$/i.test(text) ? text : null;
}

function optionalLabelValue(value) {
  return value == null ? null : String(value);
}

function compactMetricOptional(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return number.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function optionalNumericLabel(value, { suffix = '' } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
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

function buildWorldModuleFacts(world = {}) {
  return (Array.isArray(world?.generatedModules) ? world.generatedModules : [])
    .map((module) => normalizedOptionalText(module?.moduleId || module?.id || module?.file || module?.url))
    .filter(Boolean)
    .slice(0, 6);
}

function buildRendererFallbackReasonFacts(rendererCompatibility = {}) {
  const source = asObject(rendererCompatibility);
  const ownReason = normalizedOptionalText(source.fallbackReason);
  if (ownReason) return ownReason;

  const ownReasons = Array.isArray(source.fallbackReasons) ? source.fallbackReasons : [];
  const moduleReasons = Array.isArray(source.modules)
    ? source.modules.flatMap((module) => [
      module?.fallbackReason,
      ...(Array.isArray(module?.fallbackReasons) ? module.fallbackReasons : [])
    ])
    : [];
  return [...ownReasons, ...moduleReasons]
    .map((reason) => normalizedOptionalText(reason))
    .find(Boolean) || null;
}

function buildTranslationTraceFacts(mappings = []) {
  if (!Array.isArray(mappings)) return [];
  return mappings
    .map((mapping) => normalizedPublicDecisionText(mapping?.visualDecision))
    .filter(Boolean)
    .slice(0, 4);
}

function buildImmersiveWorldPartFacts(parts = []) {
  if (!Array.isArray(parts)) return [];
  return parts
    .map((part) => {
      const source = asObject(part);
      const label = normalizedOptionalText(source.role)
        || normalizedOptionalText(source.partId)
        || normalizedOptionalText(source.id);
      const detail = normalizedOptionalText(source.params?.supportRole)
        || normalizedOptionalText(source.params?.visibilityPriority);
      return label ? {
        label,
        detail: detail && detail !== label ? detail : null,
        role: normalizedOptionalText(source.role),
        layer: normalizedOptionalText(source.params?.band),
        moduleType: normalizedOptionalText(source.moduleRef?.moduleId)
      } : null;
    })
    .filter(Boolean)
    .slice(0, 5);
}

function buildImmersiveWorldBriefFacts({ source, mappings }) {
  const world = asObject(source.world);
  const environment = asObject(world.environment);
  const renderFacts = asObject(world.renderFacts);
  const rendererCompatibility = asObject(world.rendererCompatibility);
  const keyParts = buildImmersiveWorldPartFacts(world.parts);
  const modules = buildWorldModuleFacts(world);
  const translationTrace = buildTranslationTraceFacts(mappings);
  const environmentKind = normalizedOptionalText(environment.kind);
  const rendererStatus = normalizedOptionalText(renderFacts.rendererCompatibilityStatus || rendererCompatibility.compatibilityStatus);
  const rendererFallbackReason = buildRendererFallbackReasonFacts(rendererCompatibility);
  const generatedModuleCount = Number(firstPresent(renderFacts.generatedModuleCount, rendererCompatibility.moduleCount));
  const acceptedPartCount = Number(firstPresent(renderFacts.acceptedPartCount, Array.isArray(world.parts) ? world.parts.length : null));

  return {
    kind: 'immersive-world',
    image: null,
    arc: null,
    composition: null,
    motif: null,
    palette: [],
    paletteLabel: null,
    keyParts,
    keyPartsLabel: keyParts.length ? keyParts.map((part) => part.label).join(' · ') : null,
    expression: {},
    modules,
    modulesLabel: modules.length ? modules.join(', ') : null,
    moduleCount: Number.isFinite(generatedModuleCount) ? generatedModuleCount : null,
    partCount: Number.isFinite(acceptedPartCount) ? acceptedPartCount : null,
    translationTrace,
    translationTraceLabel: translationTrace.length ? translationTrace.join(' | ') : null,
    environment: environmentKind,
    rendererStatus,
    rendererFallbackReason,
    available: Boolean(environmentKind || rendererStatus || rendererFallbackReason || keyParts.length || modules.length || translationTrace.length)
  };
}

function buildCreativeBriefFacts({ source, mappings }) {
  if (source?.artCreationMethod === 'immersive-world-v1' || source?.world) {
    return buildImmersiveWorldBriefFacts({ source, mappings });
  }

  const scene = asObject(source.scene);
  const sceneAuthoring = asObject(scene.sceneAuthoring);
  const artisticIntent = asObject(sceneAuthoring.artisticIntent);
  const expression = asObject(scene.expression);
  const palette = buildPaletteFacts(scene.palette);
  const keyParts = buildScenePartFacts(scene.elements);
  const modules = buildModuleFacts(scene.customModuleReport);
  const translationTrace = buildTranslationTraceFacts(mappings);

  return {
    kind: 'legacy-scene',
    image: normalizedOptionalText(artisticIntent.statement),
    arc: normalizedOptionalText(artisticIntent.emotionalArc),
    composition: normalizedOptionalText(artisticIntent.compositionLogic),
    motif: normalizedOptionalText(artisticIntent.motif) || normalizedOptionalText(scene.motif),
    palette,
    paletteLabel: palette.length ? palette.map((entry) => `${entry.label} ${entry.value}`).join(' · ') : null,
    keyParts,
    keyPartsLabel: keyParts.length ? keyParts.map((part) => part.label).join(' · ') : null,
    expression: {
      tension: compactMetricOptional(expression.tension),
      structure: compactMetricOptional(expression.structure),
      motion: compactMetricOptional(expression.motion),
      urgency: compactMetricOptional(expression.urgency),
      contrast: compactMetricOptional(expression.contrast)
    },
    modules,
    modulesLabel: modules.length ? modules.join(', ') : null,
    translationTrace,
    translationTraceLabel: translationTrace.length ? translationTrace.join(' | ') : null,
    available: Boolean(
      artisticIntent.statement
      || artisticIntent.emotionalArc
      || artisticIntent.compositionLogic
      || artisticIntent.motif
      || scene.motif
      || palette.length
      || keyParts.length
      || modules.length
      || translationTrace.length
      || Object.values(expression).some((value) => Number.isFinite(Number(value)))
    )
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
  const artworkTitle = normalizedText(source.title, 'Untitled piece');
  const artist = normalizedText(inspiration.artist, 'Unknown artist');
  const date = normalizedText(source.date, 'Unknown date');
  const headline = normalizedText(news.title, artworkTitle);

  return {
    title: headline,
    artworkTitle,
    artist,
    date,
    headline,
    source: sourceLabel(news.source),
    subtitle: `${artworkTitle} · ${artist} influence · ${sourceLabel(news.source)} headline · ${date}`
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
      label: articleAvailable ? 'Open article' : null
    },
    artist: {
      items: artistLinkFacts,
      fallbackLabel: null
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
    .map((mapping) => normalizedPublicDecisionText(mapping?.visualDecision))
    .filter(Boolean)
    .join(' | ') || null;
  const styleCardLabel = Object.values(styleCard)
    .map((value) => normalizedText(value))
    .filter(Boolean)
    .join(' · ') || 'default';

  return {
    legacyIntent,
    signal: normalizedOptionalText(intent.signal),
    emotion: normalizedOptionalText(intent.emotion),
    tension: normalizedOptionalText(intent.tension),
    balance: normalizedOptionalText(intent.balance),
    motion: normalizedOptionalText(intent.motion),
    styleCard: styleCardLabel === 'default' ? null : styleCardLabel,
    selectionRationale: normalizedOptionalText(selection.whyHeadline),
    signalTerms: priorityTerms,
    signalTermsLabel: priorityTerms.length ? priorityTerms.join(', ') : null,
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

  const breakdownFacts = Object.entries(breakdown).map(([label, value]) => ({
    label,
    value: optionalNumericLabel(value)
  })).filter((entry) => entry.value);
  const score = optionalNumericLabel(quality.score, { suffix: ' / 100' });
  const heuristicScore = optionalNumericLabel(heuristic.score);
  const feedbackCalibratedScore = optionalNumericLabel(quality.score);
  const summary = normalizedOptionalText(firstPresent(quality.summary, rationale.qualitySummary));
  const rendererNote = sceneInitError?.message ? `Renderer note: ${sceneInitError.message}` : null;

  return {
    available: Boolean(score || heuristicScore || feedbackCalibratedScore || breakdownFacts.length || summary || rendererNote),
    score,
    heuristicScore,
    feedbackCalibratedScore,
    breakdown: breakdownFacts,
    alignment: {
      total: optionalLabelValue(alignment.totalAlign),
      title: optionalLabelValue(alignmentComponents.title?.score),
      style: optionalLabelValue(alignmentComponents.style?.score),
      emotional: optionalLabelValue(alignmentComponents.emotional?.score)
    },
    calibration: {
      sampleCount: optionalLabelValue(calibration.sampleCount),
      trustWeight: optionalLabelValue(calibration.trustWeight)
    },
    summary,
    rendererNote
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

export function buildArchiveCardPresentationFacts(item = {}, options = {}) {
  const source = asObject(item);
  const image = asObject(source.image);
  const thumbnailSrc = normalizedTrustedRelativeJpeg(source.thumbnailJpeg || image.thumbnailJpeg, options);
  const title = normalizedText(source.title, 'Untitled piece');
  const artist = normalizedText(source.artist, 'Unknown artist');
  return {
    file: normalizedText(source.file),
    date: normalizedText(source.date, 'Unknown date'),
    source: sourceLabel(source.source),
    title,
    newsTitle: normalizedText(source.newsTitle, 'headline unavailable'),
    artist,
    thumbnail: thumbnailSrc ? {
      src: thumbnailSrc,
      altText: normalizedText(image.altText, `${title} by ${artist}.`)
    } : null
  };
}

export function buildGalleryCardPresentationFacts(item = {}, { activeFile = null, ...options } = {}) {
  const facts = buildArchiveCardPresentationFacts(item, options);
  const active = Boolean(facts.file && facts.file === activeFile);
  return {
    ...facts,
    active,
    ariaCurrent: active ? 'true' : 'false'
  };
}

export function getGalleryPresentationItems(manifest = {}) {
  const items = Array.isArray(manifest?.items) ? manifest.items : [];
  return items.slice().reverse();
}

export function buildGalleryPresentationFacts(manifest = {}, { activeFile = null, ...options } = {}) {
  return {
    cards: getGalleryPresentationItems(manifest)
      .map((item) => buildGalleryCardPresentationFacts(item, { activeFile, ...options }))
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
  const compactArtist = artist.length > 22 ? `${artist.slice(0, 21)}…` : artist;
  const metadataLabel = `${date} · ${compact ? compactArtist : artist}`;

  if (!compact) {
    return {
      label: fullLabel,
      metadataLabel,
      titleLabel: title,
      fullLabel,
      actionLabel: `Open artwork gallery, current artwork: ${fullLabel}`
    };
  }

  return {
    label: metadataLabel,
    metadataLabel,
    titleLabel: title,
    fullLabel,
    actionLabel: `Open artwork gallery, current artwork: ${fullLabel}`
  };
}

export function buildGalleryTriggerPresentationFacts(item = {}, { compact = true } = {}) {
  if (!item || !Object.keys(asObject(item)).length) {
    return {
      label: 'Open gallery',
      metadataLabel: 'Artwork archive',
      titleLabel: 'Open gallery',
      fullLabel: 'Open artwork gallery',
      actionLabel: 'Open artwork gallery'
    };
  }

  return buildQuickPickerPresentationFacts(item, { compact });
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
    galleryTriggerDisabled: loading,
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
  const manifestItems = Array.isArray(manifest?.items) ? manifest.items : [];
  const activeFile = manifestItems[activeIndex]?.file || null;

  return {
    ...artworkFacts,
    gallery: buildGalleryPresentationFacts(manifest, { activeFile }),
    archive: {
      count: buildArchiveCountPresentationFacts(renderedArchiveCount, manifest),
      cards: manifestItems.map((item) => buildArchiveCardPresentationFacts(item)),
      quickPicker: buildQuickPickerOptionsPresentationFacts(manifest, { compact: compactQuickPicker })
    },
    loading: buildLoadingPresentationFacts({ isLoading, manifest, activeIndex }),
    status: buildStatusPresentationFacts(statusMessage, statusLevel),
    fallback: buildFallbackPresentationFacts(fallbackMessage, { showRetry })
  };
}
