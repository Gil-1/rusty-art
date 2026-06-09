import {
  WEBGPU_MATERIAL_FACTORY_CATEGORIES,
  listWebGPUNativeHelperDescriptors,
  listWebGPUMaterialFactoryDescriptors
} from './webgpu-material-factory-catalog.js';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function compactText(value, maxLen = 220) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, maxLen) : null;
}

function normalizeArray(values = []) {
  if (!Array.isArray(values)) return [];
  return values.flatMap((value) => {
    if (Array.isArray(value)) return normalizeArray(value);
    if (isObject(value)) return Object.values(value).map((entry) => compactText(entry)).filter(Boolean);
    const text = compactText(value);
    return text ? [text] : [];
  });
}

function clamp01(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(1, numeric));
}

const MATERIAL_RULES = Object.freeze([
  {
    material: 'flat-color',
    runtimeMaterial: 'flat-basic',
    support: 'supported',
    tokens: ['flat color', 'flat-colour', 'flat geometry', 'solid color', 'solid-colour', 'hard-edged color', 'hard edged color'],
    surface: { flatness: 1 }
  },
  {
    material: 'paper',
    runtimeMaterial: 'procedural-paper-fiber',
    support: 'supported',
    tokens: ['paper', 'parchment', 'rag paper', 'handmade paper', 'fibrous'],
    surface: { grain: 0.58, wash: 0.22, roughness: 0.62 }
  },
  {
    material: 'ink',
    runtimeMaterial: 'procedural-ink-variation',
    support: 'supported',
    tokens: ['ink', 'inking', 'inked', 'sumi', 'india ink'],
    surface: { inkVariation: 0.72, opacityLayering: 0.34, roughness: 0.3 }
  },
  {
    material: 'watercolor-wash',
    runtimeMaterial: 'procedural-wash',
    support: 'supported',
    tokens: ['watercolor', 'watercolour', 'wash', 'wet wash', 'bleed', 'bloom'],
    surface: { wash: 0.76, stain: 0.42, opacityLayering: 0.5 }
  },
  {
    material: 'graphite',
    runtimeMaterial: 'procedural-graphite-grain',
    support: 'supported',
    tokens: ['graphite', 'pencil', 'charcoal', 'dry mark'],
    surface: { grain: 0.72, roughness: 0.68, erasure: 0.2 }
  },
  {
    material: 'erasure',
    runtimeMaterial: 'procedural-erasure-mask',
    support: 'supported',
    tokens: ['erase', 'erasure', 'scrape', 'scraped', 'abraded', 'rubbed out'],
    surface: { erasure: 0.66, roughness: 0.48, opacityLayering: 0.38 }
  },
  {
    material: 'stain',
    runtimeMaterial: 'procedural-stain',
    support: 'supported',
    tokens: ['stain', 'stained', 'soak', 'soaked', 'bleached', 'tide mark'],
    surface: { stain: 0.72, wash: 0.44, opacityLayering: 0.34 }
  },
  {
    material: 'grain',
    runtimeMaterial: 'procedural-grain',
    support: 'supported',
    tokens: ['grain', 'granular', 'noise', 'speckle', 'speckled', 'gritty'],
    surface: { grain: 0.7, roughness: 0.36 }
  },
  {
    material: 'printed-transfer',
    runtimeMaterial: 'procedural-print-transfer',
    support: 'supported',
    tokens: ['printed transfer', 'print transfer', 'newsprint', 'xerox', 'screenprint', 'halftone', 'transfer'],
    surface: { grain: 0.38, inkVariation: 0.42, opacityLayering: 0.42 }
  },
  {
    material: 'glow',
    runtimeMaterial: 'emissive-glow',
    support: 'supported',
    tokens: ['glow', 'glowing', 'emissive', 'neon', 'luminous'],
    surface: { glow: 0.72 }
  },
  {
    material: 'glass',
    runtimeMaterial: 'transparent-glass',
    support: 'supported',
    tokens: ['glass', 'transparent pane', 'translucent glass', 'glazing'],
    surface: { opacityLayering: 0.52, roughness: 0.12 }
  },
  {
    material: 'metal',
    runtimeMaterial: 'metallic-roughness',
    support: 'supported',
    tokens: ['metal', 'metallic', 'steel', 'aluminium', 'aluminum', 'copper', 'brass'],
    surface: { roughness: 0.32, metalness: 0.78 }
  },
  {
    material: 'oil-paint',
    runtimeMaterial: 'procedural-paint-surface',
    support: 'downgraded',
    tokens: ['oil paint', 'impasto', 'thick paint', 'heavy paint'],
    surface: { grain: 0.34, roughness: 0.58, opacityLayering: 0.32 },
    reason: 'three-dimensional impasto is downgraded to procedural paint surface variation'
  },
  {
    material: 'gold-leaf',
    runtimeMaterial: 'metallic-roughness',
    support: 'downgraded',
    tokens: ['gold leaf', 'silver leaf', 'gilded'],
    surface: { roughness: 0.22, metalness: 0.7, glow: 0.22 },
    reason: 'leaf material is downgraded to metallic roughness and glow'
  },
  {
    material: 'living-organic',
    runtimeMaterial: null,
    support: 'unsupported',
    tokens: ['living moss', 'live plant', 'wet clay that deforms', 'bioluminescent organism'],
    surface: {},
    reason: 'organic or physically changing material is not executable in the static WebGL material path'
  }
]);

const DIRECT_MATERIALS = new Map(
  MATERIAL_RULES.map((rule) => [rule.material, rule])
);

export function buildMaterialObligationWebGPUGuidance() {
  const factoryIds = listWebGPUMaterialFactoryDescriptors()
    .filter((entry) => entry.category !== WEBGPU_MATERIAL_FACTORY_CATEGORIES.POST_COLOR_TRANSFORM)
    .map((entry) => entry.id);
  const helperApis = listWebGPUNativeHelperDescriptors()
    .map((entry) => entry.api);
  return [
    'For WebGPU project scenes, satisfy material obligations through source-declared project WebGPU material factories, approved WebGPU-native helpers, standard material/vertex-color geometry, or declarative DSL material surfaces.',
    'Allowed material factory and helper catalogs are options, not evidence; prove generated-module factory/helper use with actual helper calls, source userData.materialFactoryId, usedMaterialFactories, usedMaterialSurfaces, or compact returned userData.webgpuNativeFeature facts.',
    'Do not satisfy WebGPU material obligations with raw GLSL ShaderMaterial, RawShaderMaterial, shader overrides, legacy GLSL post passes, or custom JS shader surfaces.',
    `Available project WebGPU material factories: ${factoryIds.join(', ')}.`,
    `Available project WebGPU native helper APIs: ${helperApis.join(', ')}.`
  ];
}

function collectSourceText(source) {
  if (!isObject(source)) return normalizeArray([source]);
  return normalizeArray([
    source.material,
    source.materialIntent,
    source.materialBrief,
    source.surface,
    source.surfaceBehavior,
    source.surfaceIntent,
    source.expectedRead,
    source.scenePurpose,
    source.description,
    source.notes,
    source.techniques,
    source.terms,
    source.type,
    source.kind,
    source.intent
  ]);
}

function readExplicitMaterial(source) {
  if (!isObject(source)) return null;
  const candidate = compactText(source.material || source.materialType || source.type || source.kind, 80);
  if (!candidate) return null;
  const normalized = candidate.toLowerCase().replace(/[_\s]+/g, '-');
  return DIRECT_MATERIALS.get(normalized) || null;
}

function mergeSurface(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    target[key] = Math.max(clamp01(target[key], 0), clamp01(value, 0));
  }
  return target;
}

function obligationStatus(obligations = []) {
  if (!obligations.length) return 'none';
  if (obligations.some((entry) => entry.support === 'unsupported')) return 'unsupported';
  if (obligations.some((entry) => entry.support === 'downgraded')) return 'downgraded';
  return 'supported';
}

function matchRulesForSource(source) {
  const sourceText = collectSourceText(source);
  const text = sourceText.join(' ').toLowerCase();
  const explicit = readExplicitMaterial(source);
  const matches = new Map();
  if (explicit) matches.set(explicit.material, { rule: explicit, sourceTerm: explicit.material });
  for (const rule of MATERIAL_RULES) {
    if (rule.tokens.some((token) => text.includes(token))) {
      matches.set(rule.material, { rule, sourceTerm: rule.tokens.find((token) => text.includes(token)) || rule.material });
    }
  }
  return [...matches.values()];
}

function buildObligation({ match, sourceIndex, obligationIndex }) {
  const { rule, sourceTerm } = match;
  const diagnostics = [];
  if (rule.support === 'downgraded') {
    diagnostics.push({
      code: 'material-obligation-downgraded',
      severity: 'warning',
      material: rule.material,
      sourceTerm,
      runtimeMaterial: rule.runtimeMaterial,
      reason: rule.reason || 'material has been downgraded to an executable runtime approximation'
    });
  } else if (rule.support === 'unsupported') {
    diagnostics.push({
      code: 'material-obligation-unsupported',
      severity: 'error',
      material: rule.material,
      sourceTerm,
      runtimeMaterial: null,
      reason: rule.reason || 'material is not executable in this runtime'
    });
  }

  return {
    id: `mat-${String(sourceIndex + 1).padStart(2, '0')}-${String(obligationIndex + 1).padStart(2, '0')}-${rule.material}`,
    material: rule.material,
    sourceTerm,
    support: rule.support,
    runtimeMaterial: rule.runtimeMaterial,
    surface: { ...(rule.surface || {}) },
    diagnostics
  };
}

export function normalizeMaterialObligations({ sources = [], defaultMaterial = null } = {}) {
  const sourceList = Array.isArray(sources) ? sources : [sources];
  const obligations = [];
  sourceList.forEach((source, sourceIndex) => {
    const matches = matchRulesForSource(source);
    matches.forEach((match) => {
      obligations.push(buildObligation({ match, sourceIndex, obligationIndex: obligations.length }));
    });
  });

  if (!obligations.length && defaultMaterial) {
    const rule = DIRECT_MATERIALS.get(String(defaultMaterial).toLowerCase().replace(/[_\s]+/g, '-'));
    if (rule) obligations.push(buildObligation({ match: { rule, sourceTerm: rule.material }, sourceIndex: 0, obligationIndex: 0 }));
  }

  const diagnostics = obligations.flatMap((entry) => entry.diagnostics || []);
  const executable = obligations.filter((entry) => entry.support !== 'unsupported');
  const surface = executable.reduce((acc, entry) => mergeSurface(acc, entry.surface), {});
  const materialKinds = [...new Set(obligations.map((entry) => entry.material))];
  const runtimeMaterials = [...new Set(executable.map((entry) => entry.runtimeMaterial).filter(Boolean))];
  const status = obligationStatus(obligations);
  const requiresRichSurface = Object.entries(surface).some(([key, value]) => key !== 'flatness' && clamp01(value, 0) > 0);

  return {
    version: 1,
    status,
    guidance: buildMaterialObligationWebGPUGuidance(),
    obligations,
    diagnostics,
    aggregate: {
      materialKinds,
      runtimeMaterials,
      surface,
      requiresRichSurface,
      flatColor: obligations.some((entry) => entry.material === 'flat-color')
    }
  };
}

export function normalizeMaterialSurfaceFacts(source = {}, fallback = {}) {
  const obligations = normalizeMaterialObligations({ sources: [source] });
  return {
    materialObligations: obligations,
    webgpuGuidance: obligations.guidance,
    runtimeMaterial: obligations.aggregate.runtimeMaterials[0] || (obligations.aggregate.flatColor ? 'flat-basic' : null),
    surface: {
      ...(isObject(fallback) ? fallback : {}),
      ...(obligations.aggregate.surface || {})
    },
    requiresRichSurface: obligations.aggregate.requiresRichSurface
  };
}
