var j="art-direction-packet-22cdef33b469",P="22cdef33b469c5823ed2eab3aae9ada9",B=Math.PI*2;function F(e,r,t){return Math.max(r,Math.min(t,e))}function G(e){let r=2166136261,t=String(e??"world-environment");for(let a=0;a<t.length;a+=1)r^=t.charCodeAt(a),r=Math.imul(r,16777619);return r>>>0}function O(e,r){let t=(G(e)^G(r))>>>0;return function(){t=t+1831565813>>>0;let o=t;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296}}function L(e,r,t){return e&&typeof e.createSeededRandom=="function"?e.createSeededRandom(r,t):O(r,t)}function W(e,r={}){e.userData={...e.userData,partId:"world-environment",role:"world-environment",packetId:j,packetHash:P,artist:"Frank Bowling",selectedNews:"Zaventem and six other municipalities join forces against heavy rat-running: move traffic to the regional roads",...r}}function q(e){let r=String(e).replace("#",""),t=Number.parseInt(r.length===3?r.split("").map(a=>a+a).join(""):r,16);return[t>>16&255,t>>8&255,t&255]}function N(e){let t=new Uint8Array(4096),a=31*.5;for(let p=0;p<32;p+=1)for(let s=0;s<32;s+=1){let u=(s-a)/a,f=(p-a)/a,n=Math.hypot(u,f),d=F(1-A((n-.12)/.82),0,1),c=(p*32+s)*4;t[c]=255,t[c+1]=255,t[c+2]=255,t[c+3]=Math.round(d*d*255)}let o=new e.DataTexture(t,32,32,e.RGBAFormat);return o.name="bowling-soft-pigment-fleck-sprite",o.magFilter=e.LinearFilter,o.minFilter=e.LinearFilter,o.wrapS=e.ClampToEdgeWrapping,o.wrapT=e.ClampToEdgeWrapping,o.generateMipmaps=!1,o.needsUpdate=!0,o}function A(e){let r=F(e,0,1);return r*r*(3-2*r)}function I(e,r,t={}){let a=t.width||96,o=t.height||192,[p,s,u]=q(t.color||"#c8231b"),f=t.edgeBias??.54,n=t.dripStrength??.34,d=t.density??.82,c=new Uint8Array(a*o*4),i=Array.from({length:18},()=>({x:r(),length:.12+r()*.56,width:.012+r()*.036,weight:.3+r()*.7}));for(let g=0;g<o;g+=1){let h=g/(o-1);for(let m=0;m<a;m+=1){let M=m/(a-1),S=Math.sin((M*23.7+h*7.1+r()*.025)*B),y=Math.sin((M*5.3-h*17.6+.31)*B),v=.5+.5*(S*.58+y*.42),k=A((1-Math.abs(M-.5)*2-.06+v*.22)/f),D=A((1-Math.abs(h-.48)*1.38+v*.16)/.78),z=k*D*d;for(let x of i){let b=Math.abs(M-x.x);h>.44&&h<.44+x.length&&(z+=A(1-b/x.width)*x.weight*n*(1-(h-.44)/x.length))}z*=.72+v*.36;let C=(g*a+m)*4,w=.78+v*.28;c[C]=F(Math.round(p*w+15*v),0,255),c[C+1]=F(Math.round(s*w+12*v),0,255),c[C+2]=F(Math.round(u*w+10*v),0,255),c[C+3]=F(Math.round(z*255),0,236)}}let l=new e.DataTexture(c,a,o,e.RGBAFormat);return l.name=`bowling-${t.name||"stain"}-procedural-texture`,l.magFilter=e.LinearFilter,l.minFilter=e.LinearFilter,l.wrapS=e.ClampToEdgeWrapping,l.wrapT=e.ClampToEdgeWrapping,l.generateMipmaps=!1,l.needsUpdate=!0,l}function $(e,r){return new e.ShaderMaterial({name:"frank-bowling-zaventem-pressure-skybox-material",side:e.BackSide,depthWrite:!1,depthTest:!1,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uSeed:{value:G(r)%997/997}},vertexShader:`
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vLocalPosition;
      uniform float uTime;
      uniform float uSeed;

      float saturate(float v) { return clamp(v, 0.0, 1.0); }

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbm(vec2 p) {
        float sum = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          sum += amp * noise(p);
          p = mat2(1.62, 1.11, -1.03, 1.48) * p + 17.13;
          amp *= 0.52;
        }
        return sum;
      }

      vec2 boxPanel(vec3 dir) {
        vec3 ad = abs(dir);
        if (ad.z >= ad.x && ad.z >= ad.y) {
          return vec2(dir.x / max(ad.z, 0.0001), dir.y / max(ad.z, 0.0001));
        }
        if (ad.x >= ad.y) {
          return vec2(-dir.z / max(ad.x, 0.0001), dir.y / max(ad.x, 0.0001));
        }
        return vec2(dir.x / max(ad.y, 0.0001), dir.z / max(ad.y, 0.0001));
      }

      float faceShift(vec3 dir) {
        vec3 ad = abs(dir);
        if (ad.z >= ad.x && ad.z >= ad.y) return dir.z > 0.0 ? 0.13 : 0.61;
        if (ad.x >= ad.y) return dir.x > 0.0 ? 0.33 : 0.81;
        return dir.y > 0.0 ? 0.04 : 0.49;
      }

      float verticalBand(vec2 p, float x, float width, float rag) {
        float edge = abs(p.x - x + rag);
        return 1.0 - smoothstep(width, width + 0.055, edge);
      }

      float horizontalBand(vec2 p, float y, float height, float rag) {
        float edge = abs(p.y - y + rag);
        return 1.0 - smoothstep(height, height + 0.045, edge);
      }

      void main() {
        vec3 dir = normalize(vLocalPosition);
        vec2 p = boxPanel(dir);
        float shift = faceShift(dir) + uSeed * 0.37;
        vec2 q = p + vec2(shift, 0.0);
        float highFade = smoothstep(0.98, 0.22, abs(dir.y));
        float time = uTime * 0.025;

        float grain = fbm(q * vec2(3.2, 5.6) + vec2(time, -time * 0.37));
        float canvas = fbm(q * vec2(29.0, 42.0) + uSeed * 11.0);
        float wash = fbm(q * vec2(1.15, 1.9) + vec2(0.0, time * 0.42));
        float rag = (grain - 0.5) * 0.09 + (canvas - 0.5) * 0.035;

        vec3 cream = vec3(0.929, 0.898, 0.827);
        vec3 ochre = vec3(0.918, 0.639, 0.108);
        vec3 peach = vec3(0.902, 0.573, 0.405);
        vec3 pink = vec3(0.949, 0.627, 0.666);
        vec3 bluegray = vec3(0.624, 0.722, 0.784);
        vec3 moss = vec3(0.333, 0.412, 0.268);
        vec3 green = vec3(0.141, 0.553, 0.212);
        vec3 red = vec3(0.784, 0.137, 0.106);
        vec3 hotred = vec3(0.878, 0.094, 0.106);
        vec3 orange = vec3(0.918, 0.318, 0.055);
        vec3 cobalt = vec3(0.024, 0.239, 0.780);
        vec3 violet = vec3(0.463, 0.318, 0.608);
        vec3 black = vec3(0.055, 0.040, 0.035);
        vec3 smoke = vec3(0.360, 0.328, 0.260);

        float y = p.y;
        vec3 color = mix(bluegray, cream, smoothstep(-0.96, 0.35, y));
        color = mix(color, vec3(0.965, 0.839, 0.560), smoothstep(0.1, 0.92, y) * 0.26);
        color = mix(color, peach, horizontalBand(p, -0.34, 0.16, rag) * 0.30);
        color = mix(color, bluegray, horizontalBand(p, -0.62, 0.22, rag) * 0.46);
        color = mix(color, violet, smoothstep(-0.55, -0.98, y) * (0.26 + wash * 0.16));
        color = mix(color, moss, smoothstep(0.48, -0.28, abs(p.x + 0.42)) * smoothstep(-0.2, 0.42, y) * 0.16);
        color = mix(color, pink, smoothstep(0.25, 0.78, p.x + 0.26) * smoothstep(-0.12, 0.85, y) * 0.22);

        float panelGrid = 0.0;
        panelGrid += 1.0 - smoothstep(0.012, 0.028, abs(fract((p.x + 1.0) * 2.0 + shift) - 0.5));
        panelGrid += 1.0 - smoothstep(0.010, 0.026, abs(fract((p.x + 1.0) * 3.5 + shift * 0.5) - 0.5));
        panelGrid += 1.0 - smoothstep(0.010, 0.030, abs(p.y + 0.22 + rag));
        color = mix(color, smoke, saturate(panelGrid) * 0.13 * highFade);

        float spine = verticalBand(p, 0.0, 0.085, rag * 1.3);
        float darkSpine = verticalBand(p, -0.055, 0.030, -rag);
        float yellowSpine = verticalBand(p, 0.105, 0.052, rag * 0.5);
        color = mix(color, red, spine * (0.68 + 0.22 * wash) * highFade);
        color = mix(color, black, darkSpine * 0.78 * highFade);
        color = mix(color, ochre, yellowSpine * 0.58 * highFade);

        float civicColumns = 0.0;
        float hotColumns = 0.0;
        for (int i = 0; i < 7; i++) {
          float fi = float(i);
          float x = -0.84 + fi * 0.28 + sin(fi * 2.7 + shift * 5.1) * 0.035;
          float local = verticalBand(p, x, 0.026 + 0.014 * mod(fi, 3.0), rag * (0.7 + fi * 0.02));
          civicColumns += local;
          hotColumns += local * smoothstep(0.05, 0.82, noise(vec2(fi * 7.1, q.y * 2.5 + shift)));
        }
        color = mix(color, green, saturate(civicColumns) * 0.22 * highFade);
        color = mix(color, hotred, saturate(hotColumns) * 0.35 * highFade);

        float routePressure = horizontalBand(p, -0.18, 0.035, rag) + horizontalBand(p, -0.48, 0.028, -rag);
        color = mix(color, black, saturate(routePressure) * 0.32 * highFade);
        color = mix(color, orange, horizontalBand(p, -0.11, 0.046, rag * 0.4) * 0.28 * highFade);
        color = mix(color, cobalt, verticalBand(p, 0.32, 0.035, -rag * 1.2) * smoothstep(-0.75, 0.38, y) * 0.42 * highFade);

        float dripSeed = noise(vec2(floor((p.x + 1.0) * 34.0 + shift * 9.0), floor((p.y + 1.0) * 2.2)));
        float dripColumn = 1.0 - smoothstep(0.004, 0.025, abs(fract((p.x + shift) * 38.0) - 0.5));
        float downward = smoothstep(0.54, -0.82, p.y) * smoothstep(0.28, 0.82, dripSeed);
        float drips = dripColumn * downward * (spine + saturate(civicColumns) * 0.42 + routePressure * 0.5);
        color = mix(color, black, drips * 0.30 * highFade);
        color = mix(color, ochre, drips * 0.18 * highFade);

        float redBloom = smoothstep(0.55, 0.86, fbm(q * vec2(5.1, 2.4) + 5.7)) * smoothstep(0.9, -0.2, abs(p.y - 0.18));
        color = mix(color, red, redBloom * 0.22 * highFade);
        float wornEdges = smoothstep(0.45, 0.9, canvas);
        color = mix(color, vec3(0.985, 0.940, 0.830), wornEdges * 0.16);
        color *= 0.93 + canvas * 0.16;
        color = mix(color, black, smoothstep(0.75, 1.05, abs(p.x)) * 0.10);
        color = pow(max(color, vec3(0.0)), vec3(0.92));

        gl_FragColor = vec4(color, 1.0);
      }
    `})}function _(e,r,t){let a=new e.Group;a.name="single-frank-bowling-fallback-skybox-shell",W(a,{immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,environmentGeometryKind:"box",environmentRadius:r});let o=2/Math.sqrt(3),p=new e.BoxGeometry(o,o,o,1,1,1),s=new e.Mesh(p,t);return s.name="frank-bowling-position-space-pressure-skybox-mesh",s.scale.setScalar(r),s.frustumCulled=!1,s.renderOrder=-1e3,s.castShadow=!1,s.receiveShadow=!1,s.onBeforeRender=function(f,n,d){d&&d.position&&(a.position.copy(d.position),a.updateMatrixWorld(!0))},a.mesh=s,a.geometry=p,a.material=t,a.object=a,a.add(s),a}function K(e,r,t){let a=e.object||e,o=e.mesh||a.children?.find(p=>p&&p.isMesh);return a.name="single-frank-bowling-zaventem-pressure-skybox-shell",a.renderOrder=-1e3,a.frustumCulled=!1,W(a,{immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,ownsSingleSkyboxShell:!0,environmentGeometryKind:"box",environmentRadius:r}),o&&(o.name="frank-bowling-zaventem-position-space-skybox-mesh",o.material=t,o.scale.setScalar(r),o.frustumCulled=!1,o.renderOrder=-1e3,o.castShadow=!1,o.receiveShadow=!1),{object:a,mesh:o}}function U({THREE:e,root:r,random:t,ownedGeometries:a,ownedMaterials:o,ownedTextures:p}){let s=new e.PlaneGeometry(1,1,1,1);a.push(s);let u=[{name:"zaventem-central-red-pressure-column",color:"#c8231b",x:0,y:.15,z:-18.5,w:4.2,h:22.5,opacity:.68,rot:0},{name:"dark-against-rat-running-counter-spine",color:"#100b0c",x:-1.15,y:-.15,z:-18.1,w:1.2,h:24,opacity:.64,rot:-.015},{name:"ochre-regional-road-diversion-band",color:"#eaa11a",x:1.34,y:.7,z:-18.8,w:1.55,h:21,opacity:.48,rot:.02},{name:"blue-gray-cool-municipal-field-left",color:"#9fb8c8",x:-8,y:-1.2,z:-20,w:5.4,h:13,opacity:.28,rot:.08},{name:"moss-green-municipal-field-right",color:"#536944",x:8.1,y:-.85,z:-20.8,w:5.7,h:14,opacity:.28,rot:-.06},{name:"pink-bleed-pressure-halo-right",color:"#f2a0aa",x:6,y:2.2,z:-17.4,w:4.8,h:11.5,opacity:.25,rot:-.025},{name:"cobalt-small-routing-knot",color:"#063dc7",x:2.75,y:-1,z:-15.7,w:2.3,h:2.7,opacity:.72,rot:.04}],f=[];for(let n of u){let d=I(e,t,{name:n.name,color:n.color,density:n.opacity>.5?.88:.62,dripStrength:n.opacity>.5?.52:.26,edgeBias:.48+t()*.18});p.push(d);let c=new e.MeshBasicMaterial({name:`${n.name}-matte-stain-material`,map:d,transparent:!0,opacity:n.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});o.push(c);let i=new e.Mesh(s,c);i.name=n.name,i.position.set(n.x,n.y,n.z),i.rotation.set(0,n.x*.013,n.rot),i.scale.set(n.w,n.h,1),i.renderOrder=-58,i.frustumCulled=!1,i.userData.baseY=i.position.y,i.userData.baseOpacity=n.opacity,i.userData.phase=t()*B,r.add(i),f.push(i)}return f}function Y({THREE:e,root:r,random:t,ownedGeometries:a,ownedMaterials:o,ownedTextures:p}){let s=new e.PlaneGeometry(1,1,1,1);a.push(s);let u=["#248d36","#c8231b","#eaa11a","#100b0c","#76519b","#9fb8c8","#e01822"],f=[];for(let n=0;n<7;n+=1){let d=-Math.PI*.82+n/6*Math.PI*1.64,c=18.5+t()*5.5,i=Math.sin(d)*c,l=-Math.cos(d)*c-4,g=I(e,t,{name:`municipality-pressure-column-${n+1}`,color:u[n],density:.64,dripStrength:.46,edgeBias:.38});p.push(g);let h=new e.MeshBasicMaterial({name:`municipality-pressure-column-${n+1}-material`,map:g,transparent:!0,opacity:.33+t()*.25,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});o.push(h);let m=new e.Mesh(s,h);m.name=`seven-municipalities-joined-pressure-column-${n+1}`,m.position.set(i,-.35+t()*.9,l),m.lookAt(0,m.position.y,0),m.rotation.z+=(t()-.5)*.11,m.scale.set(1.1+t()*1.2,13.5+t()*7,1),m.renderOrder=-61,m.frustumCulled=!1,m.userData.baseY=m.position.y,m.userData.baseOpacity=h.opacity,m.userData.phase=t()*B,r.add(m),f.push(m)}return f}function V({THREE:e,root:r,random:t,ownedGeometries:a,ownedMaterials:o}){let s=new Float32Array(792),u=new Float32Array(264*3),f=[new e.Color("#100b0c"),new e.Color("#c8231b"),new e.Color("#eaa11a"),new e.Color("#76519b"),new e.Color("#9fb8c8"),new e.Color("#6b4a22")];for(let i=0;i<132;i+=1){let l=i<84,g=l?-13.5+t()*27:Math.sin(t()*B)*(8+t()*14),h=5.4-t()*8.8,m=l?-11.5-t()*9:Math.cos(t()*B)*(8+t()*14)-4,M=.8+t()*5.8,S=(t()-.5)*.45,y=i*6;s[y]=g,s[y+1]=h,s[y+2]=m,s[y+3]=g+S,s[y+4]=h-M,s[y+5]=m-t()*.35;let v=f[i%f.length],k=.52+t()*.42;u[y]=v.r*k,u[y+1]=v.g*k,u[y+2]=v.b*k,u[y+3]=v.r*k,u[y+4]=v.g*k,u[y+5]=v.b*k}let n=new e.BufferGeometry;n.setAttribute("position",new e.BufferAttribute(s,3)),n.setAttribute("color",new e.BufferAttribute(u,3)),n.computeBoundingSphere();let d=new e.LineBasicMaterial({name:"bowling-gravity-drip-route-pressure-lines",vertexColors:!0,transparent:!0,opacity:.62,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),c=new e.LineSegments(n,d);return c.name="gravity-led-drip-lines-and-regional-road-pressure",c.renderOrder=-43,c.frustumCulled=!1,r.add(c),a.push(n),o.push(d),c}function Z({THREE:e,root:r,random:t,sprite:a,ownedGeometries:o,ownedMaterials:p}){let u=new Float32Array(690),f=new Float32Array(690),n=[new e.Color("#e6b21a"),new e.Color("#e01822"),new e.Color("#063dc7"),new e.Color("#248d36"),new e.Color("#f2a0aa"),new e.Color("#100b0c")];for(let l=0;l<230;l+=1){let g=t()<.66,h=g?(t()-.5)*.75:t()*B,m=g?t()*5.2:6.5+t()*15;u[l*3]=Math.sin(h)*m+(g?(t()-.5)*1.8:0),u[l*3+1]=-3.9+t()*8.8,u[l*3+2]=-5.5-t()*15.5+Math.cos(h)*(g?1.6:4);let M=n[l%n.length],S=.72+t()*.28;f[l*3]=M.r*S,f[l*3+1]=M.g*S,f[l*3+2]=M.b*S}let d=new e.BufferGeometry;d.setAttribute("position",new e.BufferAttribute(u,3)),d.setAttribute("color",new e.BufferAttribute(f,3)),d.computeBoundingSphere();let c=new e.PointsMaterial({name:"bowling-dense-pigment-knot-particles",size:.34,map:a,alphaMap:a,vertexColors:!0,transparent:!0,opacity:.64,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1}),i=new e.Points(d,c);return i.name="dense-saturation-knots-in-low-traffic-pressure",i.renderOrder=-38,i.frustumCulled=!1,r.add(i),o.push(d),p.push(c),i}function J(e,r=[]){e.traverse?.(t=>{t.geometry&&typeof t.geometry.dispose=="function"&&t.geometry.dispose();let a=Array.isArray(t.material)?t.material:[t.material].filter(Boolean);for(let o of a){for(let p of["map","alphaMap"])o[p]&&typeof o[p].dispose=="function"&&o[p].dispose();typeof o.dispose=="function"&&o.dispose()}});for(let t of r)t&&typeof t.dispose=="function"&&t.dispose()}function X({THREE:e,part:r,world:t,seed:a,camera:o,utilities:p}={}){let s=new e.Group;s.name="world-environment-frank-bowling-zaventem-flow-pressure",W(s,{subjectMode:"abstract-no-subject",ownsSingleSkyboxShell:!0,visualPurpose:"dominant surrounding matte-canvas atmosphere with central spines, divided fields, drips, and concentrated non-literal flow pressure"});let u=L(p,a||r?.id||"world-environment","frank-bowling-zaventem-world-environment"),f=[],n=[],d=[],c=Number(t?.environment?.skyboxRadius||t?.environment?.radius),i=Number.isFinite(c)&&c>0?Math.max(52,Math.min(128,c)):84,l=$(e,`${a||""}:${P}`);n.push(l);let g;p&&typeof p.createSkyboxShell=="function"?g=p.createSkyboxShell({radius:i,name:"single-frank-bowling-zaventem-pressure-skybox-shell",geometryKind:"box",material:l,color:"#ede5d5",opacity:1,cameraPinned:!0,userData:{immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",packetId:j,packetHash:P}}):g=_(e,i,l);let h=K(g,i,l);h.object.geometry&&f.push(h.object.geometry),h.mesh?.geometry&&f.push(h.mesh.geometry),s.add(h.object);let m=U({THREE:e,root:s,random:u,ownedGeometries:f,ownedMaterials:n,ownedTextures:d}),M=Y({THREE:e,root:s,random:u,ownedGeometries:f,ownedMaterials:n,ownedTextures:d}),S=V({THREE:e,root:s,random:u,ownedGeometries:f,ownedMaterials:n}),y=N(e);d.push(y);let v=Z({THREE:e,root:s,random:u,sprite:y,ownedGeometries:f,ownedMaterials:n});function k(z={}){let C=z.captureMode?0:Number(z.elapsedSeconds??z.time??0),w=Number.isFinite(C)?C:0,x=Number.isFinite(z.motionIntensity)?z.motionIntensity:1;l.uniforms.uTime.value=w,o&&h.object?.userData?.cameraPinned&&(h.object.position.copy(o.position),h.object.updateMatrixWorld(!0));for(let b of m)b.position.y=b.userData.baseY+Math.sin(w*.055+b.userData.phase)*.045*x,b.material.opacity=b.userData.baseOpacity*(.96+Math.sin(w*.07+b.userData.phase)*.035*x);for(let b of M)b.position.y=b.userData.baseY+Math.sin(w*.043+b.userData.phase)*.06*x,b.material.opacity=b.userData.baseOpacity*(.95+Math.sin(w*.061+b.userData.phase)*.04*x);S.rotation.y=Math.sin(w*.025)*.018*x,S.rotation.z=Math.sin(w*.041)*.008*x,v.rotation.y=Math.sin(w*.033)*.026*x,v.material.opacity=.61+Math.sin(w*.11)*.025*x}function D(){J(s,d)}return k({captureMode:!0,elapsedSeconds:0,camera:o}),{object:s,update:k,dispose:D,userData:{partId:"world-environment",packetId:j,packetHash:P,finalDraft:"drafts/world-environment.module.mjs"}}}export{X as createImmersiveWorldPart};
