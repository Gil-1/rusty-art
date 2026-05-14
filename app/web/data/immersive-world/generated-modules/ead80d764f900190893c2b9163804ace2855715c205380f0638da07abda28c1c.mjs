var R="art-direction-packet-0f87c43ee66b",H="0f87c43ee66b783d32924c4677074f39";function Z(e){let s=String(e??"artist-mark-field-rothko"),u=2166136261;for(let n=0;n<s.length;n+=1)u^=s.charCodeAt(n),u=Math.imul(u,16777619);return u>>>0}function E(e,s,u){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(s,u);let n=(Z(s)^Z(u))>>>0;return function(){n=n+1831565813>>>0;let o=n;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296}}function w(e){return Math.max(0,Math.min(1,e))}function ee(e){e.traverse(s=>{s.geometry&&typeof s.geometry.dispose=="function"&&s.geometry.dispose();let u=Array.isArray(s.material)?s.material:[s.material].filter(Boolean);for(let n of u)n&&typeof n.dispose=="function"&&n.dispose(),n?.map&&typeof n.map.dispose=="function"&&n.map.dispose()})}function te(e,s,u,n={}){let y=n.width||160,o=n.height||112,c=n.edgeFeather??.18,d=n.alphaScale??1,f=n.streakStrength??.16,h=new e.Color(u),x=new Uint8Array(y*o*4),k=new Float32Array(y);for(let l=0;l<y;l+=1)k[l]=.78+s()*.34+Math.sin(l*.19+s()*4)*.05;for(let l=0;l<o;l+=1)for(let p=0;p<y;p+=1){let B=p/(y-1),v=l/(o-1),D=Math.min(B,1-B,v,1-v),I=w(D/c),G=Math.sin(p*.31+l*.03)*f,W=Math.sin(p*.071+l*.119)*.08+Math.sin(p*.19-l*.043)*.05,P=(s()-.5)*.18,_=(p%6===0?-.035:0)+(l%7===0?-.026:0),M=w(.82+k[p]*.16+G+W+P+_),C=w(I*(.68+s()*.26+Math.sin((p+l)*.21)*.06)),A=(l*y+p)*4;x[A]=Math.round(w(h.r*M*1.22)*255),x[A+1]=Math.round(w(h.g*M*1.22)*255),x[A+2]=Math.round(w(h.b*M*1.22)*255),x[A+3]=Math.round(w(C*d)*255)}let b=new e.DataTexture(x,y,o,e.RGBAFormat);return b.needsUpdate=!0,e.SRGBColorSpace&&(b.colorSpace=e.SRGBColorSpace),b.wrapS=e.ClampToEdgeWrapping,b.wrapT=e.ClampToEdgeWrapping,b}function oe(e,s,u){let o=new e.Color(u),c=new Uint8Array(6528*4);for(let f=0;f<34;f+=1)for(let h=0;h<192;h+=1){let x=h/191,k=f/33,b=1-Math.abs(k-.5)*2,l=Math.sin(x*Math.PI),p=.58+Math.sin(h*.37+f*1.7)*.2+(s()-.5)*.24,B=w(Math.pow(b,.7)*Math.pow(l,.42)*p),v=w(.74+Math.sin(h*.13)*.08+(s()-.5)*.16),D=(f*192+h)*4;c[D]=Math.round(w(o.r*v*1.35)*255),c[D+1]=Math.round(w(o.g*v*1.35)*255),c[D+2]=Math.round(w(o.b*v*1.35)*255),c[D+3]=Math.round(B*210)}let d=new e.DataTexture(c,192,34,e.RGBAFormat);return d.needsUpdate=!0,e.SRGBColorSpace&&(d.colorSpace=e.SRGBColorSpace),d.wrapS=e.ClampToEdgeWrapping,d.wrapT=e.ClampToEdgeWrapping,d}function ae(e){return new e.ShaderMaterial({name:"artist_mark_field_position_space_wash_bloom_shell",side:e.BackSide,transparent:!0,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uOpacity:{value:.64},uMaroon:{value:new e.Color("#40162c")},uViolet:{value:new e.Color("#181225")},uGreen:{value:new e.Color("#35483b")},uTeal:{value:new e.Color("#0b5962")},uRust:{value:new e.Color("#87311f")},uOchre:{value:new e.Color("#b86822")},uBlack:{value:new e.Color("#0e0a0d")},uCobalt:{value:new e.Color("#063dc7")},uRed:{value:new e.Color("#bd1a10")}},vertexShader:`
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vPosition;
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

      float triplanarFbm(vec3 p, vec3 dir) {
        vec3 weights = pow(abs(dir), vec3(3.5));
        weights /= max(weights.x + weights.y + weights.z, 0.0001);
        float xy = fbm(p.xy + vec2(3.4, 6.2));
        float yz = fbm(p.yz + vec2(8.1, 2.7));
        float zx = fbm(p.zx + vec2(1.9, 9.4));
        return xy * weights.z + yz * weights.x + zx * weights.y;
      }

      float band(float y, float center, float halfHeight, float feather) {
        return 1.0 - smoothstep(halfHeight, halfHeight + feather, abs(y - center));
      }

      void main() {
        vec3 dir = normalize(vPosition);
        float x = clamp(dir.x * 1.2, -1.25, 1.25);
        float y = dir.y;
        float poleFade = 1.0 - smoothstep(0.78, 0.97, abs(y));
        float slow = uTime * 0.014;
        vec3 domain = vec3(dir.x * 1.34, y * 1.7, dir.z * 1.34);
        float stain = triplanarFbm(domain * 1.85 + vec3(slow, -slow * 0.32, slow * 0.24), dir);
        float fiber = triplanarFbm(domain * 21.0 + vec3(0.0, y * 2.2 - slow * 3.4, slow), dir);
        float seamDrift = ((stain - 0.5) * 0.095 + sin((dir.x - dir.z) * 2.4 + uTime * 0.038) * 0.018) * (0.45 + 0.55 * poleFade);
        vec3 upperLeft = mix(uViolet, uMaroon, 0.28 + stain * 0.58);
        vec3 upperRight = mix(uGreen, uTeal, 0.18 + stain * 0.4);
        vec3 upper = mix(upperLeft, upperRight, smoothstep(-0.08 + seamDrift, 0.24 + seamDrift, x));
        vec3 lower = mix(uRust, uOchre, 0.18 + stain * 0.58);
        vec3 color = mix(lower, upper, smoothstep(-0.12 + seamDrift, 0.18 + seamDrift, y));
        float hinge = band(y + seamDrift, -0.09, 0.086, 0.12) * (0.48 + 0.52 * smoothstep(1.12, 0.08, abs(x))) * poleFade;
        float cobalt = band(y + seamDrift, -0.29, 0.038, 0.08) * smoothstep(1.04, 0.06, abs(x + 0.18)) * poleFade;
        float redCrack = band(x - seamDrift, 0.0, 0.022, 0.058) * smoothstep(-0.56, 0.14, y) * smoothstep(0.78, 0.08, abs(y)) * poleFade;
        color = mix(color, uBlack, hinge * 0.76 + smoothstep(0.72, 1.18, abs(x)) * 0.34 * poleFade);
        color = mix(color, uCobalt, cobalt * 0.74);
        color = mix(color, uRed, redCrack * 0.68);
        vec3 poleWash = mix(lower, mix(upperLeft, upperRight, 0.5), smoothstep(-0.28, 0.58, y));
        color = mix(color, poleWash + (stain - 0.5) * 0.055, smoothstep(0.84, 0.985, abs(y)) * 0.7);
        color += (stain - 0.5) * 0.12 + (fiber - 0.5) * 0.05;
        float alpha = uOpacity * (0.2 + hinge * 0.38 + cobalt * 0.22 + redCrack * 0.25);
        gl_FragColor = vec4(max(color, vec3(0.0)), clamp(alpha, 0.1, 0.76));
      }
    `})}function F(e,s){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=s,e}function re({THREE:e,part:s,world:u,seed:n,utilities:y}){let o=E(y,n||s?.id||"artist-mark-field","rothko-style-system-two-fan-zones"),c=new e.Group;c.name="artist-mark-field-rothko-two-fan-zone-style-system",c.userData={partId:"artist-mark-field",role:s?.role||"artist-style-system",packetId:R,packetHash:H,messagePurpose:"Artist mark field: matte Rothko stains, suspended planes, soft seams, radial pressure symbols, and brush deposits around the viewer."};let d=[],f=[],h=Math.max(22,Math.min(34,Number(u?.environment?.radius||28))),x=new e.SphereGeometry(h,96,48),k=ae(e);f.push(x),d.push(k);let b=new e.Mesh(x,k);b.name="full-surround-rothko-mark-wash-bloom-shell",F(b,-66),c.add(b);let l=new e.PlaneGeometry(1,1,1,1);f.push(l);let p=new e.Group;p.name="distributed-soft-edged-stained-color-fields";let B=[{name:"left-burgundy-violet-fan-zone-field",color:"#38142a",opacity:.78,position:[-7.4,2.34,-2.6],scale:[25.4,7.2,1],rotation:[.02,.18,-.012],order:-48},{name:"right-muted-green-teal-fan-zone-field",color:"#35483b",opacity:.78,position:[7.2,2.24,-2.8],scale:[25.8,7,1],rotation:[.018,-.18,.016],order:-47},{name:"low-rust-ochre-crowd-weight-field",color:"#87311f",opacity:.84,position:[0,-1.62,-2.05],scale:[39.6,8.2,1],rotation:[.016,0,.007],order:-46},{name:"low-ochre-absorbed-wash-bloom",color:"#b86822",opacity:.56,position:[2.6,-2.3,-3.7],scale:[31.2,6.1,1],rotation:[.035,-.07,-.014],order:-45},{name:"central-near-black-soft-hinge-band",color:"#0e0a0d",opacity:.92,position:[0,-.3,-1.38],scale:[42,1.42,1],rotation:[.01,0,-.004],order:-37},{name:"thin-green-teal-counterpoint-seam",color:"#163d34",opacity:.74,position:[1.1,-.76,-1.25],scale:[35.2,.72,1],rotation:[.012,-.018,.014],order:-36},{name:"submerged-cobalt-final-coupe-pulse-band",color:"#063dc7",opacity:.86,position:[-1.8,-1.06,-1.12],scale:[27.4,.56,1],rotation:[.012,.026,-.012],order:-35},{name:"red-vertical-pressure-fracture-between-zones",color:"#bd1a10",opacity:.68,position:[.08,.04,-1.03],scale:[1.28,6.8,1],rotation:[.02,.012,.018],order:-34},{name:"left-wrapping-smoky-edge-field",color:"#21101a",opacity:.42,position:[-13.8,-.02,.35],scale:[20.4,5.6,1],rotation:[0,1.14,-.036],order:-30},{name:"right-wrapping-cool-edge-field",color:"#0a3940",opacity:.4,position:[13.8,.08,.28],scale:[20.4,5.6,1],rotation:[0,-1.14,.034],order:-29},{name:"overhead-smoked-violet-absorbing-field",color:"#171022",opacity:.36,position:[0,5.1,-5.8],scale:[34,7.4,1],rotation:[-.34,0,.01],order:-31},{name:"foreground-low-matte-rust-veil",color:"#5c201b",opacity:.34,position:[0,-4.28,4.6],scale:[36,5.2,1],rotation:[.18,0,0],order:-22}];for(let t of B){let i=te(e,o,t.color,{edgeFeather:t.name.includes("band")||t.name.includes("seam")?.25:.16,alphaScale:t.opacity>.8?.96:.88,streakStrength:t.name.includes("fracture")?.23:.15}),a=new e.MeshBasicMaterial({name:`${t.name}-matte-stain-material`,map:i,transparent:!0,opacity:t.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});d.push(a);let r=new e.Mesh(l,a);r.name=t.name,r.position.set(t.position[0],t.position[1],t.position[2]),r.rotation.set(t.rotation[0],t.rotation[1],t.rotation[2]),r.scale.set(t.scale[0],t.scale[1],t.scale[2]),r.userData.baseY=r.position.y,r.userData.baseOpacity=t.opacity,r.userData.phase=o()*Math.PI*2,r.userData.floatAmount=.012+o()*.025,F(r,t.order),p.add(r)}c.add(p);let v=new e.Group;v.name="ragged-brush-and-edge-deposit-field";let I=["#0e0a0d","#bd1a10","#063dc7","#173b32","#9b4a1d","#42162c"].map(t=>{let i=oe(e,o,t),a=new e.MeshBasicMaterial({name:`ragged-brush-stroke-${t}`,map:i,transparent:!0,opacity:t==="#0e0a0d"?.5:.62,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});return d.push(a),a});for(let t=0;t<54;t+=1){let i=t%4===0,a=t%5===0,r=i?(o()-.5)*2.2:-17.5+o()*35,S=a?-.85+(o()-.5)*.48:-2.9+o()*5.9,$=-1.18-o()*6.8,m=new e.Mesh(l,I[t%I.length]);m.name=`floating-ragged-rothko-edge-brush-${String(t+1).padStart(2,"0")}`,m.position.set(r,S,$),m.rotation.set((o()-.5)*.08,(o()-.5)*.18,(o()-.5)*.24);let N=i?.62+o()*1.3:2+o()*5.8,q=i?.08+o()*.2:.09+o()*.24;m.scale.set(N,q,1),m.userData.baseY=m.position.y,m.userData.phase=o()*Math.PI*2,m.userData.floatAmount=.008+o()*.02,F(m,-16+t%6),v.add(m)}c.add(v);let G=new e.Group;G.name="submerged-radial-finale-coupe-symbol-pressure";let W=[new e.MeshBasicMaterial({color:"#063dc7",transparent:!0,opacity:.28,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#0e0a0d",transparent:!0,opacity:.3,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#7a2e1d",transparent:!0,opacity:.22,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#173b32",transparent:!0,opacity:.2,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1})];d.push(...W);for(let t=0;t<8;t+=1){let i=1.8+t*.76,a=new e.RingGeometry(i,i+.07,128);f.push(a);let r=new e.Mesh(a,W[t%W.length]);r.name=`soft-radial-cup-final-pressure-mark-${t+1}`,r.position.set((t-3.5)*.92,-.78-t*.1,-5.8-t*.86),r.rotation.set(.06+t*.01,(t-3.5)*.028,(o()-.5)*.08),r.scale.y=.55,r.userData.phase=o()*Math.PI*2,F(r,-12+t),G.add(r)}c.add(G);let P=new e.BufferGeometry;f.push(P);let _=104,M=new Float32Array(_*2*3),C=new Float32Array(_*2*3),A=[new e.Color("#0e0a0d"),new e.Color("#bd1a10"),new e.Color("#063dc7"),new e.Color("#173b32"),new e.Color("#8b3a1e")];for(let t=0;t<_;t+=1){let i=t%3===0,a=t%7!==0,r=i?(o()-.5)*1.35:-19+o()*38,S=a?-.96+(o()-.5)*.88:-3.2+o()*6.6,$=-1.34-o()*9.4,m=a?r+.9+o()*3.6:r+(o()-.5)*.22,N=a?S+(o()-.5)*.16:S+.9+o()*2.2,q=$-o()*.38,g=t*6;M[g]=r,M[g+1]=S,M[g+2]=$,M[g+3]=m,M[g+4]=N,M[g+5]=q;let z=A[t%A.length];C[g]=z.r,C[g+1]=z.g,C[g+2]=z.b,C[g+3]=z.r,C[g+4]=z.g,C[g+5]=z.b}P.setAttribute("position",new e.BufferAttribute(M,3)),P.setAttribute("color",new e.BufferAttribute(C,3));let J=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:.5,depthWrite:!1,depthTest:!0,toneMapped:!1});d.push(J);let O=new e.LineSegments(P,J);O.name="ragged-soft-seam-and-fracture-edge-deposits",F(O,-6),c.add(O);let L=new e.BufferGeometry;f.push(L);let K=340,U=new Float32Array(K*3),V=new Float32Array(K*3),Q=[new e.Color("#063dc7"),new e.Color("#bd1a10"),new e.Color("#173b32"),new e.Color("#a75a1e"),new e.Color("#120d0d"),new e.Color("#42162c")];for(let t=0;t<K;t+=1){let i=o()*Math.PI*2,a=4.2+o()*12.8,r=t%6===0?.22:1;U[t*3]=Math.sin(i)*a*r,U[t*3+1]=-3.4+o()*6.8,U[t*3+2]=-1.8-o()*11.8;let S=Q[t%Q.length];V[t*3]=S.r,V[t*3+1]=S.g,V[t*3+2]=S.b}L.setAttribute("position",new e.BufferAttribute(U,3)),L.setAttribute("color",new e.BufferAttribute(V,3));let X=new e.PointsMaterial({size:.18,transparent:!0,opacity:.42,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});d.push(X);let Y=new e.Points(L,X);Y.name="submerged-high-chroma-pigment-grain-field",F(Y,-4),c.add(Y);function j(t={}){let i=t.captureMode?0:Number(t.elapsedSeconds??t.time??0);k.uniforms.uTime.value=i;for(let a of p.children)a.position.y=a.userData.baseY+Math.sin(i*.07+a.userData.phase)*a.userData.floatAmount,a.material.opacity=a.userData.baseOpacity*(.965+Math.sin(i*.11+a.userData.phase)*.03);for(let a of v.children)a.position.y=a.userData.baseY+Math.sin(i*.12+a.userData.phase)*a.userData.floatAmount;G.rotation.z=Math.sin(i*.04)*.018,O.rotation.z=Math.sin(i*.032)*.006,Y.rotation.y=Math.sin(i*.028)*.03}function T(){ee(c);for(let t of f)t&&typeof t.dispose=="function"&&t.dispose();for(let t of d)t&&typeof t.dispose=="function"&&t.dispose()}return{object:c,update:j,dispose:T}}export{re as createImmersiveWorldPart};
