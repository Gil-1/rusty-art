var k="art-direction-packet-801609c87932",z="801609c87932834c7431bd61fa3993dd";function B(e){let r=String(e??"larry-zox-fracture-pressure"),i=2166136261;for(let a=0;a<r.length;a+=1)i^=r.charCodeAt(a),i=Math.imul(i,16777619);return i>>>0}function D(e,r,i){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(r,i);let a=(B(r)^B(i))>>>0;return function(){a=a+1831565813>>>0;let o=a;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296}}function g(e){return Math.max(0,Math.min(1,e))}function w(e,r){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=r,e}function F(e){let r=Number(e?.environment?.skyboxRadius||e?.environment?.radius);return Number.isFinite(r)&&r>0?Math.max(54,Math.min(132,r)):92}function O(e,r,i){let a=new e.Group;a.name="single-larry-zox-fracture-pressure-skybox-shell",a.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",packetId:k,packetHash:z,environmentRadius:r};let t=new e.BoxGeometry(2/Math.sqrt(3),2/Math.sqrt(3),2/Math.sqrt(3),1,1,1),o=new e.Mesh(t,i);return o.name="larry-zox-position-space-fracture-shell-mesh",o.scale.setScalar(r),w(o,-1e3),o.onBeforeRender=function(s,c,n){n&&n.position&&(a.position.copy(n.position),a.updateMatrixWorld(!0))},a.add(o),a.object=a,a.mesh=o,a.geometry=t,a.material=i,a}function W(e){return new e.ShaderMaterial({name:"larry_zox_single_shell_public_fracture_pressure",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uCream:{value:new e.Color("#eee2c5")},uChalk:{value:new e.Color("#f5edda")},uOrange:{value:new e.Color("#e96a16")},uDeepOrange:{value:new e.Color("#c94a17")},uYellow:{value:new e.Color("#e9b43f")},uPeach:{value:new e.Color("#d98a6e")},uRose:{value:new e.Color("#d77372")},uMint:{value:new e.Color("#94bfb0")},uTeal:{value:new e.Color("#237f7a")},uGrey:{value:new e.Color("#8d9186")},uBrown:{value:new e.Color("#7d654a")},uMaroon:{value:new e.Color("#642423")},uBlack:{value:new e.Color("#10100e")}},vertexShader:`
      varying vec3 vPosition;

      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;

      varying vec3 vPosition;
      uniform float uTime;
      uniform vec3 uCream;
      uniform vec3 uChalk;
      uniform vec3 uOrange;
      uniform vec3 uDeepOrange;
      uniform vec3 uYellow;
      uniform vec3 uPeach;
      uniform vec3 uRose;
      uniform vec3 uMint;
      uniform vec3 uTeal;
      uniform vec3 uGrey;
      uniform vec3 uBrown;
      uniform vec3 uMaroon;
      uniform vec3 uBlack;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.13, 0.17, 0.31));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float n000 = hash(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash(i + vec3(1.0, 1.0, 1.0));
        float nx00 = mix(n000, n100, f.x);
        float nx10 = mix(n010, n110, f.x);
        float nx01 = mix(n001, n101, f.x);
        float nx11 = mix(n011, n111, f.x);
        return mix(mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z), mix(mix(nx00, nx01, f.z), mix(nx10, nx11, f.z), f.y), 0.12);
      }

      float fbm(vec3 p) {
        float value = 0.0;
        float amp = 0.54;
        for (int i = 0; i < 5; i += 1) {
          value += noise(p) * amp;
          p = p * 2.07 + vec3(4.9, 7.1, 2.3);
          amp *= 0.50;
        }
        return value;
      }

      float band(float value, float center, float halfWidth, float feather) {
        return smoothstep(center - halfWidth - feather, center - halfWidth, value)
          - smoothstep(center + halfWidth, center + halfWidth + feather, value);
      }

      float hardLine(float value, float center, float width) {
        return 1.0 - smoothstep(width, width * 2.2, abs(value - center));
      }

      float halfPlane(float value, float edge, float feather) {
        return smoothstep(edge - feather, edge + feather, value);
      }

      void main() {
        vec3 dir = normalize(vPosition);
        float poleFade = 1.0 - smoothstep(0.78, 0.98, abs(dir.y));
        float poleBlend = smoothstep(0.84, 0.985, abs(dir.y));
        float front = smoothstep(-0.25, 0.94, -dir.z);
        float vertical = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
        float pulse = sin(uTime * 0.34) * 0.5 + 0.5;

        vec3 p = dir * 3.6;
        vec3 warp = vec3(
          fbm(p.yzx * 1.17 + vec3(0.0, uTime * 0.018, 3.0)),
          fbm(p.zxy * 1.29 + vec3(5.0, 1.0, uTime * 0.014)),
          fbm(p.xyz * 1.11 + vec3(2.0, 6.0, 0.0))
        ) - 0.5;
        vec3 q = p + warp * 0.26;
        float stain = fbm(q * 2.1 + vec3(0.0, 2.3, uTime * 0.012));
        float scumble = fbm(q * 8.2 + vec3(3.1, 0.0, 1.4));

        vec3 color = mix(uCream, uChalk, 0.34 + vertical * 0.22);

        float warmWall = band(dir.x + dir.z * 0.15, -0.56, 0.22, 0.018) * poleFade;
        float orangeTower = band(dir.x - dir.z * 0.05, -0.21, 0.13, 0.014) * poleFade;
        float yellowThrust = band(dir.x + dir.z * 0.10, 0.03, 0.11, 0.012) * poleFade;
        float peachTower = band(dir.x - dir.z * 0.08, 0.30, 0.16, 0.016) * poleFade;
        float maroonStack = band(dir.x + dir.z * 0.03, 0.58, 0.09, 0.012) * poleFade;
        float leftMint = band(dir.x - dir.z * 0.22, -0.82, 0.12, 0.018) * poleFade;
        float lowerBrown = smoothstep(0.05, 0.34, -dir.y + 0.10) * band(dir.z - dir.x * 0.15, -0.12, 0.35, 0.04) * poleFade;

        color = mix(color, uPeach, warmWall * (0.70 + 0.16 * stain));
        color = mix(color, uOrange, orangeTower * (0.82 + 0.10 * stain));
        color = mix(color, uYellow, yellowThrust * (0.82 + 0.08 * pulse));
        color = mix(color, uRose, peachTower * (0.64 + 0.12 * stain));
        color = mix(color, uMaroon, maroonStack * 0.78);
        color = mix(color, uMint, leftMint * 0.62);
        color = mix(color, uBrown, lowerBrown * 0.72);

        float diagonalA = dir.x * 0.72 + dir.y * 0.47 - dir.z * 0.32;
        float diagonalB = -dir.x * 0.62 + dir.y * 0.56 - dir.z * 0.14;
        float diagonalC = dir.x * 0.38 - dir.y * 0.58 - dir.z * 0.54;

        float tealCut = band(diagonalA, 0.10, 0.065, 0.015) * front * poleFade;
        float whiteScissorA = band(diagonalA, -0.18, 0.115, 0.020) * front * poleFade;
        float whiteScissorB = band(diagonalB, 0.13, 0.110, 0.020) * front * poleFade;
        float blackWedge = halfPlane(diagonalA, 0.33, 0.014) * (1.0 - halfPlane(diagonalB, 0.45, 0.018)) * front * poleFade;
        float blackLowerShard = band(diagonalC, -0.16, 0.055, 0.010) * front * poleFade;
        float orangeShard = halfPlane(diagonalB, -0.34, 0.018) * (1.0 - halfPlane(diagonalA, 0.20, 0.014)) * front * poleFade;
        float roseShard = band(diagonalB, -0.12, 0.095, 0.018) * smoothstep(-0.52, 0.08, dir.y) * front * poleFade;

        color = mix(color, uTeal, tealCut * 0.92);
        color = mix(color, uDeepOrange, orangeShard * 0.74);
        color = mix(color, uRose, roseShard * 0.64);
        color = mix(color, uChalk, clamp(whiteScissorA * 0.94 + whiteScissorB * 0.90, 0.0, 1.0));
        color = mix(color, uBlack, clamp(blackWedge * 0.88 + blackLowerShard * 0.82, 0.0, 0.96));

        float voidDiamond = (1.0 - halfPlane(abs(dir.x * 1.02 + dir.z * 0.04), 0.18 + vertical * 0.13, 0.025))
          * smoothstep(-0.24, 0.34, dir.y)
          * front
          * poleFade;
        color = mix(color, uChalk, voidDiamond * 0.72);

        float lineCluster = 0.0;
        lineCluster += hardLine(dir.x + dir.z * 0.036, 0.205, 0.0037);
        lineCluster += hardLine(dir.x + dir.z * 0.036, 0.218, 0.0034);
        lineCluster += hardLine(dir.x + dir.z * 0.036, 0.232, 0.0032);
        lineCluster += hardLine(dir.x + dir.z * 0.036, 0.247, 0.0030);
        float diagonalWire = hardLine(diagonalA, -0.045, 0.0045) + hardLine(diagonalB, 0.005, 0.0042);
        color = mix(color, uBlack, clamp((lineCluster * front + diagonalWire * 0.58 * front) * poleFade, 0.0, 0.78));

        float gridPulse = (
          hardLine(fract((dir.x + 1.0) * 6.0 + pulse * 0.035), 0.5, 0.010)
          + hardLine(fract((dir.y + 1.0) * 4.0 - pulse * 0.030), 0.5, 0.009)
        ) * 0.030 * poleFade;
        color = mix(color, uBlack, gridPulse);

        float darkPublicPressure = smoothstep(0.28, 0.74, dir.x - dir.z * 0.34 + pulse * 0.035) * smoothstep(-0.32, 0.58, dir.y) * front * poleFade;
        color = mix(color, uBlack, darkPublicPressure * 0.17);

        float dragged = (scumble - 0.5) * 0.090 + (stain - 0.5) * 0.055;
        float dryBrush = sin((dir.x + warp.x * 0.08) * 212.0) * sin((dir.y + warp.y * 0.04) * 173.0) * 0.018;
        color += dragged + dryBrush;
        color = mix(color, mix(uCream, uGrey, 0.35), poleBlend);
        float vignette = 0.88 + 0.12 * smoothstep(-0.92, 0.42, -dir.z);
        gl_FragColor = vec4(clamp(color * vignette, 0.0, 1.0), 1.0);
      }
    `})}function A(e,r,i,a={}){let t=a.width||128,o=a.height||128,l=new e.Color(i),s=new Uint8Array(t*o*4),c=a.alphaScale??.72,n=a.feather??.1;for(let m=0;m<o;m+=1){let u=m/Math.max(1,o-1);for(let p=0;p<t;p+=1){let b=p/Math.max(1,t-1),S=Math.min(b,1-b,u,1-u),C=g(S/n),y=.76+Math.sin(p*.19+m*.041)*.1+Math.sin(m*.27)*.06,f=r()>.972?.28:1,M=c*C*(.72+r()*.24)*f,h=(m*t+p)*4;s[h]=Math.round(g(l.r*y*1.16)*255),s[h+1]=Math.round(g(l.g*y*1.16)*255),s[h+2]=Math.round(g(l.b*y*1.16)*255),s[h+3]=Math.round(g(M)*255)}}let d=new e.DataTexture(s,t,o,e.RGBAFormat);return d.name=`zox-scumbled-flat-poster-ink-${String(i).replace("#","")}`,d.needsUpdate=!0,d.wrapS=e.ClampToEdgeWrapping,d.wrapT=e.ClampToEdgeWrapping,d.magFilter=e.LinearFilter,d.minFilter=e.LinearFilter,d.generateMipmaps=!1,e.SRGBColorSpace&&(d.colorSpace=e.SRGBColorSpace),d}function G(e,r,i,a,t){let o=new e.Mesh(i,a);return o.name=t.name,o.position.set(t.position[0],t.position[1],t.position[2]),o.rotation.set(t.rotation[0],t.rotation[1],t.rotation[2]),o.scale.set(t.scale[0],t.scale[1],1),o.userData.basePosition=o.position.clone(),o.userData.baseScale=o.scale.clone(),o.userData.baseOpacity=a.opacity,o.userData.phase=t.phase,o.userData.pulse=t.pulse,w(o,t.renderOrder),r.add(o),o}function I(e,r,i,a){let t=new e.Group;t.name="zox-ordinary-depth-color-plane-pressure",i.add(t);let o=new e.PlaneGeometry(1,1,1,1);a.geometries.push(o);let l=[{name:"left-orange-vertical-public-pressure-slab",color:"#e96a16",opacity:.44,position:[-7.2,1.25,-8.6],rotation:[0,.42,.02],scale:[4.8,11.2],renderOrder:-64},{name:"left-yellow-tall-thrust-plane",color:"#e9b43f",opacity:.42,position:[-2.6,.5,-9.8],rotation:[0,.15,-.01],scale:[4,12.8],renderOrder:-62},{name:"right-black-netanyahu-pressure-anchor",color:"#10100e",opacity:.58,position:[6.8,.85,-7.8],rotation:[0,-.38,.03],scale:[5.6,11.6],renderOrder:-58},{name:"low-brown-grounding-rectangle",color:"#7d654a",opacity:.36,position:[1.2,-2.75,-7.1],rotation:[-.06,-.08,0],scale:[15.8,3.2],renderOrder:-55},{name:"far-mint-open-ground-panel",color:"#94bfb0",opacity:.3,position:[-9.8,.35,-12.6],rotation:[0,.78,0],scale:[4.6,8.2],renderOrder:-68},{name:"right-maroon-vertical-stress-panel",color:"#642423",opacity:.38,position:[10.2,1.15,-10.7],rotation:[0,-.74,.02],scale:[3.4,10.4],renderOrder:-66},{name:"central-cream-active-void-plane",color:"#f5edda",opacity:.34,position:[0,1.7,-6.35],rotation:[0,0,0],scale:[5.2,8.8],renderOrder:-42}];for(let s=0;s<l.length;s+=1){let c=l[s],n=A(e,r,c.color,{width:s<3?160:128,height:s<3?192:128,alphaScale:c.opacity>.5?.88:.74,feather:c.name.includes("void")?.18:.09});a.textures.push(n);let d=new e.MeshBasicMaterial({name:`${c.name}-flat-scumbled-ink`,map:n,transparent:!0,opacity:c.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});a.materials.push(d),G(e,t,o,d,{...c,phase:r()*Math.PI*2,pulse:.01+r()*.016})}return t}function L(e,r){let i=new e.Shape;i.moveTo(r[0][0],r[0][1]);for(let a=1;a<r.length;a+=1)i.lineTo(r[a][0],r[a][1]);return i.closePath(),new e.ShapeGeometry(i)}function _(e,r,i,a){let t=new e.Group;t.name="zox-hard-edge-cut-wedge-field",i.add(t);let o=[{name:"teal-diagonal-kuwait-bahrain-counterband",color:"#237f7a",opacity:.62,points:[[-6.4,-.55],[6.8,.62],[6.1,1.18],[-7.1,.02]],position:[.1,.2,-5.9],rotation:[0,-.05,0],renderOrder:-34},{name:"orange-opposing-triangle-retaliation-plane",color:"#e96a16",opacity:.55,points:[[-5.4,2.85],[.8,-.72],[-2.8,-1.05]],position:[-2.8,-.2,-4.9],rotation:[0,.1,0],renderOrder:-31},{name:"black-scissors-jack-fracture-anchor",color:"#10100e",opacity:.66,points:[[-.6,2.6],[5.4,0],[.3,-1]],position:[3.7,.1,-4.6],rotation:[0,-.18,0],renderOrder:-29},{name:"cream-inverted-v-negative-space",color:"#f5edda",opacity:.64,points:[[-1,3.5],[0,0],[.95,3.5],[.44,3.5],[0,1.5],[-.48,3.5]],position:[0,-.85,-3.8],rotation:[0,0,0],renderOrder:-22}];for(let l of o){let s=L(e,l.points);a.geometries.push(s);let c=new e.MeshBasicMaterial({name:`${l.name}-matte-hard-edge`,color:l.color,transparent:!0,opacity:l.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});a.materials.push(c);let n=new e.Mesh(s,c);n.name=l.name,n.position.set(l.position[0],l.position[1],l.position[2]),n.rotation.set(l.rotation[0],l.rotation[1],l.rotation[2]),n.userData.basePosition=n.position.clone(),n.userData.baseRotation=n.rotation.clone(),n.userData.baseOpacity=l.opacity,n.userData.phase=r()*Math.PI*2,w(n,l.renderOrder),t.add(n)}return t}function N(e,r,i){let a=new e.Group;a.name="zox-thin-black-line-cluster-public-pressure",r.add(a);let t=new e.MeshBasicMaterial({name:"zox-black-contour-anchor-lines",color:"#10100e",transparent:!0,opacity:.78,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});i.materials.push(t);let o=[{x:1.52,y:.1,z:-3.2,h:7.2,w:.018},{x:1.66,y:.1,z:-3.22,h:7,w:.014},{x:1.8,y:.1,z:-3.24,h:7.4,w:.014},{x:1.94,y:.1,z:-3.26,h:7.1,w:.012},{x:0,y:-.1,z:-3,h:8.6,w:.012,rotationZ:1.05},{x:-1,y:-.34,z:-3.05,h:8,w:.01,rotationZ:-.98}];for(let l=0;l<o.length;l+=1){let s=o[l],c=new e.PlaneGeometry(s.w,s.h,1,1);i.geometries.push(c);let n=new e.Mesh(c,t);n.name=`zox-incised-pressure-line-${String(l+1).padStart(2,"0")}`,n.position.set(s.x,s.y,s.z),n.rotation.set(0,0,s.rotationZ||0),n.userData.basePosition=n.position.clone(),n.userData.phase=l*.71,w(n,-18+l),a.add(n)}return a}function q(e){e.traverse?.(r=>{r.geometry&&typeof r.geometry.dispose=="function"&&r.geometry.dispose();let i=Array.isArray(r.material)?r.material:[r.material].filter(Boolean);for(let a of i)a&&typeof a.dispose=="function"&&a.dispose()})}function Z({THREE:e,part:r,world:i,seed:a,camera:t,utilities:o}={}){let l=D(o,a||r?.id||"world-environment","larry-zox-trump-fracture-pressure"),s=new e.Group;s.name="world-environment-larry-zox-public-fracture-pressure",s.userData={partId:"world-environment",role:r?.role||"world-environment",packetId:k,packetHash:z,selectedNews:"As Iran again targets Kuwait and Bahrain following US attacks, Trump accuses Netanyahu of being completely crazy",artist:"Larry Zox",environmentIntent:"single surrounding shell of hard-edge vertical thrust, asymmetric warm/cool slabs, central cream void, black contour anchors, and slow public fracture pressure"};let c={geometries:[],materials:[],textures:[]},n=F(i),d=W(e);c.materials.push(d);let m;o&&typeof o.createSkyboxShell=="function"?m=o.createSkyboxShell({radius:n,name:"single-larry-zox-fracture-pressure-skybox-shell",geometryKind:"box",color:"#eee2c5",opacity:1,cameraPinned:!0,userData:{immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",role:"world-environment",packetId:k,packetHash:z,singleShellReview:"only enclosing shell; shader owns all-over Larry Zox atmosphere and selected-news fracture pressure"}}):(m=O(e,n,d),c.geometries.push(m.geometry));let u=m.object||m,p=m.mesh||u.mesh||u.children?.find(f=>f&&f.isMesh);u.name="single-larry-zox-fracture-pressure-skybox-shell",u.userData={...u.userData,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",role:"world-environment",packetId:k,packetHash:z,environmentRadius:n},u.renderOrder=-1e3,u.frustumCulled=!1,p&&(p.material&&p.material!==d&&typeof p.material.dispose=="function"&&p.material.dispose(),p.name="larry-zox-position-space-fracture-shell-mesh",p.material=d,u.material=d,w(p,-1e3)),s.add(u);let b=I(e,l,s,c),S=_(e,l,s,c),C=N(e,s,c);function y(f={}){let M=f.captureMode?0:Number(f.elapsedSeconds??f.time??0),h=Number.isFinite(M)?M:0,v=Number.isFinite(Number(f.motionIntensity))?Number(f.motionIntensity):1;d.uniforms.uTime.value=h,!o?.createSkyboxShell&&t?.position&&(u.position.copy(t.position),u.updateMatrixWorld(!0));for(let x of b.children){let P=Math.sin(h*.13+x.userData.phase)*x.userData.pulse*v;x.scale.set(x.userData.baseScale.x*(1+P),x.userData.baseScale.y*(1+P*.35),1),x.material.opacity=x.userData.baseOpacity*(.965+Math.sin(h*.1+x.userData.phase)*.035*v)}S.rotation.z=Math.sin(h*.045)*.01*v,S.rotation.y=Math.sin(h*.033)*.014*v,C.position.x=Math.sin(h*.18)*.025*v}return y({captureMode:!0,elapsedSeconds:0,camera:t}),{object:s,update:y,dispose(){q(s);for(let f of c.textures)f?.dispose?.()}}}export{Z as createImmersiveWorldPart};
