export const WEBGPU_ACCEPTED_MATERIAL_MAP_PROPERTIES = Object.freeze([
  'alphaMap',
  'aoMap',
  'bumpMap',
  'clearcoatMap',
  'clearcoatNormalMap',
  'clearcoatRoughnessMap',
  'displacementMap',
  'emissiveMap',
  'iridescenceMap',
  'lightMap',
  'map',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
  'sheenColorMap',
  'sheenRoughnessMap',
  'specularColorMap',
  'specularIntensityMap',
  'specularMap',
  'transmissionMap'
]);

export const WEBGPU_DEFERRED_MATERIAL_MAP_DECISIONS = Object.freeze({
  anisotropyMap: 'deferred: not accepted until generated-module packaging and runtime normalization have a dedicated anisotropy fixture',
  envMap: 'rejected-for-generated-modules: environment reflections are owned by the scene/environment contract, not part modules',
  gradientMap: 'rejected-for-generated-modules: toon-gradient authoring is not part of the WebGPU material-map contract',
  iridescenceThicknessMap: 'deferred: iridescenceMap is accepted; thickness maps need a separate fixture before acceptance',
  matcap: 'rejected-for-generated-modules: matcap is a material class/style surface, not a material map property accepted by packaging'
});

export function isAcceptedWebGPUMaterialMapProperty(value) {
  return WEBGPU_ACCEPTED_MATERIAL_MAP_PROPERTIES.includes(String(value || ''));
}
