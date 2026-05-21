var L="art-direction-packet-bafab7d70cb7",_="bafab7d70cb7e7e64c3e9a0d67ddff1a";function $(e){let i=String(e??"emily-mason-pressure"),r=2166136261;for(let n=0;n<i.length;n+=1)r^=i.charCodeAt(n),r=Math.imul(r,16777619);return r>>>0}function Z(e,i,r){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(i,r);let n=($(i)^$(r))>>>0;return function(){n=n+1831565813>>>0;let t=n;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function k(e){return Math.max(0,Math.min(1,e))}function B(e,i){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=i,e}function T(e,i,r){let n=new e.Group;n.name="single-emily-mason-pressure-skybox-shell",n.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",packetId:L,packetHash:_,environmentGeometryKind:"box",environmentRadius:i};let o=2/Math.sqrt(3),t=new e.BoxGeometry(o,o,o,1,1,1),s=new e.Mesh(t,r);return s.name="emily-mason-position-space-stain-shell-mesh",s.scale.setScalar(i),B(s,-1e3),s.onBeforeRender=function(y,C,x){x&&x.position&&(n.position.copy(x.position),n.updateMatrixWorld(!0))},n.add(s),n.object=n,n.mesh=s,n.material=r,n.geometry=t,n}function R(e){return new e.ShaderMaterial({name:"emily_mason_position_space_wash_pressure_skybox",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uCream:{value:new e.Color("#e8dbc0")},uOchre:{value:new e.Color("#c87b1c")},uAmber:{value:new e.Color("#d9a640")},uTurquoise:{value:new e.Color("#169caa")},uCobalt:{value:new e.Color("#123f86")},uBlueBlack:{value:new e.Color("#071428")},uViolet:{value:new e.Color("#685083")},uRed:{value:new e.Color("#b42a1f")},uMaroon:{value:new e.Color("#521c1d")},uLime:{value:new e.Color("#c7c93a")}},vertexShader:`
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
      uniform vec3 uOchre;
      uniform vec3 uAmber;
      uniform vec3 uTurquoise;
      uniform vec3 uCobalt;
      uniform vec3 uBlueBlack;
      uniform vec3 uViolet;
      uniform vec3 uRed;
      uniform vec3 uMaroon;
      uniform vec3 uLime;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
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
        float nxy0 = mix(nx00, nx10, f.y);
        float nxy1 = mix(nx01, nx11, f.y);
        return mix(nxy0, nxy1, f.z);
      }

      float fbm(vec3 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i += 1) {
          value += noise(p) * amp;
          p = p * 2.04 + vec3(8.3, 3.7, 5.1);
          amp *= 0.52;
        }
        return value;
      }

      float band(float value, float center, float width, float feather) {
        return smoothstep(center - width - feather, center - width, value)
          - smoothstep(center + width, center + width + feather, value);
      }

      vec3 softLight(vec3 base, vec3 blend, float amount) {
        return mix(base, 1.0 - 2.0 * (1.0 - base) * (1.0 - blend), clamp(amount, 0.0, 1.0));
      }

      void main() {
        vec3 dir = normalize(vPosition);
        vec3 p = dir * 3.2;
        float poleFade = 1.0 - smoothstep(0.78, 0.97, abs(dir.y));
        float poleBlend = smoothstep(0.84, 0.985, abs(dir.y));
        float slow = uTime * 0.018;

        vec3 warp = vec3(
          fbm(p.yzx * 1.45 + vec3(0.0, slow, 0.7)),
          fbm(p.xzy * 1.25 + vec3(1.7, 0.0, slow)),
          fbm(p.xyz * 1.65 + vec3(slow, 2.1, 0.0))
        ) - 0.5;
        vec3 q = p + warp * 0.72;

        float front = smoothstep(-0.52, 0.78, -dir.z);
        float side = smoothstep(-0.95, 0.72, dir.x);
        float vertical = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
        float wash = fbm(q * 1.1 + vec3(0.0, slow * 0.6, 1.0));
        float stain = fbm(q * 2.45 + vec3(3.2, slow, 2.4));
        float grain = fbm(q * 9.0 + vec3(0.0, 1.5, slow));

        float warmMass = smoothstep(-0.62, 0.52, -dir.x + dir.y * 0.22 + wash * 0.36);
        float coolMass = smoothstep(-0.34, 0.72, dir.x - dir.y * 0.08 + dir.z * 0.18 + stain * 0.26);
        vec3 base = mix(uCream, uOchre, warmMass * 0.78);
        base = mix(base, uAmber, smoothstep(0.48, 0.94, wash) * (1.0 - coolMass) * 0.42);
        base = mix(base, uTurquoise, coolMass * 0.66);
        base = mix(base, uCobalt, smoothstep(0.52, 0.95, coolMass + stain * 0.24) * 0.52);
        base = mix(base, uViolet, smoothstep(0.35, 0.96, dir.z + grain * 0.36) * 0.24);

        float diagonal = dir.x * 0.72 - dir.y * 0.28 - dir.z * 0.36 + (stain - 0.5) * 0.33;
        float darkPressure = band(diagonal, 0.04, 0.17, 0.22) * front * poleFade;
        float blackPool = smoothstep(0.58, 0.92, stain) * smoothstep(-0.18, 0.52, -dir.y) * front * poleFade;
        float redEdge = band(diagonal, 0.28, 0.035, 0.08) * smoothstep(0.42, 0.84, wash) * front * poleFade;
        float maroonDrag = band(diagonal, -0.17, 0.055, 0.11) * front * poleFade;
        float horizonThread = band(dir.y + (wash - 0.5) * 0.055, -0.07, 0.012, 0.035) * front * poleFade;
        float limePressure = smoothstep(0.76, 0.94, fbm(q * 3.7 + vec3(5.0, 0.0, slow))) * band(dir.y, -0.28, 0.09, 0.18) * front * poleFade;

        base = mix(base, uBlueBlack, clamp(darkPressure * 0.82 + blackPool * 0.54 + horizonThread * 0.62, 0.0, 0.86));
        base = mix(base, uMaroon, maroonDrag * 0.48);
        base = mix(base, uRed, redEdge * 0.82);
        base = mix(base, uLime, limePressure * 0.38);

        float verticalDrip = pow(smoothstep(0.58, 0.88, noise(vec3(dir.x * 19.0, dir.z * 5.2, 0.6))), 2.0)
          * smoothstep(0.08, 0.62, vertical)
          * (1.0 - smoothstep(0.72, 0.96, vertical))
          * poleFade;
        base = mix(base, uBlueBlack, verticalDrip * 0.16);

        float weaveX = sin((dir.x + warp.x * 0.08) * 190.0);
        float weaveY = sin((dir.y + warp.y * 0.06) * 160.0);
        float weave = (weaveX * weaveY) * 0.018 + (grain - 0.5) * 0.085;
        base += weave;
        base = softLight(base, vec3(1.0, 0.88, 0.67), smoothstep(0.22, 0.78, wash) * 0.12);

        vec3 calmTopBottom = mix(mix(uOchre, uCream, vertical), mix(uCobalt, uCream, 0.42), smoothstep(-0.2, 0.8, dir.x));
        base = mix(base, calmTopBottom, poleBlend);
        float vignette = 0.88 + 0.12 * smoothstep(-0.92, 0.46, -dir.z);
        gl_FragColor = vec4(clamp(base * vignette, 0.0, 1.0), 1.0);
      }
    `})}function H(e,i,r,n={}){let o=n.width||160,t=n.height||96,s=new e.Color(r),c=new Uint8Array(o*t*4),y=n.feather??.16,C=n.alphaScale??1,x=n.horizontalPull??.18;for(let h=0;h<t;h+=1){let g=h/Math.max(1,t-1);for(let d=0;d<o;d+=1){let b=d/Math.max(1,o-1),D=Math.min(b,1-b,g,1-g),z=k(D/y),O=k(1-Math.pow((b-.5)/(.55+x),2)-Math.pow((g-.52)/.66,2)),S=.78+Math.sin(d*.19+h*.061+i()*1.3)*.08+Math.sin(h*.31)*.05,P=.78+i()*.28,M=C*z*Math.pow(k(O),.42)*(.7+i()*.24),v=(h*o+d)*4;c[v]=Math.round(k(s.r*S*P*1.22)*255),c[v+1]=Math.round(k(s.g*S*P*1.22)*255),c[v+2]=Math.round(k(s.b*S*P*1.22)*255),c[v+3]=Math.round(k(M)*255)}}let l=new e.DataTexture(c,o,t,e.RGBAFormat);return l.name=`soft-stain-${String(r).replace("#","")}`,l.needsUpdate=!0,l.wrapS=e.ClampToEdgeWrapping,l.wrapT=e.ClampToEdgeWrapping,l.magFilter=e.LinearFilter,l.minFilter=e.LinearFilter,l.generateMipmaps=!1,e.SRGBColorSpace&&(l.colorSpace=e.SRGBColorSpace),l}function E(e){let r=new Uint8Array(9216),n=47*.5;for(let t=0;t<48;t+=1)for(let s=0;s<48;s+=1){let c=(s-n)/n,y=(t-n)/n,C=Math.sqrt(c*c+y*y),x=Math.pow(k(1-C),2.2),l=(t*48+s)*4;r[l]=255,r[l+1]=255,r[l+2]=255,r[l+3]=Math.round(x*255)}let o=new e.DataTexture(r,48,48,e.RGBAFormat);return o.name="round-soft-pigment-point",o.needsUpdate=!0,o.wrapS=e.ClampToEdgeWrapping,o.wrapT=e.ClampToEdgeWrapping,o.magFilter=e.LinearFilter,o.minFilter=e.LinearFilter,o.generateMipmaps=!1,o}function ee(e,i,r,n,o){let t=new e.Mesh(r,n);return t.name=o.name,t.position.set(o.position[0],o.position[1],o.position[2]),t.rotation.set(o.rotation[0],o.rotation[1],o.rotation[2]),t.scale.set(o.scale[0],o.scale[1],1),t.userData.baseY=t.position.y,t.userData.baseOpacity=n.opacity,t.userData.phase=o.phase,t.userData.floatAmount=o.floatAmount,B(t,o.renderOrder),i.add(t),t}function te({THREE:e,part:i,world:r,seed:n,utilities:o}){let t=Z(o,n||i?.id||"world-environment","emily-mason-half-liters-world-environment"),s=new e.Group;s.name="world-environment-emily-mason-flow-pressure",s.userData={partId:"world-environment",role:i?.role||"world-environment",packetId:L,packetHash:_,selectedNews:"Four glasses of beer? Half-liters, yes: trial continues after four young footballers were hit",artist:"Emily Mason",shellCountIntent:1,shellOwnership:"one true enclosing skybox shell; all other marks are ordinary non-enclosing depth geometry"};let c=[],y=[],C=[],x=Number(r?.environment?.skyboxRadius||r?.environment?.radius),l=Number.isFinite(x)&&x>0?Math.max(48,Math.min(120,x)):84,h=R(e);y.push(h);let g;o&&typeof o.createSkyboxShell=="function"?g=o.createSkyboxShell({radius:l,name:"single-emily-mason-pressure-skybox-shell",geometryKind:"box",color:"#e8dbc0",opacity:1,cameraPinned:!0,userData:{immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",role:"world-environment",packetId:L,packetHash:_,singleShellReview:"the only enclosing shell; shader contains veils, stains, diagonal pressure, and pole-safe top/bottom wash"}}):(g=T(e,l,h),c.push(g.geometry));let d=g.object||g,b=g.mesh||d.mesh||d.children?.find(a=>a&&a.isMesh);d.name="single-emily-mason-pressure-skybox-shell",d.userData={...d.userData,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",role:"world-environment",packetId:L,packetHash:_,environmentRadius:l,singleShellReview:"the one true enclosing shell for the world-environment part"},d.renderOrder=-1e3,d.frustumCulled=!1,b&&(b.material&&b.material!==h&&typeof b.material.dispose=="function"&&b.material.dispose(),b.name="emily-mason-position-space-stain-shell-mesh",b.material=h,d.material=h,b.scale.setScalar(l),B(b,-1e3)),s.add(d);let D=new e.PlaneGeometry(1,1,1,1);c.push(D);let z=new e.Group;z.name="ordinary-depth-stained-pressure-planes",s.add(z);let O=[{name:"left-ochre-large-stained-counterfield",color:"#c87b1c",opacity:.48,position:[-7.4,.9,-6.6],rotation:[.02,.34,-.03],scale:[20.8,7.3],renderOrder:-52},{name:"right-turquoise-blue-submerged-field",color:"#1597c9",opacity:.42,position:[7.2,-.1,-7.2],rotation:[.01,-.34,.02],scale:[22.4,6.5],renderOrder:-51},{name:"central-dark-blue-against-pressure-wedge",color:"#071428",opacity:.64,position:[1,1,-5.7],rotation:[.02,-.05,-.29],scale:[18.6,2.35],renderOrder:-47},{name:"low-smoky-violet-negative-space-band",color:"#685083",opacity:.31,position:[-1.5,-2.55,-6.1],rotation:[.07,.04,.08],scale:[24.2,4.6],renderOrder:-46},{name:"thin-red-trial-friction-stain",color:"#b42a1f",opacity:.6,position:[-.25,.45,-4.6],rotation:[.02,-.01,-.2],scale:[10.8,.52],renderOrder:-39},{name:"amber-cream-veiled-recessive-wash",color:"#e8dbc0",opacity:.3,position:[.4,2.7,-10.8],rotation:[-.04,0,.03],scale:[26,7.6],renderOrder:-56},{name:"side-maroon-absorbed-pressure-residue",color:"#521c1d",opacity:.25,position:[-13.8,-.3,-1.2],rotation:[0,1.15,-.08],scale:[18.8,5.4],renderOrder:-43},{name:"side-cobalt-cool-weight-residue",color:"#123f86",opacity:.28,position:[13.4,-.2,-1.4],rotation:[0,-1.15,.06],scale:[19.4,5.6],renderOrder:-42}];for(let a=0;a<O.length;a+=1){let u=O[a],m=H(e,t,u.color,{width:a<4?192:160,height:a<4?112:80,alphaScale:.92,feather:u.name.includes("thin")?.24:.16,horizontalPull:u.name.includes("wedge")?.34:.18});C.push(m);let p=new e.MeshBasicMaterial({name:`${u.name}-matte-stain-material`,map:m,transparent:!0,opacity:u.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});y.push(p),ee(e,z,D,p,{...u,phase:t()*Math.PI*2,floatAmount:.012+t()*.02})}let S=new e.BufferGeometry;c.push(S);let P=86,M=new Float32Array(P*2*3),v=new Float32Array(P*2*3),Y=[new e.Color("#071428"),new e.Color("#b42a1f"),new e.Color("#123f86"),new e.Color("#c87b1c"),new e.Color("#521c1d"),new e.Color("#e8dbc0")];for(let a=0;a<P;a+=1){let u=a%2===0?-1:1,m=-3.2-t()*13.6,p=u*(2.4+t()*9.8),f=-2.6+t()*5.8,J=.7+t()*3.4,Q=(t()-.5)*.72,w=a*6;M[w]=p,M[w+1]=f,M[w+2]=m,M[w+3]=p-u*J,M[w+4]=f+Q,M[w+5]=m-t()*.8;let F=Y[a%Y.length];v[w]=F.r,v[w+1]=F.g,v[w+2]=F.b,v[w+3]=F.r,v[w+4]=F.g,v[w+5]=F.b}S.setAttribute("position",new e.BufferAttribute(M,3)),S.setAttribute("color",new e.BufferAttribute(v,3));let V=new e.LineBasicMaterial({name:"wandering-dark-red-blue-incised-pressure-lines",vertexColors:!0,transparent:!0,opacity:.5,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});y.push(V);let A=new e.LineSegments(S,V);A.name="ordinary-mid-depth-wandering-pressure-lines",B(A,-28),s.add(A);let N=E(e);C.push(N);let G=new e.BufferGeometry;c.push(G);let K=260,I=new Float32Array(K*3),W=new Float32Array(K*3),j=[new e.Color("#b42a1f"),new e.Color("#071428"),new e.Color("#1597c9"),new e.Color("#c87b1c"),new e.Color("#c7c93a"),new e.Color("#685083")];for(let a=0;a<K;a+=1){let u=t()*Math.PI*2,m=4.6+t()*12.8,p=a%5!==0;I[a*3]=Math.sin(u)*m*(p?1:.28),I[a*3+1]=-3.2+t()*6.6,I[a*3+2]=-2.6-t()*12.6;let f=j[a%j.length];W[a*3]=f.r,W[a*3+1]=f.g,W[a*3+2]=f.b}G.setAttribute("position",new e.BufferAttribute(I,3)),G.setAttribute("color",new e.BufferAttribute(W,3));let U=new e.PointsMaterial({name:"soft-round-high-chroma-pigment-deposits",size:.34,map:N,alphaMap:N,transparent:!0,opacity:.5,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});y.push(U);let q=new e.Points(G,U);q.name="ordinary-depth-soft-pigment-deposit-field",B(q,-20),s.add(q);function X(a={}){let u=a.captureMode?0:Number(a.elapsedSeconds??a.time??0),m=Number.isFinite(u)?u:0;h.uniforms.uTime.value=m;let p=Number.isFinite(Number(a.motionIntensity))?Number(a.motionIntensity):1;for(let f of z.children)f.position.y=f.userData.baseY+Math.sin(m*.08+f.userData.phase)*f.userData.floatAmount*p,f.material.opacity=f.userData.baseOpacity*(.965+Math.sin(m*.11+f.userData.phase)*.035*p);A.rotation.y=Math.sin(m*.026)*.018*p,A.rotation.z=Math.sin(m*.034)*.01*p,q.rotation.y=Math.sin(m*.021)*.028*p,U.opacity=.47+Math.sin(m*.19)*.025*p}return X({captureMode:!0,elapsedSeconds:0}),{object:s,update:X,dispose(){for(let a of C)a?.dispose?.();for(let a of y)a?.dispose?.();for(let a of c)a?.dispose?.()}}}export{te as createImmersiveWorldPart};
