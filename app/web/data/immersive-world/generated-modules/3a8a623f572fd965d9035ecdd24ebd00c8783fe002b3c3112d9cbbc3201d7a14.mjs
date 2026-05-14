var R="art-direction-packet-0f87c43ee66b",H="0f87c43ee66b783d32924c4677074f39";function Z(e){let n=String(e??"artist-mark-field-rothko"),p=2166136261;for(let s=0;s<n.length;s+=1)p^=n.charCodeAt(s),p=Math.imul(p,16777619);return p>>>0}function E(e,n,p){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(n,p);let s=(Z(n)^Z(p))>>>0;return function(){s=s+1831565813>>>0;let o=s;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296}}function w(e){return Math.max(0,Math.min(1,e))}function ee(e){e.traverse(n=>{n.geometry&&typeof n.geometry.dispose=="function"&&n.geometry.dispose();let p=Array.isArray(n.material)?n.material:[n.material].filter(Boolean);for(let s of p)s&&typeof s.dispose=="function"&&s.dispose(),s?.map&&typeof s.map.dispose=="function"&&s.map.dispose()})}function te(e,n,p,s={}){let b=s.width||160,o=s.height||112,c=s.edgeFeather??.18,d=s.alphaScale??1,f=s.streakStrength??.16,h=new e.Color(p),x=new Uint8Array(b*o*4),D=new Float32Array(b);for(let l=0;l<b;l+=1)D[l]=.78+n()*.34+Math.sin(l*.19+n()*4)*.05;for(let l=0;l<o;l+=1)for(let u=0;u<b;u+=1){let B=u/(b-1),M=l/(o-1),k=Math.min(B,1-B,M,1-M),I=w(k/c),G=Math.sin(u*.31+l*.03)*f,F=Math.sin(u*.071+l*.119)*.08+Math.sin(u*.19-l*.043)*.05,P=(n()-.5)*.18,_=(u%6===0?-.035:0)+(l%7===0?-.026:0),v=w(.82+D[u]*.16+G+F+P+_),C=w(I*(.68+n()*.26+Math.sin((u+l)*.21)*.06)),A=(l*b+u)*4;x[A]=Math.round(w(h.r*v*1.22)*255),x[A+1]=Math.round(w(h.g*v*1.22)*255),x[A+2]=Math.round(w(h.b*v*1.22)*255),x[A+3]=Math.round(w(C*d)*255)}let y=new e.DataTexture(x,b,o,e.RGBAFormat);return y.needsUpdate=!0,e.SRGBColorSpace&&(y.colorSpace=e.SRGBColorSpace),y.wrapS=e.ClampToEdgeWrapping,y.wrapT=e.ClampToEdgeWrapping,y}function oe(e,n,p){let o=new e.Color(p),c=new Uint8Array(6528*4);for(let f=0;f<34;f+=1)for(let h=0;h<192;h+=1){let x=h/191,D=f/33,y=1-Math.abs(D-.5)*2,l=Math.sin(x*Math.PI),u=.58+Math.sin(h*.37+f*1.7)*.2+(n()-.5)*.24,B=w(Math.pow(y,.7)*Math.pow(l,.42)*u),M=w(.74+Math.sin(h*.13)*.08+(n()-.5)*.16),k=(f*192+h)*4;c[k]=Math.round(w(o.r*M*1.35)*255),c[k+1]=Math.round(w(o.g*M*1.35)*255),c[k+2]=Math.round(w(o.b*M*1.35)*255),c[k+3]=Math.round(B*210)}let d=new e.DataTexture(c,192,34,e.RGBAFormat);return d.needsUpdate=!0,e.SRGBColorSpace&&(d.colorSpace=e.SRGBColorSpace),d.wrapS=e.ClampToEdgeWrapping,d.wrapT=e.ClampToEdgeWrapping,d}function ae(e){return new e.ShaderMaterial({name:"artist_mark_field_position_space_wash_bloom_shell",side:e.BackSide,transparent:!0,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uOpacity:{value:.64},uMaroon:{value:new e.Color("#40162c")},uViolet:{value:new e.Color("#181225")},uGreen:{value:new e.Color("#35483b")},uTeal:{value:new e.Color("#0b5962")},uRust:{value:new e.Color("#87311f")},uOchre:{value:new e.Color("#b86822")},uBlack:{value:new e.Color("#0e0a0d")},uCobalt:{value:new e.Color("#063dc7")},uRed:{value:new e.Color("#bd1a10")}},vertexShader:`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vDir;
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uMaroon;
      uniform vec3 uViolet;
      uniform vec3 uGreen;
      uniform vec3 uTeal;
      uniform vec3 uRust;
      uniform vec3 uOchre;
      uniform vec3 uBlack;
      uniform vec3 uCobalt;
      uniform vec3 uRed;

      float hash(vec2 p) {
        p = fract(p * vec2(241.7, 317.3));
        p += dot(p, p + 23.31);
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
        float value = 0.0;
        float amp = 0.52;
        for (int i = 0; i < 5; i++) {
          value += amp * noise(p);
          p = p * 2.04 + vec2(6.1, 9.7);
          amp *= 0.52;
        }
        return value;
      }

      float band(float y, float center, float halfHeight, float feather) {
        return 1.0 - smoothstep(halfHeight, halfHeight + feather, abs(y - center));
      }

      void main() {
        vec3 dir = normalize(vDir);
        float angle = atan(dir.x, -dir.z);
        float x = clamp(angle / 1.2, -1.25, 1.25);
        float y = dir.y;
        float slow = uTime * 0.014;
        float stain = fbm(vec2(angle * 1.2 + slow, y * 3.7));
        float fiber = fbm(vec2(angle * 28.0, y * 42.0 - slow * 5.0));
        float seamDrift = (stain - 0.5) * 0.095 + sin(angle * 2.4 + uTime * 0.038) * 0.018;
        vec3 upperLeft = mix(uViolet, uMaroon, 0.28 + stain * 0.58);
        vec3 upperRight = mix(uGreen, uTeal, 0.18 + stain * 0.4);
        vec3 upper = mix(upperLeft, upperRight, smoothstep(-0.08 + seamDrift, 0.24 + seamDrift, x));
        vec3 lower = mix(uRust, uOchre, 0.18 + stain * 0.58);
        vec3 color = mix(lower, upper, smoothstep(-0.12 + seamDrift, 0.18 + seamDrift, y));
        float hinge = band(y + seamDrift, -0.09, 0.086, 0.12) * (0.48 + 0.52 * smoothstep(1.12, 0.08, abs(x)));
        float cobalt = band(y + seamDrift, -0.29, 0.038, 0.08) * smoothstep(1.04, 0.06, abs(x + 0.18));
        float redCrack = band(x - seamDrift, 0.0, 0.022, 0.058) * smoothstep(-0.56, 0.14, y) * smoothstep(0.78, 0.08, abs(y));
        color = mix(color, uBlack, hinge * 0.76 + smoothstep(0.72, 1.18, abs(x)) * 0.34);
        color = mix(color, uCobalt, cobalt * 0.74);
        color = mix(color, uRed, redCrack * 0.68);
        color += (stain - 0.5) * 0.12 + (fiber - 0.5) * 0.05;
        float alpha = uOpacity * (0.2 + hinge * 0.38 + cobalt * 0.22 + redCrack * 0.25);
        gl_FragColor = vec4(max(color, vec3(0.0)), clamp(alpha, 0.1, 0.76));
      }
    `})}function W(e,n){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=n,e}function re({THREE:e,part:n,world:p,seed:s,utilities:b}){let o=E(b,s||n?.id||"artist-mark-field","rothko-style-system-two-fan-zones"),c=new e.Group;c.name="artist-mark-field-rothko-two-fan-zone-style-system",c.userData={partId:"artist-mark-field",role:n?.role||"artist-style-system",packetId:R,packetHash:H,messagePurpose:"Artist mark field: matte Rothko stains, suspended planes, soft seams, radial pressure symbols, and brush deposits around the viewer."};let d=[],f=[],h=Math.max(22,Math.min(34,Number(p?.environment?.radius||28))),x=new e.SphereGeometry(h,96,48),D=ae(e);f.push(x),d.push(D);let y=new e.Mesh(x,D);y.name="full-surround-rothko-mark-wash-bloom-shell",W(y,-66),c.add(y);let l=new e.PlaneGeometry(1,1,1,1);f.push(l);let u=new e.Group;u.name="distributed-soft-edged-stained-color-fields";let B=[{name:"left-burgundy-violet-fan-zone-field",color:"#38142a",opacity:.78,position:[-7.4,2.34,-2.6],scale:[25.4,7.2,1],rotation:[.02,.18,-.012],order:-48},{name:"right-muted-green-teal-fan-zone-field",color:"#35483b",opacity:.78,position:[7.2,2.24,-2.8],scale:[25.8,7,1],rotation:[.018,-.18,.016],order:-47},{name:"low-rust-ochre-crowd-weight-field",color:"#87311f",opacity:.84,position:[0,-1.62,-2.05],scale:[39.6,8.2,1],rotation:[.016,0,.007],order:-46},{name:"low-ochre-absorbed-wash-bloom",color:"#b86822",opacity:.56,position:[2.6,-2.3,-3.7],scale:[31.2,6.1,1],rotation:[.035,-.07,-.014],order:-45},{name:"central-near-black-soft-hinge-band",color:"#0e0a0d",opacity:.92,position:[0,-.3,-1.38],scale:[42,1.42,1],rotation:[.01,0,-.004],order:-37},{name:"thin-green-teal-counterpoint-seam",color:"#163d34",opacity:.74,position:[1.1,-.76,-1.25],scale:[35.2,.72,1],rotation:[.012,-.018,.014],order:-36},{name:"submerged-cobalt-final-coupe-pulse-band",color:"#063dc7",opacity:.86,position:[-1.8,-1.06,-1.12],scale:[27.4,.56,1],rotation:[.012,.026,-.012],order:-35},{name:"red-vertical-pressure-fracture-between-zones",color:"#bd1a10",opacity:.68,position:[.08,.04,-1.03],scale:[1.28,6.8,1],rotation:[.02,.012,.018],order:-34},{name:"left-wrapping-smoky-edge-field",color:"#21101a",opacity:.42,position:[-13.8,-.02,.35],scale:[20.4,5.6,1],rotation:[0,1.14,-.036],order:-30},{name:"right-wrapping-cool-edge-field",color:"#0a3940",opacity:.4,position:[13.8,.08,.28],scale:[20.4,5.6,1],rotation:[0,-1.14,.034],order:-29},{name:"overhead-smoked-violet-absorbing-field",color:"#171022",opacity:.36,position:[0,5.1,-5.8],scale:[34,7.4,1],rotation:[-.34,0,.01],order:-31},{name:"foreground-low-matte-rust-veil",color:"#5c201b",opacity:.34,position:[0,-4.28,4.6],scale:[36,5.2,1],rotation:[.18,0,0],order:-22}];for(let t of B){let i=te(e,o,t.color,{edgeFeather:t.name.includes("band")||t.name.includes("seam")?.25:.16,alphaScale:t.opacity>.8?.96:.88,streakStrength:t.name.includes("fracture")?.23:.15}),a=new e.MeshBasicMaterial({name:`${t.name}-matte-stain-material`,map:i,transparent:!0,opacity:t.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});d.push(a);let r=new e.Mesh(l,a);r.name=t.name,r.position.set(t.position[0],t.position[1],t.position[2]),r.rotation.set(t.rotation[0],t.rotation[1],t.rotation[2]),r.scale.set(t.scale[0],t.scale[1],t.scale[2]),r.userData.baseY=r.position.y,r.userData.baseOpacity=t.opacity,r.userData.phase=o()*Math.PI*2,r.userData.floatAmount=.012+o()*.025,W(r,t.order),u.add(r)}c.add(u);let M=new e.Group;M.name="ragged-brush-and-edge-deposit-field";let I=["#0e0a0d","#bd1a10","#063dc7","#173b32","#9b4a1d","#42162c"].map(t=>{let i=oe(e,o,t),a=new e.MeshBasicMaterial({name:`ragged-brush-stroke-${t}`,map:i,transparent:!0,opacity:t==="#0e0a0d"?.5:.62,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});return d.push(a),a});for(let t=0;t<54;t+=1){let i=t%4===0,a=t%5===0,r=i?(o()-.5)*2.2:-17.5+o()*35,S=a?-.85+(o()-.5)*.48:-2.9+o()*5.9,$=-1.18-o()*6.8,m=new e.Mesh(l,I[t%I.length]);m.name=`floating-ragged-rothko-edge-brush-${String(t+1).padStart(2,"0")}`,m.position.set(r,S,$),m.rotation.set((o()-.5)*.08,(o()-.5)*.18,(o()-.5)*.24);let N=i?.62+o()*1.3:2+o()*5.8,q=i?.08+o()*.2:.09+o()*.24;m.scale.set(N,q,1),m.userData.baseY=m.position.y,m.userData.phase=o()*Math.PI*2,m.userData.floatAmount=.008+o()*.02,W(m,-16+t%6),M.add(m)}c.add(M);let G=new e.Group;G.name="submerged-radial-finale-coupe-symbol-pressure";let F=[new e.MeshBasicMaterial({color:"#063dc7",transparent:!0,opacity:.28,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#0e0a0d",transparent:!0,opacity:.3,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#7a2e1d",transparent:!0,opacity:.22,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#173b32",transparent:!0,opacity:.2,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1})];d.push(...F);for(let t=0;t<8;t+=1){let i=1.8+t*.76,a=new e.RingGeometry(i,i+.07,128);f.push(a);let r=new e.Mesh(a,F[t%F.length]);r.name=`soft-radial-cup-final-pressure-mark-${t+1}`,r.position.set((t-3.5)*.92,-.78-t*.1,-5.8-t*.86),r.rotation.set(.06+t*.01,(t-3.5)*.028,(o()-.5)*.08),r.scale.y=.55,r.userData.phase=o()*Math.PI*2,W(r,-12+t),G.add(r)}c.add(G);let P=new e.BufferGeometry;f.push(P);let _=104,v=new Float32Array(_*2*3),C=new Float32Array(_*2*3),A=[new e.Color("#0e0a0d"),new e.Color("#bd1a10"),new e.Color("#063dc7"),new e.Color("#173b32"),new e.Color("#8b3a1e")];for(let t=0;t<_;t+=1){let i=t%3===0,a=t%7!==0,r=i?(o()-.5)*1.35:-19+o()*38,S=a?-.96+(o()-.5)*.88:-3.2+o()*6.6,$=-1.34-o()*9.4,m=a?r+.9+o()*3.6:r+(o()-.5)*.22,N=a?S+(o()-.5)*.16:S+.9+o()*2.2,q=$-o()*.38,g=t*6;v[g]=r,v[g+1]=S,v[g+2]=$,v[g+3]=m,v[g+4]=N,v[g+5]=q;let z=A[t%A.length];C[g]=z.r,C[g+1]=z.g,C[g+2]=z.b,C[g+3]=z.r,C[g+4]=z.g,C[g+5]=z.b}P.setAttribute("position",new e.BufferAttribute(v,3)),P.setAttribute("color",new e.BufferAttribute(C,3));let J=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:.5,depthWrite:!1,depthTest:!0,toneMapped:!1});d.push(J);let O=new e.LineSegments(P,J);O.name="ragged-soft-seam-and-fracture-edge-deposits",W(O,-6),c.add(O);let L=new e.BufferGeometry;f.push(L);let K=340,U=new Float32Array(K*3),V=new Float32Array(K*3),Q=[new e.Color("#063dc7"),new e.Color("#bd1a10"),new e.Color("#173b32"),new e.Color("#a75a1e"),new e.Color("#120d0d"),new e.Color("#42162c")];for(let t=0;t<K;t+=1){let i=o()*Math.PI*2,a=4.2+o()*12.8,r=t%6===0?.22:1;U[t*3]=Math.sin(i)*a*r,U[t*3+1]=-3.4+o()*6.8,U[t*3+2]=-1.8-o()*11.8;let S=Q[t%Q.length];V[t*3]=S.r,V[t*3+1]=S.g,V[t*3+2]=S.b}L.setAttribute("position",new e.BufferAttribute(U,3)),L.setAttribute("color",new e.BufferAttribute(V,3));let X=new e.PointsMaterial({size:.18,transparent:!0,opacity:.42,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});d.push(X);let Y=new e.Points(L,X);Y.name="submerged-high-chroma-pigment-grain-field",W(Y,-4),c.add(Y);function j(t={}){let i=t.captureMode?0:Number(t.elapsedSeconds??t.time??0);D.uniforms.uTime.value=i;for(let a of u.children)a.position.y=a.userData.baseY+Math.sin(i*.07+a.userData.phase)*a.userData.floatAmount,a.material.opacity=a.userData.baseOpacity*(.965+Math.sin(i*.11+a.userData.phase)*.03);for(let a of M.children)a.position.y=a.userData.baseY+Math.sin(i*.12+a.userData.phase)*a.userData.floatAmount;G.rotation.z=Math.sin(i*.04)*.018,O.rotation.z=Math.sin(i*.032)*.006,Y.rotation.y=Math.sin(i*.028)*.03}function T(){ee(c);for(let t of f)t&&typeof t.dispose=="function"&&t.dispose();for(let t of d)t&&typeof t.dispose=="function"&&t.dispose()}return{object:c,update:j,dispose:T}}export{re as createImmersiveWorldPart};
