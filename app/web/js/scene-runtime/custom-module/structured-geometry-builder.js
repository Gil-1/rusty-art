import * as THREE from 'three';
import { hslStringToColor } from '../../primitives/utils.js';
import { clamp } from './runtime-utils.js';
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
  return createStructuredFlatMaterial({
    color: resolveStructuredDslColor(material.color, context, '#ffffff'),
    opacity: material.opacity,
    wireframe: material.wireframe
  });
}

export function buildStructuredGeometryObjectFromFacts(facts = {}, context = {}) {
  const geometry = facts.geometry || {};

  if (geometry.kind === 'group') {
    const group = new THREE.Group();
    for (const child of Array.isArray(facts.children) ? facts.children : []) {
      group.add(buildStructuredGeometryObjectFromFacts(child, context));
    }
    applyStructuredTransformFacts(group, facts.transform);
    return group;
  }

  if (geometry.kind === 'ellipse-rings') {
    const group = new THREE.Group();
    for (const ringFact of Array.isArray(geometry.rings) ? geometry.rings : []) {
      const ring = new THREE.Mesh(
        createEllipseRingGeometry(ringFact.width, ringFact.height, ringFact.lineWidth, ringFact.segments),
        createFactMaterial(ringFact.material, context)
      );
      ring.rotation.z = ringFact.rotationZ;
      ring.position.z = ringFact.positionZ;
      group.add(ring);
    }
    applyStructuredTransformFacts(group, facts.transform);
    return group;
  }

  if (geometry.kind === 'stacked-rects') {
    const group = new THREE.Group();
    for (const rectFact of Array.isArray(geometry.rects) ? geometry.rects : []) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(rectFact.width, rectFact.height, 1, 1),
        createFactMaterial(rectFact.material, context)
      );
      const position = Array.isArray(rectFact.position) ? rectFact.position : [0, 0, 0];
      mesh.position.set(position[0], position[1], position[2]);
      group.add(mesh);
    }
    applyStructuredTransformFacts(group, facts.transform);
    return group;
  }

  if (geometry.kind === 'tube-path') {
    const points = (Array.isArray(geometry.path) ? geometry.path : []).map((entry) => new THREE.Vector3(entry[0], entry[1], entry[2]));
    const curvePoints = points.length >= 2 ? points : [new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(0.5, 0, 0)];
    const curve = new THREE.CatmullRomCurve3(curvePoints, geometry.closed === true);
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, Math.max(32, points.length * 24), geometry.radius, geometry.radialSegments, geometry.closed === true),
      createFactMaterial(geometry.material, context)
    );
    applyStructuredTransformFacts(mesh, facts.transform);
    return mesh;
  }

  if (geometry.kind === 'ellipse-ring') {
    const mesh = new THREE.Mesh(
      createEllipseRingGeometry(geometry.width, geometry.height, geometry.lineWidth, 128),
      createFactMaterial(geometry.material, context)
    );
    applyStructuredTransformFacts(mesh, facts.transform);
    return mesh;
  }

  if (geometry.kind === 'rect') {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(geometry.width, geometry.height, 1, 1),
      createFactMaterial(geometry.material, context)
    );
    applyStructuredTransformFacts(mesh, facts.transform);
    return mesh;
  }

  const mesh = new THREE.Mesh(
    createEllipseShapeGeometry(geometry.width, geometry.height, 128),
    createFactMaterial(geometry.material, context)
  );
  applyStructuredTransformFacts(mesh, facts.transform);
  return mesh;
}

export function buildStructuredGeometryNode(node = {}, context = {}) {
  return buildStructuredGeometryObjectFromFacts(
    buildStructuredGeometryExecutionFacts(node, context),
    context
  );
}
