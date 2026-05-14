var Q="art-direction-packet-0f87c43ee66b",X="0f87c43ee66b783d32924c4677074f39";function N(e){let r=String(e??"rothko-fracture-pressure"),p=2166136261;for(let i=0;i<r.length;i+=1)p^=r.charCodeAt(i),p=Math.imul(p,16777619);return p>>>0}function Z(e,r,p){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(r,p);let i=(N(r)^N(p))>>>0;return function(){i=i+1831565813>>>0;let a=i;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}function T(e){e.traverse(r=>{r.geometry&&typeof r.geometry.dispose=="function"&&r.geometry.dispose();let p=Array.isArray(r.material)?r.material:[r.material].filter(Boolean);for(let i of p)i&&typeof i.dispose=="function"&&i.dispose()})}function z(e){return Math.max(0,Math.min(1,e))}function R(e,r,p,i={}){let w=i.width||128,a=i.height||96,n=i.alphaScale??1,y=i.edgeFeather??.16,S=new e.Color(p),f=new Uint8Array(w*a*4);for(let h=0;h<a;h+=1)for(let u=0;u<w;u+=1){let G=u/(w-1),M=h/(a-1),k=Math.min(G,1-G,M,1-M),x=z(k/y),C=.76+r()*.3+Math.sin(u*.13+h*.07+r()*.8)*.08,b=.84+Math.sin(h*.34+r()*2.2)*.07+Math.sin(u*1.31)*.025,D=.88-Math.pow(1-x,2)*.42,g=n*x*(.64+r()*.28),d=(h*w+u)*4;f[d]=Math.round(z(S.r*C*b*D*1.24)*255),f[d+1]=Math.round(z(S.g*C*b*D*1.24)*255),f[d+2]=Math.round(z(S.b*C*b*D*1.24)*255),f[d+3]=Math.round(z(g)*255)}let v=new e.DataTexture(f,w,a,e.RGBAFormat);return v.needsUpdate=!0,e.SRGBColorSpace&&(v.colorSpace=e.SRGBColorSpace),v.wrapS=e.ClampToEdgeWrapping,v.wrapT=e.ClampToEdgeWrapping,v}function H(e){return new e.ShaderMaterial({name:"rothko_fracture_pressure_surround_shell",side:e.BackSide,transparent:!0,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uOpacity:{value:.72},uViolet:{value:new e.Color("#21102c")},uMaroon:{value:new e.Color("#57231f")},uGreen:{value:new e.Color("#38493d")},uTeal:{value:new e.Color("#0c555e")},uRust:{value:new e.Color("#8b321e")},uOchre:{value:new e.Color("#b6611f")},uHinge:{value:new e.Color("#0e0a0d")},uCobalt:{value:new e.Color("#063dc7")},uRed:{value:new e.Color("#bd1a10")}},vertexShader:`
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
      uniform vec3 uViolet;
      uniform vec3 uMaroon;
      uniform vec3 uGreen;
      uniform vec3 uTeal;
      uniform vec3 uRust;
      uniform vec3 uOchre;
      uniform vec3 uHinge;
      uniform vec3 uCobalt;
      uniform vec3 uRed;

      float hash(vec2 p) {
        p = fract(p * vec2(173.3, 379.1));
        p += dot(p, p + 31.7);
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
          p = p * 2.03 + vec2(5.8, 8.1);
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
        float x = clamp(angle / 1.18, -1.24, 1.24);
        float y = dir.y;
        float slow = uTime * 0.015;
        float n = fbm(vec2(angle * 1.25 + slow, y * 3.6));
        float grain = fbm(vec2(angle * 24.0, y * 38.0 - slow * 4.0));
        float seamDrift = (n - 0.5) * 0.08 + sin(angle * 2.0 + uTime * 0.035) * 0.014;
        vec3 upperLeft = mix(uViolet, uMaroon, 0.36 + n * 0.48);
        vec3 upperRight = mix(uGreen, uTeal, 0.18 + n * 0.38);
        vec3 upper = mix(upperLeft, upperRight, smoothstep(-0.12 + seamDrift, 0.18 + seamDrift, x));
        vec3 lower = mix(uRust, uOchre, 0.24 + n * 0.54);
        vec3 color = mix(lower, upper, smoothstep(-0.12 + seamDrift, 0.16 + seamDrift, y));
        float hinge = band(y + seamDrift, -0.08, 0.082, 0.11) * (0.45 + 0.55 * smoothstep(1.18, 0.08, abs(x)));
        float centralFracture = band(x - seamDrift * 1.2, 0.0, 0.024, 0.06) * smoothstep(-0.55, 0.24, y) * smoothstep(0.82, 0.1, abs(y));
        float cobalt = band(y + seamDrift, -0.28, 0.036, 0.07) * (0.2 + 0.8 * smoothstep(1.0, 0.04, abs(x + 0.18)));
        float sideDark = smoothstep(0.72, 1.18, abs(x)) * 0.42;
        color = mix(color, uHinge, hinge * 0.86 + sideDark);
        color = mix(color, uCobalt, cobalt * 0.78);
        color = mix(color, uRed, centralFracture * 0.72);
        color += (n - 0.5) * 0.13 + (grain - 0.5) * 0.055;
        color *= 1.04;
        float alpha = uOpacity * (0.32 + hinge * 0.34 + cobalt * 0.2 + centralFracture * 0.22);
        gl_FragColor = vec4(max(color, vec3(0.0)), clamp(alpha, 0.08, 0.86));
      }
    `})}function U(e,r){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=r,e}function E({THREE:e,part:r,world:p,seed:i,utilities:w}){let a=new e.Group;a.name="non-literal-fracture-pressure-rothko-two-fan-zones",a.userData={partId:"non-literal-fracture-pressure",role:r?.role||"primary-news-signal",packetId:Q,packetHash:X,messagePurpose:"Non-literal fracture pressure for two fan zones before the Cup final."};let n=Z(w,i||r?.id||"non-literal-fracture-pressure","two-fan-zone-fracture-pressure"),y=[],S=[],f=[],v=new e.SphereGeometry(18,96,48);f.push(v);let h=H(e);y.push(h);let u=new e.Mesh(v,h);u.name="surrounding-stained-fracture-pressure-shell",u.castShadow=!1,u.receiveShadow=!1,u.frustumCulled=!1,u.renderOrder=-70,a.add(u);let G=new e.PlaneGeometry(1,1,1,1);f.push(G);let M=new e.Group;M.name="distributed-two-zone-soft-field-pressure-planes";let k=[{name:"left-upper-anderlecht-burgundy-pressure-field",color:"#36172a",opacity:.82,position:[-6.2,2.28,-2.6],scale:[22.8,6.6,1],rotation:[.025,.16,-.014]},{name:"left-upper-deep-maroon-overpaint",color:"#57231f",opacity:.58,position:[-8.4,2,-3.8],scale:[15.6,5.5,1],rotation:[.02,.34,-.035]},{name:"right-upper-union-green-teal-pressure-field",color:"#39483a",opacity:.8,position:[6.4,2.22,-2.7],scale:[23.2,6.4,1],rotation:[.018,-.16,.017]},{name:"right-upper-muted-teal-overpaint",color:"#0c555e",opacity:.55,position:[8.9,1.86,-4.2],scale:[15.2,5,1],rotation:[.024,-.34,.038]},{name:"low-rust-crowd-pressure-weight",color:"#7d2f1e",opacity:.86,position:[0,-1.52,-2],scale:[35.8,7.4,1],rotation:[.018,0,.008]},{name:"low-ochre-wash-bloom",color:"#a95a1e",opacity:.62,position:[2.2,-2.14,-3.7],scale:[28.6,5.7,1],rotation:[.038,-.07,-.014]},{name:"central-black-emotional-hinge",color:"#100b0c",opacity:.92,position:[0,-.26,-1.45],scale:[38.4,1.26,1],rotation:[.01,0,-.004]},{name:"thin-green-teal-counterpressure-seam",color:"#173b32",opacity:.72,position:[1,-.72,-1.34],scale:[32.6,.64,1],rotation:[.012,-.018,.014]},{name:"submerged-cobalt-final-coupe-pulse",color:"#063dc7",opacity:.84,position:[-1.6,-1.02,-1.22],scale:[24.8,.5,1],rotation:[.012,.026,-.012]},{name:"red-vertical-fracture-between-two-zones",color:"#bd1a10",opacity:.7,position:[0,.04,-1.06],scale:[1.12,6.2,1],rotation:[.02,.012,.018]},{name:"left-wrapping-dark-fan-zone-edge",color:"#2a1119",opacity:.46,position:[-12.8,-.05,.3],scale:[18.8,5,1],rotation:[0,1.16,-.04]},{name:"right-wrapping-cool-fan-zone-edge",color:"#0a3940",opacity:.42,position:[12.8,.1,.2],scale:[18.8,5,1],rotation:[0,-1.16,.035]}];for(let t=0;t<k.length;t+=1){let o=k[t],l=R(e,n,o.color,{alphaScale:t>=6?.96:1,edgeFeather:t>=6?.2:.15});S.push(l);let c=new e.MeshBasicMaterial({map:l,transparent:!0,opacity:o.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});y.push(c);let s=new e.Mesh(G,c);s.name=o.name,s.position.set(o.position[0],o.position[1],o.position[2]),s.rotation.set(o.rotation[0],o.rotation[1],o.rotation[2]),s.scale.set(o.scale[0],o.scale[1],o.scale[2]),s.userData.baseY=s.position.y,s.userData.baseOpacity=o.opacity,s.userData.phase=n()*Math.PI*2,s.userData.float=.012+n()*.024,U(s,-44+t),M.add(s)}a.add(M);let x=new e.Group;x.name="low-submerged-final-coupe-radial-pressure";let C=[new e.MeshBasicMaterial({color:"#063dc7",transparent:!0,opacity:.3,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#110c0d",transparent:!0,opacity:.34,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#7d2f1e",transparent:!0,opacity:.22,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1})];y.push(...C);for(let t=0;t<6;t+=1){let o=1.7+t*.92,l=new e.RingGeometry(o,o+.065,128);f.push(l);let c=new e.Mesh(l,C[t%C.length]);c.name=`soft-low-cup-final-pressure-halo-${t+1}`,c.position.set((t-2.5)*.84,-.82-t*.12,-6.3-t*1.12),c.rotation.set(.05+t*.012,(t-2.5)*.028,(n()-.5)*.08),c.scale.y=.56,c.userData.phase=n()*Math.PI*2,U(c,-18+t),x.add(c)}a.add(x);let b=new e.BufferGeometry;f.push(b);let D=76,g=new Float32Array(D*2*3),d=new Float32Array(D*2*3),V=[new e.Color("#120d0d"),new e.Color("#bd1a10"),new e.Color("#063dc7"),new e.Color("#173b32")];for(let t=0;t<D;t+=1){let o=t%3!==0,l=(n()-.5)*(o?.76:12),c=-1.08-n()*1.35,s=o?l:-17.8+n()*35.6,I=o?-2.9+n()*5.9:-.2+(n()-.5)*.72,q=o?s+(n()-.5)*.28:s+.7+n()*2.2,J=o?I+.58+n()*1.5:I+(n()-.5)*.24,m=t*6;g[m]=s,g[m+1]=I,g[m+2]=c,g[m+3]=q,g[m+4]=J,g[m+5]=c-n()*.32;let A=V[t%V.length];d[m]=A.r,d[m+1]=A.g,d[m+2]=A.b,d[m+3]=A.r,d[m+4]=A.g,d[m+5]=A.b}b.setAttribute("position",new e.BufferAttribute(g,3)),b.setAttribute("color",new e.BufferAttribute(d,3));let L=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:.54,depthWrite:!1,depthTest:!0,toneMapped:!1});y.push(L);let P=new e.LineSegments(b,L);P.name="ragged-fracture-pressure-seam-deposits",P.frustumCulled=!1,P.renderOrder=-8,a.add(P);let F=new e.BufferGeometry;f.push(F);let _=260,O=new Float32Array(_*3),W=new Float32Array(_*3),j=[new e.Color("#063dc7"),new e.Color("#bd1a10"),new e.Color("#173b32"),new e.Color("#a95a1e"),new e.Color("#130d0d")];for(let t=0;t<_;t+=1){let o=n()*Math.PI*2,l=4.6+n()*11.5,c=t%5===0?.28:1;O[t*3]=Math.sin(o)*l*c,O[t*3+1]=-3.2+n()*6.5,O[t*3+2]=Math.cos(o)*l-3;let s=j[t%j.length];W[t*3]=s.r,W[t*3+1]=s.g,W[t*3+2]=s.b}F.setAttribute("position",new e.BufferAttribute(O,3)),F.setAttribute("color",new e.BufferAttribute(W,3));let K=new e.PointsMaterial({size:.2,transparent:!0,opacity:.5,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});y.push(K);let B=new e.Points(F,K);B.name="submerged-high-chroma-pigment-pressure-grains",B.frustumCulled=!1,B.renderOrder=-6,a.add(B);function Y(t={}){let o=t.captureMode?0:Number(t.elapsedSeconds??t.time??0);h.uniforms?.uTime&&(h.uniforms.uTime.value=o);for(let l of M.children)l.position.y=l.userData.baseY+Math.sin(o*.075+l.userData.phase)*l.userData.float,l.material.opacity=l.userData.baseOpacity*(.965+Math.sin(o*.11+l.userData.phase)*.03);x.rotation.z=Math.sin(o*.04)*.02,P.rotation.z=Math.sin(o*.03)*.006,B.rotation.y=Math.sin(o*.028)*.03}function $(){T(a);for(let t of S)t&&typeof t.dispose=="function"&&t.dispose();for(let t of f)t&&typeof t.dispose=="function"&&t.dispose();for(let t of y)t&&typeof t.dispose=="function"&&t.dispose()}return{object:a,update:Y,dispose:$}}export{E as createImmersiveWorldPart};
