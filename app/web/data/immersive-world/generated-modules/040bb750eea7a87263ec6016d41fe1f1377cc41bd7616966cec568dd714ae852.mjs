var V="art-direction-packet-2ccb39d51084",W="2ccb39d51084e8c22637660468c4bb94";function F(e){let t=String(e??"hawkins-artist-mark-field"),r=2166136261;for(let o=0;o<t.length;o+=1)r^=t.charCodeAt(o),r=Math.imul(r,16777619);return r>>>0}function L(e,t,r){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(t,r);let o=(F(t)^F(r))>>>0;return function(){o=o+1831565813>>>0;let a=o;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}function _(e){return Math.max(0,Math.min(1,e))}function k(e,t=0){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=t,e}function I(e){e.traverse(t=>{t.geometry&&typeof t.geometry.dispose=="function"&&t.geometry.dispose();let r=Array.isArray(t.material)?t.material:[t.material].filter(Boolean);for(let o of r)o&&typeof o.dispose=="function"&&o.dispose()})}function U(e,t=128){let r=new Uint8Array(t*t*4),o=(t-1)*.5;for(let a=0;a<t;a+=1)for(let i=0;i<t;i+=1){let l=(i-o)/o,c=(a-o)/o,u=Math.hypot(l,c),n=.9+.1*Math.cos(Math.atan2(c,l)*8),d=_((1-u/n)/.48),p=d*d*(3-2*d),h=(a*t+i)*4;r[h]=255,r[h+1]=248,r[h+2]=220,r[h+3]=Math.round(p*255)}let s=new e.DataTexture(r,t,t,e.RGBAFormat);return s.needsUpdate=!0,s.wrapS=e.ClampToEdgeWrapping,s.wrapT=e.ClampToEdgeWrapping,s.minFilter=e.LinearFilter,s.magFilter=e.LinearFilter,s.generateMipmaps=!1,e.SRGBColorSpace&&(s.colorSpace=e.SRGBColorSpace),s}function Y(e,t=0){return new e.ShaderMaterial({name:`hawkins_matte_canvas_mark_wash_${t}`,transparent:!0,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uVariant:{value:t},uCool:{value:new e.Color("#28484a")},uGreen:{value:new e.Color("#334137")},uViolet:{value:new e.Color("#14131d")},uDrapery:{value:new e.Color("#06080a")},uOchre:{value:new e.Color("#b48737")},uCream:{value:new e.Color("#d8d0ad")},uFracture:{value:new e.Color("#dfc67c")}},vertexShader:`
      varying vec2 vUv;
      varying vec3 vLocal;
      void main() {
        vUv = uv;
        vLocal = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec2 vUv;
      varying vec3 vLocal;
      uniform float uTime;
      uniform float uVariant;
      uniform vec3 uCool;
      uniform vec3 uGreen;
      uniform vec3 uViolet;
      uniform vec3 uDrapery;
      uniform vec3 uOchre;
      uniform vec3 uCream;
      uniform vec3 uFracture;

      float hash21(vec2 p) {
        p = fract(p * vec2(127.1, 311.7));
        p += dot(p, p + 19.19);
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

      float stroke(vec2 p, vec2 a, vec2 b, float width) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return 1.0 - smoothstep(width, width * 2.9, length(pa - ba * h));
      }

      float ring(vec2 p, vec2 c, float radius, float width) {
        float d = abs(length(p - c) - radius);
        return 1.0 - smoothstep(width, width * 2.3, d);
      }

      void main() {
        vec2 p = vUv;
        vec2 q = p * 2.0 - 1.0;
        float slow = uTime * 0.018;
        float broad = noise2(q * 2.2 + vec2(uVariant * 7.0 + slow, -slow * 0.6));
        float grain = noise2(q * 28.0 + vec2(3.0, 8.0));
        float grainFine = noise2(q * 74.0 + vec2(11.0, 2.0));
        float weave = (sin((q.x + q.y) * 390.0) + sin((q.x - q.y) * 340.0)) * 0.011;

        vec3 color = mix(uCool, uGreen, 0.34 + broad * 0.34);
        color = mix(color, uViolet, smoothstep(0.08, 0.92, p.y) * 0.36);

        float centralDrapery = smoothstep(0.62, 0.08, abs(q.x + 0.02)) * smoothstep(-0.86, 0.1, q.y) * smoothstep(1.0, 0.38, q.y);
        centralDrapery *= 0.36 + 0.36 * broad;
        float sideShadow = smoothstep(0.48, 0.98, abs(q.x)) * (0.24 + broad * 0.16);
        color = mix(color, uDrapery, centralDrapery * (0.35 + 0.18 * uVariant));
        color = mix(color, uDrapery, sideShadow * 0.42);

        float fracture = stroke(p, vec2(0.63 + uVariant * 0.045, 0.98), vec2(0.56 - uVariant * 0.03, 0.04), 0.006);
        fracture += stroke(p, vec2(0.61, 0.62), vec2(0.68, 0.50), 0.004);
        fracture += stroke(p, vec2(0.59, 0.31), vec2(0.47, 0.22), 0.004);
        float fractureHalo = stroke(p, vec2(0.63 + uVariant * 0.045, 0.98), vec2(0.56 - uVariant * 0.03, 0.04), 0.035);
        color = mix(color, uFracture, fracture * 0.82 + fractureHalo * 0.20);

        float roundel = ring(q * vec2(1.0, 1.18), vec2(-0.04, 0.10), 0.42 + uVariant * 0.08, 0.018);
        float outerRoundel = ring(q * vec2(0.92, 1.06), vec2(-0.02, 0.05), 0.66 + uVariant * 0.06, 0.012);
        color = mix(color, uCream, roundel * 0.22);
        color = mix(color, uOchre, outerRoundel * 0.18);

        float verticalStem = 0.0;
        verticalStem += stroke(p, vec2(0.22, 0.03), vec2(0.28, 0.90), 0.006);
        verticalStem += stroke(p, vec2(0.79, 0.07), vec2(0.68, 0.86), 0.006);
        verticalStem += stroke(p, vec2(0.76, 0.36), vec2(0.91, 0.60), 0.004);
        color = mix(color, uDrapery, verticalStem * 0.48);

        float alpha = 0.27;
        alpha += centralDrapery * 0.12 + roundel * 0.15 + outerRoundel * 0.12 + fractureHalo * 0.18 + fracture * 0.26 + verticalStem * 0.16;
        alpha *= smoothstep(0.0, 0.08, p.y) * smoothstep(1.0, 0.86, p.y);
        alpha *= smoothstep(1.0, 0.78, abs(q.x));

        color += (grain - 0.5) * 0.085 + (grainFine - 0.5) * 0.035 + weave;
        color = max(color, vec3(0.0));
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.68));
      }
    `})}function X(e,t){let r=new e.Group;r.name="deep-matte-canvas-washes-carrying-hawkins-surface";let o=[{width:14.8,height:9.6,position:[0,.35,-7.2],rotation:[.03,0,0],variant:0,order:-40},{width:10.4,height:8.4,position:[-2.9,.05,-5.3],rotation:[.02,-.11,.02],variant:1,order:-34},{width:10.2,height:8.1,position:[2.8,-.05,-5.7],rotation:[.02,.12,-.025],variant:2,order:-33}];for(let s of o){let a=new e.PlaneGeometry(s.width,s.height,1,1),i=Y(e,s.variant);t.geometries.push(a),t.materials.push(i);let l=new e.Mesh(a,i);l.name=`large-authorial-canvas-wash-depth-plane-${s.variant+1}`,l.position.set(s.position[0],s.position[1],s.position[2]),l.rotation.set(s.rotation[0],s.rotation[1],s.rotation[2]),l.userData.baseY=l.position.y,k(l,s.order),r.add(l)}return r}function $(e,t){let r=new e.Group;r.name="subdued-roundels-and-radial-symbols-as-artist-style-system";let o=["#d8d0ad","#b48737","#315a62","#192222","#dfc67c"],s=[.3,.25,.22,.28,.24];for(let a=0;a<12;a+=1){let i=1.52+a*.36,l=.026+a*.003,c=new e.RingGeometry(i,i+l,160),u=new e.MeshBasicMaterial({color:o[a%o.length],transparent:!0,opacity:s[a%s.length],depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});t.geometries.push(c),t.materials.push(u);let n=new e.Mesh(c,u);n.name=`hawkins-muted-radial-symbol-roundel-${a+1}`,n.position.set((a-5.5)*.055,.08-a*.035,-4.65-a*.18),n.rotation.set(.03+a*.004,(a-5.5)*.012,(a-5.5)*.028),n.scale.y=.67+a%3*.045,n.userData.baseOpacity=u.opacity,n.userData.baseScaleX=n.scale.x,n.userData.baseScaleY=n.scale.y,n.userData.phase=a*.52,k(n,-18+a),r.add(n)}return r}function z(e,t,r){let o=new e.Group;o.name="thin-branches-stems-and-fold-lines-framing-the-central-pressure";let s=168,a=new Float32Array(s*2*3),i=new Float32Array(s*2*3),l=[new e.Color("#111514"),new e.Color("#202a22"),new e.Color("#5c4a25"),new e.Color("#0a0d0e"),new e.Color("#374238")];for(let f=0;f<s;f+=1){let w=f%2===0?1:-1,C=w>0?.22+t()*.62:-.22-t()*.62,S=4.1+t()*8.8,m=-3.3+t()*6.8,A=.65+t()*3.1,y=w*(.16+t()*.48),D=Math.sin(C)*S,B=Math.cos(C)*S-5.3-t()*2.8,P=D+y*A+(t()-.5)*.7,O=m+A*(.42+t()*.78),q=B-.2-t()*1.35,g=f*6;a[g]=D,a[g+1]=m,a[g+2]=B,a[g+3]=P,a[g+4]=O,a[g+5]=q;let G=l[f%l.length];i[g]=G.r,i[g+1]=G.g,i[g+2]=G.b,i[g+3]=G.r,i[g+4]=G.g,i[g+5]=G.b}let c=new e.BufferGeometry;c.setAttribute("position",new e.BufferAttribute(a,3)),c.setAttribute("color",new e.BufferAttribute(i,3));let u=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:.62,depthWrite:!1,depthTest:!0,toneMapped:!1});r.geometries.push(c),r.materials.push(u);let n=new e.LineSegments(c,u);n.name="nervous-delicate-branch-and-garment-fold-mark-field",n.userData.baseOpacity=u.opacity,k(n,-8),o.add(n);let d=58,p=new Float32Array(d*2*3),h=new Float32Array(d*2*3),v=new e.Color("#d8d0ad");for(let f=0;f<d;f+=1){let w=-3.1+f/(d-1)*6.4,C=.88+Math.sin(f*1.63)*.08,S=.18+t()*.44,m=f*6;p[m]=C-S*.5,p[m+1]=w+(t()-.5)*.05,p[m+2]=-3.85,p[m+3]=C+S*.5,p[m+4]=w+(t()-.5)*.05,p[m+5]=-3.85,h[m]=v.r,h[m+1]=v.g,h[m+2]=v.b,h[m+3]=v.r,h[m+4]=v.g,h[m+5]=v.b}let b=new e.BufferGeometry;b.setAttribute("position",new e.BufferAttribute(p,3)),b.setAttribute("color",new e.BufferAttribute(h,3));let x=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:.46,depthWrite:!1,depthTest:!0,toneMapped:!1});r.geometries.push(b),r.materials.push(x);let M=new e.LineSegments(b,x);return M.name="short-pale-stitches-crossing-the-non-literal-fracture",M.userData.baseOpacity=x.opacity,k(M,6),o.add(M),o}function K(e,t,r){let o=new e.Group;o.name="soft-ochre-cream-flower-and-pigment-field";let s=U(e,128);r.textures.push(s);let a=260,i=new Float32Array(a*3),l=new Float32Array(a*3),c=[new e.Color("#d8d0ad"),new e.Color("#b48737"),new e.Color("#c9b86b"),new e.Color("#efe0b7"),new e.Color("#6f8068")];for(let p=0;p<a;p+=1){let h=p%5===0,v=p%5!==1,b=h?-.62-t()*.34:v?.35+t()*.58:-.2+t()*.4,x=4.2+t()*9.8;i[p*3]=Math.sin(b)*x+(t()-.5)*1.25,i[p*3+1]=-2.95+t()*6.1,i[p*3+2]=Math.cos(b)*x-4.4-t()*4.2;let M=c[p%c.length];l[p*3]=M.r,l[p*3+1]=M.g,l[p*3+2]=M.b}let u=new e.BufferGeometry;u.setAttribute("position",new e.BufferAttribute(i,3)),u.setAttribute("color",new e.BufferAttribute(l,3));let n=new e.PointsMaterial({map:s,alphaMap:s,size:.38,transparent:!0,opacity:.78,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});r.geometries.push(u),r.materials.push(n);let d=new e.Points(u,n);return d.name="readable-soft-blossoms-and-yellow-ochre-artist-marks",d.userData.baseOpacity=n.opacity,k(d,-2),o.add(d),o}function Z(e,t,r){let o=new e.Group;o.name="instanced-pressed-flower-petals-making-radial-symbols";let s=new e.PlaneGeometry(.115,.44,1,1),a=new e.MeshBasicMaterial({color:"#c7b65f",transparent:!0,opacity:.54,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});r.geometries.push(s),r.materials.push(a);let i=150,l=new e.InstancedMesh(s,a,i);l.name="yellow-green-wedge-petals-orbiting-the-warning-field",l.userData.baseOpacity=a.opacity;let c=new e.Object3D,u=[{x:-2.65,y:-1.75,z:-4.35,radius:.72},{x:2.62,y:.25,z:-4.75,radius:.86},{x:0,y:1.42,z:-5.25,radius:1.18},{x:3.75,y:-1.55,z:-6.2,radius:.96},{x:-3.78,y:.78,z:-6,radius:.82}];for(let n=0;n<i;n+=1){let d=u[n%u.length],p=n/i*Math.PI*2*u.length+t()*.16,h=d.radius*(.72+t()*.42);c.position.set(d.x+Math.cos(p)*h,d.y+Math.sin(p)*h*.62,d.z+(t()-.5)*.34),c.rotation.set(0,0,p+Math.PI*.5+(t()-.5)*.45);let v=.9+t()*.85;c.scale.set(v,v,v),c.updateMatrix(),l.setMatrixAt(n,c.matrix)}return l.instanceMatrix.needsUpdate=!0,k(l,3),o.add(l),o}function N(e,t){let r=new e.Group;r.name="matte-gold-fracture-lines-under-slow-pressure";let o=new e.MeshBasicMaterial({color:"#dfc67c",transparent:!0,opacity:.76,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});return t.materials.push(o),[[[.85,3.8,-3.85],[.71,2.35,-3.9],[.88,1.2,-3.84],[.72,0,-3.95],[.98,-1.3,-3.9],[.86,-3.25,-4]],[[.78,1.22,-3.86],[.35,.58,-3.92],[.22,-.24,-4.02]],[[.96,-.62,-3.86],[1.48,-1.07,-3.94],[1.72,-1.92,-4.05]],[[-.62,3.25,-5.6],[-.48,1.6,-5.45],[-.72,.3,-5.55],[-.56,-2.4,-5.75]]].forEach((a,i)=>{let l=new e.CatmullRomCurve3(a.map(n=>new e.Vector3(n[0],n[1],n[2])),!1,"centripetal",.5),c=new e.TubeGeometry(l,i===0?86:48,i===0?.018:.01,7,!1);t.geometries.push(c);let u=new e.Mesh(c,o);u.name=i===0?"primary-matte-gold-pressure-fracture":`secondary-hairline-fracture-thread-${i}`,u.userData.baseOpacity=o.opacity,k(u,10+i),r.add(u)}),r}function J({THREE:e,part:t,world:r,seed:o,assets:s,camera:a,utilities:i}={}){let l=L(i,o||t?.id||"artist-mark-field","louis-welden-hawkins-artist-mark-field"),c=new e.Group;c.name="artist-mark-field-louis-welden-hawkins-style-system",c.userData={partId:"artist-mark-field",role:t?.role||"artist-style-system",packetId:V,packetHash:W,noSkyboxShell:!0,messagePurpose:"A non-enclosing Hawkins mark field: matte canvas washes, radial symbols, branch lines, flowers, and gold fracture pressure around the central warning."};let u={geometries:[],materials:[],textures:[]},n=X(e,u),d=$(e,u),p=z(e,l,u),h=K(e,l,u),v=Z(e,l,u),b=N(e,u);c.add(n),c.add(d),c.add(p),c.add(h),c.add(v),c.add(b);function x(f={}){let w=f.captureMode?0:Number(f.elapsedSeconds??f.time??0);n.children.forEach((y,D)=>{y.material?.uniforms?.uTime&&(y.material.uniforms.uTime.value=w),y.position.y=y.userData.baseY+Math.sin(w*.045+D)*.035}),d.children.forEach((y,D)=>{let B=1+Math.sin(w*.12+y.userData.phase)*.018;y.scale.x=y.userData.baseScaleX*B,y.scale.y=y.userData.baseScaleY*B,y.material.opacity=y.userData.baseOpacity*(.9+Math.sin(w*.1+D)*.07)});let C=p.children[0],S=p.children[1];C?.material&&(C.material.opacity=C.userData.baseOpacity*(.94+Math.sin(w*.08)*.04)),S?.material&&(S.material.opacity=S.userData.baseOpacity*(.92+Math.sin(w*.12+.8)*.06));let m=h.children[0];m?.material&&(m.material.opacity=m.userData.baseOpacity*(.91+Math.sin(w*.09+1.7)*.06));let A=v.children[0];A?.material&&(A.material.opacity=A.userData.baseOpacity*(.9+Math.sin(w*.075+.4)*.06)),b.children.forEach((y,D)=>{y.material&&(y.material.opacity=y.userData.baseOpacity*(.9+Math.sin(w*.11+D*.6)*.07))}),c.rotation.y=Math.sin(w*.026)*.012,c.rotation.z=Math.sin(w*.018)*.004}function M(){I(c);for(let f of u.textures)f?.dispose?.();for(let f of u.geometries)f?.dispose?.();for(let f of u.materials)f?.dispose?.()}return x({captureMode:!0,elapsedSeconds:0,camera:a}),{object:c,update:x,dispose:M}}export{J as createImmersiveWorldPart};
