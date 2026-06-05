var C="art-direction-packet-ba068b1d369c",D="ba068b1d369ca858f6443427ca083c28";function A(e,o,d){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(o,d);let s=2166136261,n=`${o||"world-environment"}:${d||"stella-dumon"}`;for(let t=0;t<n.length;t+=1)s^=n.charCodeAt(t),s=Math.imul(s,16777619);return function(){s+=1831565813;let r=s;return r=Math.imul(r^r>>>15,r|1),r^=r+Math.imul(r^r>>>7,r|61),((r^r>>>14)>>>0)/4294967296}}function I(e){return new e.ShaderMaterial({name:"frank-stella-dumon-direction-space-skybox-material",uniforms:{uTime:{value:0},uMotion:{value:1}},vertexShader:`
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      uniform float uTime;
      uniform float uMotion;
      varying vec3 vLocalPosition;

      float sat(float v) { return clamp(v, 0.0, 1.0); }
      float hash13(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float band(float v, float center, float width, float feather) {
        return 1.0 - smoothstep(width, width + feather, abs(v - center));
      }
      float rect(vec2 p, vec2 halfSize, float feather) {
        vec2 d = abs(p) - halfSize;
        return 1.0 - smoothstep(0.0, feather, max(d.x, d.y));
      }
      float ring(vec3 dir, vec3 centerDir, float radius, float width, float feather) {
        float d = length(dir - centerDir);
        return 1.0 - smoothstep(width, width + feather, abs(d - radius));
      }
      float rowSquares(vec3 dir, float y, float xMin, float xMax, float cells) {
        float row = band(dir.y, y, 0.016, 0.012);
        float span = smoothstep(xMin, xMin + 0.025, dir.x) * (1.0 - smoothstep(xMax - 0.025, xMax, dir.x));
        float cell = fract((dir.x - xMin) / max(0.001, xMax - xMin) * cells);
        float square = smoothstep(0.08, 0.13, cell) * (1.0 - smoothstep(0.50, 0.58, cell));
        return row * span * square;
      }

      void main() {
        vec3 dir = normalize(vLocalPosition);
        float front = smoothstep(0.30, 0.88, -dir.z);
        float sideDepth = smoothstep(-0.12, 0.72, abs(dir.x));
        float high = smoothstep(-0.35, 0.88, dir.y);
        float low = smoothstep(0.35, -0.90, dir.y);
        float grain = hash13(dir * 81.0 + vec3(0.0, 0.0, floor(uTime * 0.03)));
        float scratches = pow(hash13(vec3(dir.x * 180.0, dir.y * 27.0, dir.z * 43.0)), 5.0);

        vec3 cream = vec3(0.890, 0.852, 0.760);
        vec3 paper = vec3(0.760, 0.735, 0.675);
        vec3 blackInk = vec3(0.022, 0.021, 0.020);
        vec3 navy = vec3(0.020, 0.078, 0.150);
        vec3 orange = vec3(0.900, 0.285, 0.060);
        vec3 red = vec3(0.720, 0.050, 0.030);
        vec3 teal = vec3(0.020, 0.455, 0.410);
        vec3 green = vec3(0.045, 0.245, 0.175);
        vec3 violet = vec3(0.275, 0.085, 0.455);
        vec3 yellow = vec3(0.930, 0.670, 0.095);
        vec3 paleBlue = vec3(0.465, 0.655, 0.745);
        vec3 metal = vec3(0.470, 0.430, 0.360);

        vec3 color = mix(cream, paper, sideDepth * 0.35 + high * 0.18);
        color *= 0.88 + grain * 0.16;

        float screen = front * rect(vec2(dir.x, dir.y + 0.015), vec2(0.54, 0.235), 0.018);
        float screenFrame = front * rect(vec2(dir.x, dir.y + 0.015), vec2(0.585, 0.285), 0.018) * (1.0 - screen);
        color = mix(color, vec3(0.045, 0.043, 0.039), screen * 0.96);
        color = mix(color, vec3(0.925, 0.895, 0.815), screenFrame * 0.88);
        color += screen * scratches * vec3(0.10, 0.095, 0.082);

        float diagA = dir.x * 0.88 + dir.y * 1.42 - dir.z * 0.16 + sin(uTime * 0.055) * 0.012 * uMotion;
        float diagB = -dir.x * 1.18 + dir.y * 0.78 + dir.z * 0.20;
        float diagC = dir.x * 1.70 - dir.y * 0.44 + dir.z * 0.35;
        color = mix(color, blackInk, band(diagA, -0.58, 0.055, 0.012) * 0.92);
        color = mix(color, navy, band(diagA, -0.46, 0.045, 0.012) * 0.82);
        color = mix(color, orange, band(diagA, -0.34, 0.026, 0.010) * 0.88);
        color = mix(color, teal, band(diagA, -0.18, 0.034, 0.012) * 0.72);
        color = mix(color, red, band(diagB, 0.58, 0.035, 0.014) * 0.78);
        color = mix(color, violet, band(diagC, -0.34, 0.055, 0.018) * 0.76);
        color = mix(color, yellow, band(diagC, -0.15, 0.024, 0.012) * 0.70);

        vec3 leftCenter = normalize(vec3(-0.78, -0.05, -0.62));
        vec3 rightCenter = normalize(vec3(0.76, 0.13, -0.64));
        float leftRings =
          ring(dir, leftCenter, 0.185, 0.014, 0.010) +
          ring(dir, leftCenter, 0.260, 0.018, 0.010) +
          ring(dir, leftCenter, 0.345, 0.022, 0.011) +
          ring(dir, leftCenter, 0.455, 0.026, 0.013);
        float rightRings =
          ring(dir, rightCenter, 0.130, 0.016, 0.010) +
          ring(dir, rightCenter, 0.225, 0.017, 0.010) +
          ring(dir, rightCenter, 0.330, 0.021, 0.013) +
          ring(dir, normalize(rightCenter + vec3(-0.10, -0.14, 0.03)), 0.390, 0.019, 0.012);
        color = mix(color, blackInk, sat(leftRings) * 0.50);
        color = mix(color, orange, ring(dir, leftCenter, 0.295, 0.030, 0.011) * 0.72);
        color = mix(color, paleBlue, ring(dir, leftCenter, 0.405, 0.036, 0.015) * 0.58);
        color = mix(color, metal, ring(dir, leftCenter, 0.510, 0.026, 0.013) * 0.54);
        color = mix(color, blackInk, sat(rightRings) * 0.62);
        color = mix(color, orange, ring(dir, rightCenter, 0.185, 0.024, 0.010) * 0.84);
        color = mix(color, teal, ring(dir, rightCenter, 0.280, 0.028, 0.012) * 0.76);
        color = mix(color, violet, ring(dir, normalize(rightCenter + vec3(-0.07, -0.18, 0.02)), 0.245, 0.025, 0.012) * 0.62);

        float serial =
          rowSquares(dir, 0.335, -0.47, 0.45, 28.0) +
          rowSquares(dir, -0.375, -0.34, 0.76, 22.0) +
          rowSquares(dir, 0.020, -0.91, -0.79, 7.0);
        color = mix(color, blackInk, sat(serial) * 0.86);

        float verticalGrooves = band(fract((dir.x + 1.0) * 21.0), 0.5, 0.045, 0.020) * band(dir.y, 0.56, 0.22, 0.16) * front;
        color = mix(color, vec3(0.70, 0.68, 0.62), verticalGrooves * 0.38);

        float pressureGlow = screen * (0.14 + 0.08 * grain) + front * band(dir.y, -0.31, 0.018, 0.020) * 0.20;
        color += pressureGlow * vec3(0.09, 0.17, 0.19);
        color = mix(color, blackInk, low * sideDepth * 0.18);
        color += (grain - 0.5) * 0.035 + scratches * vec3(0.035, 0.030, 0.024);

        gl_FragColor = vec4(sat(color.r), sat(color.g), sat(color.b), 1.0);
      }
    `,side:e.BackSide,depthWrite:!1,depthTest:!1,fog:!1,toneMapped:!1})}function B(e,o,d){let s=new e.Group;s.name="single-frank-stella-dumon-fallback-skybox-shell",s.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",packetId:C,packetHash:D,environmentGeometryKind:"box",environmentRadius:o};let n=new e.BoxGeometry(2/Math.sqrt(3),2/Math.sqrt(3),2/Math.sqrt(3),1,1,1),t=new e.Mesh(n,d);return t.name="frank-stella-position-space-skybox-mesh",t.scale.setScalar(o),t.castShadow=!1,t.receiveShadow=!1,t.frustumCulled=!1,t.renderOrder=-1e3,t.onBeforeRender=function(a,l,p){p&&p.position&&(s.position.copy(p.position),s.updateMatrixWorld(!0))},s.renderOrder=-1e3,s.add(t),s.mesh=t,s.geometry=n,s.material=d,s}function G(e,o,d,s){o.name="single-frank-stella-dumon-pressure-skybox-shell",o.userData={...o.userData,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",role:"world-environment",packetId:C,packetHash:D,environmentGeometryKind:"box",environmentRadius:s,shellReview:"the only true enclosing shell; shader carries screen, rings, stripes, serial marks, and rough relief"},o.renderOrder=-1e3,o.frustumCulled=!1;let n=o.mesh||o.children.find(t=>t&&t.isMesh);n&&(n.material&&n.material!==d&&typeof n.material.dispose=="function"&&n.material.dispose(),n.name="frank-stella-dumon-position-space-skybox-mesh",n.material=d,n.scale.setScalar(s),n.castShadow=!1,n.receiveShadow=!1,n.frustumCulled=!1,n.renderOrder=-1e3,n.onBeforeRender=function(r,a,l){l&&l.position&&(o.position.copy(l.position),o.updateMatrixWorld(!0))})}function k(e,o){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=o,e}function z(e,o,d){return new e.MeshBasicMaterial({color:o,transparent:d<1,opacity:d,side:e.DoubleSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})}function q(e,o,d,s){let n=new e.Group;n.name="far-stella-diagonal-flow-pressure-relief-planes";let t=new e.PlaneGeometry(1,1,1,1);d.push(t);let r=[["black-broadcast-pressure-slash","#0d0d0d",.82,[-9.2,1.6,-11.8],[17.2,.54,1],[0,.23,-.62]],["navy-depth-current-slash","#061b37",.74,[-7,2.9,-13.6],[15.4,.46,1],[.03,.28,-.58]],["orange-devils-crowd-flow-slash","#e55214",.86,[-4.6,-1.38,-9.5],[16.6,.58,1],[.02,.13,-.6]],["teal-counterpressure-slash","#047166",.7,[3,-2.2,-12.8],[18.2,.44,1],[0,-.2,-.48]],["violet-ruptured-order-slash","#602098",.63,[5.7,-1.62,-10.8],[13,.54,1],[0,-.15,-.53]],["yellow-small-match-signal-bar","#e4aa16",.76,[-.8,-2.85,-8.8],[7.6,.36,1],[0,.02,-.4]],["white-relief-counter-frame-bar","#efe5cf",.58,[0,3.34,-14.8],[21.5,.3,1],[0,0,0]],["green-place-dumon-counterfield","#0d4a35",.58,[8.2,-.62,-12],[11.6,.52,1],[0,-.38,.46]]];for(let a=0;a<r.length;a+=1){let[l,p,g,i,c,u]=r[a],m=z(e,p,g);s.push(m);let f=new e.Mesh(t,m);f.name=l,f.position.set(i[0],i[1],i[2]),f.scale.set(c[0],c[1],c[2]),f.rotation.set(u[0],u[1],u[2]),f.userData={baseY:f.position.y,baseRotationZ:f.rotation.z,phase:o()*Math.PI*2,drift:.012+o()*.018,baseOpacity:g},k(f,-42+a),n.add(f)}return n}function F(e,o,d){let s=new e.Group;s.name="stella-concentric-broadcast-pressure-relief";let n=[["left-black-order-ring","#111111",.62,[-6.15,.42,-9.8],1.55,1.72,[.02,-.16,0],[1,.72,1]],["left-pale-blue-ring","#80aac5",.56,[-6.15,.42,-9.82],2.1,2.27,[.02,-.16,0],[1,.72,1]],["left-orange-ring","#e55914",.72,[-6.15,.42,-9.84],2.62,2.79,[.02,-.16,0],[1,.72,1]],["left-metal-ring","#87765c",.48,[-6.15,.42,-9.86],3.18,3.33,[.02,-.16,0],[1,.72,1]],["right-black-loop-ring","#080808",.68,[6.95,.5,-8.9],1.35,1.52,[.18,.22,.28],[1.15,.82,1]],["right-teal-loop-ring","#087068",.62,[6.95,.5,-8.92],1.95,2.12,[.18,.22,.28],[1.15,.82,1]],["right-orange-loop-ring","#f05a12",.76,[6.95,.5,-8.94],2.55,2.72,[.18,.22,.28],[1.15,.82,1]],["right-violet-loop-ring","#6827a0",.5,[6.58,-.58,-8.62],1.1,1.26,[.32,-.02,-.46],[1.38,.7,1]]];for(let t=0;t<n.length;t+=1){let[r,a,l,p,g,i,c,u]=n[t],m=new e.RingGeometry(g,i,128,1);o.push(m);let f=z(e,a,l);d.push(f);let v=new e.Mesh(m,f);v.name=r,v.position.set(p[0],p[1],p[2]),v.rotation.set(c[0],c[1],c[2]),v.scale.set(u[0],u[1],u[2]),v.userData={phase:t*.71,baseRotationZ:v.rotation.z},k(v,-25+t),s.add(v)}return s}function W(e,o,d){let s=new e.Group;s.name="place-dumon-serial-broadcast-square-pressure";let n=new e.PlaneGeometry(.23,.23,1,1);o.push(n);let r=["#0b0b0b","#f0e7d4","#e75a16","#057064","#5b2494"].map(a=>z(e,a,a==="#f0e7d4"?.82:.86));d.push(...r);for(let a=0;a<2;a+=1){let l=a===0?29:24,p=a===0?2.42:-2.78,g=a===0?-10.6:-7.8,i=a===0?-4.9:-2.6,c=a===0?.36:.43;for(let u=0;u<l;u+=1){let m=new e.Mesh(n,r[(u+a)%r.length]);m.name=`serial-screen-square-${a+1}-${String(u+1).padStart(2,"0")}`,m.position.set(i+u*c,p,g-u*.012),m.rotation.set(.02,a===0?.05:-.18,0);let f=u%5===0?1.22:1;m.scale.setScalar(f),m.userData={phase:u*.39,baseY:p},k(m,-12+u%4),s.add(m)}}return s}function L(e,o,d,s){let t=new Float32Array(624),r=new Float32Array(624),a=[new e.Color("#101010"),new e.Color("#e85a16"),new e.Color("#077066"),new e.Color("#071d38"),new e.Color("#f0e7d4")];for(let i=0;i<104;i+=1){let c=i%2===0?-1:1,m=i%4!==0?c*(4.2+o()*5.2):-9.5+o()*19,f=-2.7+o()*5.6,v=-6.4-o()*11.8,M=c*(.35+o()*1.7),S=-.08+o()*.92,b=i*6;t[b]=m,t[b+1]=f,t[b+2]=v,t[b+3]=m+M,t[b+4]=f+S,t[b+5]=v-o()*.5;let h=a[i%a.length];r[b]=h.r,r[b+1]=h.g,r[b+2]=h.b,r[b+3]=h.r,r[b+4]=h.g,r[b+5]=h.b}let l=new e.BufferGeometry;l.setAttribute("position",new e.BufferAttribute(t,3)),l.setAttribute("color",new e.BufferAttribute(r,3)),d.push(l);let p=new e.LineBasicMaterial({name:"black-orange-teal-spatial-contour-line-material",vertexColors:!0,transparent:!0,opacity:.68,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});s.push(p);let g=new e.LineSegments(l,p);return g.name="stella-variable-width-contour-pressure-lines",k(g,-5),g}function O(e,o,d,s){let t=new Float32Array(840),r=new Float32Array(280*3),a=[new e.Color("#f0e7d4"),new e.Color("#e85a16"),new e.Color("#ce1126"),new e.Color("#057064"),new e.Color("#e0aa1a"),new e.Color("#5b2494"),new e.Color("#101010")];for(let i=0;i<280;i+=1){let c=o()*Math.PI*2,u=2.2+o()*10.8,m=i%5===0;t[i*3]=Math.sin(c)*u*(m?.42:1),t[i*3+1]=-3.1+o()*6.3,t[i*3+2]=-5.6-Math.cos(c)*u-o()*4;let f=a[i%a.length];r[i*3]=f.r,r[i*3+1]=f.g,r[i*3+2]=f.b}let l=new e.BufferGeometry;l.setAttribute("position",new e.BufferAttribute(t,3)),l.setAttribute("color",new e.BufferAttribute(r,3)),d.push(l);let p=new e.PointsMaterial({name:"rough-pigment-and-broadcast-pixel-specks",size:.26,vertexColors:!0,transparent:!0,opacity:.62,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});s.push(p);let g=new e.Points(l,p);return g.name="stella-scraped-pigment-pixel-pressure-specks",k(g,-3),g}function _({THREE:e,part:o,world:d,seed:s,utilities:n}){let t=new e.Group;t.name="world-environment-frank-stella-dumon-screen-pressure",t.userData={partId:"world-environment",role:o?.role||"world-environment",packetId:C,packetHash:D,selectedNews:"World Cup giant screen on Place Dumon for Devils matches",artist:"Frank Stella",shellCountIntent:1};let r=A(n,s||o?.id||"world-environment","frank-stella-place-dumon-environment"),a=[],l=[],p=Number(d?.environment?.skyboxRadius||d?.environment?.radius),g=Number.isFinite(p)&&p>0?Math.max(56,Math.min(128,p)):92,i=I(e);l.push(i);let c;n&&typeof n.createSkyboxShell=="function"?(c=n.createSkyboxShell({radius:g,name:"single-frank-stella-dumon-pressure-skybox-shell",geometryKind:"box",color:"#efe5cf",opacity:1,cameraPinned:!0,userData:{immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",packetId:C,packetHash:D}}),c=c.object||c):(c=B(e,g,i),c.geometry&&a.push(c.geometry)),G(e,c,i,g),t.add(c);let u=q(e,r,a,l),m=F(e,a,l),f=W(e,a,l),v=L(e,r,a,l),M=O(e,r,a,l);t.add(u),t.add(m),t.add(f),t.add(v),t.add(M);function S(h={}){let P=h.captureMode?0:Number(h.elapsedSeconds??h.time??0),w=Number.isFinite(P)?P:0,y=Number.isFinite(h.motionIntensity)?h.motionIntensity:1;i.uniforms.uTime.value=w,i.uniforms.uMotion.value=y;for(let x of u.children)x.position.y=x.userData.baseY+Math.sin(w*.045+x.userData.phase)*x.userData.drift*y,x.rotation.z=x.userData.baseRotationZ+Math.sin(w*.035+x.userData.phase)*.012*y,x.material.opacity=x.userData.baseOpacity*(.96+Math.sin(w*.09+x.userData.phase)*.035*y);m.rotation.z=Math.sin(w*.034)*.018*y,f.position.y=Math.sin(w*.055)*.018*y,v.rotation.z=Math.sin(w*.025)*.008*y,M.rotation.y=Math.sin(w*.031)*.035*y}function b(){for(let h of a)h&&typeof h.dispose=="function"&&h.dispose();for(let h of l)h&&typeof h.dispose=="function"&&h.dispose()}return S({captureMode:!0,elapsedSeconds:0,motionIntensity:1}),{object:t,update:S,dispose:b}}export{_ as createImmersiveWorldPart};
