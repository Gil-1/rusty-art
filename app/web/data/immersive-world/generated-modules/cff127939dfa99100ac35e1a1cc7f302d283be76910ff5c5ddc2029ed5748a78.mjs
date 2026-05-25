var b="art-direction-packet-ecebeeb358f9",v="ecebeeb358f982dedb0b6bf6bf9dc502";function D(e){let a=2166136261,t=String(e||"world-environment");for(let r=0;r<t.length;r+=1)a^=t.charCodeAt(r),a=Math.imul(a,16777619);return a>>>0}function F(e,a){let t=(D(e)^D(a))>>>0;return function(){t=t+1831565813>>>0;let o=t;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296}}function G(e,a,t){return e&&typeof e.createSeededRandom=="function"?e.createSeededRandom(a,t):F(a,t)}function L(e){return new e.ShaderMaterial({name:"bridget-riley-roland-garros-fracture-skybox-material",side:e.BackSide,depthWrite:!1,depthTest:!0,transparent:!1,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uPaper:{value:new e.Color("#f2ede6")},uPaperLight:{value:new e.Color("#ffffff")},uOrange:{value:new e.Color("#e97833")},uBlue:{value:new e.Color("#3f5a7c")},uLightBlue:{value:new e.Color("#72adf0")},uViolet:{value:new e.Color("#544481")},uBlack:{value:new e.Color("#070707")},uTeal:{value:new e.Color("#407f86")},uPink:{value:new e.Color("#f3c6c8")}},vertexShader:`
      varying vec3 vLocalPosition;

      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;

      uniform float uTime;
      uniform vec3 uPaper;
      uniform vec3 uPaperLight;
      uniform vec3 uOrange;
      uniform vec3 uBlue;
      uniform vec3 uLightBlue;
      uniform vec3 uViolet;
      uniform vec3 uBlack;
      uniform vec3 uTeal;
      uniform vec3 uPink;

      varying vec3 vLocalPosition;

      float saturate(float value) {
        return clamp(value, 0.0, 1.0);
      }

      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float hardBand(float coord, float center, float width) {
        return 1.0 - smoothstep(width, width + 0.006, abs(coord - center));
      }

      vec3 paletteByIndex(float index) {
        float m = mod(index, 8.0);
        if (m < 1.0) return uOrange;
        if (m < 2.0) return uPaperLight;
        if (m < 3.0) return uBlue;
        if (m < 4.0) return uBlack;
        if (m < 5.0) return uLightBlue;
        if (m < 6.0) return uViolet;
        if (m < 7.0) return uPaper;
        return uPink;
      }

      float ring(float radius, float center, float width) {
        return 1.0 - smoothstep(width, width + 0.006, abs(radius - center));
      }

      void main() {
        vec3 dir = normalize(vLocalPosition);
        float front = saturate(-dir.z);
        float back = saturate(dir.z);
        float sideDepth = abs(dir.z);
        float poleFade = 1.0 - smoothstep(0.74, 0.98, abs(dir.y));

        vec2 plane = vec2(
          dir.x / (0.30 + sideDepth),
          (dir.y + 0.08) / (0.42 + sideDepth)
        );
        vec2 frontal = vec2(
          dir.x / (0.38 + front),
          (dir.y + 0.10) / (0.44 + front)
        );

        float pulse = sin(uTime * 0.32) * 0.018;
        float stripeCoord = plane.x * 12.8 + pulse * poleFade;
        float stripeIndex = floor(stripeCoord + 42.0);
        float stripeFract = fract(stripeCoord + 42.0);
        vec3 stripeColor = paletteByIndex(stripeIndex);
        float wideStripe = smoothstep(0.05, 0.08, stripeFract) * (1.0 - smoothstep(0.70, 0.75, stripeFract));
        float needleStripe = hardBand(stripeFract, 0.91, 0.025) + hardBand(stripeFract, 0.18, 0.018);
        vec3 color = mix(uPaper, stripeColor, saturate(wideStripe * 0.94 * poleFade));
        color = mix(color, uBlack, saturate(needleStripe * 0.84 * poleFade));

        float diagonalA = abs(frontal.y - frontal.x * 0.38);
        float diagonalB = abs(frontal.y + frontal.x * 0.38);
        float diagonalC = abs(frontal.y - frontal.x * 0.69 - 0.19);
        float diagonalD = abs(frontal.y + frontal.x * 0.69 + 0.17);
        float blueSlash = 1.0 - smoothstep(0.040, 0.056, min(diagonalA, diagonalB));
        float orangeSlash = 1.0 - smoothstep(0.062, 0.083, min(diagonalC, diagonalD));
        float blackCut = 1.0 - smoothstep(0.014, 0.024, min(abs(frontal.y - frontal.x * 1.02), abs(frontal.y + frontal.x * 1.02)));
        color = mix(color, uBlue, blueSlash * 0.88 * poleFade);
        color = mix(color, uOrange, orangeSlash * 0.86 * poleFade);
        color = mix(color, uBlack, blackCut * 0.78 * poleFade);

        float r = length(frontal * vec2(1.03, 1.18));
        float targetWindow = smoothstep(0.0, 0.82, front) * poleFade;
        float ringMask = 0.0;
        ringMask += ring(r, 0.210, 0.018);
        ringMask += ring(r, 0.305, 0.020);
        ringMask += ring(r, 0.410, 0.023);
        ringMask += ring(r, 0.525, 0.027);
        ringMask += ring(r, 0.650, 0.031);
        ringMask += ring(r, 0.785, 0.033);
        float ringIndex = floor((r + 0.045) * 23.0);
        vec3 ringColor = paletteByIndex(ringIndex + 3.0);
        color = mix(color, ringColor, saturate(ringMask * targetWindow));
        float aperture = 1.0 - smoothstep(0.175, 0.205, r);
        color = mix(color, uPaperLight, aperture * targetWindow);
        float centralBlackEdge = ring(r, 0.225, 0.011);
        color = mix(color, uBlack, centralBlackEdge * targetWindow);

        float sideColumn = smoothstep(0.42, 0.95, abs(dir.x)) * poleFade;
        float dotX = fract(abs(plane.x) * 5.2 + 0.11);
        float dotY = fract((dir.y + 1.15) * 5.6);
        vec2 dotCell = vec2(dotX - 0.50, dotY - 0.50);
        float dot = 1.0 - smoothstep(0.135, 0.165, length(dotCell));
        float dotGate = step(0.25, dotX) * step(dotX, 0.75);
        float dotIndex = floor(abs(plane.x) * 5.2) + floor((dir.y + 1.15) * 5.6);
        vec3 dotColor = paletteByIndex(dotIndex + 2.0);
        color = mix(color, dotColor, dot * dotGate * sideColumn * 0.90);

        float fractureX = abs(frontal.x + sin(frontal.y * 9.0) * 0.018);
        float fracturedColumn = 1.0 - smoothstep(0.030, 0.052, fractureX);
        float topBreak = smoothstep(-0.08, 0.22, frontal.y) * (1.0 - smoothstep(0.72, 0.96, frontal.y));
        color = mix(color, uPaperLight, fracturedColumn * topBreak * targetWindow * 0.72);
        color = mix(color, uBlack, fracturedColumn * (1.0 - topBreak) * targetWindow * 0.56);

        float backField = back * poleFade;
        float backBands = step(0.52, fract((dir.x - dir.y * 0.22) * 10.0 + 24.0));
        color = mix(color, mix(uTeal, uViolet, backBands), backField * 0.32);

        float grain = hash12(floor((dir.xy + dir.yz * 0.37) * 180.0));
        float fiber = hash12(floor(vec2(dir.x + dir.z, dir.y - dir.x) * 78.0));
        color *= 0.965 + grain * 0.055;
        color = mix(color, color * (0.90 + fiber * 0.10), 0.30);
        color = mix(color, uBlack, (1.0 - poleFade) * 0.05);

        gl_FragColor = vec4(color, 1.0);
      }
    `})}function O(e,a,t){let r=e?.object||e,o=e?.mesh||r?.mesh||r?.children?.find(i=>i&&i.isMesh)||(r?.isMesh?r:null);return r&&(r.name="bridget-riley-roland-garros-single-enclosing-skybox",r.userData={...r.userData,partId:"world-environment",role:"world-environment",packetId:b,packetHash:v,skybox:!0,cameraPinned:!0,immersiveWorldEnvironmentShell:!0,ownsSingleSkyboxShell:!0},r.frustumCulled=!1,r.renderOrder=-1e3),o&&(o.material&&o.material!==t&&typeof o.material.dispose=="function"&&o.material.dispose(),o.name="position-space-riley-stripe-fracture-skybox-mesh",o.material=t,o.scale.setScalar(a),o.frustumCulled=!1,o.castShadow=!1,o.receiveShadow=!1,o.renderOrder=-1e3,o.userData={...o.userData,partId:"world-environment",role:"world-environment",packetId:b,packetHash:v,skybox:!0,fullSurroundSkyboxLayer:!0}),{object:r,mesh:o}}function W(e,a,t){let r=new e.BoxGeometry(2,2,2,1,1,1),o=new e.Mesh(r,t);return o.name="fallback-position-space-riley-skybox-shell",o.scale.setScalar(a),o.onBeforeRender=function(d,f,l){l&&l.position&&(o.position.copy(l.position),o.updateMatrixWorld(!0))},o}function S(e,a,t=1){return new e.MeshBasicMaterial({color:a,transparent:t<1,opacity:t,side:e.DoubleSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})}function M(e,a){return e.frustumCulled=!1,e.castShadow=!1,e.receiveShadow=!1,e.renderOrder=a,e}function j(e,a,t,r,o){let i=new e.Group;i.name="ordinary-depth-central-white-aperture-and-target-rings",i.position.set(0,.08,-14.8),i.rotation.set(.02,0,0),i.renderOrder=-120,a.add(i);let d=["#070707","#ffffff","#3f5a7c","#e97833","#544481","#ffffff","#070707"];for(let c=0;c<7;c+=1){let s=.58+c*.42,h=s+.075+c*.008,x=new e.RingGeometry(s,h,128);r.push(x);let p=S(e,d[c],.64-c*.035);o.push(p);let m=new e.Mesh(x,p);m.name=`depth-stabilized-riley-target-ring-${c+1}`,m.scale.y=.92,m.userData.baseOpacity=p.opacity,m.userData.phase=t()*Math.PI*2,M(m,-116+c),i.add(m)}let f=new e.CircleGeometry(.53,96);r.push(f);let l=S(e,"#ffffff",.78);o.push(l);let n=new e.Mesh(f,l);return n.name="central-paper-white-victory-aperture",n.userData.baseOpacity=l.opacity,n.userData.phase=t()*Math.PI*2,M(n,-108),i.add(n),i}function z(e,a,t,r,o){let i=new e.Group;i.name="ordinary-depth-cropped-diagonal-side-pressure-panels",a.add(i);let d=new e.PlaneGeometry(1,1,1,1);r.push(d);let f=[{color:"#3f5a7c",opacity:.38,position:[-7.8,1.6,-8.6],rotation:[.04,.48,-.46],scale:[11.6,.42,1]},{color:"#e97833",opacity:.4,position:[7.5,-.7,-8.2],rotation:[-.02,-.48,.5],scale:[12.5,.46,1]},{color:"#544481",opacity:.34,position:[-7,-1.9,-9.4],rotation:[.02,.42,.52],scale:[13.5,.36,1]},{color:"#ffffff",opacity:.3,position:[6.8,2.3,-9.1],rotation:[.03,-.42,-.5],scale:[12.2,.34,1]}];for(let l=0;l<f.length;l+=1){let n=f[l],c=S(e,n.color,n.opacity);o.push(c);let s=new e.Mesh(d,c);s.name=`cropped-full-bleed-diagonal-pressure-panel-${l+1}`,s.position.set(n.position[0],n.position[1],n.position[2]),s.rotation.set(n.rotation[0],n.rotation[1],n.rotation[2]),s.scale.set(n.scale[0],n.scale[1],n.scale[2]),s.userData.baseOpacity=n.opacity,s.userData.baseScaleX=n.scale[0],s.userData.phase=t()*Math.PI*2,M(s,-96+l),i.add(s)}return i}function A(e,a=[]){e.traverse?.(t=>{t.geometry&&typeof t.geometry.dispose=="function"&&t.geometry.dispose();let r=Array.isArray(t.material)?t.material:[t.material].filter(Boolean);for(let o of r)o&&typeof o.dispose=="function"&&o.dispose()});for(let t of a)t&&typeof t.dispose=="function"&&t.dispose()}function X({THREE:e,part:a,world:t,seed:r,camera:o,utilities:i}={}){let d=new e.Group;d.name="world-environment-bridget-riley-roland-garros-fracture-pressure",d.userData={partId:"world-environment",role:a?.role||"world-environment",packetId:b,packetHash:v,artist:"Bridget Riley",newsCue:"Roland-Garros first-round Grand Slam victory",visualPurpose:"single dominant skybox: matte paper, vertical stripe systems, cropped diagonals, central aperture, dotted columns, and low-pressure fracture"};let f=G(i,r||a?.id||"world-environment","bridget-riley-roland-garros-environment"),l=[],n=[],c=Number(t?.environment?.skyboxRadius||t?.environment?.radius),s=Number.isFinite(c)&&c>0?Math.max(58,Math.min(128,c)):88,h=L(e);n.push(h);let x=i&&typeof i.createSkyboxShell=="function"?i.createSkyboxShell({radius:s,name:"single-bridget-riley-roland-garros-skybox-shell",geometryKind:"box",color:"#f2ede6",opacity:1,cameraPinned:!0,userData:{partId:"world-environment",role:"world-environment",packetId:b,packetHash:v,skybox:!0,cameraPinned:!0,immersiveWorldEnvironmentShell:!0,ownsSingleSkyboxShell:!0}}):W(e,s,h),p=O(x,s,h);p.object&&d.add(p.object);let m=j(e,d,f,l,n),P=z(e,d,f,l,n);function C(g={}){let B=g.captureMode?0:Number(g.elapsedSeconds??g.time??0),y=Number.isFinite(B)?B:0,k=Number.isFinite(g.motionIntensity)?g.motionIntensity:1;h.uniforms.uTime.value=y;let w=g.camera||o;w&&w.position&&p.object?.userData?.cameraPinned&&(p.object.position.copy(w.position),p.object.updateMatrixWorld(!0)),m.rotation.z=Math.sin(y*.045)*.018*k;for(let u of m.children)u.material&&(u.material.opacity=u.userData.baseOpacity*(.96+Math.sin(y*.12+u.userData.phase)*.035*k));for(let u of P.children)u.scale.x=u.userData.baseScaleX*(1+Math.sin(y*.1+u.userData.phase)*.018*k),u.material.opacity=u.userData.baseOpacity*(.96+Math.sin(y*.09+u.userData.phase)*.04*k)}function I(){A(d,[...l,...n])}return C({captureMode:!0,elapsedSeconds:0,camera:o}),{object:d,update:C,dispose:I,userData:{partId:"world-environment",packetId:b,packetHash:v,finalDraft:"drafts/world-environment.module.mjs"}}}export{X as createImmersiveWorldPart};
