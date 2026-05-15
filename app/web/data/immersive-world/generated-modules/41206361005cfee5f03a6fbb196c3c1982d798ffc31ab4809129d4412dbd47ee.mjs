var D="art-direction-packet-2ccb39d51084",P="2ccb39d51084e8c22637660468c4bb94";function N(e){let o=String(e??"hawkins-warning-environment"),a=2166136261;for(let t=0;t<o.length;t+=1)a^=o.charCodeAt(t),a=Math.imul(a,16777619);return a>>>0}function j(e,o,a){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(o,a);let t=(N(o)^N(a))>>>0;return function(){t=t+1831565813>>>0;let s=t;return s=Math.imul(s^s>>>15,s|1),s^=s+Math.imul(s^s>>>7,s|61),((s^s>>>14)>>>0)/4294967296}}function U(e){e.traverse(o=>{o.geometry&&typeof o.geometry.dispose=="function"&&o.geometry.dispose();let a=Array.isArray(o.material)?o.material:[o.material].filter(Boolean);for(let t of a)t&&typeof t.dispose=="function"&&t.dispose()})}function L(e){return Math.max(0,Math.min(1,e))}function $(e,o,a){let t=new e.Group;t.name=a,t.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,environmentRadius:o,partId:"world-environment",packetId:D,packetHash:P};let r=2/Math.sqrt(3),s=new e.BoxGeometry(r,r,r,1,1,1),i=new e.MeshBasicMaterial({color:"#172322",side:e.BackSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),n=new e.Mesh(s,i);return n.name=`${a}-mesh`,n.scale.setScalar(o),n.castShadow=!1,n.receiveShadow=!1,n.frustumCulled=!1,t.add(n),t.object=t,t.mesh=n,t.material=i,t.geometry=s,t}function J(e){return new e.ShaderMaterial({name:"hawkins_position_space_warning_skybox_single_shell",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uNight:{value:new e.Color("#121817")},uBlueGreen:{value:new e.Color("#334d4d")},uMist:{value:new e.Color("#6f7b68")},uOlive:{value:new e.Color("#283626")},uVioletBlack:{value:new e.Color("#10121a")},uDrapery:{value:new e.Color("#050708")},uFleshPale:{value:new e.Color("#d2b38b")},uOchre:{value:new e.Color("#b48737")},uCream:{value:new e.Color("#d8d0ad")},uFracture:{value:new e.Color("#dfc67c")},uWater:{value:new e.Color("#243f43")}},vertexShader:`
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vPosition;
      uniform float uTime;
      uniform vec3 uNight;
      uniform vec3 uBlueGreen;
      uniform vec3 uMist;
      uniform vec3 uOlive;
      uniform vec3 uVioletBlack;
      uniform vec3 uDrapery;
      uniform vec3 uFleshPale;
      uniform vec3 uOchre;
      uniform vec3 uCream;
      uniform vec3 uFracture;
      uniform vec3 uWater;

      float hash31(vec3 p) {
        p = fract(p * vec3(127.1, 311.7, 74.7));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }

      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), u.x),
            mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), u.x),
            u.y
          ),
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), u.x),
            mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), u.x),
            u.y
          ),
          u.z
        );
      }

      float fbm3(vec3 p) {
        float value = 0.0;
        float amp = 0.52;
        for (int i = 0; i < 5; i++) {
          value += amp * noise3(p);
          p = p * 2.06 + vec3(7.7, 4.1, 9.3);
          amp *= 0.5;
        }
        return value;
      }

      float softBand(float value, float center, float halfSize, float feather) {
        return 1.0 - smoothstep(halfSize, halfSize + feather, abs(value - center));
      }

      float softRect(float x, float y, float halfWidth, float centerY, float halfHeight, float feather) {
        float sx = 1.0 - smoothstep(halfWidth, halfWidth + feather, abs(x));
        float sy = 1.0 - smoothstep(halfHeight, halfHeight + feather, abs(y - centerY));
        return sx * sy;
      }

      float branchStroke(vec2 p, vec2 a, vec2 b, float width) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float d = length(pa - ba * h);
        return 1.0 - smoothstep(width, width * 2.6, d);
      }

      float flower(vec2 p, vec2 c, float radius) {
        vec2 q = p - c;
        float r = length(q);
        float petals = 0.5 + 0.5 * cos(atan(q.y, q.x) * 8.0);
        return (1.0 - smoothstep(radius * (0.52 + petals * 0.56), radius * 1.35, r)) * smoothstep(radius * 0.18, radius * 0.02, r);
      }

      void main() {
        vec3 dir = normalize(vPosition);
        float y = dir.y;
        float x = dir.x;
        float z = dir.z;
        float front = smoothstep(-0.18, 0.78, -z);
        float poleFade = 1.0 - smoothstep(0.78, 0.97, abs(y));
        float poleBlend = smoothstep(0.84, 0.985, abs(y));
        float slow = uTime * 0.016;
        vec3 domain = vec3(x * 1.25, y * 1.1, z * 1.25);
        float broad = fbm3(domain * 1.75 + vec3(slow, -slow * 0.4, slow * 0.31));
        float canvasA = fbm3(domain * 22.0 + vec3(0.0, slow * 1.2, -slow));
        float canvasB = fbm3(vec3(domain.yz, domain.x) * 34.0 + vec3(3.0, 1.0, 5.0));
        float wash = smoothstep(-0.72, 0.84, y);

        vec3 lower = mix(uNight, uWater, smoothstep(-0.96, -0.22, y) + broad * 0.16);
        vec3 middle = mix(uBlueGreen, uMist, 0.28 + broad * 0.42);
        vec3 upper = mix(uOlive, uVioletBlack, smoothstep(0.45, 1.0, y) * 0.72 + broad * 0.18);
        vec3 color = mix(lower, middle, smoothstep(-0.72, 0.18, y));
        color = mix(color, upper, smoothstep(0.18, 0.96, y));

        float centralDrapery = softRect(x + 0.03, y, 0.24, 0.03, 0.78, 0.18) * front;
        float shoulder = softRect(x + 0.02, y, 0.38, -0.28, 0.28, 0.2) * front;
        float paleFace = (1.0 - smoothstep(0.05, 0.145, length(vec2((x + 0.025) * 1.65, y - 0.36)))) * front;
        float trumpPressure = (1.0 - smoothstep(0.08, 0.24, length(vec2((x + 0.58) * 1.35, y + 0.36)))) * front;
        float moonDisc = (1.0 - smoothstep(0.045, 0.12, length(vec2(x - 0.6, y - 0.45)))) * smoothstep(0.0, 0.72, -z);
        float leftMoon = (1.0 - smoothstep(0.16, 0.39, length(vec2(x + 0.68, y - 0.2)))) * smoothstep(0.1, 0.88, front);

        color = mix(color, uDrapery, centralDrapery * 0.88);
        color = mix(color, mix(uDrapery, uVioletBlack, 0.38), shoulder * 0.66);
        color = mix(color, uFleshPale, paleFace * 0.78);
        color = mix(color, mix(uOchre, uFleshPale, 0.55), trumpPressure * 0.62);
        color = mix(color, uCream, moonDisc * 0.22 + leftMoon * 0.12);

        vec2 p = vec2(x, y);
        float branch = 0.0;
        branch += branchStroke(p, vec2(0.52, -0.72), vec2(0.18, 0.72), 0.011);
        branch += branchStroke(p, vec2(0.62, -0.14), vec2(0.84, 0.48), 0.009);
        branch += branchStroke(p, vec2(0.35, 0.03), vec2(0.76, 0.16), 0.008);
        branch += branchStroke(p, vec2(-0.36, -0.72), vec2(-0.18, 0.72), 0.015);
        branch += branchStroke(p, vec2(-0.5, -0.56), vec2(-0.68, 0.1), 0.009);
        branch = min(branch, 1.0) * poleFade * (0.52 + 0.48 * front);

        float blossom = 0.0;
        blossom += flower(p, vec2(0.42, -0.06), 0.034);
        blossom += flower(p, vec2(0.52, 0.08), 0.03);
        blossom += flower(p, vec2(0.63, -0.21), 0.026);
        blossom += flower(p, vec2(0.72, 0.18), 0.022);
        blossom += flower(p, vec2(-0.35, -0.42), 0.028);
        blossom += flower(p, vec2(-0.28, -0.25), 0.024);
        blossom = min(blossom, 1.0) * poleFade * (0.42 + front * 0.58);

        float fractureCore = softBand(x + (broad - 0.5) * 0.045, 0.12, 0.012, 0.028) * smoothstep(-0.62, 0.28, y) * smoothstep(0.84, 0.08, abs(y)) * front * poleFade;
        float fractureHalo = softBand(x + (broad - 0.5) * 0.04, 0.12, 0.038, 0.085) * smoothstep(-0.72, 0.22, y) * front * poleFade;
        float waterReflection = softBand(y + (canvasA - 0.5) * 0.04, -0.52, 0.035, 0.07) * (0.35 + 0.65 * smoothstep(0.9, 0.1, abs(x))) * front * poleFade;

        color = mix(color, mix(uOlive, uNight, 0.72), branch * 0.82);
        color = mix(color, uCream, blossom * 0.5);
        color = mix(color, uOchre, blossom * 0.18);
        color = mix(color, uFracture, fractureCore * 0.86 + fractureHalo * 0.26);
        color = mix(color, uWater, waterReflection * 0.44);

        float sideVignette = smoothstep(0.58, 1.0, abs(x)) * (0.18 + broad * 0.18);
        float topSmoke = smoothstep(0.58, 0.98, y) * (0.12 + broad * 0.1);
        color = mix(color, uNight, sideVignette * poleFade);
        color = mix(color, uOlive, topSmoke);

        float grain = (canvasA - 0.5) * 0.105 + (canvasB - 0.5) * 0.045;
        float weave = (sin((x + y) * 420.0) * 0.5 + sin((x - y) * 360.0) * 0.5) * 0.012 * (0.35 + 0.65 * poleFade);
        color += grain + weave;
        color *= 0.92 + 0.28 * front;
        color += vec3(0.025, 0.02, 0.012) * front * (paleFace + blossom * 0.35 + fractureHalo * 0.32);
        vec3 poleWash = mix(mix(uNight, uWater, 0.38), mix(uOlive, uBlueGreen, 0.36), smoothstep(-0.34, 0.62, y));
        color = mix(color, poleWash + (broad - 0.5) * 0.06, poleBlend * 0.74);
        color = pow(max(color, vec3(0.0)), vec3(1.03));
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function Q(e){let a=new Uint8Array(16384);for(let r=0;r<64;r+=1)for(let s=0;s<64;s+=1){let i=(s+.5)/64*2-1,n=(r+.5)/64*2-1,d=Math.sqrt(i*i+n*n),v=L(1-X(.18,1,d)),u=(r*64+s)*4;a[u]=255,a[u+1]=250,a[u+2]=220,a[u+3]=Math.round(v*255)}let t=new e.DataTexture(a,64,64,e.RGBAFormat);return t.needsUpdate=!0,e.SRGBColorSpace&&(t.colorSpace=e.SRGBColorSpace),t.wrapS=e.ClampToEdgeWrapping,t.wrapT=e.ClampToEdgeWrapping,t.minFilter=e.LinearFilter,t.magFilter=e.LinearFilter,t}function X(e,o,a){let t=L((a-e)/(o-e));return t*t*(3-2*t)}function Z(e,o,a){return new e.LineBasicMaterial({color:o,transparent:!0,opacity:a,depthWrite:!1,depthTest:!0,toneMapped:!1})}function W(e,o){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=o,e}function T(e,o,a){let t=new e.Group;t.name="near-mid-hawkins-branches-flowers-fracture-frame";let r=new e.BufferGeometry;a.geometries.push(r);let s=92,i=new Float32Array(s*2*3),n=new Float32Array(s*2*3),d=[new e.Color("#151b19"),new e.Color("#273126"),new e.Color("#5b4b2a"),new e.Color("#0b1012")];for(let l=0;l<s;l+=1){let G=l%2===0?1:-1,B=G>0?.64+o()*.5:-.64-o()*.48,F=5.2+o()*8.4,S=-3.4+o()*6.5,O=.8+o()*2.5,q=G*(.16+o()*.38),I=Math.sin(B)*F,_=Math.cos(B)*F-2.6,V=I+q*O+(o()-.5)*.8,Y=S+O*(.48+o()*.8),K=_-.4-o()*1.4,m=l*6;i[m]=I,i[m+1]=S,i[m+2]=_,i[m+3]=V,i[m+4]=Y,i[m+5]=K;let k=d[l%d.length];n[m]=k.r,n[m+1]=k.g,n[m+2]=k.b,n[m+3]=k.r,n[m+4]=k.g,n[m+5]=k.b}r.setAttribute("position",new e.BufferAttribute(i,3)),r.setAttribute("color",new e.BufferAttribute(n,3));let v=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:.58,depthWrite:!1,depthTest:!0,toneMapped:!1});a.materials.push(v);let u=new e.LineSegments(r,v);u.name="quiet-branch-stems-pressing-the-central-warning",u.userData.baseRotationY=0,W(u,-26),t.add(u);let c=new e.BufferGeometry;a.geometries.push(c);let h=150,b=new Float32Array(h*3),g=new Float32Array(h*3),z=[new e.Color("#d8d0ad"),new e.Color("#b48737"),new e.Color("#c8ba8a"),new e.Color("#e0cfab"),new e.Color("#7c8b6f")];for(let l=0;l<h;l+=1){let B=(l%3===0?-1:1)>0?.42+o()*.72:-.48-o()*.58,F=5.6+o()*9.6;b[l*3]=Math.sin(B)*F+(o()-.5)*1.4,b[l*3+1]=-2.7+o()*5.6,b[l*3+2]=Math.cos(B)*F-3.2-o()*4.8;let S=z[l%z.length];g[l*3]=S.r,g[l*3+1]=S.g,g[l*3+2]=S.b}c.setAttribute("position",new e.BufferAttribute(b,3)),c.setAttribute("color",new e.BufferAttribute(g,3));let f=Q(e);a.textures.push(f);let p=new e.PointsMaterial({map:f,alphaMap:f,size:.23,transparent:!0,opacity:.72,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});a.materials.push(p);let x=new e.Points(c,p);x.name="soft-ochre-cream-blossoms-in-hawkins-frame",x.userData.baseRotationY=0,W(x,-24),t.add(x);let M=new e.BufferGeometry;a.geometries.push(M);let w=[[.45,3.9,-7.2],[.36,2.7,-6.6],[.5,1.54,-6.1],[.31,.36,-5.4],[.44,-.9,-4.8],[.18,-2.5,-4.1]],y=new Float32Array((w.length-1)*2*3);for(let l=0;l<w.length-1;l+=1)y.set(w[l],l*6),y.set(w[l+1],l*6+3);M.setAttribute("position",new e.BufferAttribute(y,3));let C=Z(e,"#dfc67c",.78);a.materials.push(C);let A=new e.LineSegments(M,C);return A.name="single-gold-fracture-pressure-line-no-second-shell",A.userData.baseOpacity=.78,W(A,-18),t.add(A),t}function R(e,o){let a=new e.Group;a.name="subdued-radial-symbols-held-in-misty-depth";let t=[new e.MeshBasicMaterial({color:"#d8d0ad",transparent:!0,opacity:.2,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#b48737",transparent:!0,opacity:.16,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#243f43",transparent:!0,opacity:.18,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1})];o.materials.push(...t);for(let r=0;r<5;r+=1){let s=1.25+r*.72,i=new e.RingGeometry(s,s+.035+r*.008,128);o.geometries.push(i);let n=new e.Mesh(i,t[r%t.length]);n.name=`soft-radial-warning-halo-${r+1}`,n.position.set(-.05+(r-2)*.12,-.08-r*.13,-6.6-r*.9),n.rotation.set(.06+r*.012,(r-2)*.025,(r-2)*.04),n.scale.y=.58,n.userData.baseOpacity=t[r%t.length].opacity,n.userData.phase=r*.9,W(n,-20+r),a.add(n)}return a}function H({THREE:e,part:o,world:a,seed:t,utilities:r}){let s=new e.Group;s.name="world-environment-hawkins-xi-trump-fracture-pressure",s.userData={partId:"world-environment",role:o?.role||"world-environment",packetId:D,packetHash:P,messagePurpose:"A muted Louis Welden Hawkins atmosphere where one surrounding skybox carries central warning pressure, branch framing, pale faces, and a restrained fracture."};let i={geometries:[],materials:[],textures:[]},n=j(r,t||o?.id||"world-environment","hawkins-xi-trump-warning-environment"),d=Math.max(48,Math.min(96,Number(a?.environment?.skyboxRadius||a?.environment?.radius||90))),v=r?.createSkyboxShell?r.createSkyboxShell({radius:d,name:"single-hawkins-warning-environment-skybox-shell",geometryKind:"box",color:"#172322",userData:{partId:"world-environment",role:"world-environment",packetId:D,packetHash:P}}):$(e,d,"single-hawkins-warning-environment-skybox-shell"),u=v.object||v,c=v.mesh||u.mesh||u.children.find(f=>f?.isMesh);u.name="single-dominant-hawkins-position-space-skybox",u.userData={...u.userData,partId:"world-environment",role:"world-environment",immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,packetId:D,packetHash:P,skyboxOwnership:"only true enclosing shell in this part"},c&&(c.material&&typeof c.material.dispose=="function"&&c.material.dispose(),c.material=J(e),c.scale.setScalar(d),c.castShadow=!1,c.receiveShadow=!1,c.frustumCulled=!1,c.renderOrder=-1e3,u.material=c.material,i.materials.push(c.material)),s.add(u);let h=T(e,n,i);s.add(h);let b=R(e,i);s.add(b);function g(f={}){let p=f.captureMode?0:Number(f.elapsedSeconds??f.time??0);c?.material?.uniforms?.uTime&&(c.material.uniforms.uTime.value=p),h.rotation.y=Math.sin(p*.035)*.018;let x=h.children[0]?.material;x&&(x.opacity=.54+Math.sin(p*.11)*.035);let M=h.children[1]?.material;M&&(M.opacity=.68+Math.sin(p*.09+1.2)*.035);let w=h.children[2];w?.material&&(w.material.opacity=w.userData.baseOpacity*(.92+Math.sin(p*.12)*.06)),b.rotation.z=Math.sin(p*.04)*.018,b.children.forEach((y,C)=>{y.material.opacity=y.userData.baseOpacity*(.9+Math.sin(p*.1+y.userData.phase)*.08),y.rotation.z=(C-2)*.04+Math.sin(p*.035+C)*.012})}function z(){U(s);for(let f of i.textures)f?.dispose?.();for(let f of i.geometries)f?.dispose?.();for(let f of i.materials)f?.dispose?.()}return{object:s,update:g,dispose:z}}export{H as createImmersiveWorldPart};
