var A="art-direction-packet-fa1408e1897b",G="fa1408e1897b9e3f5b2a19ce608bfcd5";function I(e){let t=2166136261,n=String(e??"world-environment");for(let r=0;r<n.length;r+=1)t^=n.charCodeAt(r),t=Math.imul(t,16777619);return t>>>0}function L(e,t,n){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(t,n);let r=(I(t)^I(n))>>>0;return function(){r=r+1831565813>>>0;let a=r;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}function q(e){e.traverse(t=>{t.geometry&&typeof t.geometry.dispose=="function"&&t.geometry.dispose();let n=Array.isArray(t.material)?t.material:[t.material].filter(Boolean);for(let r of n)if(r){for(let o of["map","alphaMap"])r[o]&&typeof r[o].dispose=="function"&&r[o].dispose();typeof r.dispose=="function"&&r.dispose()}})}function N(e){let t=e?.environment||{},n=Number(t.skyboxRadius||t.radius||90);return Number.isFinite(n)&&n>0?Math.max(72,Math.min(96,n)):90}function Y(e,t,n){return e.name=e.name||"hudson-roland-garros-enclosing-shell",e.renderOrder=t,e.frustumCulled=!1,e.userData={...e.userData,...n,skybox:!0,skyboxShell:!0,fullSurroundSkyboxLayer:!0,cameraPinned:!0,ownsSingleEnvironmentShell:!0},e.traverse?.(r=>{r.castShadow=!1,r.receiveShadow=!1,r.frustumCulled=!1,r.renderOrder=t,r.userData={...r.userData,partId:"world-environment",role:"world-environment",packetId:A,packetHash:G}}),e}function j(e,t,n){let r=2/Math.sqrt(3),o=new e.BoxGeometry(r,r,r,1,1,1),a=new e.Mesh(o,n);return a.name="hudson-roland-garros-fallback-position-space-shell",a.scale.setScalar(t),a.onBeforeRender=function(i,d,c){c?.position&&a.position.copy(c.position)},a}function Z(e){return new e.ShaderMaterial({name:"hudson_roland_garros_single_shell_hard_edge_environment",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uBlack:{value:new e.Color("#0b0d10")},uWhite:{value:new e.Color("#f0eadf")},uWarmGray:{value:new e.Color("#8d8272")},uCoolGray:{value:new e.Color("#565b5d")},uClay:{value:new e.Color("#d94a1b")},uOrange:{value:new e.Color("#f08a10")},uYellow:{value:new e.Color("#f2c318")},uGreen:{value:new e.Color("#006a3c")},uTeal:{value:new e.Color("#008a8c")},uBlue:{value:new e.Color("#065982")},uDeepBlue:{value:new e.Color("#053049")}},vertexShader:`
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      uniform float uTime;
      uniform vec3 uBlack;
      uniform vec3 uWhite;
      uniform vec3 uWarmGray;
      uniform vec3 uCoolGray;
      uniform vec3 uClay;
      uniform vec3 uOrange;
      uniform vec3 uYellow;
      uniform vec3 uGreen;
      uniform vec3 uTeal;
      uniform vec3 uBlue;
      uniform vec3 uDeepBlue;
      varying vec3 vLocalPosition;

      float saturate(float x) { return clamp(x, 0.0, 1.0); }
      float hard(float v) { return step(0.0, v); }
      float band(float v, float width) { return 1.0 - step(width, abs(v)); }
      float softBand(float v, float width, float feather) {
        return 1.0 - smoothstep(width, width + feather, abs(v));
      }
      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float rectMask(vec2 p, vec2 c, vec2 halfSize) {
        vec2 q = abs(p - c) - halfSize;
        float outside = length(max(q, 0.0));
        float inside = min(max(q.x, q.y), 0.0);
        return 1.0 - step(0.0, outside + inside);
      }
      vec3 paintBlend(vec3 baseColor, vec3 nextColor, float mask) {
        return mix(baseColor, nextColor, saturate(mask));
      }

      void main() {
        vec3 dir = normalize(vLocalPosition);
        float side = dir.x;
        float height = dir.y;
        float depth = dir.z;
        float poleFade = 1.0 - smoothstep(0.82, 0.98, abs(height));
        float slow = sin(uTime * 0.16) * 0.018;

        vec2 front = vec2(side + depth * 0.22, height);
        vec2 shear = vec2(side * 0.86 - depth * 0.58, height + depth * 0.12);
        vec2 wrap = vec2(depth - side * 0.34, height);

        vec3 color = mix(uWarmGray, uDeepBlue, saturate(depth * 0.5 + 0.5));
        color = paintBlend(color, uTeal, hard(side + depth * 0.28 - 0.18));
        color = paintBlend(color, uClay, hard(-side - depth * 0.10 - 0.04));
        color = paintBlend(color, uOrange, hard(-height - side * 0.34 + depth * 0.18 + 0.05));
        color = paintBlend(color, uCoolGray, hard(height + side * 0.28 + depth * 0.12 - 0.44));

        float leftBlackBeam = hard(-front.y - front.x * 0.72 + 0.05) * hard(front.y + 0.10) * hard(-front.x + 0.34);
        color = paintBlend(color, uBlack, leftBlackBeam * 0.98);

        float clayChannel = hard(-front.y + front.x * 0.28 + 0.22) * hard(front.y + front.x * 0.55 + 0.06) * hard(-front.x + 0.36);
        color = paintBlend(color, uClay, clayChannel);

        float tealCounter = hard(-front.y - front.x * 0.64 - 0.07) * hard(front.x + 0.70) * hard(front.y + 0.58);
        color = paintBlend(color, uTeal, tealCounter);

        float whiteCut = band(front.y + front.x * 0.38 - 0.02, 0.026 + slow) * poleFade;
        color = paintBlend(color, uWhite, whiteCut);

        float blackCut = band(front.y + front.x * 0.72 + 0.12, 0.035) * poleFade;
        color = paintBlend(color, uBlack, blackCut);

        float yellowEdge = band(front.y - front.x * 0.20 + 0.20, 0.018) * hard(front.x - 0.02) * poleFade;
        color = paintBlend(color, uYellow, yellowEdge);

        float verticalA = band(shear.x - 0.10, 0.030) * poleFade;
        float verticalB = band(shear.x + 0.18, 0.045) * poleFade;
        float verticalC = band(shear.x - 0.30, 0.018) * poleFade;
        color = paintBlend(color, uBlack, verticalA);
        color = paintBlend(color, uGreen, verticalB);
        color = paintBlend(color, uWhite, verticalC);

        float redSlab = rectMask(shear, vec2(0.27, 0.13), vec2(0.075, 0.92));
        color = paintBlend(color, uClay, redSlab);

        float graySlab = rectMask(shear, vec2(-0.36, 0.18), vec2(0.14, 0.88));
        color = paintBlend(color, uCoolGray, graySlab);

        float radialDistance = length(front - vec2(0.42, 0.03));
        float courtRing = softBand(radialDistance - 0.52, 0.030, 0.010) * poleFade;
        float courtInner = 1.0 - step(0.34, radialDistance);
        float clippedArc = courtRing * hard(front.x - 0.02) * hard(0.70 - front.y);
        color = paintBlend(color, uWhite, clippedArc);
        color = paintBlend(color, uBlue, courtInner * hard(front.x - 0.10) * 0.88);

        float oppositeArcDistance = length(wrap - vec2(-0.40, -0.03));
        float oppositeArc = softBand(oppositeArcDistance - 0.46, 0.026, 0.010) * hard(-side - 0.02) * poleFade;
        color = paintBlend(color, uWhite, oppositeArc * 0.92);

        float zverevHalysThirdSetNotch = band(wrap.y + wrap.x * 0.34 - 0.18, 0.022) * hard(wrap.x + 0.14) * poleFade;
        color = paintBlend(color, uYellow, zverevHalysThirdSetNotch);

        float fiveSetFractureOne = band(front.y - front.x * 1.18 + 0.02, 0.020) * poleFade;
        float fiveSetFractureTwo = band(front.y - front.x * 0.86 + 0.20, 0.014) * poleFade;
        float fiveSetFractureThree = band(front.y - front.x * 1.50 - 0.20, 0.012) * poleFade;
        color = paintBlend(color, uWhite, fiveSetFractureOne * 0.88);
        color = paintBlend(color, uBlack, fiveSetFractureTwo * 0.86);
        color = paintBlend(color, uYellow, fiveSetFractureThree);

        float sideBluePlane = hard(wrap.x - 0.08) * hard(-wrap.y + 0.62) * hard(wrap.y + 0.55);
        color = paintBlend(color, uBlue, sideBluePlane * 0.82);

        float sideBlackBlock = hard(wrap.x - 0.34) * hard(-wrap.y - 0.02);
        color = paintBlend(color, uBlack, sideBlackBlock * 0.94);

        float matteGrain = hash21(floor((front + vec2(depth * 0.17, side * 0.13)) * 190.0));
        float woven = sin((side + depth) * 145.0) * sin(height * 168.0);
        float grain = (matteGrain - 0.5) * 0.045 + woven * 0.012;
        color *= 0.96 + grain;

        float vignette = 0.86 + 0.14 * poleFade;
        color *= vignette;
        color = pow(max(color, vec3(0.0)), vec3(0.94));
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function F(e,t,n=1){return new e.MeshBasicMaterial({color:t,transparent:n<1,opacity:n,side:e.DoubleSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})}function K(e,t,n,r,o,a){let s=F(e,o.color,o.opacity??1);r.push(s);let i=new e.Mesh(n,s);return i.name=o.name,i.position.set(o.position[0],o.position[1],o.position[2]),i.rotation.set(o.rotation[0],o.rotation[1],o.rotation[2]),i.scale.set(o.scale[0],o.scale[1],1),i.renderOrder=o.renderOrder??-40,i.frustumCulled=!1,i.castShadow=!1,i.receiveShadow=!1,i.userData={baseScaleX:o.scale[0],baseScaleY:o.scale[1],baseOpacity:o.opacity??1,baseRotationZ:o.rotation[2],phase:a()*Math.PI*2},t.add(i),i}function U(e){let n=new Uint8Array(16384),r=63*.5;for(let a=0;a<64;a+=1)for(let s=0;s<64;s+=1){let i=Math.hypot(s-r,a-r)/r,d=Math.max(0,Math.min(1,(1-i)/.35)),c=(a*64+s)*4;n[c]=255,n[c+1]=255,n[c+2]=255,n[c+3]=Math.round(d*d*255)}let o=new e.DataTexture(n,64,64,e.RGBAFormat);return o.needsUpdate=!0,o.wrapS=e.ClampToEdgeWrapping,o.wrapT=e.ClampToEdgeWrapping,o.minFilter=e.LinearFilter,o.magFilter=e.LinearFilter,o.generateMipmaps=!1,e.SRGBColorSpace&&(o.colorSpace=e.SRGBColorSpace),o}function X(e,t,n){let o=new Float32Array(660),a=new Float32Array(660),s=[new e.Color("#f2c318"),new e.Color("#f0eadf"),new e.Color("#d94a1b"),new e.Color("#008a8c"),new e.Color("#0b0d10")];for(let u=0;u<220;u+=1){let v=u%2===0?-1:1,g=Math.pow(t(),1.45);o[u*3]=v*(.8+g*8.4)+(t()-.5)*.9,o[u*3+1]=-3.3+t()*6.4,o[u*3+2]=-5.2-t()*12;let y=s[u%s.length];a[u*3]=y.r,a[u*3+1]=y.g,a[u*3+2]=y.b}let i=new e.BufferGeometry;i.setAttribute("position",new e.BufferAttribute(o,3)),i.setAttribute("color",new e.BufferAttribute(a,3));let d=new e.PointsMaterial({name:"matte-paint-pigment-at-pressure-intersections",size:.24,map:n,alphaMap:n,vertexColors:!0,transparent:!0,opacity:.48,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1}),c=new e.Points(i,d);return c.name="concentrated-clay-court-pigment-pressure",c.renderOrder=-30,c.frustumCulled=!1,{object:c,geometry:i,material:d}}function V(e,t){let r=new Float32Array(348),o=new Float32Array(348),a=[new e.Color("#0b0d10"),new e.Color("#f0eadf"),new e.Color("#f2c318"),new e.Color("#d94a1b")];for(let c=0;c<58;c+=1){let u=c%2===0?-1:1,v=u*(1.5+t()*8.8),g=-3.2+t()*6.2,y=-4-t()*11.5,S=v-u*(1.4+t()*4.8),x=g*.45+(t()-.5)*.7,h=c*6;r[h]=v,r[h+1]=g,r[h+2]=y,r[h+3]=S,r[h+4]=x,r[h+5]=y-t()*.7;let b=a[c%a.length];o[h]=b.r,o[h+1]=b.g,o[h+2]=b.b,o[h+3]=b.r,o[h+4]=b.g,o[h+5]=b.b}let s=new e.BufferGeometry;s.setAttribute("position",new e.BufferAttribute(r,3)),s.setAttribute("color",new e.BufferAttribute(o,3));let i=new e.LineBasicMaterial({name:"sharp-masked-hudson-contour-fracture-lines",vertexColors:!0,transparent:!0,opacity:.58,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),d=new e.LineSegments(s,i);return d.name="distributed-five-set-fracture-contour-lines",d.renderOrder=-29,d.frustumCulled=!1,{object:d,geometry:s,material:i}}function $({THREE:e,part:t,world:n,seed:r,camera:o,utilities:a}={}){let s=new e.Group;s.name="world-environment-bryce-hudson-roland-garros-pressure",s.userData={partId:"world-environment",role:t?.role||"world-environment",packetId:A,packetHash:G,artist:"Bryce Hudson",selectedNews:"Roland-Garros Djokovic eliminated by Fonseca; Zverev concedes the third set against Halys but qualifies",targetPurpose:"surrounding artist-derived atmosphere with depth, palette, light, and material cues"};let i=L(a,r||t?.id||"world-environment","hudson-roland-garros-single-shell"),d=N(n),c=Z(e),u={partId:"world-environment",role:"world-environment",packetId:A,packetHash:G,environmentRadius:d,compositionRole:"dominant full-surround hard-edge environment"},v;if(a&&typeof a.createSkyboxShell=="function"){let l=a.createSkyboxShell({radius:d,name:"single-hudson-roland-garros-geometric-pressure-shell",geometryKind:"box",color:"#0b0d10",opacity:1,cameraPinned:!0,userData:u});v=l.object||l;let p=l.mesh||v.mesh||v.children?.find(m=>m?.isMesh);p&&(p.material&&typeof p.material.dispose=="function"&&p.material.dispose(),p.material=c,p.name="position-space-hard-edge-hudson-shell-mesh",p.scale.setScalar(d),p.renderOrder=-1e3,p.frustumCulled=!1),v.material=c}else v=j(e,d,c);Y(v,-1e3,u),s.add(v);let g=[c],y=[],S=new e.PlaneGeometry(1,1,1,1);y.push(S);let x=new e.Group;x.name="ordinary-depth-hudson-geometric-pressure-cues",s.add(x);let b=[{name:"low-orange-clay-court-diagonal-pressure-plane",color:"#f08a10",opacity:.5,position:[-2.8,-1.84,-7.2],rotation:[.04,.1,-.44],scale:[16.4,1.65],renderOrder:-52},{name:"heavy-black-djokovic-elimination-rebound-slab",color:"#0b0d10",opacity:.7,position:[-4.8,.98,-8.4],rotation:[.02,.25,-.33],scale:[13.8,1.05],renderOrder:-51},{name:"cool-teal-fonseca-counter-thrust-plane",color:"#008a8c",opacity:.52,position:[4.6,-1.05,-8.8],rotation:[.03,-.22,.4],scale:[14.4,1.18],renderOrder:-50},{name:"thin-yellow-third-set-concession-edge",color:"#f2c318",opacity:.78,position:[2.6,.54,-5.7],rotation:[.02,-.04,.58],scale:[9.8,.16],renderOrder:-45},{name:"white-masked-scoreline-cut-through-pressure",color:"#f0eadf",opacity:.66,position:[-.4,-.3,-5.45],rotation:[.01,.02,-.58],scale:[11.2,.22],renderOrder:-44},{name:"green-qualifies-but-bent-vertical-interruption",color:"#006a3c",opacity:.48,position:[.98,1.05,-6.3],rotation:[.03,-.06,1.55],scale:[5.8,.56],renderOrder:-43},{name:"deep-blue-cropped-right-pressure-block",color:"#053049",opacity:.52,position:[7.9,1.5,-10.4],rotation:[.03,-.52,.04],scale:[8.6,4.8],renderOrder:-56},{name:"warm-gray-left-architectural-flat-field",color:"#8d8272",opacity:.42,position:[-8,1.84,-10.2],rotation:[.03,.48,-.02],scale:[8.4,4.6],renderOrder:-57}].map(l=>K(e,x,S,g,l,i)),D=[F(e,"#f0eadf",.44),F(e,"#0b0d10",.38),F(e,"#f2c318",.42)];g.push(...D);let C=new e.Group;C.name="cropped-roland-garros-circular-boundary-depth-cues",s.add(C);for(let l=0;l<5;l+=1){let p=1.35+l*.72,m=new e.RingGeometry(p,p+.045+l*.004,128,1,Math.PI*(.1+l*.04),Math.PI*(1.18+l*.05));y.push(m);let w=new e.Mesh(m,D[l%D.length]);w.name=`cropped-court-boundary-pressure-arc-${l+1}`,w.position.set(-.35+l*.18,-.62-l*.08,-5.9-l*.68),w.rotation.set(.08,-.04,-.38+l*.12),w.scale.y=.62,w.renderOrder=-38+l,w.frustumCulled=!1,w.userData={baseRotationZ:w.rotation.z,baseOpacity:w.material.opacity,phase:i()*Math.PI*2},C.add(w)}let O=U(e),M=X(e,i,O);s.add(M.object),g.push(M.material),y.push(M.geometry);let k=V(e,i);s.add(k.object),g.push(k.material),y.push(k.geometry);function z(l={}){let p=l.captureMode?0:Number(l.elapsedSeconds??l.time??0),m=Number.isFinite(p)?p:0;c.uniforms.uTime.value=m;let w=Math.sin(m*.16)*.012;for(let B=0;B<b.length;B+=1){let f=b[B],P=f.userData.phase||0,W=Math.sin(m*.12+P);f.scale.x=f.userData.baseScaleX*(1+W*.01),f.scale.y=f.userData.baseScaleY*(1+w*(B%2===0?1:-1)),f.rotation.z=f.userData.baseRotationZ+W*.004,f.material.opacity=f.userData.baseOpacity*(.96+Math.sin(m*.1+P)*.025)}for(let B=0;B<C.children.length;B+=1){let f=C.children[B];f.rotation.z=f.userData.baseRotationZ+Math.sin(m*.06+f.userData.phase)*.01,f.material.opacity=f.userData.baseOpacity*(.94+Math.sin(m*.11+B)*.04)}M.object.rotation.y=Math.sin(m*.035)*.026,k.object.rotation.z=Math.sin(m*.045)*.01,l.camera?.position&&o?.position&&o.position.copy(l.camera.position)}function _(){q(s);for(let l of y)l.dispose?.();for(let l of g)l.dispose?.();O.dispose?.()}return z({captureMode:!0,elapsedSeconds:0}),{object:s,update:z,dispose:_}}export{$ as createImmersiveWorldPart};
