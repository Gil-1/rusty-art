export const IMMERSIVE_WORLD_SKYBOX_RENDER_ORDER = -1000;
export const IMMERSIVE_WORLD_SKYBOX_DEFAULT_RADIUS = 100000;

function asObject(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function positiveNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function materialList(material) {
  if (!material) return [];
  return Array.isArray(material) ? material.filter(Boolean) : [material];
}

export function isImmersiveWorldSkyboxMode(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return false;
  return text.includes('skybox')
    || text.includes('sky-box')
    || text.includes('environment-shell')
    || text.includes('background-shell')
    || text.includes('inside-facing-shell')
    || text.includes('dome-shell');
}

export function isImmersiveWorldSkyboxPartMode(part = {}) {
  const params = asObject(part.params);
  const moduleRef = asObject(part.moduleRef || part.module);
  return [
    part.renderMode,
    part.environmentMode,
    part.mode,
    params.renderMode,
    params.environmentMode,
    params.mode,
    moduleRef.renderMode,
    moduleRef.environmentMode,
    moduleRef.mode
  ].some(isImmersiveWorldSkyboxMode);
}

export function isImmersiveWorldSkyboxObject(object) {
  const userData = asObject(object?.userData);
  return userData.immersiveWorldEnvironmentShell === true
    || userData.skybox === true
    || userData.skyboxShell === true
    || userData.environmentShell === true;
}

export function shouldUseImmersiveWorldSkybox({ object, part, world } = {}) {
  const environment = asObject(world?.environment);
  return isImmersiveWorldSkyboxObject(object)
    || isImmersiveWorldSkyboxPartMode(part)
    || isImmersiveWorldSkyboxMode(environment.kind)
    || isImmersiveWorldSkyboxMode(environment.renderMode)
    || isImmersiveWorldSkyboxMode(environment.mode);
}

export function resolveImmersiveWorldSkyboxRadius(world = {}, { fallback = 90, min = 24 } = {}) {
  const environment = asObject(world?.environment);
  return Math.max(min, positiveNumber(environment.skyboxRadius, positiveNumber(environment.radius, fallback)));
}

function keepSkyboxCenteredOnCamera(child, rootObject) {
  if (!child?.isObject3D || (!child.isMesh && !child.isLine && !child.isPoints && !child.isSprite)) return;
  if (child.userData?.immersiveWorldSkyboxCameraPinned === true) return;
  const previousOnBeforeRender = child.onBeforeRender;
  child.userData = {
    ...child.userData,
    immersiveWorldSkyboxCameraPinned: true
  };
  child.onBeforeRender = function immersiveWorldSkyboxOnBeforeRender(renderer, scene, camera, geometry, material, group) {
    if (camera?.position) rootObject.position.copy(camera.position);
    if (typeof previousOnBeforeRender === 'function') {
      previousOnBeforeRender.call(this, renderer, scene, camera, geometry, material, group);
    }
  };
}

export function applyImmersiveWorldSkyboxDefaults(THREE, object, {
  radius = null,
  renderOrder = IMMERSIVE_WORLD_SKYBOX_RENDER_ORDER,
  cameraPinned = true
} = {}) {
  if (!THREE || !object?.isObject3D) return object;
  object.renderOrder = Math.min(object.renderOrder || 0, renderOrder);
  object.userData = {
    ...object.userData,
    immersiveWorldEnvironmentShell: true,
    skybox: true,
    ...(radius ? { environmentRadius: radius } : {})
  };

  object.traverse((child) => {
    child.renderOrder = Math.min(child.renderOrder || 0, renderOrder);
    if ('castShadow' in child) child.castShadow = false;
    if ('receiveShadow' in child) child.receiveShadow = false;
    if ('frustumCulled' in child) child.frustumCulled = false;
    if (cameraPinned) keepSkyboxCenteredOnCamera(child, object);
    for (const material of materialList(child.material)) {
      if ('side' in material) material.side = THREE.BackSide;
      if ('depthWrite' in material) material.depthWrite = false;
      if ('depthTest' in material) material.depthTest = true;
      if ('fog' in material) material.fog = false;
      if ('toneMapped' in material) material.toneMapped = false;
      material.needsUpdate = true;
    }
  });
  return object;
}

export function createImmersiveWorldSkyboxMaterial(THREE, {
  color = '#0b1020',
  opacity = 1,
  transparent = opacity < 1,
  vertexShader = null,
  fragmentShader = null,
  uniforms = null
} = {}) {
  if (!THREE) throw new Error('createImmersiveWorldSkyboxMaterial requires THREE.');
  const material = vertexShader && fragmentShader
    ? new THREE.ShaderMaterial({
      uniforms: uniforms || {},
      vertexShader,
      fragmentShader,
      transparent
    })
    : new THREE.MeshBasicMaterial({
      color,
      transparent,
      opacity
    });
  material.side = THREE.BackSide;
  material.depthWrite = false;
  material.depthTest = true;
  material.fog = false;
  material.toneMapped = false;
  material.needsUpdate = true;
  return material;
}

export function createImmersiveWorldPositionSpaceSkyboxMaterial(THREE, {
  name = 'immersive-world-position-space-skybox-material',
  transparent = false,
  opacity = 1,
  veil = transparent,
  upperLeft = '#16112b',
  upperRight = '#4b5b49',
  lower = '#9a3b22',
  lowerAccent = '#c97724',
  hinge = '#120d0d',
  band = '#063dc7',
  accent = '#c51c12',
  smoke = '#2a2923',
  domainScale = 1,
  stainStrength = 1
} = {}) {
  if (!THREE) throw new Error('createImmersiveWorldPositionSpaceSkyboxMaterial requires THREE.');
  const material = new THREE.ShaderMaterial({
    name,
    side: THREE.BackSide,
    transparent,
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uVeil: { value: veil ? 1 : 0 },
      uUpperLeft: { value: new THREE.Color(upperLeft) },
      uUpperRight: { value: new THREE.Color(upperRight) },
      uLower: { value: new THREE.Color(lower) },
      uLowerAccent: { value: new THREE.Color(lowerAccent) },
      uHinge: { value: new THREE.Color(hinge) },
      uBand: { value: new THREE.Color(band) },
      uAccent: { value: new THREE.Color(accent) },
      uSmoke: { value: new THREE.Color(smoke) },
      uDomainScale: { value: positiveNumber(domainScale, 1) },
      uStainStrength: { value: positiveNumber(stainStrength, 1) }
    },
    vertexShader: `
      varying vec3 vSkyPosition;
      void main() {
        vSkyPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec3 vSkyPosition;
      uniform float uTime;
      uniform float uOpacity;
      uniform float uVeil;
      uniform float uDomainScale;
      uniform float uStainStrength;
      uniform vec3 uUpperLeft;
      uniform vec3 uUpperRight;
      uniform vec3 uLower;
      uniform vec3 uLowerAccent;
      uniform vec3 uHinge;
      uniform vec3 uBand;
      uniform vec3 uAccent;
      uniform vec3 uSmoke;

      float hash31(vec3 p) {
        p = fract(p * vec3(127.1, 311.7, 74.7));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }

      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), u.x),
            mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), u.x),
            u.y
          ),
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), u.x),
            mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), u.x),
            u.y
          ),
          u.z
        );
      }

      float fbm3(vec3 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amp * noise3(p);
          p = p * 2.03 + vec3(8.3, 4.7, 6.1);
          amp *= 0.5;
        }
        return value;
      }

      float softBand(float value, float center, float halfSize, float feather) {
        return 1.0 - smoothstep(halfSize, halfSize + feather, abs(value - center));
      }

      float softRect(float x, float y, float halfWidth, float centerY, float halfHeight, float feather) {
        float sx = 1.0 - smoothstep(halfWidth, halfWidth + feather, abs(x));
        float sy = 1.0 - smoothstep(halfHeight, halfHeight + feather, abs(y - centerY));
        return sx * sy;
      }

      void main() {
        vec3 dir = normalize(vSkyPosition);
        float x = clamp(dir.x * 1.18, -1.3, 1.3);
        float y = dir.y;
        float poleFade = 1.0 - smoothstep(0.78, 0.97, abs(y));
        float poleBlend = smoothstep(0.84, 0.985, abs(y));
        float front = smoothstep(-0.1, 0.85, -dir.z);
        float slow = uTime * 0.018;
        vec3 domain = vec3(dir.x * 1.35, dir.y * 1.15, dir.z * 1.35) * uDomainScale;
        float broad = fbm3(domain * 1.65 + vec3(slow, -slow * 0.4, slow * 0.27));
        float fiber = fbm3(domain * 14.0 + vec3(0.0, slow * 2.0, -slow));
        float seamDrift = ((broad - 0.5) * 0.12 + sin((dir.x - dir.z) * 2.2 + uTime * 0.04) * 0.012) * (0.45 + 0.55 * poleFade);

        vec3 upper = mix(uUpperLeft, uUpperRight, smoothstep(-0.18 + seamDrift, 0.28 + seamDrift, x));
        vec3 lowerField = mix(uLower, uLowerAccent, 0.18 + broad * 0.68);
        vec3 color = mix(lowerField, upper, smoothstep(-0.12 + seamDrift, 0.18 + seamDrift, y));

        float lowWeight = softRect(x * 0.82, y, 0.92, -0.56 + seamDrift * 0.5, 0.32, 0.16);
        float upperPane = softRect(x * 0.92, y, 0.9, 0.38 + seamDrift * 0.35, 0.34, 0.13);
        float hingeMask = softBand(y + seamDrift * 0.65, -0.1, 0.072, 0.1) * (0.5 + 0.5 * smoothstep(1.18, 0.2, abs(x))) * poleFade;
        float coolSeam = softBand(y + seamDrift, -0.19, 0.035, 0.075) * smoothstep(-0.92, 0.64, x) * poleFade;
        float cobaltPulse = softBand(y + seamDrift, -0.31, 0.032, 0.062) * (0.24 + 0.76 * smoothstep(0.96, 0.04, abs(x + 0.22))) * poleFade;
        float redFracture = softBand(x + seamDrift * 0.8, 0.0, 0.025, 0.055) * smoothstep(-0.42, 0.2, y) * smoothstep(0.78, 0.18, abs(y)) * poleFade;
        float radialPressure = (1.0 - smoothstep(0.22, 0.68, length(vec2(x * 0.72, y + 0.28)))) * poleFade;

        color = mix(color, upper, upperPane * 0.42);
        color = mix(color, lowerField, lowWeight * 0.48);
        color = mix(color, uHinge, hingeMask * 0.82);
        color = mix(color, uUpperRight, coolSeam * 0.44);
        color = mix(color, uBand, cobaltPulse * (0.76 + radialPressure * 0.12));
        color = mix(color, uAccent, redFracture * 0.72);
        color += (broad - 0.5) * 0.18 * uStainStrength + (fiber - 0.5) * 0.045 * uStainStrength * (0.35 + 0.65 * poleFade);
        color += vec3(0.02, 0.012, 0.006) * radialPressure * front;

        float sideDark = smoothstep(0.68, 1.22, abs(x)) * (0.22 + broad * 0.28) * poleFade;
        color = mix(color, uHinge, sideDark);
        float smokyTop = smoothstep(0.68, 0.98, y) * (0.08 + broad * 0.08);
        color = mix(color, uSmoke, smokyTop);
        color *= 1.14 + 0.32 * front;
        color += vec3(0.036, 0.022, 0.014) * front;
        vec3 poleWash = mix(mix(uLower, uLowerAccent, 0.42), mix(uUpperLeft, uUpperRight, 0.5), smoothstep(-0.28, 0.58, y));
        color = mix(color, poleWash + (broad - 0.5) * 0.08 * uStainStrength, poleBlend * 0.66);
        color = pow(max(color, vec3(0.0)), vec3(1.02));

        float veilAlpha = mix(1.0, (0.16 + hingeMask * 0.38 + cobaltPulse * 0.22 + redFracture * 0.22) * uOpacity, uVeil);
        gl_FragColor = vec4(color, veilAlpha);
      }
    `
  });
  material.opacity = opacity;
  material.needsUpdate = true;
  return material;
}

export function createImmersiveWorldSkyboxGeometry(THREE, {
  geometryKind = 'box',
  widthSegments = 96,
  heightSegments = 48
} = {}) {
  if (!THREE) throw new Error('createImmersiveWorldSkyboxGeometry requires THREE.');
  if (String(geometryKind).toLowerCase() === 'sphere') {
    return new THREE.SphereGeometry(1, widthSegments, heightSegments);
  }

  const sideLength = 2 / Math.sqrt(3);
  return new THREE.BoxGeometry(sideLength, sideLength, sideLength, 1, 1, 1);
}

export function createImmersiveWorldSkyboxShell(THREE, {
  name = 'immersive-world-skybox-shell',
  radius = IMMERSIVE_WORLD_SKYBOX_DEFAULT_RADIUS,
  geometry = null,
  material = null,
  geometryKind = 'box',
  widthSegments = 96,
  heightSegments = 48,
  color = '#0b1020',
  opacity = 1,
  cameraPinned = true,
  userData = {}
} = {}) {
  if (!THREE) throw new Error('createImmersiveWorldSkyboxShell requires THREE.');
  const group = new THREE.Group();
  group.name = name;
  group.userData = {
    ...userData,
    immersiveWorldEnvironmentShell: true,
    skybox: true,
    environmentGeometryKind: geometryKind,
    environmentRadius: radius
  };
  const shellGeometry = geometry || createImmersiveWorldSkyboxGeometry(THREE, {
    geometryKind,
    widthSegments,
    heightSegments
  });
  const shellMaterial = material || createImmersiveWorldSkyboxMaterial(THREE, { color, opacity });
  const mesh = new THREE.Mesh(shellGeometry, shellMaterial);
  mesh.name = `${name}-mesh`;
  group.add(mesh);
  applyImmersiveWorldSkyboxDefaults(THREE, group, { radius, cameraPinned });
  group.object = group;
  group.group = group;
  group.mesh = mesh;
  group.geometry = shellGeometry;
  group.material = shellMaterial;
  group.dispose = function disposeImmersiveWorldSkyboxShell() {
    shellGeometry.dispose?.();
    shellMaterial.dispose?.();
  };
  return group;
}

export function createImmersiveWorldSkyboxUtilities(THREE) {
  return Object.freeze({
    createSkyboxMaterial: (options = {}) => createImmersiveWorldSkyboxMaterial(THREE, options),
    createPositionSpaceSkyboxMaterial: (options = {}) => createImmersiveWorldPositionSpaceSkyboxMaterial(THREE, options),
    createSkyboxGeometry: (options = {}) => createImmersiveWorldSkyboxGeometry(THREE, options),
    createSkyboxShell: (options = {}) => createImmersiveWorldSkyboxShell(THREE, options),
    applySkyboxDefaults: (object, options = {}) => applyImmersiveWorldSkyboxDefaults(THREE, object, options)
  });
}
