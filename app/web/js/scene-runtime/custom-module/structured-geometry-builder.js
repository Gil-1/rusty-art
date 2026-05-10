import * as THREE from 'three';
import { hslStringToColor } from '../../primitives/utils.js';
import { clamp } from './runtime-utils.js';
import { buildStructuredGeometryPrimitiveObject } from './structured-geometry-registry.js';
import {
  buildStructuredGeometryExecutionFacts,
  NO_DSL_VALUE,
  resolveStructuredBoolean,
  resolveStructuredColorValue,
  resolveStructuredDslReference,
  resolveStructuredDslValue,
  resolveStructuredNumber,
  resolveStructuredPalette,
  resolveStructuredTransformFacts,
  resolveStructuredVector3
} from './structured-geometry-facts.js';

export {
  buildStructuredGeometryExecutionFacts,
  NO_DSL_VALUE,
  resolveStructuredBoolean,
  resolveStructuredDslReference,
  resolveStructuredDslValue,
  resolveStructuredNumber,
  resolveStructuredPalette,
  resolveStructuredVector3
};

export function resolveStructuredDslColor(expr, context = {}, fallback = '#ffffff') {
  if (expr instanceof THREE.Color) return expr.clone();
  const resolved = resolveStructuredColorValue(expr, context, fallback);
  if (resolved instanceof THREE.Color) return resolved.clone();
  if (Array.isArray(resolved) && resolved.length === 3 && resolved.every(Number.isFinite)) {
    return new THREE.Color(resolved[0], resolved[1], resolved[2]);
  }
  return hslStringToColor(resolved, fallback);
}

/** @param {any} options */
export function createStructuredFlatMaterial({ color, opacity = 1, wireframe = false } = {}) {
  const normalizedOpacity = clamp(opacity, 0.01, 1, 1);
  return new THREE.MeshBasicMaterial({
    color,
    transparent: normalizedOpacity < 0.999,
    opacity: normalizedOpacity,
    wireframe,
    side: THREE.DoubleSide,
    depthWrite: normalizedOpacity >= 0.999,
    blending: THREE.NormalBlending,
  });
}

function hasRichSurface(surface = {}) {
  return Object.entries(surface || {}).some(([key, value]) => key !== 'flatness' && Number(value) > 0);
}

export function createStructuredRichSurfaceMaterial({ color, opacity = 1, wireframe = false, surface = {}, materialObligations = null, runtimeMaterial = null } = {}) {
  if (!hasRichSurface(surface) || wireframe === true) {
    return createStructuredFlatMaterial({ color, opacity, wireframe });
  }
  const normalizedOpacity = clamp(opacity, 0.01, 1, 1);
  const uniforms = {
    uColor: { value: color instanceof THREE.Color ? color.clone() : new THREE.Color(color || '#ffffff') },
    uOpacity: { value: normalizedOpacity },
    uGrain: { value: clamp(surface.grain, 0, 1, 0) },
    uWash: { value: clamp(surface.wash, 0, 1, 0) },
    uInkVariation: { value: clamp(surface.inkVariation, 0, 1, 0) },
    uOpacityLayering: { value: clamp(surface.opacityLayering, 0, 1, 0) },
    uErasure: { value: clamp(surface.erasure, 0, 1, 0) },
    uStain: { value: clamp(surface.stain, 0, 1, 0) },
    uRoughness: { value: clamp(surface.roughness, 0, 1, 0) },
    uGlow: { value: clamp(surface.glow, 0, 1, 0) },
    uMetalness: { value: clamp(surface.metalness, 0, 1, 0) }
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uGrain;
      uniform float uWash;
      uniform float uInkVariation;
      uniform float uOpacityLayering;
      uniform float uErasure;
      uniform float uStain;
      uniform float uRoughness;
      uniform float uGlow;
      uniform float uMetalness;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        vec2 uv = vUv;
        float grain = hash(floor(uv * 190.0));
        float wash = sin((uv.x * 5.0) + (uv.y * 8.0) + hash(floor(uv * 17.0)) * 2.6) * 0.5 + 0.5;
        float stain = smoothstep(0.58, 0.04, length((uv - vec2(0.52, 0.48)) * vec2(0.82, 1.18)));
        float erasure = smoothstep(0.72, 0.98, hash(floor((uv + vec2(0.13, 0.31)) * 54.0)));
        float ink = sin(uv.y * 95.0 + grain * 5.0) * 0.5 + 0.5;
        float variation =
          (grain - 0.5) * uGrain * 0.34 +
          (wash - 0.5) * uWash * 0.28 +
          (ink - 0.5) * uInkVariation * 0.24 +
          stain * uStain * 0.2 -
          erasure * uErasure * 0.26;
        vec3 color = uColor * (1.0 + variation);
        color = mix(color, color + vec3(0.08, 0.065, 0.04), uRoughness * grain * 0.45);
        color = mix(color, vec3(max(max(color.r, color.g), color.b)), uMetalness * 0.22);
        color += vec3(uGlow * 0.18);
        float alpha = uOpacity * (1.0 - erasure * uErasure * 0.34);
        alpha *= mix(1.0, 0.72 + (wash * 0.28), uOpacityLayering);
        gl_FragColor = vec4(clamp(color, 0.0, 1.5), clamp(alpha, 0.01, 1.0));
      }
    `,
    transparent: true,
    opacity: normalizedOpacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.NormalBlending
  });
  material.userData = {
    ...(material.userData || {}),
    runtimeMaterial,
    materialObligations,
    surfaceVariation: { ...surface },
    materialRichSurface: true
  };
  return material;
}

export function createEllipseShapeGeometry(width = 1, height = 1, segments = 96) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, Math.max(0.001, width / 2), Math.max(0.001, height / 2), 0, Math.PI * 2, false, 0);
  return new THREE.ShapeGeometry(shape, Math.max(16, Math.round(segments)));
}

export function createEllipseRingGeometry(width = 1, height = 1, lineWidth = 0.08, segments = 96) {
  const outerRx = Math.max(0.001, width / 2);
  const outerRy = Math.max(0.001, height / 2);
  const innerRx = Math.max(0.001, outerRx - Math.max(0.001, lineWidth));
  const innerRy = Math.max(0.001, outerRy - Math.max(0.001, lineWidth));
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, outerRx, outerRy, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, innerRx, innerRy, 0, Math.PI * 2, true, 0);
  shape.holes.push(hole);
  return new THREE.ShapeGeometry(shape, Math.max(16, Math.round(segments)));
}

export function applyStructuredNodeTransform(target, node = {}, context = {}) {
  applyStructuredTransformFacts(target, resolveStructuredTransformFacts(node, context));
}

function applyStructuredTransformFacts(target, transform = {}) {
  const position = Array.isArray(transform.position) ? transform.position : [0, 0, 0];
  const rotation = Array.isArray(transform.rotation) ? transform.rotation : [0, 0, 0];
  const scale = Array.isArray(transform.scale) ? transform.scale : [1, 1, 1];
  target.position.set(position[0], position[1], position[2]);
  target.rotation.set(rotation[0], rotation[1], rotation[2]);
  target.scale.set(scale[0], scale[1], scale[2]);
}

function createFactMaterial(material = {}, context = {}) {
  return createStructuredRichSurfaceMaterial({
    color: resolveStructuredDslColor(material.color, context, '#ffffff'),
    opacity: material.opacity,
    wireframe: material.wireframe,
    surface: material.surface,
    runtimeMaterial: material.runtimeMaterial,
    materialObligations: material.materialObligations
  });
}

export function buildStructuredGeometryObjectFromFacts(facts = {}, context = {}) {
  return buildStructuredGeometryPrimitiveObject({
    facts,
    context,
    helpers: {
      applyTransform: applyStructuredTransformFacts,
      buildChildObject: buildStructuredGeometryObjectFromFacts,
      createGroup: () => new THREE.Group(),
      createEllipseRingObject(ringFact = {}, materialContext = {}) {
        const ring = new THREE.Mesh(
          createEllipseRingGeometry(ringFact.width, ringFact.height, ringFact.lineWidth, ringFact.segments),
          createFactMaterial(ringFact.material, materialContext)
        );
        ring.rotation.z = ringFact.rotationZ;
        ring.position.z = ringFact.positionZ;
        return ring;
      },
      createRectObject(rectFact = {}, materialContext = {}) {
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(rectFact.width, rectFact.height, 1, 1),
          createFactMaterial(rectFact.material, materialContext)
        );
        const position = Array.isArray(rectFact.position) ? rectFact.position : [0, 0, 0];
        mesh.position.set(position[0], position[1], position[2]);
        return mesh;
      },
      createTubePathObject(tubeFacts = {}, materialContext = {}) {
        const geometry = tubeFacts.geometry || {};
        const points = (Array.isArray(geometry.path) ? geometry.path : []).map((entry) => new THREE.Vector3(entry[0], entry[1], entry[2]));
        const curvePoints = points.length >= 2 ? points : [new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(0.5, 0, 0)];
        const curve = new THREE.CatmullRomCurve3(curvePoints, geometry.closed === true);
        const mesh = new THREE.Mesh(
          new THREE.TubeGeometry(curve, Math.max(32, points.length * 24), geometry.radius, geometry.radialSegments, geometry.closed === true),
          createFactMaterial(geometry.material, materialContext)
        );
        applyStructuredTransformFacts(mesh, tubeFacts.transform);
        return mesh;
      },
      createEllipseRingSingleObject(ellipseRingFacts = {}, materialContext = {}) {
        const geometry = ellipseRingFacts.geometry || {};
        const mesh = new THREE.Mesh(
          createEllipseRingGeometry(geometry.width, geometry.height, geometry.lineWidth, 128),
          createFactMaterial(geometry.material, materialContext)
        );
        applyStructuredTransformFacts(mesh, ellipseRingFacts.transform);
        return mesh;
      },
      createPlaneRectObject(rectFacts = {}, materialContext = {}) {
        const geometry = rectFacts.geometry || {};
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(geometry.width, geometry.height, 1, 1),
          createFactMaterial(geometry.material, materialContext)
        );
        applyStructuredTransformFacts(mesh, rectFacts.transform);
        return mesh;
      },
      createEllipseObject(ellipseFacts = {}, materialContext = {}) {
        const geometry = ellipseFacts.geometry || {};
        const mesh = new THREE.Mesh(
          createEllipseShapeGeometry(geometry.width, geometry.height, 128),
          createFactMaterial(geometry.material, materialContext)
        );
        applyStructuredTransformFacts(mesh, ellipseFacts.transform);
        return mesh;
      }
    }
  });
}

export function buildStructuredGeometryNode(node = {}, context = {}) {
  return buildStructuredGeometryObjectFromFacts(
    buildStructuredGeometryExecutionFacts(node, context),
    context
  );
}
