function M({THREE:e,part:r,world:t,seed:o,assets:a,utilities:l}){let u=r?.id||"world-environment",h=k(o,u),m=B(t?.environment?.skyboxRadius??t?.environment?.radius,54,28,96),d={uTime:{value:0},uSeed:{value:h%1009/1009},uTop:{value:new e.Color("#5b1716")},uTopHeat:{value:new e.Color("#9a2f19")},uBand:{value:new e.Color("#120a16")},uBandEdge:{value:new e.Color("#d02d20")},uLower:{value:new e.Color("#7b4a16")},uLowerCool:{value:new e.Color("#496356")},uBlue:{value:new e.Color("#0644a2")},uSmoke:{value:new e.Color("#1a0d17")}},f=new e.ShaderMaterial({name:"rothko_hantavirus_pressure_skybox_material",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:d,vertexShader:`
 varying vec3 vDir;
 void main() {
 vDir = normalize(position.xyz);
 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
 }
 `,fragmentShader:`
 precision highp float;
 varying vec3 vDir;
 uniform float uTime;
 uniform float uSeed;
 uniform vec3 uTop;
 uniform vec3 uTopHeat;
 uniform vec3 uBand;
 uniform vec3 uBandEdge;
 uniform vec3 uLower;
 uniform vec3 uLowerCool;
 uniform vec3 uBlue;
 uniform vec3 uSmoke;

 float hash(vec2 p) {
 p = fract(p * vec2(123.34, 345.45));
 p += dot(p, p + 34.345 + uSeed);
 return fract(p.x * p.y);
 }

 float noise(vec2 p) {
 vec2 i = floor(p);
 vec2 f = fract(p);
 f = f * f * (3.0 - 2.0 * f);
 float a = hash(i);
 float b = hash(i + vec2(1.0, 0.0));
 float c = hash(i + vec2(0.0, 1.0));
 float d = hash(i + vec2(1.0, 1.0));
 return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
 }

 float fbm(vec2 p) {
 float v = 0.0;
 float amp = 0.5;
 for (int i = 0; i < 5; i++) {
 v += amp * noise(p);
 p = p * 2.07 + vec2(11.7, 4.3);
 amp *= 0.48;
 }
 return v;
 }

 float softBand(float y, float center, float halfWidth, float feather) {
 float d = abs(y - center) - halfWidth;
 return 1.0 - smoothstep(-feather, feather, d);
 }

 void main() {
 vec3 d = normalize(vDir);
 float x = atan(d.x, d.z) / 3.14159265;
 float y = d.y;
 float slowPulse = sin(uTime * 0.17 + uSeed * 6.28318) * 0.018;
 float seam = -0.18 + slowPulse + (fbm(vec2(x * 3.1, 4.0)) - 0.5) * 0.045;
 float lowerSeam = -0.48 - slowPulse * 0.6 + (fbm(vec2(x * 2.4 + 8.0, 1.0)) - 0.5) * 0.06;
 float grain = fbm(vec2(x * 19.0 + uSeed * 7.0, y * 13.0));
 float stain = fbm(vec2(x * 5.0 - uTime * 0.008, y * 6.5 + uSeed));
 float weaveA = abs(sin((x + uSeed) * 420.0)) * 0.018;
 float weaveB = abs(sin((y - uSeed) * 360.0)) * 0.014;

 vec3 color = mix(uTop, uTopHeat, smoothstep(0.15, 0.95, stain));
 vec3 lowerMix = mix(uLower, uLowerCool, smoothstep(0.25, 0.9, fbm(vec2(x * 4.0 + 5.0, y * 7.0))));
 color = mix(lowerMix, color, smoothstep(lowerSeam - 0.12, lowerSeam + 0.16, y));

 float darkMass = softBand(y, seam, 0.105 + 0.015 * sin(x * 6.28318), 0.09);
 color = mix(color, uBand, darkMass * 0.9);

 float upperHalo = exp(-abs(y - seam) * 23.0) * (0.42 + 0.28 * fbm(vec2(x * 10.0, y * 12.0)));
 float lowerHalo = exp(-abs(y - lowerSeam) * 18.0) * 0.22;
 color += uBandEdge * upperHalo * 0.42;
 color += uBlue * lowerHalo * 0.24;

 float blueAccent = softBand(y, seam - 0.17, 0.025, 0.04) * smoothstep(0.42, 0.86, fbm(vec2(x * 9.0 - 1.0, 3.4)));
 float redAccent = softBand(y, seam + 0.03, 0.018, 0.035) * smoothstep(0.36, 0.75, fbm(vec2(x * 13.0 + 2.0, 7.0)));
 color = mix(color, uBlue, blueAccent * 0.55);
 color += uBandEdge * redAccent * 0.38;

 float edgeVignette = smoothstep(0.16, 0.96, abs(x)) * 0.45 + smoothstep(0.58, 1.0, abs(y)) * 0.35;
 color = mix(color, uSmoke, clamp(edgeVignette, 0.0, 0.72));
 color *= 0.82 + grain * 0.28;
 color -= weaveA + weaveB;
 color = pow(max(color, vec3(0.0)), vec3(1.04));
 gl_FragColor = vec4(color, 1.0);
 }
 `}),i=l?.createSkyboxShell?l.createSkyboxShell({name:"world-environment-rothko-fracture-pressure-shell",radius:m,material:f,widthSegments:96,heightSegments:48,userData:{partId:u,role:r?.role||"world-environment",packetId:"art-direction-packet-d42ae65eda84",packetHash:"d42ae65eda84fc46c5d773d440c03442",messagePurpose:"Rothko-like surrounding atmosphere: low pressure, broad horizontal fields, softened seams, dark hinge, and small cobalt red accents."}}):g(e,m,f),n=i.object||i,s=i.mesh||n.mesh||n.children?.find(c=>c?.isMesh);n.name="world-environment.rothko-hantavirus-pressure.v1",n.userData={...n.userData,partId:u,role:r?.role||"world-environment",immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,packetId:"art-direction-packet-d42ae65eda84",packetHash:"d42ae65eda84fc46c5d773d440c03442"},s&&(s.name="matte-stained-horizontal-pressure-skybox",s.castShadow=!1,s.receiveShadow=!1,s.frustumCulled=!1),l?.applySkyboxDefaults&&l.applySkyboxDefaults(n,{radius:m,cameraPinned:!0});function x({elapsedSeconds:c,time:p,motionIntensity:w=1,captureMode:y=!1,camera:v}={}){v?.position&&n.position.copy(v.position);let S=y?0:(typeof c=="number"?c:typeof p=="number"?p:0)*Math.max(0,w);d.uTime.value=S}function b(){typeof i.dispose=="function"?i.dispose():(s?.geometry?.dispose?.(),f.dispose?.())}return{object:n,update:x,dispose:b}}function g(e,r,t){let o=new e.Group,a=new e.SphereGeometry(1,96,48),l=new e.Mesh(a,t);return o.add(l),o.object=o,o.mesh=l,o.material=t,o.geometry=a,o.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,environmentRadius:r},o.dispose=function(){a.dispose?.(),t.dispose?.()},o}function k(e,r){if(typeof e=="number"&&Number.isFinite(e))return e>>>0;let t=String(e||r||"world-environment"),o=2166136261;for(let a=0;a<t.length;a+=1)o^=t.charCodeAt(a),o=Math.imul(o,16777619);return o>>>0}function B(e,r,t,o){let a=Number(e);return!Number.isFinite(a)||a<=0?r:Math.max(t,Math.min(o,a))}export{M as createImmersiveWorldPart};
