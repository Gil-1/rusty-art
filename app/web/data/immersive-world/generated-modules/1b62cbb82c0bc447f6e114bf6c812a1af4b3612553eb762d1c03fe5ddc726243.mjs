var F="art-direction-packet-cb8fd8bab6d4",B="cb8fd8bab6d49b41c317911479a092cb";function z(e){let o=String(e??"emily-mason-wallonie-flow-pressure"),s=2166136261;for(let a=0;a<o.length;a+=1)s^=o.charCodeAt(a),s=Math.imul(s,16777619);return s>>>0}function D(e,o,s){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(o,s);let a=(z(o)^z(s))>>>0;return function(){a=a+1831565813>>>0;let t=a;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function M(e){return Math.max(0,Math.min(1,e))}function S(e,o){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=o,e}function P(e){let o=Number(e?.environment?.skyboxRadius||e?.environment?.radius);return Number.isFinite(o)&&o>0?Math.max(48,Math.min(120,o)):84}function W(e,o,s){let a=new e.Group;a.name="single-emily-mason-wallonie-skybox-shell",a.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",packetId:F,packetHash:B,environmentRadius:o};let r=2/Math.sqrt(3),t=new e.BoxGeometry(r,r,r,1,1,1),n=new e.Mesh(t,s);return n.name="emily-mason-wallonie-position-space-wash-shell-mesh",n.scale.setScalar(o),S(n,-1e3),n.onBeforeRender=function(u,m,c){c&&c.position&&(a.position.copy(c.position),a.updateMatrixWorld(!0))},a.add(n),a.object=a,a.mesh=n,a.geometry=t,a.material=s,a}function O(e){return new e.ShaderMaterial({name:"emily_mason_wallonie_position_space_wash_pressure",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uCream:{value:new e.Color("#ead8b9")},uOcher:{value:new e.Color("#c88932")},uAmber:{value:new e.Color("#dfa746")},uPeach:{value:new e.Color("#d99a78")},uTeal:{value:new e.Color("#257f82")},uTurquoise:{value:new e.Color("#2ca7b1")},uCobalt:{value:new e.Color("#143f83")},uBlueBlack:{value:new e.Color("#081322")},uViolet:{value:new e.Color("#4d3b5b")},uMaroon:{value:new e.Color("#651f23")},uRed:{value:new e.Color("#c31713")},uLime:{value:new e.Color("#c9cc3e")},uChalk:{value:new e.Color("#e3e8df")}},vertexShader:`
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
      uniform vec3 uOcher;
      uniform vec3 uAmber;
      uniform vec3 uPeach;
      uniform vec3 uTeal;
      uniform vec3 uTurquoise;
      uniform vec3 uCobalt;
      uniform vec3 uBlueBlack;
      uniform vec3 uViolet;
      uniform vec3 uMaroon;
      uniform vec3 uRed;
      uniform vec3 uLime;
      uniform vec3 uChalk;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.14, 0.19, 0.23));
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
        float amp = 0.52;
        for (int i = 0; i < 5; i += 1) {
          value += noise(p) * amp;
          p = p * 2.03 + vec3(8.1, 4.7, 2.9);
          amp *= 0.51;
        }
        return value;
      }

      float band(float value, float center, float width, float feather) {
        return smoothstep(center - width - feather, center - width, value)
          - smoothstep(center + width, center + width + feather, value);
      }

      float line(float value, float center, float width) {
        return 1.0 - smoothstep(width, width * 2.4, abs(value - center));
      }

      vec3 softLight(vec3 base, vec3 blend, float amount) {
        vec3 lit = 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
        return mix(base, lit, clamp(amount, 0.0, 1.0));
      }

      void main() {
        vec3 dir = normalize(vPosition);
        float poleFade = 1.0 - smoothstep(0.78, 0.97, abs(dir.y));
        float poleBlend = smoothstep(0.84, 0.985, abs(dir.y));
        float t = uTime * 0.015;

        vec3 p = dir * 3.15;
        vec3 warp = vec3(
          fbm(p.yzx * 1.34 + vec3(0.0, t, 1.7)),
          fbm(p.xzy * 1.58 + vec3(2.2, 0.0, t)),
          fbm(p.xyz * 1.22 + vec3(t, 3.4, 0.0))
        ) - 0.5;
        vec3 q = p + warp * 0.86;

        float wash = fbm(q * 1.08 + vec3(0.0, 0.4, t * 0.7));
        float stain = fbm(q * 2.45 + vec3(2.5, t, 4.0));
        float scumble = fbm(q * 7.5 + vec3(0.8, 3.0, t));
        float vertical = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
        float front = smoothstep(-0.55, 0.92, -dir.z);

        float warmField = smoothstep(-0.62, 0.62, -dir.x + dir.y * 0.28 + wash * 0.42);
        float coolField = smoothstep(-0.48, 0.78, dir.x - dir.y * 0.11 + dir.z * 0.2 + stain * 0.32);
        vec3 color = mix(uCream, uOcher, warmField * 0.78);
        color = mix(color, uAmber, smoothstep(0.48, 0.93, wash) * (1.0 - coolField) * 0.46);
        color = mix(color, uPeach, smoothstep(0.38, 0.88, wash + dir.y * 0.2) * 0.34);
        color = mix(color, uTeal, coolField * 0.66);
        color = mix(color, uTurquoise, smoothstep(0.5, 0.96, coolField + scumble * 0.22) * 0.34);
        color = mix(color, uCobalt, smoothstep(0.55, 1.02, coolField + stain * 0.28 - dir.y * 0.12) * 0.5);
        color = mix(color, uViolet, smoothstep(0.34, 0.88, dir.z + scumble * 0.34) * 0.28);

        float route = dir.x * 0.69 - dir.y * 0.22 - dir.z * 0.41 + (stain - 0.5) * 0.33;
        float routeTwinA = band(route, -0.10, 0.12, 0.20) * front * poleFade;
        float routeTwinB = band(route, 0.18, 0.08, 0.14) * front * poleFade;
        float lowerDrag = smoothstep(0.61, 0.92, stain) * smoothstep(-0.08, 0.57, -dir.y) * front * poleFade;
        float surpriseRed = band(route, 0.43, 0.13, 0.19) * smoothstep(0.34, 0.86, wash + 0.12) * front * poleFade;
        float redBloom = smoothstep(0.46, 0.92, fbm(q * 3.1 + vec3(5.0, 0.0, t))) * band(route + dir.y * 0.18, 0.37, 0.25, 0.22) * front * poleFade;
        float maroonBruise = band(route, -0.34, 0.07, 0.13) * front * poleFade;
        float limeEdge = smoothstep(0.74, 0.94, fbm(q * 4.1 + vec3(1.2, 4.0, t))) * band(dir.x - dir.z * 0.2, 0.62, 0.11, 0.18) * poleFade;
        float chalkScrape = smoothstep(0.72, 0.96, scumble) * line(route, 0.02, 0.018) * front * poleFade;

        color = mix(color, uBlueBlack, clamp(routeTwinA * 0.74 + routeTwinB * 0.64 + lowerDrag * 0.56, 0.0, 0.9));
        color = mix(color, uMaroon, maroonBruise * 0.48);
        color = mix(color, uRed, clamp(surpriseRed * 0.78 + redBloom * 0.64, 0.0, 0.86));
        color = mix(color, uLime, limeEdge * 0.42);
        color = mix(color, uChalk, chalkScrape * 0.36);

        float incised = 0.0;
        incised += line(dir.x * 0.95 + dir.y * 0.42 + (stain - 0.5) * 0.18, -0.06, 0.006);
        incised += line(dir.x * -0.42 + dir.z * 0.72 + dir.y * 0.2 + (wash - 0.5) * 0.16, 0.28, 0.007);
        incised += line(dir.y + (wash - 0.5) * 0.05, -0.12, 0.01) * 0.75;
        color = mix(color, uBlueBlack, clamp(incised * 0.34 * poleFade, 0.0, 0.45));

        float weaveX = sin((dir.x + warp.x * 0.08) * 178.0);
        float weaveY = sin((dir.y + warp.y * 0.06) * 151.0);
        float grain = (weaveX * weaveY) * 0.017 + (scumble - 0.5) * 0.092;
        color += grain;
        color = softLight(color, vec3(1.0, 0.86, 0.62), smoothstep(0.2, 0.78, wash) * 0.13);

        vec3 poleWash = mix(mix(uCobalt, uCream, 0.42), mix(uOcher, uCream, 0.7), vertical);
        poleWash = mix(poleWash, uTeal, smoothstep(-0.1, 0.82, dir.x) * 0.22);
        color = mix(color, poleWash, poleBlend);

        float vignette = 0.86 + 0.14 * smoothstep(-0.96, 0.48, -dir.z);
        gl_FragColor = vec4(clamp(color * vignette, 0.0, 1.0), 1.0);
      }
    `})}function I(e,o,s,a={}){let r=a.width||192,t=a.height||112,n=new e.Color(s),l=new Uint8Array(r*t*4),u=a.feather??.15,m=a.alphaScale??1,c=a.horizontalPull??.22,d=a.rough??1;for(let p=0;p<t;p+=1){let h=p/Math.max(1,t-1);for(let f=0;f<r;f+=1){let v=f/Math.max(1,r-1),g=Math.min(v,1-v,h,1-h),w=M(g/u),C=M(1-Math.pow((v-.5)/(.56+c),2)-Math.pow((h-.52)/.66,2)),y=.8+Math.sin(f*.17+p*.07)*.08+Math.sin((f+p)*.041)*.06,x=.75+o()*.32*d,b=o()>.986?.22:1,A=m*w*Math.pow(C,.42)*(.68+o()*.28)*b,k=(p*r+f)*4;l[k]=Math.round(M(n.r*y*x*1.23)*255),l[k+1]=Math.round(M(n.g*y*x*1.23)*255),l[k+2]=Math.round(M(n.b*y*x*1.23)*255),l[k+3]=Math.round(M(A)*255)}}let i=new e.DataTexture(l,r,t,e.RGBAFormat);return i.name=`mason-soft-stain-${String(s).replace("#","")}`,i.needsUpdate=!0,i.wrapS=e.ClampToEdgeWrapping,i.wrapT=e.ClampToEdgeWrapping,i.magFilter=e.LinearFilter,i.minFilter=e.LinearFilter,i.generateMipmaps=!1,e.SRGBColorSpace&&(i.colorSpace=e.SRGBColorSpace),i}function G(e){let s=new Uint8Array(9216),a=47*.5;for(let t=0;t<48;t+=1)for(let n=0;n<48;n+=1){let l=(n-a)/a,u=(t-a)/a,m=Math.sqrt(l*l+u*u),c=Math.pow(M(1-m),2.1),d=(t*48+n)*4;s[d]=255,s[d+1]=255,s[d+2]=255,s[d+3]=Math.round(c*255)}let r=new e.DataTexture(s,48,48,e.RGBAFormat);return r.name="mason-soft-pigment-point",r.needsUpdate=!0,r.wrapS=e.ClampToEdgeWrapping,r.wrapT=e.ClampToEdgeWrapping,r.magFilter=e.LinearFilter,r.minFilter=e.LinearFilter,r.generateMipmaps=!1,e.SRGBColorSpace&&(r.colorSpace=e.SRGBColorSpace),r}function q(e,o,s,a,r){let t=new e.Mesh(s,a);return t.name=r.name,t.position.set(r.position[0],r.position[1],r.position[2]),t.rotation.set(r.rotation[0],r.rotation[1],r.rotation[2]),t.scale.set(r.scale[0],r.scale[1],1),t.userData.baseY=t.position.y,t.userData.baseOpacity=a.opacity,t.userData.phase=r.phase,t.userData.floatAmount=r.floatAmount,S(t,r.renderOrder),o.add(t),t}function L(e,o,s,a,r,t,n,l){let u=new e.CatmullRomCurve3(s,!1,"centripetal",.45),m=new e.TubeGeometry(u,42,r,7,!1);l.push(m);let c=new e.Mesh(m,a);return c.name=t,c.userData.baseRotationY=c.rotation.y,c.userData.phase=s.length*.37+r*80,S(c,n),o.add(c),c}function _(e,o,s,a){let r=new e.PlaneGeometry(1,1,1,1);a.geometries.push(r);let t=new e.Group;t.name="ordinary-mason-stained-depth-fields",s.add(t);let n=[{name:"left-warm-earth-wallonie-wash",color:"#c88932",opacity:.46,position:[-7.8,1.05,-6.9],rotation:[.02,.36,-.06],scale:[23.4,7.2],renderOrder:-56},{name:"right-teal-blue-counterpressure-field",color:"#257f82",opacity:.44,position:[7.4,.25,-7.5],rotation:[.01,-.33,.03],scale:[24,6.7],renderOrder:-55},{name:"low-cobalt-submerged-route-field",color:"#143f83",opacity:.38,position:[-.9,-2.65,-7.1],rotation:[.06,.02,.04],scale:[27.5,5.4],renderOrder:-52},{name:"central-dark-double-blow-drag",color:"#081322",opacity:.65,position:[.35,-.2,-5.35],rotation:[.02,-.02,-.25],scale:[19.2,1.55],renderOrder:-43},{name:"red-surprise-leader-bloom",color:"#c31713",opacity:.62,position:[-2.35,.72,-4.95],rotation:[.02,0,-.18],scale:[11.5,2.05],renderOrder:-38},{name:"peach-cream-open-negative-space-veil",color:"#ead8b9",opacity:.32,position:[1,2.72,-10.9],rotation:[-.04,.02,.025],scale:[29.5,7.3],renderOrder:-60},{name:"right-edge-yellow-green-counterweight",color:"#c9cc3e",opacity:.46,position:[12.6,.42,-3],rotation:[0,-1.08,.035],scale:[6.1,4.1],renderOrder:-34},{name:"left-maroon-residue-side-pressure",color:"#651f23",opacity:.32,position:[-13.6,-.25,-2],rotation:[0,1.16,-.07],scale:[18.2,5.6],renderOrder:-35}];for(let l=0;l<n.length;l+=1){let u=n[l],m=I(e,o,u.color,{width:l<4?224:176,height:l<4?128:96,alphaScale:u.name.includes("dark")?.95:.9,feather:u.name.includes("drag")?.22:.15,horizontalPull:u.name.includes("counterweight")?.02:.25,rough:1.1});a.textures.push(m);let c=new e.MeshBasicMaterial({name:`${u.name}-matte-translucent-stain`,map:m,transparent:!0,opacity:u.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});a.materials.push(c),q(e,t,r,c,{...u,phase:o()*Math.PI*2,floatAmount:.014+o()*.025})}return t}function N(e,o,s,a){let r=new e.Group;r.name="ordinary-spatial-contour-line-pressure-field",s.add(r);let t=[new e.MeshBasicMaterial({color:"#081322",transparent:!0,opacity:.72,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#c31713",transparent:!0,opacity:.58,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#143f83",transparent:!0,opacity:.5,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),new e.MeshBasicMaterial({color:"#651f23",transparent:!0,opacity:.48,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})];a.materials.push(...t);for(let n=0;n<18;n+=1){let l=n%2===0?-1:1,u=-.9+n*.17+(o()-.5)*.24,m=-3.8-o()*9.8,c=-2.55+o()*5.7,d=2.2+o()*4.6,i=[];for(let p=0;p<5;p+=1){let h=p/4,f=u+(h-.5)*(.4+o()*.24),v=5.4+o()*7.5+h*d;i.push(new e.Vector3(Math.sin(f)*v+l*(h-.45)*1.9,c+Math.sin(h*Math.PI*1.35+n)*(.42+o()*.5),Math.cos(f)*v+m))}L(e,r,i,t[n%t.length],.018+o()*.025,`mason-wandering-pressure-contour-${String(n+1).padStart(2,"0")}`,-23+n%7,a.geometries)}return r}function Y(e,o,s,a){let r=G(e);a.textures.push(r);let t=new e.BufferGeometry;a.geometries.push(t);let n=320,l=new Float32Array(n*3),u=new Float32Array(n*3),m=["#c31713","#081322","#143f83","#257f82","#c88932","#c9cc3e","#651f23"].map(i=>new e.Color(i));for(let i=0;i<n;i+=1){let p=o()*Math.PI*2,h=4.4+o()*13.5,f=i%4!==0,v=-1.3+(o()-.5)*1.8;l[i*3]=Math.sin(p)*h*(f?.62:1)+(o()-.5)*1.2,l[i*3+1]=f?v:-3+o()*6.8,l[i*3+2]=Math.cos(p)*h-3.8-o()*5.2;let g=m[i%m.length];u[i*3]=g.r,u[i*3+1]=g.g,u[i*3+2]=g.b}t.setAttribute("position",new e.BufferAttribute(l,3)),t.setAttribute("color",new e.BufferAttribute(u,3));let c=new e.PointsMaterial({name:"soft-high-chroma-pigment-deposits",size:.36,map:r,alphaMap:r,transparent:!0,opacity:.56,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1,alphaTest:.015});a.materials.push(c);let d=new e.Points(t,c);return d.name="ordinary-depth-pigment-deposit-field",S(d,-16),s.add(d),d}function U(e){e.traverse?.(o=>{o.geometry&&typeof o.geometry.dispose=="function"&&o.geometry.dispose();let s=Array.isArray(o.material)?o.material:[o.material].filter(Boolean);for(let a of s)a&&typeof a.dispose=="function"&&a.dispose()})}function V({THREE:e,part:o,world:s,seed:a,camera:r,utilities:t}={}){let n=D(t,a||o?.id||"world-environment","emily-mason-tour-of-wallonia-pressure"),l=new e.Group;l.name="world-environment-emily-mason-wallonie-flow-pressure",l.userData={partId:"world-environment",role:o?.role||"world-environment",packetId:F,packetHash:B,selectedNews:"Double blow on the Tour de Wallonie: Ben Oliver springs a surprise and takes the lead, Arnaud De Lie 6th on the stage",artist:"Emily Mason",environmentIntent:"single dominant surrounding shell with stained wash, twin dark route pressure, red surprise bloom, teal-blue counterfields, and active negative space"};let u={geometries:[],materials:[],textures:[]},m=P(s),c=O(e);u.materials.push(c);let d;t&&typeof t.createSkyboxShell=="function"?d=t.createSkyboxShell({radius:m,name:"single-emily-mason-wallonie-skybox-shell",geometryKind:"box",color:"#ead8b9",opacity:1,cameraPinned:!0,userData:{immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",role:"world-environment",packetId:F,packetHash:B,singleShellReview:"only enclosing shell; shader owns all-surround Mason wash and Tour of Wallonia flow pressure"}}):(d=W(e,m,c),u.geometries.push(d.geometry));let i=d.object||d,p=d.mesh||i.mesh||i.children?.find(w=>w&&w.isMesh);i.name="single-emily-mason-wallonie-skybox-shell",i.userData={...i.userData,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",role:"world-environment",packetId:F,packetHash:B,environmentRadius:m},i.renderOrder=-1e3,i.frustumCulled=!1,p&&(p.material&&p.material!==c&&typeof p.material.dispose=="function"&&p.material.dispose(),p.name="emily-mason-wallonie-position-space-wash-shell-mesh",p.material=c,i.material=c,S(p,-1e3)),l.add(i);let h=_(e,n,l,u),f=N(e,n,l,u),v=Y(e,n,l,u);function g(w={}){let C=w.captureMode?0:Number(w.elapsedSeconds??w.time??0),y=Number.isFinite(C)?C:0,x=Number.isFinite(Number(w.motionIntensity))?Number(w.motionIntensity):1;c.uniforms.uTime.value=y,!t?.createSkyboxShell&&r?.position&&(i.position.copy(r.position),i.updateMatrixWorld(!0));for(let b of h.children)b.position.y=b.userData.baseY+Math.sin(y*.075+b.userData.phase)*b.userData.floatAmount*x,b.material.opacity=b.userData.baseOpacity*(.965+Math.sin(y*.11+b.userData.phase)*.035*x);f.rotation.y=Math.sin(y*.028)*.016*x,f.rotation.z=Math.sin(y*.034)*.012*x,v.rotation.y=Math.sin(y*.025)*.03*x,v.material&&(v.material.opacity=.54+Math.sin(y*.16)*.02*x)}return g({captureMode:!0,elapsedSeconds:0,camera:r}),{object:l,update:g,dispose(){U(l);for(let w of u.textures)w?.dispose?.()}}}export{V as createImmersiveWorldPart};
