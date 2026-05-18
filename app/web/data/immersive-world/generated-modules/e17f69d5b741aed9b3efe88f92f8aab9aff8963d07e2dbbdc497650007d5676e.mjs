var k="art-direction-packet-8b972317dec7",x="8b972317dec7d6b8caf03af99e0f07cf";function C(e){let t=String(e??"gorky-union-cup-environment"),l=2166136261;for(let r=0;r<t.length;r+=1)l^=t.charCodeAt(r),l=Math.imul(l,16777619);return l>>>0}function B(e,t,l){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(t,l);let r=(C(t)^C(l))>>>0;return function(){r=r+1831565813>>>0;let s=r;return s=Math.imul(s^s>>>15,s|1),s^=s+Math.imul(s^s>>>7,s|61),((s^s>>>14)>>>0)/4294967296}}function P(e){let t=Number(e?.environment?.skyboxRadius||e?.environment?.radius||90);return Number.isFinite(t)?Math.max(56,Math.min(112,t)):90}function D(e,t,l){let r=new e.Group;r.name="gorky-single-position-space-skybox-shell";let i=2/Math.sqrt(3),s=new e.BoxGeometry(i,i,i,1,1,1),p=new e.Mesh(s,l);return p.name="gorky-single-position-space-skybox-shell-mesh",p.scale.setScalar(t),p.castShadow=!1,p.receiveShadow=!1,p.frustumCulled=!1,p.onBeforeRender=function(f,h,a){a?.position&&r.position.copy(a.position)},r.add(p),r.object=r,r.group=r,r.mesh=p,r.geometry=s,r.material=l,r}function W(e){e.userData={...e.userData,partId:"world-environment",role:"world-environment",packetId:k,packetHash:x,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,singleSurroundShell:!0},e.traverse?.(t=>{t.castShadow=!1,t.receiveShadow=!1,t.frustumCulled=!1,t.renderOrder=-1e3})}function I(e,t){let l=C(t)%997/997;return new e.ShaderMaterial({name:"gorky_union_cup_position_space_matte_canvas_skybox",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uSeed:{value:l},uCream:{value:new e.Color("#d9c49d")},uPaper:{value:new e.Color("#eadab8")},uOchre:{value:new e.Color("#b77b2a")},uBurnt:{value:new e.Color("#8b3b1c")},uSmoke:{value:new e.Color("#746b55")},uInk:{value:new e.Color("#151511")},uCharcoal:{value:new e.Color("#25231d")},uRed:{value:new e.Color("#d9361d")},uYellow:{value:new e.Color("#e0b51d")},uGreen:{value:new e.Color("#138867")},uCyan:{value:new e.Color("#33c9d2")},uBlue:{value:new e.Color("#153c92")},uPurple:{value:new e.Color("#65305f")}},vertexShader:`
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uSeed;
      uniform vec3 uCream;
      uniform vec3 uPaper;
      uniform vec3 uOchre;
      uniform vec3 uBurnt;
      uniform vec3 uSmoke;
      uniform vec3 uInk;
      uniform vec3 uCharcoal;
      uniform vec3 uRed;
      uniform vec3 uYellow;
      uniform vec3 uGreen;
      uniform vec3 uCyan;
      uniform vec3 uBlue;
      uniform vec3 uPurple;

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
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amp * noise3(p);
          p = p * 2.08 + vec3(5.7, 3.1, 8.3);
          amp *= 0.5;
        }
        return value;
      }

      float stroke(float value, float center, float width, float feather) {
        return 1.0 - smoothstep(width, width + feather, abs(value - center));
      }

      float ellipseStroke(vec2 p, vec2 c, vec2 r, float width, float feather) {
        vec2 q = (p - c) / r;
        return 1.0 - smoothstep(width, width + feather, abs(length(q) - 1.0));
      }

      float ellipseFill(vec2 p, vec2 c, vec2 r, float feather) {
        vec2 q = (p - c) / r;
        return 1.0 - smoothstep(1.0, 1.0 + feather, length(q));
      }

      float lineSegment(vec2 p, vec2 a, vec2 b, float width, float feather) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return 1.0 - smoothstep(width, width + feather, length(pa - ba * h));
      }

      float bead(vec2 p, vec2 c, float radius, float feather) {
        return 1.0 - smoothstep(radius, radius + feather, length(p - c));
      }

      float hookCurve(vec2 p, vec2 c, float sx, float sy, float phase) {
        vec2 q = p - c;
        float curve = q.y - sin(q.x * sx + phase) * sy;
        return stroke(curve, 0.0, 0.016, 0.018) * smoothstep(0.72, 0.06, abs(q.x));
      }

      void main() {
        vec3 dir = normalize(vPosition);
        float x = dir.x;
        float y = dir.y;
        float z = dir.z;
        float t = uTime * 0.025;
        float front = smoothstep(0.04, 0.88, -z);
        float back = smoothstep(0.08, 0.9, z);
        float rightSide = smoothstep(0.14, 0.88, x);
        float leftSide = smoothstep(0.14, 0.88, -x);
        float poleFade = 1.0 - smoothstep(0.78, 0.97, abs(y));
        float poleBlend = smoothstep(0.84, 0.985, abs(y));

        vec3 domain = vec3(x * 1.18 + uSeed * 1.7, y * 1.06 - t, z * 1.22 + uSeed * 2.9);
        float wash = fbm3(domain * 2.1);
        float paper = fbm3(domain * 9.2 + vec3(2.0, 0.0, 4.0));
        float grit = fbm3(domain * 37.0 + vec3(7.0, 3.0, uSeed));

        vec3 color = mix(uCream, uPaper, 0.45 + 0.24 * wash);
        color = mix(color, uSmoke, smoothstep(0.62, 1.0, abs(x) + abs(z) * 0.22) * 0.18);
        color = mix(color, uOchre, smoothstep(-0.88, -0.08, y + wash * 0.12) * 0.14);
        color = mix(color, uBurnt, smoothstep(-0.92, -0.38, y + paper * 0.16) * 0.1);

        vec2 pF = vec2(x * 1.23, y);
        vec2 pB = vec2(-x * 1.13, y);
        vec2 pL = vec2(z * 1.15, y);
        vec2 pR = vec2(-z * 1.15, y);
        vec2 pTop = vec2(x, z);

        float orangeWash = 0.0;
        orangeWash += ellipseFill(pF, vec2(-0.42, -0.18), vec2(0.34, 0.24), 0.28) * front;
        orangeWash += ellipseFill(pF, vec2(0.48, 0.28), vec2(0.26, 0.2), 0.28) * front;
        orangeWash += ellipseFill(pL, vec2(0.14, -0.05), vec2(0.36, 0.28), 0.28) * leftSide;
        orangeWash += ellipseFill(pB, vec2(-0.28, 0.14), vec2(0.52, 0.28), 0.3) * back;
        color = mix(color, uOchre, clamp(orangeWash * 0.34, 0.0, 0.44));

        float smokySmear = smoothstep(0.52, 0.84, fbm3(domain * 4.4 + vec3(0.0, 4.0, 1.0))) * poleFade;
        smokySmear *= smoothstep(-0.75, 0.42, y) * (0.34 + 0.28 * front + 0.2 * rightSide);
        color = mix(color, uSmoke, smokySmear * 0.18);

        float blackMass = 0.0;
        blackMass += ellipseFill(pF, vec2(-0.62, -0.46), vec2(0.44, 0.11), 0.16) * front;
        blackMass += ellipseFill(pF, vec2(0.58, -0.04), vec2(0.14, 0.32), 0.14) * front;
        blackMass += ellipseFill(pR, vec2(-0.18, 0.14), vec2(0.13, 0.42), 0.14) * rightSide;
        blackMass += ellipseFill(pB, vec2(0.48, -0.34), vec2(0.36, 0.14), 0.2) * back;
        blackMass *= 0.74 + 0.28 * paper;
        color = mix(color, uInk, clamp(blackMass, 0.0, 0.86));

        float contour = 0.0;
        contour += ellipseStroke(pF, vec2(-0.48, -0.16), vec2(0.34, 0.25), 0.032, 0.018) * front;
        contour += ellipseStroke(pF, vec2(0.06, -0.2), vec2(0.28, 0.16), 0.022, 0.015) * front;
        contour += ellipseStroke(pF, vec2(0.45, 0.28), vec2(0.22, 0.24), 0.024, 0.016) * front;
        contour += ellipseStroke(pR, vec2(-0.2, 0.12), vec2(0.24, 0.38), 0.029, 0.02) * rightSide;
        contour += ellipseStroke(pL, vec2(0.24, 0.02), vec2(0.36, 0.22), 0.024, 0.018) * leftSide;
        contour += ellipseStroke(pB, vec2(-0.2, -0.18), vec2(0.38, 0.2), 0.024, 0.018) * back;
        contour += hookCurve(pF, vec2(-0.08, 0.34), 7.2, 0.13, 0.9) * front;
        contour += hookCurve(pF, vec2(0.55, -0.3), 6.4, 0.11, -0.4) * front;
        contour += hookCurve(pL, vec2(-0.1, 0.42), 6.0, 0.12, 1.7) * leftSide;
        contour += lineSegment(pF, vec2(-0.88, -0.62), vec2(0.78, -0.36), 0.012, 0.012) * front;
        contour += lineSegment(pF, vec2(-0.72, 0.06), vec2(0.38, 0.22), 0.011, 0.012) * front;
        contour += lineSegment(pR, vec2(-0.42, -0.48), vec2(0.52, 0.58), 0.012, 0.012) * rightSide;
        contour *= poleFade;
        color = mix(color, uInk, clamp(contour, 0.0, 0.92));

        float beads = 0.0;
        for (int i = 0; i < 10; i++) {
          float fi = float(i);
          vec2 c = vec2(-0.26 + fi * 0.07, 0.18 + sin(fi * 0.7) * 0.055);
          beads += bead(pF, c, 0.012 + mod(fi, 3.0) * 0.003, 0.012) * front;
        }
        for (int i = 0; i < 8; i++) {
          float fi = float(i);
          vec2 c = vec2(-0.44 + fi * 0.09, -0.52 + sin(fi * 1.1) * 0.035);
          beads += bead(pB, c, 0.013, 0.012) * back;
        }
        color = mix(color, uInk, clamp(beads * poleFade, 0.0, 0.95));

        float redAccent = 0.0;
        redAccent += ellipseFill(pF, vec2(-0.36, -0.5), vec2(0.08, 0.18), 0.08) * front;
        redAccent += lineSegment(pF, vec2(0.72, -0.42), vec2(0.8, 0.32), 0.018, 0.016) * front;
        redAccent += ellipseFill(pR, vec2(0.08, 0.46), vec2(0.12, 0.16), 0.08) * rightSide;
        color = mix(color, uRed, clamp(redAccent * 0.88, 0.0, 0.92));

        float yellowAccent = lineSegment(pF, vec2(-0.5, -0.38), vec2(-0.45, -0.08), 0.018, 0.015) * front;
        yellowAccent += lineSegment(pR, vec2(0.12, -0.5), vec2(0.18, -0.12), 0.015, 0.015) * rightSide;
        color = mix(color, uYellow, clamp(yellowAccent * 0.82, 0.0, 0.82));

        float coolAccent = 0.0;
        coolAccent += lineSegment(pF, vec2(0.22, -0.4), vec2(0.42, -0.34), 0.018, 0.02) * front;
        coolAccent += lineSegment(pF, vec2(0.52, -0.05), vec2(0.62, 0.16), 0.016, 0.018) * front;
        coolAccent += lineSegment(pR, vec2(-0.2, -0.14), vec2(-0.08, 0.2), 0.016, 0.018) * rightSide;
        color = mix(color, uCyan, clamp(coolAccent * 0.64, 0.0, 0.58));

        float greenAccent = ellipseFill(pF, vec2(0.18, -0.16), vec2(0.12, 0.06), 0.08) * front;
        greenAccent += lineSegment(pR, vec2(0.02, -0.3), vec2(0.2, 0.28), 0.015, 0.018) * rightSide;
        color = mix(color, uGreen, clamp(greenAccent * 0.5, 0.0, 0.48));

        float blueAccent = lineSegment(pF, vec2(-0.08, -0.34), vec2(0.16, -0.27), 0.014, 0.018) * front;
        blueAccent += lineSegment(pB, vec2(0.32, -0.44), vec2(0.58, -0.4), 0.016, 0.018) * back;
        color = mix(color, uBlue, clamp(blueAccent * 0.62, 0.0, 0.56));

        float purpleAccent = ellipseFill(pF, vec2(0.28, -0.64), vec2(0.16, 0.07), 0.08) * front;
        color = mix(color, uPurple, clamp(purpleAccent * 0.48, 0.0, 0.45));

        float topGlyph = ellipseStroke(pTop, vec2(-0.18, -0.1), vec2(0.42, 0.2), 0.03, 0.025);
        color = mix(color, uInk, topGlyph * smoothstep(0.68, 0.92, y) * 0.18);

        float hatching = pow(abs(sin((x * 34.0 + y * 47.0 - z * 19.0 + paper) * 3.14159265)), 28.0);
        hatching *= smoothstep(0.55, 0.88, fbm3(domain * 5.0 + vec3(0.0, 2.0, 7.0))) * poleFade;
        color = mix(color, uCharcoal, hatching * 0.13);

        float weaveA = sin((x + z * 0.42) * 190.0 + paper * 4.0);
        float weaveB = sin(y * 210.0 + wash * 3.0);
        color += weaveA * weaveB * 0.007 * (0.4 + 0.6 * poleFade);
        color += (paper - 0.5) * 0.05 + (grit - 0.5) * 0.026 * poleFade;

        float edgeSmoke = smoothstep(0.66, 1.02, abs(x) + abs(z) * 0.24) * 0.18;
        color = mix(color, uCharcoal, edgeSmoke);
        color *= 0.94 + 0.15 * front + 0.04 * rightSide;

        vec3 topWash = mix(uCream, uPaper, 0.55 + wash * 0.16);
        vec3 bottomWash = mix(uOchre, uCharcoal, 0.26 + wash * 0.22);
        vec3 poleWash = mix(bottomWash, topWash, smoothstep(-0.2, 0.86, y));
        color = mix(color, poleWash, poleBlend);

        color = pow(max(color, vec3(0.0)), vec3(0.92));
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    `})}function z(e){let r=new Uint8Array(9216);for(let s=0;s<48;s+=1)for(let p=0;p<48;p+=1){let u=p-23.5,f=s-23.5,h=Math.sqrt(u*u+f*f)/23.5,a=Math.max(0,Math.min(1,(1-h)/.28)),o=a*a*(3-2*a),n=(s*48+p)*4;r[n]=255,r[n+1]=255,r[n+2]=255,r[n+3]=Math.round(o*255)}let i=new e.DataTexture(r,48,48,e.RGBAFormat);return i.needsUpdate=!0,i.magFilter=e.LinearFilter,i.minFilter=e.LinearFilter,i.wrapS=e.ClampToEdgeWrapping,i.wrapT=e.ClampToEdgeWrapping,i.generateMipmaps=!1,e.SRGBColorSpace&&(i.colorSpace=e.SRGBColorSpace),i}function G(e,t,l){let r=new e.Group;r.name="mid-depth-gorky-black-contour-pressure-field";let i=[new e.LineBasicMaterial({color:"#151511",transparent:!0,opacity:.76,depthWrite:!1,depthTest:!0,toneMapped:!1}),new e.LineBasicMaterial({color:"#332a21",transparent:!0,opacity:.46,depthWrite:!1,depthTest:!0,toneMapped:!1}),new e.LineBasicMaterial({color:"#b03a1b",transparent:!0,opacity:.52,depthWrite:!1,depthTest:!0,toneMapped:!1}),new e.LineBasicMaterial({color:"#138867",transparent:!0,opacity:.42,depthWrite:!1,depthTest:!0,toneMapped:!1})];l.materials.push(...i);for(let s=0;s<18;s+=1){let p=[],u=t()*Math.PI*2,f=6.2+t()*9.4,h=-2.8+t()*6.2,a=1.6+t()*4.2,o=.5+t()*1.6;for(let g=0;g<46;g+=1){let v=g/45,S=Math.sin(v*Math.PI*(1.5+t()*.08)+s*.7),y=u+(v-.5)*(.42+t()*.38),M=(v-.5)*a,F=Math.sin(u)*f+Math.cos(y)*M,m=h+Math.sin(v*Math.PI*2+s)*o+S*.38,d=Math.cos(u)*f-2.6+Math.sin(y)*M;p.push(new e.Vector3(F,m,d))}let n=new e.BufferGeometry().setFromPoints(p);l.geometries.push(n);let c=new e.Line(n,i[s%i.length]);c.name=`wiry-gorky-spatial-contour-${String(s+1).padStart(2,"0")}`,c.frustumCulled=!1,c.castShadow=!1,c.receiveShadow=!1,c.renderOrder=-26+s%5,c.userData.phase=t()*Math.PI*2,c.userData.baseY=0,r.add(c)}return r}function O(e,t,l,r){let s=new Float32Array(570),p=new Float32Array(570),u=["#151511","#151511","#d9361d","#138867","#33c9d2","#e0b51d"].map(o=>new e.Color(o));for(let o=0;o<190;o+=1){let n=Math.floor(o/24),c=o%24/23,g=n*.78+t()*.16,v=5.4+n%5*2.2+t()*1.1,S=(c-.5)*(1.5+t()*.4);s[o*3]=Math.sin(g+S)*v,s[o*3+1]=-2.4+n%6*.9+Math.sin(c*Math.PI*2+n)*.22,s[o*3+2]=Math.cos(g+S)*v-2.8;let y=u[(o+n)%u.length];p[o*3]=y.r,p[o*3+1]=y.g,p[o*3+2]=y.b}let f=new e.BufferGeometry;f.setAttribute("position",new e.BufferAttribute(s,3)),f.setAttribute("color",new e.BufferAttribute(p,3));let h=new e.PointsMaterial({map:l,alphaMap:l,size:.22,transparent:!0,opacity:.78,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1,alphaTest:.02});r.geometries.push(f),r.materials.push(h);let a=new e.Points(f,h);return a.name="beaded-dots-following-gorky-loop-paths",a.frustumCulled=!1,a.renderOrder=-18,a.userData.baseRotationY=0,a}function _(e,t,l){let r=new e.Group;r.name="ordinary-depth-biomorphic-lobes-and-radial-symbols";let i=new e.CircleGeometry(1,56),s=new e.RingGeometry(.72,.82,80),p=new e.PlaneGeometry(1,1,1,1);l.geometries.push(i,s,p);let u=[new e.MeshBasicMaterial({color:"#151511",transparent:!0,opacity:.7,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#b77b2a",transparent:!0,opacity:.38,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#d9361d",transparent:!0,opacity:.5,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#138867",transparent:!0,opacity:.44,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#153c92",transparent:!0,opacity:.46,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#65305f",transparent:!0,opacity:.44,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1})],f=new e.MeshBasicMaterial({color:"#151511",transparent:!0,opacity:.58,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),h=new e.MeshBasicMaterial({color:"#e0b51d",transparent:!0,opacity:.62,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});l.materials.push(...u,f,h);for(let a=0;a<14;a+=1){let o=t()*Math.PI*2,n=5.8+t()*8.8,c=new e.Mesh(i,u[a%u.length]);c.name=`floating-gorky-biomorphic-lobe-${String(a+1).padStart(2,"0")}`,c.position.set(Math.sin(o)*n,-2.4+t()*5.8,Math.cos(o)*n-2.4),c.rotation.set((t()-.5)*.28,o+Math.PI,(t()-.5)*1.4),c.scale.set(.6+t()*1.8,.18+t()*.8,1),c.userData.baseY=c.position.y,c.userData.phase=t()*Math.PI*2,c.userData.float=.018+t()*.035,c.castShadow=!1,c.receiveShadow=!1,c.frustumCulled=!1,c.renderOrder=-12+a%4,r.add(c)}for(let a=0;a<5;a+=1){let o=-.9+a*.45,n=new e.Mesh(s,f);n.name=`low-fourth-cup-radial-symbol-ring-${a+1}`,n.position.set((a-2)*1.6,-.95-a*.14,-7.4-a*1.15),n.rotation.set(.05,o*.08,(t()-.5)*.2),n.scale.setScalar(1.3+a*.42),n.scale.y*=.62,n.userData.phase=t()*Math.PI*2,n.castShadow=!1,n.receiveShadow=!1,n.frustumCulled=!1,n.renderOrder=-7+a,r.add(n)}for(let a=0;a<12;a+=1){let o=new e.Mesh(p,a%3===0?h:u[(a+2)%u.length]),n=t()*Math.PI*2,c=4.6+t()*7.4;o.name=`small-angular-gorky-bar-accent-${String(a+1).padStart(2,"0")}`,o.position.set(Math.sin(n)*c,-2.1+t()*5.2,Math.cos(n)*c-2.2),o.rotation.set((t()-.5)*.24,n+Math.PI,(t()-.5)*1.1),o.scale.set(.12+t()*.2,.7+t()*1.8,1),o.userData.baseY=o.position.y,o.userData.phase=t()*Math.PI*2,o.userData.float=.012+t()*.026,o.castShadow=!1,o.receiveShadow=!1,o.frustumCulled=!1,o.renderOrder=2+a%4,r.add(o)}return r}function L(e,t){t.traverse?.(l=>{l.geometry&&typeof l.geometry.dispose=="function"&&l.geometry.dispose();let r=Array.isArray(l.material)?l.material:[l.material].filter(Boolean);for(let i of r)i&&typeof i.dispose=="function"&&i.dispose()});for(let l of e.textures)l&&typeof l.dispose=="function"&&l.dispose()}function q({THREE:e,part:t,world:l,seed:r,camera:i,utilities:s}={}){let p=r||t?.id||"world-environment",u=B(s,p,"gorky-world-environment"),f=P(l),h=I(e,p),a=new e.Group;a.name="world-environment-gorky-union-cup-flow-pressure",a.userData={partId:"world-environment",role:t?.role||"world-environment",packetId:k,packetHash:x,messagePurpose:"Surrounding Arshile Gorky matte-canvas atmosphere for Union fourth cup pressure and Anderlecht hunger."};let o;if(s&&typeof s.createSkyboxShell=="function"){o=s.createSkyboxShell({radius:f,name:"gorky-single-position-space-skybox-shell",geometryKind:"box",color:"#d9c49d",opacity:1,cameraPinned:!0,userData:{partId:"world-environment",role:"world-environment",packetId:k,packetHash:x}});let m=o.object||o,d=o.mesh||m.mesh||m.children?.find(w=>w?.isMesh);d&&(d.material&&typeof d.material.dispose=="function"&&d.material.dispose(),d.name="gorky-matte-canvas-position-space-skybox-mesh",d.material=h,d.castShadow=!1,d.receiveShadow=!1,d.frustumCulled=!1,m.mesh=d,m.material=h)}else o=D(e,f,h);let n=o.object||o;n.name="gorky-single-position-space-skybox-shell",n.material=h,W(n),a.add(n);let c={geometries:[],materials:[h],textures:[]},g=z(e);c.textures.push(g);let v=G(e,u,c),S=O(e,u,g,c),y=_(e,u,c);a.add(v,S,y);function M(m={}){let d=m.captureMode?0:Number(m.elapsedSeconds??m.time??0),w=Number.isFinite(d)?d:0;h.uniforms.uTime.value=w;for(let b of v.children)b.position.y=Math.sin(w*.045+b.userData.phase)*.025;S.rotation.y=Math.sin(w*.03)*.024;for(let b of y.children)b.userData&&Number.isFinite(b.userData.baseY)&&(b.position.y=b.userData.baseY+Math.sin(w*.07+b.userData.phase)*b.userData.float);let A=m.camera||i;!s?.createSkyboxShell&&A?.position&&n.position.copy(A.position)}function F(){L(c,a)}return M({captureMode:!0,elapsedSeconds:0,camera:i}),{object:a,update:M,dispose:F,userData:{partId:"world-environment",packetId:k,packetHash:x,ownsSingleSkyboxShell:!0,ordinarySupportGeometryIsNotAShell:!0}}}export{q as createImmersiveWorldPart};
