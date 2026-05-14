var Q="art-direction-packet-0f87c43ee66b",X="0f87c43ee66b783d32924c4677074f39";function Z(e){let r=String(e??"artist-mark-field-rothko"),i=2166136261;for(let a=0;a<r.length;a+=1)i^=r.charCodeAt(a),i=Math.imul(i,16777619);return i>>>0}function H(e,r,i){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(r,i);let a=(Z(r)^Z(i))>>>0;return function(){a=a+1831565813>>>0;let o=a;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296}}function x(e){return Math.max(0,Math.min(1,e))}function E(e,r=.925){let i=e?.environment||{},a=Number(i.skyboxRadius||i.radius||90),m=Number.isFinite(a)&&a>0?a:90;return Math.max(72,Math.min(96,m)*r)}function ee(e){e.traverse(r=>{r.geometry&&typeof r.geometry.dispose=="function"&&r.geometry.dispose();let i=Array.isArray(r.material)?r.material:[r.material].filter(Boolean);for(let a of i)a&&typeof a.dispose=="function"&&a.dispose(),a?.map&&typeof a.map.dispose=="function"&&a.map.dispose()})}function te(e,r,i,a={}){let m=a.width||160,o=a.height||112,p=a.edgeFeather??.18,d=a.alphaScale??1,y=a.streakStrength??.16,f=new e.Color(i),w=new Uint8Array(m*o*4),k=new Float32Array(m);for(let c=0;c<m;c+=1)k[c]=.78+r()*.34+Math.sin(c*.19+r()*4)*.05;for(let c=0;c<o;c+=1)for(let l=0;l<m;l+=1){let g=l/(m-1),b=c/(o-1),S=Math.min(g,1-g,b,1-b),F=x(S/p),P=Math.sin(l*.31+c*.03)*y,W=Math.sin(l*.071+c*.119)*.08+Math.sin(l*.19-c*.043)*.05,C=(r()-.5)*.18,D=(l%6===0?-.035:0)+(c%7===0?-.026:0),G=x(.82+k[l]*.16+P+W+C+D),_=x(F*(.68+r()*.26+Math.sin((l+c)*.21)*.06)),A=(c*m+l)*4;w[A]=Math.round(x(f.r*G*1.22)*255),w[A+1]=Math.round(x(f.g*G*1.22)*255),w[A+2]=Math.round(x(f.b*G*1.22)*255),w[A+3]=Math.round(x(_*d)*255)}let h=new e.DataTexture(w,m,o,e.RGBAFormat);return h.needsUpdate=!0,e.SRGBColorSpace&&(h.colorSpace=e.SRGBColorSpace),h.wrapS=e.ClampToEdgeWrapping,h.wrapT=e.ClampToEdgeWrapping,h}function oe(e,r,i){let o=new e.Color(i),p=new Uint8Array(6528*4);for(let y=0;y<34;y+=1)for(let f=0;f<192;f+=1){let w=f/191,k=y/33,h=1-Math.abs(k-.5)*2,c=Math.sin(w*Math.PI),l=.58+Math.sin(f*.37+y*1.7)*.2+(r()-.5)*.24,g=x(Math.pow(h,.7)*Math.pow(c,.42)*l),b=x(.74+Math.sin(f*.13)*.08+(r()-.5)*.16),S=(y*192+f)*4;p[S]=Math.round(x(o.r*b*1.35)*255),p[S+1]=Math.round(x(o.g*b*1.35)*255),p[S+2]=Math.round(x(o.b*b*1.35)*255),p[S+3]=Math.round(g*210)}let d=new e.DataTexture(p,192,34,e.RGBAFormat);return d.needsUpdate=!0,e.SRGBColorSpace&&(d.colorSpace=e.SRGBColorSpace),d.wrapS=e.ClampToEdgeWrapping,d.wrapT=e.ClampToEdgeWrapping,d}function ae(e){return new e.ShaderMaterial({name:"artist_mark_field_position_space_wash_bloom_shell",side:e.BackSide,transparent:!0,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uOpacity:{value:.64},uMaroon:{value:new e.Color("#40162c")},uViolet:{value:new e.Color("#181225")},uGreen:{value:new e.Color("#35483b")},uTeal:{value:new e.Color("#0b5962")},uRust:{value:new e.Color("#87311f")},uOchre:{value:new e.Color("#b86822")},uBlack:{value:new e.Color("#0e0a0d")},uCobalt:{value:new e.Color("#063dc7")},uRed:{value:new e.Color("#bd1a10")}},vertexShader:`
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
    `})}function I(e,r){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=r,e}function j(e,r,i={}){return e.userData={...e.userData,...i,skybox:!0,skyboxShell:!0,fullSurroundSkyboxLayer:!0,avoidsInnerTransparentSphere:!0},e.traverse?.(a=>{a.castShadow=!1,a.receiveShadow=!1,a.frustumCulled=!1,a.renderOrder=r,a.userData={...a.userData,fullSurroundSkyboxLayer:!0,avoidsInnerTransparentSphere:!0}}),e.renderOrder=r,e}function re(e,r,i,a,{name:m,meshName:o,radiusMultiplier:p,renderOrder:d,userData:y}){let f=E(r,p);if(i&&typeof i.createSkyboxShell=="function"){let c=i.createSkyboxShell({radius:f,name:m,geometryKind:"box",color:"#000000",opacity:1,cameraPinned:!0,userData:y}),l=c.object||c,g=c.mesh||l.mesh||l.children?.find(b=>b?.isMesh);return g&&(g.material&&typeof g.material.dispose=="function"&&g.material.dispose(),g.name=o,g.material=a,g.scale.setScalar(f),l.material=a),l.name=m,j(l,d,y)}let w=2/Math.sqrt(3),k=new e.BoxGeometry(w,w,w,1,1,1),h=new e.Mesh(k,a);return h.name=o,h.scale.setScalar(f),h.onBeforeRender=function(l,g,b){b?.position&&h.position.copy(b.position)},j(h,d,y)}function se({THREE:e,part:r,world:i,seed:a,utilities:m}){let o=H(m,a||r?.id||"artist-mark-field","rothko-style-system-two-fan-zones"),p=new e.Group;p.name="artist-mark-field-rothko-two-fan-zone-style-system",p.userData={partId:"artist-mark-field",role:r?.role||"artist-style-system",packetId:Q,packetHash:X,messagePurpose:"Artist mark field: matte Rothko stains, suspended planes, soft seams, radial pressure symbols, and brush deposits around the viewer."};let d=[],y=[],f=ae(e);d.push(f);let w=re(e,i,m,f,{name:"full-surround-rothko-mark-wash-bloom-skybox-layer",meshName:"full-surround-rothko-mark-wash-bloom-shell",radiusMultiplier:.925,renderOrder:-970,userData:{partId:"artist-mark-field",role:"artist-style-system",packetId:Q,packetHash:X}});p.add(w);let k=new e.PlaneGeometry(1,1,1,1);y.push(k);let h=new e.Group;h.name="distributed-soft-edged-stained-color-fields";let c=[{name:"left-burgundy-violet-fan-zone-field",color:"#38142a",opacity:.78,position:[-7.4,2.34,-2.6],scale:[25.4,7.2,1],rotation:[.02,.18,-.012],order:-48},{name:"right-muted-green-teal-fan-zone-field",color:"#35483b",opacity:.78,position:[7.2,2.24,-2.8],scale:[25.8,7,1],rotation:[.018,-.18,.016],order:-47},{name:"low-rust-ochre-crowd-weight-field",color:"#87311f",opacity:.84,position:[0,-1.62,-2.05],scale:[39.6,8.2,1],rotation:[.016,0,.007],order:-46},{name:"low-ochre-absorbed-wash-bloom",color:"#b86822",opacity:.56,position:[2.6,-2.3,-3.7],scale:[31.2,6.1,1],rotation:[.035,-.07,-.014],order:-45},{name:"central-near-black-soft-hinge-band",color:"#0e0a0d",opacity:.92,position:[0,-.3,-1.38],scale:[42,1.42,1],rotation:[.01,0,-.004],order:-37},{name:"thin-green-teal-counterpoint-seam",color:"#163d34",opacity:.74,position:[1.1,-.76,-1.25],scale:[35.2,.72,1],rotation:[.012,-.018,.014],order:-36},{name:"submerged-cobalt-final-coupe-pulse-band",color:"#063dc7",opacity:.86,position:[-1.8,-1.06,-1.12],scale:[27.4,.56,1],rotation:[.012,.026,-.012],order:-35},{name:"red-vertical-pressure-fracture-between-zones",color:"#bd1a10",opacity:.68,position:[.08,.04,-1.03],scale:[1.28,6.8,1],rotation:[.02,.012,.018],order:-34},{name:"left-wrapping-smoky-edge-field",color:"#21101a",opacity:.42,position:[-13.8,-.02,.35],scale:[20.4,5.6,1],rotation:[0,1.14,-.036],order:-30},{name:"right-wrapping-cool-edge-field",color:"#0a3940",opacity:.4,position:[13.8,.08,.28],scale:[20.4,5.6,1],rotation:[0,-1.14,.034],order:-29},{name:"overhead-smoked-violet-absorbing-field",color:"#171022",opacity:.36,position:[0,5.1,-5.8],scale:[34,7.4,1],rotation:[-.34,0,.01],order:-31},{name:"foreground-low-matte-rust-veil",color:"#5c201b",opacity:.34,position:[0,-4.28,4.6],scale:[36,5.2,1],rotation:[.18,0,0],order:-22}];for(let t of c){let u=te(e,o,t.color,{edgeFeather:t.name.includes("band")||t.name.includes("seam")?.25:.16,alphaScale:t.opacity>.8?.96:.88,streakStrength:t.name.includes("fracture")?.23:.15}),s=new e.MeshBasicMaterial({name:`${t.name}-matte-stain-material`,map:u,transparent:!0,opacity:t.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});d.push(s);let n=new e.Mesh(k,s);n.name=t.name,n.position.set(t.position[0],t.position[1],t.position[2]),n.rotation.set(t.rotation[0],t.rotation[1],t.rotation[2]),n.scale.set(t.scale[0],t.scale[1],t.scale[2]),n.userData.baseY=n.position.y,n.userData.baseOpacity=t.opacity,n.userData.phase=o()*Math.PI*2,n.userData.floatAmount=.012+o()*.025,I(n,t.order),h.add(n)}p.add(h);let l=new e.Group;l.name="ragged-brush-and-edge-deposit-field";let b=["#0e0a0d","#bd1a10","#063dc7","#173b32","#9b4a1d","#42162c"].map(t=>{let u=oe(e,o,t),s=new e.MeshBasicMaterial({name:`ragged-brush-stroke-${t}`,map:u,transparent:!0,opacity:t==="#0e0a0d"?.5:.62,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});return d.push(s),s});for(let t=0;t<54;t+=1){let u=t%4===0,s=t%5===0,n=u?(o()-.5)*2.2:-17.5+o()*35,B=s?-.85+(o()-.5)*.48:-2.9+o()*5.9,Y=-1.18-o()*6.8,v=new e.Mesh(k,b[t%b.length]);v.name=`floating-ragged-rothko-edge-brush-${String(t+1).padStart(2,"0")}`,v.position.set(n,B,Y),v.rotation.set((o()-.5)*.08,(o()-.5)*.18,(o()-.5)*.24);let K=u?.62+o()*1.3:2+o()*5.8,N=u?.08+o()*.2:.09+o()*.24;v.scale.set(K,N,1),v.userData.baseY=v.position.y,v.userData.phase=o()*Math.PI*2,v.userData.floatAmount=.008+o()*.02,I(v,-16+t%6),l.add(v)}p.add(l);let S=new e.Group;S.name="submerged-radial-finale-coupe-symbol-pressure";let F=[new e.MeshBasicMaterial({color:"#063dc7",transparent:!0,opacity:.28,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#0e0a0d",transparent:!0,opacity:.3,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#7a2e1d",transparent:!0,opacity:.22,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#173b32",transparent:!0,opacity:.2,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1})];d.push(...F);for(let t=0;t<8;t+=1){let u=1.8+t*.76,s=new e.RingGeometry(u,u+.07,128);y.push(s);let n=new e.Mesh(s,F[t%F.length]);n.name=`soft-radial-cup-final-pressure-mark-${t+1}`,n.position.set((t-3.5)*.92,-.78-t*.1,-5.8-t*.86),n.rotation.set(.06+t*.01,(t-3.5)*.028,(o()-.5)*.08),n.scale.y=.55,n.userData.phase=o()*Math.PI*2,I(n,-12+t),S.add(n)}p.add(S);let P=new e.BufferGeometry;y.push(P);let W=104,C=new Float32Array(W*2*3),D=new Float32Array(W*2*3),G=[new e.Color("#0e0a0d"),new e.Color("#bd1a10"),new e.Color("#063dc7"),new e.Color("#173b32"),new e.Color("#8b3a1e")];for(let t=0;t<W;t+=1){let u=t%3===0,s=t%7!==0,n=u?(o()-.5)*1.35:-19+o()*38,B=s?-.96+(o()-.5)*.88:-3.2+o()*6.6,Y=-1.34-o()*9.4,v=s?n+.9+o()*3.6:n+(o()-.5)*.22,K=s?B+(o()-.5)*.16:B+.9+o()*2.2,N=Y-o()*.38,M=t*6;C[M]=n,C[M+1]=B,C[M+2]=Y,C[M+3]=v,C[M+4]=K,C[M+5]=N;let z=G[t%G.length];D[M]=z.r,D[M+1]=z.g,D[M+2]=z.b,D[M+3]=z.r,D[M+4]=z.g,D[M+5]=z.b}P.setAttribute("position",new e.BufferAttribute(C,3)),P.setAttribute("color",new e.BufferAttribute(D,3));let _=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:.5,depthWrite:!1,depthTest:!0,toneMapped:!1});d.push(_);let A=new e.LineSegments(P,_);A.name="ragged-soft-seam-and-fracture-edge-deposits",I(A,-6),p.add(A);let L=new e.BufferGeometry;y.push(L);let $=340,O=new Float32Array($*3),U=new Float32Array($*3),q=[new e.Color("#063dc7"),new e.Color("#bd1a10"),new e.Color("#173b32"),new e.Color("#a75a1e"),new e.Color("#120d0d"),new e.Color("#42162c")];for(let t=0;t<$;t+=1){let u=o()*Math.PI*2,s=4.2+o()*12.8,n=t%6===0?.22:1;O[t*3]=Math.sin(u)*s*n,O[t*3+1]=-3.4+o()*6.8,O[t*3+2]=-1.8-o()*11.8;let B=q[t%q.length];U[t*3]=B.r,U[t*3+1]=B.g,U[t*3+2]=B.b}L.setAttribute("position",new e.BufferAttribute(O,3)),L.setAttribute("color",new e.BufferAttribute(U,3));let J=new e.PointsMaterial({size:.18,transparent:!0,opacity:.42,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});d.push(J);let V=new e.Points(L,J);V.name="submerged-high-chroma-pigment-grain-field",I(V,-4),p.add(V);function T(t={}){let u=t.captureMode?0:Number(t.elapsedSeconds??t.time??0);f.uniforms.uTime.value=u;for(let s of h.children)s.position.y=s.userData.baseY+Math.sin(u*.07+s.userData.phase)*s.userData.floatAmount,s.material.opacity=s.userData.baseOpacity*(.965+Math.sin(u*.11+s.userData.phase)*.03);for(let s of l.children)s.position.y=s.userData.baseY+Math.sin(u*.12+s.userData.phase)*s.userData.floatAmount;S.rotation.z=Math.sin(u*.04)*.018,A.rotation.z=Math.sin(u*.032)*.006,V.rotation.y=Math.sin(u*.028)*.03}function R(){ee(p);for(let t of y)t&&typeof t.dispose=="function"&&t.dispose();for(let t of d)t&&typeof t.dispose=="function"&&t.dispose()}return{object:p,update:T,dispose:R}}export{se as createImmersiveWorldPart};
