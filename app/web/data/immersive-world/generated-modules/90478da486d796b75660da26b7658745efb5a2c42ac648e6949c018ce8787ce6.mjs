var d="art-direction-packet-ee8329216073",f="ee8329216073e1ff73a3dda6a05abb66";function y(e){let o=String(e??"clyfford-still-vienna-eurovision-environment"),r=2166136261;for(let a=0;a<o.length;a+=1)r^=o.charCodeAt(a),r=Math.imul(r,16777619);return r>>>0}function b(e){let o=Number(e?.environment?.skyboxRadius||e?.environment?.radius||86);return Number.isFinite(o)?Math.max(58,Math.min(110,o)):86}function x(e,o=-1e3){e.renderOrder=o,e.userData={...e.userData,partId:"world-environment",role:"world-environment",packetId:d,packetHash:f,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,singleSurroundShell:!0},e.traverse?.(r=>{r.castShadow=!1,r.receiveShadow=!1,r.frustumCulled=!1,r.renderOrder=o})}function w(e,o,r){let a=new e.Group;a.name="clyfford-still-vienna-single-skybox-shell";let i=2/Math.sqrt(3),c=new e.BoxGeometry(i,i,i,1,1,1),s=new e.Mesh(c,r);return s.name="clyfford-still-vienna-single-skybox-shell-mesh",s.scale.setScalar(o),a.add(s),a.object=a,a.group=a,a.mesh=s,a.geometry=c,a.material=r,a}function g(e,o){let r=y(o)%997/997;return new e.ShaderMaterial({name:"clyfford_still_vienna_fracture_pressure_position_space_skybox",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uSeed:{value:r},uBlack:{value:new e.Color("#090909")},uCharcoal:{value:new e.Color("#171715")},uBone:{value:new e.Color("#e6dcc1")},uAsh:{value:new e.Color("#b9b0a0")},uOchre:{value:new e.Color("#c98514")},uMustard:{value:new e.Color("#dda51d")},uBurgundy:{value:new e.Color("#5b0717")},uDarkRed:{value:new e.Color("#2a1212")},uTeal:{value:new e.Color("#1e6b70")},uBlueGreen:{value:new e.Color("#0b3f4c")}},vertexShader:`
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
      uniform vec3 uBlack;
      uniform vec3 uCharcoal;
      uniform vec3 uBone;
      uniform vec3 uAsh;
      uniform vec3 uOchre;
      uniform vec3 uMustard;
      uniform vec3 uBurgundy;
      uniform vec3 uDarkRed;
      uniform vec3 uTeal;
      uniform vec3 uBlueGreen;

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
        for (int i = 0; i < 3; i++) {
          value += amp * noise3(p);
          p = p * 2.07 + vec3(7.31, 3.17, 5.93);
          amp *= 0.5;
        }
        return value;
      }

      float band(float value, float center, float width, float feather) {
        return 1.0 - smoothstep(width, width + feather, abs(value - center));
      }

      float tornEdge(float value, float center, float roughness, vec3 domain) {
        float slow = fbm3(domain * 1.8 + vec3(uSeed * 3.7, 0.0, 1.0));
        float mid = fbm3(domain * 5.6 + vec3(2.3, uSeed * 5.1, 4.7));
        float fine = fbm3(domain * 18.0 + vec3(5.7, 2.9, uSeed * 8.0));
        return value - center + (slow - 0.5) * roughness + (mid - 0.5) * roughness * 0.44 + (fine - 0.5) * roughness * 0.14;
      }

      float radialRing(vec2 p, vec2 center, float radius, float width, float feather) {
        return 1.0 - smoothstep(width, width + feather, abs(length(p - center) - radius));
      }

      void main() {
        vec3 dir = normalize(vPosition);
        float x = dir.x;
        float y = dir.y;
        float z = dir.z;
        float front = smoothstep(0.08, 0.92, -z);
        float back = smoothstep(0.1, 0.92, z);
        float sidePressure = smoothstep(0.14, 0.9, abs(x));
        float poleFade = 1.0 - smoothstep(0.78, 0.97, abs(y));
        float poleBlend = smoothstep(0.84, 0.985, abs(y));
        float t = uTime * 0.035;

        vec3 domain = vec3(x * 1.2 + t, y * 1.08 - t * 0.7, z * 1.2 + uSeed);
        float wash = fbm3(domain * 2.25);
        float dry = fbm3(domain * 9.4 + vec3(0.0, uSeed * 2.0, 4.0));
        float grit = fbm3(domain * 36.0 + vec3(1.1, 3.7, uSeed * 12.0));

        vec3 color = mix(uCharcoal, uBlack, 0.55 + 0.32 * wash);
        color = mix(color, uDarkRed, smoothstep(-0.94, -0.28, y + wash * 0.08) * 0.46);
        color = mix(color, uAsh, smoothstep(0.18, 0.88, y) * 0.13);

        float mainBoundary = tornEdge(x + 0.18 * y - 0.20 * z, -0.18, 0.34, domain);
        float blackMass = (1.0 - smoothstep(-0.12, 0.12, mainBoundary)) * front;
        blackMass += (1.0 - smoothstep(-0.52, -0.06, y + 0.08 * x + wash * 0.22)) * smoothstep(0.05, 0.9, -x) * 0.42;
        blackMass += back * (0.42 + 0.28 * smoothstep(-0.2, 0.75, y)) * (0.58 + 0.32 * dry);
        color = mix(color, uBlack, clamp(blackMass, 0.0, 0.92));

        float boneBoundary = tornEdge(x - 0.36 * y + 0.10 * z, 0.00, 0.42, domain + vec3(3.0, 1.0, 0.0));
        float boneMass = smoothstep(-0.08, 0.2, boneBoundary) * smoothstep(-0.88, 0.02, y + dry * 0.22) * front;
        boneMass *= 1.0 - smoothstep(0.76, 0.98, y);
        color = mix(color, mix(uBone, uAsh, 0.12 + wash * 0.18), clamp(boneMass, 0.0, 0.92));

        float ochreCore = tornEdge(abs(x - 0.36 + 0.08 * z), 0.16, 0.18, domain + vec3(0.0, 7.0, 2.0));
        float ochreSlab = (1.0 - smoothstep(0.03, 0.2, ochreCore)) * smoothstep(-0.58, -0.02, y) * (1.0 - smoothstep(0.92, 1.0, y)) * front;
        float ochreFlare = band(x - y * 0.22 + z * 0.08, 0.5, 0.12, 0.13) * smoothstep(-0.5, 0.85, y) * poleFade;
        color = mix(color, mix(uOchre, uMustard, 0.45 + 0.35 * dry), clamp(ochreSlab * 0.95 + ochreFlare * 0.68, 0.0, 0.96));

        float burgundyRise = band(x + y * 0.22 - z * 0.1, 0.56, 0.11, 0.11) * smoothstep(-0.92, -0.06, y) * front;
        float lowBurgundy = smoothstep(-0.2, -0.86, y + wash * 0.18) * (0.55 + front * 0.42);
        color = mix(color, uBurgundy, clamp(lowBurgundy * 0.68 + burgundyRise * 0.86, 0.0, 0.9));

        float tealFissure = band(x + 0.18 * y + 0.04 * z, 0.08, 0.055, 0.065) * smoothstep(-0.92, -0.18, y) * front;
        float sideTeal = band(z + x * 0.16, 0.55, 0.08, 0.16) * (0.55 + sidePressure * 0.25) * poleFade;
        color = mix(color, mix(uTeal, uBlueGreen, 0.46), clamp(tealFissure * 0.82 + sideTeal * 0.32, 0.0, 0.74));

        float centralCrack = band(mainBoundary, 0.05, 0.025, 0.034) * front * poleFade;
        float splitCrack = band(x - 0.16 * y + 0.12 * z, 0.18, 0.016, 0.024) * smoothstep(-0.72, 0.88, y) * front * poleFade;
        color = mix(color, uBlack, clamp(centralCrack * 0.78 + splitCrack * 0.58, 0.0, 0.86));

        vec2 rp = vec2(x * 1.24 + z * 0.14, y + 0.24);
        float ringA = radialRing(rp, vec2(0.12, -0.1), 0.34, 0.015, 0.024) * front * poleFade;
        float ringB = radialRing(rp, vec2(0.12, -0.1), 0.55, 0.014, 0.026) * front * poleFade;
        float radialCuts = 0.0;
        radialCuts += band(rp.x + rp.y * 0.10, 0.13, 0.009, 0.016);
        radialCuts += band(rp.x - rp.y * 0.66, 0.10, 0.008, 0.016);
        radialCuts += band(rp.x + rp.y * 0.72, 0.12, 0.008, 0.016);
        float finalePressure = clamp((ringA + ringB * 0.62) * 0.32 + radialCuts * 0.06, 0.0, 0.34) * front * poleFade;
        color = mix(color, uMustard, finalePressure * 0.28);
        color = mix(color, uBlack, finalePressure * 0.08);

        float verticalFibers = pow(abs(sin((x * 23.0 + z * 17.0 + dry * 3.0) * 3.14159265)), 24.0);
        verticalFibers *= smoothstep(0.36, 0.82, fbm3(vec3(x * 3.0, y * 22.0, z * 3.0) + uSeed));
        float creamScrape = verticalFibers * (0.45 + 0.55 * smoothstep(0.45, 0.86, dry)) * poleFade;
        color = mix(color, uBone, creamScrape * (0.08 + 0.18 * front));

        float blackScrape = smoothstep(0.74, 0.95, grit) * smoothstep(-0.72, 0.95, y) * poleFade;
        color = mix(color, uBlack, blackScrape * 0.18);

        float splatter = smoothstep(0.77, 0.94, fbm3(domain * 42.0 + vec3(8.0, 1.0, 5.0))) * poleFade;
        float splatterGate = clamp(front * (0.52 + boneMass * 0.5 + ochreSlab * 0.4) + sidePressure * 0.18, 0.0, 1.0);
        color = mix(color, uBone, splatter * splatterGate * 0.16);
        color = mix(color, uBlack, splatter * blackMass * 0.19);

        float weaveA = sin((x + z * 0.42) * 185.0 + dry * 2.0);
        float weaveB = sin(y * 205.0 + wash * 4.0);
        float weave = weaveA * weaveB * 0.006 * (0.38 + 0.62 * poleFade);
        color += weave;
        color += (dry - 0.5) * 0.045 + (grit - 0.5) * 0.028 * poleFade;

        float pressureVignette = smoothstep(0.48, 1.0, abs(x) + 0.22 * abs(z)) * 0.18;
        color = mix(color, uBlack, pressureVignette * (0.45 + 0.35 * sidePressure));
        color *= 0.92 + 0.18 * front + 0.08 * boneMass + 0.09 * ochreSlab;

        vec3 topWash = mix(uCharcoal, uAsh, smoothstep(0.0, 1.0, y) * 0.28 + wash * 0.08);
        vec3 bottomWash = mix(uBurgundy, uBlack, 0.38 + wash * 0.24);
        vec3 poleWash = mix(bottomWash, topWash, smoothstep(-0.2, 0.86, y));
        color = mix(color, poleWash, poleBlend);

        color = pow(max(color, vec3(0.0)), vec3(0.94));
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    `})}function k(e){e.traverse?.(o=>{o.geometry&&typeof o.geometry.dispose=="function"&&o.geometry.dispose();let r=Array.isArray(o.material)?o.material:[o.material].filter(Boolean);for(let a of r)a&&typeof a.dispose=="function"&&a.dispose()})}function S({THREE:e,part:o,world:r,seed:a,camera:i,utilities:c}={}){let s=b(r),u=g(e,a||o?.id||"world-environment"),l;if(c&&typeof c.createSkyboxShell=="function"){l=c.createSkyboxShell({radius:s,name:"clyfford-still-vienna-single-skybox-shell",geometryKind:"box",color:"#090909",opacity:1,cameraPinned:!0,userData:{partId:"world-environment",role:"world-environment",packetId:d,packetHash:f}});let t=l.mesh||l.object?.mesh||l.children?.find(m=>m?.isMesh);t&&(t.material&&typeof t.material.dispose=="function"&&t.material.dispose(),t.name="clyfford-still-vienna-painted-pressure-skybox-mesh",t.material=u,t.castShadow=!1,t.receiveShadow=!1,t.frustumCulled=!1,l.mesh=t,l.material=u)}else l=w(e,s,u);let n=l.object||l;n.name="world-environment-clyfford-still-vienna-fracture-pressure",n.material=u,x(n);function p(t={}){let m=t.captureMode?0:Number(t.elapsedSeconds??t.time??0);u.uniforms.uTime.value=Number.isFinite(m)?m:0;let h=t.camera||i;h?.position&&n.position&&n.position.copy(h.position)}function v(){k(n)}return p({captureMode:!0,elapsedSeconds:0,camera:i}),{object:n,update:p,dispose:v,userData:{partId:"world-environment",packetId:d,packetHash:f,ownsSingleSkyboxShell:!0}}}export{S as createImmersiveWorldPart};
