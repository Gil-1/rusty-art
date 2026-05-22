var M="art-direction-packet-a8fdd3087ed9",w="a8fdd3087ed92067fe27c2c5439b3cae",k=Math.PI*2;function S(e){let r=String(e??"world-environment"),n=2166136261;for(let t=0;t<r.length;t+=1)n^=r.charCodeAt(t),n=Math.imul(n,16777619);return n>>>0}function D(e){let r=e>>>0;return function(){r=r+1831565813>>>0;let t=r;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function P(e,r,n){return e&&typeof e.createSeededRandom=="function"?e.createSeededRandom(r,n):D(S(`${r??""}:${n}`))}function C(e,r){return new e.ShaderMaterial({name:"frank-stella-rnp07l-position-space-relief-skybox",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uSeed:{value:r%1009/1009},uPaper:{value:new e.Color("#e9e7df")},uWarmPaper:{value:new e.Color("#c8b89c")},uInk:{value:new e.Color("#101318")},uNavy:{value:new e.Color("#14222f")},uTeal:{value:new e.Color("#0c766d")},uGreen:{value:new e.Color("#115044")},uOrange:{value:new e.Color("#e77716")},uViolet:{value:new e.Color("#74238e")},uMagenta:{value:new e.Color("#c51778")},uYellow:{value:new e.Color("#e1bd24")},uMetal:{value:new e.Color("#9b9a91")}},vertexShader:`
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
      uniform vec3 uWarmPaper;
      uniform vec3 uInk;
      uniform vec3 uNavy;
      uniform vec3 uTeal;
      uniform vec3 uGreen;
      uniform vec3 uOrange;
      uniform vec3 uViolet;
      uniform vec3 uMagenta;
      uniform vec3 uYellow;
      uniform vec3 uMetal;
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
        float amp = 0.52;
        for (int i = 0; i < 4; i += 1) {
          value += noise3(p) * amp;
          p = p * 2.04 + vec3(3.7, 5.1, 1.9);
          amp *= 0.53;
        }
        return value;
      }

      float lineMask(float value, float frequency, float width) {
        float wave = abs(sin(value * frequency));
        return smoothstep(width, 0.0, wave);
      }

      float bandMask(vec2 p, float slope, float offset, float halfWidth) {
        float d = abs(p.y - (p.x * slope + offset));
        return smoothstep(halfWidth, 0.0, d);
      }

      float chevronMask(vec2 p, float center, float width, float opening) {
        float d = abs(abs(p.y - center) - abs(p.x) * opening);
        return smoothstep(width, 0.0, d);
      }

      float boxMask(vec2 p, vec2 center, vec2 halfSize, float feather) {
        vec2 d = abs(p - center) - halfSize;
        float outside = length(max(d, 0.0));
        float inside = min(max(d.x, d.y), 0.0);
        return 1.0 - smoothstep(0.0, feather, outside + inside);
      }

      float ringMask(vec2 p, vec2 center, float radius, float width) {
        return smoothstep(width, 0.0, abs(length(p - center) - radius));
      }

      void main() {
        vec3 dir = normalize(vPosition);
        vec3 p = dir * 3.15;
        vec3 warp = vec3(
          fbm(p.yzx * 1.2 + 2.0),
          fbm(p.zxy * 1.3 + 6.0),
          fbm(p.xyz * 1.15 + 10.0)
        );
        vec3 q = p + (warp - 0.5) * 0.34;
        float poleDetailFade = 1.0 - smoothstep(0.78, 0.97, abs(dir.y));
        float poleBlend = smoothstep(0.84, 0.985, abs(dir.y));

        float paperGrain = fbm(q * 7.0 + vec3(2.0, 3.0, 5.0));
        float stain = fbm(q * 1.55 + vec3(7.0, 1.0, 4.0));
        vec3 color = mix(uPaper, uWarmPaper, 0.18 + stain * 0.34);
        color *= 0.82 + paperGrain * 0.28;
        color = mix(color, vec3(0.96, 0.95, 0.90), smoothstep(0.22, 0.92, dir.y) * 0.32);
        color = mix(color, vec3(0.66, 0.61, 0.54), smoothstep(-0.18, -0.92, dir.y) * 0.36);

        vec2 front = vec2(dir.x, dir.y);
        vec2 side = vec2(dir.z, dir.y);
        float frontGate = smoothstep(-0.08, -0.66, dir.z);
        float rearGate = smoothstep(0.04, 0.72, dir.z);
        float rightGate = smoothstep(0.08, 0.74, dir.x);
        float leftGate = smoothstep(-0.08, -0.74, dir.x);

        float routeA = bandMask(front, 0.48, -0.10, 0.092) * frontGate;
        float routeB = bandMask(front, 0.48, -0.10, 0.155) * frontGate;
        float opposingA = bandMask(front, -0.64, -0.02, 0.055) * frontGate;
        float sideRoute = bandMask(side, -0.50, 0.03, 0.084) * rightGate;
        float rearRoute = bandMask(side, 0.38, -0.12, 0.074) * leftGate;

        float tealRail = max(sideRoute, rearRoute) * poleDetailFade;
        float orangeRunway = routeA * poleDetailFade;
        float tanRunway = (routeB - routeA * 0.75) * poleDetailFade;
        color = mix(color, uTeal, tealRail * 0.94);
        color = mix(color, uOrange, orangeRunway * 0.98);
        color = mix(color, uWarmPaper, tanRunway * 0.74);

        float navyPanel = max(
          boxMask(front, vec2(0.48, 0.08), vec2(0.34, 0.48), 0.08) * frontGate,
          boxMask(side, vec2(-0.38, 0.04), vec2(0.31, 0.42), 0.10) * rightGate
        ) * poleDetailFade;
        float greenPanel = boxMask(front, vec2(-0.42, -0.18), vec2(0.28, 0.32), 0.11) * frontGate * poleDetailFade;
        float violetPanel = boxMask(side, vec2(0.34, -0.26), vec2(0.30, 0.28), 0.10) * leftGate * poleDetailFade;
        color = mix(color, uNavy, navyPanel * 0.88);
        color = mix(color, uGreen, greenPanel * 0.78);
        color = mix(color, uViolet, violetPanel * 0.84);

        float gridX = lineMask(q.x + fbm(q * 2.0) * 0.05, 19.0, 0.050);
        float gridY = lineMask(q.y + fbm(q.zxy * 2.0) * 0.05, 17.5, 0.046);
        float gridZ = lineMask(q.z + fbm(q.yxz * 2.0) * 0.05, 18.0, 0.048);
        float gridGate = max(navyPanel, max(frontGate * 0.55, rightGate * 0.50));
        float grid = clamp(max(gridX * 0.68, gridY * 0.72) + gridZ * 0.42, 0.0, 1.0) * gridGate * poleDetailFade;

        float chevronOne = chevronMask(front + vec2(-0.04, -0.02), 0.17, 0.040, 0.92) * frontGate;
        float chevronTwo = chevronMask(front + vec2(-0.03, -0.08), 0.05, 0.040, 0.92) * frontGate;
        float chevronThree = chevronMask(side + vec2(0.03, 0.00), 0.09, 0.043, 0.85) * rightGate;
        float blackChevron = clamp(chevronOne + chevronTwo + chevronThree, 0.0, 1.0) * poleDetailFade;

        float radialFront = (
          ringMask(front, vec2(0.02, -0.04), 0.22, 0.025) +
          ringMask(front, vec2(0.02, -0.04), 0.31, 0.018) +
          ringMask(front, vec2(0.02, -0.04), 0.40, 0.014)
        ) * frontGate * poleDetailFade;
        float radialSide = (
          ringMask(side, vec2(0.12, -0.16), 0.22, 0.025) +
          ringMask(side, vec2(0.12, -0.16), 0.34, 0.016)
        ) * rightGate * poleDetailFade;
        color = mix(color, uMetal, clamp(radialFront + radialSide, 0.0, 1.0) * 0.72);

        float hatchA = lineMask(q.x + q.y * 0.68 + q.z * 0.16, 48.0, 0.033);
        float hatchB = lineMask(q.z - q.y * 0.78 + q.x * 0.18, 53.0, 0.029);
        float hatchNoise = smoothstep(0.28, 0.76, fbm(q * 5.0 + vec3(8.0, 2.0, 4.0)));
        float hatching = clamp((hatchA * 0.48 + hatchB * 0.42) * hatchNoise, 0.0, 1.0) * poleDetailFade;

        float blackFrame = 0.0;
        blackFrame += smoothstep(0.034, 0.0, abs(abs(dir.x) - 0.74)) * smoothstep(-0.62, 0.66, dir.y) * frontGate;
        blackFrame += smoothstep(0.035, 0.0, abs(abs(dir.y) - 0.46)) * smoothstep(-0.70, 0.70, dir.x) * frontGate;
        blackFrame += opposingA * 1.15;
        blackFrame = clamp(blackFrame, 0.0, 1.0) * poleDetailFade;

        float speck = smoothstep(0.955, 1.0, fbm(q * 20.0 + vec3(1.0, 9.0, 4.0))) * poleDetailFade;
        vec3 accent = mix(uYellow, mix(uMagenta, uOrange, step(0.55, fbm(q * 8.0))), step(0.58, fbm(q * 12.0)));
        color = mix(color, accent, speck * 0.52);

        float ink = clamp(grid * 0.54 + hatching * 0.38 + blackChevron * 0.96 + blackFrame * 0.90, 0.0, 1.0);
        color = mix(color, uInk, ink);

        float measuredPulse = 0.975 + 0.025 * sin(uTime * 0.78 + uSeed * 6.283);
        color = color * measuredPulse + vec3(0.018, 0.017, 0.014);

        vec3 poleWash = mix(vec3(0.91, 0.89, 0.82), vec3(0.54, 0.50, 0.44), smoothstep(0.0, 1.0, abs(dir.y)));
        color = mix(color, poleWash, poleBlend * 0.60);
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function z(e,r,n,t){let o=Math.max(42,Math.min(96,Number(n?.environment?.skyboxRadius||n?.environment?.radius||64))),s;if(r&&typeof r.createSkyboxShell=="function")s=r.createSkyboxShell({THREE:e,radius:o,name:"frank-stella-rnp07l-single-position-space-skybox",geometryKind:"box",color:"#e9e7df",opacity:1,cameraPinned:!0,userData:{partId:"world-environment",packetId:M,packetHash:w}});else{let u=new e.BoxGeometry(o*2,o*2,o*2,1,1,1),p=new e.Mesh(u,t);p.name="frank-stella-rnp07l-single-position-space-skybox-mesh",p.frustumCulled=!1,p.castShadow=!1,p.receiveShadow=!1,s=new e.Group,s.name="frank-stella-rnp07l-single-position-space-skybox",s.add(p),s.mesh=p,s.material=t,s.geometry=u,s.object=s,s.onBeforeRender=function(i,l,d){d&&(s.position.copy(d.position),s.updateMatrixWorld(!0))}}let a=s.object||s,c=s.mesh||a.mesh||a.children?.find(u=>u?.isMesh);return c&&(c.material&&c.material!==t&&typeof c.material.dispose=="function"&&c.material.dispose(),c.material=t,c.frustumCulled=!1,c.castShadow=!1,c.receiveShadow=!1,c.renderOrder=-1e3),a.name="world-environment-frank-stella-rnp07l-skybox-shell",a.userData={...a.userData,partId:"world-environment",packetId:M,packetHash:w,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,skyboxOwnership:"single true enclosing shell"},a.mesh=c,a.material=t,a.object=a,a}function F(e){let n=new Uint8Array(16384),t=63*.5;for(let s=0;s<64;s+=1)for(let a=0;a<64;a+=1){let c=(a-t)/t,u=(s-t)/t,p=Math.sqrt(c*c+u*u),m=Math.max(0,1-p),i=.78+.22*Math.sin((a*12.9898+s*78.233)*.17),l=Math.pow(m,2.35)*i,d=(s*64+a)*4;n[d]=255,n[d+1]=255,n[d+2]=255,n[d+3]=Math.round(l*255)}let o=new e.DataTexture(n,64,64,e.RGBAFormat);return o.name="matte-pigment-speck-soft-sprite",o.magFilter=e.LinearFilter,o.minFilter=e.LinearFilter,o.wrapS=e.ClampToEdgeWrapping,o.wrapT=e.ClampToEdgeWrapping,o.generateMipmaps=!1,o.needsUpdate=!0,o}function A(e,r){let n=new e.Group;n.name="stella-mid-distance-layered-relief-route-panels";let t=new e.PlaneGeometry(1,1,1,1);n.userData.disposableGeometries=[t],n.userData.disposableMaterials=[];let o=[["matte-black-chevon-pressure-plate","#0e1117",.82,8.8,.52,.51,0,1.05],["gallery-white-cut-relief-blade","#ebe8dc",.82,8.2,.36,.51,.7,1.05],["deep-teal-rnp-route-band","#08776d",.76,9.4,.48,-.56,.2,2.24],["orange-contested-approach-slash","#e77716",.8,7.2,.44,.48,-.3,-2.35],["violet-court-counterweight-panel","#74238e",.5,5.6,1.44,-.08,-1.55,3.22],["navy-grid-pressure-panel","#14222f",.62,5.8,2.4,0,1.1,-3],["warm-earth-muted-wedge","#746650",.48,7.4,1.15,.36,-1.05,.42],["magenta-small-public-friction-plane","#c51778",.54,2.9,.72,-.4,1.42,-1.12]];for(let[s,a,c,u,p,m,i,l]of o){let d=7.2+r()*6.4,f=i+(r()-.5)*.46,v=new e.MeshBasicMaterial({name:`${s}-flat-matte-painted-panel`,color:a,transparent:!0,opacity:c,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});n.userData.disposableMaterials.push(v);let h=new e.Mesh(t,v);h.name=s,h.position.set(Math.cos(l)*d,f,Math.sin(l)*d),h.lookAt(0,f*.25,0),h.rotateZ(Math.atan(m)+(r()-.5)*.08),h.scale.set(u*(1+r()*.16),p*(.96+r()*.18),1),h.renderOrder=-38,h.frustumCulled=!1,h.castShadow=!1,h.receiveShadow=!1,h.userData.baseOpacity=c,h.userData.phase=r()*k,n.add(h)}return n}function B(e,r){let n=[],t=[],o=new e.Color("#101318"),s=new e.Color("#0c766d"),a=new e.Color("#e77716"),c=new e.Color("#b4b0a5");function u(l,d,f){n.push(l.x,l.y,l.z,d.x,d.y,d.z),t.push(f.r,f.g,f.b,f.r,f.g,f.b)}for(let l=0;l<7;l+=1){let d=-5.4-l*1.12,f=-2.2+l*.54,v=5.2+l*.65;u(new e.Vector3(-v,f,d),new e.Vector3(v,f+.18,d-.6),l%3===1?s:o),u(new e.Vector3(-v*.82,f-.34,d+.35),new e.Vector3(v*.72,f+.72,d-.42),l%2===0?a:c),u(new e.Vector3(-v,f-.74,d),new e.Vector3(-v+.7,f+1.3,d-.2),o),u(new e.Vector3(v,f-.65,d),new e.Vector3(v-.8,f+1.1,d-.25),o)}for(let l=0;l<112;l+=1){let d=r()*k,f=5+r()*11.6,v=-2.8+r()*5.8,h=new e.Vector3(Math.cos(d)*f,v,Math.sin(d)*f),y=new e.Vector3(-Math.sin(d),(r()-.5)*.38,Math.cos(d)).normalize(),b=.34+r()*1.45,x=new e.Vector3((r()-.5)*.18,(r()-.5)*.14,(r()-.5)*.18);u(h.clone().addScaledVector(y,-b).add(x),h.clone().addScaledVector(y,b).sub(x),l%11===0?a:l%7===0?s:o)}let p=new e.BufferGeometry;p.setAttribute("position",new e.BufferAttribute(new Float32Array(n),3)),p.setAttribute("color",new e.BufferAttribute(new Float32Array(t),3));let m=new e.LineBasicMaterial({name:"black-contour-route-grid-pressure-lines",vertexColors:!0,transparent:!0,opacity:.76,depthWrite:!1,depthTest:!0,toneMapped:!1}),i=new e.LineSegments(p,m);return i.name="non-literal-rnp07l-grid-pressure-line-system",i.renderOrder=-22,i.frustumCulled=!1,i.userData.disposableGeometries=[p],i.userData.disposableMaterials=[m],i}function q(e,r){let n=new e.Group;n.name="stella-radial-relief-symbols-in-space";let t=[new e.TorusGeometry(1,.026,10,96),new e.TorusGeometry(1,.018,8,96)],o=[new e.MeshBasicMaterial({name:"matte-metal-ring",color:"#b4b0a5",transparent:!0,opacity:.66,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1}),new e.MeshBasicMaterial({name:"violet-ring-accent",color:"#74238e",transparent:!0,opacity:.58,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1}),new e.MeshBasicMaterial({name:"yellow-route-dot",color:"#e1bd24",transparent:!0,opacity:.72,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1})];n.userData.disposableGeometries=t,n.userData.disposableMaterials=o;let s=[[0,-.18,-6.1,1],[5.4,-.8,-5.2,.72],[-4.8,.82,-6.8,.58],[4.2,1.25,3.8,.64],[-5.2,-1.35,3,.48]];for(let a=0;a<s.length;a+=1){let[c,u,p,m]=s[a],i=new e.Mesh(t[0],o[a%2]);i.name=`radial-relief-ring-${a+1}`,i.position.set(c,u,p),i.lookAt(0,u*.2,0),i.scale.setScalar(m*(1+r()*.18)),i.renderOrder=-14,i.frustumCulled=!1,n.add(i);let l=new e.Mesh(t[1],o[(a+1)%3]);l.name=`radial-relief-inner-ring-${a+1}`,l.position.copy(i.position),l.rotation.copy(i.rotation),l.scale.setScalar(m*.54),l.renderOrder=-13,l.frustumCulled=!1,n.add(l)}return n}function W(e,r){let t=new Float32Array(960),o=new Float32Array(320*3),s=new Float32Array(320),a=["#e77716","#c51778","#e1bd24","#0c766d","#101318","#b4b0a5"].map(i=>new e.Color(i));for(let i=0;i<320;i+=1){let l=r()*k,d=4.2+Math.pow(r(),.62)*12.8,f=-2.8+r()*5.8;t[i*3]=Math.cos(l)*d,t[i*3+1]=f,t[i*3+2]=Math.sin(l)*d;let v=a[i%a.length],h=.64+r()*.34;o[i*3]=v.r*h,o[i*3+1]=v.g*h,o[i*3+2]=v.b*h,s[i]=.24+r()*.62}let c=new e.BufferGeometry;c.setAttribute("position",new e.BufferAttribute(t,3)),c.setAttribute("color",new e.BufferAttribute(o,3)),c.setAttribute("aSize",new e.BufferAttribute(s,1));let u=F(e),p=new e.ShaderMaterial({name:"stella-matte-speckled-pigment-accents",transparent:!0,depthWrite:!1,depthTest:!0,vertexColors:!0,toneMapped:!1,uniforms:{uSprite:{value:u},uScale:{value:1}},vertexShader:`
      attribute float aSize;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (280.0 / max(18.0, -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,fragmentShader:`
      precision mediump float;
      uniform sampler2D uSprite;
      varying vec3 vColor;
      void main() {
        float alpha = texture2D(uSprite, gl_PointCoord).a;
        if (alpha < 0.035) discard;
        gl_FragColor = vec4(vColor, alpha * 0.62);
      }
    `}),m=new e.Points(c,p);return m.name="controlled-stippled-accent-pigment-around-route-pressure",m.renderOrder=-12,m.frustumCulled=!1,m.userData.disposableGeometries=[c],m.userData.disposableMaterials=[p],m.userData.disposableTextures=[u],m}function V(e){let r=new Set,n=new Set,t=new Set;e.traverse(o=>{o.geometry&&r.add(o.geometry);let s=Array.isArray(o.material)?o.material:[o.material].filter(Boolean);for(let a of s){n.add(a);let c=a.uniforms||{};for(let u of Object.values(c))u?.value?.isTexture&&t.add(u.value);a.map&&t.add(a.map),a.alphaMap&&t.add(a.alphaMap)}for(let a of o.userData?.disposableGeometries||[])r.add(a);for(let a of o.userData?.disposableMaterials||[])n.add(a);for(let a of o.userData?.disposableTextures||[])t.add(a)});for(let o of t)o?.dispose?.();for(let o of r)o?.dispose?.();for(let o of n)o?.dispose?.()}function O({THREE:e,part:r,world:n,seed:t,camera:o,utilities:s}={}){let a=S(`${t??""}:${r?.id||"world-environment"}:${w}`),c=P(s,a,"frank-stella-rnp07l-world-environment"),u=new e.Group;u.name="world-environment-frank-stella-rnp07l-grid-pressure-atmosphere",u.userData={partId:"world-environment",role:"world-environment",packetId:M,packetHash:w,selectedNews:"Lennik goes to court over controversial RNP-07L flight route",skyboxReview:"root contains one child marked as the true enclosing skybox shell; other systems are ordinary mid-distance geometry"};let p=C(e,a),m=z(e,s,n,p);u.add(m);let i=A(e,c),l=B(e,c),d=q(e,c),f=W(e,c);u.add(i,l,d,f);function v(y={}){let b=y.captureMode?0:Number(y.elapsedSeconds??y.time??0);p.uniforms.uTime.value=b;let x=y.camera||o;x&&m?.userData?.cameraPinned&&(m.position.copy(x.position),m.updateMatrixWorld(!0));let G=.972+Math.sin(b*.7+a*13e-5)*.028;for(let g of i.children)g.material&&Number.isFinite(g.userData.baseOpacity)&&(g.material.opacity=g.userData.baseOpacity*G),g.rotation.z+=Math.sin(b*.045+g.userData.phase)*75e-5;l.rotation.y=Math.sin(b*.025)*.016,d.rotation.y=Math.sin(b*.032)*.018,f.rotation.y=-Math.sin(b*.029)*.024}function h(){V(u)}return v({captureMode:!0,elapsedSeconds:0,camera:o}),{object:u,update:v,dispose:h}}export{O as createImmersiveWorldPart};
