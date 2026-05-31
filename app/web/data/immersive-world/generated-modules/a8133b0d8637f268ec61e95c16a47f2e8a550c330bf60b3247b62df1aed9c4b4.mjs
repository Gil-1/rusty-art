var B="art-direction-packet-f76c1ba9fd3e",S="f76c1ba9fd3ed6a8fae0806d5d83ab62";function F(e){let t=2166136261,s=String(e??"world-environment");for(let r=0;r<s.length;r+=1)t^=s.charCodeAt(r),t=Math.imul(t,16777619);return t>>>0}function D(e,t,s){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(t,s);let r=(F(t)^F(s))>>>0;return function(){r=r+1831565813>>>0;let o=r;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296}}function O(e){let t=Number(e?.environment?.skyboxRadius||e?.environment?.radius||88);return Number.isFinite(t)&&t>0?Math.max(72,Math.min(104,t)):88}function q(e,t,s){return e.name=e.name||"clyfford-still-roland-garros-enclosing-shell",e.renderOrder=t,e.frustumCulled=!1,e.userData={...e.userData,...s,skybox:!0,skyboxShell:!0,cameraPinned:!0,fullSurroundSkyboxLayer:!0,ownsSingleEnvironmentShell:!0},e.traverse?.(r=>{r.castShadow=!1,r.receiveShadow=!1,r.frustumCulled=!1,r.renderOrder=t,r.userData={...r.userData,partId:"world-environment",role:"world-environment",packetId:B,packetHash:S}}),e}function _(e,t,s){let r=2/Math.sqrt(3),a=new e.BoxGeometry(r,r,r,1,1,1),o=new e.Mesh(a,s);return o.name="clyfford-still-position-space-fallback-shell",o.scale.setScalar(t),o.onBeforeRender=function(c,h,d){d?.position&&o.position.copy(d.position)},o}function G(e){return new e.ShaderMaterial({name:"clyfford_still_collignon_arnaldi_single_shell_environment",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uBlack:{value:new e.Color("#090806")},uCharcoal:{value:new e.Color("#1f1d18")},uCream:{value:new e.Color("#d7c19a")},uBone:{value:new e.Color("#eadfca")},uMustard:{value:new e.Color("#d99a24")},uOchre:{value:new e.Color("#9b641e")},uMaroon:{value:new e.Color("#471521")},uBlue:{value:new e.Color("#0b2f79")},uAsh:{value:new e.Color("#777066")}},vertexShader:`
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      uniform float uTime;
      uniform vec3 uBlack;
      uniform vec3 uCharcoal;
      uniform vec3 uCream;
      uniform vec3 uBone;
      uniform vec3 uMustard;
      uniform vec3 uOchre;
      uniform vec3 uMaroon;
      uniform vec3 uBlue;
      uniform vec3 uAsh;
      varying vec3 vLocalPosition;

      float saturate(float x) { return clamp(x, 0.0, 1.0); }
      float hash21(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i += 1) {
          v += noise(p) * a;
          p = p * 2.03 + vec2(17.7, 9.2);
          a *= 0.5;
        }
        return v;
      }
      float jaggedVertical(vec2 p, float xEdge, float width, float roughness, float seed) {
        float n = fbm(vec2(p.y * 2.6 + seed, p.x * 1.1 - seed));
        float chips = fbm(vec2(p.y * 15.0 + seed * 3.0, p.x * 4.5));
        float edge = xEdge + (n - 0.5) * roughness + (chips - 0.5) * roughness * 0.42;
        return 1.0 - smoothstep(edge - width, edge + width, p.x);
      }
      float jaggedRight(vec2 p, float xEdge, float width, float roughness, float seed) {
        float n = fbm(vec2(p.y * 2.2 - seed, p.x * 1.4 + seed));
        float edge = xEdge + (n - 0.5) * roughness;
        return smoothstep(edge - width, edge + width, p.x);
      }
      float horizontalTear(vec2 p, float yEdge, float width, float roughness, float seed) {
        float n = fbm(vec2(p.x * 2.4 + seed, p.y * 1.2 - seed));
        float scratches = fbm(vec2(p.x * 22.0, p.y * 5.0 + seed));
        float edge = yEdge + (n - 0.5) * roughness + (scratches - 0.5) * roughness * 0.25;
        return 1.0 - smoothstep(edge - width, edge + width, p.y);
      }
      float softBand(float v, float width, float feather) {
        return 1.0 - smoothstep(width, width + feather, abs(v));
      }
      float tornStripe(vec2 p, float x, float width, float seed) {
        float n = fbm(vec2(p.y * 10.0 + seed, p.x * 5.0));
        float chippedWidth = width * (0.55 + n * 1.05);
        return 1.0 - smoothstep(chippedWidth, chippedWidth + 0.018, abs(p.x - x - (n - 0.5) * 0.035));
      }
      vec3 paintBlend(vec3 baseColor, vec3 nextColor, float mask) {
        return mix(baseColor, nextColor, saturate(mask));
      }

      void main() {
        vec3 dir = normalize(vLocalPosition);
        float side = dir.x;
        float height = dir.y;
        float depth = dir.z;
        float poleFade = 1.0 - smoothstep(0.82, 0.985, abs(height));
        float stillTime = sin(uTime * 0.08) * 0.018;

        vec2 front = vec2(side + depth * 0.18, height);
        vec2 oblique = vec2(side * 0.78 - depth * 0.55, height + depth * 0.10);
        vec2 wrap = vec2(depth - side * 0.36, height - side * 0.04);

        float stain = fbm(front * vec2(2.0, 1.35) + vec2(0.2, -0.4));
        float lowerHeat = saturate((-height + 0.44) * 0.95);
        vec3 color = mix(uCream, uAsh, saturate(depth * 0.38 + 0.36));
        color = paintBlend(color, uOchre, lowerHeat * 0.55 + stain * 0.16);

        float leftMass = jaggedVertical(front, -0.14 + stillTime, 0.035, 0.34, 1.1);
        leftMass *= smoothstep(-0.92, -0.56, front.y) * (1.0 - smoothstep(0.84, 1.02, front.y));
        color = paintBlend(color, uBlack, leftMass * 0.98);

        float highBlackShelf = horizontalTear(oblique, 0.66, 0.026, 0.23, 2.0) * smoothstep(-0.60, -0.12, oblique.x);
        color = paintBlend(color, uCharcoal, highBlackShelf * 0.86);

        float mustardRise = jaggedRight(front, -0.04, 0.040, 0.30, 3.1);
        mustardRise *= horizontalTear(front, 0.02, 0.042, 0.25, 4.0);
        mustardRise *= smoothstep(-0.88, -0.42, front.y);
        color = paintBlend(color, uMustard, mustardRise * 0.88);

        float maroonSlab = jaggedRight(oblique, 0.10, 0.034, 0.22, 5.0);
        maroonSlab *= 1.0 - jaggedRight(oblique, 0.62, 0.040, 0.18, 6.0);
        maroonSlab *= smoothstep(-0.46, -0.18, oblique.y) * (1.0 - smoothstep(0.86, 1.02, oblique.y));
        color = paintBlend(color, uMaroon, maroonSlab * 0.90);

        float exposedCream = tornStripe(front, -0.24, 0.055, 7.0) * smoothstep(-0.74, -0.32, front.y) * (1.0 - smoothstep(0.76, 0.96, front.y));
        color = paintBlend(color, uBone, exposedCream * 0.94);

        float centerBlackFissure = tornStripe(front, 0.02, 0.040, 8.0) * poleFade;
        color = paintBlend(color, uBlack, centerBlackFissure * 0.92);

        float blueCutA = tornStripe(oblique, 0.46, 0.024, 9.0) * smoothstep(-0.68, -0.20, oblique.y) * (1.0 - smoothstep(0.70, 0.94, oblique.y));
        float blueCutB = tornStripe(wrap, -0.36, 0.032, 10.0) * smoothstep(-0.84, -0.34, wrap.y) * (1.0 - smoothstep(0.40, 0.74, wrap.y));
        color = paintBlend(color, uBlue, (blueCutA + blueCutB) * 0.92);

        float blackRightDrag = jaggedRight(wrap, 0.26, 0.034, 0.16, 11.0) * horizontalTear(wrap, 0.30, 0.030, 0.20, 12.0);
        color = paintBlend(color, uBlack, blackRightDrag * 0.76);

        float courtPressureArc = softBand(length(front - vec2(0.43, -0.06)) - 0.50, 0.018, 0.012);
        courtPressureArc *= smoothstep(0.06, 0.20, front.x) * (1.0 - smoothstep(0.72, 0.96, front.y)) * poleFade;
        color = paintBlend(color, uBone, courtPressureArc * 0.54);

        float proudAfterimage = softBand(length(wrap - vec2(-0.32, -0.08)) - 0.39, 0.014, 0.014);
        proudAfterimage *= smoothstep(-0.90, -0.25, side) * poleFade;
        color = paintBlend(color, uMustard, proudAfterimage * 0.44);

        float scratchField = 0.0;
        scratchField += tornStripe(front + vec2(fbm(front * 5.0), 0.0) * 0.025, -0.58, 0.010, 13.0) * 0.55;
        scratchField += tornStripe(front, -0.42, 0.008, 14.0) * 0.45;
        scratchField += tornStripe(oblique, 0.28, 0.010, 15.0) * 0.50;
        scratchField *= poleFade * (0.42 + lowerHeat * 0.58);
        color = paintBlend(color, uBone, scratchField * 0.30);

        float verticalGrooves = sin((side + depth * 0.17) * 220.0 + fbm(front * 9.0) * 5.0);
        float woven = sin((side - depth) * 154.0) * sin(height * 176.0);
        float dryChipNoise = fbm((front + vec2(depth * 0.19, side * 0.11)) * vec2(76.0, 122.0));
        float dryChips = smoothstep(0.76, 0.94, dryChipNoise) * (0.45 + 0.55 * fbm(front * vec2(18.0, 64.0)));
        float matte = (verticalGrooves * 0.012 + woven * 0.014 + (stain - 0.5) * 0.065);
        color *= 0.94 + matte;
        color = paintBlend(color, uBone, dryChips * poleFade * 0.045);

        float vignette = 0.76 + 0.24 * poleFade;
        float depthAtmosphere = 0.88 + saturate(depth * 0.5 + 0.5) * 0.10;
        color *= vignette * depthAtmosphere;
        color = pow(max(color, vec3(0.0)), vec3(0.93));
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function z(e,t,s){return new e.MeshBasicMaterial({color:t,transparent:s<1,opacity:s,side:e.DoubleSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})}function I(e,t,s,r,a){let o=z(e,a.color,a.opacity);r.push(o);let n=new e.Mesh(s,o);return n.name=a.name,n.position.set(a.position[0],a.position[1],a.position[2]),n.rotation.set(a.rotation[0],a.rotation[1],a.rotation[2]),n.scale.set(a.scale[0],a.scale[1],1),n.renderOrder=a.renderOrder,n.frustumCulled=!1,n.userData={baseScaleX:a.scale[0],baseScaleY:a.scale[1],baseRotationZ:a.rotation[2],baseOpacity:a.opacity,phase:a.phase},t.add(n),n}function L(e,t){let s=[];for(let c=0;c<48;c+=1){let d=(c%2===0?-1:1)*(2.2+t()*6.6),m=-2.9+t()*6,u=-5.2-t()*10.8,v=.8+t()*3.2,g=(t()-.5)*.72;s.push(d,m,u,d+g,m-v,u-t()*.7)}let r=new e.BufferGeometry,a=typeof e.Float32BufferAttribute=="function"?e.Float32BufferAttribute:e.BufferAttribute;a===e.BufferAttribute?r.setAttribute("position",new e.BufferAttribute(new Float32Array(s),3)):r.setAttribute("position",new a(s,3));let o=new e.LineBasicMaterial({color:"#dfd0b8",transparent:!0,opacity:.28,depthWrite:!1,depthTest:!0,toneMapped:!1}),n=new e.LineSegments(r,o);return n.name="slow-battle-scraped-vertical-fissure-lines",n.renderOrder=-34,n.frustumCulled=!1,{object:n,geometry:r,material:o}}function N({THREE:e,part:t,world:s,seed:r,camera:a,utilities:o}={}){let n=new e.Group;n.name="world-environment-clyfford-still-collignon-arnaldi-pressure",n.userData={partId:"world-environment",role:t?.role||"world-environment",packetId:B,packetHash:S,artist:"Clyfford Still",selectedNews:"Roland Garros - Collignon disappointed but proud after battle against Arnaldi",targetPurpose:"dominant full-surround matte fractured atmosphere"};let c=D(o,r||t?.id||"world-environment","still-collignon-arnaldi-environment"),h=O(s),d=G(e),m={partId:"world-environment",role:"world-environment",packetId:B,packetHash:S,environmentRadius:h,compositionRole:"single Clyfford Still-derived enclosing shell"},u;if(o&&typeof o.createSkyboxShell=="function"){let l=o.createSkyboxShell({radius:h,name:"single-still-roland-garros-fracture-pressure-shell",geometryKind:"box",color:"#090806",opacity:1,cameraPinned:!0,userData:m});u=l.object||l;let i=l.mesh||u.mesh||u.children?.find(f=>f?.isMesh);i&&(i.material&&typeof i.material.dispose=="function"&&i.material.dispose(),i.material=d,i.name="direction-space-still-torn-pigment-shell-mesh",i.scale.setScalar(h),i.renderOrder=-1e3,i.frustumCulled=!1),u.material=d}else u=_(e,h,d);q(u,-1e3,m),n.add(u);let v=[],g=[d],C=new e.PlaneGeometry(1,1,1,1);v.push(C);let y=new e.Group;y.name="ordinary-depth-collignon-proud-disappointed-pressure-fields",n.add(y);let M=[{name:"near-left-raw-black-weight-field",color:"#090806",opacity:.52,position:[-5.6,.2,-7.8],rotation:[.02,.28,.03],scale:[7.9,7.2],renderOrder:-58,phase:c()*6.283},{name:"low-mineral-yellow-roland-garros-pressure-ground",color:"#c98520",opacity:.24,position:[2,-2.36,-8.7],rotation:[.1,-.1,-.08],scale:[15.2,2.2],renderOrder:-54,phase:c()*6.283},{name:"bruised-maroon-pride-afterimage-slab",color:"#471521",opacity:.3,position:[4.8,.8,-10.8],rotation:[.02,-.38,-.02],scale:[5.6,6.4],renderOrder:-56,phase:c()*6.283},{name:"exposed-cream-battle-fissure",color:"#eadfca",opacity:.42,position:[-1.25,.08,-5.9],rotation:[.02,.05,-.08],scale:[.44,6.9],renderOrder:-42,phase:c()*6.283},{name:"electric-blue-small-incredible-moment",color:"#0b2f79",opacity:.46,position:[1.25,-.54,-5.4],rotation:[.03,-.07,.02],scale:[.24,5.6],renderOrder:-40,phase:c()*6.283}].map(l=>I(e,y,C,g,l)),b=L(e,c);n.add(b.object),v.push(b.geometry),g.push(b.material);function k(l={}){let i=l.captureMode?0:Number(l.elapsedSeconds??l.time??0),f=Number.isFinite(i)?i:0;d.uniforms.uTime.value=f;for(let w=0;w<M.length;w+=1){let p=M[w],x=p.userData.phase||0,A=Math.sin(f*.07+x);p.scale.x=p.userData.baseScaleX*(1+A*.01),p.scale.y=p.userData.baseScaleY*(1+Math.sin(f*.05+x)*.008),p.rotation.z=p.userData.baseRotationZ+A*.004,p.material.opacity=p.userData.baseOpacity*(.96+Math.sin(f*.09+x)*.025)}b.object.rotation.y=Math.sin(f*.028)*.018,l.camera?.position&&a?.position&&a.position.copy(l.camera.position)}function P(){n.traverse(l=>{l.geometry&&typeof l.geometry.dispose=="function"&&l.geometry.dispose();let i=Array.isArray(l.material)?l.material:[l.material].filter(Boolean);for(let f of i)f&&typeof f.dispose=="function"&&f.dispose()});for(let l of v)l.dispose?.();for(let l of g)l.dispose?.()}return k({captureMode:!0,elapsedSeconds:0}),{object:n,update:k,dispose:P}}export{N as createImmersiveWorldPart};
