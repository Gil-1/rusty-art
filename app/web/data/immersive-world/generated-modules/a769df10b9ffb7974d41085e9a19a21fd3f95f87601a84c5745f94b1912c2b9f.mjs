var A="art-direction-packet-0f87c43ee66b",k="0f87c43ee66b783d32924c4677074f39";function F(e){let a=String(e??"rothko-union-cup-pressure"),l=2166136261;for(let r=0;r<a.length;r+=1)l^=a.charCodeAt(r),l=Math.imul(l,16777619);return l>>>0}function N(e,a,l){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(a,l);let r=(F(a)^F(l))>>>0;return function(){r=r+1831565813>>>0;let i=r;return i=Math.imul(i^i>>>15,i|1),i^=i+Math.imul(i^i>>>7,i|61),((i^i>>>14)>>>0)/4294967296}}function U(e){e.traverse(a=>{a.geometry&&typeof a.geometry.dispose=="function"&&a.geometry.dispose();let l=Array.isArray(a.material)?a.material:[a.material].filter(Boolean);for(let r of l)r&&typeof r.dispose=="function"&&r.dispose()})}function V(e,a,l){let r=new e.Group;r.name=l,r.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,environmentGeometryKind:"box",environmentRadius:a};let p=2/Math.sqrt(3),i=new e.BoxGeometry(p,p,p,1,1,1),c=new e.MeshBasicMaterial({color:"#140c11",side:e.BackSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),u=new e.Mesh(i,c);return u.name=`${l}-mesh`,u.scale.setScalar(a),u.castShadow=!1,u.receiveShadow=!1,u.frustumCulled=!1,r.add(u),r.mesh=u,r.object=r,r.material=c,r.geometry=i,r}function Y(e,a=!1,l=1,r=null){return r&&typeof r.createPositionSpaceSkyboxMaterial=="function"?r.createPositionSpaceSkyboxMaterial({name:a?"rothko_union_soft_seam_veil_shell_position_space":"rothko_union_position_space_color_field_shell",transparent:a,opacity:l,veil:a,upperLeft:"#16112b",upperRight:"#4b5b49",lower:"#9a3b22",lowerAccent:"#c97724",hinge:"#120d0d",band:"#063dc7",accent:"#c51c12",smoke:"#2a2923",domainScale:1,stainStrength:a?.7:1}):new e.ShaderMaterial({name:a?"rothko_union_soft_seam_veil_shell":"rothko_union_position_space_color_field_shell",side:e.BackSide,transparent:a,opacity:l,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uOpacity:{value:l},uVeil:{value:a?1:0},uBurgundy:{value:new e.Color("#42183a")},uMaroon:{value:new e.Color("#702720")},uVioletBlack:{value:new e.Color("#16112b")},uGreen:{value:new e.Color("#4b5b49")},uTeal:{value:new e.Color("#0d6970")},uRust:{value:new e.Color("#9a3b22")},uOchre:{value:new e.Color("#c97724")},uHinge:{value:new e.Color("#120d0d")},uCobalt:{value:new e.Color("#063dc7")},uRedPulse:{value:new e.Color("#c51c12")},uSmoke:{value:new e.Color("#2a2923")}},vertexShader:`
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uBurgundy;
      uniform vec3 uMaroon;
      uniform vec3 uVioletBlack;
      uniform vec3 uGreen;
      uniform vec3 uTeal;
      uniform vec3 uRust;
      uniform vec3 uOchre;
      uniform vec3 uHinge;
      uniform vec3 uCobalt;
      uniform vec3 uRedPulse;
      uniform vec3 uSmoke;

      float hash31(vec3 p) {
        p = fract(p * vec3(127.1, 311.7, 74.7));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }

      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), u.x),
            mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), u.x),
            u.y
          ),
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), u.x),
            mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), u.x),
            u.y
          ),
          u.z
        );
      }

      float fbm3(vec3 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amp * noise3(p);
          p = p * 2.03 + vec3(8.3, 4.7, 6.1);
          amp *= 0.5;
        }
        return value;
      }

      float softBand(float y, float center, float halfHeight, float feather) {
        return 1.0 - smoothstep(halfHeight, halfHeight + feather, abs(y - center));
      }

      float softRect(float x, float y, float halfWidth, float centerY, float halfHeight, float feather) {
        float sx = 1.0 - smoothstep(halfWidth, halfWidth + feather, abs(x));
        float sy = 1.0 - smoothstep(halfHeight, halfHeight + feather, abs(y - centerY));
        return sx * sy;
      }

      void main() {
        vec3 dir = normalize(vPosition);
        float front = smoothstep(0.05, 0.82, -dir.z);
        float x = clamp(dir.x * 1.18, -1.3, 1.3);
        float y = dir.y;
        float slow = uTime * 0.018;
        vec3 domain = vec3(dir.x * 1.35, dir.y * 1.15, dir.z * 1.35);
        float broad = fbm3(domain * 1.65 + vec3(slow, -slow * 0.4, slow * 0.27));
        float fiber = fbm3(domain * 14.0 + vec3(0.0, slow * 2.0, -slow));
        float seamDrift = (broad - 0.5) * 0.13 + sin((dir.x - dir.z) * 2.2 + uTime * 0.045) * 0.015;

        vec3 upperLeft = mix(uVioletBlack, uBurgundy, 0.36 + broad * 0.62);
        vec3 upperRight = mix(uGreen, uTeal, 0.14 + broad * 0.34);
        vec3 upper = mix(upperLeft, upperRight, smoothstep(-0.1 + seamDrift, 0.22 + seamDrift, x));
        vec3 lower = mix(uRust, uOchre, 0.18 + broad * 0.68);
        vec3 color = mix(lower, upper, smoothstep(-0.1 + seamDrift, 0.18 + seamDrift, y));

        float lowWeight = softRect(x * 0.82, y, 0.92, -0.56 + seamDrift * 0.5, 0.32, 0.16);
        float upperPane = softRect(x * 0.92, y, 0.9, 0.38 + seamDrift * 0.35, 0.34, 0.13);
        float hinge = softBand(y + seamDrift * 0.65, -0.1, 0.072, 0.1) * (0.5 + 0.5 * smoothstep(1.18, 0.2, abs(x)));
        float tealPressure = softBand(y + seamDrift, -0.19, 0.035, 0.075) * smoothstep(-0.92, 0.64, x);
        float cobaltPulse = softBand(y + seamDrift, -0.31, 0.032, 0.062) * (0.24 + 0.76 * smoothstep(0.96, 0.04, abs(x + 0.22)));
        float redFracture = softBand(x + seamDrift * 0.8, 0.0, 0.025, 0.055) * smoothstep(-0.42, 0.2, y) * smoothstep(0.78, 0.18, abs(y));

        color = mix(color, upper, upperPane * 0.42);
        color = mix(color, mix(uRust, uOchre, 0.36 + broad * 0.5), lowWeight * 0.48);
        color = mix(color, uHinge, hinge * 0.82);
        color = mix(color, uTeal, tealPressure * 0.58);
        color = mix(color, uCobalt, cobaltPulse * 0.86);
        color = mix(color, uRedPulse, redFracture * 0.72);

        float sideDark = smoothstep(0.68, 1.22, abs(x)) * (0.26 + broad * 0.32);
        color = mix(color, uHinge, sideDark);
        float smokyTop = smoothstep(0.68, 0.98, y) * (0.08 + broad * 0.08);
        color = mix(color, uSmoke, smokyTop);

        float stained = (broad - 0.5) * 0.18 + (fiber - 0.5) * 0.06;
        float verticalDrag = sin((dir.x - dir.z) * 46.0 + fiber * 3.0) * 0.022 * smoothstep(0.35, 0.95, broad);
        color += stained + verticalDrag;
        color *= 1.14 + 0.32 * front;
        color += vec3(0.036, 0.022, 0.014) * front;
        color = pow(max(color, vec3(0.0)), vec3(1.02));

        float veilAlpha = mix(1.0, (0.16 + hinge * 0.38 + cobaltPulse * 0.22 + redFracture * 0.22) * uOpacity, uVeil);
        gl_FragColor = vec4(color, veilAlpha);
      }
    `})}function L(e,a,l,r=1){let i=new e.Color(l),c=new Uint8Array(9216*4);for(let h=0;h<96;h+=1)for(let f=0;f<96;f+=1){let d=f/95,w=h/95,x=Math.min(d,1-d,w,1-w),m=Math.max(0,Math.min(1,x/.18)),g=.74+a()*.34+Math.sin(f*.41+h*.17+a()*.4)*.035,y=.78+Math.sin(h*.09+a()*2)*.07,M=Math.max(0,Math.min(255,255*r*m*(.62+a()*.34))),v=(h*96+f)*4;c[v]=Math.max(0,Math.min(255,Math.round(i.r*255*g*y*1.28))),c[v+1]=Math.max(0,Math.min(255,Math.round(i.g*255*g*y*1.28))),c[v+2]=Math.max(0,Math.min(255,Math.round(i.b*255*g*y*1.28))),c[v+3]=M}let u=new e.DataTexture(c,96,96,e.RGBAFormat);return u.needsUpdate=!0,u.colorSpace=e.SRGBColorSpace,u.wrapS=e.ClampToEdgeWrapping,u.wrapT=e.ClampToEdgeWrapping,u}function D(e,a=-40){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=a,e}function q({THREE:e,part:a,world:l,seed:r,utilities:p}){let i=new e.Group;i.name="world-environment-rothko-two-fan-zone-pressure",i.userData={partId:"world-environment",role:a?.role||"world-environment",packetId:A,packetHash:k,messagePurpose:"Surrounding Mark Rothko color-field pressure for the two fan zones before the Cup final."};let c=N(p,r||a?.id||"world-environment","rothko-union-cup-current-packet"),u=Math.max(42,Math.min(96,Number(l?.environment?.skyboxRadius||l?.environment?.radius||90))),h=p?.createSkyboxShell?p.createSkyboxShell({radius:u,name:"dominant-rothko-skybox-shell-two-fields",widthSegments:128,heightSegments:64,color:"#140c11",userData:{partId:"world-environment",packetId:A,packetHash:k}}):V(e,u,"dominant-rothko-skybox-shell-two-fields"),f=h.object||h,d=h.mesh||f.mesh||f.children.find(o=>o?.isMesh);f.name="dominant-rothko-position-space-environment",f.userData={...f.userData,partId:"world-environment",role:"world-environment",immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,packetHash:k},d&&(d.material&&typeof d.material.dispose=="function"&&d.material.dispose(),d.material=Y(e,!1,1,p),f.material=d.material,d.scale.setScalar(u),D(d,-1e3)),i.add(f);let w=p?.createSkyboxShell?p.createSkyboxShell({radius:u*.985,name:"transparent-soft-hinge-and-fracture-veil-shell",widthSegments:96,heightSegments:48,color:"#000000",opacity:.2,userData:{partId:"world-environment",packetId:A,packetHash:k,veil:!0}}):V(e,u*.985,"transparent-soft-hinge-and-fracture-veil-shell"),x=w.object||w,m=w.mesh||x.mesh||x.children.find(o=>o?.isMesh);m&&(m.material&&typeof m.material.dispose=="function"&&m.material.dispose(),m.material=Y(e,!0,.52,p),x.material=m.material,m.scale.setScalar(u*.985),D(m,-990)),x.userData={...x.userData,partId:"world-environment",immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,packetHash:k},i.add(x);let g=[],y=[],M=new e.PlaneGeometry(1,1,1,1),v=new e.Group;v.name="near-and-mid-floating-rothko-field-planes";let G=[{color:"#251329",opacity:.82,position:[-5.4,2.45,-2.6],scale:[20.8,6.6,1],rotation:[.03,.12,-.012]},{color:"#3d1b22",opacity:.7,position:[-8.6,2.2,-4],scale:[15.8,5.9,1],rotation:[.02,.27,-.035]},{color:"#34463a",opacity:.78,position:[5.8,2.42,-2.8],scale:[21.6,6.4,1],rotation:[.015,-.12,.018]},{color:"#0b4e55",opacity:.56,position:[8.8,1.9,-4.4],scale:[13.8,5,1],rotation:[.02,-.31,.04]},{color:"#7d3320",opacity:.84,position:[.1,-1.48,-2],scale:[32.4,7.2,1],rotation:[.02,0,.01]},{color:"#a35b1d",opacity:.62,position:[2.6,-2.12,-3.6],scale:[25.2,5.8,1],rotation:[.04,-.08,-.018]},{color:"#130d0d",opacity:.88,position:[0,-.28,-1.7],scale:[34.4,1.18,1],rotation:[.012,0,-.006]},{color:"#17392f",opacity:.68,position:[1.2,-.76,-1.55],scale:[29.2,.6,1],rotation:[.01,-.02,.015]},{color:"#063dc7",opacity:.82,position:[-1.8,-1.04,-1.3],scale:[21.8,.46,1],rotation:[.012,.025,-.012]},{color:"#bd1a10",opacity:.64,position:[.1,.02,-1.12],scale:[.92,5.7,1],rotation:[.02,.012,.018]}];for(let o=0;o<G.length;o+=1){let t=G[o],s=L(e,c,t.color,1);g.push(s);let b=new e.MeshBasicMaterial({map:s,transparent:!0,opacity:t.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});y.push(b);let n=new e.Mesh(M,b);n.name=`large-soft-edged-suspended-field-${o+1}`,n.position.set(t.position[0],t.position[1],t.position[2]),n.rotation.set(t.rotation[0],t.rotation[1],t.rotation[2]),n.scale.set(t.scale[0],t.scale[1],t.scale[2]),n.userData.baseY=n.position.y,n.userData.baseOpacity=t.opacity,n.userData.phase=c()*Math.PI*2,n.userData.bloom=.012+c()*.026,D(n,-38+o),v.add(n)}let O=[{color:"#421b1e",opacity:.44,position:[-12.5,-.15,.4],scale:[18.5,5.1,1],rotation:[0,1.18,-.04]},{color:"#0a3a40",opacity:.4,position:[12.4,.28,.1],scale:[19,5.2,1],rotation:[0,-1.18,.035]},{color:"#100d13",opacity:.46,position:[0,-3.45,-4.4],scale:[34,4.8,1],rotation:[.09,0,0]}];for(let o=0;o<O.length;o+=1){let t=O[o],s=L(e,c,t.color,.9);g.push(s);let b=new e.MeshBasicMaterial({map:s,transparent:!0,opacity:t.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});y.push(b);let n=new e.Mesh(M,b);n.name=`wrapping-side-pressure-field-${o+1}`,n.position.set(t.position[0],t.position[1],t.position[2]),n.rotation.set(t.rotation[0],t.rotation[1],t.rotation[2]),n.scale.set(t.scale[0],t.scale[1],t.scale[2]),n.userData.baseY=n.position.y,n.userData.baseOpacity=t.opacity,n.userData.phase=c()*Math.PI*2,n.userData.bloom=.012+c()*.018,D(n,-28+o),v.add(n)}i.add(v);let C=new e.Group;C.name="submerged-radial-finale-coupe-pressure-symbols";let z=[new e.MeshBasicMaterial({color:"#063dc7",transparent:!0,opacity:.26,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#12100f",transparent:!0,opacity:.32,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#7b3320",transparent:!0,opacity:.2,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1})];y.push(...z);for(let o=0;o<5;o+=1){let t=1.8+o*1.15,s=new e.Mesh(new e.RingGeometry(t,t+.055,128),z[o%z.length]);s.name=`soft-low-radial-pressure-halo-${o+1}`,s.position.set((o-2)*1.18,-.72-o*.13,-7.3-o*1.35),s.rotation.set(.05+o*.012,(o-2)*.035,(c()-.5)*.08),s.scale.y=.58,s.userData.phase=c()*Math.PI*2,D(s,-12+o),C.add(s)}i.add(C);let P=new e.BufferGeometry,W=220,_=new Float32Array(W*3),B=new Float32Array(W*3),I=[new e.Color("#063dc7"),new e.Color("#be1b10"),new e.Color("#17392f"),new e.Color("#9f561e"),new e.Color("#1b131a")];for(let o=0;o<W;o+=1){let t=c()*Math.PI*2,s=4.8+c()*12.6;_[o*3]=Math.sin(t)*s,_[o*3+1]=-3.1+c()*6.5,_[o*3+2]=Math.cos(t)*s-3.1;let b=I[o%I.length];B[o*3]=b.r,B[o*3+1]=b.g,B[o*3+2]=b.b}P.setAttribute("position",new e.BufferAttribute(_,3)),P.setAttribute("color",new e.BufferAttribute(B,3));let j=new e.PointsMaterial({size:.18,transparent:!0,opacity:.48,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});y.push(j);let S=new e.Points(P,j);S.name="submerged-jewel-pigment-and-edge-deposit-points",S.frustumCulled=!1,S.renderOrder=-8,i.add(S);function $(o={}){let t=o.captureMode?0:Number(o.elapsedSeconds??o.time??0);d?.material?.uniforms?.uTime&&(d.material.uniforms.uTime.value=t),m?.material?.uniforms?.uTime&&(m.material.uniforms.uTime.value=t);for(let s of v.children)s.position.y=s.userData.baseY+Math.sin(t*.08+s.userData.phase)*s.userData.bloom,s.material.opacity=s.userData.baseOpacity*(.96+Math.sin(t*.11+s.userData.phase)*.035);C.rotation.z=Math.sin(t*.04)*.02,S.rotation.y=Math.sin(t*.032)*.028}function K(){U(i);for(let o of y)o&&typeof o.dispose=="function"&&o.dispose();for(let o of g)o&&typeof o.dispose=="function"&&o.dispose();M.dispose(),P.dispose()}return{object:i,update:$,dispose:K}}export{q as createImmersiveWorldPart};
