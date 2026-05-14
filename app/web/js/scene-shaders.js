export const POST_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const POST_FRAGMENT = `
uniform sampler2D uTexture;
uniform float uTime;
uniform float uContrast;
uniform float uSaturation;
uniform float uVignette;
uniform float uDistortion;
uniform float uHueShift;
uniform float uExposureMul;
uniform vec2 uResolution;
varying vec2 vUv;

vec3 adjustSaturation(vec3 color, float sat) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(luma), color, sat);
}

vec3 hueShift(vec3 color, float shift) {
  const mat3 toYIQ = mat3(
    0.299, 0.587, 0.114,
    0.596, -0.275, -0.321,
    0.212, -0.523, 0.311
  );
  const mat3 toRGB = mat3(
    1.0, 0.956, 0.621,
    1.0, -0.272, -0.647,
    1.0, -1.106, 1.703
  );
  vec3 yiq = toYIQ * color;
  float hue = atan(yiq.z, yiq.y) + shift;
  float chroma = sqrt(yiq.y * yiq.y + yiq.z * yiq.z);
  vec3 shifted = vec3(yiq.x, chroma * cos(hue), chroma * sin(hue));
  return clamp(toRGB * shifted, 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;
  vec2 center = uv - 0.5;
  float wave = sin((uv.y * 8.0) + uTime * 0.8) * cos((uv.x * 6.5) - uTime * 0.7);
  uv += center * wave * uDistortion * 0.012;

  vec3 color = texture2D(uTexture, uv).rgb;
  color = hueShift(color, uHueShift);
  color = adjustSaturation(color, uSaturation);
  color = ((color - 0.5) * uContrast) + 0.5;
  color *= uExposureMul;

  float vignette = smoothstep(0.95, 0.16, length(center) * (1.0 + uVignette));
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
`;

export const IMMERSIVE_WORLD_POST_FRAGMENT = `
uniform sampler2D uTexture;
uniform float uTime;
uniform float uContrast;
uniform float uSaturation;
uniform float uVignette;
uniform float uDistortion;
uniform float uHueShift;
uniform float uExposureMul;
uniform vec2 uResolution;
varying vec2 vUv;

vec3 adjustSaturation(vec3 color, float sat) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(luma), color, sat);
}

vec3 hueShift(vec3 color, float shift) {
  const mat3 toYIQ = mat3(
    0.299, 0.587, 0.114,
    0.596, -0.275, -0.321,
    0.212, -0.523, 0.311
  );
  const mat3 toRGB = mat3(
    1.0, 0.956, 0.621,
    1.0, -0.272, -0.647,
    1.0, -1.106, 1.703
  );
  vec3 yiq = toYIQ * color;
  float hue = atan(yiq.z, yiq.y) + shift;
  float chroma = sqrt(yiq.y * yiq.y + yiq.z * yiq.z);
  vec3 shifted = vec3(yiq.x, chroma * cos(hue), chroma * sin(hue));
  return clamp(toRGB * shifted, 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;
  vec2 center = uv - 0.5;
  float wave = sin((uv.y * 8.0) + uTime * 0.8) * cos((uv.x * 6.5) - uTime * 0.7);
  uv += center * wave * uDistortion * 0.012;

  vec3 color = texture2D(uTexture, uv).rgb;
  color = hueShift(color, uHueShift);
  color = adjustSaturation(color, uSaturation);
  color = ((color - 0.5) * uContrast) + 0.5;
  color *= uExposureMul;

  float vignetteMask = smoothstep(0.95, 0.16, length(center) * (1.0 + uVignette));
  color *= mix(1.0, vignetteMask, clamp(uVignette, 0.0, 1.0));

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;
