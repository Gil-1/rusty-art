var x="art-direction-packet-9b046114e0e3",k="9b046114e0e3f9850eab0dc35118d7bc";function B(e){let r=2166136261,o=String(e||"world-environment");for(let n=0;n<o.length;n+=1)r^=o.charCodeAt(n),r=Math.imul(r,16777619);return r>>>0}function I(e,r){let o=(B(e)^B(r))>>>0;return function(){o=o+1831565813>>>0;let a=o;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}function z(e,r,o){return e&&typeof e.createSeededRandom=="function"?e.createSeededRandom(r,o):I(r,o)}function O(e){return new e.ShaderMaterial({name:"mancoba-clay-fracture-pressure-skybox-material",side:e.BackSide,depthWrite:!1,depthTest:!0,transparent:!1,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uPaper:{value:new e.Color("#ece9e2")},uPaperWarm:{value:new e.Color("#e9d5bf")},uPaperRose:{value:new e.Color("#e9e3e1")},uOcher:{value:new e.Color("#c39a5f")},uClay:{value:new e.Color("#bf6d32")},uBrick:{value:new e.Color("#a84325")},uBlack:{value:new e.Color("#111219")},uCharcoal:{value:new e.Color("#3e4a49")},uGrey:{value:new e.Color("#908e80")},uGreen:{value:new e.Color("#2f7461")},uBlue:{value:new e.Color("#1d55a8")},uYellow:{value:new e.Color("#d49a14")}},vertexShader:`
      varying vec3 vLocalPosition;

      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;

      uniform float uTime;
      uniform vec3 uPaper;
      uniform vec3 uPaperWarm;
      uniform vec3 uPaperRose;
      uniform vec3 uOcher;
      uniform vec3 uClay;
      uniform vec3 uBrick;
      uniform vec3 uBlack;
      uniform vec3 uCharcoal;
      uniform vec3 uGrey;
      uniform vec3 uGreen;
      uniform vec3 uBlue;
      uniform vec3 uYellow;

      varying vec3 vLocalPosition;

      float saturate(float value) {
        return clamp(value, 0.0, 1.0);
      }

      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float noise2(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash12(i);
        float b = hash12(i + vec2(1.0, 0.0));
        float c = hash12(i + vec2(0.0, 1.0));
        float d = hash12(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.52;
        for (int i = 0; i < 5; i += 1) {
          value += noise2(p) * amp;
          p = mat2(1.62, 1.21, -1.18, 1.59) * p + 8.7;
          amp *= 0.48;
        }
        return value;
      }

      float band(float value, float center, float width, float feather) {
        return 1.0 - smoothstep(width, width + feather, abs(value - center));
      }

      float lineDistance(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
      }

      float lineMask(vec2 p, vec2 a, vec2 b, float width) {
        return 1.0 - smoothstep(width, width + 0.010, lineDistance(p, a, b));
      }

      float boxMask(vec2 p, vec2 center, vec2 halfSize, float angle, float softness) {
        float c = cos(angle);
        float s = sin(angle);
        vec2 q = mat2(c, -s, s, c) * (p - center);
        vec2 d = abs(q) - halfSize;
        float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        return 1.0 - smoothstep(0.0, softness, dist);
      }

      float ringMask(vec2 p, vec2 center, float radius, float width) {
        return 1.0 - smoothstep(width, width + 0.010, abs(length(p - center) - radius));
      }

      float dotGrid(vec2 p, vec2 scale, float threshold, float radius) {
        vec2 cell = floor(p * scale);
        vec2 local = fract(p * scale) - 0.5;
        float gate = step(threshold, hash12(cell + vec2(12.1, 3.7)));
        return (1.0 - smoothstep(radius, radius + 0.018, length(local))) * gate;
      }

      vec3 accentByCell(float index) {
        float m = mod(index, 6.0);
        if (m < 1.0) return uYellow;
        if (m < 2.0) return uGreen;
        if (m < 3.0) return uBlue;
        if (m < 4.0) return uBrick;
        if (m < 5.0) return uClay;
        return uBlack;
      }

      void main() {
        vec3 dir = normalize(vLocalPosition);
        float front = saturate(-dir.z);
        float back = saturate(dir.z);
        float side = saturate(abs(dir.x));
        float poleFade = 1.0 - smoothstep(0.76, 0.98, abs(dir.y));
        float poleBlend = smoothstep(0.86, 0.99, abs(dir.y));

        vec2 paperDomain = vec2(dir.x + dir.z * 0.36, dir.y * 1.34 - dir.z * 0.14);
        float rubbed = fbm(paperDomain * 4.6);
        float fiber = fbm(vec2(dir.y - dir.x * 0.55, dir.z + dir.x * 0.28) * 18.0);
        vec3 color = mix(uPaper, uPaperWarm, 0.24 + rubbed * 0.28);
        color = mix(color, uPaperRose, smoothstep(0.38, 0.92, fbm(paperDomain * 2.2 + 13.5)) * 0.30);
        color = mix(color, uOcher, smoothstep(0.56, 0.83, fbm(paperDomain * 2.9 - 7.0)) * 0.34);

        vec2 frontPlane = vec2(
          dir.x / (0.30 + front * 0.68),
          (dir.y + 0.03) / (0.34 + front * 0.66)
        );
        vec2 widePlane = vec2(
          dir.x / (0.56 + abs(dir.z) * 0.34),
          dir.y / (0.52 + abs(dir.z) * 0.28)
        );

        float slowPulse = sin(uTime * 0.72) * 0.018;
        float spine = band(frontPlane.x + sin(frontPlane.y * 6.0) * 0.018, slowPulse, 0.132, 0.040);
        float spineGate = smoothstep(-0.88, -0.64, frontPlane.y) * (1.0 - smoothstep(0.95, 1.10, frontPlane.y));
        float spineTexture = 0.70 + 0.30 * fbm(frontPlane * 26.0 + 4.0);
        color = mix(color, uBlack, spine * spineGate * front * spineTexture * 0.92);

        float cellEdge = 0.0;
        cellEdge += boxMask(frontPlane, vec2(0.010, 0.52), vec2(0.104, 0.205), 0.10, 0.018);
        cellEdge += boxMask(frontPlane, vec2(-0.012, 0.08), vec2(0.115, 0.190), -0.06, 0.018);
        cellEdge += boxMask(frontPlane, vec2(0.018, -0.36), vec2(0.124, 0.190), 0.08, 0.018);
        float innerWarmA = boxMask(frontPlane, vec2(0.006, 0.52), vec2(0.067, 0.128), 0.10, 0.030);
        float innerWarmB = boxMask(frontPlane, vec2(-0.008, 0.08), vec2(0.062, 0.120), -0.06, 0.030);
        float innerWarmC = boxMask(frontPlane, vec2(0.017, -0.36), vec2(0.076, 0.122), 0.08, 0.030);
        color = mix(color, uPaperWarm, saturate(cellEdge) * spineGate * front * 0.38);
        color = mix(color, uBrick, innerWarmA * spineGate * front * 0.78);
        color = mix(color, uOcher, innerWarmB * spineGate * front * 0.78);
        color = mix(color, uClay, innerWarmC * spineGate * front * 0.82);

        float diagonalA = lineMask(widePlane, vec2(-1.38, -0.55), vec2(1.32, 0.72), 0.020);
        float diagonalB = lineMask(widePlane, vec2(-1.20, 0.64), vec2(1.28, -0.60), 0.014);
        float diagonalC = lineMask(widePlane, vec2(-1.05, -0.04), vec2(1.20, 0.34), 0.030);
        float crossingLines = max(max(diagonalA, diagonalB), diagonalC) * poleFade;
        color = mix(color, uCharcoal, crossingLines * 0.78);
        color = mix(color, uBrick, diagonalC * 0.38 * poleFade);

        float arcLeft = ringMask(widePlane * vec2(0.82, 1.08), vec2(-0.72, -0.22), 0.56, 0.032);
        float arcRight = ringMask(widePlane * vec2(0.92, 1.00), vec2(0.74, 0.08), 0.52, 0.030);
        float arcGateLeft = smoothstep(-1.20, -0.20, widePlane.x) * (1.0 - smoothstep(0.05, 0.55, widePlane.x));
        float arcGateRight = smoothstep(0.04, 0.45, widePlane.x) * (1.0 - smoothstep(0.92, 1.35, widePlane.x));
        color = mix(color, uClay, arcLeft * arcGateLeft * poleFade * 0.74);
        color = mix(color, uOcher, arcRight * arcGateRight * poleFade * 0.55);

        float leftPlane = boxMask(widePlane, vec2(-0.72, 0.16), vec2(0.25, 0.20), -0.18, 0.030);
        float rightPlane = boxMask(widePlane, vec2(0.72, -0.06), vec2(0.28, 0.17), 0.12, 0.030);
        float sidePlane = boxMask(widePlane, vec2(1.02, 0.40), vec2(0.10, 0.24), 0.03, 0.025);
        color = mix(color, uClay, leftPlane * 0.48 * poleFade);
        color = mix(color, uOcher, rightPlane * 0.42 * poleFade);
        color = mix(color, uGreen, sidePlane * 0.62 * poleFade);

        float looseDots = dotGrid(vec2(widePlane.x * 1.08 + 2.0, widePlane.y + 1.9), vec2(6.0, 7.2), 0.70, 0.105);
        float sideDots = dotGrid(vec2(abs(dir.x) * 2.2, dir.y + 1.1), vec2(5.0, 8.0), 0.45, 0.125) * smoothstep(0.42, 0.96, side);
        float dotMask = max(looseDots * 0.72, sideDots) * poleFade;
        color = mix(color, uBlack, dotMask * 0.84);

        vec2 backPlane = vec2(dir.x / (0.44 + back * 0.62), (dir.y - 0.02) / (0.44 + back * 0.58));
        float backCell = boxMask(backPlane, vec2(0.00, 0.12), vec2(0.20, 0.55), 0.05, 0.040) * back;
        float backLine = max(
          lineMask(backPlane, vec2(-0.52, -0.44), vec2(0.50, 0.46), 0.020),
          lineMask(backPlane, vec2(-0.56, 0.34), vec2(0.54, -0.28), 0.016)
        ) * back;
        color = mix(color, uCharcoal, backLine * poleFade * 0.62);
        color = mix(color, mix(uGrey, uOcher, 0.35), backCell * poleFade * 0.30);

        float accentCells = dotGrid(vec2(widePlane.x + 3.4, widePlane.y + 2.4), vec2(4.0, 3.2), 0.86, 0.160) * poleFade;
        float accentIndex = floor((widePlane.x + 3.4) * 4.0) + floor((widePlane.y + 2.4) * 3.2) * 2.0;
        color = mix(color, accentByCell(accentIndex), accentCells * 0.72);

        float scratchA = lineMask(widePlane, vec2(-1.32, 0.82), vec2(-0.14, -0.82), 0.006);
        float scratchB = lineMask(widePlane, vec2(0.20, 0.92), vec2(1.28, -0.70), 0.006);
        float scratchC = lineMask(widePlane, vec2(-0.95, -0.78), vec2(0.95, -0.12), 0.005);
        float scratch = max(max(scratchA, scratchB), scratchC) * poleFade;
        color = mix(color, uBlack, scratch * 0.56);

        float speckle = hash12(floor(vec2(dir.x + dir.z * 0.41, dir.y - dir.x * 0.19) * 210.0));
        float dryDrag = smoothstep(0.63, 0.95, fiber) * (0.60 + 0.40 * poleFade);
        color *= 0.955 + speckle * 0.060;
        color = mix(color, color * (0.72 + rubbed * 0.25), dryDrag * 0.23);

        vec3 poleWash = mix(uPaperRose, uPaperWarm, 0.55 + dir.y * 0.12);
        color = mix(color, poleWash, poleBlend * 0.65);

        gl_FragColor = vec4(color, 1.0);
      }
    `})}function L(e,r,o){let n=e?.object||e,a=e?.mesh||n?.mesh||n?.children?.find(l=>l&&l.isMesh)||(n?.isMesh?n:null);return n&&(n.name="mancoba-single-enclosing-clay-fracture-skybox",n.frustumCulled=!1,n.renderOrder=-1e3,n.userData={...n.userData,partId:"world-environment",role:"world-environment",packetId:x,packetHash:k,artist:"Ernest Mancoba",skybox:!0,cameraPinned:!0,immersiveWorldEnvironmentShell:!0,ownsSingleSkyboxShell:!0}),a&&(a.material&&a.material!==o&&typeof a.material.dispose=="function"&&a.material.dispose(),a.name="mancoba-position-space-paper-contour-skybox-mesh",a.material=o,a.scale.setScalar(r),a.frustumCulled=!1,a.castShadow=!1,a.receiveShadow=!1,a.renderOrder=-1e3,a.userData={...a.userData,partId:"world-environment",role:"world-environment",packetId:x,packetHash:k,skybox:!0,fullSurroundSkyboxLayer:!0}),{object:n,mesh:a}}function A(e,r,o){let n=new e.BoxGeometry(2,2,2,1,1,1),a=new e.Mesh(n,o);return a.name="fallback-mancoba-clay-fracture-skybox-shell",a.scale.setScalar(r),a.frustumCulled=!1,a.renderOrder=-1e3,a.onBeforeRender=function(d,f,s){s&&s.position&&(a.position.copy(s.position),a.updateMatrixWorld(!0))},a}function w(e,r,o=1){return new e.MeshBasicMaterial({color:r,transparent:o<1,opacity:o,side:e.DoubleSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})}function j(e,r,o=1){return new e.MeshBasicMaterial({color:r,transparent:o<1,opacity:o,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})}function P(e,r){return e.frustumCulled=!1,e.castShadow=!1,e.receiveShadow=!1,e.renderOrder=r,e}function Y(e,r,o,n,a){let l=new e.Group;l.name="mancoba-mid-depth-clay-and-paper-geometric-planes",r.add(l);let d=new e.PlaneGeometry(1,1,1,1);n.push(d);let f=[{color:"#bf6d32",opacity:.48,position:[-7.8,2,-9.8],rotation:[.04,.46,-.2],scale:[4.5,3.1,1]},{color:"#c39a5f",opacity:.44,position:[7.2,.4,-10.8],rotation:[-.03,-.42,.14],scale:[4.8,2.7,1]},{color:"#e3d1bd",opacity:.36,position:[-5.9,-1.7,-8.4],rotation:[.02,.34,.42],scale:[5.8,1.35,1]},{color:"#a84325",opacity:.34,position:[6.2,-1.4,-8.9],rotation:[.02,-.35,-.4],scale:[5.9,1.18,1]},{color:"#2f7461",opacity:.42,position:[4.2,3.4,-11.4],rotation:[0,-.28,.08],scale:[.55,2,1]},{color:"#1d55a8",opacity:.4,position:[8.5,1.7,-12.4],rotation:[.04,-.5,-.04],scale:[.95,.95,1]}];for(let s=0;s<f.length;s+=1){let i=f[s],h=w(e,i.color,i.opacity);a.push(h);let c=new e.Mesh(d,h);c.name=`mancoba-weathered-pressure-plane-${s+1}`,c.position.set(i.position[0],i.position[1],i.position[2]),c.rotation.set(i.rotation[0],i.rotation[1],i.rotation[2]),c.scale.set(i.scale[0]*(.96+o()*.1),i.scale[1]*(.96+o()*.1),i.scale[2]),c.userData.baseScaleX=c.scale.x,c.userData.baseScaleY=c.scale.y,c.userData.baseOpacity=i.opacity,c.userData.phase=o()*Math.PI*2,P(c,-170+s),l.add(c)}return l}function _(e,r,o,n,a){let l=new e.Group;l.name="mancoba-wiry-contour-pressure-lines",r.add(l);let d=[{color:"#111219",opacity:.82,radius:.028,points:[[-9,-2.4,-7.7],[-5.4,1.2,-9.2],[-1.1,2.4,-10.2],[3.8,.2,-9],[9,2.9,-8.2]]},{color:"#3e4a49",opacity:.72,radius:.022,points:[[-8.4,3.5,-10],[-4.2,.6,-8.5],[0,-.2,-9.8],[4.5,-2.3,-8.8],[8.7,-3.4,-10.4]]},{color:"#111219",opacity:.76,radius:.024,points:[[-.9,5.2,-11.2],[-.3,2.5,-9.6],[0,0,-8.8],[.4,-2.5,-9.8],[.7,-4.2,-11]]},{color:"#a84325",opacity:.6,radius:.06,points:[[-9.2,1.5,-13],[-4.5,1.2,-11.2],[.6,.7,-10],[5,1.2,-11],[9.4,2.2,-13]]},{color:"#111219",opacity:.7,radius:.018,points:[[-7.2,-4,-12.6],[-3.8,-1.9,-10.8],[1,-1.4,-9.7],[4.4,-.1,-10.7],[7.9,.4,-12.5]]}];for(let f=0;f<d.length;f+=1){let s=d[f],i=s.points.map(u=>new e.Vector3(u[0]+(o()-.5)*.28,u[1]+(o()-.5)*.22,u[2]+(o()-.5)*.2)),h=new e.CatmullRomCurve3(i),c=new e.TubeGeometry(h,96,s.radius,7,!1);n.push(c);let t=j(e,s.color,s.opacity);a.push(t);let m=new e.Mesh(c,t);m.name=`mancoba-hand-drawn-contour-tube-${f+1}`,m.userData.baseOpacity=s.opacity,m.userData.phase=o()*Math.PI*2,P(m,-130+f),l.add(m)}return l}function N(e,r,o,n,a){let l=new e.Group;l.name="mancoba-restless-peripheral-dot-and-dash-chains",r.add(l);let d=new e.CircleGeometry(1,18),f=new e.PlaneGeometry(1,1,1,1);n.push(d,f);let s=w(e,"#111219",.8),i=w(e,"#c39a5f",.66),h=w(e,"#d49a14",.78);a.push(s,i,h);let c=[];for(let t=0;t<18;t+=1)c.push({geometry:t%4===0?f:d,material:t===8?h:t%5===0?i:s,position:[-8.8+Math.sin(t*.55)*.35,4.3-t*.42,-8.6-t*.05],scale:t%4===0?[.1,.38,1]:[.11,.11,1],rotationZ:t%4===0?-.08:0});for(let t=0;t<13;t+=1)c.push({geometry:t%3===0?f:d,material:s,position:[7.8+Math.sin(t*.42)*.3,3.2-t*.36,-9.4-t*.06],scale:t%3===0?[.11,.34,1]:[.1,.1,1],rotationZ:.06});for(let t=0;t<7;t+=1)c.push({geometry:d,material:t===3?h:s,position:[-.7+t*.23,-3+Math.sin(t*.9)*.12,-7.6],scale:[.13,.13,1],rotationZ:0});for(let t=0;t<c.length;t+=1){let m=c[t],u=new e.Mesh(m.geometry,m.material);u.name=`mancoba-dot-dash-pressure-mark-${t+1}`,u.position.set(m.position[0]+(o()-.5)*.12,m.position[1]+(o()-.5)*.1,m.position[2]),u.rotation.set(0,0,m.rotationZ),u.scale.set(m.scale[0]*(.92+o()*.22),m.scale[1]*(.92+o()*.22),m.scale[2]),u.userData.baseScaleX=u.scale.x,u.userData.baseScaleY=u.scale.y,u.userData.phase=o()*Math.PI*2,P(u,-110+t),l.add(u)}return l}function X(e,r=[]){let o=new Set(r.filter(a=>a&&a.isBufferGeometry)),n=new Set(r.filter(a=>a&&a.isMaterial));e.traverse?.(a=>{a.geometry&&o.add(a.geometry);let l=Array.isArray(a.material)?a.material:[a.material].filter(Boolean);for(let d of l)n.add(d)});for(let a of o)typeof a.dispose=="function"&&a.dispose();for(let a of n)typeof a.dispose=="function"&&a.dispose()}function Z({THREE:e,part:r,world:o,seed:n,camera:a,utilities:l}={}){let d=new e.Group;d.name="world-environment-ernest-mancoba-clay-fracture-pressure",d.userData={partId:"world-environment",role:r?.role||"world-environment",packetId:x,packetHash:k,artist:"Ernest Mancoba",newsCue:"Elise Mertens straight-sets advance at Roland-Garros",visualPurpose:"single dominant surrounding skybox with matte paper, central dark spine, stacked cells, clay pressure bands, contour lines, and restless peripheral marks"};let f=z(l,n||r?.id||"world-environment","mancoba-roland-garros-world-environment"),s=[],i=[],h=Number(o?.environment?.skyboxRadius||o?.environment?.radius),c=Number.isFinite(h)&&h>0?Math.max(62,Math.min(132,h)):90,t=O(e);i.push(t);let m=l&&typeof l.createSkyboxShell=="function"?l.createSkyboxShell({radius:c,name:"single-mancoba-roland-garros-fracture-skybox-shell",geometryKind:"box",material:t,color:"#ece9e2",opacity:1,cameraPinned:!0,userData:{partId:"world-environment",role:"world-environment",packetId:x,packetHash:k,artist:"Ernest Mancoba",skybox:!0,cameraPinned:!0,immersiveWorldEnvironmentShell:!0,ownsSingleSkyboxShell:!0}}):A(e,c,t),u=L(m,c,t);u.object&&d.add(u.object);let M=Y(e,d,f,s,i),C=_(e,d,f,s,i),W=N(e,d,f,s,i);function S(y={}){let D=y.captureMode?0:Number(y.elapsedSeconds??y.time??0),v=Number.isFinite(D)?D:0,b=Number.isFinite(y.motionIntensity)?y.motionIntensity:1;t.uniforms.uTime.value=v;let g=y.camera||a;g&&g.position&&u.object?.userData?.cameraPinned&&(u.object.position.copy(g.position),u.object.updateMatrixWorld(!0)),M.rotation.z=Math.sin(v*.05)*.01*b;for(let p of M.children)p.scale.x=p.userData.baseScaleX*(1+Math.sin(v*.19+p.userData.phase)*.02*b),p.scale.y=p.userData.baseScaleY*(1+Math.cos(v*.16+p.userData.phase)*.014*b),p.material&&(p.material.opacity=p.userData.baseOpacity*(.96+Math.sin(v*.12+p.userData.phase)*.03*b));C.rotation.z=Math.sin(v*.045)*.012*b;for(let p of C.children)p.material&&(p.material.opacity=p.userData.baseOpacity*(.97+Math.sin(v*.1+p.userData.phase)*.025*b));for(let p of W.children){let G=1+Math.sin(v*.32+p.userData.phase)*.045*b;p.scale.x=p.userData.baseScaleX*G,p.scale.y=p.userData.baseScaleY*G}}function F(){X(d,[...s,...i])}return S({captureMode:!0,elapsedSeconds:0,camera:a}),{object:d,update:S,dispose:F,userData:{partId:"world-environment",packetId:x,packetHash:k,finalDraft:"drafts/world-environment.module.mjs"}}}export{Z as createImmersiveWorldPart};
