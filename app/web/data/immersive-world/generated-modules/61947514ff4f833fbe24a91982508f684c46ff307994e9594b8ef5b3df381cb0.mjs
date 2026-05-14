function L({THREE:a,part:Y,world:C,seed:W,assets:_,utilities:V}){let U="art-direction-packet-d42ae65eda84",D="d42ae65eda84fc46c5d773d440c03442",p=new a.Group;p.name="non-literal-fracture-pressure",p.userData.packetId=U,p.userData.packetHash=D,p.userData.partId="non-literal-fracture-pressure";let d=[],j=String(W||D||"pressure");function u(e){let i=2166136261,s=j+":"+e;for(let t=0;t<s.length;t++)i^=s.charCodeAt(t),i=Math.imul(i,16777619);return(i>>>0)%1e5/1e5}function h(e){return new a.Color(e)}let v={uTime:{value:0},uPulse:{value:0}},b=new a.PlaneGeometry(1,1,1,1);d.push(b);function z(e,i,s,t,o,l,n){let c=new a.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!0,side:a.DoubleSide,uniforms:{uTime:v.uTime,uPulse:v.uPulse,uTop:{value:h(e)},uBottom:{value:h(i)},uEdge:{value:h(s)},uAlpha:{value:t},uGrain:{value:o},uSeam:{value:l},uDrift:{value:u(n)*6.28318530718}},vertexShader:`
 varying vec2 vUv;
 void main() {
 vUv = uv;
 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
 }
 `,fragmentShader:`
 precision mediump float;
 varying vec2 vUv;
 uniform vec3 uTop;
 uniform vec3 uBottom;
 uniform vec3 uEdge;
 uniform float uAlpha;
 uniform float uGrain;
 uniform float uSeam;
 uniform float uTime;
 uniform float uPulse;
 uniform float uDrift;
 float hash(vec2 p) {
 p = fract(p * vec2(123.34, 456.21));
 p += dot(p, p + 45.32);
 return fract(p.x * p.y);
 }
 float noise(vec2 p) {
 vec2 i = floor(p);
 vec2 f = fract(p);
 float a = hash(i);
 float b = hash(i + vec2(1.0, 0.0));
 float c = hash(i + vec2(0.0, 1.0));
 float d = hash(i + vec2(1.0, 1.0));
 vec2 u = f * f * (3.0 - 2.0 * f);
 return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
 }
 void main() {
 vec2 p = vUv;
 float n1 = noise(p * 11.0 + uDrift);
 float n2 = noise(p * 37.0 - uDrift);
 float weave = sin((p.x + n1 * 0.02) * 170.0) * sin((p.y + n2 * 0.02) * 128.0);
 float vertical = smoothstep(0.0, 1.0, p.y + (n1 - 0.5) * 0.18);
 vec3 col = mix(uBottom, uTop, vertical);
 float edgeX = smoothstep(0.0, 0.10, p.x) * smoothstep(1.0, 0.90, p.x);
 float edgeY = smoothstep(0.0, 0.13, p.y) * smoothstep(1.0, 0.87, p.y);
 float inside = edgeX * edgeY;
 float border = 1.0 - smoothstep(0.50, 0.96, inside);
 float seamFog = exp(-abs(p.y - uSeam + (n1 - 0.5) * 0.05) * 16.0);
 col = mix(col, uEdge, border * 0.42 + seamFog * 0.20);
 col *= 0.84 + n1 * uGrain + weave * 0.022 + uPulse * 0.035;
 float a = uAlpha * smoothstep(0.01, 0.16, inside);
 gl_FragColor = vec4(col, a);
 }
 `});return d.push(c),c}function M(e,i,s,t,o,l,n,c,g,r,X){let f=new a.Mesh(b,z(l,n,c,g,r,X,e));return f.name=e,f.scale.set(i,s,1),f.position.set(0,t,o),f.castShadow=!1,f.receiveShadow=!1,p.add(f),f}let q=M("absorbing-near-black-canvas",9.4,6.2,0,-9.6,"#25101b","#120912","#4b231d",.94,.2,.48),J=M("upper-smoky-maroon-pressure-field",8.3,2.75,1.16,-9.15,"#6c1d22","#391722","#160b12",.9,.24,.22),K=M("lower-ochre-earth-weight-field",8.05,2.25,-1.47,-9.05,"#a16d21","#3b2518","#17100f",.86,.2,.72),A=M("central-dark-emotional-hinge-band",8.55,.62,-.08,-8.82,"#23121c","#11080d","#030204",.96,.18,.52),x=new a.MeshBasicMaterial({color:h("#12080a"),transparent:!0,opacity:.74,depthWrite:!1,side:a.DoubleSide}),S=new a.MeshBasicMaterial({color:h("#d7331f"),transparent:!0,opacity:.82,depthWrite:!1,side:a.DoubleSide}),k=new a.MeshBasicMaterial({color:h("#184c9f"),transparent:!0,opacity:.72,depthWrite:!1,side:a.DoubleSide}),P=new a.MeshBasicMaterial({color:h("#1a6d64"),transparent:!0,opacity:.34,depthWrite:!1,side:a.DoubleSide});d.push(x,S,k,P);let y=[];function B(e,i,s,t,o,l,n,c,g){let r=new a.Mesh(b,i);return r.name=e,r.position.set(s,t,o),r.rotation.z=c,r.scale.set(l,n,1),r.userData.baseX=s,r.userData.baseY=t,r.userData.baseRot=c,r.userData.phase=g,r.castShadow=!1,r.receiveShadow=!1,p.add(r),y.push(r),r}for(let e=0;e<34;e++){let s=-3.9+e/33*7.8+(u("jitter-x-"+e)-.5)*.22,t=-.11+(u("jitter-y-"+e)-.5)*.3,o=.2+u("w-"+e)*.56,l=.02+u("h-"+e)*.07,n=(u("r-"+e)-.5)*.22,c=e%9===2?S:e%13===5?k:x;B("broken-pressure-contour-"+e,c,s,t,-8.55-e*.002,o,l,n,u("phase-"+e)*6.28318530718)}for(let e=0;e<18;e++){let i=-3.6+u("teal-x-"+e)*7.2,s=-1.05+u("teal-y-"+e)*1.85,t=.1+u("teal-w-"+e)*.35,o=.015+u("teal-h-"+e)*.045;B("submerged-cool-counterpoint-"+e,P,i,s,-8.62-e*.001,t,o,(u("teal-r-"+e)-.5)*.7,u("teal-p-"+e)*6.28318530718)}let w=new a.MeshBasicMaterial({color:h("#42141d"),transparent:!0,opacity:.28,depthWrite:!1,side:a.DoubleSide});d.push(w);let G=new a.RingGeometry(.78,.82,96);d.push(G);let m=new a.Mesh(G,w);m.name="muted-radial-pressure-memory",m.position.set(.28,-.1,-8.72),m.scale.set(1.8,.46,1),p.add(m),p.position.set(0,0,0);function I(e){let s=e&&e.captureMode?1.75:e&&(e.elapsedSeconds??e.time)||0,t=e&&typeof e.motionIntensity=="number"?e.motionIntensity:1,o=s*.36;v.uTime.value=s,v.uPulse.value=(.5+.5*Math.sin(o*1.7))*.45*t,p.position.z=Math.sin(o)*.055*t,A.scale.y=.62*(1+Math.sin(o*1.4)*.035*t),m.rotation.z=Math.sin(o*.7)*.018*t,w.opacity=.2+(.5+.5*Math.sin(o*1.1))*.1;for(let l=0;l<y.length;l++){let n=y[l],c=n.userData.phase||0;n.position.x=n.userData.baseX+Math.sin(o+c)*.018*t,n.position.y=n.userData.baseY+Math.cos(o*.8+c)*.012*t,n.rotation.z=n.userData.baseRot+Math.sin(o*.9+c)*.012*t}}function F(){for(let e=0;e<d.length;e++)d[e]&&d[e].dispose&&d[e].dispose()}return I({elapsedSeconds:0,motionIntensity:1,captureMode:!1}),{object:p,update:I,dispose:F}}export{L as createImmersiveWorldPart};
