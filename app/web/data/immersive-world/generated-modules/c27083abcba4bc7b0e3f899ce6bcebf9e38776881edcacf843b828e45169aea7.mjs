var B="art-direction-packet-cc542c69d2aa",G="cc542c69d2aa779e6b2189f26f92f7a6",F="artist-mark-field";function D(e){let a=String(e??"rothko-brussels-artist-mark-field"),r=2166136261;for(let n=0;n<a.length;n+=1)r^=a.charCodeAt(n),r=Math.imul(r,16777619);return r>>>0}function Y(e,a,r){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(a,r);let n=(D(a)^D(r))>>>0;return function(){n=n+1831565813>>>0;let i=n;return i=Math.imul(i^i>>>15,i|1),i^=i+Math.imul(i^i>>>7,i|61),((i^i>>>14)>>>0)/4294967296}}function O(e,a,r){return Math.max(a,Math.min(r,e))}function C(e,a){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=a,e}function W(e){e.traverse(a=>{a.geometry&&typeof a.geometry.dispose=="function"&&a.geometry.dispose();let r=Array.isArray(a.material)?a.material:[a.material].filter(Boolean);for(let n of r)n.map&&typeof n.map.dispose=="function"&&n.map.dispose(),n.alphaMap&&n.alphaMap!==n.map&&typeof n.alphaMap.dispose=="function"&&n.alphaMap.dispose(),typeof n.dispose=="function"&&n.dispose()})}function U(e,a){let o=new Uint8Array(25600);for(let t=0;t<80;t+=1)for(let s=0;s<80;s+=1){let c=(s-39.5)/40,l=(t-39.5)/(80*.5),h=Math.sqrt(c*c*1.08+l*l*.92),f=O(1-h,0,1),m=.76+Math.sin(s*.41+t*.17)*.11+(a()-.5)*.13,u=f*f*(3-2*f)*m,v=(t*80+s)*4;o[v]=255,o[v+1]=255,o[v+2]=255,o[v+3]=Math.round(O(u,0,1)*255)}let i=new e.DataTexture(o,80,80,e.RGBAFormat);return i.needsUpdate=!0,i.wrapS=e.ClampToEdgeWrapping,i.wrapT=e.ClampToEdgeWrapping,i.minFilter=e.LinearFilter,i.magFilter=e.LinearFilter,i.generateMipmaps=!1,e.SRGBColorSpace&&(i.colorSpace=e.SRGBColorSpace),i}function _(e,a){return new e.ShaderMaterial({name:`${a.name}-matte-stain-shader-material`,transparent:!0,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uCore:{value:new e.Color(a.core)},uEdge:{value:new e.Color(a.edge)},uUnder:{value:new e.Color(a.under)},uAccent:{value:new e.Color(a.accent||a.core)},uOpacity:{value:a.opacity},uGrainScale:{value:a.grainScale||7.5},uEdgeFeather:{value:a.edgeFeather||.16},uSeamY:{value:a.seamY??.5},uBloom:{value:a.bloom||.16},uSeed:{value:a.seed||1}},vertexShader:`
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,fragmentShader:`
      precision highp float;
      uniform float uTime;
      uniform vec3 uCore;
      uniform vec3 uEdge;
      uniform vec3 uUnder;
      uniform vec3 uAccent;
      uniform float uOpacity;
      uniform float uGrainScale;
      uniform float uEdgeFeather;
      uniform float uSeamY;
      uniform float uBloom;
      uniform float uSeed;
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      float sat(float value) { return clamp(value, 0.0, 1.0); }

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34 + uSeed, 456.21 - uSeed * 0.3));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
          mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amp * noise(p);
          p = mat2(1.61, 1.07, -1.07, 1.61) * p + vec2(13.7, 6.9);
          amp *= 0.52;
        }
        return value;
      }

      void main() {
        vec2 uv = vUv;
        float slow = uTime * 0.018;
        vec2 rubbedUv = vec2(uv.x * 1.12 + fbm(uv * 3.2 + slow) * 0.035, uv.y);
        float broad = fbm(rubbedUv * vec2(uGrainScale * 0.72, 2.7) + vec2(0.0, slow));
        float fine = fbm(rubbedUv * vec2(34.0, 18.0) + broad * 3.0);
        float verticalDrag = pow(abs(sin((uv.x + broad * 0.08) * 118.0 + uSeed)), 22.0);
        float horizontalRub = sin((uv.y + fine * 0.06) * 58.0 + uSeed * 2.0) * 0.055;

        float ragLeft = uEdgeFeather + (broad - 0.5) * 0.07;
        float ragRight = uEdgeFeather + (fine - 0.5) * 0.06;
        float edgeX = smoothstep(0.0, ragLeft, uv.x) * (1.0 - smoothstep(1.0 - ragRight, 1.0, uv.x));
        float edgeY = smoothstep(0.0, uEdgeFeather + (fine - 0.5) * 0.045, uv.y) *
          (1.0 - smoothstep(1.0 - uEdgeFeather + (broad - 0.5) * 0.04, 1.0, uv.y));
        float softEdge = edgeX * edgeY;

        float centerGlow = sat(1.0 - length((uv - vec2(0.5, uSeamY)) * vec2(1.28, 1.72)));
        float seam = exp(-pow((uv.y - uSeamY + (broad - 0.5) * 0.045) * 12.0, 2.0));
        float sideSmoke = smoothstep(0.55, 0.98, abs(uv.x - 0.5) * 2.0);

        vec3 color = mix(uUnder, uCore, sat(centerGlow * 0.72 + broad * 0.42));
        color = mix(color, uAccent, seam * uBloom * (0.65 + fine * 0.35));
        color = mix(color, uEdge, sideSmoke * 0.56 + (1.0 - softEdge) * 0.68);
        color *= 0.82 + broad * 0.24 + horizontalRub - verticalDrag * 0.075;
        color += vec3(0.028, 0.023, 0.018) * fine * centerGlow;

        float woven = (sin(vWorldPosition.x * 52.0 + uSeed) + sin(vWorldPosition.y * 70.0 - uSeed)) * 0.012;
        color += woven;
        float alpha = uOpacity * softEdge * (0.77 + broad * 0.24 - verticalDrag * 0.08);
        if (alpha < 0.012) discard;
        gl_FragColor = vec4(max(color, vec3(0.0)), sat(alpha));
      }
    `})}function P(e,a,r){let n=_(e,r),o=new e.Mesh(a,n);return o.name=r.name,o.position.set(r.position[0],r.position[1],r.position[2]),o.rotation.set(r.rotation?.[0]||0,r.rotation?.[1]||0,r.rotation?.[2]||0),o.scale.set(r.scale[0],r.scale[1],1),o.userData={baseX:o.position.x,baseY:o.position.y,baseZ:o.position.z,baseOpacity:r.opacity,phase:r.phase||0,wash:r.wash||.018},C(o,r.renderOrder||20),{mesh:o,material:n}}function L(e,a,r,n,o){let i=new e.PlaneGeometry(1,1,1,1);r.push(i);let t=new e.Group;t.name="rothko-authored-spatial-stain-stack",a.add(t);let s=[{name:"distant-upper-ochre-rubbed-weather-field",core:"#9f5d20",edge:"#16100e",under:"#4b2616",accent:"#c3862f",opacity:.78,edgeFeather:.16,grainScale:6.6,seamY:.58,bloom:.18,seed:11.2+o(),position:[0,2.38,-7.2],scale:[17.8,2.95],phase:.3,wash:.022,renderOrder:12},{name:"floating-burgundy-runner-density-field",core:"#4f1e1b",edge:"#090607",under:"#21100f",accent:"#7c3524",opacity:.86,edgeFeather:.18,grainScale:7.4,seamY:.48,bloom:.13,seed:22.7+o(),position:[0,.68,-5.86],scale:[20.3,2.72],phase:1.3,wash:.026,renderOrder:18},{name:"near-rust-handmade-pressure-interior",core:"#68311f",edge:"#120908",under:"#301611",accent:"#9f5223",opacity:.74,edgeFeather:.19,grainScale:8.2,seamY:.52,bloom:.18,seed:32.4+o(),position:[-.12,-.42,-4.82],scale:[18.9,1.72],phase:2.2,wash:.019,renderOrder:24},{name:"submerged-blue-green-twenty-kilometer-mark",core:"#0c6670",edge:"#061416",under:"#08373c",accent:"#1fb7b3",opacity:.9,edgeFeather:.24,grainScale:9.5,seamY:.54,bloom:.34,seed:43.1+o(),position:[0,-1.42,-4.35],scale:[19.8,.78],phase:3,wash:.012,renderOrder:34},{name:"low-gray-green-weighted-route-field",core:"#464c3d",edge:"#11120f",under:"#282b21",accent:"#68806b",opacity:.56,edgeFeather:.2,grainScale:7,seamY:.46,bloom:.11,seed:53.6+o(),position:[0,-2.38,-5.04],scale:[18.4,1.82],phase:3.9,wash:.018,renderOrder:14},{name:"near-black-top-thunder-compression",core:"#16110f",edge:"#030303",under:"#25150f",accent:"#32342c",opacity:.68,edgeFeather:.2,grainScale:6.2,seamY:.5,bloom:.08,seed:64.8+o(),position:[0,3.78,-5.62],scale:[20.8,.96],phase:4.5,wash:.014,renderOrder:28}];for(let l of s){let{mesh:h,material:f}=P(e,i,l);n.push(f),t.add(h)}let c=[{name:"left-charcoal-smoked-artist-edge-field",core:"#17110f",edge:"#030303",under:"#2a1b14",accent:"#4a3020",opacity:.5,edgeFeather:.24,grainScale:8,seamY:.44,bloom:.1,seed:71.3+o(),position:[-10.4,.35,-4.6],scale:[1.35,6.8],phase:5.1,wash:.009,renderOrder:40},{name:"right-teal-black-smoked-artist-edge-field",core:"#102827",edge:"#030404",under:"#1e1713",accent:"#174e4e",opacity:.43,edgeFeather:.24,grainScale:8.6,seamY:.57,bloom:.12,seed:79.9+o(),position:[10.4,.12,-4.6],scale:[1.28,6.6],phase:5.5,wash:.009,renderOrder:41}];for(let l of c){let{mesh:h,material:f}=P(e,i,l);n.push(f),t.add(h)}return t}function X(e,a,r){let n=[],o=[],i=[];for(let s=0;s<a.length;s+=1){let c=a[Math.max(0,s-1)],l=a[Math.min(a.length-1,s+1)],h=l.x-c.x,f=l.y-c.y,m=Math.hypot(h,f)||1,u=-f/m,v=h/m,p=a[s];n.push(p.x+u*r*.5,p.y+v*r*.5,p.z),n.push(p.x-u*r*.5,p.y-v*r*.5,p.z);let b=s/Math.max(1,a.length-1);if(o.push(b,0,b,1),s<a.length-1){let y=s*2;i.push(y,y+1,y+2,y+1,y+3,y+2)}}let t=new e.BufferGeometry;return t.setAttribute("position",new e.Float32BufferAttribute(n,3)),t.setAttribute("uv",new e.Float32BufferAttribute(o,2)),t.setIndex(i),t.computeVertexNormals(),t}function I(e,a,r,n){let o=new e.Group;o.name="artist-mark-horizontal-fracture-boundaries",a.add(o);let i=[{name:"blue-green-hand-stained-route-seam",y:-1.4,z:-3.98,width:.36,color:"#0b7476",opacity:.68,phase:.7},{name:"black-burgundy-crowd-pressure-seam",y:.04,z:-4.25,width:.28,color:"#180809",opacity:.66,phase:1.6},{name:"ochre-storm-lit-upper-suture",y:1.44,z:-4.82,width:.24,color:"#9e6424",opacity:.42,phase:2.8}];for(let u of i){let v=[];for(let d=0;d<9;d+=1){let k=-10.4+d*2.6;v.push(new e.Vector3(k,u.y+Math.sin(d*1.41+u.phase)*.055,u.z-d*.018))}let p=new e.CatmullRomCurve3(v,!1,"centripetal",.16),b=X(e,p.getPoints(96),u.width);r.push(b);let y=new e.MeshBasicMaterial({name:`${u.name}-matte-rubbed-boundary-material`,color:u.color,transparent:!0,opacity:u.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});n.push(y);let w=new e.Mesh(b,y);w.name=u.name,w.userData={baseOpacity:u.opacity,phase:u.phase,baseY:0},C(w,52),o.add(w)}let t=112,s=new Float32Array(t*2*3),c=new Float32Array(t*2*3),l=[new e.Color("#11100e"),new e.Color("#512018"),new e.Color("#0c5359"),new e.Color("#7e5525")];for(let u=0;u<t;u+=1){let v=u%4,p=[-1.42,-1.24,.08,1.38][v]+Math.sin(u*.73)*.035,b=-10.1+20.2*(u*37%t)/t,y=.2+u*11%9*.07,w=-3.72-v*.24-u%6*.018,d=u*6;s[d]=b,s[d+1]=p,s[d+2]=w,s[d+3]=b+y,s[d+4]=p+Math.sin(u*1.29)*.028,s[d+5]=w-.04;let k=l[u%l.length];c[d]=k.r,c[d+1]=k.g,c[d+2]=k.b,c[d+3]=k.r,c[d+4]=k.g,c[d+5]=k.b}let h=new e.BufferGeometry;h.setAttribute("position",new e.BufferAttribute(s,3)),h.setAttribute("color",new e.BufferAttribute(c,3)),r.push(h);let f=new e.LineBasicMaterial({name:"short-scumbled-fracture-ticks-material",vertexColors:!0,transparent:!0,opacity:.58,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});n.push(f);let m=new e.LineSegments(h,f);return m.name="short-scumbled-fracture-ticks-through-stained-fields",m.userData={baseOpacity:.58,phase:3.2},C(m,58),o.add(m),o}function $(e,a,r,n){let o=new e.Group;o.name="secondary-radial-brussels-pressure-symbols",a.add(o);let i=[{name:"left-muted-ochre-route-halo",color:"#8d5b25",opacity:.32,position:[-5.7,-.18,-4.45],scale:[2.75,1.08,1],phase:.4},{name:"center-teal-submerged-route-halo",color:"#0b6c73",opacity:.38,position:[.1,-1.36,-3.95],scale:[3.45,.52,1],phase:1.5},{name:"right-burgundy-weather-pressure-halo",color:"#5f231a",opacity:.28,position:[5.9,.34,-4.3],scale:[2.52,1.18,1],phase:2.3}];for(let t of i){let s=new e.RingGeometry(.74,1,96,1);r.push(s);let c=new e.MeshBasicMaterial({name:`${t.name}-soft-radial-stain-material`,color:t.color,transparent:!0,opacity:t.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});n.push(c);let l=new e.Mesh(s,c);l.name=t.name,l.position.set(t.position[0],t.position[1],t.position[2]),l.scale.set(t.scale[0],t.scale[1],t.scale[2]),l.userData={baseOpacity:t.opacity,phase:t.phase,baseScaleX:t.scale[0],baseScaleY:t.scale[1]},C(l,46),o.add(l);let h=new e.RingGeometry(.18,.27,64,1);r.push(h);let f=c.clone();f.name=`${t.name}-inner-pulse-stain-material`,f.opacity=t.opacity*.78,n.push(f);let m=new e.Mesh(h,f);m.name=`${t.name}-inner-pulse`,m.position.copy(l.position),m.position.z+=.03,m.scale.set(t.scale[0]*1.35,t.scale[1]*1.35,1),m.userData={baseOpacity:t.opacity*.78,phase:t.phase+.6,baseScaleX:t.scale[0]*1.35,baseScaleY:t.scale[1]*1.35},C(m,47),o.add(m)}return o}function N(e,a,r,n,o,i){let t=U(e,i);o.push(t);let s=760,c=new Float32Array(s*3),l=new Float32Array(s*3),h=new Float32Array(s),f=[new e.Color("#0b6870"),new e.Color("#12464a"),new e.Color("#87511f"),new e.Color("#6a2c20"),new e.Color("#171211"),new e.Color("#4a4f40")];for(let p=0;p<s;p+=1){let b=p%7,y=[-1.63,-1.47,-1.29,-.1,.1,1.34,1.54][b],w=p%5!==0,d=w?-6.9+i()*13.8:-10.4+i()*20.8,k=y+(i()-.5)*(w?.16:.36),A=-3.25-i()*3-b*.055;c[p*3]=d,c[p*3+1]=k,c[p*3+2]=A;let S=f[(p+b*2)%f.length],x=.76+i()*.22;l[p*3]=S.r*x,l[p*3+1]=S.g*x,l[p*3+2]=S.b*x,h[p]=.18+i()*.22}let m=new e.BufferGeometry;m.setAttribute("position",new e.BufferAttribute(c,3)),m.setAttribute("color",new e.BufferAttribute(l,3)),m.setAttribute("artistSize",new e.BufferAttribute(h,1)),r.push(m);let u=new e.ShaderMaterial({name:"fifty-thousand-brussels-pigment-mark-field-material",transparent:!0,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTexture:{value:t},uTime:{value:0},uOpacity:{value:.52},uSizeScale:{value:1}},vertexShader:`
      attribute float artistSize;
      varying vec3 vColor;
      uniform float uTime;
      uniform float uSizeScale;
      void main() {
        vColor = color;
        vec3 moved = position;
        moved.x += sin(uTime * 0.12 + position.y * 1.7 + position.z) * 0.025;
        moved.y += sin(uTime * 0.15 + position.x * 0.31) * 0.012;
        vec4 mvPosition = modelViewMatrix * vec4(moved, 1.0);
        gl_PointSize = artistSize * uSizeScale * (300.0 / max(1.0, -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,fragmentShader:`
      precision highp float;
      uniform sampler2D uTexture;
      uniform float uOpacity;
      varying vec3 vColor;
      void main() {
        vec4 mark = texture2D(uTexture, gl_PointCoord);
        if (mark.a < 0.02) discard;
        gl_FragColor = vec4(vColor * (0.86 + mark.a * 0.2), mark.a * uOpacity);
      }
    `,vertexColors:!0});n.push(u);let v=new e.Points(m,u);return v.name="concentrated-brussels-runner-pigment-mark-field",v.userData={baseOpacity:.52,phase:.9},C(v,60),a.add(v),v}function V(e,a,r,n,o){let t=new Float32Array(408),s=new Float32Array(408),c=[new e.Color("#24231f"),new e.Color("#354037"),new e.Color("#0f5058"),new e.Color("#5a351a")];for(let m=0;m<68;m+=1){let u=-10.5+o()*21,v=2.45+o()*1.68,p=.34+o()*1.28,b=-3.9-o()*4.8,y=m*6;t[y]=u,t[y+1]=v,t[y+2]=b,t[y+3]=u+(o()-.5)*.36,t[y+4]=v-p,t[y+5]=b-.1;let w=c[m%c.length];s[y]=w.r,s[y+1]=w.g,s[y+2]=w.b,s[y+3]=w.r,s[y+4]=w.g,s[y+5]=w.b}let l=new e.BufferGeometry;l.setAttribute("position",new e.BufferAttribute(t,3)),l.setAttribute("color",new e.BufferAttribute(s,3)),r.push(l);let h=new e.LineBasicMaterial({name:"restrained-thunderstorm-vertical-stain-wash-material",vertexColors:!0,transparent:!0,opacity:.42,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});n.push(h);let f=new e.LineSegments(l,h);return f.name="restrained-thunderstorm-vertical-stain-wash",f.userData={baseOpacity:.42,phase:1.8},C(f,50),a.add(f),f}function K({THREE:e,part:a,world:r,seed:n,assets:o,camera:i,utilities:t}={}){let s=Y(t,n||a?.id||F,"mark-rothko-brussels-artist-mark-field"),c=new e.Group;c.name="artist-mark-field-rothko-brussels-style-system",c.userData={partId:F,role:a?.role||"artist-style-system",packetId:B,packetHash:G,artist:"Mark Rothko",selectedNews:"Nearly 50,000 people to run 20 km through Brussels on Sunday, thunderstorms forecast",visualTarget:"matte stained color fields, radial pressure symbols, and non-literal fracture marks"},c.scale.set(1.26,1.22,1);let l=[],h=[],f=[],m=L(e,c,l,h,s),u=I(e,c,l,h),v=$(e,c,l,h),p=N(e,c,l,h,f,s),b=V(e,c,l,h,s),y=({elapsedSeconds:d=0,captureMode:k=!1,motionIntensity:A=1}={})=>{let S=k?9.5:d,x=O(Number(A)||1,0,1.6);m.children.forEach(g=>{let M=g.userData||{},z=M.phase||0;g.position.x=M.baseX+Math.sin(S*.13+z*.73)*M.wash*.48*x,g.position.y=M.baseY+Math.sin(S*.21+z)*M.wash*x,g.position.z=M.baseZ+Math.sin(S*.09+z*.31)*M.wash*.32*x,g.material&&(g.material.uniforms.uTime.value=S,g.material.uniforms.uOpacity.value=M.baseOpacity*(.96+Math.sin(S*.18+z)*.035*x))}),u.children.forEach(g=>{g.material&&g.userData&&typeof g.userData.baseOpacity=="number"&&(g.material.opacity=g.userData.baseOpacity*(.94+Math.sin(S*.17+g.userData.phase)*.045*x))}),v.children.forEach(g=>{let M=g.userData||{},z=1+Math.sin(S*.2+M.phase)*.022*x;g.scale.x=M.baseScaleX*z,g.scale.y=M.baseScaleY*(1+Math.sin(S*.16+M.phase*.8)*.018*x),g.material&&(g.material.opacity=M.baseOpacity*(.9+Math.sin(S*.19+M.phase)*.06*x))}),p.material&&(p.material.uniforms.uTime.value=S,p.material.uniforms.uOpacity.value=p.userData.baseOpacity*(.94+Math.sin(S*.14)*.035*x),p.material.uniforms.uSizeScale.value=1+Math.sin(S*.11)*.04*x,p.rotation.z=Math.sin(S*.045)*.005*x),b.material&&(b.material.opacity=b.userData.baseOpacity*(.86+Math.sin(S*.12+1.4)*.08*x))},w=()=>{W(c);for(let d of l)d&&typeof d.dispose=="function"&&d.dispose();for(let d of h)d&&typeof d.dispose=="function"&&d.dispose();for(let d of f)d&&typeof d.dispose=="function"&&d.dispose()};return y({elapsedSeconds:9.5,captureMode:!0}),{object:c,update:y,dispose:w}}export{K as createImmersiveWorldPart};
