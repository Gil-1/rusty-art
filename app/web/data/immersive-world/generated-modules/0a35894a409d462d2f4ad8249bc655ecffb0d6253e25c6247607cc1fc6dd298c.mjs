var z="art-direction-packet-f76c1ba9fd3e",F="f76c1ba9fd3ed6a8fae0806d5d83ab62",P="non-literal-fracture-pressure";function A(e){let r=2166136261,i=String(e??P);for(let a=0;a<i.length;a+=1)r^=i.charCodeAt(a),r=Math.imul(r,16777619);return r>>>0}function B(e,r,i){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(r,i);let a=(A(r)^A(i))>>>0;return function(){a=a+1831565813>>>0;let o=a;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296}}function L(e,r){return new e.ShaderMaterial({name:r.name,transparent:!0,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uColor:{value:new e.Color(r.color)},uUnder:{value:new e.Color(r.underColor||"#d7c19a")},uDark:{value:new e.Color(r.darkColor||"#080706")},uOpacity:{value:r.opacity??1},uSeed:{value:r.seed??1},uRagged:{value:r.ragged??.11},uFeather:{value:r.feather??.045},uScrape:{value:r.scrape??.34},uChip:{value:r.chip??.22},uLean:{value:r.lean??0}},vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uUnder;
      uniform vec3 uDark;
      uniform float uOpacity;
      uniform float uSeed;
      uniform float uRagged;
      uniform float uFeather;
      uniform float uScrape;
      uniform float uChip;
      uniform float uLean;
      varying vec2 vUv;

      float saturate(float x) { return clamp(x, 0.0, 1.0); }
      float hash21(vec2 p) {
        p = fract(p * vec2(127.1, 311.7));
        p += dot(p, p + 74.7 + uSeed);
        return fract(p.x * p.y);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i += 1) {
          v += noise(p) * a;
          p = p * 2.07 + vec2(8.3, 13.1);
          a *= 0.5;
        }
        return v;
      }
      float tornEdge(vec2 uv) {
        float slow = sin(uTime * 0.05 + uSeed) * 0.004;
        float nL = fbm(vec2(uv.y * 5.8 + uSeed, uv.x * 1.7));
        float nR = fbm(vec2(uv.y * 5.4 - uSeed, uv.x * 1.3 + 9.0));
        float nB = fbm(vec2(uv.x * 4.8 + uSeed * 1.7, uv.y * 1.9));
        float nT = fbm(vec2(uv.x * 5.2 - uSeed * 0.6, uv.y * 1.5 + 4.0));
        float biteL = smoothstep(0.18, 0.88, uv.y) * (nL - 0.5) * uRagged + uLean * (uv.y - 0.5) + slow;
        float biteR = smoothstep(0.08, 0.92, uv.y) * (nR - 0.5) * uRagged - uLean * 0.45 * (uv.y - 0.5) - slow;
        float biteB = (nB - 0.5) * uRagged * 0.55;
        float biteT = (nT - 0.5) * uRagged * 0.55;
        float aL = smoothstep(biteL, biteL + uFeather, uv.x);
        float aR = 1.0 - smoothstep(1.0 + biteR - uFeather, 1.0 + biteR, uv.x);
        float aB = smoothstep(biteB, biteB + uFeather, uv.y);
        float aT = 1.0 - smoothstep(1.0 + biteT - uFeather, 1.0 + biteT, uv.y);
        return aL * aR * aB * aT;
      }
      void main() {
        vec2 uv = vUv;
        float alpha = tornEdge(uv) * uOpacity;
        float edgePressure = 1.0 - smoothstep(0.05, 0.34, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
        float weave = sin(uv.x * 380.0 + fbm(uv * 17.0) * 5.0) * 0.018;
        weave += sin(uv.y * 250.0 + uSeed) * 0.013;
        float drag = fbm(vec2(uv.x * 18.0 + uSeed, uv.y * 95.0));
        float scratches = smoothstep(0.72, 0.92, drag) * uScrape;
        float dry = smoothstep(0.78, 0.96, fbm(vec2(uv.x * 65.0, uv.y * 118.0 + uSeed)));
        float chips = dry * (0.20 + edgePressure * 0.80) * uChip;
        alpha *= 1.0 - chips * 0.58;
        vec3 color = uColor;
        color = mix(color, uUnder, scratches * (0.25 + edgePressure * 0.48));
        color = mix(color, uDark, edgePressure * 0.22 + (1.0 - scratches) * dry * 0.055);
        color *= 0.96 + weave + (fbm(uv * 11.0 + uSeed) - 0.5) * 0.075;
        if (alpha < 0.018) discard;
        gl_FragColor = vec4(max(color, vec3(0.0)), alpha);
      }
    `})}function w(e,r,i,a){let n=new e.PlaneGeometry(1,1,1,1),o=L(e,a);i.geometries.add(n),i.materials.add(o);let t=new e.Mesh(n,o);return t.name=a.meshName||a.name,t.position.set(a.position[0],a.position[1],a.position[2]),t.rotation.set(a.rotation?.[0]||0,a.rotation?.[1]||0,a.rotation?.[2]||0),t.scale.set(a.scale[0],a.scale[1],1),t.renderOrder=a.renderOrder||0,t.frustumCulled=!1,t.castShadow=!1,t.receiveShadow=!1,t.userData={baseX:t.position.x,baseY:t.position.y,baseZ:t.position.z,baseScaleX:t.scale.x,baseScaleY:t.scale.y,baseRotationZ:t.rotation.z,baseOpacity:a.opacity??1,phase:a.phase??0,pulse:a.pulse??.012},r.add(t),t}function N(e,r,i,a){return new e.MeshBasicMaterial({name:a,color:r,transparent:i<1,opacity:i,side:e.DoubleSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})}function I(e){let i=new Uint8Array(9216),a=47*.5;for(let o=0;o<48;o+=1)for(let t=0;t<48;t+=1){let s=Math.hypot(t-a,o-a),c=Math.max(0,Math.min(1,(48*.47-s)/(48*.18))),p=c*c*(3-2*c),u=(o*48+t)*4;i[u]=255,i[u+1]=255,i[u+2]=255,i[u+3]=Math.round(p*255)}let n=new e.DataTexture(i,48,48,e.RGBAFormat);return n.name="matte-pigment-chip-soft-disc",n.needsUpdate=!0,n.magFilter=e.LinearFilter,n.minFilter=e.LinearFilter,n.wrapS=e.ClampToEdgeWrapping,n.wrapT=e.ClampToEdgeWrapping,n.generateMipmaps=!1,e.NoColorSpace&&(n.colorSpace=e.NoColorSpace),n}function G(e,r){let a=new Float32Array(552),n=new Float32Array(552),o=[new e.Color("#eadfca"),new e.Color("#c98520"),new e.Color("#11100d"),new e.Color("#6f5b42"),new e.Color("#0b2f79")];for(let p=0;p<92;p+=1){let M=r()<.64?-1.3+r()*4.4:r()<.5?-6.8+r()*2.5:3+r()*3.2,h=-2.8+r()*5.9,C=-3.45-r()*7.8,g=.45+r()*2.2,b=(r()-.5)*.42,f=p*6;a[f]=M,a[f+1]=h,a[f+2]=C,a[f+3]=M+b,a[f+4]=h-g,a[f+5]=C-r()*.45;let d=o[p%o.length];n[f]=d.r,n[f+1]=d.g,n[f+2]=d.b,n[f+3]=d.r,n[f+4]=d.g,n[f+5]=d.b}let t=new e.BufferGeometry;t.setAttribute("position",new e.BufferAttribute(a,3)),t.setAttribute("color",new e.BufferAttribute(n,3));let s=new e.LineBasicMaterial({name:"dry-scraped-fissure-pressure-lines",vertexColors:!0,transparent:!0,opacity:.54,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),c=new e.LineSegments(t,s);return c.name="slow-collignon-arnaldi-battle-scrape-lines",c.renderOrder=74,c.frustumCulled=!1,{object:c,geometry:t,material:s}}function U(e,r,i){let n=new Float32Array(540),o=new Float32Array(540),t=[new e.Color("#eadfca"),new e.Color("#d99a24"),new e.Color("#4b1726"),new e.Color("#0b2f79"),new e.Color("#11100d")];for(let u=0;u<180;u+=1){let h=r()<.72?-.9+r()*3.4:-6.4+r()*11.6,C=-2.9+r()*6,g=-3.2-r()*8.4;n[u*3]=h+(r()-.5)*.42,n[u*3+1]=C,n[u*3+2]=g;let b=t[u%t.length];o[u*3]=b.r,o[u*3+1]=b.g,o[u*3+2]=b.b}let s=new e.BufferGeometry;s.setAttribute("position",new e.BufferAttribute(n,3)),s.setAttribute("color",new e.BufferAttribute(o,3));let c=new e.PointsMaterial({name:"concentrated-matte-pigment-pressure-chips",size:.25,map:i,alphaMap:i,vertexColors:!0,transparent:!0,opacity:.58,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1}),p=new e.Points(s,c);return p.name="concentrated-pigment-islands-along-fracture",p.renderOrder=78,p.frustumCulled=!1,{object:p,geometry:s,material:c}}function O(e,r,i,a){let n=new e.RingGeometry(a.inner,a.outer,96,1,a.start,a.length),o=N(e,a.color,a.opacity,a.name);i.geometries.add(n),i.materials.add(o);let t=new e.Mesh(n,o);return t.name=a.name,t.position.set(a.position[0],a.position[1],a.position[2]),t.rotation.set(a.rotation[0],a.rotation[1],a.rotation[2]),t.scale.set(a.scale[0],a.scale[1],1),t.renderOrder=a.renderOrder,t.frustumCulled=!1,t.userData={baseRotationZ:t.rotation.z,baseScaleX:t.scale.x,baseScaleY:t.scale.y,baseOpacity:a.opacity,phase:a.phase,pulse:a.pulse},r.add(t),t}function j({THREE:e,part:r,world:i,seed:a,utilities:n}={}){let o=B(n,a||r?.id||P,"clyfford-still-roland-garros-fracture-pressure"),t=new e.Group;t.name="non-literal-fracture-pressure-clyfford-still-primary-news-signal",t.scale.setScalar(1.18),t.userData={partId:P,role:r?.role||"primary-news-signal",packetId:z,packetHash:F,artist:"Clyfford Still",selectedNews:"Roland Garros - Collignon disappointed but proud after battle against Arnaldi",visualTarget:"non-literal fracture pressure through torn matte fields, vertical fissures, and pigment islands"};let s={geometries:new Set,materials:new Set,textures:new Set},c=new e.Group;c.name="asymmetric-large-scale-positive-negative-pressure-fields",t.add(c);let p=[w(e,c,s,{name:"matte-dominant-left-black-field-material",meshName:"dominant-left-raw-black-weight-field",color:"#090806",underColor:"#d7c19a",opacity:.92,ragged:.18,feather:.036,scrape:.34,chip:.3,lean:-.04,seed:2.7,position:[-4.65,.2,-7.2],rotation:[.02,.24,.018],scale:[7.95,7.35],renderOrder:18,phase:o()*6.283,pulse:.01}),w(e,c,s,{name:"mustard-low-roland-garros-pressure-ground-material",meshName:"low-mineral-yellow-clay-pressure-field",color:"#c98520",underColor:"#eadfca",darkColor:"#211915",opacity:.78,ragged:.16,feather:.045,scrape:.48,chip:.24,lean:.03,seed:4.1,position:[2.35,-2,-7.9],rotation:[.08,-.18,-.055],scale:[9.85,3.55],renderOrder:22,phase:o()*6.283,pulse:.014}),w(e,c,s,{name:"bruised-maroon-proud-disappointed-slab-material",meshName:"bruised-maroon-pride-afterimage-slab",color:"#4b1726",underColor:"#b9852c",darkColor:"#120806",opacity:.83,ragged:.14,feather:.038,scrape:.24,chip:.18,lean:-.025,seed:5.9,position:[3.65,.78,-8.8],rotation:[.02,-.3,-.012],scale:[5.65,6.35],renderOrder:20,phase:o()*6.283,pulse:.009}),w(e,c,s,{name:"exposed-cream-central-fissure-material",meshName:"exposed-cream-tremendous-battle-fissure",color:"#eadfca",underColor:"#11100d",darkColor:"#302822",opacity:.94,ragged:.23,feather:.032,scrape:.2,chip:.34,lean:.1,seed:7.4,position:[-.72,.24,-4.95],rotation:[.02,.035,-.06],scale:[.82,7.25],renderOrder:50,phase:o()*6.283,pulse:.006}),w(e,c,s,{name:"central-narrow-charcoal-fracture-material",meshName:"narrow-black-vertical-fracture-pressure",color:"#11100d",underColor:"#d7c19a",opacity:.86,ragged:.15,feather:.025,scrape:.32,chip:.2,lean:-.07,seed:9.2,position:[.3,-.18,-4.55],rotation:[.02,-.02,.025],scale:[.46,6.15],renderOrder:56,phase:o()*6.283,pulse:.005}),w(e,c,s,{name:"electric-blue-incredible-moment-slit-material",meshName:"electric-blue-small-incredible-moment",color:"#0b2f79",underColor:"#eadfca",darkColor:"#05080e",opacity:.88,ragged:.12,feather:.026,scrape:.28,chip:.17,lean:.02,seed:11.6,position:[1.28,-.42,-4.25],rotation:[.03,-.055,.012],scale:[.28,5.58],renderOrder:62,phase:o()*6.283,pulse:.01}),w(e,c,s,{name:"right-black-counterpressure-ridge-material",meshName:"right-dragged-black-counterpressure-ridge",color:"#080706",underColor:"#d7c19a",opacity:.72,ragged:.19,feather:.04,scrape:.4,chip:.3,lean:-.08,seed:13.3,position:[5.85,-.05,-6.55],rotation:[.015,-.33,.035],scale:[1.65,6.8],renderOrder:34,phase:o()*6.283,pulse:.007}),w(e,c,s,{name:"pale-right-open-negative-space-material",meshName:"pale-open-negative-space-counterfield",color:"#d7c19a",underColor:"#11100d",darkColor:"#6f5b42",opacity:.46,ragged:.13,feather:.052,scrape:.36,chip:.2,lean:.04,seed:15.8,position:[6.9,.4,-10.9],rotation:[.01,-.4,.008],scale:[4.6,6.75],renderOrder:14,phase:o()*6.283,pulse:.008})],u=new e.Group;u.name="cropped-roland-garros-court-pressure-arcs",t.add(u);let M=[O(e,u,s,{name:"left-cropped-clay-court-pressure-arc",color:"#c98520",opacity:.36,inner:3.9,outer:4.06,start:Math.PI*.7,length:Math.PI*1.05,position:[-3.75,-.64,-4.9],rotation:[.02,.03,-.1],scale:[1.05,.74],renderOrder:68,phase:o()*6.283,pulse:.008}),O(e,u,s,{name:"pale-remembered-match-pressure-arc",color:"#eadfca",opacity:.5,inner:2.85,outer:2.98,start:Math.PI*1.08,length:Math.PI*.82,position:[2.05,-1.34,-3.82],rotation:[.02,-.04,.28],scale:[1.18,.62],renderOrder:70,phase:o()*6.283,pulse:.006}),O(e,u,s,{name:"thin-black-cropped-pressure-echo-arc",color:"#11100d",opacity:.42,inner:4.75,outer:4.88,start:Math.PI*.08,length:Math.PI*.62,position:[1.55,-.18,-7.35],rotation:[.03,-.08,-.52],scale:[1.1,.56],renderOrder:30,phase:o()*6.283,pulse:.005})],h=G(e,o);s.geometries.add(h.geometry),s.materials.add(h.material),t.add(h.object);let C=I(e);s.textures.add(C);let g=U(e,o,C);s.geometries.add(g.geometry),s.materials.add(g.material),t.add(g.object);function b(d={}){let D=d.captureMode?0:Number(d.elapsedSeconds??d.time??0),m=Number.isFinite(D)?D:0,y=Number.isFinite(d.motionIntensity)?d.motionIntensity:1;for(let x=0;x<p.length;x+=1){let l=p[x],v=l.userData.phase||0,S=(l.userData.pulse||.01)*y;l.material?.uniforms?.uTime&&(l.material.uniforms.uTime.value=m);let k=Math.sin(m*.075+v);l.scale.x=l.userData.baseScaleX*(1+k*S),l.scale.y=l.userData.baseScaleY*(1+Math.sin(m*.052+v)*S*.72),l.rotation.z=l.userData.baseRotationZ+Math.sin(m*.045+v)*S*.55,l.material?.uniforms?.uOpacity&&(l.material.uniforms.uOpacity.value=l.userData.baseOpacity*(.97+Math.sin(m*.06+v)*.025*y))}for(let x=0;x<M.length;x+=1){let l=M[x],v=l.userData.phase||0,S=(l.userData.pulse||.006)*y;l.rotation.z=l.userData.baseRotationZ+Math.sin(m*.052+v)*S,l.scale.x=l.userData.baseScaleX*(1+Math.sin(m*.07+v)*S),l.scale.y=l.userData.baseScaleY*(1+Math.cos(m*.06+v)*S),l.material&&(l.material.opacity=l.userData.baseOpacity*(.95+Math.sin(m*.08+v)*.04*y))}c.rotation.y=Math.sin(m*.022)*.01*y,h.object.rotation.y=Math.sin(m*.032)*.018*y,g.object.rotation.y=Math.sin(m*.026+.7)*.014*y,g.material.opacity=.55+Math.sin(m*.1)*.035*y}function f(){for(let d of s.geometries)d?.dispose?.();for(let d of s.materials)d?.dispose?.();for(let d of s.textures)d?.dispose?.()}return b({captureMode:!0,elapsedSeconds:0,motionIntensity:1}),{object:t,update:b,dispose:f}}export{j as createImmersiveWorldPart};
