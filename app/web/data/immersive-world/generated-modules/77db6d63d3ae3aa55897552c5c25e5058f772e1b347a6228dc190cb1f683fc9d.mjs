var J="art-direction-packet-2ccb39d51084",Q="2ccb39d51084e8c22637660468c4bb94";function X(e){let t=String(e??"hawkins-fracture-pressure"),c=2166136261;for(let s=0;s<t.length;s+=1)c^=t.charCodeAt(s),c=Math.imul(c,16777619);return c>>>0}function Z(e,t,c){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(t,c);let s=(X(t)^X(c))>>>0;return function(){s=s+1831565813>>>0;let l=s;return l=Math.imul(l^l>>>15,l|1),l^=l+Math.imul(l^l>>>7,l|61),((l^l>>>14)>>>0)/4294967296}}function q(e){return Math.max(0,Math.min(1,e))}function Y(e,t=96,c=.2,s=.56){let n=new Uint8Array(t*t*4),l=(t-1)*.5,o=t*.46,a=Math.max(1,t*s);for(let m=0;m<t;m+=1)for(let h=0;h<t;h+=1){let b=Math.hypot(h-l,m-l),g=q((o-b)/a),x=1-q((b-t*c)/(o-t*c)),F=g*g*(3-2*g),d=(m*t+h)*4;n[d]=255,n[d+1]=250,n[d+2]=225,n[d+3]=Math.round(q(F*(.72+x*.28))*255)}let r=new e.DataTexture(n,t,t,e.RGBAFormat);return r.needsUpdate=!0,e.SRGBColorSpace&&(r.colorSpace=e.SRGBColorSpace),r.wrapS=e.ClampToEdgeWrapping,r.wrapT=e.ClampToEdgeWrapping,r.minFilter=e.LinearFilter,r.magFilter=e.LinearFilter,r.generateMipmaps=!1,r}function z(e){return new e.ShaderMaterial({name:"hawkins-central-warning-figure-matte-canvas-shader",transparent:!0,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uDrapery:{value:new e.Color("#080b0d")},uVioletBlack:{value:new e.Color("#171523")},uBlueGreen:{value:new e.Color("#243f43")},uFlesh:{value:new e.Color("#d2b38b")},uCream:{value:new e.Color("#d8d0ad")},uOchre:{value:new e.Color("#b48737")},uFracture:{value:new e.Color("#dfc67c")},uShadow:{value:new e.Color("#020304")}},vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uDrapery;
      uniform vec3 uVioletBlack;
      uniform vec3 uBlueGreen;
      uniform vec3 uFlesh;
      uniform vec3 uCream;
      uniform vec3 uOchre;
      uniform vec3 uFracture;
      uniform vec3 uShadow;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
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

      float ellipse(vec2 p, vec2 c, vec2 r) {
        vec2 q = (p - c) / r;
        return 1.0 - smoothstep(0.92, 1.08, dot(q, q));
      }

      float stroke(vec2 p, vec2 a, vec2 b, float width) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return 1.0 - smoothstep(width, width * 2.8, length(pa - ba * h));
      }

      float robeMask(vec2 p) {
        float body = ellipse(p, vec2(0.49, 0.40), vec2(0.18, 0.39));
        float lower = ellipse(p, vec2(0.50, 0.22), vec2(0.27, 0.25));
        float shoulder = ellipse(p, vec2(0.49, 0.58), vec2(0.25, 0.14));
        float vertical = smoothstep(0.17, 0.23, p.y) * smoothstep(0.93, 0.80, p.y) * (1.0 - smoothstep(0.19, 0.32, abs(p.x - 0.5)));
        return clamp(max(max(body, lower), max(shoulder, vertical)), 0.0, 1.0);
      }

      void main() {
        vec2 p = vUv;
        float t = uTime * 0.025;
        float n = noise2(p * 15.0 + vec2(t, -t * 0.4));
        float n2 = noise2(p * 48.0 + vec2(4.0, 8.0));
        float weave = (sin((p.x + p.y) * 410.0) + sin((p.x - p.y) * 345.0)) * 0.010;

        float robe = robeMask(p);
        float face = ellipse(p, vec2(0.505, 0.765), vec2(0.087, 0.102));
        float hair = ellipse(p, vec2(0.505, 0.828), vec2(0.105, 0.052)) * smoothstep(0.76, 0.86, p.y);
        float collar = stroke(p, vec2(0.45, 0.66), vec2(0.56, 0.66), 0.006) + stroke(p, vec2(0.505, 0.66), vec2(0.505, 0.51), 0.004);

        float trumpFace = ellipse(p, vec2(0.205, 0.245), vec2(0.125, 0.075));
        float trumpHair = ellipse(p, vec2(0.17, 0.295), vec2(0.16, 0.07)) * (1.0 - smoothstep(0.22, 0.34, p.x));
        float trumpShoulder = ellipse(p, vec2(0.18, 0.11), vec2(0.23, 0.15));

        float fracture = stroke(p, vec2(0.665, 0.96), vec2(0.705, 0.08), 0.006);
        fracture += stroke(p, vec2(0.67, 0.62), vec2(0.62, 0.49), 0.0035);
        fracture += stroke(p, vec2(0.695, 0.36), vec2(0.76, 0.25), 0.0035);
        float fractureGlow = stroke(p, vec2(0.665, 0.96), vec2(0.705, 0.08), 0.028);

        float branch = 0.0;
        branch += stroke(p, vec2(0.77, 0.08), vec2(0.62, 0.88), 0.007);
        branch += stroke(p, vec2(0.76, 0.42), vec2(0.92, 0.60), 0.005);
        branch += stroke(p, vec2(0.70, 0.55), vec2(0.86, 0.78), 0.0045);
        branch += stroke(p, vec2(0.30, 0.00), vec2(0.38, 0.68), 0.006);

        vec3 color = mix(uBlueGreen, uVioletBlack, 0.5 + p.y * 0.28);
        color = mix(color, uDrapery, robe * (0.86 + n * 0.10));
        color = mix(color, uFlesh, face * (0.78 + n * 0.16));
        color = mix(color, uShadow, hair * 0.86);
        color = mix(color, uCream, collar * 0.62);
        color = mix(color, uShadow, trumpShoulder * 0.74);
        color = mix(color, mix(uOchre, uCream, 0.28), trumpHair * 0.78);
        color = mix(color, mix(uFlesh, uOchre, 0.25), trumpFace * 0.58);
        color = mix(color, uShadow, branch * 0.70);
        color = mix(color, uFracture, fractureGlow * 0.22 + fracture * 0.82);

        float alpha = clamp(robe * 0.90 + face * 0.92 + hair * 0.70 + collar * 0.55 + trumpFace * 0.64 + trumpHair * 0.58 + trumpShoulder * 0.64 + branch * 0.45 + fractureGlow * 0.40 + fracture * 0.85, 0.0, 0.96);
        float field = smoothstep(0.20, 0.88, p.y) * (1.0 - smoothstep(0.35, 0.55, abs(p.x - 0.50)));
        alpha = max(alpha, field * 0.18);

        color += (n - 0.5) * 0.085 + (n2 - 0.5) * 0.038 + weave;
        color *= 0.93 + face * 0.16 + fracture * 0.18 + trumpHair * 0.05;
        gl_FragColor = vec4(max(color, vec3(0.0)), alpha);
      }
    `})}function T(e){return new e.ShaderMaterial({name:"low-slow-concentrated-fracture-pressure-veil",transparent:!0,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uCool:{value:new e.Color("#315a62")},uDark:{value:new e.Color("#080a0b")},uOchre:{value:new e.Color("#b48737")}},vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uCool;
      uniform vec3 uDark;
      uniform vec3 uOchre;

      float band(float value, float center, float halfSize, float feather) {
        return 1.0 - smoothstep(halfSize, halfSize + feather, abs(value - center));
      }

      void main() {
        vec2 p = vUv;
        float pulse = 0.5 + 0.5 * sin(uTime * 0.11);
        float leftWeight = smoothstep(0.74, 0.16, p.x);
        float lowWeight = smoothstep(0.82, 0.18, p.y);
        float pressure = leftWeight * lowWeight;
        float seam = band(p.x + sin(p.y * 14.0) * 0.012, 0.54, 0.018, 0.055) * smoothstep(0.08, 0.76, p.y);
        vec3 color = mix(uDark, uCool, p.y * 0.42 + 0.12);
        color = mix(color, uOchre, pressure * 0.32 + seam * 0.35);
        float alpha = pressure * (0.16 + pulse * 0.025) + seam * 0.20;
        alpha *= smoothstep(0.0, 0.10, p.y) * smoothstep(1.0, 0.72, p.y);
        gl_FragColor = vec4(color, alpha);
      }
    `})}function O(e,t=0){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=t,e}function H(e,t,c){let s=new e.Group;s.name="foreground-branches-and-stems-bracing-fracture-pressure";let n=126,l=new Float32Array(n*2*3),o=new Float32Array(n*2*3),a=[new e.Color("#121615"),new e.Color("#202a22"),new e.Color("#5b4b2a"),new e.Color("#0a0c0d")];for(let p=0;p<n;p+=1){let W=p%2===0?1:-1,y=W>0?.34+t()*.44:-.3-t()*.44,M=4.2+t()*7.8,C=-3.15+t()*6.4,I=.72+t()*2.65,S=W*(.14+t()*.42),U=Math.sin(y)*M,V=Math.cos(y)*M-4-t()*3.8,k=U+S*I+(t()-.5)*.56,A=C+I*(.45+t()*.74),P=V-.22-t()*1.25,v=p*6;l[v]=U,l[v+1]=C,l[v+2]=V,l[v+3]=k,l[v+4]=A,l[v+5]=P;let w=a[p%a.length];o[v]=w.r,o[v+1]=w.g,o[v+2]=w.b,o[v+3]=w.r,o[v+4]=w.g,o[v+5]=w.b}let r=new e.BufferGeometry;r.setAttribute("position",new e.BufferAttribute(l,3)),r.setAttribute("color",new e.BufferAttribute(o,3)),c.geometries.push(r);let m=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:.64,depthWrite:!1,depthTest:!0,toneMapped:!1});c.materials.push(m);let h=new e.LineSegments(r,m);h.name="dark-hawkins-branch-stems-pressing-the-warning-figure",h.userData.baseOpacity=.64,O(h,-12),s.add(h);let b=190,g=new Float32Array(b*3),x=new Float32Array(b*3),F=[new e.Color("#d8d0ad"),new e.Color("#c9b26b"),new e.Color("#b48737"),new e.Color("#f0dfb5"),new e.Color("#7d8b72")];for(let p=0;p<b;p+=1){let y=p%5!==1?.28+t()*.58:-.26-t()*.45,M=4.8+t()*8.8;g[p*3]=Math.sin(y)*M+(t()-.5)*.82,g[p*3+1]=-2.65+t()*5.45,g[p*3+2]=Math.cos(y)*M-4.7-t()*4;let C=F[p%F.length];x[p*3]=C.r,x[p*3+1]=C.g,x[p*3+2]=C.b}let d=new e.BufferGeometry;d.setAttribute("position",new e.BufferAttribute(g,3)),d.setAttribute("color",new e.BufferAttribute(x,3)),c.geometries.push(d);let _=Y(e,96,.11,.42);c.textures.push(_);let L=new e.PointsMaterial({map:_,alphaMap:_,size:.29,transparent:!0,opacity:.78,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});c.materials.push(L);let G=new e.Points(d,L);return G.name="soft-cream-ochre-blossoms-framing-the-fracture",G.userData.baseOpacity=.78,O(G,-10),s.add(G),s}function R(e,t){let c=new e.Group;c.name="subdued-radial-symbols-concentrating-clash-pressure";let s=[new e.MeshBasicMaterial({color:"#d8d0ad",transparent:!0,opacity:.25,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#b48737",transparent:!0,opacity:.23,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#315a62",transparent:!0,opacity:.22,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#10121a",transparent:!0,opacity:.18,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1})];t.materials.push(...s);for(let n=0;n<8;n+=1){let l=1.42+n*.43,o=new e.RingGeometry(l,l+.035+n*.006,144);t.geometries.push(o);let a=new e.Mesh(o,s[n%s.length]);a.name=`low-steady-radial-pressure-halo-${n+1}`,a.position.set(.08+(n-3.5)*.07,.17-n*.045,-4.95-n*.11),a.rotation.set(.035+n*.004,(n-3.5)*.012,(n-3.5)*.025),a.scale.y=.7,a.userData.baseOpacity=s[n%s.length].opacity,a.userData.baseScaleX=a.scale.x,a.userData.baseScaleY=a.scale.y,a.userData.phase=n*.67,O(a,-15+n),c.add(a)}return c}function E(e,t){let c=new e.Group;c.name="gold-fracture-line-where-warning-becomes-pressure";let s=new e.MeshBasicMaterial({color:"#dfc67c",transparent:!0,opacity:.78,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});return t.materials.push(s),[[[.76,3.35,-3.42],[.69,2.22,-3.53],[.82,1.1,-3.48],[.72,-.08,-3.56],[.9,-1.25,-3.48],[.82,-2.8,-3.58]],[[.77,1.1,-3.47],[.44,.54,-3.5],[.36,-.08,-3.54]],[[.86,-.62,-3.49],[1.3,-1.05,-3.56],[1.5,-1.72,-3.62]]].forEach((l,o)=>{let a=new e.CatmullRomCurve3(l.map(h=>new e.Vector3(h[0],h[1],h[2])),!1,"centripetal",.48),r=new e.TubeGeometry(a,o===0?70:36,o===0?.014:.008,6,!1);t.geometries.push(r);let m=new e.Mesh(r,s);m.name=o===0?"primary-visible-vertical-gold-fracture":`branching-hairline-fracture-${o}`,m.userData.baseOpacity=s.opacity,O(m,-4+o),c.add(m)}),c}function ee(e){e.traverse(t=>{t.geometry&&typeof t.geometry.dispose=="function"&&t.geometry.dispose();let c=Array.isArray(t.material)?t.material:[t.material].filter(Boolean);for(let s of c)s&&typeof s.dispose=="function"&&s.dispose()})}function te({THREE:e,part:t,world:c,seed:s,camera:n,utilities:l}){let o=Z(l,s||t?.id||"non-literal-fracture-pressure","hawkins-xi-trump-fracture-pressure"),a=new e.Group;a.name="non-literal-fracture-pressure-hawkins-xi-trump-primary-news-signal",a.userData={partId:"non-literal-fracture-pressure",role:t?.role||"primary-news-signal",packetId:J,packetHash:Q,noSkyboxShell:!0,messagePurpose:"Central Hawkins-style warning pressure: a tall dark figure, lower-left Trump pressure, gold fracture, and branch-flower frame."};let r={geometries:[],materials:[],textures:[]},m=new e.PlaneGeometry(8.9,6.7,1,1);r.geometries.push(m);let h=T(e);r.materials.push(h);let b=new e.Mesh(m,h);b.name="low-left-donald-trump-pressure-veil-pushing-toward-fracture",b.position.set(-.35,-.2,-5.18),b.rotation.set(.03,0,-.012),O(b,-24),a.add(b);let g=R(e,r);a.add(g);let x=new e.PlaneGeometry(5.65,7.25,1,1);r.geometries.push(x);let F=z(e);r.materials.push(F);let d=new e.Mesh(x,F);d.name="large-central-hawkins-warning-figure-with-trump-pressure-and-fracture",d.position.set(-.06,.12,-3.78),d.rotation.set(.015,0,0),O(d,-8),a.add(d);let _=E(e,r);a.add(_);let L=H(e,o,r);a.add(L);let G=Y(e,128,.18,.5);r.textures.push(G);let p=new e.BufferGeometry,W=58,y=new Float32Array(W*3),M=new Float32Array(W*3),C=[new e.Color("#b48737"),new e.Color("#d8d0ad"),new e.Color("#315a62"),new e.Color("#14171a")];for(let i=0;i<W;i+=1){let f=i<34,D=f?-.46+o()*.28:-.75+o()*1.28,B=f?3.2+o()*2:3.7+o()*6.2;y[i*3]=Math.sin(D)*B-(f?.4:.05),y[i*3+1]=f?-2.18+o()*1.7:-2.9+o()*5.7,y[i*3+2]=Math.cos(D)*B-4.5-o()*2.4;let u=C[i%C.length];M[i*3]=u.r,M[i*3+1]=u.g,M[i*3+2]=u.b}p.setAttribute("position",new e.BufferAttribute(y,3)),p.setAttribute("color",new e.BufferAttribute(M,3)),r.geometries.push(p);let I=new e.PointsMaterial({map:G,alphaMap:G,size:.42,transparent:!0,opacity:.46,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});r.materials.push(I);let S=new e.Points(p,I);S.name="concentrated-low-pressure-pigment-around-trump-side",S.userData.baseOpacity=.46,O(S,-2),a.add(S);let U=new e.BufferGeometry,V=42,k=new Float32Array(V*2*3),A=new Float32Array(V*2*3),P=new e.Color("#d8d0ad");for(let i=0;i<V;i+=1){let f=-2.7+i/(V-1)*5.7,D=.86+Math.sin(i*1.7)*.055,B=.12+o()*.34,u=i*6;k[u]=D-B*.5,k[u+1]=f+(o()-.5)*.04,k[u+2]=-3.22,k[u+3]=D+B*.5,k[u+4]=f+(o()-.5)*.04,k[u+5]=-3.22,A[u]=P.r,A[u+1]=P.g,A[u+2]=P.b,A[u+3]=P.r,A[u+4]=P.g,A[u+5]=P.b}U.setAttribute("position",new e.BufferAttribute(k,3)),U.setAttribute("color",new e.BufferAttribute(A,3)),r.geometries.push(U);let v=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:.43,depthWrite:!1,depthTest:!0,toneMapped:!1});r.materials.push(v);let w=new e.LineSegments(U,v);w.name="short-pale-canvas-stitches-crossing-the-fracture",w.userData.baseOpacity=.43,O(w,2),a.add(w);function K(i={}){let f=i.captureMode?0:Number(i.elapsedSeconds??i.time??0);F.uniforms.uTime.value=f,h.uniforms.uTime.value=f,a.rotation.y=Math.sin(f*.026)*.012,a.rotation.z=Math.sin(f*.018)*.006,g.children.forEach((u,j)=>{let N=1+Math.sin(f*.12+u.userData.phase)*.018;u.scale.x=u.userData.baseScaleX*N,u.scale.y=u.userData.baseScaleY*N,u.material.opacity=u.userData.baseOpacity*(.92+Math.sin(f*.1+j)*.055)});let D=L.children[0],B=L.children[1];D?.material&&(D.material.opacity=D.userData.baseOpacity*(.95+Math.sin(f*.09)*.035)),B?.material&&(B.material.opacity=B.userData.baseOpacity*(.94+Math.sin(f*.085+.8)*.045)),S?.material&&(S.material.opacity=S.userData.baseOpacity*(.91+Math.sin(f*.11+1.6)*.06)),w?.material&&(w.material.opacity=w.userData.baseOpacity*(.92+Math.sin(f*.12+.5)*.05))}function $(){ee(a);for(let i of r.textures)i?.dispose?.();for(let i of r.geometries)i?.dispose?.();for(let i of r.materials)i?.dispose?.()}return K({captureMode:!0,elapsedSeconds:0,camera:n}),{object:a,update:K,dispose:$}}export{te as createImmersiveWorldPart};
