function V({THREE:o,part:O,world:z,seed:k,assets:U,utilities:I}){let s=new o.Group;s.name="world-environment";let C=String(k||"world-environment");function r(e){let a=2166136261,t=C+":"+e;for(let n=0;n<t.length;n++)a^=t.charCodeAt(n),a=Math.imul(a,16777619);return(a>>>0)/4294967295}let l={groundA:new o.Color("#d8d0bd"),groundB:new o.Color("#aeb9b5"),pale:new o.Color("#eee7d5"),ochre:new o.Color("#b7833e"),redOrange:new o.Color("#e95724"),ember:new o.Color("#c43d26"),violet:new o.Color("#705681"),blueEdge:new o.Color("#244e94"),charcoal:new o.Color("#11121c"),smoke:new o.Color("#5b5b55")},y={uTime:{value:0},uGroundA:{value:l.groundA},uGroundB:{value:l.groundB},uPale:{value:l.pale},uOchre:{value:l.ochre},uOrange:{value:l.redOrange},uViolet:{value:l.violet},uBlue:{value:l.blueEdge},uSeedA:{value:r(11)*8+1},uSeedB:{value:r(17)*8+1}},f=new o.ShaderMaterial({uniforms:y,side:o.DoubleSide,transparent:!1,depthWrite:!1,vertexShader:`
 varying vec2 vUv;
 varying vec3 vWorld;
 void main() {
 vUv = uv;
 vec4 w = modelMatrix * vec4(position, 1.0);
 vWorld = w.xyz;
 gl_Position = projectionMatrix * viewMatrix * w;
 }
 `,fragmentShader:`
 precision mediump float;
 varying vec2 vUv;
 varying vec3 vWorld;
 uniform float uTime;
 uniform float uSeedA;
 uniform float uSeedB;
 uniform vec3 uGroundA;
 uniform vec3 uGroundB;
 uniform vec3 uPale;
 uniform vec3 uOchre;
 uniform vec3 uOrange;
 uniform vec3 uViolet;
 uniform vec3 uBlue;

 float hash21(vec2 p) {
 p = fract(p * vec2(123.34, 456.21));
 p += dot(p, p + 45.32);
 return fract(p.x * p.y);
 }
 float noise(vec2 p) {
 vec2 i = floor(p);
 vec2 f = fract(p);
 f = f * f * (3.0 - 2.0 * f);
 float a = hash21(i);
 float b = hash21(i + vec2(1.0, 0.0));
 float c = hash21(i + vec2(0.0, 1.0));
 float d = hash21(i + vec2(1.0, 1.0));
 return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
 }
 float fbm(vec2 p) {
 float v = 0.0;
 float a = 0.5;
 for (int i = 0; i < 4; i++) {
 v += a * noise(p);
 p = p * 2.03 + 3.7;
 a *= 0.5;
 }
 return v;
 }
 float softBand(float x, float center, float width) {
 return 1.0 - smoothstep(width * 0.55, width, abs(x - center));
 }
 void main() {
 vec2 uv = vUv;
 vec2 p = uv * vec2(3.2, 2.0);
 float slow = sin(uTime * 0.18) * 0.025;
 float rubbed = fbm(p + vec2(uSeedA, uSeedB + slow));
 float weather = fbm(p * 2.8 + vec2(-uSeedB, uSeedA));
 float weaveX = abs(sin(uv.x * 720.0));
 float weaveY = abs(sin(uv.y * 480.0));
 float weave = (weaveX + weaveY) * 0.018;

 vec3 color = mix(uGroundA, uGroundB, smoothstep(0.18, 0.88, rubbed));
 color = mix(color, uPale, 0.25 * smoothstep(0.45, 0.85, weather));

 float verticalPressure = softBand(uv.x, 0.50 + slow, 0.18) * smoothstep(0.08, 0.9, uv.y);
 float orangeCap = softBand(uv.x, 0.51, 0.28) * smoothstep(0.62, 0.84, uv.y) * (1.0 - smoothstep(0.94, 1.0, uv.y));
 float blueEdge = (softBand(uv.x, 0.34, 0.035) + softBand(uv.x, 0.67, 0.04)) * smoothstep(0.18, 0.95, uv.y);
 float violetShadow = softBand(uv.x, 0.18, 0.22) * smoothstep(0.08, 0.75, uv.y) * (1.0 - smoothstep(0.80, 1.0, uv.y));
 float ochreWash = smoothstep(0.38, 0.72, fbm(uv * vec2(4.0, 1.4) + vec2(2.0, uSeedA)));

 color = mix(color, uOchre, 0.18 * ochreWash);
 color = mix(color, uViolet, 0.17 * violetShadow);
 color = mix(color, uOrange, 0.42 * orangeCap);
 color = mix(color, uBlue, 0.32 * blueEdge);
 color -= vec3(0.16, 0.14, 0.12) * verticalPressure * (0.55 + 0.45 * weather);
 color += weave;
 color = pow(max(color, vec3(0.0)), vec3(0.96));
 gl_FragColor = vec4(color, 1.0);
 }
 `}),p=new o.Mesh(new o.PlaneGeometry(28,18,1,1),f);p.name="matte-canvas-weathered-back-field",p.position.set(0,1.3,-13.5),s.add(p);let i=new o.Mesh(new o.PlaneGeometry(18,18,1,1),f.clone());i.name="left-surrounding-canvas-field",i.position.set(-10.8,1.2,-7.4),i.rotation.y=Math.PI*.36,s.add(i);let c=new o.Mesh(new o.PlaneGeometry(18,18,1,1),f.clone());c.name="right-surrounding-canvas-field",c.position.set(10.8,1.2,-7.4),c.rotation.y=-Math.PI*.36,s.add(c);let g=new o.MeshBasicMaterial({color:"#b9aa8d",transparent:!0,opacity:.42,side:o.DoubleSide,depthWrite:!1}),d=new o.Mesh(new o.PlaneGeometry(28,14,1,1),g);d.name="low-ochre-wash-floor-plane",d.rotation.x=-Math.PI/2,d.position.set(0,-4.4,-6.8),s.add(d);let M=["#eee7d5","#d9c154","#e95724","#244e94","#705681","#c1b9a6"],x=new o.PlaneGeometry(1,1,1,1);for(let e=0;e<22;e++){let a=new o.MeshBasicMaterial({color:M[e%M.length],transparent:!0,opacity:.11+r("plane-opacity-"+e)*.18,side:o.DoubleSide,depthWrite:!1}),t=new o.Mesh(x,a);t.name="shallow-geometric-plane-"+e;let n=(r("plane-x-"+e)-.5)*16;t.position.set(n,-2.2+r("plane-y-"+e)*8.6,-12.2+r("plane-z-"+e)*1.4),t.scale.set(1+r("plane-w-"+e)*5.4,.25+r("plane-h-"+e)*2.6,1),t.rotation.z=(r("plane-r-"+e)-.5)*.42,s.add(t)}let B=new o.MeshBasicMaterial({color:l.charcoal,transparent:!0,opacity:.52,side:o.DoubleSide,depthWrite:!1}),S=new o.MeshBasicMaterial({color:l.smoke,transparent:!0,opacity:.33,side:o.DoubleSide,depthWrite:!1}),G=new o.MeshBasicMaterial({color:"#d8c42f",transparent:!0,opacity:.48,side:o.DoubleSide,depthWrite:!1}),P=new o.PlaneGeometry(.055,1,1,1);for(let e=0;e<52;e++){let a=e%5===0?G:e%3===0?S:B,t=new o.Mesh(P,a);t.name="vertical-dry-drag-mark-"+e;let n=(r("mark-c-"+e)-.5)*4.2,m=(r("mark-x-"+e)-.5)*14;t.position.set(n*.6+m*.4,-2.4+r("mark-y-"+e)*9.3,-11.25+r("mark-z-"+e)*.35),t.scale.set(.6+r("mark-sw-"+e)*3.6,.35+r("mark-sh-"+e)*3.8,1),t.rotation.z=(r("mark-r-"+e)-.5)*.23,s.add(t)}let v=new o.Group;v.name="muted-radial-pressure-symbols";let h=[new o.MeshBasicMaterial({color:"#e95724",transparent:!0,opacity:.22,side:o.DoubleSide,depthWrite:!1}),new o.MeshBasicMaterial({color:"#244e94",transparent:!0,opacity:.18,side:o.DoubleSide,depthWrite:!1}),new o.MeshBasicMaterial({color:"#eee7d5",transparent:!0,opacity:.26,side:o.DoubleSide,depthWrite:!1})];for(let e=0;e<7;e++){let a=1.2+e*.52,t=new o.Mesh(new o.RingGeometry(a,a+.045+e*.006,96),h[e%h.length]);t.name="soft-radial-ring-"+e,t.position.set(.35,1,-10.85+e*.025),t.scale.y=.82,t.rotation.z=(r("ring-r-"+e)-.5)*.15,v.add(t)}s.add(v);let W=new o.CircleGeometry(1,48),w=[new o.MeshBasicMaterial({color:"#e95724",transparent:!0,opacity:.1,depthWrite:!1}),new o.MeshBasicMaterial({color:"#b7833e",transparent:!0,opacity:.12,depthWrite:!1}),new o.MeshBasicMaterial({color:"#705681",transparent:!0,opacity:.08,depthWrite:!1})],b=[];for(let e=0;e<10;e++){let a=new o.Mesh(W,w[e%w.length]);a.name="translucent-wash-bloom-"+e,a.position.set((r("bloom-x-"+e)-.5)*13.5,-1.8+r("bloom-y-"+e)*7.4,-10.6-r("bloom-z-"+e)*1.3);let t=1+r("bloom-s-"+e)*3.2;a.scale.set(t*(.7+r("bloom-oval-"+e)),t,1),b.push(a),s.add(a)}let u=[f,i.material,c.material,g,x,P,W,p.geometry,i.geometry,c.geometry,d.geometry];h.forEach(e=>u.push(e)),w.forEach(e=>u.push(e)),[B,S,G].forEach(e=>u.push(e));function D(e){let a=typeof e=="number"?e:0;y.uTime.value=a,i.material.uniforms&&(i.material.uniforms.uTime.value=a*.82),c.material.uniforms&&(c.material.uniforms.uTime.value=a*.93),v.rotation.z=Math.sin(a*.08)*.018;for(let t=0;t<b.length;t++){let n=b[t],m=1+Math.sin(a*.16+t*1.7)*.025;n.scale.x*=m/(n.userData.lastPulse||1),n.scale.y*=m/(n.userData.lastPulse||1),n.userData.lastPulse=m}}function A(){s.traverse(e=>{e.geometry&&u.indexOf(e.geometry)===-1&&e.geometry.dispose()});for(let e=0;e<u.length;e++)u[e]&&u[e].dispose&&u[e].dispose()}return{object:s,update:D,dispose:A}}export{V as createImmersiveWorldPart};
