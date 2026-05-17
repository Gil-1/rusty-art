var O="art-direction-packet-ee8329216073",F="ee8329216073e1ff73a3dda6a05abb66";function G(e){let t=String(e??"artist-mark-field-clyfford-still-vienna"),s=2166136261;for(let l=0;l<t.length;l+=1)s^=t.charCodeAt(l),s=Math.imul(s,16777619);return s>>>0}function z(e,t,s){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(t,s);let l=(G(t)^G(s))>>>0;return function(){l=l+1831565813>>>0;let a=l;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}function W(e){let t=Math.max(0,Math.min(1,e));return t*t*(3-2*t)}function j(e,t=96){let s=new Uint8Array(t*t*4),l=(t-1)*.5,u=t*.43;for(let r=0;r<t;r+=1)for(let o=0;o<t;o+=1){let d=Math.hypot(o-l,r-l),c=W((u-d)/(t*.18)),h=.82+.18*Math.sin(o*12.9898+r*78.233),f=(r*t+o)*4;s[f]=255,s[f+1]=255,s[f+2]=255,s[f+3]=Math.round(c*h*255)}let a=new e.DataTexture(s,t,t,e.RGBAFormat);return a.name="artist-mark-field-soft-pigment-sprite",a.wrapS=e.ClampToEdgeWrapping,a.wrapT=e.ClampToEdgeWrapping,a.minFilter=e.LinearFilter,a.magFilter=e.LinearFilter,a.generateMipmaps=!1,a.needsUpdate=!0,a}function A(e,{color:t,scrape:s="#e6dcc1",dark:l="#090909",opacity:u=1,transparent:a=!1,scrapeStrength:r=.22,grainStrength:o=.1,edgeDarken:d=.12,drift:c=.025,depthWrite:h=!0}){return new e.ShaderMaterial({name:"clyfford-still-matte-scraped-mark-field",side:e.DoubleSide,transparent:a||u<1,depthWrite:h&&u>.92,depthTest:!0,toneMapped:!1,fog:!1,uniforms:{uColor:{value:new e.Color(t)},uScrape:{value:new e.Color(s)},uDark:{value:new e.Color(l)},uOpacity:{value:u},uTime:{value:0},uScrapeStrength:{value:r},uGrainStrength:{value:o},uEdgeDarken:{value:d},uDrift:{value:c}},vertexShader:`
      varying vec2 vUv;
      varying vec3 vLocal;
      void main() {
        vUv = uv;
        vLocal = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec2 vUv;
      varying vec3 vLocal;
      uniform vec3 uColor;
      uniform vec3 uScrape;
      uniform vec3 uDark;
      uniform float uOpacity;
      uniform float uTime;
      uniform float uScrapeStrength;
      uniform float uGrainStrength;
      uniform float uEdgeDarken;
      uniform float uDrift;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 37.17);
        return fract(p.x * p.y);
      }

      float noise2(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
          mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm2(vec2 p) {
        float value = 0.0;
        float amp = 0.55;
        for (int i = 0; i < 5; i++) {
          value += amp * noise2(p);
          p = p * 2.08 + vec2(9.4, 3.7);
          amp *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 domain = vUv + vec2(uTime * uDrift, -uTime * uDrift * 0.62);
        float broad = fbm2(domain * vec2(7.0, 4.2) + vec2(3.1, 1.7));
        float dry = fbm2(domain * vec2(34.0, 45.0) + vec2(8.1, 2.4));
        float grit = noise2(domain * 180.0 + vec2(11.0, 5.0));
        float vertical = pow(abs(sin((domain.x * 52.0 + broad * 2.7) * 3.14159265)), 20.0);
        vertical *= smoothstep(0.42, 0.88, fbm2(vec2(domain.x * 8.0, domain.y * 34.0)));
        float scratch = smoothstep(0.78, 0.96, dry) * 0.16 + vertical * uScrapeStrength;
        float edge = 1.0 - min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 2.0;
        vec3 color = mix(uColor, uScrape, clamp(scratch, 0.0, 0.48));
        color = mix(color, uDark, edge * uEdgeDarken);
        color *= 0.9 + broad * uGrainStrength + (grit - 0.5) * uGrainStrength * 0.8;
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
      }
    `})}function C(e,t,{rows:s=110,yMin:l=-5,yMax:u=5,left:a,right:r,roughness:o=.22,zRipple:d=.035}){let c=[],h=[],f=[],g=t()*Math.PI*2,y=t()*Math.PI*2;for(let m=0;m<=s;m+=1){let n=m/s,b=l+(u-l)*n,M=Math.sin(n*Math.PI*4+g)*o,S=Math.sin(n*Math.PI*17+y)*o*.28,x=(t()-.5)*o*.9,I=a(n,b)-M*.38-x*.16,i=r(n,b)+M+S+x,p=Math.sin(n*Math.PI*6+y)*d+(t()-.5)*d;c.push(I,b,p,i,b,-p),h.push(0,n,1,n)}for(let m=0;m<s;m+=1){let n=m*2;f.push(n,n+2,n+1,n+1,n+2,n+3)}let v=new e.BufferGeometry;return v.setAttribute("position",new e.Float32BufferAttribute(c,3)),v.setAttribute("uv",new e.Float32BufferAttribute(h,2)),v.setIndex(f),v.computeVertexNormals(),v.computeBoundingSphere(),v}function U(e,t,{columns:s=120,xMin:l=-8,xMax:u=8,bottom:a,top:r,roughness:o=.18,zRipple:d=.03}){let c=[],h=[],f=[],g=t()*Math.PI*2,y=t()*Math.PI*2;for(let m=0;m<=s;m+=1){let n=m/s,b=l+(u-l)*n,M=Math.sin(n*Math.PI*5+g)*o,S=Math.sin(n*Math.PI*19+y)*o*.24,x=(t()-.5)*o*.8,I=a(n,b)-M*.2-x*.14,i=r(n,b)+M+S+x,p=Math.sin(n*Math.PI*7+g)*d;c.push(b,I,p,b,i,-p),h.push(n,0,n,1)}for(let m=0;m<s;m+=1){let n=m*2;f.push(n,n+2,n+1,n+1,n+2,n+3)}let v=new e.BufferGeometry;return v.setAttribute("position",new e.Float32BufferAttribute(c,3)),v.setAttribute("uv",new e.Float32BufferAttribute(h,2)),v.setIndex(f),v.computeVertexNormals(),v.computeBoundingSphere(),v}function V(e,{radius:t=2,width:s=.05,start:l=0,end:u=Math.PI,segments:a=80,wobble:r=.05}){let o=[],d=[],c=[];for(let f=0;f<=a;f+=1){let g=f/a,y=l+(u-l)*g,v=Math.sin(g*Math.PI*6+t)*r+Math.sin(g*Math.PI*17)*r*.25,m=t-s*.5+v,n=t+s*.5+v*.62;o.push(Math.cos(y)*m,Math.sin(y)*m,0),o.push(Math.cos(y)*n,Math.sin(y)*n,0),d.push(g,0,g,1)}for(let f=0;f<a;f+=1){let g=f*2;c.push(g,g+2,g+1,g+1,g+2,g+3)}let h=new e.BufferGeometry;return h.setAttribute("position",new e.Float32BufferAttribute(o,3)),h.setAttribute("uv",new e.Float32BufferAttribute(d,2)),h.setIndex(c),h.computeVertexNormals(),h.computeBoundingSphere(),h}function L(e,t,s){let u=new Float32Array(2160),a=new Float32Array(720*3),r=new Float32Array(720),o=[new e.Color("#e6dcc1"),new e.Color("#c98514"),new e.Color("#5b0717"),new e.Color("#1e6b70"),new e.Color("#111018"),new e.Color("#6db5ad")];for(let f=0;f<720;f+=1){let g=t(),y,v,m;if(g<.62){let M=t()*Math.PI*2,S=1.1+t()*4.1;y=Math.cos(M)*S+.5+(t()-.5)*1.3,v=Math.sin(M)*S*.48-.95+(t()-.5)*.9,m=-4.3-t()*4.4}else g<.84?(y=-8.6+t()*5.6,v=-3.7+t()*8.8,m=-6.8-t()*5.2):(y=3.6+t()*7.3,v=-2.9+t()*7.3,m=-7.2-t()*7.8);u[f*3]=y,u[f*3+1]=v,u[f*3+2]=m;let n=o[Math.floor(t()*o.length)%o.length],b=.48+t()*.6;a[f*3]=n.r*b,a[f*3+1]=n.g*b,a[f*3+2]=n.b*b,r[f]=8+t()*26+(g<.62?t()*18:0)}let d=new e.BufferGeometry;d.setAttribute("position",new e.BufferAttribute(u,3)),d.setAttribute("color",new e.BufferAttribute(a,3)),d.setAttribute("aSize",new e.BufferAttribute(r,1));let c=new e.ShaderMaterial({name:"artist-mark-field-soft-splatter-particles",transparent:!0,depthWrite:!1,depthTest:!0,blending:e.NormalBlending,toneMapped:!1,fog:!1,uniforms:{uSprite:{value:s},uOpacity:{value:.7},uTime:{value:0}},vertexShader:`
      attribute float aSize;
      varying vec3 vColor;
      uniform float uTime;
      void main() {
        vColor = color;
        vec3 pos = position;
        pos.x += sin(uTime * 0.11 + position.y * 0.72) * 0.045;
        pos.y += cos(uTime * 0.09 + position.x * 0.51) * 0.028;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (270.0 / max(130.0, -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vColor;
      uniform sampler2D uSprite;
      uniform float uOpacity;
      void main() {
        float alpha = texture2D(uSprite, gl_PointCoord).a;
        if (alpha < 0.025) discard;
        gl_FragColor = vec4(vColor, alpha * uOpacity);
      }
    `}),h=new e.Points(d,c);return h.name="dense-spatial-splatter-field-low-concentrated-protest-pressure",h.renderOrder=56,h.frustumCulled=!1,{object:h,geometry:d,material:c}}function _(e,t){let l=new Float32Array(1260),u=new Float32Array(420*3),a=[new e.Color("#e6dcc1"),new e.Color("#b9ad92"),new e.Color("#111018"),new e.Color("#c98514"),new e.Color("#1e6b70")];for(let c=0;c<210;c+=1){let f=t()<.5?-9.5+t()*7.1:2.3+t()*9.4,g=-4.7+t()*9.8,y=-5.4-t()*9.6,v=.5+t()*2.2,m=(t()-.5)*.55,n=Math.sin(m)*v*.28,b=Math.cos(m)*v,M=c*6;l[M]=f-n,l[M+1]=g-b*.5,l[M+2]=y,l[M+3]=f+n,l[M+4]=g+b*.5,l[M+5]=y-t()*.12;let S=a[Math.floor(t()*a.length)%a.length],x=.38+t()*.48;u[M]=S.r*x,u[M+1]=S.g*x,u[M+2]=S.b*x,u[M+3]=S.r*x,u[M+4]=S.g*x,u[M+5]=S.b*x}let r=new e.BufferGeometry;r.setAttribute("position",new e.BufferAttribute(l,3)),r.setAttribute("color",new e.BufferAttribute(u,3)),r.computeBoundingSphere();let o=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:.72,depthWrite:!1,depthTest:!0,toneMapped:!1}),d=new e.LineSegments(r,o);return d.name="vertical-dry-scraped-canvas-hatching-field",d.renderOrder=52,d.frustumCulled=!1,{object:d,geometry:r,material:o}}function P(e,t,s,l,u,{position:a=[0,0,0],rotation:r=[0,0,0],scale:o=[1,1,1],renderOrder:d=0}={}){let c=new t.Mesh(l,u);return c.name=s,c.position.set(a[0],a[1],a[2]),c.rotation.set(r[0],r[1],r[2]),c.scale.set(o[0],o[1],o[2]),c.renderOrder=d,c.frustumCulled=!1,c.castShadow=!1,c.receiveShadow=!1,c.userData.baseX=c.position.x,c.userData.baseY=c.position.y,c.userData.baseZ=c.position.z,c.userData.baseRotationZ=c.rotation.z,e.add(c),c}function N(e,t=[]){e.traverse?.(s=>{s.geometry&&typeof s.geometry.dispose=="function"&&s.geometry.dispose();let l=Array.isArray(s.material)?s.material:[s.material].filter(Boolean);for(let u of l)if(u){for(let a of["map","alphaMap"])u[a]&&typeof u[a].dispose=="function"&&u[a].dispose();typeof u.dispose=="function"&&u.dispose()}});for(let s of t)s&&typeof s.dispose=="function"&&s.dispose()}function Z({THREE:e,part:t,world:s,seed:l,camera:u,utilities:a}={}){let r=z(a,l||t?.id||"artist-mark-field","clyfford-still-vienna-artist-mark-field"),o=new e.Group;o.name="artist-mark-field-clyfford-still-vienna-spatial-style-system",o.position.set(0,0,0),o.scale.set(1.46,1.38,1),o.userData={partId:"artist-mark-field",role:"artist-style-system",packetId:O,packetHash:F,newsSignal:"vienna-protest-eurovision-final-fracture-pressure",skybox:!1,immersiveWorldEnvironmentShell:!1};let d={black:A(e,{color:"#070808",scrape:"#31291f",dark:"#020202",scrapeStrength:.14,grainStrength:.13,edgeDarken:.03}),bone:A(e,{color:"#e3d8ba",scrape:"#fff2c9",dark:"#17130f",scrapeStrength:.36,grainStrength:.14,edgeDarken:.2}),ochre:A(e,{color:"#c98514",scrape:"#f0cc70",dark:"#2a1614",scrapeStrength:.24,grainStrength:.12,edgeDarken:.16}),burgundy:A(e,{color:"#530715",scrape:"#913516",dark:"#090303",scrapeStrength:.16,grainStrength:.12,edgeDarken:.12}),teal:A(e,{color:"#165f67",scrape:"#6db5ad",dark:"#06161a",scrapeStrength:.2,grainStrength:.11,edgeDarken:.12}),ash:A(e,{color:"#afa391",scrape:"#e7dcc2",opacity:.68,transparent:!0,depthWrite:!1,scrapeStrength:.26,grainStrength:.12,edgeDarken:.18}),paleVeil:A(e,{color:"#e6dcc1",scrape:"#fff1cd",opacity:.48,transparent:!0,depthWrite:!1,scrapeStrength:.42,grainStrength:.16,edgeDarken:.24}),darkVeil:A(e,{color:"#0a0908",scrape:"#282018",opacity:.42,transparent:!0,depthWrite:!1,scrapeStrength:.18,grainStrength:.1,edgeDarken:.06})},c=Object.values(d),h=[];h.push(P(o,e,"left-charred-artist-mark-wall-with-torn-bearing-edge",C(e,r,{yMin:-6.4,yMax:6.2,left:()=>-9.7,right:(i,p)=>-2.1+Math.sin(i*Math.PI*2.4)*.58-p*.045,roughness:.42,zRipple:.05}),d.black,{position:[-.55,.1,-8.5],rotation:[.02,.28,-.02],scale:[1.16,1.18,1],renderOrder:20})),h.push(P(o,e,"right-ochre-final-pressure-slab-scraped-vertical-mass",C(e,r,{yMin:-5.7,yMax:6.8,left:(i,p)=>1.05+Math.sin(i*Math.PI*3.1+.7)*.3+p*.035,right:()=>6.7,roughness:.36,zRipple:.045}),d.ochre,{position:[2.15,.42,-7.9],rotation:[-.01,-.22,.015],scale:[1.06,1.15,1],renderOrder:24})),h.push(P(o,e,"exposed-bone-fracture-field-crossing-between-masses",C(e,r,{yMin:-5.8,yMax:5.3,left:(i,p)=>-1.2+Math.sin(i*Math.PI*4)*.42+p*.035,right:(i,p)=>1.9+Math.sin(i*Math.PI*3.5+1.1)*.45-p*.055,roughness:.44,zRipple:.04}),d.bone,{position:[-.2,-.24,-6.75],rotation:[.015,.04,-.035],scale:[1.12,1.17,1],renderOrder:32})),h.push(P(o,e,"low-burgundy-ground-surge-crowd-compression-band",U(e,r,{xMin:-10.5,xMax:10.3,bottom:()=>-5.25,top:(i,p)=>-3.05+Math.sin(i*Math.PI*2.2)*.34-p*.012,roughness:.28,zRipple:.045}),d.burgundy,{position:[0,-.2,-5.45],rotation:[-.03,.015,.005],scale:[1.12,1.06,1],renderOrder:34})),h.push(P(o,e,"thin-teal-cool-counterpoint-torn-pressure-fissure",C(e,r,{yMin:-4.7,yMax:2.9,left:i=>-.28+Math.sin(i*Math.PI*5.2)*.12,right:i=>.26+Math.sin(i*Math.PI*8+.8)*.16,roughness:.2,zRipple:.025}),d.teal,{position:[.62,-.82,-4.75],rotation:[.02,-.02,-.02],scale:[1.22,1.25,1],renderOrder:42})),h.push(P(o,e,"far-ash-scraped-structural-plane-right-depth",C(e,r,{yMin:-5,yMax:5.6,left:(i,p)=>-.55+p*.025,right:()=>2.2,roughness:.32,zRipple:.035}),d.ash,{position:[8,.28,-12],rotation:[.02,-.5,-.02],scale:[1.15,1.1,1],renderOrder:18})),h.push(P(o,e,"near-pale-scrape-veil-not-enclosing-fracture-edge",C(e,r,{yMin:-4.5,yMax:4.1,left:(i,p)=>-.48+Math.sin(i*Math.PI*6)*.12+p*.015,right:(i,p)=>.62+Math.sin(i*Math.PI*7.5)*.16-p*.012,roughness:.24,zRipple:.025}),d.paleVeil,{position:[-5.05,.05,-3.35],rotation:[0,.58,-.03],scale:[1.42,1.32,1],renderOrder:48})),h.push(P(o,e,"near-dark-scraped-counter-veil-right-viewer-pressure",C(e,r,{yMin:-4.2,yMax:4.8,left:()=>-.54,right:(i,p)=>.82+Math.sin(i*Math.PI*5.5+.5)*.18-p*.02,roughness:.26,zRipple:.025}),d.darkVeil,{position:[5.75,.28,-3.55],rotation:[0,-.55,.025],scale:[1.38,1.34,1],renderOrder:46}));let f=[A(e,{color:"#c98514",scrape:"#f0cc70",opacity:.46,transparent:!0,depthWrite:!1,scrapeStrength:.2,grainStrength:.12,edgeDarken:.1}),A(e,{color:"#080909",scrape:"#30251c",opacity:.52,transparent:!0,depthWrite:!1,scrapeStrength:.13,grainStrength:.08,edgeDarken:.04}),A(e,{color:"#1e6b70",scrape:"#6db5ad",opacity:.38,transparent:!0,depthWrite:!1,scrapeStrength:.16,grainStrength:.1,edgeDarken:.08})];c.push(...f);let g=new e.Group;g.name="broken-radial-finale-pressure-symbol-field",g.position.set(.85,-.72,-5.35),g.rotation.set(.05,-.05,-.04),g.scale.set(1.28,.86,1),o.add(g);for(let i=0;i<9;i+=1){let p=1.35+i*.48,k=-2.7+r()*.45,D=2.55-r()*.35,w=new e.Mesh(V(e,{radius:p,width:.045+i*.006,start:k,end:D,segments:72,wobble:.035+r()*.03}),f[i%f.length]);w.name=`broken-radial-finale-mark-arc-${i+1}`,w.position.z=-i*.06,w.rotation.z=(r()-.5)*.22,w.renderOrder=58+i,w.frustumCulled=!1,w.userData.baseRotationZ=w.rotation.z,w.userData.phase=r()*Math.PI*2,g.add(w),h.push(w)}let y=_(e,r);o.add(y.object);let v=j(e),m=L(e,r,v);o.add(m.object),c.push(m.material,y.material);let n=new e.PlaneGeometry(1,1,1,1),b=[new e.MeshBasicMaterial({color:"#e6dcc1",transparent:!0,opacity:.34,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1}),new e.MeshBasicMaterial({color:"#c98514",transparent:!0,opacity:.24,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1}),new e.MeshBasicMaterial({color:"#0c0b0a",transparent:!0,opacity:.32,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1}),new e.MeshBasicMaterial({color:"#1e6b70",transparent:!0,opacity:.22,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1})],M=[],S=new e.Object3D;for(let i=0;i<b.length;i+=1){let p=new e.InstancedMesh(n,b[i],44);p.name=`floating-geometric-plane-scrape-shards-${i+1}`,p.renderOrder=44+i,p.frustumCulled=!1;for(let k=0;k<44;k+=1){let D=r()<.56?-1:1;S.position.set(D*(2.9+r()*7.4),-4.1+r()*9,-5.2-r()*8.2),S.rotation.set((r()-.5)*.2,D*(.18+r()*.58),(r()-.5)*.48),S.scale.set(.08+r()*.22,.55+r()*2.3,1),S.updateMatrix(),p.setMatrixAt(k,S.matrix)}p.instanceMatrix.needsUpdate=!0,o.add(p),M.push(p)}function x(i={}){let p=i.captureMode?0:Number(i.elapsedSeconds??i.time??0),k=Number.isFinite(p)?p:0;for(let D of c)D?.uniforms?.uTime&&(D.uniforms.uTime.value=k);g.rotation.z=-.04+Math.sin(k*.045)*.018;for(let D=0;D<h.length;D+=1){let w=h[D],B=w.userData.phase??D*.73;w.userData.baseY!==void 0&&(w.position.y=w.userData.baseY+Math.sin(k*.09+B)*.045),w.userData.baseRotationZ!==void 0&&(w.rotation.z=w.userData.baseRotationZ+Math.sin(k*.055+B)*.012)}y.object.rotation.z=Math.sin(k*.035)*.006,m.object.rotation.y=Math.sin(k*.032)*.018}function I(){N(o,[v,n])}return x({captureMode:!0,elapsedSeconds:0,camera:u}),{object:o,update:x,dispose:I,userData:{partId:"artist-mark-field",packetId:O,packetHash:F,ownsSingleSkyboxShell:!1}}}export{Z as createImmersiveWorldPart};
