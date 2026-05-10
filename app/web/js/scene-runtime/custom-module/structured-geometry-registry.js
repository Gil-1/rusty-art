function materialFacts({ color, opacity, wireframe = false, material = null } = {}) {
  return {
    color,
    opacity,
    wireframe: wireframe === true,
    runtimeMaterial: material?.runtimeMaterial || null,
    surface: material?.surface || {},
    materialObligations: material?.materialObligations || null
  };
}

function lerp(a, b, t) {
  return a + ((b - a) * t);
}

function prepareFactContext(context = {}, helpers = {}) {
  const materialSpec = helpers.isObject?.(context.dsl?.material) ? context.dsl.material : {};
  const palette = Array.isArray(context.materialPalette) && context.materialPalette.length
    ? context.materialPalette
    : helpers.resolveStructuredPalette(materialSpec, context);
  return {
    materialSpec,
    palette,
    childContext: { ...context, materialPalette: palette }
  };
}

function resolveMaterialFacts(helpers = {}, materialSpec = {}, context = {}) {
  return typeof helpers.resolveMaterialFacts === 'function'
    ? helpers.resolveMaterialFacts(materialSpec, context)
    : { runtimeMaterial: null, surface: {}, materialObligations: null };
}

const primitiveDefinitions = {
  group: {
    buildFacts({ type, node, context, transform, helpers }) {
      return {
        type,
        geometry: { kind: 'group' },
        transform,
        children: (Array.isArray(node.children) ? node.children : [])
          .map((child) => helpers.buildChildFacts(child, context))
      };
    },
    buildObject({ facts, context, helpers }) {
      const group = helpers.createGroup();
      for (const child of Array.isArray(facts.children) ? facts.children : []) {
        group.add(helpers.buildChildObject(child, context));
      }
      helpers.applyTransform(group, facts.transform);
      return group;
    }
  },
  'ellipse-rings': {
    buildFacts({ type, node, context, transform, helpers }) {
      const { materialSpec, palette, childContext } = prepareFactContext(context, helpers);
      const ringCount = Math.max(1, Math.round(helpers.resolveNumber(node.ringsExpr ?? node.rings, childContext, 4)));
      const width = helpers.clamp(helpers.resolveNumber(node.widthExpr ?? node.width, childContext, 1.2), 0.05, 40, 1.2);
      const height = helpers.clamp(helpers.resolveNumber(node.heightExpr ?? node.height, childContext, 1.8), 0.05, 40, 1.8);
      const stroke = helpers.clamp(helpers.resolveNumber(node.strokeExpr ?? node.stroke ?? node.lineWidth, childContext, 0.08), 0.005, 2, 0.08);
      const rotationZ = helpers.resolveNumber(node.rotationExpr ?? node.rotationZ ?? node.rotation, childContext, 0);
      const segments = Math.max(24, Math.round(helpers.resolveNumber(node.segments, childContext, 128)));
      const opacity = helpers.clamp(helpers.resolveNumber(materialSpec.opacity, childContext, 0.92), 0.02, 1, 0.92);
      const material = resolveMaterialFacts(helpers, materialSpec, childContext);
      const rings = [];

      for (let i = 0; i < ringCount; i += 1) {
        const ratio = Math.max(0.18, 1 - (i * 0.18));
        rings.push({
          width: width * ratio,
          height: height * ratio,
          lineWidth: stroke,
          segments,
          rotationZ,
          positionZ: Number(node.z || 0) + (i * 0.01),
          material: materialFacts({
            color: helpers.resolveColorValue(palette[i] ?? palette[palette.length - 1] ?? '#ffffff', childContext, '#ffffff'),
            opacity,
            material
          })
        });
      }

      return { type, geometry: { kind: 'ellipse-rings', rings }, transform, materialPalette: palette };
    },
    buildObject({ facts, context, helpers }) {
      const group = helpers.createGroup();
      for (const ringFact of Array.isArray(facts.geometry?.rings) ? facts.geometry.rings : []) {
        group.add(helpers.createEllipseRingObject(ringFact, context));
      }
      helpers.applyTransform(group, facts.transform);
      return group;
    }
  },
  'stacked-rects': {
    buildFacts({ type, node, context, transform, helpers }) {
      const { materialSpec, palette, childContext } = prepareFactContext(context, helpers);
      const count = Math.max(1, Math.round(helpers.resolveNumber(node.countExpr ?? node.count, childContext, 9)));
      const width = helpers.clamp(helpers.resolveNumber(node.widthExpr ?? node.width, childContext, 2), 0.01, 40, 2);
      const height = helpers.clamp(helpers.resolveNumber(node.heightExpr ?? node.height, childContext, 0.08), 0.005, 4, 0.08);
      const [yMin, yMax] = Array.isArray(node.yRange) && node.yRange.length >= 2
        ? [helpers.resolveNumber(node.yRange[0], childContext, -1), helpers.resolveNumber(node.yRange[1], childContext, 1)]
        : [-1, 1];
      const centerBias = helpers.clamp(helpers.resolveNumber(node.centerBiasExpr ?? node.centerBias, childContext, 1), 0.2, 2.2, 1);
      const opacity = helpers.clamp(helpers.resolveNumber(materialSpec.opacity, childContext, 0.78), 0.02, 1, 0.78);
      const color = helpers.resolveColorValue(node.color ?? materialSpec.color ?? palette[0] ?? '#ffffff', childContext, '#ffffff');
      const material = resolveMaterialFacts(helpers, materialSpec, childContext);
      const rects = [];

      for (let i = 0; i < count; i += 1) {
        const t = count === 1 ? 0.5 : (i / (count - 1));
        const normalized = (t * 2) - 1;
        const weighted = Math.sign(normalized) * Math.pow(Math.abs(normalized), centerBias);
        rects.push({
          width,
          height,
          position: [0, lerp(yMin, yMax, (weighted + 1) / 2), i * 0.001],
          material: materialFacts({ color, opacity, material })
        });
      }

      return { type, geometry: { kind: 'stacked-rects', rects }, transform, materialPalette: palette };
    },
    buildObject({ facts, context, helpers }) {
      const group = helpers.createGroup();
      for (const rectFact of Array.isArray(facts.geometry?.rects) ? facts.geometry.rects : []) {
        group.add(helpers.createRectObject(rectFact, context));
      }
      helpers.applyTransform(group, facts.transform);
      return group;
    }
  },
  'tube-path': {
    buildFacts({ type, node, context, transform, helpers }) {
      const { materialSpec, palette, childContext } = prepareFactContext(context, helpers);
      const path = (Array.isArray(node.path) ? node.path : [])
        .map((entry) => helpers.resolveVector3(entry, childContext, [0, 0, 0]));
      const closed = helpers.resolveBoolean(node.closed, childContext, false);
      const material = resolveMaterialFacts(helpers, materialSpec, childContext);
      return {
        type,
        geometry: {
          kind: 'tube-path',
          path,
          closed,
          radialSegments: Math.max(3, Math.round(helpers.resolveNumber(node.radialSegments, childContext, 12))),
          radius: helpers.clamp(helpers.resolveNumber(node.radiusExpr ?? node.radius ?? node.thickness, childContext, 0.08), 0.005, 2, 0.08),
          material: materialFacts({
            color: helpers.resolveColorValue(node.color ?? materialSpec.color ?? palette[0] ?? '#ffffff', childContext, '#ffffff'),
            opacity: helpers.clamp(helpers.resolveNumber(materialSpec.opacity, childContext, 0.84), 0.02, 1, 0.84),
            material
          })
        },
        transform,
        materialPalette: palette
      };
    },
    buildObject({ facts, context, helpers }) {
      return helpers.createTubePathObject(facts, context);
    }
  },
  'ellipse-ring': {
    buildFacts({ type, node, context, transform, helpers }) {
      const { materialSpec, palette, childContext } = prepareFactContext(context, helpers);
      const material = resolveMaterialFacts(helpers, materialSpec, childContext);
      return {
        type,
        geometry: {
          kind: 'ellipse-ring',
          width: helpers.clamp(helpers.resolveNumber(node.width, childContext, 1), 0.01, 40, 1),
          height: helpers.clamp(helpers.resolveNumber(node.height, childContext, 1.4), 0.01, 40, 1.4),
          lineWidth: helpers.clamp(helpers.resolveNumber(node.lineWidth ?? node.stroke ?? node.thickness, childContext, 0.08), 0.005, 2, 0.08),
          material: materialFacts({
            color: helpers.resolveColorValue(node.color ?? materialSpec.color ?? palette[0] ?? '#ffffff', childContext, '#ffffff'),
            opacity: helpers.clamp(helpers.resolveNumber(node.strokeOpacity ?? node.opacity ?? materialSpec.opacity, childContext, 0.9), 0.02, 1, 0.9),
            material
          })
        },
        transform,
        materialPalette: palette
      };
    },
    buildObject({ facts, context, helpers }) {
      return helpers.createEllipseRingSingleObject(facts, context);
    }
  },
  rect: {
    buildFacts({ type, node, context, transform, helpers }) {
      const { materialSpec, palette, childContext } = prepareFactContext(context, helpers);
      const material = resolveMaterialFacts(helpers, materialSpec, childContext);
      return {
        type,
        geometry: {
          kind: 'rect',
          width: helpers.clamp(helpers.resolveNumber(node.width, childContext, 1), 0.01, 40, 1),
          height: helpers.clamp(helpers.resolveNumber(node.height, childContext, 0.1), 0.005, 10, 0.1),
          material: materialFacts({
            color: helpers.resolveColorValue(node.color ?? materialSpec.color ?? palette[0] ?? '#ffffff', childContext, '#ffffff'),
            opacity: helpers.clamp(helpers.resolveNumber(node.opacity ?? materialSpec.opacity, childContext, 0.84), 0.02, 1, 0.84),
            material
          })
        },
        transform,
        materialPalette: palette
      };
    },
    buildObject({ facts, context, helpers }) {
      return helpers.createPlaneRectObject(facts, context);
    }
  },
  ellipse: {
    buildFacts({ type, node, context, transform, helpers }) {
      const { materialSpec, palette, childContext } = prepareFactContext(context, helpers);
      const material = resolveMaterialFacts(helpers, materialSpec, childContext);
      return {
        type,
        geometry: {
          kind: 'ellipse',
          width: helpers.clamp(helpers.resolveNumber(node.width, childContext, 0.4), 0.01, 20, 0.4),
          height: helpers.clamp(helpers.resolveNumber(node.height, childContext, 0.4), 0.01, 20, 0.4),
          material: materialFacts({
            color: helpers.resolveColorValue(node.color ?? materialSpec.color ?? palette[0] ?? '#ffffff', childContext, '#ffffff'),
            opacity: helpers.clamp(helpers.resolveNumber(node.opacity ?? node.fillOpacity ?? materialSpec.opacity, childContext, 0.84), 0.02, 1, 0.84),
            material
          })
        },
        transform,
        materialPalette: palette
      };
    },
    buildObject({ facts, context, helpers }) {
      return helpers.createEllipseObject(facts, context);
    }
  }
};

export const STRUCTURED_GEOMETRY_PRIMITIVE_REGISTRY = Object.freeze(
  Object.fromEntries(Object.entries(primitiveDefinitions).map(([type, definition]) => [type, Object.freeze(definition)]))
);

export const STRUCTURED_GEOMETRY_PRIMITIVE_TYPES = Object.freeze(Object.keys(STRUCTURED_GEOMETRY_PRIMITIVE_REGISTRY));

export function listStructuredGeometryPrimitiveTypes() {
  return STRUCTURED_GEOMETRY_PRIMITIVE_TYPES.slice();
}

export function getStructuredGeometryPrimitiveDefinition(type) {
  return STRUCTURED_GEOMETRY_PRIMITIVE_REGISTRY[type] || STRUCTURED_GEOMETRY_PRIMITIVE_REGISTRY.ellipse;
}

export function buildStructuredGeometryPrimitiveFacts({ type, node = {}, context = {}, transform, helpers = {} } = {}) {
  const definition = getStructuredGeometryPrimitiveDefinition(type);
  return definition.buildFacts({ type, node, context, transform, helpers });
}

export function buildStructuredGeometryPrimitiveObject({ facts = {}, context = {}, helpers = {} } = {}) {
  const definition = getStructuredGeometryPrimitiveDefinition(facts.type || facts.geometry?.kind);
  return definition.buildObject({ facts, context, helpers });
}
