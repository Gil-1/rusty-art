var w="art-direction-packet-983f4bd5f8b1",b="983f4bd5f8b14427d2eec07e5249dee9",g=Math.PI*2;function M(e){let t=String(e??"world-environment"),c=2166136261;for(let o=0;o<t.length;o+=1)c^=t.charCodeAt(o),c=Math.imul(c,16777619);return c>>>0}function z(e){let t=e>>>0;return function(){t=t+1831565813>>>0;let o=t;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296}}function P(e,t,c){return e&&typeof e.createSeededRandom=="function"?e.createSeededRandom(t,c):z(M(`${t??""}:${c}`))}function S(e,t,c=1){let o=(t()*2-1)*c,a=t()*g,s=Math.sqrt(Math.max(.001,1-o*o));return new e.Vector3(Math.cos(a)*s,o,Math.sin(a)*s).normalize()}function C(e){let c=new Uint8Array(9216),o=47*.5;for(let s=0;s<48;s+=1)for(let r=0;r<48;r+=1){let n=(r-o)/o,p=(s-o)/o,m=Math.sqrt(n*n+p*p),f=Math.max(0,1-m),i=Math.max(0,1-Math.abs(Math.sin((r*12.9898+s*78.233)*.11))*.34),u=Math.pow(f,2.2)*i,d=(s*48+r)*4;c[d]=255,c[d+1]=255,c[d+2]=255,c[d+3]=Math.round(u*255)}let a=new e.DataTexture(c,48,48,e.RGBAFormat);return a.name="dry-pastel-soft-sprite",a.magFilter=e.LinearFilter,a.minFilter=e.LinearFilter,a.wrapS=e.ClampToEdgeWrapping,a.wrapT=e.ClampToEdgeWrapping,a.generateMipmaps=!1,a.needsUpdate=!0,a}function A(e,t){return new e.ShaderMaterial({name:"carroll-dunham-tegen-position-space-paper-skybox",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uSeed:{value:t%997/997},uPaper:{value:new e.Color("#e5dac6")},uWarm:{value:new e.Color("#b88b58")},uInk:{value:new e.Color("#17110d")},uViolet:{value:new e.Color("#7a3a82")},uBlue:{value:new e.Color("#145fc2")},uYellow:{value:new e.Color("#e4c314")},uPink:{value:new e.Color("#cf6a9b")},uRed:{value:new e.Color("#d7472e")},uGreen:{value:new e.Color("#348446")}},vertexShader:`
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
        color = mix(color, uBlue, max(bluePanelA, bluePanelB) * 0.92);

        float yellowWedge = diagonalBand(vec2(dir.x, dir.y), 0.42, -0.08, 0.17) * smoothstep(0.12, 0.88, dir.x) * smoothstep(-0.95, -0.20, dir.z);
        float redWedge = diagonalBand(vec2(dir.x, dir.y), -0.55, -0.10, 0.12) * smoothstep(-0.10, -0.86, dir.x) * smoothstep(-0.88, -0.12, dir.z);
        float pinkPlane = boxMask(vec2(dir.z, dir.y), vec2(-0.42, 0.03), vec2(0.30, 0.26), 0.14) * smoothstep(0.18, 0.82, dir.x);
        color = mix(color, uYellow, yellowWedge * 0.88);
        color = mix(color, uRed, redWedge * 0.78);
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
        float blackBars = clamp(frameTop + frameSides, 0.0, 1.0) * poleDetailFade;

        float smallAccent = smoothstep(0.965, 1.0, fbm(q * 18.0 + vec3(0.0, 5.0, 2.0))) * smoothstep(-0.65, 0.72, dir.y) * poleDetailFade;
        vec3 accentColor = mix(uYellow, mix(uRed, uGreen, step(0.52, fbm(q * 9.0))), step(0.66, fbm(q * 13.0)));

        float ink = clamp(cage * 0.58 + hatching * 0.42 + blackBars * 0.92, 0.0, 1.0);
        color = mix(color, uInk, ink * 0.88);
        color = mix(color, accentColor, smallAccent * 0.54);

        float pressurePulse = 0.96 + 0.04 * sin(uTime * 0.9 + uSeed * 6.283);
        color *= pressurePulse;

        vec3 poleWash = mix(vec3(0.86, 0.80, 0.67), vec3(0.48, 0.37, 0.31), smoothstep(0.0, 1.0, abs(dir.y)));
        color = mix(color, poleWash, poleBlend * 0.55);
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function B(e,t,c,o){let a=Math.max(34,Math.min(90,Number(c?.environment?.skyboxRadius||c?.environment?.radius||54))),s;if(t&&typeof t.createSkyboxShell=="function")s=t.createSkyboxShell({THREE:e,radius:a,name:"carroll-dunham-tegen-single-position-space-skybox",geometryKind:"box",color:"#e5dac6",opacity:1,cameraPinned:!0,userData:{partId:"world-environment",packetId:w,packetHash:b}});else{let p=new e.BoxGeometry(2/Math.sqrt(3),2/Math.sqrt(3),2/Math.sqrt(3),1,1,1),m=new e.Mesh(p,o);m.name="carroll-dunham-tegen-single-position-space-skybox-mesh",m.frustumCulled=!1,m.castShadow=!1,m.receiveShadow=!1,m.onBeforeRender=function(i,u,d){d&&(s.position.copy(d.position),s.updateMatrixWorld(!0))},s=new e.Group,s.name="carroll-dunham-tegen-single-position-space-skybox",s.scale.setScalar(a),s.add(m),s.mesh=m,s.material=o,s.geometry=p,s.object=s}let r=s.object||s,n=s.mesh||r.mesh||r.children?.find(p=>p?.isMesh);return n&&(n.material&&n.material!==o&&typeof n.material.dispose=="function"&&n.material.dispose(),n.material=o,n.frustumCulled=!1,n.castShadow=!1,n.receiveShadow=!1,n.renderOrder=-1e3),r.name="world-environment-carroll-dunham-tegen-skybox-shell",r.userData={...r.userData,partId:"world-environment",packetId:w,packetHash:b,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0},r.mesh=n,r.material=o,r.object=r,r}function D(e,t){let c=new e.Group;c.name="mid-distance-saturated-dunham-pressure-planes";let o=new e.PlaneGeometry(1,1,1,1);c.userData.disposableGeometries=[o];let a=[["violet-rounded-stage-block","#7a3a82",.46,9.8,6.1,.1],["cobalt-side-pressure-panel","#145fc2",.42,8.6,4.7,1.28],["yellow-diagonal-pressure-panel","#e4c314",.44,10.4,3.2,2.37],["pink-counter-plane","#cf6a9b",.36,7.8,3.8,3.76],["red-opposing-flow-plane","#d7472e",.38,9.4,2.6,4.64],["green-low-crowd-plane","#348446",.3,6.8,2.8,5.42]];c.userData.disposableMaterials=[];for(let[s,r,n,p,m,f]of a){let i=10.5+t()*5.5,u=-1.35+t()*3.2,d=new e.Vector3(Math.cos(f)*i,u,Math.sin(f)*i),h=new e.MeshBasicMaterial({name:`${s}-matte-wash`,color:r,transparent:!0,opacity:n,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});c.userData.disposableMaterials.push(h);let l=new e.Mesh(o,h);l.name=s,l.position.copy(d),l.lookAt(0,0,0),l.rotateZ((t()-.5)*.42),l.scale.set(p*(.92+t()*.22),m*(.9+t()*.2),1),l.renderOrder=-42,l.frustumCulled=!1,l.castShadow=!1,l.receiveShadow=!1,l.userData.baseOpacity=n,l.userData.phase=t()*g,c.add(l)}return c}function q(e,t){let c=[],o=[],a=new e.Color("#15100c"),s=new e.Color("#c13c2c"),r=new e.Color("#d9cbb7");function n(i,u,d=a){c.push(i.x,i.y,i.z,u.x,u.y,u.z),o.push(d.r,d.g,d.b,d.r,d.g,d.b)}for(let i=0;i<4;i+=1){let u=7+i*2.5,d=3.2-i*.18,h=-3+i*.12,l=-7.5-i*1.8;n(new e.Vector3(-u,d,l),new e.Vector3(u,d+(t()-.5)*.28,l-.4),a),n(new e.Vector3(-u,h,l),new e.Vector3(u,h+(t()-.5)*.24,l+.2),a),n(new e.Vector3(-u,h,l),new e.Vector3(-u+(t()-.5)*.36,d,l-.2),a),n(new e.Vector3(u,h,l),new e.Vector3(u+(t()-.5)*.36,d,l+.2),a),n(new e.Vector3(-u,d,l),new e.Vector3(u,h,l),i%2===0?a:r),n(new e.Vector3(-u*.86,h,l),new e.Vector3(u*.76,d,l),i%2===0?s:a)}for(let i=0;i<92;i+=1){let u=S(e,t,.72),d=5.8+t()*12.8,h=u.multiplyScalar(d),l=new e.Vector3(-h.z,(t()-.5)*1.4,h.x).normalize(),v=.42+t()*1.55,y=new e.Vector3((t()-.5)*.22,(t()-.5)*.22,(t()-.5)*.22),x=h.clone().addScaledVector(l,-v).add(y),k=h.clone().addScaledVector(l,v).sub(y);n(x,k,i%9===0?s:a)}let p=new e.BufferGeometry;p.setAttribute("position",new e.BufferAttribute(new Float32Array(c),3)),p.setAttribute("color",new e.BufferAttribute(new Float32Array(o),3));let m=new e.LineBasicMaterial({name:"dry-black-contour-scaffold-lines",vertexColors:!0,transparent:!0,opacity:.72,depthWrite:!1,depthTest:!0,toneMapped:!1}),f=new e.LineSegments(p,m);return f.name="surrounding-black-cage-and-tegen-pressure-hatching",f.renderOrder=-18,f.frustumCulled=!1,f.userData.disposableGeometries=[p],f.userData.disposableMaterials=[m],f}function V(e,t){let o=new Float32Array(780),a=new Float32Array(260*3),s=new Float32Array(260),r=["#e4c314","#d7472e","#145fc2","#cf6a9b","#17110d","#348446"].map(i=>new e.Color(i));for(let i=0;i<260;i+=1){let u=S(e,t,.86),d=4.8+Math.pow(t(),.72)*13.8,h=u.multiplyScalar(d);o[i*3]=h.x,o[i*3+1]=h.y,o[i*3+2]=h.z;let l=r[i%r.length],v=.64+t()*.34;a[i*3]=l.r*v,a[i*3+1]=l.g*v,a[i*3+2]=l.b*v,s[i]=.22+t()*.58}let n=new e.BufferGeometry;n.setAttribute("position",new e.BufferAttribute(o,3)),n.setAttribute("color",new e.BufferAttribute(a,3)),n.setAttribute("aSize",new e.BufferAttribute(s,1));let p=C(e),m=new e.ShaderMaterial({name:"dry-crayon-pigment-accent-points",transparent:!0,depthWrite:!1,depthTest:!0,vertexColors:!0,toneMapped:!1,uniforms:{uSprite:{value:p},uScale:{value:1}},vertexShader:`
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
    `}),f=new e.Points(n,m);return f.name="small-bright-crayon-accents-in-concentrated-protest-pressure",f.renderOrder=-10,f.frustumCulled=!1,f.userData.disposableGeometries=[n],f.userData.disposableMaterials=[m],f.userData.disposableTextures=[p],f}function G(e){let t=new Set,c=new Set,o=new Set;e.traverse(a=>{a.geometry&&t.add(a.geometry);let s=Array.isArray(a.material)?a.material:[a.material].filter(Boolean);for(let r of s){c.add(r);let n=r.uniforms||{};for(let p of Object.values(n))p?.value?.isTexture&&o.add(p.value);r.map&&o.add(r.map),r.alphaMap&&o.add(r.alphaMap)}for(let r of a.userData?.disposableGeometries||[])t.add(r);for(let r of a.userData?.disposableMaterials||[])c.add(r);for(let r of a.userData?.disposableTextures||[])o.add(r)});for(let a of o)a?.dispose?.();for(let a of t)a?.dispose?.();for(let a of c)a?.dispose?.()}function W({THREE:e,part:t,world:c,seed:o,utilities:a}){let s=M(`${o??""}:${t?.id||"world-environment"}:${b}`),r=P(a,s,"carroll-dunham-tegen-world-environment"),n=new e.Group;n.name="world-environment-carroll-dunham-tegen-artist-derived-atmosphere",n.userData={partId:"world-environment",role:"world-environment",packetId:w,packetHash:b,selectedNews:"Pro-Palestinian organizations protest arrival of Israeli conductor at Bozar",skyboxOwnership:"contains exactly one true enclosing skybox shell"};let p=A(e,s),m=B(e,a,c,p);n.add(m);let f=D(e,r),i=q(e,r),u=V(e,r);n.add(f,i,u);function d(l={}){let v=l.captureMode?0:Number(l.elapsedSeconds??l.time??0);p.uniforms.uTime.value=v,l.camera&&m?.userData?.cameraPinned&&(m.position.copy(l.camera.position),m.updateMatrixWorld(!0));let y=.965+Math.sin(v*.72+s*1e-4)*.035;for(let x of f.children)x.material.opacity=x.userData.baseOpacity*y,x.rotation.z+=Math.sin(v*.05+x.userData.phase)*8e-4;i.rotation.y=Math.sin(v*.026)*.018,u.rotation.y=-Math.sin(v*.031)*.026}function h(){G(n)}return d({captureMode:!0,elapsedSeconds:0}),{object:n,update:d,dispose:h}}export{W as createImmersiveWorldPart};
