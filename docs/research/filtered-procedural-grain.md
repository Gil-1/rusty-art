# Filtered procedural grain for Rusty Art

**Research date:** 2026-08-30  
**Project version inspected:** Three.js `0.185.1` (`gitHead` `2431a09f46f34c560bc8e44b33be0e567723d5b9`)  
**Scope:** the shared `createScrapedPaintGrainMaterial` WebGPU/TSL helper and its WebGL 2 fallback.

## Recommendation

Replace the helper's floor-snapped hash with one octave of Three.js's built-in continuous MaterialX Perlin noise, give grain its own UV scale, and fade its contrast when the noise lattice approaches a pixel. This is the smallest robust fix:

```js
const grainCoordinates = uv()
  .mul(controls.uGrainScale)
  .add(vec2(fieldTime.mul(0.17), fieldTime.mul(0.11)));
const grainFootprint = fwidth(grainCoordinates);
const grainVisibility = smoothstep(
  0.5,
  1,
  grainFootprint.x.max(grainFootprint.y)
).oneMinus();
const grain = mx_noise_float(grainCoordinates)
  .mul(0.5)
  .mul(grainVisibility)
  .mul(controls.uGrainStrength);
```

Add a public, bounded `grainScale` option rather than deriving it from `bandScale`. Start near `256` UV cells for the existing full-UV painted planes, then calibrate against the fixed desktop/mobile near-design-far captures. The derivative fade, rather than capture resolution or a fixed distance check, should decide when the detail disappears.

Keep the derivative calculation unconditional in the fragment color graph. WGSL derivatives are fragment-stage operations and must be evaluated in uniform control flow ([WGSL derivative rules](https://www.w3.org/TR/WGSL/#derivatives)).

## Why the latest run looks pixelated

The shared helper currently does this:

```text
coordinates = uv * bandScale
grainScale = bandScale * 28
grainCell = floor(coordinates * grainScale)
```

The visible value is therefore constant over square cells, so camera magnification reveals a digital mosaic rather than continuous pigment or paper tooth. It also makes the effective density `28 * bandScale^2`, coupling broad painted bands to microtexture twice.

The latest run passes `bandScale` `2.2` for cream and `3.4` for the colored terraces. Their effective densities are therefore about `135.5` and `323.7` cells per UV respectively. This exactly explains why the cream cells appear roughly `2.4x` larger than the colored cells: `(3.4 / 2.2)^2 = 2.39`. The artifact is procedural quantization, not an undersized bitmap or capture.

## Available primitives in the installed Three.js

The installed `three/tsl` export was checked directly. It exposes `dFdx`, `dFdy`, `fwidth`, `smoothstep`, `mx_aastep`, `mx_noise_float`, `mx_fractal_noise_float`, `hash`, and the other primitives needed here. The exact release publicly re-exports the derivative and MaterialX nodes ([Three.TSL.js derivatives](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/src/Three.TSL.js#L150-L198), [Three.TSL.js MaterialX noise](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/src/Three.TSL.js#L337-L379)). The official [TSL API](https://threejs.org/docs/pages/TSL.html) defines `dFdx`, `dFdy`, and `fwidth` as screen-space derivatives.

`mx_noise_float` is the supported continuous choice. Its public wrapper calls the MaterialX Perlin implementation ([MaterialXNodes.js](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/src/nodes/materialx/MaterialXNodes.js#L61-L68)); that implementation interpolates lattice gradients with a fade curve instead of returning one value per cell ([mx_noise.js](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/src/nodes/materialx/lib/mx_noise.js#L610-L652)). It is continuous, but it does not inspect screen derivatives and is therefore not automatically band-limited. The explicit footprint fade remains necessary.

Do not substitute these primitives:

- `mx_cell_noise_float` intentionally produces cell values and retains the block problem.
- `hash`, `rand`, and interleaved gradient noise are discontinuous or screen-space random signals, not stable continuous surface grain.
- `mx_aastep` is useful for antialiasing a threshold edge—Three.js itself implements it using derivatives—but it does not filter continuous noise ([MaterialXNodes.js](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/src/nodes/materialx/MaterialXNodes.js#L17-L25)).
- `mx_fractal_noise_float` adds successively higher frequencies without derivative filtering. It would require footprint attenuation per octave and is unnecessary for this single grain layer.

Three.js's own r185 generators use the same two relevant patterns: `fwidth` to keep repeated procedural detail from shimmering ([SkyscraperGenerator.js](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/examples/jsm/generators/city/SkyscraperGenerator.js#L1236-L1266)) and continuous `mx_noise_float` for surface variation ([SidewalkGenerator.js](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/examples/jsm/generators/city/SidewalkGenerator.js#L197-L223)).

## Backend compatibility

This path is compatible with both backends used by `WebGPURenderer`:

- WebGPU: Three.js maps TSL `dFdx`/`dFdy` to WGSL `dpdx`/`dpdy`; native `fwidth` is available ([WGSLNodeBuilder.js](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/src/renderers/webgpu/nodes/WGSLNodeBuilder.js#L219-L222)).
- WebGL 2 fallback: `WebGPURenderer` automatically uses its WebGL 2 backend when WebGPU is unavailable, and can be forced with `forceWebGL` for verification ([official renderer guide](https://threejs.org/manual/en/webgpurenderer)). TSL emits native GLSL derivative calls through the fallback builder ([GLSLNodeBuilder.js](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/src/renderers/webgl-fallback/nodes/GLSLNodeBuilder.js#L222-L237)).

No texture allocation, generated bitmap, extra dependency, post-process, or publication gate is needed.

## Scope boundary

This fix removes square cells, decouples texture density, and prevents minified grain from aliasing. It deliberately keeps the existing `MeshBasicNodeMaterial` and albedo contribution.

A later material-quality pass could move most tooth into roughness and micro-normal on `MeshStandardNodeMaterial`, leaving only restrained pigment variation in albedo. That would be a larger lighting/material change and should be judged separately; it is not required to fix this defect.
