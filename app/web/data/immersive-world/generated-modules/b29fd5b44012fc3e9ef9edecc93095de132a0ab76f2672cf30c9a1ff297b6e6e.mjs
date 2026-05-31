var B="art-direction-packet-f76c1ba9fd3e",z="f76c1ba9fd3ed6a8fae0806d5d83ab62",O="artist-mark-field";function D(e){let r=2166136261,i=String(e??O);for(let t=0;t<i.length;t+=1)r^=i.charCodeAt(t),r=Math.imul(r,16777619);return r>>>0}function P(e,r,i){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(r,i);let t=(D(r)^D(i))>>>0;return function(){t=t+1831565813>>>0;let s=t;return s=Math.imul(s^s>>>15,s|1),s^=s+Math.imul(s^s>>>7,s|61),((s^s>>>14)>>>0)/4294967296}}function I(e,r){return new e.ShaderMaterial({name:r.name,transparent:!0,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uColor:{value:new e.Color(r.color)},uUnder:{value:new e.Color(r.underColor||"#d7c19a")},uDark:{value:new e.Color(r.darkColor||"#090806")},uOpacity:{value:r.opacity??1},uSeed:{value:r.seed??1},uRagged:{value:r.ragged??.16},uScrape:{value:r.scrape??.34},uCanvas:{value:r.canvas??.25},uVerticalBias:{value:r.verticalBias??1}},vertexShader:`
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
      uniform float uScrape;
      uniform float uCanvas;
      uniform float uVerticalBias;
      varying vec2 vUv;

      float saturate(float x) { return clamp(x, 0.0, 1.0); }
      float hash21(vec2 p) {
        p = fract(p * vec2(144.317, 371.711));
        p += dot(p, p + 31.413 + uSeed);
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
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i += 1) {
          value += noise(p) * amp;
          p = p * 2.06 + vec2(11.7, 19.2);
          amp *= 0.5;
        }
        return value;
      }
      float edgeAlpha(vec2 uv) {
        float slow = sin(uTime * 0.045 + uSeed) * 0.006;
        float left = (fbm(vec2(uv.y * 5.4 + uSeed, uv.x * 2.0)) - 0.5) * uRagged;
        float right = (fbm(vec2(uv.y * 4.9 - uSeed, uv.x * 1.6 + 9.0)) - 0.5) * uRagged;
        float bottom = (fbm(vec2(uv.x * 4.8 + uSeed * 0.7, uv.y * 2.1)) - 0.5) * uRagged * 0.58;
        float top = (fbm(vec2(uv.x * 5.2 - uSeed * 0.4, uv.y * 1.8 + 4.0)) - 0.5) * uRagged * 0.58;
        float aL = smoothstep(left + slow, left + 0.038, uv.x);
        float aR = 1.0 - smoothstep(1.0 + right - 0.040, 1.0 + right - slow, uv.x);
        float aB = smoothstep(bottom, bottom + 0.044, uv.y);
        float aT = 1.0 - smoothstep(1.0 + top - 0.044, 1.0 + top, uv.y);
        return aL * aR * aB * aT;
      }
      float verticalScrape(vec2 uv, float x, float width, float phase) {
        float wander = (fbm(vec2(uv.y * 10.0 + phase, uv.x * 3.0)) - 0.5) * 0.050;
        float chipped = 0.55 + fbm(vec2(uv.y * 28.0 + phase, uv.x * 9.0)) * 0.90;
        return 1.0 - smoothstep(width * chipped, width * chipped + 0.016, abs(uv.x - x - wander));
      }
      void main() {
        vec2 uv = vUv;
        float alpha = edgeAlpha(uv) * uOpacity;
        float nearEdge = 1.0 - smoothstep(0.035, 0.24, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
        float verticalDrag = fbm(vec2(uv.x * 20.0 + uSeed, uv.y * 112.0));
        float dry = smoothstep(0.73, 0.94, verticalDrag) * uScrape;
        float chips = smoothstep(0.78, 0.96, fbm(vec2(uv.x * 82.0 + uSeed, uv.y * 146.0)));
        float seamScrapes = 0.0;
        seamScrapes += verticalScrape(uv, 0.17, 0.010, uSeed + 1.0);
        seamScrapes += verticalScrape(uv, 0.49, 0.007, uSeed + 3.0) * 0.65;
        seamScrapes += verticalScrape(uv, 0.78, 0.012, uSeed + 5.0) * 0.72;
        seamScrapes *= uVerticalBias;
        alpha *= 1.0 - chips * (0.08 + nearEdge * 0.36);
        vec3 color = uColor;
        color = mix(color, uUnder, dry * (0.26 + nearEdge * 0.34));
        color = mix(color, uUnder, seamScrapes * 0.34);
        color = mix(color, uDark, nearEdge * 0.28 + chips * 0.055);
        float weave = sin(uv.x * 420.0 + fbm(uv * 14.0) * 4.0) * 0.015;
        weave += sin(uv.y * 280.0 + uSeed) * 0.012;
        color *= 0.95 + weave * uCanvas + (fbm(uv * 9.5 + uSeed) - 0.5) * 0.090;
        if (alpha < 0.018) discard;
        gl_FragColor = vec4(max(color, vec3(0.0)), alpha);
      }
    `})}function w(e,r,i,t){let o=new e.PlaneGeometry(1,1,1,1),s=I(e,t);i.geometries.add(o),i.materials.add(s);let a=new e.Mesh(o,s);return a.name=t.meshName||t.name,a.position.set(t.position[0],t.position[1],t.position[2]),a.rotation.set(t.rotation?.[0]||0,t.rotation?.[1]||0,t.rotation?.[2]||0),a.scale.set(t.scale[0],t.scale[1],1),a.renderOrder=t.renderOrder||0,a.frustumCulled=!1,a.castShadow=!1,a.receiveShadow=!1,a.userData={baseScaleX:a.scale.x,baseScaleY:a.scale.y,baseRotationZ:a.rotation.z,baseOpacity:t.opacity??1,phase:t.phase??0,pulse:t.pulse??.008},r.add(a),a}function N(e,r,i,t){return new e.MeshBasicMaterial({name:t,color:r,transparent:i<1,opacity:i,side:e.DoubleSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})}function k(e,r,i,t){let o=new e.RingGeometry(t.inner,t.outer,t.segments||96,1,t.start,t.length),s=N(e,t.color,t.opacity,t.name);i.geometries.add(o),i.materials.add(s);let a=new e.Mesh(o,s);return a.name=t.name,a.position.set(t.position[0],t.position[1],t.position[2]),a.rotation.set(t.rotation[0],t.rotation[1],t.rotation[2]),a.scale.set(t.scale[0],t.scale[1],1),a.renderOrder=t.renderOrder||0,a.frustumCulled=!1,a.userData={baseScaleX:a.scale.x,baseScaleY:a.scale.y,baseRotationZ:a.rotation.z,baseOpacity:t.opacity,phase:t.phase??0,pulse:t.pulse??.006},r.add(a),a}function F(e){let i=new Uint8Array(12544),t=55*.5;for(let s=0;s<56;s+=1)for(let a=0;a<56;a+=1){let c=a-t,f=s-t,d=Math.hypot(c*1.12,f*.92),u=Math.max(0,Math.min(1,(56*.48-d)/(56*.16))),v=(a*17+s*31)%23/23,h=u*u*(3-2*u)*(.78+v*.22),m=(s*56+a)*4;i[m]=255,i[m+1]=255,i[m+2]=255,i[m+3]=Math.round(h*255)}let o=new e.DataTexture(i,56,56,e.RGBAFormat);return o.name="rough-matte-pigment-island-sprite",o.needsUpdate=!0,o.magFilter=e.LinearFilter,o.minFilter=e.LinearFilter,o.wrapS=e.ClampToEdgeWrapping,o.wrapT=e.ClampToEdgeWrapping,o.generateMipmaps=!1,e.NoColorSpace&&(o.colorSpace=e.NoColorSpace),o}function G(e,r,i){let o=new Float32Array(660),s=new Float32Array(660),a=[new e.Color("#eadfca"),new e.Color("#d99a24"),new e.Color("#4b1726"),new e.Color("#0b2f79"),new e.Color("#11100d"),new e.Color("#6f5b42")];for(let u=0;u<220;u+=1){let v=r(),h=v<.5?-.85+r()*3.2:v<.78?-5.8+r()*3.1:3.1+r()*4.8,m=-3.05+r()*6.55,M=-3.25-r()*8.8;o[u*3]=h+(r()-.5)*.34,o[u*3+1]=m,o[u*3+2]=M;let S=a[(u+Math.floor(r()*a.length))%a.length];s[u*3]=S.r,s[u*3+1]=S.g,s[u*3+2]=S.b}let c=new e.BufferGeometry;c.setAttribute("position",new e.BufferAttribute(o,3)),c.setAttribute("color",new e.BufferAttribute(s,3));let f=new e.PointsMaterial({name:"clyfford-still-matte-pigment-islands",size:.31,map:i,alphaMap:i,vertexColors:!0,transparent:!0,opacity:.66,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1}),d=new e.Points(c,f);return d.name="distributed-pigment-islands-through-camera-space",d.renderOrder=82,d.frustumCulled=!1,{object:d,geometry:c,material:f}}function U(e,r){let t=new Float32Array(744),o=new Float32Array(744),s=[new e.Color("#eadfca"),new e.Color("#c98520"),new e.Color("#11100d"),new e.Color("#7a6447"),new e.Color("#0b2f79")];for(let d=0;d<124;d+=1){let u=r(),v=u<.6?-1.05+r()*3.85:u<.82?-6.25+r()*2.45:4.1+r()*2.95,h=-3.2+r()*6.9,m=-3.7-r()*9.2,M=.45+r()*2.65,S=(r()-.5)*.52,l=d*6;t[l]=v,t[l+1]=h,t[l+2]=m,t[l+3]=v+S,t[l+4]=h-M,t[l+5]=m-r()*.62;let g=s[d%s.length];o[l]=g.r,o[l+1]=g.g,o[l+2]=g.b,o[l+3]=g.r,o[l+4]=g.g,o[l+5]=g.b}let a=new e.BufferGeometry;a.setAttribute("position",new e.BufferAttribute(t,3)),a.setAttribute("color",new e.BufferAttribute(o,3));let c=new e.LineBasicMaterial({name:"dry-vertical-scraped-impasto-ridges",vertexColors:!0,transparent:!0,opacity:.62,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),f=new e.LineSegments(a,c);return f.name="all-over-scraped-fissure-ridge-field",f.renderOrder=88,f.frustumCulled=!1,{object:f,geometry:a,material:c}}function j({THREE:e,part:r,seed:i,utilities:t}={}){let o=P(t,i||r?.id||O,"clyfford-still-artist-mark-field"),s=new e.Group;s.name="artist-mark-field-clyfford-still-spatial-style-system",s.scale.setScalar(1.36),s.userData={partId:O,role:r?.role||"artist-style-system",packetId:B,packetHash:z,artist:"Clyfford Still",selectedNews:"Roland Garros Collignon disappointed but proud after battle against Arnaldi",visualTarget:"distributed artist mark field with torn matte planes, scraped fissures, pigment islands, and restrained court-pressure arcs"};let a={geometries:new Set,materials:new Set,textures:new Set},c=new e.Group;c.name="large-asymmetric-positive-negative-torn-color-fields",s.add(c);let f=[w(e,c,a,{name:"artist-mark-dominant-black-matte-field-material",meshName:"dominant-left-black-artist-field",color:"#090806",underColor:"#d7c19a",darkColor:"#030302",opacity:.86,ragged:.2,scrape:.38,canvas:.85,verticalBias:.88,seed:2.3,position:[-5.35,.26,-7.1],rotation:[.018,.285,.018],scale:[8.85,7.7],renderOrder:24,phase:o()*6.283,pulse:.01}),w(e,c,a,{name:"artist-mark-exposed-cream-ground-material",meshName:"exposed-cream-ground-rift-through-black",color:"#eadfca",underColor:"#11100d",darkColor:"#4c3f31",opacity:.82,ragged:.24,scrape:.3,canvas:.7,verticalBias:1.15,seed:4.8,position:[-1.18,.4,-5.36],rotation:[.018,.05,-.078],scale:[1.45,7.95],renderOrder:58,phase:o()*6.283,pulse:.006}),w(e,c,a,{name:"artist-mark-mustard-fractured-clay-pressure-material",meshName:"mineral-yellow-roland-garros-pressure-field",color:"#c98520",underColor:"#eadfca",darkColor:"#2b1d12",opacity:.76,ragged:.18,scrape:.52,canvas:.78,verticalBias:1.06,seed:6.1,position:[1.25,-.86,-6.7],rotation:[.07,-.108,-.036],scale:[3.05,6.65],renderOrder:38,phase:o()*6.283,pulse:.011}),w(e,c,a,{name:"artist-mark-bruised-red-after-battle-material",meshName:"bruised-maroon-proud-disappointed-weight",color:"#4b1726",underColor:"#b9852c",darkColor:"#0d0505",opacity:.82,ragged:.16,scrape:.24,canvas:.72,verticalBias:.55,seed:8.7,position:[4.18,.82,-8.55],rotation:[.015,-.325,-.02],scale:[5.85,6.82],renderOrder:28,phase:o()*6.283,pulse:.009}),w(e,c,a,{name:"artist-mark-electric-blue-narrow-accent-material",meshName:"electric-blue-incredible-moment-fissure",color:"#0b2f79",underColor:"#eadfca",darkColor:"#02050d",opacity:.9,ragged:.12,scrape:.28,canvas:.54,verticalBias:1.4,seed:10.6,position:[2.32,-.24,-4.68],rotation:[.025,-.06,.014],scale:[.42,6.92],renderOrder:76,phase:o()*6.283,pulse:.007}),w(e,c,a,{name:"artist-mark-center-black-contour-anchor-material",meshName:"central-black-contour-pressure-anchor",color:"#11100d",underColor:"#d7c19a",darkColor:"#050403",opacity:.84,ragged:.17,scrape:.36,canvas:.6,verticalBias:1.3,seed:12.2,position:[.47,-.2,-4.92],rotation:[.02,-.018,.026],scale:[.56,6.88],renderOrder:72,phase:o()*6.283,pulse:.005}),w(e,c,a,{name:"artist-mark-right-pale-negative-space-material",meshName:"pale-right-negative-space-field",color:"#d7c19a",underColor:"#11100d",darkColor:"#746448",opacity:.6,ragged:.15,scrape:.42,canvas:.76,verticalBias:.92,seed:14.9,position:[6.65,.28,-10.4],rotation:[.012,-.42,.008],scale:[4.95,7.35],renderOrder:18,phase:o()*6.283,pulse:.008}),w(e,c,a,{name:"artist-mark-right-black-dragged-ridge-material",meshName:"right-dragged-black-ridge-field",color:"#080706",underColor:"#d7c19a",darkColor:"#020201",opacity:.68,ragged:.19,scrape:.48,canvas:.7,verticalBias:1.18,seed:16.4,position:[5.68,-.24,-6.18],rotation:[.018,-.348,.042],scale:[1.6,7.15],renderOrder:54,phase:o()*6.283,pulse:.007})],d=new e.Group;d.name="fragmented-radial-roland-garros-pressure-symbols",s.add(d);let u=[k(e,d,a,{name:"wide-ochre-cropped-pressure-arc",color:"#c98520",opacity:.34,inner:4.3,outer:4.5,start:Math.PI*.6,length:Math.PI*1.12,position:[-3.82,-.88,-5.32],rotation:[.018,.028,-.12],scale:[1.2,.7],renderOrder:80,phase:o()*6.283,pulse:.007}),k(e,d,a,{name:"pale-memory-court-arc-through-fracture",color:"#eadfca",opacity:.48,inner:3.05,outer:3.21,start:Math.PI*1.03,length:Math.PI*.94,position:[1.9,-1.42,-3.98],rotation:[.02,-.038,.246],scale:[1.24,.63],renderOrder:84,phase:o()*6.283,pulse:.006}),k(e,d,a,{name:"thin-black-counter-arc",color:"#11100d",opacity:.44,inner:5.15,outer:5.29,start:Math.PI*.06,length:Math.PI*.66,position:[1.42,-.08,-7.6],rotation:[.024,-.083,-.54],scale:[1.1,.55],renderOrder:34,phase:o()*6.283,pulse:.005})],v=F(e);a.textures.add(v);let h=G(e,o,v);a.geometries.add(h.geometry),a.materials.add(h.material),s.add(h.object);let m=U(e,o);a.geometries.add(m.geometry),a.materials.add(m.material),s.add(m.object);function M(l={}){let g=l.captureMode?0:Number(l.elapsedSeconds??l.time??0),p=Number.isFinite(g)?g:0,y=Number.isFinite(l.motionIntensity)?l.motionIntensity:1;for(let x=0;x<f.length;x+=1){let n=f[x],b=n.userData.phase||0,C=(n.userData.pulse||.008)*y;n.material?.uniforms?.uTime&&(n.material.uniforms.uTime.value=p);let A=Math.sin(p*.066+b);n.scale.x=n.userData.baseScaleX*(1+A*C),n.scale.y=n.userData.baseScaleY*(1+Math.sin(p*.05+b)*C*.7),n.rotation.z=n.userData.baseRotationZ+Math.sin(p*.041+b)*C*.58,n.material?.uniforms?.uOpacity&&(n.material.uniforms.uOpacity.value=n.userData.baseOpacity*(.965+Math.sin(p*.056+b)*.024*y))}for(let x=0;x<u.length;x+=1){let n=u[x],b=n.userData.phase||0,C=(n.userData.pulse||.006)*y;n.rotation.z=n.userData.baseRotationZ+Math.sin(p*.05+b)*C,n.scale.x=n.userData.baseScaleX*(1+Math.sin(p*.064+b)*C),n.scale.y=n.userData.baseScaleY*(1+Math.cos(p*.052+b)*C),n.material&&(n.material.opacity=n.userData.baseOpacity*(.95+Math.sin(p*.07+b)*.04*y))}c.rotation.y=Math.sin(p*.02)*.012*y,d.rotation.y=Math.sin(p*.018+.4)*.01*y,m.object.rotation.y=Math.sin(p*.03)*.018*y,h.object.rotation.y=Math.sin(p*.024+.8)*.016*y,h.material.opacity=.64+Math.sin(p*.08)*.035*y}function S(){for(let l of a.geometries)l?.dispose?.();for(let l of a.materials)l?.dispose?.();for(let l of a.textures)l?.dispose?.()}return M({captureMode:!0,elapsedSeconds:0,motionIntensity:1}),{object:s,update:M,dispose:S}}export{j as createImmersiveWorldPart};
