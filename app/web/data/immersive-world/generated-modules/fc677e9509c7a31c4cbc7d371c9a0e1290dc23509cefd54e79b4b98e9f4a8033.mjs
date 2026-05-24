var M="art-direction-packet-cf373ed36e00",S="cf373ed36e0033b69948aea7c39ab203",w="artist-mark-field",m=Math.PI*2;function U(o,e,t){return Math.max(e,Math.min(t,o))}function k(o){let e=2166136261,t=String(o??w);for(let r=0;r<t.length;r+=1)e^=t.charCodeAt(r),e=Math.imul(e,16777619);return e>>>0}function z(o,e){let t=(k(o)^k(e))>>>0;return function(){t=t+1831565813>>>0;let a=t;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}function O(o,e,t){return o&&typeof o.createSeededRandom=="function"?o.createSeededRandom(e,t):z(e,t)}function c(o,e){return(o()-.5)*e}function W(o,e){let t=new o.Color(e);return[t.r,t.g,t.b]}function y(o,e,{x:t,y:r,z:a,width:s,height:h,rotation:i=0,color:l,opacity:d=1,pulse:p=.012}){let f=l.rgb;o.push({x:t,y:r,z:a,width:s,height:h,rotation:i,r:f[0],g:f[1],b:f[2],opacity:d,phase:e()*m,rough:.35+e()*.65,pulse:p})}function G(o,e,t){for(let s=0;s<21;s+=1){let h=-5.2+s*.52+c(e,.1),i=Math.sin(s*.61)*.17;for(let l=0;l<43;l+=1){if(e()<.12)continue;let d=-11.65+l*.55+i+c(e,.17),p=s>5&&s<12&&e()<.28,f=s<5||s>12||e()<.45,n=p?e()<.5?t.paleTeal:t.teal:f?e()<.55?t.paperA:t.paperB:t.paperWhite;y(o,e,{x:d,y:h,z:-7.2+c(e,.36),width:.42+e()*.32,height:.13+e()*.12,rotation:c(e,.11)+Math.sin(s*.4+l*.13)*.025,color:n,opacity:p?.56:.66,pulse:.006})}}}function _(o,e,t){let r=[{y:.52,z:-4.8,colorSet:[t.deepBlue,t.lowBlue,t.darkBlue],count:104,slope:-.018,opacity:.97},{y:.95,z:-5.15,colorSet:[t.paleTeal,t.teal,t.paperWhite],count:92,slope:-.006,opacity:.78},{y:-.05,z:-4.45,colorSet:[t.orange,t.yellow,t.warmRed],count:100,slope:.021,opacity:.92},{y:-3.02,z:-5.85,colorSet:[t.paperB,t.paleTeal,t.mutedOchre],count:78,slope:.008,opacity:.68}];for(let a of r)for(let s=0;s<a.count;s+=1){let h=s/Math.max(1,a.count-1),i=-11.4+h*22.8+c(e,.18),l=a.y+i*a.slope+Math.sin(h*m*1.4)*.08+c(e,.12),d=a.colorSet[Math.floor(e()*a.colorSet.length)];y(o,e,{x:i,y:l,z:a.z+c(e,.2),width:.58+e()*.48,height:.15+e()*.09,rotation:a.slope+c(e,.08),color:d,opacity:a.opacity,pulse:.015})}}function N(o,e,t){let h=[{radius:.28,count:20,colors:[t.darkBlue,t.deepBlue],width:.26,height:.14,opacity:1},{radius:.56,count:30,colors:[t.darkBlue,t.deepBlue,t.lowBlue],width:.34,height:.14,opacity:.98},{radius:.88,count:38,colors:[t.deepBlue,t.lowBlue,t.paleTeal],width:.41,height:.14,opacity:.92},{radius:1.25,count:48,colors:[t.paleTeal,t.teal,t.paperWhite],width:.48,height:.15,opacity:.82},{radius:1.72,count:62,colors:[t.orange,t.yellow,t.paperB],width:.58,height:.16,opacity:.95},{radius:2.25,count:76,colors:[t.orange,t.yellow,t.warmRed],width:.67,height:.17,opacity:.94},{radius:2.92,count:90,colors:[t.orange,t.paperA,t.paleTeal,t.yellow],width:.78,height:.17,opacity:.86},{radius:3.64,count:106,colors:[t.paperA,t.orange,t.yellow,t.teal],width:.88,height:.18,opacity:.78},{radius:4.45,count:124,colors:[t.paperA,t.orange,t.paleTeal,t.yellow],width:1.02,height:.2,opacity:.7}];for(let i of h)for(let l=0;l<i.count;l+=1){if(i.radius>1.2&&e()<.08)continue;let d=l/i.count*m+c(e,.055),p=i.radius+c(e,.11),f=.05+Math.cos(d)*p*1.28,n=-1.56+Math.sin(d)*p*.82,u=i.colors[Math.floor(e()*i.colors.length)];y(o,e,{x:f,y:n,z:-3.34-i.radius*.11+c(e,.11),width:i.width*(.84+e()*.36),height:i.height*(.78+e()*.38),rotation:d+Math.PI*.5+c(e,.14),color:u,opacity:i.opacity,pulse:i.radius<.9?.018:.013})}}function j(o,e,t){for(let r=0;r<142;r+=1){let a=r/141,s=-9.45+a*18.9+c(e,.14),h=Math.sin(a*Math.PI)*.5,i=-.82+s*.23+h+c(e,.13),l=e()<.68?e()<.56?t.orange:t.yellow:t.paleTeal;y(o,e,{x:s,y:i,z:-2.75+c(e,.16),width:.66+e()*.42,height:.14+e()*.08,rotation:.24+c(e,.075),color:l,opacity:.98,pulse:.022})}for(let r=0;r<122;r+=1){let a=r/121,s=-8.6+a*17.2+c(e,.12),h=.4-s*.18+Math.sin(a*m*1.2)*.06+c(e,.1),i=e()<.72?t.deepBlue:t.darkBlue;y(o,e,{x:s,y:h,z:-2.56+c(e,.13),width:.6+e()*.36,height:.14+e()*.07,rotation:-.19+c(e,.07),color:i,opacity:1,pulse:.024})}for(let r=0;r<34;r+=1){let a=e()*m,s=e()*.55;y(o,e,{x:Math.cos(a)*s*.9,y:-1.03+Math.sin(a)*s*.62,z:-2.32+c(e,.05),width:.22+e()*.19,height:.11+e()*.07,rotation:a+c(e,.42),color:e()<.85?t.darkBlue:t.deepBlue,opacity:1,pulse:.018})}}function T(o,e,t){let r=[-9,-7.35,7.4,9.05];for(let a=0;a<r.length;a+=1){let s=r[a];for(let h=0;h<34;h+=1){if(e()<.13)continue;let i=-4.85+h*.29+c(e,.11),d=a>1?e()<.55?t.orange:t.yellow:e()<.58?t.paleTeal:t.deepBlue;y(o,e,{x:s+Math.sin(h*.44)*.14+c(e,.18),y:i,z:-3.9-a*.2+c(e,.16),width:.16+e()*.11,height:.42+e()*.36,rotation:c(e,.12),color:d,opacity:d===t.deepBlue?.96:.86,pulse:.012})}}}function X(o){return new o.ShaderMaterial({name:"alma-thomas-broken-rectangular-mosaic-dash-material",transparent:!0,side:o.DoubleSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uCapture:{value:1}},vertexShader:`
      attribute vec3 aCenter;
      attribute vec2 aScale;
      attribute float aRotation;
      attribute vec3 aColor;
      attribute float aOpacity;
      attribute float aPhase;
      attribute float aRough;
      attribute float aPulse;
      uniform float uTime;
      uniform float uCapture;
      varying vec2 vUv;
      varying vec3 vColor;
      varying float vOpacity;
      varying float vPhase;
      varying float vRough;

      void main() {
        float pulse = 1.0 + sin(uTime * 0.62 + aPhase) * aPulse * (1.0 - uCapture);
        vec2 local = position.xy * aScale * pulse;
        float c = cos(aRotation);
        float s = sin(aRotation);
        vec2 rotated = vec2(local.x * c - local.y * s, local.x * s + local.y * c);
        vec3 displaced = vec3(rotated, 0.0) + aCenter;
        vUv = uv;
        vColor = aColor;
        vOpacity = aOpacity;
        vPhase = aPhase;
        vRough = aRough;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,fragmentShader:`
      precision mediump float;
      varying vec2 vUv;
      varying vec3 vColor;
      varying float vOpacity;
      varying float vPhase;
      varying float vRough;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32 + vPhase);
        return fract(p.x * p.y);
      }

      void main() {
        vec2 centered = abs(vUv - 0.5) * 2.0;
        float edge = max(centered.x, centered.y);
        float ragged = hash21(floor(vUv * vec2(18.0, 8.0)) + vRough * 19.0);
        float edgeShift = (ragged - 0.5) * 0.13 * vRough;
        float alpha = 1.0 - smoothstep(0.82 + edgeShift, 1.02 + edgeShift, edge);
        float dryStripe = 0.76 + 0.24 * sin(vUv.x * 36.0 + vPhase) * sin(vUv.y * 15.0 + vPhase * 0.7);
        float dryBreak = step(0.08, hash21(floor(vUv * vec2(28.0, 11.0)) + vPhase));
        vec3 pigment = vColor * (0.86 + hash21(floor(vUv * 20.0) + vPhase) * 0.16);
        gl_FragColor = vec4(pigment * dryStripe, alpha * dryBreak * vOpacity);
      }
    `})}function Y(o,e){return new o.ShaderMaterial({name:"alma-thomas-pale-matte-support-plane",transparent:!0,side:o.DoubleSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uSeed:{value:e},uPaperA:{value:new o.Color("#F0DDD2")},uPaperB:{value:new o.Color("#F1E3DC")},uPaperWhite:{value:new o.Color("#EFEEEF")},uPaleTeal:{value:new o.Color("#E1EFF1")}},vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision mediump float;
      uniform float uSeed;
      uniform vec3 uPaperA;
      uniform vec3 uPaperB;
      uniform vec3 uPaperWhite;
      uniform vec3 uPaleTeal;
      varying vec2 vUv;

      float hash21(vec2 p) {
        p = fract(p * vec2(117.13, 311.71));
        p += dot(p, p + 23.45 + uSeed);
        return fract(p.x * p.y);
      }

      void main() {
        vec2 grid = floor(vUv * vec2(32.0, 19.0));
        float n = hash21(grid);
        vec3 color = mix(uPaperA, uPaperB, n);
        color = mix(color, uPaperWhite, smoothstep(0.63, 0.95, hash21(grid + 17.0)) * 0.32);
        color = mix(color, uPaleTeal, smoothstep(0.84, 1.0, hash21(grid + 41.0)) * 0.22);
        float groutX = smoothstep(0.024, 0.0, min(fract(vUv.x * 32.0), 1.0 - fract(vUv.x * 32.0)));
        float groutY = smoothstep(0.030, 0.0, min(fract(vUv.y * 19.0), 1.0 - fract(vUv.y * 19.0)));
        float grout = max(groutX, groutY);
        color = mix(color, uPaperWhite, grout * 0.48);
        float matte = 0.9 + hash21(floor(vUv * 140.0)) * 0.1;
        vec2 edge = min(vUv, 1.0 - vUv);
        float edgeFade = smoothstep(0.0, 0.085, min(edge.x, edge.y));
        gl_FragColor = vec4(color * matte, 0.68 * edgeFade);
      }
    `})}function R(o,e){let t=new o.PlaneGeometry(1,1,1,1),r=new o.InstancedBufferGeometry;r.index=t.index,r.setAttribute("position",t.getAttribute("position")),r.setAttribute("uv",t.getAttribute("uv")),r.instanceCount=e.length;let a=new Float32Array(e.length*3),s=new Float32Array(e.length*2),h=new Float32Array(e.length),i=new Float32Array(e.length*3),l=new Float32Array(e.length),d=new Float32Array(e.length),p=new Float32Array(e.length),f=new Float32Array(e.length);for(let n=0;n<e.length;n+=1){let u=e[n];a[n*3]=u.x,a[n*3+1]=u.y,a[n*3+2]=u.z,s[n*2]=u.width,s[n*2+1]=u.height,h[n]=u.rotation,i[n*3]=u.r,i[n*3+1]=u.g,i[n*3+2]=u.b,l[n]=u.opacity,d[n]=u.phase,p[n]=u.rough,f[n]=u.pulse}return r.setAttribute("aCenter",new o.InstancedBufferAttribute(a,3)),r.setAttribute("aScale",new o.InstancedBufferAttribute(s,2)),r.setAttribute("aRotation",new o.InstancedBufferAttribute(h,1)),r.setAttribute("aColor",new o.InstancedBufferAttribute(i,3)),r.setAttribute("aOpacity",new o.InstancedBufferAttribute(l,1)),r.setAttribute("aPhase",new o.InstancedBufferAttribute(d,1)),r.setAttribute("aRough",new o.InstancedBufferAttribute(p,1)),r.setAttribute("aPulse",new o.InstancedBufferAttribute(f,1)),t.dispose(),r}function P(o,e={}){return o.userData={...o.userData,partId:w,role:"artist-style-system",packetId:M,packetHash:S,artist:"Alma Thomas",selectedNews:"Lennik goes to court over controversial RNP-07L flight route",trendCue:"Against",visualPurpose:"hand-laid Alma Thomas mosaic marks forming radial systems, horizon bands, vertical streams, and non-literal fracture pressure",...e},o}function V({THREE:o,part:e,world:t,seed:r,assets:a,camera:s,utilities:h}={}){let i=new o.Group;i.name="artist-mark-field-alma-thomas-rnp07l-style-system",i.position.set(0,.05,1.1),i.scale.setScalar(1.28),P(i,{targetPartId:e?.id||w,worldPurpose:t?.purpose||null,packetIdentity:`${M}:${S}`});let l=O(h,r||e?.id||w,"alma-thomas-artist-mark-field-cf373ed"),d={paperA:{hex:"#F0DDD2"},paperB:{hex:"#F1E3DC"},paperWhite:{hex:"#EFEEEF"},paleTeal:{hex:"#E1EFF1"},teal:{hex:"#7FB9B7"},deepBlue:{hex:"#01316F"},lowBlue:{hex:"#023F7F"},darkBlue:{hex:"#1F303F"},orange:{hex:"#FD9001"},yellow:{hex:"#FDDF01"},warmRed:{hex:"#E45A1F"},mutedOchre:{hex:"#C8A460"}};for(let g of Object.values(d))g.rgb=W(o,g.hex);let p=new o.PlaneGeometry(26.2,13.2,1,1),f=Y(o,l()*1e3),n=new o.Mesh(p,f);n.name="pale-orange-matte-mosaic-support-plane",n.position.set(0,.02,-7.35),n.frustumCulled=!1,n.renderOrder=-22,n.castShadow=!1,n.receiveShadow=!1,P(n,{markRole:"ordinary spatial plane carrying pale ground and visible hand-painted negative spaces"}),i.add(n);let u=[];G(u,l,d),_(u,l,d),N(u,l,d),j(u,l,d),T(u,l,d);let B=R(o,u),x=X(o),v=new o.Mesh(B,x);v.name="dense-broken-rectangular-alma-thomas-mark-field",v.frustumCulled=!1,v.renderOrder=-6,v.castShadow=!1,v.receiveShadow=!1,P(v,{markRole:"visible artist-style-system: radial-symbols plus all-over-density dashes carrying Against pressure"}),i.add(v),i.userData.artistMarkFieldCounts={brokenRectangularMarks:u.length,radialSystem:"dark blue concentric center with teal, orange, and yellow rings",fractureSystem:"opposing warm and deep-blue broken route-pressure seams",packetId:M,packetHash:S};function F(g={}){let C=g.captureMode?0:Number(g.elapsedSeconds??g.time??0),b=Number.isFinite(C)?C:0,A=Number.isFinite(g.motionIntensity)?U(g.motionIntensity,0,2):1;x.uniforms.uTime.value=b*A,x.uniforms.uCapture.value=g.captureMode?1:0;let D=Math.sin(b*.19)*.012*A;v.position.x=D,v.position.y=Math.sin(b*.13+.7)*.009*A,n.position.y=.02+Math.sin(b*.09)*.006*A}function I(){B.dispose?.(),x.dispose?.(),p.dispose?.(),f.dispose?.()}return F({captureMode:!0,elapsedSeconds:0}),{object:i,update:F,dispose:I,userData:{partId:w,packetId:M,packetHash:S,finalDraft:"drafts/artist-mark-field.module.mjs"}}}export{V as createImmersiveWorldPart};
