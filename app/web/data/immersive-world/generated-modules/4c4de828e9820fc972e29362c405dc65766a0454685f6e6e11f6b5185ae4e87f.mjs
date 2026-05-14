var K="art-direction-packet-0f87c43ee66b",U="0f87c43ee66b783d32924c4677074f39";function Y(e){let r=String(e??"rothko-fracture-pressure"),s=2166136261;for(let o=0;o<r.length;o+=1)s^=r.charCodeAt(o),s=Math.imul(s,16777619);return s>>>0}function Z(e,r,s){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(r,s);let o=(Y(r)^Y(s))>>>0;return function(){o=o+1831565813>>>0;let n=o;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}}function T(e){e.traverse(r=>{r.geometry&&typeof r.geometry.dispose=="function"&&r.geometry.dispose();let s=Array.isArray(r.material)?r.material:[r.material].filter(Boolean);for(let o of s)o&&typeof o.dispose=="function"&&o.dispose()})}function G(e){return Math.max(0,Math.min(1,e))}function R(e,r=.94){let s=e?.environment||{},o=Number(s.skyboxRadius||s.radius||90),m=Number.isFinite(o)&&o>0?o:90;return Math.max(72,Math.min(96,m)*r)}function j(e,r,s={}){return e.userData={...e.userData,...s,skybox:!0,skyboxShell:!0,fullSurroundSkyboxLayer:!0,avoidsInnerTransparentSphere:!0},e.traverse?.(o=>{o.castShadow=!1,o.receiveShadow=!1,o.frustumCulled=!1,o.renderOrder=r,o.userData={...o.userData,fullSurroundSkyboxLayer:!0,avoidsInnerTransparentSphere:!0}}),e.renderOrder=r,e}function H(e,r,s,o,{name:m,meshName:n,radiusMultiplier:i,renderOrder:b,userData:M}){let u=R(r,i);if(s&&typeof s.createSkyboxShell=="function"){let y=s.createSkyboxShell({radius:u,name:m,geometryKind:"box",color:"#000000",opacity:1,cameraPinned:!0,userData:M}),g=y.object||y,f=y.mesh||g.mesh||g.children?.find(v=>v?.isMesh);return f&&(f.material&&typeof f.material.dispose=="function"&&f.material.dispose(),f.name=n,f.material=o,f.scale.setScalar(u),g.material=o),g.name=m,j(g,b,M)}let h=2/Math.sqrt(3),S=new e.BoxGeometry(h,h,h,1,1,1),p=new e.Mesh(S,o);return p.name=n,p.scale.setScalar(u),p.onBeforeRender=function(g,f,v){v?.position&&p.position.copy(v.position)},j(p,b,M)}function E(e,r,s,o={}){let m=o.width||128,n=o.height||96,i=o.alphaScale??1,b=o.edgeFeather??.16,M=new e.Color(s),u=new Uint8Array(m*n*4);for(let S=0;S<n;S+=1)for(let p=0;p<m;p+=1){let y=p/(m-1),g=S/(n-1),f=Math.min(y,1-y,g,1-g),v=G(f/b),D=.76+r()*.3+Math.sin(p*.13+S*.07+r()*.8)*.08,k=.84+Math.sin(S*.34+r()*2.2)*.07+Math.sin(p*1.31)*.025,x=.88-Math.pow(1-v,2)*.42,C=i*v*(.64+r()*.28),z=(S*m+p)*4;u[z]=Math.round(G(M.r*D*k*x*1.24)*255),u[z+1]=Math.round(G(M.g*D*k*x*1.24)*255),u[z+2]=Math.round(G(M.b*D*k*x*1.24)*255),u[z+3]=Math.round(G(C)*255)}let h=new e.DataTexture(u,m,n,e.RGBAFormat);return h.needsUpdate=!0,e.SRGBColorSpace&&(h.colorSpace=e.SRGBColorSpace),h.wrapS=e.ClampToEdgeWrapping,h.wrapT=e.ClampToEdgeWrapping,h}function ee(e){return new e.ShaderMaterial({name:"rothko_fracture_pressure_surround_shell",side:e.BackSide,transparent:!0,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uOpacity:{value:.72},uViolet:{value:new e.Color("#21102c")},uMaroon:{value:new e.Color("#57231f")},uGreen:{value:new e.Color("#38493d")},uTeal:{value:new e.Color("#0c555e")},uRust:{value:new e.Color("#8b321e")},uOchre:{value:new e.Color("#b6611f")},uHinge:{value:new e.Color("#0e0a0d")},uCobalt:{value:new e.Color("#063dc7")},uRed:{value:new e.Color("#bd1a10")}},vertexShader:`
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

      float triplanarFbm(vec3 p, vec3 dir) {
        vec3 weights = pow(abs(dir), vec3(3.5));
        weights /= max(weights.x + weights.y + weights.z, 0.0001);
        float xy = fbm(p.xy + vec2(2.7, 5.1));
        float yz = fbm(p.yz + vec2(7.4, 1.9));
        float zx = fbm(p.zx + vec2(4.2, 8.6));
        return xy * weights.z + yz * weights.x + zx * weights.y;
      }

      float band(float y, float center, float halfHeight, float feather) {
        return 1.0 - smoothstep(halfHeight, halfHeight + feather, abs(y - center));
      }

      void main() {
        vec3 dir = normalize(vPosition);
        float x = clamp(dir.x * 1.18, -1.24, 1.24);
        float y = dir.y;
        float poleFade = 1.0 - smoothstep(0.78, 0.97, abs(y));
        float slow = uTime * 0.015;
        vec3 domain = vec3(dir.x * 1.35, y * 1.65, dir.z * 1.35);
        float n = triplanarFbm(domain * 1.8 + vec3(slow, -slow * 0.34, slow * 0.21), dir);
        float grain = triplanarFbm(domain * 19.0 + vec3(0.0, y * 2.0 - slow * 3.0, slow), dir);
        float seamDrift = ((n - 0.5) * 0.08 + sin((dir.x - dir.z) * 2.0 + uTime * 0.035) * 0.014) * (0.45 + 0.55 * poleFade);
        vec3 upperLeft = mix(uViolet, uMaroon, 0.36 + n * 0.48);
        vec3 upperRight = mix(uGreen, uTeal, 0.18 + n * 0.38);
        vec3 upper = mix(upperLeft, upperRight, smoothstep(-0.12 + seamDrift, 0.18 + seamDrift, x));
        vec3 lower = mix(uRust, uOchre, 0.24 + n * 0.54);
        vec3 color = mix(lower, upper, smoothstep(-0.12 + seamDrift, 0.16 + seamDrift, y));
        float hinge = band(y + seamDrift, -0.08, 0.082, 0.11) * (0.45 + 0.55 * smoothstep(1.18, 0.08, abs(x))) * poleFade;
        float centralFracture = band(x - seamDrift * 1.2, 0.0, 0.024, 0.06) * smoothstep(-0.55, 0.24, y) * smoothstep(0.82, 0.1, abs(y)) * poleFade;
        float cobalt = band(y + seamDrift, -0.28, 0.036, 0.07) * (0.2 + 0.8 * smoothstep(1.0, 0.04, abs(x + 0.18))) * poleFade;
        float sideDark = smoothstep(0.72, 1.18, abs(x)) * 0.42 * poleFade;
        color = mix(color, uHinge, hinge * 0.86 + sideDark);
        color = mix(color, uCobalt, cobalt * 0.78);
        color = mix(color, uRed, centralFracture * 0.72);
        vec3 poleWash = mix(lower, mix(upperLeft, upperRight, 0.5), smoothstep(-0.28, 0.58, y));
        color = mix(color, poleWash + (n - 0.5) * 0.06, smoothstep(0.84, 0.985, abs(y)) * 0.7);
        color += (n - 0.5) * 0.13 + (grain - 0.5) * 0.055;
        color *= 1.04;
        float alpha = uOpacity * (0.32 + hinge * 0.34 + cobalt * 0.2 + centralFracture * 0.22);
        gl_FragColor = vec4(max(color, vec3(0.0)), clamp(alpha, 0.08, 0.86));
      }
    `})}function q(e,r){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=r,e}function te({THREE:e,part:r,world:s,seed:o,utilities:m}){let n=new e.Group;n.name="non-literal-fracture-pressure-rothko-two-fan-zones",n.userData={partId:"non-literal-fracture-pressure",role:r?.role||"primary-news-signal",packetId:K,packetHash:U,messagePurpose:"Non-literal fracture pressure for two fan zones before the Cup final."};let i=Z(m,o||r?.id||"non-literal-fracture-pressure","two-fan-zone-fracture-pressure"),b=[],M=[],u=[],h=ee(e);b.push(h);let S=H(e,s,m,h,{name:"surrounding-stained-fracture-pressure-skybox-layer",meshName:"surrounding-stained-fracture-pressure-shell",radiusMultiplier:.94,renderOrder:-980,userData:{partId:"non-literal-fracture-pressure",role:"primary-news-signal",packetId:K,packetHash:U}});n.add(S);let p=new e.PlaneGeometry(1,1,1,1);u.push(p);let y=new e.Group;y.name="distributed-two-zone-soft-field-pressure-planes";let g=[{name:"left-upper-anderlecht-burgundy-pressure-field",color:"#36172a",opacity:.82,position:[-6.2,2.28,-2.6],scale:[22.8,6.6,1],rotation:[.025,.16,-.014]},{name:"left-upper-deep-maroon-overpaint",color:"#57231f",opacity:.58,position:[-8.4,2,-3.8],scale:[15.6,5.5,1],rotation:[.02,.34,-.035]},{name:"right-upper-union-green-teal-pressure-field",color:"#39483a",opacity:.8,position:[6.4,2.22,-2.7],scale:[23.2,6.4,1],rotation:[.018,-.16,.017]},{name:"right-upper-muted-teal-overpaint",color:"#0c555e",opacity:.55,position:[8.9,1.86,-4.2],scale:[15.2,5,1],rotation:[.024,-.34,.038]},{name:"low-rust-crowd-pressure-weight",color:"#7d2f1e",opacity:.86,position:[0,-1.52,-2],scale:[35.8,7.4,1],rotation:[.018,0,.008]},{name:"low-ochre-wash-bloom",color:"#a95a1e",opacity:.62,position:[2.2,-2.14,-3.7],scale:[28.6,5.7,1],rotation:[.038,-.07,-.014]},{name:"central-black-emotional-hinge",color:"#100b0c",opacity:.92,position:[0,-.26,-1.45],scale:[38.4,1.26,1],rotation:[.01,0,-.004]},{name:"thin-green-teal-counterpressure-seam",color:"#173b32",opacity:.72,position:[1,-.72,-1.34],scale:[32.6,.64,1],rotation:[.012,-.018,.014]},{name:"submerged-cobalt-final-coupe-pulse",color:"#063dc7",opacity:.84,position:[-1.6,-1.02,-1.22],scale:[24.8,.5,1],rotation:[.012,.026,-.012]},{name:"red-vertical-fracture-between-two-zones",color:"#bd1a10",opacity:.7,position:[0,.04,-1.06],scale:[1.12,6.2,1],rotation:[.02,.012,.018]},{name:"left-wrapping-dark-fan-zone-edge",color:"#2a1119",opacity:.46,position:[-12.8,-.05,.3],scale:[18.8,5,1],rotation:[0,1.16,-.04]},{name:"right-wrapping-cool-fan-zone-edge",color:"#0a3940",opacity:.42,position:[12.8,.1,.2],scale:[18.8,5,1],rotation:[0,-1.16,.035]}];for(let t=0;t<g.length;t+=1){let a=g[t],c=E(e,i,a.color,{alphaScale:t>=6?.96:1,edgeFeather:t>=6?.2:.15});M.push(c);let d=new e.MeshBasicMaterial({map:c,transparent:!0,opacity:a.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});b.push(d);let l=new e.Mesh(p,d);l.name=a.name,l.position.set(a.position[0],a.position[1],a.position[2]),l.rotation.set(a.rotation[0],a.rotation[1],a.rotation[2]),l.scale.set(a.scale[0],a.scale[1],a.scale[2]),l.userData.baseY=l.position.y,l.userData.baseOpacity=a.opacity,l.userData.phase=i()*Math.PI*2,l.userData.float=.012+i()*.024,q(l,-44+t),y.add(l)}n.add(y);let f=new e.Group;f.name="low-submerged-final-coupe-radial-pressure";let v=[new e.MeshBasicMaterial({color:"#063dc7",transparent:!0,opacity:.3,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#110c0d",transparent:!0,opacity:.34,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#7d2f1e",transparent:!0,opacity:.22,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1})];b.push(...v);for(let t=0;t<6;t+=1){let a=1.7+t*.92,c=new e.RingGeometry(a,a+.065,128);u.push(c);let d=new e.Mesh(c,v[t%v.length]);d.name=`soft-low-cup-final-pressure-halo-${t+1}`,d.position.set((t-2.5)*.84,-.82-t*.12,-6.3-t*1.12),d.rotation.set(.05+t*.012,(t-2.5)*.028,(i()-.5)*.08),d.scale.y=.56,d.userData.phase=i()*Math.PI*2,q(d,-18+t),f.add(d)}n.add(f);let D=new e.BufferGeometry;u.push(D);let k=76,x=new Float32Array(k*2*3),C=new Float32Array(k*2*3),z=[new e.Color("#120d0d"),new e.Color("#bd1a10"),new e.Color("#063dc7"),new e.Color("#173b32")];for(let t=0;t<k;t+=1){let a=t%3!==0,c=(i()-.5)*(a?.76:12),d=-1.08-i()*1.35,l=a?c:-17.8+i()*35.6,L=a?-2.9+i()*5.9:-.2+(i()-.5)*.72,Q=a?l+(i()-.5)*.28:l+.7+i()*2.2,X=a?L+.58+i()*1.5:L+(i()-.5)*.24,w=t*6;x[w]=l,x[w+1]=L,x[w+2]=d,x[w+3]=Q,x[w+4]=X,x[w+5]=d-i()*.32;let P=z[t%z.length];C[w]=P.r,C[w+1]=P.g,C[w+2]=P.b,C[w+3]=P.r,C[w+4]=P.g,C[w+5]=P.b}D.setAttribute("position",new e.BufferAttribute(x,3)),D.setAttribute("color",new e.BufferAttribute(C,3));let _=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:.54,depthWrite:!1,depthTest:!0,toneMapped:!1});b.push(_);let F=new e.LineSegments(D,_);F.name="ragged-fracture-pressure-seam-deposits",F.frustumCulled=!1,F.renderOrder=-8,n.add(F);let B=new e.BufferGeometry;u.push(B);let I=260,O=new Float32Array(I*3),W=new Float32Array(I*3),V=[new e.Color("#063dc7"),new e.Color("#bd1a10"),new e.Color("#173b32"),new e.Color("#a95a1e"),new e.Color("#130d0d")];for(let t=0;t<I;t+=1){let a=i()*Math.PI*2,c=4.6+i()*11.5,d=t%5===0?.28:1;O[t*3]=Math.sin(a)*c*d,O[t*3+1]=-3.2+i()*6.5,O[t*3+2]=Math.cos(a)*c-3;let l=V[t%V.length];W[t*3]=l.r,W[t*3+1]=l.g,W[t*3+2]=l.b}B.setAttribute("position",new e.BufferAttribute(O,3)),B.setAttribute("color",new e.BufferAttribute(W,3));let N=new e.PointsMaterial({size:.2,transparent:!0,opacity:.5,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});b.push(N);let A=new e.Points(B,N);A.name="submerged-high-chroma-pigment-pressure-grains",A.frustumCulled=!1,A.renderOrder=-6,n.add(A);function $(t={}){let a=t.captureMode?0:Number(t.elapsedSeconds??t.time??0);h.uniforms?.uTime&&(h.uniforms.uTime.value=a);for(let c of y.children)c.position.y=c.userData.baseY+Math.sin(a*.075+c.userData.phase)*c.userData.float,c.material.opacity=c.userData.baseOpacity*(.965+Math.sin(a*.11+c.userData.phase)*.03);f.rotation.z=Math.sin(a*.04)*.02,F.rotation.z=Math.sin(a*.03)*.006,A.rotation.y=Math.sin(a*.028)*.03}function J(){T(n);for(let t of M)t&&typeof t.dispose=="function"&&t.dispose();for(let t of u)t&&typeof t.dispose=="function"&&t.dispose();for(let t of b)t&&typeof t.dispose=="function"&&t.dispose()}return{object:n,update:$,dispose:J}}export{te as createImmersiveWorldPart};
