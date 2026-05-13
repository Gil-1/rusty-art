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

export function createImmersiveWorldSkyboxShell(THREE, {
  name = 'immersive-world-skybox-shell',
  radius = IMMERSIVE_WORLD_SKYBOX_DEFAULT_RADIUS,
  geometry = null,
  material = null,
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
    environmentRadius: radius
  };
  const shellGeometry = geometry || new THREE.SphereGeometry(1, widthSegments, heightSegments);
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
    createSkyboxShell: (options = {}) => createImmersiveWorldSkyboxShell(THREE, options),
    applySkyboxDefaults: (object, options = {}) => applyImmersiveWorldSkyboxDefaults(THREE, object, options)
  });
}
