var D="art-direction-packet-09103446faf0",O="09103446faf02301e7870c5a7a6777de";function J(e){let a=String(e??"hudson-taiwan-pressure-environment"),i=2166136261;for(let n=0;n<a.length;n+=1)i^=a.charCodeAt(n),i=Math.imul(i,16777619);return i>>>0}function R(e,a,i){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(a,i);let n=(J(a)^J(i))>>>0;return function(){n=n+1831565813>>>0;let s=n;return s=Math.imul(s^s>>>15,s|1),s^=s+Math.imul(s^s>>>7,s|61),((s^s>>>14)>>>0)/4294967296}}function H(e){e.traverse(a=>{a.geometry&&typeof a.geometry.dispose=="function"&&a.geometry.dispose();let i=Array.isArray(a.material)?a.material:[a.material].filter(Boolean);for(let n of i)n&&typeof n.dispose=="function"&&n.dispose()})}function g(e,a){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=a,e}function E(e){let a=Number(e?.environment?.skyboxRadius||e?.environment?.radius||90);return Math.max(54,Math.min(96,Number.isFinite(a)?a:90))}function ee(e,a,i){let n=2/Math.sqrt(3),r=new e.BoxGeometry(n,n,n,1,1,1),s=new e.MeshBasicMaterial({color:"#141414",side:e.BackSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),l=new e.Mesh(r,s);l.name=`${i}-mesh`,l.scale.setScalar(a),l.onBeforeRender=function(y,d,f){f&&f.position&&t.position.copy(f.position)},g(l,-1e3);let t=new e.Group;return t.name=i,t.userData={partId:"world-environment",role:"world-environment",packetId:D,packetHash:O,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,environmentRadius:a},t.add(l),t.object=t,t.mesh=l,t.material=s,t.geometry=r,t}function oe(e){return new e.ShaderMaterial({name:"hudson_taiwan_fracture_position_space_single_skybox",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uRed:{value:new e.Color("#e52318")},uOrange:{value:new e.Color("#f15a24")},uYellow:{value:new e.Color("#ffd21a")},uBlue:{value:new e.Color("#0058b8")},uCyan:{value:new e.Color("#14a7ce")},uGreen:{value:new e.Color("#13863f")},uBlack:{value:new e.Color("#111315")},uWhite:{value:new e.Color("#f1eee5")},uGray:{value:new e.Color("#7b7870")},uWarmGray:{value:new e.Color("#b8b0a3")},uTealDark:{value:new e.Color("#003c43")}},vertexShader:`
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vPosition;
      uniform float uTime;
      uniform vec3 uRed;
      uniform vec3 uOrange;
      uniform vec3 uYellow;
      uniform vec3 uBlue;
      uniform vec3 uCyan;
      uniform vec3 uGreen;
      uniform vec3 uBlack;
      uniform vec3 uWhite;
      uniform vec3 uGray;
      uniform vec3 uWarmGray;
      uniform vec3 uTealDark;

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
        float amp = 0.52;
        for (int i = 0; i < 5; i++) {
          value += amp * noise3(p);
          p = p * 2.08 + vec3(6.7, 4.9, 8.1);
          amp *= 0.5;
        }
        return value;
      }

      float band(vec2 p, float angle, float center, float halfWidth, float feather) {
        vec2 axis = vec2(cos(angle), sin(angle));
        float value = dot(p, axis);
        return 1.0 - smoothstep(halfWidth, halfWidth + feather, abs(value - center));
      }

      float rect(vec2 p, vec2 center, vec2 halfSize, float feather) {
        vec2 d = abs(p - center) - halfSize;
        float outside = length(max(d, 0.0));
        float inside = min(max(d.x, d.y), 0.0);
        return 1.0 - smoothstep(0.0, feather, outside + inside);
      }

      float wedge(vec2 p, float angle, float center, float halfWidth, float feather, float gateCenter, float gateSize) {
        float stripe = band(p, angle, center, halfWidth, feather);
        vec2 crossAxis = vec2(-sin(angle), cos(angle));
        float gate = smoothstep(-gateSize, -gateSize * 0.3, dot(p, crossAxis) - gateCenter)
          * (1.0 - smoothstep(gateSize * 0.35, gateSize, dot(p, crossAxis) - gateCenter));
        return stripe * gate;
      }

      float ring(vec2 p, vec2 center, float radius, float width, float feather) {
        return 1.0 - smoothstep(width, width + feather, abs(length(p - center) - radius));
      }

      void main() {
        vec3 dir = normalize(vPosition);
        float x = dir.x;
        float y = dir.y;
        float z = dir.z;
        float front = smoothstep(-0.18, 0.86, -z);
        float back = smoothstep(-0.05, 0.82, z);
        float poleFade = 1.0 - smoothstep(0.78, 0.97, abs(y));
        float poleBlend = smoothstep(0.84, 0.985, abs(y));
        float pulse = sin(uTime * 0.42) * 0.018;

        vec3 p3 = vec3(x * 1.4, y * 1.15, z * 1.4);
        float n = fbm3(p3 * 2.1 + vec3(uTime * 0.01, -uTime * 0.006, 2.3));
        float fine = fbm3(p3 * 31.0 + vec3(3.0, uTime * 0.04, 7.0));
        vec2 p = vec2(x * 1.04, y);

        vec3 leftWarm = mix(uRed, uOrange, smoothstep(-0.92, 0.2, y) + n * 0.22);
        vec3 rightCool = mix(uBlue, uCyan, smoothstep(-0.2, 0.72, y) + n * 0.18);
        vec3 upper = mix(uBlack, uTealDark, smoothstep(-0.18, 0.48, x) * smoothstep(0.12, 0.92, y));
        vec3 lower = mix(uOrange, uBlue, smoothstep(-0.02, 0.34, x));
        vec3 color = mix(leftWarm, rightCool, smoothstep(-0.06, 0.2, x));
        color = mix(color, lower, smoothstep(-0.95, -0.18, y) * 0.72);
        color = mix(color, upper, smoothstep(0.18, 0.9, y) * (0.66 + 0.22 * front));

        float verticalSplit = 1.0 - smoothstep(0.012, 0.032, abs(x + 0.015));
        float centralPressure = 1.0 - smoothstep(0.05, 0.24, length(vec2((x + 0.02) * 1.45, y + 0.08)));
        float blackHorizon = band(p, 0.02, -0.1 + pulse, 0.045, 0.027) * poleFade;
        float blackUpperLeft = rect(p, vec2(-0.52, 0.46), vec2(0.42, 0.34), 0.055) * front;
        float blackUpperRight = rect(p, vec2(0.42, 0.38), vec2(0.42, 0.31), 0.06) * front;
        float blackKnifeA = wedge(p, -0.72, -0.03 + pulse, 0.048, 0.025, -0.1, 1.5) * poleFade;
        float blackKnifeB = wedge(p, 0.52, 0.22 - pulse, 0.035, 0.02, 0.16, 1.4) * poleFade;
        float whiteKnife = wedge(p, 0.84, -0.08, 0.03, 0.018, 0.08, 1.18) * poleFade * front;
        float yellowPressure = wedge(p, -0.68, 0.44 - pulse, 0.038, 0.022, 0.05, 1.48) * poleFade;
        float redPressure = wedge(p, -0.86, 0.19 + pulse * 0.6, 0.022, 0.018, 0.14, 1.18) * poleFade * front;
        float cyanPanel = rect(p, vec2(0.58, -0.05), vec2(0.45, 0.28), 0.055) * front;
        float grayPanel = rect(p, vec2(0.18, 0.63), vec2(0.32, 0.22), 0.055) * (0.6 + front * 0.35);
        float palePanel = rect(p, vec2(-0.18, 0.07), vec2(0.32, 0.22), 0.04) * front;
        float greenStrut = wedge(p, 0.72, -0.58, 0.028, 0.018, -0.2, 1.25) * poleFade;
        float lowerArc = ring(p, vec2(-0.04, -0.82), 0.34, 0.035, 0.028) * front * smoothstep(-0.98, -0.48, y);
        float backGrid = (band(vec2(z, y), -0.18, -0.18, 0.03, 0.02) + band(vec2(z, y), 0.22, 0.26, 0.025, 0.018)) * back * poleFade;

        color = mix(color, uBlack, clamp(blackHorizon * 0.82 + blackUpperLeft * 0.72 + blackUpperRight * 0.78 + blackKnifeA * 0.9 + blackKnifeB * 0.86, 0.0, 1.0));
        color = mix(color, uWhite, palePanel * 0.78 + whiteKnife * 0.92 + lowerArc * 0.78);
        color = mix(color, uCyan, cyanPanel * 0.72);
        color = mix(color, uGray, grayPanel * 0.72);
        color = mix(color, uGreen, greenStrut * 0.82 + backGrid * 0.45);
        color = mix(color, uYellow, yellowPressure * (0.86 + centralPressure * 0.12));
        color = mix(color, uRed, redPressure * 0.9 + verticalSplit * 0.58 * poleFade);
        color = mix(color, uBlack, centralPressure * 0.16 * front);

        float nestedBlue = band(p, 0.01, -0.26, 0.02, 0.014) * front * poleFade;
        float nestedWhite = band(p, 0.01, -0.34, 0.018, 0.012) * front * poleFade;
        float nestedRed = band(p, 0.01, -0.41, 0.012, 0.01) * front * poleFade;
        color = mix(color, uBlue, nestedBlue * 0.88);
        color = mix(color, uWhite, nestedWhite * 0.9);
        color = mix(color, uRed, nestedRed * 0.85);

        float seamDark = (band(p, -0.72, 0.04, 0.012, 0.012) + band(p, 0.52, 0.18, 0.01, 0.01)) * poleFade;
        color = mix(color, uBlack, seamDark * 0.74);

        float vignette = smoothstep(0.62, 1.08, abs(x)) * (0.12 + 0.18 * n) * poleFade;
        color = mix(color, uBlack, vignette);
        color += (n - 0.5) * 0.035 + (fine - 0.5) * 0.025 * (0.42 + poleFade * 0.58);
        color *= 0.98 + 0.24 * front + 0.06 * centralPressure;
        vec3 poleWash = mix(mix(uOrange, uBlue, smoothstep(-0.1, 0.22, x)), mix(uBlack, uWarmGray, 0.28), smoothstep(0.1, 0.86, y));
        poleWash = mix(poleWash, mix(uWhite, uGray, 0.48), smoothstep(-0.98, -0.72, y) * 0.35);
        color = mix(color, poleWash + (n - 0.5) * 0.035, poleBlend * 0.76);
        color = pow(max(color, vec3(0.0)), vec3(1.01));
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function I(e,a,i){return new e.MeshBasicMaterial({color:a,transparent:i<1,opacity:i,side:e.DoubleSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})}function te(e,a,i,n,r,s){let l=I(e,r.color,r.opacity);n.push(l);let t=new e.Mesh(i,l);return t.name=r.name,t.position.set(r.position[0],r.position[1],r.position[2]),t.rotation.set(r.rotation[0],r.rotation[1],r.rotation[2]),t.scale.set(r.scale[0],r.scale[1],1),t.userData.baseScaleX=r.scale[0],t.userData.baseScaleY=r.scale[1],t.userData.baseOpacity=r.opacity,t.userData.phase=s()*Math.PI*2,g(t,r.renderOrder||-40),a.add(t),t}function ae(e){let i=new Uint8Array(9216);for(let r=0;r<48;r+=1)for(let s=0;s<48;s+=1){let l=(s+.5)/48*2-1,t=(r+.5)/48*2-1,v=Math.sqrt(l*l+t*t),y=Math.max(0,Math.min(1,(1-v)/.34)),d=(r*48+s)*4;i[d]=255,i[d+1]=255,i[d+2]=255,i[d+3]=Math.round(y*y*255)}let n=new e.DataTexture(i,48,48,e.RGBAFormat);return n.needsUpdate=!0,n.wrapS=e.ClampToEdgeWrapping,n.wrapT=e.ClampToEdgeWrapping,n.minFilter=e.LinearFilter,n.magFilter=e.LinearFilter,e.SRGBColorSpace&&(n.colorSpace=e.SRGBColorSpace),n}function re({THREE:e,part:a,world:i,seed:n,camera:r,utilities:s}){let l=new e.Group;l.name="world-environment-hudson-taiwan-geometric-pressure",l.userData={partId:"world-environment",role:a?.role||"world-environment",packetId:D,packetHash:O,messagePurpose:"single-shell Bryce Hudson environment for Taiwan summit fracture pressure"};let t=R(s,n||a?.id||"world-environment","hudson-taiwan-single-skybox"),v=E(i),y=s&&typeof s.createSkyboxShell=="function"?s.createSkyboxShell({radius:v,name:"single-hudson-taiwan-pressure-skybox-shell",geometryKind:"box",color:"#111315",opacity:1,cameraPinned:!0,userData:{partId:"world-environment",role:"world-environment",packetId:D,packetHash:O,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0}}):ee(e,v,"single-hudson-taiwan-pressure-skybox-shell"),d=y.object||y,f=y.mesh||d.mesh||d.children.find(o=>o&&o.isMesh);d.name="single-hudson-taiwan-pressure-skybox-shell",d.userData={...d.userData,partId:"world-environment",role:"world-environment",packetId:D,packetHash:O,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,environmentRadius:v,compositionRole:"the one true enclosing skybox carries the first readable hard-edge composition"};let C=oe(e);f&&(f.material&&typeof f.material.dispose=="function"&&f.material.dispose(),f.material=C,f.scale.setScalar(v),f.name="hudson-position-space-geometric-pressure-shell-mesh",g(f,-1e3)),d.material=C,l.add(d);let k=[C],S=[],Y=new e.PlaneGeometry(1,1,1,1);S.push(Y);let P=new e.Group;P.name="ordinary-depth-geometric-pressure-bands",l.add(P);let Q=[{name:"left-warm-cropped-red-wall-plane",color:"#e52318",opacity:.78,position:[-7.5,1.6,-8.4],rotation:[.02,.28,-.02],scale:[18.5,6.2],renderOrder:-62},{name:"right-cool-cyan-blue-wall-plane",color:"#0058b8",opacity:.78,position:[7.2,.5,-8.8],rotation:[.02,-.28,.02],scale:[17.5,5.8],renderOrder:-61},{name:"central-heavy-black-interrupting-slab",color:"#101214",opacity:.86,position:[.4,2.35,-7.6],rotation:[.03,-.02,-.1],scale:[11.8,2.4],renderOrder:-59},{name:"low-white-cropped-arc-pressure-field",color:"#f1eee5",opacity:.72,position:[-1.5,-2.35,-6.7],rotation:[.05,.08,-.27],scale:[9.8,1],renderOrder:-57},{name:"yellow-trump-pressure-diagonal-strut",color:"#ffd21a",opacity:.88,position:[-1.6,1.08,-5.9],rotation:[.02,-.02,-.72],scale:[16.8,.55],renderOrder:-50},{name:"thin-red-summit-fracture-divider",color:"#ed1c24",opacity:.82,position:[1.25,-.05,-5.45],rotation:[.03,.01,-.82],scale:[9.8,.22],renderOrder:-49},{name:"near-black-horizontal-contour-anchor",color:"#111315",opacity:.84,position:[0,-.72,-4.85],rotation:[0,0,-.01],scale:[17.2,.32],renderOrder:-47},{name:"cool-blue-nested-stripe-under-pressure",color:"#14a7ce",opacity:.68,position:[1.2,-1.18,-4.65],rotation:[0,.01,0],scale:[12.2,.22],renderOrder:-46},{name:"green-rigid-counter-strut",color:"#13863f",opacity:.58,position:[-4.4,-.35,-7.4],rotation:[.02,.18,.72],scale:[9.4,.38],renderOrder:-45},{name:"right-gray-compression-plate",color:"#7b7870",opacity:.56,position:[5.3,2.9,-9.3],rotation:[.05,-.22,.54],scale:[14.4,1.7],renderOrder:-55}];for(let o of Q)te(e,P,Y,k,o,t);let _=[I(e,"#111315",.58),I(e,"#0058b8",.42),I(e,"#f1eee5",.36)];k.push(..._);let M=new e.Group;M.name="cropped-radial-symbols-at-fracture-point",l.add(M);for(let o=0;o<4;o+=1){let u=1.15+o*.72,h=u+.035+o*.01,c=new e.RingGeometry(u,h,128);S.push(c);let p=new e.Mesh(c,_[o%_.length]);p.name=`thin-cropped-hudson-radial-pressure-ring-${o+1}`,p.position.set(-.15+o*.22,-.72-o*.05,-5.25-o*.4),p.rotation.set(.05,-.04,-.08+o*.04),p.scale.y=.58,p.userData.phase=t()*Math.PI*2,p.userData.baseOpacity=p.material.opacity,g(p,-42+o),M.add(p)}let K=ae(e),B=new e.BufferGeometry;S.push(B);let j=180,z=new Float32Array(j*3),W=new Float32Array(j*3),q=[new e.Color("#111315"),new e.Color("#ed1c24"),new e.Color("#ffd21a"),new e.Color("#14a7ce"),new e.Color("#13863f"),new e.Color("#f1eee5")];for(let o=0;o<j;o+=1){let u=o%2===0?-1:1,h=t()*Math.PI*2,c=3.6+t()*10.8;z[o*3]=u*(1.4+t()*9.8)+Math.sin(h)*.9,z[o*3+1]=-3+t()*6.2,z[o*3+2]=-2.6-c;let p=q[o%q.length];W[o*3]=p.r,W[o*3+1]=p.g,W[o*3+2]=p.b}B.setAttribute("position",new e.BufferAttribute(z,3)),B.setAttribute("color",new e.BufferAttribute(W,3));let N=new e.PointsMaterial({name:"soft-matte-pigment-intersection-points",size:.22,map:K,alphaMap:K,transparent:!0,opacity:.56,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});k.push(N);let F=new e.Points(B,N);F.name="soft-pigment-grain-not-square-sprites",g(F,-32),l.add(F);let G=new e.BufferGeometry;S.push(G);let L=46,w=new Float32Array(L*2*3),x=new Float32Array(L*2*3),X=[new e.Color("#111315"),new e.Color("#f1eee5"),new e.Color("#ffd21a"),new e.Color("#ed1c24")];for(let o=0;o<L;o+=1){let u=-2.55+t()*5.4,h=-3.4-t()*10.5,c=-8.8+t()*17.6,p=o%2===0?1:-1,U=c+p*(1.4+t()*4.6),T=u+(t()-.5)*1.25,m=o*6;w[m]=c,w[m+1]=u,w[m+2]=h,w[m+3]=U,w[m+4]=T,w[m+5]=h-t()*.8;let b=X[o%X.length];x[m]=b.r,x[m+1]=b.g,x[m+2]=b.b,x[m+3]=b.r,x[m+4]=b.g,x[m+5]=b.b}G.setAttribute("position",new e.BufferAttribute(w,3)),G.setAttribute("color",new e.BufferAttribute(x,3));let $=new e.LineBasicMaterial({name:"sharp-hudson-contour-line-pressure",vertexColors:!0,transparent:!0,opacity:.5,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});k.push($);let A=new e.LineSegments(G,$);A.name="distributed-hard-edge-contour-lines",g(A,-34),l.add(A);function V(o={}){let u=o.captureMode?0:Number(o.elapsedSeconds??o.time??0);C.uniforms.uTime.value=u;let h=Math.sin(u*.34)*.018;P.children.forEach((c,p)=>{let U=1+Math.sin(u*.16+c.userData.phase)*.012;c.scale.x=c.userData.baseScaleX*U,c.scale.y=c.userData.baseScaleY*(1+h*(p%2===0?1:-1)),c.material.opacity=c.userData.baseOpacity*(.96+Math.sin(u*.12+c.userData.phase)*.035)}),M.rotation.z=Math.sin(u*.05)*.015,M.children.forEach((c,p)=>{c.material.opacity=c.userData.baseOpacity*(.92+Math.sin(u*.1+p)*.06)}),F.rotation.y=Math.sin(u*.032)*.028,A.rotation.z=Math.sin(u*.04)*.01,o.camera&&r&&r.position&&r.position.copy(o.camera.position)}function Z(){H(l);for(let o of S)o.dispose?.();for(let o of k)o.dispose?.();K.dispose?.()}return V({captureMode:!0,elapsedSeconds:0}),{object:l,update:V,dispose:Z}}export{re as createImmersiveWorldPart};
