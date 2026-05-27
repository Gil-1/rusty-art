var L="art-direction-packet-b0745a628a65",G="b0745a628a654ee3b8ee3585dd423aec";function A(e){let c=String(e??"world-environment"),s=2166136261;for(let a=0;a<c.length;a+=1)s^=c.charCodeAt(a),s=Math.imul(s,16777619);return s>>>0}function F(e,c,s){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(c,s);let a=(A(c)^A(s))>>>0;return function(){a=a+1831565813>>>0;let o=a;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296}}function M(e){return Math.max(0,Math.min(1,e))}function C(e,c){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=c,e}function I(e,c=[]){let s=new Set(c.filter(o=>o&&o.isBufferGeometry)),a=new Set(c.filter(o=>o&&o.isMaterial)),n=new Set(c.filter(o=>o&&o.isTexture));e.traverse(o=>{o.geometry&&s.add(o.geometry);let i=Array.isArray(o.material)?o.material:[o.material].filter(Boolean);for(let l of i){a.add(l);for(let d of Object.values(l))d&&d.isTexture&&n.add(d)}});for(let o of s)typeof o.dispose=="function"&&o.dispose();for(let o of n)typeof o.dispose=="function"&&o.dispose();for(let o of a)typeof o.dispose=="function"&&o.dispose()}function V(e,c,s){let a=2/Math.sqrt(3),n=new e.BoxGeometry(a,a,a,1,1,1),o=new e.Mesh(n,s);o.name="pastine-position-space-skybox-fallback-mesh",o.scale.setScalar(c),o.onBeforeRender=function(d,t,u){u&&u.position&&(i.position.copy(u.position),i.updateMatrixWorld(!0))},C(o,-1e3);let i=new e.Group;return i.name="single-pastine-roland-garros-panel-pressure-skybox",i.userData={partId:"world-environment",role:"world-environment",packetId:L,packetHash:G,skybox:!0,cameraPinned:!0,immersiveWorldEnvironmentShell:!0,ownsSingleSkyboxShell:!0},i.add(o),i.object=i,i.mesh=o,i.material=s,i.geometry=n,i}function _(e,c,s){let a=e?.object||e,n=e?.mesh||a?.mesh||a?.children?.find(o=>o&&o.isMesh);return a&&(a.name="single-pastine-roland-garros-panel-pressure-skybox",a.userData={...a.userData,partId:"world-environment",role:"world-environment",packetId:L,packetHash:G,skybox:!0,cameraPinned:!0,immersiveWorldEnvironmentShell:!0,ownsSingleSkyboxShell:!0,artist:"Ruth Pastine",selectedNews:"Alexander Blockx twists his foot in a Roland-Garros tarpaulin"},a.traverse?.(o=>C(o,-1e3)),a.renderOrder=-1e3),n&&(n.material&&n.material!==s&&typeof n.material.dispose=="function"&&n.material.dispose(),n.name="pastine-position-space-gradient-panel-skybox-mesh",n.material=s,n.scale.setScalar(c),C(n,-1e3)),{object:a,mesh:n}}function j(e){return new e.ShaderMaterial({name:"pastine_roland_garros_single_shell_position_space",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uPaper:{value:new e.Color("#f1f1f1")},uPaperWarm:{value:new e.Color("#fbfbfa")},uLightBlue:{value:new e.Color("#d1d4db")},uLineGrey:{value:new e.Color("#42423c")},uRedEdge:{value:new e.Color("#5e1509")},uRedCore:{value:new e.Color("#f28b18")},uBlueEdge:{value:new e.Color("#05050a")},uBlueCore:{value:new e.Color("#0057c8")},uVioletEdge:{value:new e.Color("#151022")},uVioletCore:{value:new e.Color("#9060b7")},uYellowEdge:{value:new e.Color("#89913c")},uYellowCore:{value:new e.Color("#f2e76b")}},vertexShader:`
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;

      varying vec3 vLocalPosition;

      uniform float uTime;
      uniform vec3 uPaper;
      uniform vec3 uPaperWarm;
      uniform vec3 uLightBlue;
      uniform vec3 uLineGrey;
      uniform vec3 uRedEdge;
      uniform vec3 uRedCore;
      uniform vec3 uBlueEdge;
      uniform vec3 uBlueCore;
      uniform vec3 uVioletEdge;
      uniform vec3 uVioletCore;
      uniform vec3 uYellowEdge;
      uniform vec3 uYellowCore;

      float saturate(float value) {
        return clamp(value, 0.0, 1.0);
      }

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float rectMask(vec2 uv, vec2 center, vec2 halfSize, float feather) {
        vec2 distToEdge = halfSize - abs(uv - center);
        float inside = smoothstep(0.0, feather, min(distToEdge.x, distToEdge.y));
        return inside;
      }

      float rectBorder(vec2 uv, vec2 center, vec2 halfSize, float width) {
        vec2 distToEdge = halfSize - abs(uv - center);
        float innerDistance = min(distToEdge.x, distToEdge.y);
        return saturate(1.0 - smoothstep(width * 0.35, width, innerDistance));
      }

      vec3 panelField(vec2 uv, vec2 center, vec2 halfSize, vec3 edgeColor, vec3 coreColor, float pulse, out float maskOut) {
        float mask = rectMask(uv, center, halfSize, 0.012);
        vec2 local = (uv - center) / max(halfSize, vec2(0.001));
        float radial = saturate(1.0 - dot(local, local) * 0.58);
        float vertical = saturate(0.55 + local.y * 0.24);
        float glow = pow(radial, 1.25) * (0.84 + pulse * 0.08);
        float border = rectBorder(uv, center, halfSize, 0.075);
        vec3 color = mix(edgeColor, coreColor, saturate(glow * 0.94 + vertical * 0.15));
        color = mix(color, edgeColor, border * 0.82);
        color += coreColor * pow(radial, 5.0) * 0.20;
        maskOut = mask;
        return color;
      }

      vec3 addPanel(vec3 base, vec2 uv, vec2 center, vec2 halfSize, vec3 edgeColor, vec3 coreColor, float amount, float pulse) {
        float mask = 0.0;
        vec3 color = panelField(uv, center, halfSize, edgeColor, coreColor, pulse, mask);
        return mix(base, color, mask * amount);
      }

      float creaseLine(vec2 uv, float slope, float intercept, float width) {
        float distanceToLine = abs(uv.y - (uv.x * slope + intercept));
        return 1.0 - smoothstep(width * 0.35, width, distanceToLine);
      }

      vec2 faceUvFromDirection(vec3 dir) {
        float ax = abs(dir.x);
        float az = abs(dir.z);
        if (az >= ax) {
          return vec2(dir.x / max(az, 0.001), dir.y / max(az, 0.001));
        }
        return vec2(-dir.z / max(ax, 0.001), dir.y / max(ax, 0.001));
      }

      void main() {
        vec3 dir = normalize(vLocalPosition);
        vec2 uv = faceUvFromDirection(dir);
        float topFade = smoothstep(-0.95, 0.88, dir.y);
        float sideCool = smoothstep(0.18, 0.95, abs(dir.x));
        float floorCool = smoothstep(-0.08, -0.86, dir.y);
        float pulse = sin(uTime * 0.18) * 0.5 + 0.5;

        vec3 color = mix(uLightBlue, uPaper, topFade);
        color = mix(color, uPaperWarm, 0.26 + 0.12 * dir.z);
        color = mix(color, uLightBlue, sideCool * 0.22 + floorCool * 0.18);

        float noise = hash21(floor(uv * 96.0) + vec2(7.0, 19.0));
        color += (noise - 0.5) * 0.025;

        color = addPanel(color, uv, vec2(-0.54, 0.08), vec2(0.36, 0.62), uRedEdge, uRedCore, 0.92, pulse);
        color = addPanel(color, uv, vec2(0.02, -0.42), vec2(0.45, 0.26), uBlueEdge, uBlueCore, 0.90, 1.0 - pulse);
        color = addPanel(color, uv, vec2(0.62, 0.12), vec2(0.25, 0.57), uVioletEdge, uVioletCore, 0.88, pulse);
        color = addPanel(color, uv, vec2(-0.05, 0.19), vec2(0.11, 0.70), uYellowEdge, uYellowCore, 0.78, 1.0 - pulse);
        color = addPanel(color, uv, vec2(0.34, 0.41), vec2(0.34, 0.23), uPaperWarm * 0.86, uPaperWarm, 0.72, pulse);
        color = addPanel(color, uv, vec2(0.42, 0.08), vec2(0.08, 0.68), uLightBlue * 0.78, uLightBlue * 1.05, 0.64, pulse);

        float seam = creaseLine(uv, -0.19, 0.055 + sin(uTime * 0.07) * 0.004, 0.017);
        float seamShadow = creaseLine(uv + vec2(0.012, -0.018), -0.19, 0.055, 0.022);
        color = mix(color, uPaperWarm, seamShadow * 0.18);
        color = mix(color, uLineGrey, seam * 0.52);

        float verticalBoundary = 0.0;
        verticalBoundary += creaseLine(vec2(uv.y, uv.x), 0.0, -0.185, 0.008) * 0.25;
        verticalBoundary += creaseLine(vec2(uv.y, uv.x), 0.0, 0.475, 0.008) * 0.20;
        color = mix(color, uLineGrey, verticalBoundary);

        float vignette = smoothstep(1.42, 0.18, length(uv * vec2(0.88, 0.72)));
        color = mix(color * 0.88, color, 0.78 + vignette * 0.22);
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    `})}function O(e,c,s,a,n={}){let o=n.width||128,i=n.height||128,l=n.alphaScale??.95,d=n.centerBoost??.18,t=new e.Color(s),u=new e.Color(a),p=new Uint8Array(o*i*4);for(let h=0;h<i;h+=1)for(let m=0;m<o;m+=1){let w=(m+.5)/o,y=(h+.5)/i,P=Math.abs(w-.5)*2,B=Math.abs(y-.5)*2,k=Math.min(w,1-w,y,1-y),z=1-M(k/.14),W=M(1-(P*P*.74+B*B*.86)),v=.92+c()*.05+Math.sin(m*.11+h*.07)*.018,b=M(W*.83+d-z*.46),g=(u.r*(1-b)+t.r*b)*v,x=(u.g*(1-b)+t.g*b)*v,D=(u.b*(1-b)+t.b*b)*v,f=l*M(k/.025),S=(h*o+m)*4;p[S]=Math.round(M(g)*255),p[S+1]=Math.round(M(x)*255),p[S+2]=Math.round(M(D)*255),p[S+3]=Math.round(f*255)}let r=new e.DataTexture(p,o,i,e.RGBAFormat);return r.needsUpdate=!0,r.wrapS=e.ClampToEdgeWrapping,r.wrapT=e.ClampToEdgeWrapping,r.minFilter=e.LinearFilter,r.magFilter=e.LinearFilter,e.SRGBColorSpace&&(r.colorSpace=e.SRGBColorSpace),r}function Y(e,c,s,a,n,o){let i=new e.PlaneGeometry(1,1,1,1);a.push(i);let l=new e.Group;l.name="pastine-large-matte-depth-panels-and-negative-space",c.add(l);let d=[{name:"large-left-roland-garros-clay-orange-pressure-panel",color:"#f28b18",edge:"#5e1509",opacity:.88,position:[-6.9,.56,-10.8],rotation:[.015,.16,-.006],scale:[7.8,6.2,1],order:-88},{name:"low-centered-deep-blue-backlit-pressure-panel",color:"#0057c8",edge:"#05050a",opacity:.82,position:[1.1,-1.84,-11.4],rotation:[0,-.035,.002],scale:[6.9,3.8,1],order:-86},{name:"right-violet-soft-center-incident-field",color:"#9060b7",edge:"#151022",opacity:.78,position:[7,.28,-10.2],rotation:[-.01,-.18,.006],scale:[4.7,6.3,1],order:-84},{name:"narrow-yellow-green-tarpaulin-pressure-slab",color:"#f2e76b",edge:"#89913c",opacity:.72,position:[-1.92,.18,-9.8],rotation:[0,.02,.006],scale:[1.65,7.6,1],order:-82},{name:"pale-negative-space-paper-panel",color:"#fbfbfa",edge:"#d1d4db",opacity:.5,position:[2.28,2.03,-12.1],rotation:[0,-.05,-.003],scale:[7,2.9,1],order:-90},{name:"right-light-muted-blue-vertical-spacer",color:"#d1d4db",edge:"#b9bec9",opacity:.58,position:[5.14,.28,-8.9],rotation:[0,-.1,.003],scale:[1.08,6.8,1],order:-83}];for(let t of d){let u=O(e,s,t.color,t.edge,{width:128,height:128,alphaScale:t.opacity,centerBoost:.22});o.push(u);let p=new e.MeshBasicMaterial({name:`${t.name}-matte-gradient-material`,map:u,transparent:!0,opacity:1,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});n.push(p);let r=new e.Mesh(i,p);r.name=t.name,r.position.set(t.position[0],t.position[1],t.position[2]),r.rotation.set(t.rotation[0],t.rotation[1],t.rotation[2]),r.scale.set(t.scale[0],t.scale[1],t.scale[2]),r.userData={baseScaleX:t.scale[0],baseScaleY:t.scale[1],baseOpacity:t.opacity,phase:s()*Math.PI*2},C(r,t.order),l.add(r)}return l}function N(e,c,s,a){let n=new e.Group;n.name="low-mid-grey-tarpaulin-crease-pressure-lines",c.add(n);let o=[new e.Vector3(-9.6,1.16,-6.7),new e.Vector3(-5.4,.72,-7.9),new e.Vector3(-1.4,.24,-8.8),new e.Vector3(2.8,-.18,-9.9),new e.Vector3(7.8,-.62,-10.7)],i=new e.CatmullRomCurve3(o,!1,"centripetal",.28),l=new e.TubeGeometry(i,96,.018,8,!1);s.push(l);let d=new e.MeshBasicMaterial({name:"soft-low-mid-grey-tarpaulin-fracture-line-material",color:"#42423c",transparent:!0,opacity:.72,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});a.push(d);let t=new e.Mesh(l,d);t.name="measured-diagonal-fracture-pressure-crease",t.userData={baseOpacity:.72,phase:.4},C(t,-48),n.add(t);let u=new e.TubeGeometry(i,96,.009,8,!1);s.push(u);let p=new e.MeshBasicMaterial({name:"pale-raised-edge-along-tarpaulin-crease-material",color:"#fbfbfa",transparent:!0,opacity:.34,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});a.push(p);let r=new e.Mesh(u,p);return r.name="pale-raised-edge-beside-diagonal-crease",r.position.set(.05,.05,.02),r.userData={baseOpacity:.34,phase:1.7},C(r,-47),n.add(r),n}function U(e,c,s,a,n){let o=new e.BufferGeometry;a.push(o);let i=220,l=new Float32Array(i*3),d=new Float32Array(i*3),t=[new e.Color("#f0f0ee"),new e.Color("#d1d4db"),new e.Color("#42423c"),new e.Color("#f2e76b"),new e.Color("#0057c8")];for(let r=0;r<i;r+=1){let h=s()*Math.PI*2,m=6+s()*10.5;l[r*3]=Math.sin(h)*m,l[r*3+1]=-2.9+s()*6,l[r*3+2]=Math.cos(h)*m-4-s()*8;let w=t[r%t.length];d[r*3]=w.r,d[r*3+1]=w.g,d[r*3+2]=w.b}o.setAttribute("position",new e.BufferAttribute(l,3)),o.setAttribute("color",new e.BufferAttribute(d,3));let u=new e.PointsMaterial({name:"subtle-pastel-paper-pigment-air-points",size:.13,transparent:!0,opacity:.36,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});n.push(u);let p=new e.Points(o,u);return p.name="sparse-floating-paper-grain-in-negative-space",C(p,-34),c.add(p),p}function K({THREE:e,part:c,world:s,seed:a,assets:n,camera:o,utilities:i}={}){let l=new e.Group;l.name="world-environment-ruth-pastine-roland-garros-tarpaulin-pressure",l.userData={partId:"world-environment",role:c?.role||"world-environment",packetId:L,packetHash:G,artist:"Ruth Pastine",targetVisual:"surrounding artist-derived atmosphere with depth, palette, light, and material cues",selectedNews:"Alexander Blockx twists his foot in a tarpaulin at Roland-Garros",finalDraft:"drafts/world-environment.module.mjs"};let d=F(i,a||c?.id||"world-environment","ruth-pastine-roland-garros-world-environment"),t=[],u=[],p=[],r=Number(s?.environment?.skyboxRadius||s?.environment?.radius),h=Number.isFinite(r)&&r>0?Math.max(68,Math.min(132,r)):92,m=j(e);u.push(m);let w=i&&typeof i.createSkyboxShell=="function"?i.createSkyboxShell({radius:h,name:"single-pastine-roland-garros-panel-pressure-skybox",geometryKind:"box",material:m,color:"#f1f1f1",opacity:1,cameraPinned:!0,userData:{partId:"world-environment",role:"world-environment",packetId:L,packetHash:G,artist:"Ruth Pastine",skybox:!0,cameraPinned:!0,immersiveWorldEnvironmentShell:!0,ownsSingleSkyboxShell:!0}}):V(e,h,m),y=_(w,h,m);y.object&&l.add(y.object);let P=Y(e,l,d,t,u,p),B=N(e,l,t,u),k=U(e,l,d,t,u);function z(v={}){let b=v.captureMode?0:Number(v.elapsedSeconds??v.time??0),g=Number.isFinite(b)?b:0,x=Number.isFinite(v.motionIntensity)?v.motionIntensity:1;m.uniforms.uTime.value=g;let D=v.camera||o;D&&D.position&&y.object?.userData?.cameraPinned&&(y.object.position.copy(D.position),y.object.updateMatrixWorld(!0)),P.rotation.z=Math.sin(g*.035)*.006*x;for(let f of P.children){let S=Math.sin(g*.14+f.userData.phase)*x;f.scale.x=f.userData.baseScaleX*(1+S*.012),f.scale.y=f.userData.baseScaleY*(1+Math.cos(g*.11+f.userData.phase)*.01*x),f.material&&(f.material.opacity=.97+S*.025)}B.rotation.z=Math.sin(g*.052)*.008*x;for(let f of B.children)f.material&&(f.material.opacity=f.userData.baseOpacity*(.96+Math.sin(g*.18+f.userData.phase)*.03*x));k.rotation.y=Math.sin(g*.024)*.035*x,k.material&&(k.material.opacity=.32+Math.sin(g*.12)*.025*x)}function W(){I(l,[...t,...u,...p])}return z({captureMode:!0,elapsedSeconds:0,camera:o}),{object:l,update:z,dispose:W,userData:{partId:"world-environment",packetId:L,packetHash:G,finalDraft:"drafts/world-environment.module.mjs"}}}var q=K;export{K as createImmersiveWorldPart,q as default};
