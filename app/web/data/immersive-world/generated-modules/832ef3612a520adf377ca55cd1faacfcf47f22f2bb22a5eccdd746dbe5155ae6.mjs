function J({THREE:e,part:a,world:t,seed:r,utilities:m}){let f=a?.id||"world-environment",h=typeof r=="number"?r>>>0:X(String(r||f)),c=$(h^2654435769),k=q(t?.environment?.skyboxRadius??t?.environment?.radius,54),b=m?.createSkyboxShell?m.createSkyboxShell({radius:k,name:"pollock-finale-pressure-shell",color:"#d6cab2"}):V(e,k),l=b.object||b,s=b.mesh||l.mesh||l.children.find(o=>o?.isMesh)||null,d=[];if(l.name="world-environment-pollock-finale-pressure-v2",l.userData={...l.userData,partId:"world-environment",role:a?.role||"world-environment",immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,messagePurpose:"Surround the viewer with Pollock-like finale pressure through bright all-over drips, radial symbols, and layered atmospheric depth."},s){s.material?.dispose&&s.material.dispose();let o=new e.ShaderMaterial({name:"pollock_finale_pressure_shell",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uSeed:{value:h%997/997},uTime:{value:0},uPale:{value:new e.Color("#efe3c8")},uWarm:{value:new e.Color("#c8a05a")},uOlive:{value:new e.Color("#8b7a44")},uBlue:{value:new e.Color("#2a5fa8")},uTeal:{value:new e.Color("#33bfd1")},uInk:{value:new e.Color("#151619")},uWhite:{value:new e.Color("#fff7e8")}},vertexShader:`
 varying vec3 vDir;
 void main() {
 vDir = normalize(position);
 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
 }
 `,fragmentShader:`
 precision mediump float;
 uniform float uSeed;
 uniform float uTime;
 uniform vec3 uPale;
 uniform vec3 uWarm;
 uniform vec3 uOlive;
 uniform vec3 uBlue;
 uniform vec3 uTeal;
 uniform vec3 uInk;
 uniform vec3 uWhite;
 varying vec3 vDir;

 float hash(vec2 p) {
 p = fract(p * vec2(123.34, 456.21));
 p += dot(p, p + 45.32 + uSeed * 3.7);
 return fract(p.x * p.y);
 }

 float noise(vec2 p) {
 vec2 i = floor(p);
 vec2 f = fract(p);
 vec2 u = f * f * (3.0 - 2.0 * f);
 return mix(
 mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
 u.y
 );
 }

 float fbm(vec2 p) {
 float total = 0.0;
 float amp = 0.5;
 for (int i = 0; i < 5; i += 1) {
 total += noise(p) * amp;
 p = p * 2.03 + vec2(1.7, -0.9);
 amp *= 0.52;
 }
 return total;
 }

 float lineField(vec2 p, float angle, float freq, float width, float wobbleScale) {
 mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
 vec2 q = rot * p;
 float wobble = fbm(q * wobbleScale + vec2(uSeed * 4.0, -uSeed * 2.0));
 float wave = abs(sin(q.x * freq + wobble * 6.2831853));
 return smoothstep(width, 0.0, wave);
 }

 float ringField(vec2 uv, vec2 center, float radius, float width) {
 float d = abs(length(uv - center) - radius);
 return smoothstep(width, 0.0, d);
 }

 void main() {
 vec3 dir = normalize(vDir);
 vec2 uv = vec2(
 atan(dir.z, dir.x) / 6.2831853 + 0.5,
 asin(clamp(dir.y, -1.0, 1.0)) / 3.1415926 + 0.5
 );
 vec2 p = vec2(uv.x * 3.4, uv.y * 2.15);

 float baseNoise = fbm(p * 1.2 + vec2(0.0, uSeed * 2.0));
 float bluePool = smoothstep(0.52, 0.9, fbm(p * 1.8 + vec2(2.8, -0.7)));
 float tealPool = smoothstep(0.58, 0.92, fbm(p * 2.1 + vec2(-1.4, 1.1)));
 float oliveDrift = smoothstep(0.48, 0.84, fbm(p * 1.3 + vec2(1.6, 2.4)));

 vec3 color = mix(uPale, uWarm, smoothstep(0.24, 0.82, baseNoise));
 color = mix(color, uOlive, oliveDrift * 0.28);
 color = mix(color, uBlue, bluePool * 0.52);
 color = mix(color, uTeal, tealPool * 0.34);
 color = mix(color, uWhite, 0.22);

 float darkMass = smoothstep(0.56, 0.88, fbm(p * 0.95 + vec2(-2.3, 1.9)));
 float blackWeb = 0.0;
 blackWeb += lineField(p * 1.04 + vec2(0.25, 0.10), 0.72, 18.0, 0.13, 1.25);
 blackWeb += lineField(p * 1.12 + vec2(1.55, 0.28), -0.42, 22.0, 0.09, 1.75);
 blackWeb += lineField(p * 0.96 + vec2(-0.35, 0.86), 1.28, 14.0, 0.12, 1.05);
 blackWeb = clamp(blackWeb * 0.72 + darkMass * 0.48, 0.0, 1.0);

 float whiteSkein = 0.0;
 whiteSkein += lineField(p * 1.26 + vec2(0.32, -0.10), -1.04, 26.0, 0.085, 2.2);
 whiteSkein += lineField(p * 1.34 + vec2(1.40, 0.22), 0.18, 31.0, 0.065, 2.6);
 whiteSkein += lineField(p * 1.18 + vec2(-1.10, 0.38), 0.96, 22.0, 0.075, 2.0);
 whiteSkein = clamp(whiteSkein, 0.0, 1.0);

 float tealThread = lineField(p * 1.52 + vec2(-0.60, 0.18), 0.12, 34.0, 0.05, 2.4);
 tealThread += lineField(p * 1.46 + vec2(0.82, -0.28), -0.64, 29.0, 0.052, 2.1);
 tealThread = clamp(tealThread, 0.0, 1.0);

 float ochreTrace = lineField(p * 1.36 + vec2(0.90, 0.42), 1.02, 27.0, 0.05, 1.85);
 ochreTrace += lineField(p * 1.22 + vec2(-0.74, -0.18), -0.18, 21.0, 0.06, 1.75);
 ochreTrace = clamp(ochreTrace, 0.0, 1.0);

 float rings = 0.0;
 rings += ringField(uv, vec2(0.17, 0.28), 0.034, 0.0046);
 rings += ringField(uv, vec2(0.17, 0.28), 0.055, 0.0049);
 rings += ringField(uv, vec2(0.17, 0.28), 0.076, 0.0052);
 rings += ringField(uv, vec2(0.50, 0.19), 0.022, 0.0040);
 rings += ringField(uv, vec2(0.50, 0.19), 0.043, 0.0044);
 rings += ringField(uv, vec2(0.50, 0.19), 0.064, 0.0048);
 rings += ringField(uv, vec2(0.81, 0.76), 0.040, 0.0048);
 rings += ringField(uv, vec2(0.81, 0.76), 0.062, 0.0051);
 rings += ringField(uv, vec2(0.81, 0.76), 0.084, 0.0054);
 rings = clamp(rings, 0.0, 1.0);

 float splatter = smoothstep(0.86, 0.98, noise(p * 16.0 + vec2(4.0, -2.5)));
 splatter *= smoothstep(0.26, 0.88, fbm(p * 0.9 + vec2(-1.7, 2.4)));

 color = mix(color, uInk, blackWeb * 0.44);
 color = mix(color, uWhite, whiteSkein * 0.95);
 color = mix(color, uTeal, tealThread * 0.52);
 color = mix(color, uWarm, ochreTrace * 0.42);
 color = mix(color, vec3(0.92, 0.24, 0.12), splatter * 0.54);
 color = mix(color, vec3(0.96, 0.76, 0.16), splatter * 0.34 * step(0.54, noise(p * 28.0 + 3.1)));
 color = mix(color, vec3(0.93, 0.72, 0.22), rings * 0.78);
 color = mix(color, uTeal, rings * 0.26 * step(0.48, noise(uv * 23.0 + 6.2)));

 float vignette = 1.0 - smoothstep(0.72, 1.32, length(vec2((uv.x - 0.5) * 1.2, (uv.y - 0.53) * 1.4)));
 color *= mix(1.08, 1.24, vignette);
 gl_FragColor = vec4(color, 1.0);
 }
 `});s.material=o,s.castShadow=!1,s.receiveShadow=!1,s.frustumCulled=!1,l.material=o,l.mesh=s,l.object=l,d.push(o)}let u=new e.Group;u.name="pollock-drip-pressure-lines",u.renderOrder=-990,l.add(u);let C=["#111417","#f2eee2","#28afbf","#c69c37","#d84a26","#1f4b88"];for(let o=0;o<14;o+=1){let i=N(e,c,o),n=new e.LineBasicMaterial({color:C[o%C.length],transparent:!0,opacity:o%4===0?.94:.72,depthWrite:!1,depthTest:!0,toneMapped:!1}),p=new e.Line(i,n);p.name=o%4===0?`heavy-pressure-slash-${o}`:`looping-drip-line-${o}`,p.frustumCulled=!1,u.add(p),d.push(i,n)}let g=new e.Group;g.name="pollock-radial-symbol-field",g.renderOrder=-989,l.add(g);let v=[{x:-22,y:13,z:-24,scale:1.65,colors:["#d7a52a","#f3eee1","#2aa9b2"]},{x:1.5,y:15,z:-28,scale:1.2,colors:["#d7a52a","#f3eee1"]},{x:23,y:-14,z:-23,scale:1.55,colors:["#2aa9b2","#d7a52a","#f3eee1"]}];for(let o=0;o<v.length;o+=1){let i=new e.Group;i.position.set(v[o].x,v[o].y,v[o].z),i.rotation.z=(c()-.5)*.4,i.userData.spin=(c()-.5)*.06;for(let n=0;n<4;n+=1){let p=(1+n*.85)*v[o].scale,y=[],A=72;for(let I=0;I<=A;I+=1){let j=I/A*Math.PI*2;y.push(Math.cos(j)*p,Math.sin(j)*p,0)}let w=new e.BufferGeometry;w.setAttribute("position",new e.Float32BufferAttribute(y,3));let M=new e.LineBasicMaterial({color:v[o].colors[n%v[o].colors.length],transparent:!0,opacity:n===0?.78:.42,depthWrite:!1,depthTest:!0,toneMapped:!1}),_=new e.LineLoop(w,M);_.frustumCulled=!1,i.add(_),d.push(w,M)}g.add(i)}let S=980,x=new e.BufferGeometry,F=new Float32Array(S*3),P=new Float32Array(S*3),G=new Float32Array(S),D=new Float32Array(S),B=[new e.Color("#f4efe4"),new e.Color("#131519"),new e.Color("#c89e34"),new e.Color("#2aa9b2"),new e.Color("#204a8c"),new e.Color("#d54828"),new e.Color("#efe2bf")];for(let o=0;o<S;o+=1){let i=o%5,n=-8-c()*30,p=i<2?40:30,y=(c()-.5)*p+Math.sin(o*.37)*2.6,A=(c()-.5)*22+Math.cos(o*.23)*1.7;F[o*3]=y,F[o*3+1]=A,F[o*3+2]=n;let w=B[(o+Math.floor(c()*B.length))%B.length],M=.96+c()*.34;P[o*3]=w.r*M,P[o*3+1]=w.g*M,P[o*3+2]=w.b*M,G[o]=i===0?1+c()*1.5:.6+c()*1,D[o]=c()*Math.PI*2}x.setAttribute("position",new e.BufferAttribute(F,3)),x.setAttribute("color",new e.BufferAttribute(P,3)),x.setAttribute("aSize",new e.BufferAttribute(G,1)),x.setAttribute("aPhase",new e.BufferAttribute(D,1));let W=new e.ShaderMaterial({name:"pollock-floating-splatter-points",transparent:!0,depthWrite:!1,depthTest:!0,vertexColors:!0,toneMapped:!1,uniforms:{uTime:{value:0}},vertexShader:`
 attribute float aSize;
 attribute float aPhase;
 varying vec3 vColor;
 varying float vAlpha;
 uniform float uTime;
 void main() {
 vec3 transformed = position;
 transformed.x += sin(uTime * 0.06 + aPhase + position.y * 0.08) * 0.18;
 transformed.y += cos(uTime * 0.05 + aPhase + position.x * 0.06) * 0.12;
 vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
 float scale = clamp(180.0 / max(18.0, -mvPosition.z), 0.7, 3.6);
 gl_PointSize = aSize * scale * 9.0;
 vColor = color;
 vAlpha = clamp(0.38 + aSize * 0.14, 0.38, 0.72);
 gl_Position = projectionMatrix * mvPosition;
 }
 `,fragmentShader:`
 precision mediump float;
 varying vec3 vColor;
 varying float vAlpha;
 void main() {
 vec2 uv = gl_PointCoord - vec2(0.5);
 float dist = dot(uv, uv);
 float alpha = smoothstep(0.25, 0.01, dist) * vAlpha;
 if (alpha < 0.02) discard;
 gl_FragColor = vec4(vColor, alpha);
 }
 `}),z=new e.Points(x,W);z.name="pollock-splatter-depth-cloud",z.frustumCulled=!1,z.renderOrder=-988,l.add(z),d.push(x,W);function L({camera:o,time:i=0}={}){o?.position&&l.position.copy(o.position);let n=typeof i=="number"?i:0;s?.material?.uniforms?.uTime&&(s.material.uniforms.uTime.value=n),W.uniforms?.uTime&&(W.uniforms.uTime.value=n),u.rotation.z=Math.sin(n*.032+h*.001)*.018,u.rotation.y=Math.cos(n*.021+h*.002)*.014,g.children.forEach((p,y)=>{p.rotation.z+=(p.userData.spin||0)*.0025,p.position.y+=Math.sin(n*.12+y*1.9)*.002})}function O(){typeof b.dispose=="function"&&b.dispose();for(let o=0;o<d.length;o+=1){let i=d[o];i?.dispose&&i.dispose()}}return{object:l,update:L,dispose:O}}function q(e,a){let t=Number(e);return Number.isFinite(t)&&t>0?Math.max(28,Math.min(96,t)):a}function N(e,a,t){let r=[],m=28+t%5*4,f=-26+a()*12,h=12+a()*18,c=-12+a()*24,k=3+a()*8,b=-14-a()*18,l=2+a()*5,s=t%3===0?1.8:1.1;for(let d=0;d<m;d+=1){let u=d/Math.max(1,m-1),C=f+(h-f)*u+Math.sin(u*Math.PI*(2+s)+t)*l,g=c+Math.sin(u*Math.PI*(1+s)+t*.4)*k+Math.cos(u*Math.PI*5+t)*.9,v=b+Math.sin(u*Math.PI*(3+s)+t*.6)*(2.2+a()*1.8);r.push(new e.Vector3(C,g,v))}return new e.BufferGeometry().setFromPoints(r)}function V(e,a){let t=new e.Group,r=new e.SphereGeometry(a,48,24),m=new e.MeshBasicMaterial({color:"#d6cab2",side:e.BackSide,depthWrite:!1,depthTest:!0,toneMapped:!1}),f=new e.Mesh(r,m);return f.castShadow=!1,f.receiveShadow=!1,f.frustumCulled=!1,t.add(f),t.mesh=f,t.material=m,t.object=t,t.dispose=function(){r.dispose(),m.dispose()},t}function X(e){let a=2166136261;for(let t=0;t<e.length;t+=1)a^=e.charCodeAt(t),a=Math.imul(a,16777619);return a>>>0}function $(e){let a=e>>>0;return function(){a=a+1831565813|0;let r=Math.imul(a^a>>>15,1|a);return r^=r+Math.imul(r^r>>>7,61|r),((r^r>>>14)>>>0)/4294967296}}export{J as createImmersiveWorldPart};
