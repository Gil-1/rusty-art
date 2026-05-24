var p="art-direction-packet-cf373ed36e00",v="cf373ed36e0033b69948aea7c39ab203";function x(e){let o=String(e??"world-environment"),a=2166136261;for(let l=0;l<o.length;l+=1)a^=o.charCodeAt(l),a=Math.imul(a,16777619);return a>>>0}function g(e,o){let a=(x(e)^x(o))>>>0;return function(){a=a+1831565813>>>0;let r=a;return r=Math.imul(r^r>>>15,r|1),r^=r+Math.imul(r^r>>>7,r|61),((r^r>>>14)>>>0)/4294967296}}function y(e,o,a){return e&&typeof e.createSeededRandom=="function"?e.createSeededRandom(o,a):g(o,a)}function F(e){let o=Number(e?.environment?.skyboxRadius||e?.environment?.radius||88);return!Number.isFinite(o)||o<=0?88:Math.max(72,Math.min(110,o))}function h(e,o){return e.userData={...e.userData,partId:"world-environment",role:"world-environment",packetId:p,packetHash:v,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0},e.renderOrder=o,e.traverse?.(a=>{a.castShadow=!1,a.receiveShadow=!1,a.frustumCulled=!1,a.renderOrder=o}),e}function w(e,o,a){let l=new e.Group;l.name="alma-thomas-rnp07l-single-skybox-shell";let r=2/Math.sqrt(3),c=new e.BoxGeometry(r,r,r,1,1,1),s=new e.Mesh(c,a);return s.name="alma-thomas-position-space-mosaic-environment-mesh",s.scale.setScalar(o),s.onBeforeRender=function(u,n,f){f?.position&&(l.position.copy(f.position),l.updateMatrixWorld(!0))},l.add(s),l.mesh=s,l.geometry=c,l.material=a,l.dispose=function(){c.dispose(),a.dispose()},h(l,-1e3)}function P(e,o){return new e.ShaderMaterial({name:"alma-thomas-lennik-against-rnp07l-mosaic-skybox",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uSeed:{value:o()*997},uPaperA:{value:new e.Color("#F0DDD2")},uPaperB:{value:new e.Color("#F1E3DC")},uPaperWhite:{value:new e.Color("#EFEEEF")},uPaleTeal:{value:new e.Color("#E1EFF1")},uTeal:{value:new e.Color("#7FB9B7")},uDeepBlue:{value:new e.Color("#01316F")},uLowBlue:{value:new e.Color("#023F7F")},uDarkBlue:{value:new e.Color("#1F303F")},uOrange:{value:new e.Color("#FD9001")},uYellow:{value:new e.Color("#FDDF01")},uWarmRed:{value:new e.Color("#E45A1F")}},vertexShader:`
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision mediump float;

      uniform float uTime;
      uniform float uSeed;
      uniform vec3 uPaperA;
      uniform vec3 uPaperB;
      uniform vec3 uPaperWhite;
      uniform vec3 uPaleTeal;
      uniform vec3 uTeal;
      uniform vec3 uDeepBlue;
      uniform vec3 uLowBlue;
      uniform vec3 uDarkBlue;
      uniform vec3 uOrange;
      uniform vec3 uYellow;
      uniform vec3 uWarmRed;
      varying vec3 vLocalPosition;

      float saturate(float value) {
        return clamp(value, 0.0, 1.0);
      }

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345 + uSeed);
        return fract(p.x * p.y);
      }

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33 + uSeed);
        return fract((p.x + p.y) * p.z);
      }

      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);
        float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
        float nx00 = mix(n000, n100, u.x);
        float nx10 = mix(n010, n110, u.x);
        float nx01 = mix(n001, n101, u.x);
        float nx11 = mix(n011, n111, u.x);
        return mix(mix(nx00, nx10, u.y), mix(nx01, nx11, u.y), u.z);
      }

      float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.52;
        for (int i = 0; i < 4; i += 1) {
          value += noise3(p) * amplitude;
          p = p * 2.03 + vec3(5.7, 2.1, 8.3);
          amplitude *= 0.52;
        }
        return value;
      }

      vec2 cubePanel(vec3 dir) {
        vec3 ad = abs(dir);
        if (ad.z >= ad.x && ad.z >= ad.y) {
          return dir.xy / max(ad.z, 0.001);
        }
        if (ad.x >= ad.y) {
          return vec2(-dir.z * sign(dir.x), dir.y) / max(ad.x, 0.001);
        }
        return vec2(dir.x, -dir.z * sign(dir.y)) / max(ad.y, 0.001);
      }

      float dashMask(vec2 p, vec2 grid, vec2 halfSize, float missing, float roughness) {
        vec2 scaled = p * grid;
        vec2 cell = floor(scaled);
        vec2 uv = fract(scaled);
        float rnd = hash21(cell);
        vec2 center = vec2(0.5) + vec2(hash21(cell + 17.0), hash21(cell + 43.0) - 0.5) * 0.18;
        vec2 localHalf = halfSize * (0.84 + rnd * 0.34);
        vec2 d = abs(uv - center) - localHalf;
        float rect = 1.0 - smoothstep(0.0, 0.048, max(d.x, d.y));
        float ragged = smoothstep(roughness, 1.0, hash21(cell + floor(uv * 9.0)));
        float present = step(missing, rnd);
        return rect * mix(0.76, 1.0, ragged) * present;
      }

      float bandMask(float value, float center, float halfWidth) {
        return 1.0 - smoothstep(halfWidth * 0.55, halfWidth, abs(value - center));
      }

      float lineBand(vec2 p, float slope, float center, float halfWidth) {
        return 1.0 - smoothstep(halfWidth * 0.45, halfWidth, abs(p.y - p.x * slope - center));
      }

      float ringMask(vec2 p, vec2 center, float radius, float halfWidth) {
        return 1.0 - smoothstep(halfWidth * 0.42, halfWidth, abs(length(p - center) - radius));
      }

      float discMask(vec2 p, vec2 center, float radius, float feather) {
        return 1.0 - smoothstep(radius - feather, radius, length(p - center));
      }

      vec3 fieldPalette(float selector, float warmField, float coolField, float routeField, float darkField) {
        vec3 color = uPaperWhite;
        color = mix(color, uPaleTeal, coolField * 0.72);
        color = mix(color, uTeal, coolField * step(0.50, selector) * 0.82);
        color = mix(color, uOrange, warmField * (0.55 + step(0.35, selector) * 0.45));
        color = mix(color, uYellow, routeField * (0.64 + step(0.60, selector) * 0.36));
        color = mix(color, uWarmRed, warmField * step(0.82, selector) * 0.62);
        color = mix(color, uDeepBlue, darkField * (0.70 + step(0.40, selector) * 0.30));
        color = mix(color, uDarkBlue, darkField * step(0.78, selector) * 0.94);
        return color;
      }

      float atanlessAxis(vec2 p) {
        vec2 n = normalize(p + vec2(0.0001, 0.0002));
        return n.x * 0.5 + n.y * 0.5;
      }

      void main() {
        vec3 dir = normalize(vLocalPosition);
        vec2 panel = cubePanel(dir);
        float panelNoise = fbm(dir * 5.0 + vec3(1.0, 4.0, 7.0));
        panel += (panelNoise - 0.5) * 0.055;

        float poleFade = 1.0 - smoothstep(0.82, 0.98, abs(dir.y));
        float upper = smoothstep(0.16, 0.92, dir.y);
        float lower = smoothstep(-0.08, -0.90, dir.y);
        float sidePulse = 0.5 + 0.5 * sin((dir.x - dir.z) * 4.2 + uSeed);
        float grain = fbm(dir * 18.0 + vec3(7.0, 3.0, 11.0));

        vec3 color = mix(uPaperA, uPaperB, 0.35 + grain * 0.40);
        color = mix(color, uPaperWhite, upper * 0.34);
        color = mix(color, vec3(0.86, 0.70, 0.57), lower * 0.22);

        float frontGate = smoothstep(-0.10, -0.70, dir.z);
        float rearGate = smoothstep(0.08, 0.66, dir.z);
        float sideGate = max(smoothstep(0.18, 0.78, abs(dir.x)), rearGate * 0.65);
        float wrapGate = saturate(frontGate + sideGate * 0.58 + rearGate * 0.42);

        float horizonBlue = bandMask(dir.y + sin(dir.x * 3.2 + dir.z * 2.1) * 0.035, -0.04, 0.125) * poleFade;
        float upperTeal = bandMask(dir.y + sin(dir.z * 4.0) * 0.025, 0.18, 0.145) * poleFade;
        float lowerWarm = bandMask(dir.y + sin(dir.x * 2.8 - dir.z * 1.6) * 0.035, -0.42, 0.23) * poleFade;
        float highWarm = bandMask(dir.y + sin(dir.x * 3.0 + dir.z) * 0.03, 0.44, 0.18) * poleFade;

        vec2 front = vec2(dir.x, dir.y);
        vec2 side = vec2(dir.z, dir.y);
        vec2 rear = vec2(-dir.x, dir.y);

        float frontTarget = frontGate * (
          discMask(front, vec2(0.02, -0.43), 0.175, 0.055) * 1.2 +
          ringMask(front, vec2(0.02, -0.43), 0.28, 0.050) +
          ringMask(front, vec2(0.02, -0.43), 0.40, 0.042) +
          ringMask(front, vec2(0.02, -0.43), 0.54, 0.038)
        ) * poleFade;
        float rightTarget = smoothstep(0.20, 0.78, dir.x) * (
          discMask(side, vec2(-0.12, -0.22), 0.115, 0.045) +
          ringMask(side, vec2(-0.12, -0.22), 0.25, 0.040) +
          ringMask(side, vec2(-0.12, -0.22), 0.38, 0.034)
        ) * poleFade;
        float rearTarget = rearGate * (
          ringMask(rear, vec2(0.24, -0.30), 0.22, 0.038) +
          ringMask(rear, vec2(0.24, -0.30), 0.36, 0.031)
        ) * poleFade;
        float radialSystem = saturate(frontTarget + rightTarget * 0.82 + rearTarget * 0.62);

        float routeWarm = max(
          lineBand(front, 0.76, -0.11, 0.105) * frontGate,
          lineBand(side, -0.58, 0.08, 0.105) * sideGate
        ) * poleFade;
        float routeOppose = max(
          lineBand(front, -0.72, -0.02, 0.060) * frontGate,
          lineBand(side, 0.64, -0.03, 0.056) * sideGate
        ) * poleFade;
        float routeShoulder = max(
          lineBand(front, 0.76, -0.11, 0.190) * frontGate,
          lineBand(side, -0.58, 0.08, 0.178) * sideGate
        ) * poleFade;

        float verticalPressure = (
          bandMask(panel.x + sin(panel.y * 3.1) * 0.025, -0.58, 0.055) +
          bandMask(panel.x + sin(panel.y * 2.6) * 0.020, 0.62, 0.052)
        ) * sideGate * poleFade;

        float warmField = saturate(lowerWarm * 0.76 + highWarm * 0.58 + routeShoulder * 0.66 + radialSystem * 0.46);
        float coolField = saturate(horizonBlue * 0.92 + upperTeal * 0.72 + sideGate * 0.18);
        float darkField = saturate(horizonBlue * 0.80 + routeOppose * 1.15 + verticalPressure * 0.75 + frontTarget * 1.12);
        float routeField = saturate(routeWarm + ringMask(front, vec2(0.02, -0.43), 0.50, 0.090) * frontGate);

        float rowBend = sin(panel.x * 4.0 + dir.z * 2.2) * 0.045;
        vec2 dashP = vec2(panel.x * 1.05 + rowBend, panel.y + rowBend * 0.35);
        float fineDashes = dashMask(dashP, vec2(18.0, 31.0), vec2(0.39, 0.21), 0.17, 0.32) * wrapGate;
        float broadDashes = dashMask(dashP + vec2(0.07, -0.02), vec2(10.0, 20.0), vec2(0.43, 0.23), 0.22, 0.24) * wrapGate;
        float radialDashes = dashMask(vec2(length(front - vec2(0.02, -0.43)) * 2.1, atanlessAxis(front)), vec2(24.0, 16.0), vec2(0.42, 0.20), 0.12, 0.28) * frontGate * poleFade;
        float dash = saturate(max(fineDashes, broadDashes * 0.9) + radialDashes * radialSystem);

        float selector = hash21(floor(dashP * vec2(18.0, 31.0)) + floor(uSeed));
        vec3 markColor = fieldPalette(selector, warmField, coolField, routeField, darkField);
        float coloredPressure = saturate(warmField + coolField + routeField + darkField);
        float markOpacity = dash * (0.42 + coloredPressure * 0.58);
        color = mix(color, markColor, markOpacity);

        float whiteGap = dashMask(dashP + vec2(0.51, 0.23), vec2(22.0, 36.0), vec2(0.11, 0.08), 0.34, 0.60) * wrapGate;
        color = mix(color, uPaperWhite, whiteGap * 0.54);

        float routeBroken = dashMask(dashP + vec2(0.22, -0.11), vec2(30.0, 44.0), vec2(0.46, 0.16), 0.18, 0.26);
        color = mix(color, uYellow, routeWarm * routeBroken * 0.88);
        color = mix(color, uOrange, routeShoulder * routeBroken * 0.55);
        color = mix(color, uDeepBlue, routeOppose * routeBroken * 0.96);
        color = mix(color, uDarkBlue, frontTarget * routeBroken * 0.86);
        color = mix(color, uPaleTeal, upperTeal * dash * (0.35 + sidePulse * 0.28));

        float pressureCrack = max(lineBand(front, -0.72, -0.02, 0.024) * frontGate, lineBand(side, 0.64, -0.03, 0.025) * sideGate) * poleFade;
        color = mix(color, uDarkBlue, pressureCrack * (0.78 + routeBroken * 0.20));

        float matte = 0.88 + grain * 0.18 + fbm(dir * 42.0) * 0.05;
        color *= matte;
        color = mix(color, uPaperB, smoothstep(0.88, 0.99, abs(dir.y)) * 0.42);
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function b({THREE:e,part:o,world:a,seed:l,utilities:r}){let c=y(r,l||o?.id||"world-environment","alma-thomas-lennik-rnp07l-environment"),s=F(a),d=P(e,c),u=new e.Group;u.name="world-environment-alma-thomas-rnp07l-against-pressure",u.userData={partId:"world-environment",role:o?.role||"world-environment",packetId:p,packetHash:v,artist:"Alma Thomas",selectedNews:"Lennik goes to court over controversial RNP-07L flight route",environmentRadius:s,composition:"single full-surround position-space mosaic shell; no neutral backdrop"};let n;if(r&&typeof r.createSkyboxShell=="function"){n=r.createSkyboxShell({radius:s,name:"alma-thomas-rnp07l-single-dominant-skybox-shell",geometryKind:"box",color:"#F0DDD2",opacity:1,cameraPinned:!0,userData:{partId:"world-environment",role:"world-environment",packetId:p,packetHash:v,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0}});let t=n.object||n,i=n.mesh||t.mesh||t.children?.find(m=>m?.isMesh);i&&(i.material&&typeof i.material.dispose=="function"&&i.material.dispose(),i.material=d,i.name="alma-thomas-position-space-mosaic-environment-mesh",i.scale.setScalar(s),h(i,-1e3)),t.material=d,n=h(t,-1e3)}else n=w(e,s,d);u.add(n);function f(t={}){let i=t.captureMode?0:Number(t.elapsedSeconds??t.time??0);d.uniforms.uTime.value=Number.isFinite(i)?i:0,t.camera?.position&&n?.position&&!n.userData?.cameraPinned&&(n.position.copy(t.camera.position),n.updateMatrixWorld(!0))}function k(){d.dispose(),n?.geometry?.dispose?.(),n?.traverse?.(t=>{t!==n&&t.geometry&&t.geometry!==n.geometry&&t.geometry.dispose?.();let i=Array.isArray(t.material)?t.material:[t.material].filter(Boolean);for(let m of i)m&&m!==d&&m.dispose?.()})}return f({captureMode:!0,elapsedSeconds:0}),{object:u,update:f,dispose:k}}export{b as createImmersiveWorldPart};
