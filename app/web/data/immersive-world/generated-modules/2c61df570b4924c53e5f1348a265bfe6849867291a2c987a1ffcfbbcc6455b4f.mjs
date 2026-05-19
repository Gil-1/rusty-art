var g="art-direction-packet-983f4bd5f8b1",x="983f4bd5f8b14427d2eec07e5249dee9",M=Math.PI*2;function k(e){let o=String(e??"world-environment"),i=2166136261;for(let a=0;a<o.length;a+=1)i^=o.charCodeAt(a),i=Math.imul(i,16777619);return i>>>0}function z(e){let o=e>>>0;return function(){o=o+1831565813>>>0;let a=o;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}function P(e,o,i){return e&&typeof e.createSeededRandom=="function"?e.createSeededRandom(o,i):z(k(`${o??""}:${i}`))}function S(e,o,i=1){let a=(o()*2-1)*i,t=o()*M,n=Math.sqrt(Math.max(.001,1-a*a));return new e.Vector3(Math.cos(t)*n,a,Math.sin(t)*n).normalize()}function B(e){let i=new Uint8Array(9216),a=47*.5;for(let n=0;n<48;n+=1)for(let s=0;s<48;s+=1){let r=(s-a)/a,p=(n-a)/a,f=Math.sqrt(r*r+p*p),m=Math.max(0,1-f),l=Math.max(0,1-Math.abs(Math.sin((s*12.9898+n*78.233)*.11))*.34),u=Math.pow(m,2.2)*l,d=(n*48+s)*4;i[d]=255,i[d+1]=255,i[d+2]=255,i[d+3]=Math.round(u*255)}let t=new e.DataTexture(i,48,48,e.RGBAFormat);return t.name="dry-pastel-soft-sprite",t.magFilter=e.LinearFilter,t.minFilter=e.LinearFilter,t.wrapS=e.ClampToEdgeWrapping,t.wrapT=e.ClampToEdgeWrapping,t.generateMipmaps=!1,t.needsUpdate=!0,t}function C(e,o){return new e.ShaderMaterial({name:"carroll-dunham-tegen-position-space-paper-skybox",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uSeed:{value:o%997/997},uPaper:{value:new e.Color("#e5dac6")},uWarm:{value:new e.Color("#b88b58")},uInk:{value:new e.Color("#17110d")},uViolet:{value:new e.Color("#7a3a82")},uBlue:{value:new e.Color("#145fc2")},uYellow:{value:new e.Color("#e4c314")},uPink:{value:new e.Color("#cf6a9b")},uRed:{value:new e.Color("#d7472e")},uGreen:{value:new e.Color("#348446")}},vertexShader:`
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision mediump float;
      uniform float uTime;
      uniform float uSeed;
      uniform vec3 uPaper;
      uniform vec3 uWarm;
      uniform vec3 uInk;
      uniform vec3 uViolet;
      uniform vec3 uBlue;
      uniform vec3 uYellow;
      uniform vec3 uPink;
      uniform vec3 uRed;
      uniform vec3 uGreen;
      varying vec3 vPosition;

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
        float amp = 0.5;
        for (int i = 0; i < 4; i += 1) {
          value += noise3(p) * amp;
          p = p * 2.03 + vec3(4.7, 1.9, 3.1);
          amp *= 0.52;
        }
        return value;
      }

      float lineMask(float value, float frequency, float width) {
        float wave = abs(sin(value * frequency));
        return smoothstep(width, 0.0, wave);
      }

      float boxMask(vec2 p, vec2 center, vec2 halfSize, float feather) {
        vec2 d = abs(p - center) - halfSize;
        float outside = length(max(d, 0.0));
        float inside = min(max(d.x, d.y), 0.0);
        return 1.0 - smoothstep(0.0, feather, outside + inside);
      }

      float diagonalBand(vec2 p, float slope, float offset, float width) {
        float d = abs(p.y - (p.x * slope + offset));
        return smoothstep(width, 0.0, d);
      }

      void main() {
        vec3 dir = normalize(vPosition);
        vec3 p = dir * 3.0;
        vec3 warp = vec3(
          fbm(p.yzx * 1.25 + 2.0),
          fbm(p.zxy * 1.35 + 7.0),
          fbm(p.xyz * 1.15 + 11.0)
        );
        vec3 q = p + (warp - 0.5) * 0.55;
        float poleDetailFade = 1.0 - smoothstep(0.78, 0.97, abs(dir.y));
        float poleBlend = smoothstep(0.84, 0.985, abs(dir.y));

        float paperGrain = fbm(q * 5.4 + vec3(1.0, 2.0, 3.0));
        float dirtyWash = fbm(q * 1.35 + vec3(3.0, 0.0, 9.0));
        vec3 color = mix(uPaper, uWarm, 0.22 + dirtyWash * 0.24);
        color *= 0.78 + paperGrain * 0.34;
        color = mix(color, vec3(0.92, 0.89, 0.78), smoothstep(0.55, 1.0, dir.y) * 0.32);
        color = mix(color, vec3(0.75, 0.66, 0.55), smoothstep(-0.15, -0.92, dir.y) * 0.42);

        vec2 side = dir.xz;
        float frontMass = boxMask(vec2(dir.x, dir.y), vec2(0.0, -0.05), vec2(0.36, 0.47), 0.20) * smoothstep(-0.12, -0.78, dir.z);
        float rearMass = boxMask(vec2(dir.z, dir.y), vec2(0.0, -0.03), vec2(0.34, 0.42), 0.22) * smoothstep(-0.08, -0.76, dir.x);
        float violetMass = max(frontMass, rearMass) * (0.78 + 0.22 * fbm(q * 7.0));
        color = mix(color, uViolet, violetMass * 0.88);

        float bluePanelA = boxMask(vec2(dir.x, dir.y), vec2(-0.42, -0.36), vec2(0.24, 0.22), 0.10) * smoothstep(-0.18, -0.72, dir.z);
        float bluePanelB = boxMask(vec2(dir.z, dir.y), vec2(0.38, -0.34), vec2(0.25, 0.24), 0.11) * smoothstep(0.16, 0.78, dir.x);
        color = mix(color, uBlue, max(bluePanelA, bluePanelB) * 0.72);

        float yellowWedge = diagonalBand(vec2(dir.x, dir.y), 0.42, -0.08, 0.17) * smoothstep(0.12, 0.88, dir.x) * smoothstep(-0.95, -0.20, dir.z);
        float redWedge = diagonalBand(vec2(dir.x, dir.y), -0.55, -0.10, 0.12) * smoothstep(-0.10, -0.86, dir.x) * smoothstep(-0.88, -0.12, dir.z);
        float pinkPlane = boxMask(vec2(dir.z, dir.y), vec2(-0.42, 0.03), vec2(0.30, 0.26), 0.14) * smoothstep(0.18, 0.82, dir.x);
        color = mix(color, uYellow, yellowWedge * 0.96);
        color = mix(color, uRed, redWedge * 0.90);
        color = mix(color, uPink, pinkPlane * 0.74);

        float xGrid = lineMask(q.x + fbm(q * 2.0) * 0.10, 17.0, 0.055);
        float yGrid = lineMask(q.y + fbm(q.zxy * 2.2) * 0.10, 18.5, 0.050);
        float zGrid = lineMask(q.z + fbm(q.yxz * 1.8) * 0.08, 15.0, 0.054);
        float cage = clamp(max(xGrid * 0.62, yGrid * 0.78) + zGrid * 0.52, 0.0, 1.0) * poleDetailFade;

        float hatchA = lineMask((q.x + q.y * 0.62 + q.z * 0.20), 44.0, 0.036);
        float hatchB = lineMask((q.z - q.y * 0.76 + q.x * 0.18), 51.0, 0.030);
        float hatchNoise = smoothstep(0.34, 0.78, fbm(q * 4.8 + vec3(8.0, 1.0, 2.0)));
        float hatching = clamp((hatchA * 0.48 + hatchB * 0.38) * hatchNoise * poleDetailFade, 0.0, 1.0);

        float frameTop = smoothstep(0.045, 0.0, abs(abs(dir.y) - 0.62)) * (0.55 + 0.45 * smoothstep(0.05, 0.82, length(side)));
        float frameSides = smoothstep(0.035, 0.0, min(abs(abs(dir.x) - 0.82), abs(abs(dir.z) - 0.82))) * smoothstep(-0.64, 0.22, dir.y);
        float frontFrame = smoothstep(-0.18, -0.74, dir.z) * (
          smoothstep(0.030, 0.0, abs(abs(dir.x) - 0.47)) * smoothstep(-0.54, 0.60, dir.y) +
          smoothstep(0.034, 0.0, abs(abs(dir.y) - 0.38)) * smoothstep(-0.58, 0.58, dir.x)
        );
        float blackBars = clamp(frameTop + frameSides + frontFrame, 0.0, 1.0) * poleDetailFade;

        float smallAccent = smoothstep(0.965, 1.0, fbm(q * 18.0 + vec3(0.0, 5.0, 2.0))) * smoothstep(-0.65, 0.72, dir.y) * poleDetailFade;
        vec3 accentColor = mix(uYellow, mix(uRed, uGreen, step(0.52, fbm(q * 9.0))), step(0.66, fbm(q * 13.0)));

        float ink = clamp(cage * 0.58 + hatching * 0.42 + blackBars * 0.92, 0.0, 1.0);
        color = mix(color, uInk, ink * 0.94);
        color = mix(color, accentColor, smallAccent * 0.54);

        float pressurePulse = 0.96 + 0.04 * sin(uTime * 0.9 + uSeed * 6.283);
        color = color * pressurePulse + vec3(0.025, 0.018, 0.010);

        vec3 poleWash = mix(vec3(0.86, 0.80, 0.67), vec3(0.48, 0.37, 0.31), smoothstep(0.0, 1.0, abs(dir.y)));
        color = mix(color, poleWash, poleBlend * 0.55);
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function D(e,o,i,a){let t=Math.max(34,Math.min(90,Number(i?.environment?.skyboxRadius||i?.environment?.radius||54))),n;if(o&&typeof o.createSkyboxShell=="function")n=o.createSkyboxShell({THREE:e,radius:t,name:"carroll-dunham-tegen-single-position-space-skybox",geometryKind:"box",color:"#e5dac6",opacity:1,cameraPinned:!0,userData:{partId:"world-environment",packetId:g,packetHash:x}});else{let p=new e.BoxGeometry(2/Math.sqrt(3),2/Math.sqrt(3),2/Math.sqrt(3),1,1,1),f=new e.Mesh(p,a);f.name="carroll-dunham-tegen-single-position-space-skybox-mesh",f.frustumCulled=!1,f.castShadow=!1,f.receiveShadow=!1,f.onBeforeRender=function(l,u,d){d&&(n.position.copy(d.position),n.updateMatrixWorld(!0))},n=new e.Group,n.name="carroll-dunham-tegen-single-position-space-skybox",n.scale.setScalar(t),n.add(f),n.mesh=f,n.material=a,n.geometry=p,n.object=n}let s=n.object||n,r=n.mesh||s.mesh||s.children?.find(p=>p?.isMesh);return r&&(r.material&&r.material!==a&&typeof r.material.dispose=="function"&&r.material.dispose(),r.material=a,r.frustumCulled=!1,r.castShadow=!1,r.receiveShadow=!1,r.renderOrder=-1e3),s.name="world-environment-carroll-dunham-tegen-skybox-shell",s.userData={...s.userData,partId:"world-environment",packetId:g,packetHash:x,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0},s.mesh=r,s.material=a,s.object=s,s}function A(e,o){let i=new e.Group;i.name="mid-distance-saturated-dunham-pressure-planes";let a=new e.PlaneGeometry(1,1,1,1);i.userData.disposableGeometries=[a];let t=[["violet-rounded-stage-block","#7a3a82",.46,9.8,6.1,.1],["cobalt-side-pressure-panel","#145fc2",.42,8.6,4.7,1.28],["yellow-diagonal-pressure-panel","#e4c314",.44,10.4,3.2,2.37],["pink-counter-plane","#cf6a9b",.36,7.8,3.8,3.76],["red-opposing-flow-plane","#d7472e",.38,9.4,2.6,4.64],["green-low-crowd-plane","#348446",.3,6.8,2.8,5.42]];i.userData.disposableMaterials=[];for(let[n,s,r,p,f,m]of t){let l=10.5+o()*5.5,u=-1.35+o()*3.2,d=new e.Vector3(Math.cos(m)*l,u,Math.sin(m)*l),h=new e.MeshBasicMaterial({name:`${n}-matte-wash`,color:s,transparent:!0,opacity:r,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});i.userData.disposableMaterials.push(h);let c=new e.Mesh(a,h);c.name=n,c.position.copy(d),c.lookAt(0,0,0),c.rotateZ((o()-.5)*.42),c.scale.set(p*(.92+o()*.22),f*(.9+o()*.2),1),c.renderOrder=-42,c.frustumCulled=!1,c.castShadow=!1,c.receiveShadow=!1,c.userData.baseOpacity=r,c.userData.phase=o()*M,i.add(c)}return i}function q(e,o){let i=[],a=[],t=new e.Color("#15100c"),n=new e.Color("#c13c2c"),s=new e.Color("#d9cbb7");function r(l,u,d=t){i.push(l.x,l.y,l.z,u.x,u.y,u.z),a.push(d.r,d.g,d.b,d.r,d.g,d.b)}for(let l=0;l<4;l+=1){let u=7+l*2.5,d=3.2-l*.18,h=-3+l*.12,c=-7.5-l*1.8;r(new e.Vector3(-u,d,c),new e.Vector3(u,d+(o()-.5)*.28,c-.4),t),r(new e.Vector3(-u,h,c),new e.Vector3(u,h+(o()-.5)*.24,c+.2),t),r(new e.Vector3(-u,h,c),new e.Vector3(-u+(o()-.5)*.36,d,c-.2),t),r(new e.Vector3(u,h,c),new e.Vector3(u+(o()-.5)*.36,d,c+.2),t),r(new e.Vector3(-u,d,c),new e.Vector3(u,h,c),l%2===0?t:s),r(new e.Vector3(-u*.86,h,c),new e.Vector3(u*.76,d,c),l%2===0?n:t)}for(let l=0;l<92;l+=1){let u=S(e,o,.72),d=5.8+o()*12.8,h=u.multiplyScalar(d),c=new e.Vector3(-h.z,(o()-.5)*1.4,h.x).normalize(),v=.42+o()*1.55,b=new e.Vector3((o()-.5)*.22,(o()-.5)*.22,(o()-.5)*.22),w=h.clone().addScaledVector(c,-v).add(b),y=h.clone().addScaledVector(c,v).sub(b);r(w,y,l%9===0?n:t)}let p=new e.BufferGeometry;p.setAttribute("position",new e.BufferAttribute(new Float32Array(i),3)),p.setAttribute("color",new e.BufferAttribute(new Float32Array(a),3));let f=new e.LineBasicMaterial({name:"dry-black-contour-scaffold-lines",vertexColors:!0,transparent:!0,opacity:.72,depthWrite:!1,depthTest:!0,toneMapped:!1}),m=new e.LineSegments(p,f);return m.name="surrounding-black-cage-and-tegen-pressure-hatching",m.renderOrder=-18,m.frustumCulled=!1,m.userData.disposableGeometries=[p],m.userData.disposableMaterials=[f],m}function G(e,o){let i=new e.Group;i.name="heavy-black-hand-drawn-shallow-box-pressure-bars";let a=new e.PlaneGeometry(1,1,1,1);i.userData.disposableGeometries=[a];let t=new e.MeshBasicMaterial({name:"waxy-black-oil-stick-bars",color:"#120d09",transparent:!0,opacity:.84,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),n=new e.MeshBasicMaterial({name:"dry-red-opposing-flow-bars",color:"#d7472e",transparent:!0,opacity:.68,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),s=new e.MeshBasicMaterial({name:"dry-yellow-pressure-bars",color:"#e4c314",transparent:!0,opacity:.58,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});i.userData.disposableMaterials=[t,n,s];function r(p,f,m,l,u,d,h,c){let v=new e.Mesh(a,f);v.name=p,v.position.set(m,l,u),v.rotation.set((o()-.5)*.018,(o()-.5)*.026,c+(o()-.5)*.035),v.scale.set(d,h,1),v.renderOrder=-4,v.frustumCulled=!1,v.castShadow=!1,v.receiveShadow=!1,v.userData.baseOpacity=f.opacity,i.add(v)}return r("top-heavy-black-gallery-scaffold",t,0,2.82,-5.8,8.9,.18,-.012),r("bottom-heavy-black-crowd-pressure-line",t,0,-2.28,-5.6,9.8,.16,.015),r("left-heavy-black-shallow-box-upright",t,-4.18,.12,-5.9,.18,5.3,-.03),r("right-heavy-black-shallow-box-upright",t,4.18,.04,-5.9,.18,5,.028),r("black-crossbar-against-vector-one",t,-.6,.15,-5.3,8.4,.13,.52),r("black-crossbar-against-vector-two",t,.45,0,-5.25,8.1,.12,-.46),r("red-tegen-pressure-surge-left-to-center",n,-2.35,-.68,-4.85,4.8,.22,.4),r("red-tegen-pressure-surge-center-to-left",n,-2.75,.36,-4.75,3.6,.17,-.34),r("yellow-pressure-answer-right-to-center",s,2.95,.62,-4.9,4.4,.25,-.36),r("yellow-pressure-answer-low-right",s,2.65,-.82,-4.8,3.5,.2,.34),i}function V(e,o){let a=new Float32Array(780),t=new Float32Array(260*3),n=new Float32Array(260),s=["#e4c314","#d7472e","#145fc2","#cf6a9b","#17110d","#348446"].map(l=>new e.Color(l));for(let l=0;l<260;l+=1){let u=S(e,o,.86),d=4.8+Math.pow(o(),.72)*13.8,h=u.multiplyScalar(d);a[l*3]=h.x,a[l*3+1]=h.y,a[l*3+2]=h.z;let c=s[l%s.length],v=.64+o()*.34;t[l*3]=c.r*v,t[l*3+1]=c.g*v,t[l*3+2]=c.b*v,n[l]=.22+o()*.58}let r=new e.BufferGeometry;r.setAttribute("position",new e.BufferAttribute(a,3)),r.setAttribute("color",new e.BufferAttribute(t,3)),r.setAttribute("aSize",new e.BufferAttribute(n,1));let p=B(e),f=new e.ShaderMaterial({name:"dry-crayon-pigment-accent-points",transparent:!0,depthWrite:!1,depthTest:!0,vertexColors:!0,toneMapped:!1,uniforms:{uSprite:{value:p},uScale:{value:1}},vertexShader:`
      attribute float aSize;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (260.0 / max(18.0, -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,fragmentShader:`
      precision mediump float;
      uniform sampler2D uSprite;
      varying vec3 vColor;
      void main() {
        float alpha = texture2D(uSprite, gl_PointCoord).a;
        if (alpha < 0.03) discard;
        gl_FragColor = vec4(vColor, alpha * 0.62);
      }
    `}),m=new e.Points(r,f);return m.name="small-bright-crayon-accents-in-concentrated-protest-pressure",m.renderOrder=-10,m.frustumCulled=!1,m.userData.disposableGeometries=[r],m.userData.disposableMaterials=[f],m.userData.disposableTextures=[p],m}function W(e){let o=new Set,i=new Set,a=new Set;e.traverse(t=>{t.geometry&&o.add(t.geometry);let n=Array.isArray(t.material)?t.material:[t.material].filter(Boolean);for(let s of n){i.add(s);let r=s.uniforms||{};for(let p of Object.values(r))p?.value?.isTexture&&a.add(p.value);s.map&&a.add(s.map),s.alphaMap&&a.add(s.alphaMap)}for(let s of t.userData?.disposableGeometries||[])o.add(s);for(let s of t.userData?.disposableMaterials||[])i.add(s);for(let s of t.userData?.disposableTextures||[])a.add(s)});for(let t of a)t?.dispose?.();for(let t of o)t?.dispose?.();for(let t of i)t?.dispose?.()}function F({THREE:e,part:o,world:i,seed:a,utilities:t}){let n=k(`${a??""}:${o?.id||"world-environment"}:${x}`),s=P(t,n,"carroll-dunham-tegen-world-environment"),r=new e.Group;r.name="world-environment-carroll-dunham-tegen-artist-derived-atmosphere",r.userData={partId:"world-environment",role:"world-environment",packetId:g,packetHash:x,selectedNews:"Pro-Palestinian organizations protest arrival of Israeli conductor at Bozar",skyboxOwnership:"contains exactly one true enclosing skybox shell"};let p=C(e,n),f=D(e,t,i,p);r.add(f);let m=A(e,s),l=q(e,s),u=G(e,s),d=V(e,s);r.add(m,l,u,d);function h(v={}){let b=v.captureMode?0:Number(v.elapsedSeconds??v.time??0);p.uniforms.uTime.value=b,v.camera&&f?.userData?.cameraPinned&&(f.position.copy(v.camera.position),f.updateMatrixWorld(!0));let w=.965+Math.sin(b*.72+n*1e-4)*.035;for(let y of m.children)y.material.opacity=y.userData.baseOpacity*w,y.rotation.z+=Math.sin(b*.05+y.userData.phase)*8e-4;l.rotation.y=Math.sin(b*.026)*.018,d.rotation.y=-Math.sin(b*.031)*.026}function c(){W(r)}return h({captureMode:!0,elapsedSeconds:0}),{object:r,update:h,dispose:c}}export{F as createImmersiveWorldPart};
