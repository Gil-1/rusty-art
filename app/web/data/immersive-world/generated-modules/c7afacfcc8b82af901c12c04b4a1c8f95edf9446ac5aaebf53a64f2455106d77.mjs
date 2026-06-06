import { createImmersiveWorldPart as createBasePart } from './ea2c26c74913750181fc81ed45cfbb71a11bc5029a91830f3149405a906f4fbf.mjs';

const OVERLAY = {
  "salt": "flow-gpu-detail-restore-v5-mobile-light",
  "renderOrderBase": 118,
  "planeCount": 24,
  "ribbonCount": 74,
  "scratchCount": 80,
  "burstCount": 0,
  "grainCount": 55,
  "fiberCount": 725,
  "fiberOpacity": 0.21,
  "opacity": 1.14,
  "z": -3.4,
  "xMin": -6.6,
  "xMax": 3.4,
  "yMin": -2.7,
  "yMax": 2.6,
  "colors": [
    "#d71920",
    "#e65d1f",
    "#f2a51a",
    "#238e3d",
    "#1d6f73",
    "#164f9d",
    "#e6ddbf"
  ],
  "washes": [
    "#efb399",
    "#f4c8c1",
    "#8bcbd0",
    "#e6ddbf",
    "#d79922"
  ],
  "lineColors": [
    "#d71920",
    "#e65d1f",
    "#164f9d",
    "#238e3d",
    "#60402c"
  ]
};

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hashText(value) {
  let hash = 2166136261;
  const text = String(value || 'gpu-detail');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(context, salt) {
  const utilities = context?.utilities;
  if (utilities && typeof utilities.createSeededRandom === 'function') {
    return utilities.createSeededRandom(OVERLAY.salt, salt);
  }
  let state = (hashText(OVERLAY.salt) ^ hashText(salt)) >>> 0;
  return function next() {
    state = (state + 1831565813) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function choose(random, values) {
  return values[Math.floor(random() * values.length) % values.length];
}

function colorToRgb(color) {
  const hex = String(color || '#ffffff').replace('#', '');
  const expanded = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex;
  const parsed = Number.parseInt(expanded, 16);
  return [
    ((parsed >> 16) & 255) / 255,
    ((parsed >> 8) & 255) / 255,
    (parsed & 255) / 255
  ];
}

function makeMaterial(THREE, owned, color, opacity, name) {
  const material = new THREE.MeshBasicMaterial({
    name,
    color,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: false
  });
  owned.materials.push(material);
  return material;
}

function makeLineMaterial(THREE, owned, color, opacity, name) {
  const material = new THREE.LineBasicMaterial({
    name,
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: false
  });
  owned.materials.push(material);
  return material;
}

function prepareObject(object, renderOrder) {
  object.frustumCulled = false;
  object.castShadow = false;
  object.receiveShadow = false;
  object.renderOrder = renderOrder;
  return object;
}

function addPlane(THREE, group, owned, spec) {
  const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
  owned.geometries.push(geometry);
  const material = makeMaterial(THREE, owned, spec.color, spec.opacity, spec.name);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = spec.name;
  mesh.position.set(spec.x, spec.y, spec.z);
  mesh.rotation.set(spec.rx || 0, spec.ry || 0, spec.rz || 0);
  mesh.scale.set(spec.w, spec.h, 1);
  mesh.userData.baseOpacity = spec.opacity;
  mesh.userData.phase = spec.phase || 0;
  mesh.userData.floatAmount = spec.floatAmount || 0;
  mesh.userData.basePositionY = spec.y;
  prepareObject(mesh, spec.renderOrder || OVERLAY.renderOrderBase);
  group.add(mesh);
  return mesh;
}

function addLine(THREE, group, owned, spec) {
  const points = spec.points.map((point) => new THREE.Vector3(point[0], point[1], point[2]));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  owned.geometries.push(geometry);
  const material = makeLineMaterial(THREE, owned, spec.color, spec.opacity, spec.name);
  const line = new THREE.Line(geometry, material);
  line.name = spec.name;
  line.userData.baseOpacity = spec.opacity;
  line.userData.phase = spec.phase || 0;
  prepareObject(line, spec.renderOrder || OVERLAY.renderOrderBase + 20);
  group.add(line);
  return line;
}

function addRibbon(THREE, group, owned, spec) {
  const positions = [];
  const indices = [];
  for (let index = 0; index < spec.points.length; index += 1) {
    const previous = spec.points[Math.max(0, index - 1)];
    const current = spec.points[index];
    const next = spec.points[Math.min(spec.points.length - 1, index + 1)];
    const dx = next[0] - previous[0];
    const dy = next[1] - previous[1];
    const length = Math.max(0.0001, Math.hypot(dx, dy));
    const width = spec.width * (0.58 + Math.sin((index / Math.max(1, spec.points.length - 1)) * Math.PI) * 0.42);
    const nx = -dy / length * width;
    const ny = dx / length * width;
    positions.push(current[0] + nx, current[1] + ny, current[2]);
    positions.push(current[0] - nx, current[1] - ny, current[2]);
    if (index < spec.points.length - 1) {
      const start = index * 2;
      indices.push(start, start + 1, start + 2, start + 1, start + 3, start + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  owned.geometries.push(geometry);
  const material = makeMaterial(THREE, owned, spec.color, spec.opacity, spec.name);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = spec.name;
  mesh.userData.baseOpacity = spec.opacity;
  mesh.userData.phase = spec.phase || 0;
  prepareObject(mesh, spec.renderOrder || OVERLAY.renderOrderBase + 12);
  group.add(mesh);
  return mesh;
}

function buildCurve(random, startX, startY, z, span, vertical, wobble, count) {
  const points = [];
  const direction = random() < 0.5 ? -1 : 1;
  for (let index = 0; index < count; index += 1) {
    const t = index / Math.max(1, count - 1);
    const ease = t * t * (3 - 2 * t);
    const wave = Math.sin(t * Math.PI * (1.4 + random() * 2.8) + random() * 0.8) * wobble;
    points.push([
      startX + span * (ease - 0.5) + wave * 0.5,
      startY + vertical * Math.sin(t * Math.PI) * direction + wave,
      z - t * (0.14 + random() * 0.18)
    ]);
  }
  return points;
}

function addPaperWashes(THREE, group, owned, random) {
  for (let index = 0; index < OVERLAY.planeCount; index += 1) {
    const t = index / Math.max(1, OVERLAY.planeCount - 1);
    const centerBias = Math.sin(t * Math.PI);
    const color = choose(random, OVERLAY.washes);
    addPlane(THREE, group, owned, {
      name: 'gpu-restored-translucent-bowling-wash-' + index,
      color,
      opacity: (0.038 + random() * 0.08) * OVERLAY.opacity,
      x: lerp(OVERLAY.xMin, OVERLAY.xMax, random() * 0.92 + 0.04),
      y: lerp(OVERLAY.yMin, OVERLAY.yMax, random() * 0.88 + 0.06),
      z: OVERLAY.z - 0.34 - random() * 2.8 - centerBias * 0.7,
      w: 1.2 + random() * 5.6 + centerBias * 2.8,
      h: 0.62 + random() * 4.4 + centerBias * 1.4,
      ry: (random() - 0.5) * 0.34,
      rz: (random() - 0.5) * 0.28,
      renderOrder: OVERLAY.renderOrderBase + index % 9,
      phase: random() * Math.PI * 2,
      floatAmount: 0.006 + random() * 0.012
    });
  }
}

function addFlowRibbons(THREE, group, owned, random) {
  for (let index = 0; index < OVERLAY.ribbonCount; index += 1) {
    const color = choose(random, OVERLAY.colors);
    const startX = lerp(OVERLAY.xMin, OVERLAY.xMax, random() * 0.82 + 0.06);
    const startY = lerp(OVERLAY.yMin, OVERLAY.yMax, random() * 0.8 + 0.1);
    const z = OVERLAY.z + 0.45 - random() * 2.7;
    const span = (1.4 + random() * 4.8) * (random() < 0.72 ? 1 : -1);
    const vertical = (random() - 0.5) * (0.8 + random() * 1.8);
    const points = buildCurve(random, startX, startY, z, span, vertical, 0.18 + random() * 0.62, 5 + Math.floor(random() * 4));
    addRibbon(THREE, group, owned, {
      name: 'gpu-restored-transparent-flow-ribbon-' + index,
      points,
      width: 0.045 + random() * 0.24,
      color,
      opacity: (0.045 + random() * 0.12) * OVERLAY.opacity,
      renderOrder: OVERLAY.renderOrderBase + 16 + index % 17,
      phase: random() * Math.PI * 2
    });
  }
}

function addScratchesAndDrips(THREE, group, owned, random) {
  for (let index = 0; index < OVERLAY.scratchCount; index += 1) {
    const vertical = random() < 0.62;
    const x = lerp(OVERLAY.xMin, OVERLAY.xMax, random());
    const y = lerp(OVERLAY.yMin, OVERLAY.yMax, random());
    const z = OVERLAY.z + 0.72 - random() * 2.35;
    const length = 0.28 + random() * (vertical ? 2.4 : 3.0);
    const points = [];
    const count = 3 + Math.floor(random() * 5);
    for (let step = 0; step < count; step += 1) {
      const t = step / Math.max(1, count - 1);
      const wiggle = (random() - 0.5) * 0.18 + Math.sin(t * Math.PI * 2 + index) * 0.06;
      points.push(vertical
        ? [x + wiggle, y + length * (0.5 - t), z - t * 0.04]
        : [x + length * (t - 0.5), y + wiggle, z - t * 0.04]);
    }
    addLine(THREE, group, owned, {
      name: 'gpu-restored-dry-scratch-drip-' + index,
      points,
      color: choose(random, OVERLAY.lineColors),
      opacity: (0.055 + random() * 0.18) * OVERLAY.opacity,
      renderOrder: OVERLAY.renderOrderBase + 44 + index % 19,
      phase: random() * Math.PI * 2
    });
  }
}

function addPigmentGrainPlanes(THREE, group, owned, random) {
  for (let index = 0; index < OVERLAY.grainCount; index += 1) {
    const color = choose(random, OVERLAY.colors);
    const size = 0.045 + random() * 0.22;
    addPlane(THREE, group, owned, {
      name: 'gpu-restored-small-pigment-chip-' + index,
      color,
      opacity: (0.04 + random() * 0.12) * OVERLAY.opacity,
      x: lerp(OVERLAY.xMin, OVERLAY.xMax, random()),
      y: lerp(OVERLAY.yMin, OVERLAY.yMax, random()),
      z: OVERLAY.z + 0.95 - random() * 2.2,
      w: size * (0.5 + random() * 2.1),
      h: size * (0.35 + random() * 1.6),
      ry: (random() - 0.5) * 0.5,
      rz: random() * Math.PI,
      renderOrder: OVERLAY.renderOrderBase + 68 + index % 13,
      phase: random() * Math.PI * 2,
      floatAmount: random() * 0.006
    });
  }
}

function addFiberField(THREE, group, owned, random) {
  const count = OVERLAY.fiberCount || 0;
  if (count <= 0) return;
  const positions = [];
  const colors = [];
  const palette = [...OVERLAY.lineColors, ...OVERLAY.colors];
  for (let index = 0; index < count; index += 1) {
    const x = lerp(OVERLAY.xMin, OVERLAY.xMax, random());
    const y = lerp(OVERLAY.yMin, OVERLAY.yMax, random());
    const z = OVERLAY.z + 1.02 - random() * 2.72;
    const mostlyVertical = random() < 0.58;
    const angle = mostlyVertical
      ? Math.PI * 0.5 + (random() - 0.5) * 0.72
      : (random() - 0.5) * 0.7;
    const length = 0.08 + random() * (mostlyVertical ? 0.72 : 1.15);
    const bend = (random() - 0.5) * 0.09;
    const dx = Math.cos(angle) * length * 0.5;
    const dy = Math.sin(angle) * length * 0.5;
    const p0x = x - dx - bend;
    const p0y = y - dy;
    const p1x = x + dx + bend;
    const p1y = y + dy;
    positions.push(p0x, p0y, z, p1x, p1y, z - random() * 0.035);
    const rgb = colorToRgb(choose(random, palette));
    colors.push(rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  owned.geometries.push(geometry);
  const material = new THREE.LineBasicMaterial({
    name: 'gpu-restored-paper-fiber-line-segments',
    vertexColors: true,
    transparent: true,
    opacity: (OVERLAY.fiberOpacity ?? 0.12) * OVERLAY.opacity,
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: false
  });
  owned.materials.push(material);
  const fibers = new THREE.LineSegments(geometry, material);
  fibers.name = 'gpu-restored-dense-paper-fiber-scratches';
  fibers.userData.baseOpacity = material.opacity;
  fibers.userData.phase = random() * Math.PI * 2;
  prepareObject(fibers, OVERLAY.renderOrderBase + 84);
  group.add(fibers);
}

function addBurst(THREE, group, owned, random, center, radius, index) {
  const rays = 18 + Math.floor(random() * 14);
  for (let ray = 0; ray < rays; ray += 1) {
    const angle = (ray / rays) * Math.PI * 2 + (random() - 0.5) * 0.14;
    const inner = radius * (0.16 + random() * 0.22);
    const outer = radius * (0.58 + random() * 0.58);
    const width = 0.018 + random() * 0.08;
    const p0 = [center[0] + Math.cos(angle) * inner, center[1] + Math.sin(angle) * inner, center[2]];
    const p1 = [center[0] + Math.cos(angle) * outer, center[1] + Math.sin(angle) * outer, center[2] - random() * 0.08];
    addRibbon(THREE, group, owned, {
      name: 'gpu-restored-bowling-burst-' + index + '-' + ray,
      points: [p0, p1],
      width,
      color: choose(random, OVERLAY.colors),
      opacity: (0.12 + random() * 0.18) * OVERLAY.opacity,
      renderOrder: OVERLAY.renderOrderBase + 92 + ray % 9,
      phase: random() * Math.PI * 2
    });
  }
}

function addRadialBursts(THREE, group, owned, random) {
  const defaultCenters = [
    [-4.2, 0.7, OVERLAY.z + 0.58],
    [-0.9, -0.3, OVERLAY.z + 0.42],
    [4.1, 0.4, OVERLAY.z + 0.44]
  ];
  for (let index = 0; index < OVERLAY.burstCount; index += 1) {
    const center = defaultCenters[index % defaultCenters.length];
    addBurst(THREE, group, owned, random, center, 0.95 + random() * 0.78, index);
  }
}

function createGpuDetailOverlay(context) {
  const THREE = context?.THREE;
  if (!THREE) return null;
  const random = seededRandom(context, 'non-literal-flow-pressure-gpu-detail-overlay');
  const group = new THREE.Group();
  const owned = { geometries: [], materials: [] };
  group.name = 'non-literal-flow-pressure-gpu-restored-no-texture-detail-overlay';
  group.userData = {
    partId: 'non-literal-flow-pressure',
    role: 'gpu-restored-detail-overlay',
    texturePolicy: 'no startup texture baking',
    detailMethod: 'WebGPU-safe translucent geometry rendered on GPU'
  };
  group.frustumCulled = false;
  group.renderOrder = OVERLAY.renderOrderBase;

  addPaperWashes(THREE, group, owned, random);
  addFlowRibbons(THREE, group, owned, random);
  addScratchesAndDrips(THREE, group, owned, random);
  addPigmentGrainPlanes(THREE, group, owned, random);
  addFiberField(THREE, group, owned, random);
  addRadialBursts(THREE, group, owned, random);

  group.userData.ownedGeometries = owned.geometries;
  group.userData.ownedMaterials = owned.materials;
  group.userData.update = function update(frame = {}) {
    const time = frame.captureMode ? 1.234 : Number(frame.elapsedSeconds || frame.time || 0);
    for (const child of group.children) {
      if (child.material && Number.isFinite(child.userData.baseOpacity)) {
        child.material.opacity = child.userData.baseOpacity * (0.96 + Math.sin(time * 0.24 + child.userData.phase) * 0.04);
      }
      if (child.userData.floatAmount) {
        const baseY = Number.isFinite(child.userData.basePositionY) ? child.userData.basePositionY : child.position.y;
        child.position.y = baseY + Math.sin(time * 0.18 + child.userData.phase) * child.userData.floatAmount;
      }
    }
  };
  return group;
}

function disposeOverlay(overlay) {
  if (!overlay) return;
  for (const geometry of overlay.userData?.ownedGeometries || []) geometry?.dispose?.();
  for (const material of overlay.userData?.ownedMaterials || []) material?.dispose?.();
}

export async function createImmersiveWorldPart(context = {}) {
  const result = await createBasePart(context);
  const overlay = result?.object?.isObject3D ? createGpuDetailOverlay(context) : null;
  if (overlay) {
    result.object.add(overlay);
    const previousDispose = typeof result.dispose === 'function' ? result.dispose : null;
    result.dispose = () => {
      disposeOverlay(overlay);
      previousDispose?.();
    };
    if (typeof result.update === 'function') {
      const previousUpdate = result.update;
      result.update = (frame) => {
        previousUpdate(frame);
        overlay.userData.update?.(frame);
      };
    } else {
      result.update = (frame) => overlay.userData.update?.(frame);
    }
  }
  return result;
}
