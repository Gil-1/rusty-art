var M="art-direction-packet-b49d9581c92b",C="b49d9581c92bd6489f267e8e9ecd7837";function k(e){let r=String(e??"larry-zox-gaza-protest-world-environment"),a=2166136261;for(let t=0;t<r.length;t+=1)a^=r.charCodeAt(t),a=Math.imul(a,16777619);return a>>>0}function z(e){let r=Number(e?.environment?.skyboxRadius||e?.environment?.radius||92);return Number.isFinite(r)?Math.max(58,Math.min(128,r)):92}function F(e,r,a){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(r,a);let t=(k(r)^k(a))>>>0;return function(){t=t+1831565813>>>0;let o=t;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296}}function P(e,r,a){let t=new e.Group;t.name="single-zox-position-space-fracture-pressure-skybox",t.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",role:"world-environment",packetId:M,packetHash:C,environmentGeometryKind:"box",environmentRadius:r,singleShellReview:"one authored enclosing skybox shell"};let n=2/Math.sqrt(3),o=new e.BoxGeometry(n,n,n,1,1,1),c=new e.Mesh(o,a);return c.name="zox-position-space-hard-edge-environment-mesh",c.scale.setScalar(r),c.castShadow=!1,c.receiveShadow=!1,c.frustumCulled=!1,c.renderOrder=-1e3,c.onBeforeRender=function(u,i,l){l?.position&&(t.position.copy(l.position),t.updateMatrixWorld(!0))},t.renderOrder=-1e3,t.add(c),t.mesh=c,t.object=t,t.group=t,t.material=a,t.geometry=o,t.dispose=function(){o.dispose(),a.dispose()},t}function B(e,r,a,t,n){r.name="single-zox-position-space-fracture-pressure-skybox",r.userData={...r.userData,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",role:"world-environment",packetId:M,packetHash:C,environmentGeometryKind:"box",environmentRadius:t,singleShellReview:"one authored enclosing skybox shell"},r.renderOrder=-1e3,a&&(a.material&&a.material!==n&&typeof a.material.dispose=="function"&&a.material.dispose(),a.name="zox-position-space-hard-edge-environment-mesh",a.material=n,a.scale.setScalar(t),a.castShadow=!1,a.receiveShadow=!1,a.frustumCulled=!1,a.renderOrder=-1e3),r.traverse?.(o=>{o.castShadow=!1,o.receiveShadow=!1,o.frustumCulled=!1,o.renderOrder=-1e3;let c=Array.isArray(o.material)?o.material:[o.material].filter(Boolean);for(let s of c)s.side=e.BackSide,s.depthWrite=!1,s.depthTest=!0,s.fog=!1,s.toneMapped=!1,s.needsUpdate=!0})}function A(e,r){let a=k(r)%8191/8191;return new e.ShaderMaterial({name:"zox_gaza_protest_position_space_matte_hard_edge_skybox",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uSeed:{value:a},uCream:{value:new e.Color("#ead7b8")},uPaper:{value:new e.Color("#f3dfbf")},uOrange:{value:new e.Color("#f05a24")},uCoral:{value:new e.Color("#ef785c")},uYellow:{value:new e.Color("#f2bd18")},uRed:{value:new e.Color("#b72020")},uMaroon:{value:new e.Color("#351322")},uTeal:{value:new e.Color("#2f7f72")},uMint:{value:new e.Color("#92b4a1")},uGray:{value:new e.Color("#747b72")},uMauve:{value:new e.Color("#946075")},uBrown:{value:new e.Color("#7b452e")},uInk:{value:new e.Color("#111313")},uBlue:{value:new e.Color("#0b6fa6")}},vertexShader:`
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
      uniform vec3 uOrange;
      uniform vec3 uCoral;
      uniform vec3 uYellow;
      uniform vec3 uRed;
      uniform vec3 uMaroon;
      uniform vec3 uTeal;
      uniform vec3 uMint;
      uniform vec3 uGray;
      uniform vec3 uMauve;
      uniform vec3 uBrown;
      uniform vec3 uInk;
      uniform vec3 uBlue;

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
          p = p * 2.07 + vec3(5.8, 2.3, 7.1);
          amp *= 0.5;
        }
        return value;
      }

      float rect(vec2 p, vec2 center, vec2 halfSize, float feather) {
        vec2 d = abs(p - center) - halfSize;
        float outside = length(max(d, 0.0));
        float inside = min(max(d.x, d.y), 0.0);
        return 1.0 - smoothstep(0.0, feather, outside + inside);
      }

      float hardRect(vec2 p, vec2 center, vec2 halfSize) {
        vec2 d = abs(p - center);
        return step(d.x, halfSize.x) * step(d.y, halfSize.y);
      }

      float lineSegment(vec2 p, vec2 a, vec2 b, float width, float feather) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
        return 1.0 - smoothstep(width, width + feather, length(pa - ba * h));
      }

      float wedge(vec2 p, vec2 a, vec2 b, vec2 c, float feather) {
        vec2 ab = b - a;
        vec2 bc = c - b;
        vec2 ca = a - c;
        float s1 = ab.x * (p.y - a.y) - ab.y * (p.x - a.x);
        float s2 = bc.x * (p.y - b.y) - bc.y * (p.x - b.x);
        float s3 = ca.x * (p.y - c.y) - ca.y * (p.x - c.x);
        float insideA = min(min(s1, s2), s3);
        float insideB = min(min(-s1, -s2), -s3);
        return smoothstep(-feather, feather, max(insideA, insideB));
      }

      float arcBand(vec2 p, vec2 center, float radius, float width, float feather) {
        float d = abs(length(p - center) - radius);
        return 1.0 - smoothstep(width, width + feather, d);
      }

      void main() {
        vec3 dir = normalize(vPosition);
        float x = dir.x;
        float y = dir.y;
        float z = dir.z;
        float captureTime = uTime * 0.035;
        float front = smoothstep(0.02, 0.74, -z);
        float back = smoothstep(0.02, 0.74, z);
        float leftSide = smoothstep(0.10, 0.78, -x);
        float rightSide = smoothstep(0.10, 0.78, x);
        float poleFade = 1.0 - smoothstep(0.78, 0.97, abs(y));
        float poleBlend = smoothstep(0.84, 0.985, abs(y));

        vec3 domain = vec3(x * 1.22 + uSeed * 2.1, y * 1.08 - captureTime, z * 1.17 + uSeed * 3.7);
        float wash = fbm3(domain * 2.4);
        float paper = fbm3(domain * 10.0 + vec3(2.0, 0.0, 6.0));
        float scumble = fbm3(domain * 34.0 + vec3(7.0, uSeed, 3.0));

        vec3 verticalWash = mix(uPaper, uCream, smoothstep(-0.72, 0.76, y));
        verticalWash = mix(verticalWash, uOrange, smoothstep(-0.96, -0.28, y) * 0.16);
        verticalWash = mix(verticalWash, uGray, smoothstep(0.35, 0.96, y) * 0.10);
        vec3 color = verticalWash;
        color = mix(color, uPaper, 0.12 * wash);

        vec2 pFront = vec2(x * 1.18, y);
        vec2 pBack = vec2(-x * 1.10, y);
        vec2 pLeft = vec2(z * 1.12, y);
        vec2 pRight = vec2(-z * 1.12, y);
        vec2 pTop = vec2(x, z);

        float leftOrangeMass = 0.0;
        leftOrangeMass += hardRect(pFront, vec2(-0.92, -0.08), vec2(0.23, 0.96)) * front;
        leftOrangeMass += wedge(pFront, vec2(-1.06, 0.78), vec2(-0.30, -0.62), vec2(-1.08, -0.62), 0.018) * front;
        leftOrangeMass += wedge(pLeft, vec2(-0.98, 0.48), vec2(-0.08, -0.78), vec2(-1.04, -0.66), 0.018) * leftSide;
        leftOrangeMass += hardRect(pBack, vec2(-0.72, 0.0), vec2(0.25, 0.94)) * back;
        color = mix(color, uCoral, clamp(leftOrangeMass, 0.0, 0.92));

        float yellowThrust = 0.0;
        yellowThrust += hardRect(pFront, vec2(-0.53, 0.10), vec2(0.12, 0.90)) * front;
        yellowThrust += wedge(pFront, vec2(-0.67, 0.92), vec2(-0.26, -0.08), vec2(-0.49, -0.72), 0.015) * front;
        yellowThrust += hardRect(pRight, vec2(0.52, 0.20), vec2(0.15, 0.74)) * rightSide;
        color = mix(color, uYellow, clamp(yellowThrust, 0.0, 0.92));

        float redPressure = 0.0;
        redPressure += hardRect(pFront, vec2(-0.36, -0.50), vec2(0.36, 0.18)) * front;
        redPressure += hardRect(pRight, vec2(-0.72, -0.02), vec2(0.32, 0.92)) * rightSide;
        redPressure += wedge(pRight, vec2(-0.36, 0.64), vec2(0.56, -0.74), vec2(-0.22, -0.76), 0.017) * rightSide;
        redPressure += hardRect(pBack, vec2(0.58, -0.34), vec2(0.30, 0.26)) * back;
        color = mix(color, uOrange, clamp(redPressure, 0.0, 0.9));

        float coolCounter = 0.0;
        coolCounter += hardRect(pFront, vec2(-0.18, 0.28), vec2(0.13, 0.66)) * front;
        coolCounter += wedge(pFront, vec2(0.34, -0.58), vec2(0.70, 0.38), vec2(0.22, 0.18), 0.017) * front;
        coolCounter += hardRect(pRight, vec2(0.08, 0.08), vec2(0.22, 0.80)) * rightSide;
        coolCounter += hardRect(pLeft, vec2(0.36, 0.18), vec2(0.18, 0.76)) * leftSide;
        color = mix(color, mix(uTeal, uMint, 0.34), clamp(coolCounter, 0.0, 0.84));

        float grayMauveMass = 0.0;
        grayMauveMass += hardRect(pFront, vec2(0.56, -0.10), vec2(0.23, 0.78)) * front;
        grayMauveMass += hardRect(pRight, vec2(0.28, 0.24), vec2(0.25, 0.86)) * rightSide;
        grayMauveMass += wedge(pBack, vec2(-0.10, 0.54), vec2(0.58, -0.72), vec2(-0.48, -0.70), 0.018) * back;
        color = mix(color, mix(uGray, uMauve, 0.42), clamp(grayMauveMass, 0.0, 0.82));

        float blackAnchors = 0.0;
        blackAnchors += hardRect(pFront, vec2(-0.76, -0.42), vec2(0.08, 0.46)) * front;
        blackAnchors += hardRect(pFront, vec2(0.77, 0.04), vec2(0.10, 0.92)) * front;
        blackAnchors += wedge(pFront, vec2(0.16, 0.86), vec2(0.02, 0.02), vec2(0.28, 0.16), 0.012) * front;
        blackAnchors += wedge(pFront, vec2(0.22, -0.52), vec2(0.58, -0.58), vec2(0.34, -0.16), 0.012) * front;
        blackAnchors += hardRect(pRight, vec2(-0.06, 0.22), vec2(0.08, 0.82)) * rightSide;
        blackAnchors += hardRect(pLeft, vec2(-0.56, 0.02), vec2(0.07, 0.88)) * leftSide;
        blackAnchors += hardRect(pBack, vec2(0.78, 0.05), vec2(0.12, 0.86)) * back;
        color = mix(color, uInk, clamp(blackAnchors, 0.0, 0.95));

        float centralVoid = 0.0;
        centralVoid += wedge(pFront, vec2(-0.24, 0.92), vec2(0.18, -0.60), vec2(0.62, 0.92), 0.035) * front;
        centralVoid += wedge(pBack, vec2(-0.40, 0.78), vec2(-0.02, -0.68), vec2(0.42, 0.68), 0.04) * back * 0.65;
        color = mix(color, uPaper, clamp(centralVoid, 0.0, 0.86));

        float seam = 0.0;
        seam += lineSegment(pFront, vec2(-1.02, 0.84), vec2(-0.16, -0.70), 0.009, 0.010) * front;
        seam += lineSegment(pFront, vec2(-0.20, -0.70), vec2(0.64, 0.86), 0.010, 0.011) * front;
        seam += lineSegment(pFront, vec2(-0.92, -0.34), vec2(0.90, -0.34), 0.007, 0.009) * front;
        seam += lineSegment(pFront, vec2(-0.48, 0.92), vec2(-0.48, -0.82), 0.005, 0.007) * front;
        seam += lineSegment(pFront, vec2(0.72, 0.92), vec2(0.72, -0.82), 0.007, 0.009) * front;
        seam += lineSegment(pRight, vec2(-0.84, 0.74), vec2(0.72, -0.54), 0.008, 0.010) * rightSide;
        seam += lineSegment(pLeft, vec2(-0.76, -0.56), vec2(0.48, 0.62), 0.007, 0.010) * leftSide;
        seam += lineSegment(pBack, vec2(-0.82, -0.36), vec2(0.82, 0.32), 0.007, 0.010) * back;
        seam *= poleFade;
        color = mix(color, uInk, clamp(seam * 0.92, 0.0, 0.92));

        float radial = 0.0;
        radial += arcBand(pFront, vec2(0.15, -0.36), 0.38, 0.016, 0.018) * front;
        radial += arcBand(pRight, vec2(-0.40, -0.12), 0.46, 0.016, 0.018) * rightSide;
        radial += arcBand(pTop, vec2(-0.16, -0.22), 0.54, 0.012, 0.020) * (1.0 - poleFade) * 0.36;
        color = mix(color, uBlue, clamp(radial * poleFade * 0.60, 0.0, 0.48));

        float verticalPulse = 0.0;
        verticalPulse += lineSegment(pFront, vec2(-0.06, -0.92), vec2(-0.04, 0.90), 0.006, 0.010) * front;
        verticalPulse += lineSegment(pRight, vec2(0.64, -0.86), vec2(0.62, 0.88), 0.005, 0.010) * rightSide;
        verticalPulse += lineSegment(pLeft, vec2(0.14, -0.86), vec2(0.12, 0.86), 0.005, 0.010) * leftSide;
        float pulse = 0.82 + 0.10 * sin(uTime * 0.45 + uSeed * 6.2831);
        color = mix(color, uInk, clamp(verticalPulse * pulse * poleFade, 0.0, 0.72));

        float crowdPressure = smoothstep(0.30, 0.86, fbm3(domain * 7.5 + vec3(0.0, 9.0, 2.0))) * smoothstep(-0.92, -0.10, -abs(y + 0.45));
        color = mix(color, uMaroon, crowdPressure * 0.16 * poleFade);

        float stain = (paper - 0.5) * 0.12 + (scumble - 0.5) * 0.075;
        float dragged = smoothstep(0.62, 0.96, noise3(vec3(x * 42.0 + uSeed, y * 7.0, z * 42.0))) * 0.055;
        color += stain + dragged;

        vec3 poleColor = mix(uPaper, mix(uCream, uGray, 0.14), smoothstep(-1.0, 1.0, y));
        color = mix(color, poleColor, poleBlend);
        color = clamp(color, 0.0, 1.0);
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function I(e){let t=new Uint8Array(9216);for(let o=0;o<48;o+=1)for(let c=0;c<48;c+=1){let s=(c-23.5)/23.5,u=(o-23.5)/23.5,i=Math.sqrt(s*s+u*u),l=Math.max(0,Math.min(1,(1-i)/.42)),m=l*l*(3-2*l),p=(o*48+c)*4;t[p]=255,t[p+1]=255,t[p+2]=255,t[p+3]=Math.round(m*255)}let n=new e.DataTexture(t,48,48,e.RGBAFormat);return n.name="zox-soft-pigment-point-alpha",n.magFilter=e.LinearFilter,n.minFilter=e.LinearFilter,n.generateMipmaps=!1,n.wrapS=e.ClampToEdgeWrapping,n.wrapT=e.ClampToEdgeWrapping,n.needsUpdate=!0,n}function W(e,r){let t=new Float32Array(576),n=new Float32Array(576),o=[new e.Color("#111313"),new e.Color("#b72020"),new e.Color("#0b6fa6"),new e.Color("#2f7f72"),new e.Color("#7b452e")];for(let i=0;i<96;i+=1){let l=i%2===0?-1:1,m=5.8+r()*11.5,p=l*(.2+r()*.92),h=-3+r()*6.2,v=.8+r()*3.2,w=l*(.18+r()*.54),y=Math.sin(p)*m,d=Math.cos(p)*m-4.8-r()*4,S=y+w*v,g=h+(r()-.5)*1.1,b=d-.35-r()*1.2,f=i*6;t[f]=y,t[f+1]=h,t[f+2]=d,t[f+3]=S,t[f+4]=g,t[f+5]=b;let x=o[i%o.length];n[f]=x.r,n[f+1]=x.g,n[f+2]=x.b,n[f+3]=x.r,n[f+4]=x.g,n[f+5]=x.b}let c=new e.BufferGeometry;c.setAttribute("position",new e.BufferAttribute(t,3)),c.setAttribute("color",new e.BufferAttribute(n,3));let s=new e.LineBasicMaterial({name:"zox-matte-black-color-fracture-pressure-lines",vertexColors:!0,transparent:!0,opacity:.52,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),u=new e.LineSegments(c,s);return u.name="non-enclosing-mid-depth-hard-edge-fracture-line-field",u.frustumCulled=!1,u.renderOrder=-42,{object:u,geometry:c,material:s}}function O(e,r,a){let n=new Float32Array(780),o=new Float32Array(260*3),c=[new e.Color("#f2bd18"),new e.Color("#f05a24"),new e.Color("#b72020"),new e.Color("#2f7f72"),new e.Color("#946075"),new e.Color("#111313")];for(let l=0;l<260;l+=1){let m=r()*Math.PI*2,p=4.8+r()*12.8,h=l%5===0?.28:1;n[l*3]=Math.sin(m)*p*h,n[l*3+1]=-3.3+r()*6.7,n[l*3+2]=Math.cos(m)*p-4-r()*4.6;let v=c[l%c.length];o[l*3]=v.r,o[l*3+1]=v.g,o[l*3+2]=v.b}let s=new e.BufferGeometry;s.setAttribute("position",new e.BufferAttribute(n,3)),s.setAttribute("color",new e.BufferAttribute(o,3));let u=new e.PointsMaterial({name:"zox-soft-matte-pigment-grain",map:a,alphaMap:a,size:.32,transparent:!0,opacity:.42,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1}),i=new e.Points(s,u);return i.name="non-enclosing-soft-pigment-depth-grain",i.frustumCulled=!1,i.renderOrder=-36,{object:i,geometry:s,material:u}}function G({THREE:e,part:r,world:a,seed:t,camera:n,utilities:o}={}){let c=new e.Group;c.name="world-environment-larry-zox-gaza-protest-fracture-pressure",c.userData={partId:"world-environment",role:r?.role||"world-environment",packetId:M,packetHash:C,selectedNews:"Protest against war in Gaza draws large crowd, organizers count 12,000 people",artist:"Larry Zox",shellCountIntent:1};let s=z(a),u=A(e,t||r?.id||"world-environment"),i;if(o&&typeof o.createSkyboxShell=="function"){let d=o.createSkyboxShell({radius:s,name:"single-zox-position-space-fracture-pressure-skybox",geometryKind:"box",color:"#ead7b8",opacity:1,cameraPinned:!0,userData:{immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",role:"world-environment",packetId:M,packetHash:C}});i=d.object||d}else i=P(e,s,u);let l=i.mesh||i.children?.find(d=>d?.isMesh);B(e,i,l,s,u),c.add(i);let m=F(o,t||r?.id||"world-environment","zox-fracture-pressure-depth"),p=I(e),h=W(e,m),v=O(e,m,p);c.add(h.object),c.add(v.object);function w(d={}){let S=d.captureMode?0:Number(d.elapsedSeconds??d.time??0),g=Number.isFinite(S)?S:0;u.uniforms.uTime.value=g;let b=Number.isFinite(d.motionIntensity)?d.motionIntensity:1;h.object.rotation.y=Math.sin(g*.026)*.018*b,h.object.rotation.z=Math.sin(g*.041)*.012*b,v.object.rotation.y=Math.sin(g*.021)*.028*b,v.material.opacity=.4+Math.sin(g*.18)*.025*b,n&&i?.position&&d.camera?.position&&(i.position.copy(d.camera.position),i.updateMatrixWorld(!0))}function y(){i?.dispose?.(),u.dispose(),h.geometry.dispose(),h.material.dispose(),v.geometry.dispose(),v.material.dispose(),p.dispose()}return w({captureMode:!0,elapsedSeconds:0,camera:n}),{object:c,update:w,dispose:y}}export{G as createImmersiveWorldPart};
