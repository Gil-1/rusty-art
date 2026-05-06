export const DEFAULT_SHADER_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const DEFAULT_SHADER_FRAGMENT = `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float wave = 0.5 + 0.5 * sin((uv.x * 6.0 + uv.y * 4.0) + uTime * 0.6);
  vec3 color = mix(uColorA, uColorB, wave);
  gl_FragColor = vec4(color, uOpacity);
}
`;

export const DEFAULT_PARTICLE_VERTEX = `
attribute float aScale;
uniform float uTime;
uniform float uSize;
void main() {
  vec3 p = position;
  p.xy += vec2(sin(uTime + p.z), cos(uTime * 0.7 + p.x)) * 0.05;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float perspective = clamp(1.6 / (-mvPosition.z + 2.0), 0.3, 3.0);
  gl_PointSize = uSize * aScale * perspective;
}
`;

export const DEFAULT_PARTICLE_FRAGMENT = `
uniform vec3 uColorA;
uniform float uOpacity;
void main() {
  vec2 uv = gl_PointCoord.xy - 0.5;
  float d = length(uv);
  float alpha = smoothstep(0.5, 0.05, d) * uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(uColorA, alpha);
}
`;
