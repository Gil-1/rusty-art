function q({THREE:e,part:r,world:o,seed:c,assets:m,utilities:u}){let v=typeof c=="number"?c:I(String(c||r?.id||"world-environment")),i=O(v^1831565813),h=Math.max(28,Math.min(90,Number(o?.environment?.skyboxRadius||52))),x=u&&typeof u.createSkyboxShell=="function"?u.createSkyboxShell({THREE:e,radius:h,name:"pollock-finale-pressure-skybox-shell"}):_(e,h),a=x.object||x,s=x.mesh||a.mesh||a.children.find(t=>t.isMesh);a.name="world-environment-pollock-finale-pressure",a.userData.partId="world-environment",a.userData.immersiveWorldEnvironmentShell=!0,a.userData.cameraPinned=!0;let M=new e.ShaderMaterial({name:"pollock_unresolved_surface_atmosphere",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,uniforms:{uSeed:{value:v%997/997},uPressure:{value:1},uOchre:{value:new e.Color(11570993)},uTeal:{value:new e.Color(1547173)},uBlue:{value:new e.Color(741268)},uGround:{value:new e.Color(12103057)},uInk:{value:new e.Color(526602)},uPale:{value:new e.Color(15788763)}},vertexShader:`varying vec3 vDir;
varying vec3 vWorld;
void main() {
 vec4 worldPos = modelMatrix * vec4(position, 1.0);
 vWorld = worldPos.xyz;
 vDir = normalize(position);
 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float uSeed;
uniform float uPressure;
uniform vec3 uOchre;
uniform vec3 uTeal;
uniform vec3 uBlue;
uniform vec3 uGround;
uniform vec3 uInk;
uniform vec3 uPale;
varying vec3 vDir;
varying vec3 vWorld;
float hash(vec2 p) {
 p = fract(p * vec2(123.34, 456.21));
 p += dot(p, p + 45.32 + uSeed);
 return fract(p.x * p.y);
}
float noise(vec2 p) {
 vec2 i = floor(p);
 vec2 f = fract(p);
 vec2 u = f * f * (3.0 - 2.0 * f);
 return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float lineField(vec2 p, float angle, float freq, float width) {
 vec2 q = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p;
 float wobble = noise(q * 1.7 + angle) * 0.72 + noise(q * 4.9 - angle) * 0.18;
 float wave = abs(sin(q.x * freq + wobble * 6.283));
 return smoothstep(width, 0.0, wave);
}
void main() {
 vec3 d = normalize(vDir);
 vec2 p = vec2(atan(d.z, d.x) / 6.2831853 + 0.5, asin(d.y) / 3.1415926 + 0.5);
 vec2 stretched = vec2(p.x * 3.1, p.y * 1.55);
 float verticalAir = smoothstep(-0.72, 0.85, d.y);
 vec3 base = mix(uGround, uBlue, smoothstep(0.16, 0.92, noise(stretched * 1.8 + vec2(0.2, uSeed))));
 base = mix(base, uTeal, 0.22 * smoothstep(0.45, 0.92, noise(stretched * 3.0 + 4.7)));
 base = mix(base, uOchre, 0.28 * smoothstep(0.50, 0.95, noise(stretched * 2.4 - 2.1)));
 base *= mix(0.58, 1.15, verticalAir);

 float blackWeb = lineField(stretched + vec2(0.0, uSeed), 0.72, 32.0, 0.075);
 blackWeb += lineField(stretched + vec2(1.7, 0.2), -0.38, 41.0, 0.055);
 blackWeb += lineField(stretched * 1.12 + vec2(-0.3, 0.9), 1.38, 26.0, 0.050);
 blackWeb = clamp(blackWeb, 0.0, 1.0);

 float paleSkein = lineField(stretched * 1.24 + vec2(0.4, -0.1), -0.96, 48.0, 0.045);
 paleSkein += lineField(stretched * 1.38 + vec2(1.5, 0.4), 0.18, 56.0, 0.035);
 paleSkein = clamp(paleSkein, 0.0, 1.0);

 float pressureBand = smoothstep(0.80, 0.18, abs(p.y - 0.46)) * smoothstep(0.12, 0.82, noise(vec2(p.x * 9.0, p.y * 2.3 + uSeed)));
 float sparks = smoothstep(0.965, 1.0, noise(stretched * 19.0 + vec2(7.0, 3.0))) * pressureBand;

 vec3 color = base;
 color = mix(color, uInk, clamp(blackWeb * 0.72 + pressureBand * 0.20, 0.0, 0.88));
 color = mix(color, uPale, paleSkein * 0.70);
 color = mix(color, vec3(0.88, 0.13, 0.08), sparks * 0.52);
 color = mix(color, vec3(1.0, 0.78, 0.08), sparks * 0.36 * step(0.5, noise(stretched * 33.0)));
 float vignette = smoothstep(1.0, -0.2, length(d.xz) * 0.14 + max(-d.y, 0.0) * 0.28);
 gl_FragColor = vec4(color * vignette, 1.0);
}`});s&&(s.material&&s.material.dispose&&s.material.dispose(),s.material=M,s.castShadow=!1,s.receiveShadow=!1,s.frustumCulled=!1,s.renderOrder=-1e3),a.material=M,a.mesh=s,a.object=a;let p=new e.Group;p.name="camera-safe-all-over-drip-pressure-field",p.renderOrder=-990,a.add(p);let f=[15920864,329223,12031801,1681328,876984,13842980,15909949,5595964];for(let t=0;t<34;t+=1){let n=f[t%f.length],d=n===329223?.58:.46,l=D(e,i,h*(.72+i()*.16),t),C=new e.BufferGeometry().setFromPoints(l),B=new e.Line(C,new e.LineBasicMaterial({color:n,transparent:!0,opacity:d,depthWrite:!1,depthTest:!0,blending:e.NormalBlending}));B.name=t%5===0?"heavy-black-pressure-slash":"looping-poured-skein",B.frustumCulled=!1,p.add(B)}let b=new e.BufferGeometry,y=360,w=new Float32Array(y*3),S=new Float32Array(y*3),W=new Float32Array(y),k=new e.Color;for(let t=0;t<y;t+=1){let n=A(e,i),d=h*(.58+i()*.3);w[t*3]=n.x*d,w[t*3+1]=n.y*d,w[t*3+2]=n.z*d,k.setHex(f[(t*7+Math.floor(i()*f.length))%f.length]);let l=.72+i()*.34;S[t*3]=k.r*l,S[t*3+1]=k.g*l,S[t*3+2]=k.b*l,W[t]=.8+i()*2.6}b.setAttribute("position",new e.BufferAttribute(w,3)),b.setAttribute("color",new e.BufferAttribute(S,3)),b.setAttribute("aSize",new e.BufferAttribute(W,1));let z=new e.ShaderMaterial({name:"pollock_suspended_splatter_points",transparent:!0,depthWrite:!1,depthTest:!0,vertexColors:!0,uniforms:{uScale:{value:1}},vertexShader:`attribute float aSize;
varying vec3 vColor;
void main() {
 vColor = color;
 vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
 gl_PointSize = aSize * (260.0 / max(40.0, -mvPosition.z));
 gl_Position = projectionMatrix * mvPosition;
}`,fragmentShader:`precision mediump float;
varying vec3 vColor;
void main() {
 vec2 c = gl_PointCoord - vec2(0.5);
 float d = dot(c, c);
 float a = smoothstep(0.25, 0.02, d);
 if (a < 0.02) discard;
 gl_FragColor = vec4(vColor, a * 0.72);
}`}),g=new e.Points(b,z);g.name="floating-layered-splatter-depth",g.frustumCulled=!1,g.renderOrder=-980,a.add(g);let P=new e.Group;P.name="distant-geometric-pressure-planes",a.add(P);for(let t=0;t<7;t+=1){let n=new e.PlaneGeometry(h*(.18+i()*.18),h*(.035+i()*.055)),d=new e.MeshBasicMaterial({color:[741268,1316628,9139245,1146243][t%4],transparent:!0,opacity:.18,depthWrite:!1,depthTest:!0,side:e.DoubleSide}),l=new e.Mesh(n,d),C=A(e,i);l.position.copy(C.multiplyScalar(h*(.5+i()*.18))),l.lookAt(0,0,0),l.rotateZ(i()*Math.PI),l.renderOrder=-985,l.frustumCulled=!1,P.add(l)}function G({camera:t,time:n}={}){t&&a.position.copy(t.position);let d=typeof n=="number"?n:0;p.rotation.y=Math.sin(d*.035+v)*.018,p.rotation.x=Math.cos(d*.027+v*.17)*.01,g.rotation.y=-p.rotation.y*.55,M.uniforms.uPressure.value=.92+Math.sin(d*.11+v*.01)*.08}function F(){a.traverse(t=>{t.geometry&&t.geometry.dispose&&t.geometry.dispose(),t.material&&(Array.isArray(t.material)?t.material.forEach(n=>n&&n.dispose&&n.dispose()):t.material.dispose&&t.material.dispose())})}return{object:a,update:G,dispose:F}}function _(e,r){let o=new e.Group,c=new e.SphereGeometry(r,48,24),m=new e.MeshBasicMaterial({color:10458751,side:e.BackSide,depthWrite:!1,depthTest:!0}),u=new e.Mesh(c,m);return u.castShadow=!1,u.receiveShadow=!1,u.frustumCulled=!1,o.add(u),o.mesh=u,o.material=m,o.object=o,o}function D(e,r,o,c){let m=[],u=r()*Math.PI*2,v=-.86+r()*1.72,i=(r()<.5?-1:1)*(.55+r()*1.35),h=-.38+r()*.76,x=34+Math.floor(r()*26);for(let a=0;a<x;a+=1){let s=a/Math.max(1,x-1),M=Math.sin(s*Math.PI*(2+r()*3)+c)*(.05+r()*.08),p=u+i*(s-.5)+Math.sin(s*11+c)*.11,f=Math.max(-1.15,Math.min(1.15,v+h*(s-.5)+M)),b=Math.cos(f)*Math.cos(p)*o,y=Math.sin(f)*o,w=Math.cos(f)*Math.sin(p)*o;m.push(new e.Vector3(b,y,w))}return m}function A(e,r){let o=r()*2-1,c=r()*Math.PI*2,m=Math.sqrt(Math.max(0,1-o*o));return new e.Vector3(m*Math.cos(c),o,m*Math.sin(c))}function I(e){let r=2166136261;for(let o=0;o<e.length;o+=1)r^=e.charCodeAt(o),r=Math.imul(r,16777619);return r>>>0}function O(e){return function(){e|=0,e=e+1831565813|0;let o=Math.imul(e^e>>>15,1|e);return o=o+Math.imul(o^o>>>7,61|o)^o,((o^o>>>14)>>>0)/4294967296}}export{q as createImmersiveWorldPart};
