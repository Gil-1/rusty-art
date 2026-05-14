var G="art-direction-packet-0f87c43ee66b",k="0f87c43ee66b783d32924c4677074f39";function F(e){let a=String(e??"rothko-union-cup-pressure"),c=2166136261;for(let s=0;s<a.length;s+=1)c^=a.charCodeAt(s),c=Math.imul(c,16777619);return c>>>0}function N(e,a,c){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(a,c);let s=(F(a)^F(c))>>>0;return function(){s=s+1831565813>>>0;let r=s;return r=Math.imul(r^r>>>15,r|1),r^=r+Math.imul(r^r>>>7,r|61),((r^r>>>14)>>>0)/4294967296}}function U(e){e.traverse(a=>{a.geometry&&typeof a.geometry.dispose=="function"&&a.geometry.dispose();let c=Array.isArray(a.material)?a.material:[a.material].filter(Boolean);for(let s of c)s&&typeof s.dispose=="function"&&s.dispose()})}function V(e,a,c){let s=new e.Group;s.name=c,s.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,environmentRadius:a};let m=new e.SphereGeometry(1,96,48),r=new e.MeshBasicMaterial({color:"#140c11",side:e.BackSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),i=new e.Mesh(m,r);return i.name=`${c}-mesh`,i.scale.setScalar(a),i.castShadow=!1,i.receiveShadow=!1,i.frustumCulled=!1,s.add(i),s.mesh=i,s.object=s,s.material=r,s.geometry=m,s}function Y(e,a=!1,c=1){return new e.ShaderMaterial({name:a?"rothko_union_soft_seam_veil_shell":"rothko_union_position_space_color_field_shell",side:e.BackSide,transparent:a,opacity:c,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uOpacity:{value:c},uVeil:{value:a?1:0},uBurgundy:{value:new e.Color("#271126")},uMaroon:{value:new e.Color("#5a211f")},uVioletBlack:{value:new e.Color("#0d0b1b")},uGreen:{value:new e.Color("#334236")},uTeal:{value:new e.Color("#0b4f54")},uRust:{value:new e.Color("#7b2c1e")},uOchre:{value:new e.Color("#b56b21")},uHinge:{value:new e.Color("#120d0d")},uCobalt:{value:new e.Color("#063dc7")},uRedPulse:{value:new e.Color("#c51c12")},uSmoke:{value:new e.Color("#2a2923")}},vertexShader:`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vDir;
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

      float hash(vec2 p) {
        p = fract(p * vec2(127.1, 311.7));
        p += dot(p, p + 19.19);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amp * noise(p);
          p = p * 2.07 + vec2(8.3, 4.7);
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
        vec3 dir = normalize(vDir);
        float front = smoothstep(0.05, 0.82, -dir.z);
        float angle = atan(dir.x, -dir.z);
        float x = clamp(angle / 1.18, -1.3, 1.3);
        float y = dir.y;
        float slow = uTime * 0.018;
        float broad = fbm(vec2(angle * 1.15 + slow, y * 3.2));
        float fiber = fbm(vec2(angle * 18.0 + y * 3.0, y * 30.0 - slow * 2.0));
        float seamDrift = (broad - 0.5) * 0.13 + sin(angle * 3.0 + uTime * 0.045) * 0.015;

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
        float smokyTop = smoothstep(0.58, 0.95, y) * (0.18 + broad * 0.18);
        color = mix(color, uSmoke, smokyTop);

        float stained = (broad - 0.5) * 0.18 + (fiber - 0.5) * 0.06;
        float verticalDrag = sin(angle * 46.0 + fiber * 3.0) * 0.022 * smoothstep(0.35, 0.95, broad);
        color += stained + verticalDrag;
        color *= 1.02 + 0.26 * front;
        color += vec3(0.018, 0.011, 0.008) * front;
        color = pow(max(color, vec3(0.0)), vec3(1.02));

        float veilAlpha = mix(1.0, (0.16 + hinge * 0.38 + cobaltPulse * 0.22 + redFracture * 0.22) * uOpacity, uVeil);
        gl_FragColor = vec4(color, veilAlpha);
      }
    `})}function $(e,a,c,s=1){let r=new e.Color(c),i=new Uint8Array(9216*4);for(let h=0;h<96;h+=1)for(let u=0;u<96;u+=1){let p=u/95,x=h/95,g=Math.min(p,1-p,x,1-x),d=Math.max(0,Math.min(1,g/.18)),w=.74+a()*.34+Math.sin(u*.41+h*.17+a()*.4)*.035,v=.78+Math.sin(h*.09+a()*2)*.07,M=Math.max(0,Math.min(255,255*s*d*(.62+a()*.34))),y=(h*96+u)*4;i[y]=Math.max(0,Math.min(255,Math.round(r.r*255*w*v*1.28))),i[y+1]=Math.max(0,Math.min(255,Math.round(r.g*255*w*v*1.28))),i[y+2]=Math.max(0,Math.min(255,Math.round(r.b*255*w*v*1.28))),i[y+3]=M}let f=new e.DataTexture(i,96,96,e.RGBAFormat);return f.needsUpdate=!0,f.colorSpace=e.SRGBColorSpace,f.wrapS=e.ClampToEdgeWrapping,f.wrapT=e.ClampToEdgeWrapping,f}function D(e,a=-40){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=a,e}function q({THREE:e,part:a,world:c,seed:s,utilities:m}){let r=new e.Group;r.name="world-environment-rothko-two-fan-zone-pressure",r.userData={partId:"world-environment",role:a?.role||"world-environment",packetId:G,packetHash:k,messagePurpose:"Surrounding Mark Rothko color-field pressure for the two fan zones before the Cup final."};let i=N(m,s||a?.id||"world-environment","rothko-union-cup-current-packet"),f=Math.max(42,Math.min(96,Number(c?.environment?.skyboxRadius||c?.environment?.radius||90))),h=m?.createSkyboxShell?m.createSkyboxShell({radius:f,name:"dominant-rothko-skybox-shell-two-fields",widthSegments:128,heightSegments:64,color:"#140c11",userData:{partId:"world-environment",packetId:G,packetHash:k}}):V(e,f,"dominant-rothko-skybox-shell-two-fields"),u=h.object||h,p=h.mesh||u.mesh||u.children.find(o=>o?.isMesh);u.name="dominant-rothko-position-space-environment",u.userData={...u.userData,partId:"world-environment",role:"world-environment",immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,packetHash:k},p&&(p.material&&typeof p.material.dispose=="function"&&p.material.dispose(),p.material=Y(e,!1,1),u.material=p.material,p.scale.setScalar(f),D(p,-1e3)),r.add(u);let x=m?.createSkyboxShell?m.createSkyboxShell({radius:f*.985,name:"transparent-soft-hinge-and-fracture-veil-shell",widthSegments:96,heightSegments:48,color:"#000000",opacity:.2,userData:{partId:"world-environment",packetId:G,packetHash:k,veil:!0}}):V(e,f*.985,"transparent-soft-hinge-and-fracture-veil-shell"),g=x.object||x,d=x.mesh||g.mesh||g.children.find(o=>o?.isMesh);d&&(d.material&&typeof d.material.dispose=="function"&&d.material.dispose(),d.material=Y(e,!0,.52),g.material=d.material,d.scale.setScalar(f*.985),D(d,-990)),g.userData={...g.userData,partId:"world-environment",immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,packetHash:k},r.add(g);let w=[],v=[],M=new e.PlaneGeometry(1,1,1,1),y=new e.Group;y.name="near-and-mid-floating-rothko-field-planes";let O=[{color:"#251329",opacity:.82,position:[-5.4,2.45,-2.6],scale:[20.8,6.6,1],rotation:[.03,.12,-.012]},{color:"#3d1b22",opacity:.7,position:[-8.6,2.2,-4],scale:[15.8,5.9,1],rotation:[.02,.27,-.035]},{color:"#34463a",opacity:.78,position:[5.8,2.42,-2.8],scale:[21.6,6.4,1],rotation:[.015,-.12,.018]},{color:"#0b4e55",opacity:.56,position:[8.8,1.9,-4.4],scale:[13.8,5,1],rotation:[.02,-.31,.04]},{color:"#7d3320",opacity:.84,position:[.1,-1.48,-2],scale:[32.4,7.2,1],rotation:[.02,0,.01]},{color:"#a35b1d",opacity:.62,position:[2.6,-2.12,-3.6],scale:[25.2,5.8,1],rotation:[.04,-.08,-.018]},{color:"#130d0d",opacity:.88,position:[0,-.28,-1.7],scale:[34.4,1.18,1],rotation:[.012,0,-.006]},{color:"#17392f",opacity:.68,position:[1.2,-.76,-1.55],scale:[29.2,.6,1],rotation:[.01,-.02,.015]},{color:"#063dc7",opacity:.82,position:[-1.8,-1.04,-1.3],scale:[21.8,.46,1],rotation:[.012,.025,-.012]},{color:"#bd1a10",opacity:.64,position:[.1,.02,-1.12],scale:[.92,5.7,1],rotation:[.02,.012,.018]}];for(let o=0;o<O.length;o+=1){let t=O[o],n=$(e,i,t.color,1);w.push(n);let b=new e.MeshBasicMaterial({map:n,transparent:!0,opacity:t.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});v.push(b);let l=new e.Mesh(M,b);l.name=`large-soft-edged-suspended-field-${o+1}`,l.position.set(t.position[0],t.position[1],t.position[2]),l.rotation.set(t.rotation[0],t.rotation[1],t.rotation[2]),l.scale.set(t.scale[0],t.scale[1],t.scale[2]),l.userData.baseY=l.position.y,l.userData.baseOpacity=t.opacity,l.userData.phase=i()*Math.PI*2,l.userData.bloom=.012+i()*.026,D(l,-38+o),y.add(l)}let _=[{color:"#421b1e",opacity:.44,position:[-12.5,-.15,.4],scale:[18.5,5.1,1],rotation:[0,1.18,-.04]},{color:"#0a3a40",opacity:.4,position:[12.4,.28,.1],scale:[19,5.2,1],rotation:[0,-1.18,.035]},{color:"#100d13",opacity:.46,position:[0,-3.45,-4.4],scale:[34,4.8,1],rotation:[.09,0,0]}];for(let o=0;o<_.length;o+=1){let t=_[o],n=$(e,i,t.color,.9);w.push(n);let b=new e.MeshBasicMaterial({map:n,transparent:!0,opacity:t.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});v.push(b);let l=new e.Mesh(M,b);l.name=`wrapping-side-pressure-field-${o+1}`,l.position.set(t.position[0],t.position[1],t.position[2]),l.rotation.set(t.rotation[0],t.rotation[1],t.rotation[2]),l.scale.set(t.scale[0],t.scale[1],t.scale[2]),l.userData.baseY=l.position.y,l.userData.baseOpacity=t.opacity,l.userData.phase=i()*Math.PI*2,l.userData.bloom=.012+i()*.018,D(l,-28+o),y.add(l)}r.add(y);let C=new e.Group;C.name="submerged-radial-finale-coupe-pressure-symbols";let W=[new e.MeshBasicMaterial({color:"#063dc7",transparent:!0,opacity:.26,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#12100f",transparent:!0,opacity:.32,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#7b3320",transparent:!0,opacity:.2,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1})];v.push(...W);for(let o=0;o<5;o+=1){let t=1.8+o*1.15,n=new e.Mesh(new e.RingGeometry(t,t+.055,128),W[o%W.length]);n.name=`soft-low-radial-pressure-halo-${o+1}`,n.position.set((o-2)*1.18,-.72-o*.13,-7.3-o*1.35),n.rotation.set(.05+o*.012,(o-2)*.035,(i()-.5)*.08),n.scale.y=.58,n.userData.phase=i()*Math.PI*2,D(n,-12+o),C.add(n)}r.add(C);let P=new e.BufferGeometry,A=220,B=new Float32Array(A*3),z=new Float32Array(A*3),I=[new e.Color("#063dc7"),new e.Color("#be1b10"),new e.Color("#17392f"),new e.Color("#9f561e"),new e.Color("#1b131a")];for(let o=0;o<A;o+=1){let t=i()*Math.PI*2,n=4.8+i()*12.6;B[o*3]=Math.sin(t)*n,B[o*3+1]=-3.1+i()*6.5,B[o*3+2]=Math.cos(t)*n-3.1;let b=I[o%I.length];z[o*3]=b.r,z[o*3+1]=b.g,z[o*3+2]=b.b}P.setAttribute("position",new e.BufferAttribute(B,3)),P.setAttribute("color",new e.BufferAttribute(z,3));let j=new e.PointsMaterial({size:.18,transparent:!0,opacity:.48,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});v.push(j);let S=new e.Points(P,j);S.name="submerged-jewel-pigment-and-edge-deposit-points",S.frustumCulled=!1,S.renderOrder=-8,r.add(S);function K(o={}){let t=o.captureMode?0:Number(o.elapsedSeconds??o.time??0);p?.material?.uniforms?.uTime&&(p.material.uniforms.uTime.value=t),d?.material?.uniforms?.uTime&&(d.material.uniforms.uTime.value=t);for(let n of y.children)n.position.y=n.userData.baseY+Math.sin(t*.08+n.userData.phase)*n.userData.bloom,n.material.opacity=n.userData.baseOpacity*(.96+Math.sin(t*.11+n.userData.phase)*.035);C.rotation.z=Math.sin(t*.04)*.02,S.rotation.y=Math.sin(t*.032)*.028}function L(){U(r);for(let o of v)o&&typeof o.dispose=="function"&&o.dispose();for(let o of w)o&&typeof o.dispose=="function"&&o.dispose();M.dispose(),P.dispose()}return{object:r,update:K,dispose:L}}export{q as createImmersiveWorldPart};
