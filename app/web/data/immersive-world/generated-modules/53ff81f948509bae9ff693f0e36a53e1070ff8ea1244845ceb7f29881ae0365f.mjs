var j="art-direction-packet-3627abb3e097",S="3627abb3e097cc1099a7eaeab0983d80",O="non-literal-fracture-pressure";function B(t){let n=String(t??"lee-krasner-brussels-fracture-pressure"),u=2166136261;for(let e=0;e<n.length;e+=1)u^=n.charCodeAt(e),u=Math.imul(u,16777619);return u>>>0}function V(t,n,u){if(t&&typeof t.createSeededRandom=="function")return t.createSeededRandom(n,u);let e=(B(n)^B(u))>>>0;return function(){e=e+1831565813>>>0;let o=e;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296}}function K(t){t.traverse(n=>{n.geometry&&typeof n.geometry.dispose=="function"&&n.geometry.dispose();let u=Array.isArray(n.material)?n.material:[n.material].filter(Boolean);for(let e of u)e&&typeof e.dispose=="function"&&e.dispose()})}function b(t,n,u={}){let{opacity:e=1,grain:r=.08,edgeDarken:o=.18,transparent:c=e<.99,side:i=t.DoubleSide}=u;return new t.ShaderMaterial({name:"krasner_matte_scraped_paper_paint",side:i,transparent:c,depthWrite:e>.94,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uColor:{value:new t.Color(n)},uOpacity:{value:e},uGrain:{value:r},uEdgeDarken:{value:o},uTime:{value:0}},vertexShader:`
      varying vec2 vUv;
      varying vec3 vLocal;
      void main() {
        vUv = uv;
        vLocal = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec2 vUv;
      varying vec3 vLocal;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uGrain;
      uniform float uEdgeDarken;
      uniform float uTime;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 34.17);
        return fract(p.x * p.y);
      }

      float noise2(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
          mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        float broad = noise2(vUv * 9.0 + vec2(4.7, 1.3));
        float fleck = noise2(vUv * 73.0 + vec2(1.8, 9.2));
        float scrape = abs(sin((vUv.x * 0.72 + vUv.y * 0.31) * 96.0));
        float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float wornEdge = 1.0 - smoothstep(0.0, 0.105, edge);
        float pigment = 0.92 + (broad - 0.5) * uGrain + (fleck - 0.5) * uGrain * 0.9 - scrape * 0.025;
        pigment -= wornEdge * uEdgeDarken * (0.45 + fleck * 0.55);
        gl_FragColor = vec4(max(uColor * pigment, vec3(0.0)), uOpacity);
      }
    `})}function W(t,n){let u=1/0,e=1/0,r=-1/0,o=-1/0;for(let l of n)u=Math.min(u,l[0]),r=Math.max(r,l[0]),e=Math.min(e,l[1]),o=Math.max(o,l[1]);let c=Math.max(.001,r-u),i=Math.max(.001,o-e),s=[],f=[];for(let l=1;l<n.length-1;l+=1){let w=[n[0],n[l],n[l+1]];for(let g of w)s.push(g[0],g[1],0),f.push((g[0]-u)/c,(g[1]-e)/i)}let a=new t.BufferGeometry;return a.setAttribute("position",new t.Float32BufferAttribute(s,3)),a.setAttribute("uv",new t.Float32BufferAttribute(f,2)),a.computeVertexNormals(),a.computeBoundingSphere(),a}function X(t,n,u,e,r,o,c=.22){let i=[[0,0]];for(let s=0;s<=e;s+=1){let f=s/e,a=r+o*f,l=1+(t()-.5)*c+Math.sin(f*Math.PI*3)*c*.22;i.push([Math.cos(a)*n*l,Math.sin(a)*u*l])}return i}function Y(t,n,u,e){let r=new t.Mesh(W(t,u),n);return r.name=e.name,r.position.set(e.position[0],e.position[1],e.position[2]),r.rotation.set(e.rotation?.[0]||0,e.rotation?.[1]||0,e.rotation?.[2]||0),r.scale.set(e.scale?.[0]||1,e.scale?.[1]||1,1),r.renderOrder=e.renderOrder||0,r.frustumCulled=!1,r.castShadow=!1,r.receiveShadow=!1,r.userData.base={x:r.position.x,y:r.position.y,z:r.position.z,rz:r.rotation.z,pulse:e.pulse||.02,phase:e.phase||0},r}function N(t,n,u,e){let r=[],o=e.count||96;for(let f=0;f<o;f+=1){let a=f/o,l=Math.PI*2*a,w=1+Math.sin(l*e.wobbleA+e.phase)*e.wobbleAmp+(n()-.5)*e.noise;r.push(new t.Vector3(Math.cos(l)*e.radiusX*w,Math.sin(l)*e.radiusY*(1+Math.cos(l*e.wobbleB)*e.wobbleAmp*.7),(n()-.5)*.02))}let c=new t.CatmullRomCurve3(r,!0,"catmullrom",.42),i=new t.TubeGeometry(c,o,e.thickness,6,!0),s=new t.Mesh(i,u);return s.name=e.name,s.position.set(e.position[0],e.position[1],e.position[2]),s.rotation.set(e.rotation?.[0]||0,e.rotation?.[1]||0,e.rotation?.[2]||0),s.scale.set(e.scale?.[0]||1,e.scale?.[1]||1,e.scale?.[2]||1),s.renderOrder=e.renderOrder||30,s.frustumCulled=!1,s.userData.base={x:s.position.x,y:s.position.y,z:s.position.z,rz:s.rotation.z,pulse:e.pulse||.03,phase:e.phase||0},s}function $(t,n,u,e){let r=[],o=e.count||16;for(let f=0;f<o;f+=1){let a=f/(o-1),l=Math.sin(a*Math.PI)*e.bend;r.push(new t.Vector3(e.x0+(e.x1-e.x0)*a+l*Math.sin(e.phase+a*5),e.y0+(e.y1-e.y0)*a+(n()-.5)*e.jitter,e.z0+(e.z1-e.z0)*a))}let c=new t.CatmullRomCurve3(r,!1,"catmullrom",.38),i=new t.TubeGeometry(c,o*4,e.thickness,6,!1),s=new t.Mesh(i,u);return s.name=e.name,s.renderOrder=e.renderOrder||36,s.frustumCulled=!1,s.userData.base={x:0,y:0,z:0,rz:0,pulse:e.pulse||.012,phase:e.phase||0},s}function q(t,n,u){let r=new Float32Array(624),o=new Float32Array(624),c=u.map(a=>new t.Color(a));for(let a=0;a<104;a+=1){let l=a%3,w=l===0?-1:l===1?1:0,g=-3.7-n()*8.7,x=w*(1.5+n()*4.4)+(l===2?(n()-.5)*2.2:0),M=-3+n()*6,P=.55+n()*2.2,A=-.9+n()*1.8,m=a*6;r[m]=x,r[m+1]=M,r[m+2]=g,r[m+3]=x+Math.cos(A)*P,r[m+4]=M+Math.sin(A)*P,r[m+5]=g-n()*.35;let C=c[a%c.length];o[m]=C.r,o[m+1]=C.g,o[m+2]=C.b,o[m+3]=C.r,o[m+4]=C.g,o[m+5]=C.b}let i=new t.BufferGeometry;i.setAttribute("position",new t.BufferAttribute(r,3)),i.setAttribute("color",new t.BufferAttribute(o,3));let s=new t.LineBasicMaterial({name:"krasner_wiry_black_green_pink_hatching",vertexColors:!0,transparent:!0,opacity:.72,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),f=new t.LineSegments(i,s);return f.name="measured-bridge-hatching-between-talent-and-vacancy-knots",f.renderOrder=44,f.frustumCulled=!1,f}function J(t,n){let e=new Float32Array(780),r=new Float32Array(260*3),o=new Float32Array(260),c=[new t.Color("#0d0d0c"),new t.Color("#9f2d4b"),new t.Color("#016f3d"),new t.Color("#c0c0bf"),new t.Color("#bfb091")];for(let a=0;a<260;a+=1){let l=a<187.2,w=a%2===0?-1:1,g=l?w*(1.5+n()*1.4):(n()-.5)*8.8,x=l?(n()-.5)*2.6:(n()-.5)*5.8,M=l?Math.pow(n(),1.8)*2.1:n()*4.4,P=n()*Math.PI*2;e[a*3]=g+Math.cos(P)*M,e[a*3+1]=x+Math.sin(P)*M*.65,e[a*3+2]=-3-n()*8.8;let A=c[a%c.length];r[a*3]=A.r,r[a*3+1]=A.g,r[a*3+2]=A.b,o[a]=.055+n()*.18}let i=new t.BufferGeometry;i.setAttribute("position",new t.BufferAttribute(e,3)),i.setAttribute("color",new t.BufferAttribute(r,3)),i.setAttribute("size",new t.BufferAttribute(o,1));let s=new t.ShaderMaterial({name:"krasner_scraped_pressure_flecks",transparent:!0,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uOpacity:{value:.76},uScale:{value:420},uTime:{value:0}},vertexShader:`
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * 420.0 / max(1.0, -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vColor;
      uniform float uOpacity;
      void main() {
        vec2 p = gl_PointCoord - vec2(0.5);
        float d = max(abs(p.x) * 1.15, abs(p.y) * 0.82);
        float a = 1.0 - smoothstep(0.31, 0.5, d);
        float nick = step(0.18, abs(p.x + p.y * 0.4));
        gl_FragColor = vec4(vColor * (0.86 + nick * 0.18), a * uOpacity);
      }
    `}),f=new t.Points(i,s);return f.name="concentrated-low-pressure-pigment-flecks",f.renderOrder=42,f.frustumCulled=!1,f}function Q({THREE:t,part:n,world:u,seed:e,utilities:r}){let o=V(r,e,`${S}:${O}`),c=new t.Group;c.name="lee-krasner-brussels-non-literal-fracture-pressure",c.scale.set(1.58,1.5,1),c.userData={partId:O,role:"primary-news-signal",packetId:j,packetHash:S,selectedNews:"VDAB and Actiris step up efforts to connect Brussels talent with Rand vacancies",visualTarget:"non-literal fracture pressure",artist:"Lee Krasner"};let i={paper:b(t,"#fefefe",{grain:.055,edgeDarken:.1}),warmGrey:b(t,"#d0cfcf",{grain:.075,edgeDarken:.12}),coolGrey:b(t,"#b0b0b2",{grain:.08,edgeDarken:.14}),mutedGrey:b(t,"#c0c0bf",{grain:.09,edgeDarken:.16}),black:b(t,"#0d0d0c",{grain:.035,edgeDarken:.08}),green:b(t,"#016f3d",{grain:.085,edgeDarken:.16}),pink:b(t,"#9f2d4b",{grain:.09,edgeDarken:.18}),deepPink:b(t,"#9e2243",{grain:.085,edgeDarken:.16}),olive:b(t,"#2f3020",{grain:.07,edgeDarken:.13}),ochre:b(t,"#bfb091",{grain:.1,edgeDarken:.18}),veil:b(t,"#ccc5bf",{opacity:.82,grain:.09,edgeDarken:.12,transparent:!0})},s=[["left-black-petal-pressure-pause",i.black,-4.85,-.55,-5,2,1.12,15,2.35,Math.PI*1.18,.6],["right-black-vacancy-hook",i.black,3.2,.72,-6.3,1.95,.82,16,-.05,Math.PI*1.02,-.32],["central-vertical-black-suture",i.black,.1,.6,-4.15,.42,3.4,9,Math.PI*.18,Math.PI*.72,.04],["brussels-green-talent-wedge-left",i.green,-2.65,-1.24,-4.65,1.22,2.05,12,1.72,Math.PI*.72,.35],["rand-green-vacancy-oval-right",i.green,2.55,-.9,-5.6,1.35,.62,18,-.15,Math.PI*1.75,-.15],["low-pink-pressure-knot-left",i.pink,-1.35,.2,-3.72,1.32,.86,17,2.9,Math.PI*1.55,-.55],["upper-right-pink-displaced-block",i.deepPink,4.15,2.25,-7.2,1.75,1.05,8,.2,Math.PI*.82,.18],["lower-bridge-red-strip",i.deepPink,.65,-2.75,-4.55,2.05,.36,7,0,Math.PI*.92,.08],["left-pale-paper-counterform",i.paper,-4.45,1.15,-6,1.92,.64,16,.25,Math.PI*1.2,-.25],["right-paper-blade-counterform",i.paper,2.8,1.45,-4.85,1.85,.56,14,-.15,Math.PI*1.15,.25],["middle-grey-planar-vacancy-gap",i.coolGrey,.95,-.55,-7.9,2.42,1.15,9,2.75,Math.PI*.78,.42],["far-cream-uneven-field-left",i.warmGrey,-3.1,2.35,-11.6,2.9,1.4,9,1.1,Math.PI*1,-.1],["far-cream-uneven-field-right",i.veil,3.15,-2.05,-10.8,3.25,1.1,11,-.4,Math.PI*1.15,.2],["olive-small-pressure-stop",i.olive,1.25,.15,-3.6,.75,.42,8,.05,Math.PI*1,.6],["ochre-muted-linking-tab",i.ochre,-.55,-1.45,-5.2,.82,.38,7,0,Math.PI*.92,-.2]];for(let d=0;d<s.length;d+=1){let[I,D,v,y,h,p,k,z,_,G,U]=s[d],F=X(o,p*1.3,k*1.3,z,_,G,.28),L=Y(t,D,F,{name:I,position:[v,y,h],rotation:[0,0,U],renderOrder:10+d,pulse:.014+d%4*.006,phase:d*.71});c.add(L)}let f=i.black,a=b(t,"#4c3b2e",{grain:.06,edgeDarken:.08}),l=[["left-unstable-contour-loop-around-brussels-knot",-2.6,.05,-3.35,2.4,1.45,.038,-.15],["right-unstable-contour-loop-around-rand-gap",2.6,0,-4.25,2.9,1.25,.052,.28],["wide-allover-fracture-loop-near-viewer",.2,-.35,-2.85,4.5,2.35,.026,-.05],["far-pale-pressure-orbit",-.6,.95,-8.6,5.35,1.75,.021,.2]];for(let d=0;d<l.length;d+=1){let[I,D,v,y,h,p,k,z]=l[d],_=N(t,o,d===3?a:f,{name:I,position:[D,v,y],rotation:[0,0,z],radiusX:h,radiusY:p,thickness:k*1.3,wobbleA:3+d,wobbleB:4+d,wobbleAmp:.08,noise:.055,phase:d*1.7,pulse:.012+d*.006,renderOrder:35+d});c.add(_)}let w=[["central-slow-agency-suture",-.3,3.45,.08,-3.2,-2.9,-3.6,.09,.25],["left-to-center-employment-bridge-slash",-5.25,-1.7,-.35,-2.25,-3.4,-4.25,.044,.18],["right-vacancy-hook-slash",4.95,1.95,1.65,-2.55,-4.15,-5.65,.05,.3],["upper-thin-pressure-crossing",-4.2,2.65,4.35,.65,-5.9,-7.1,.027,-.14],["lower-restless-eye-path-crossing",-2,-2.85,5.25,-.95,-4.2,-6.9,.035,.12]];for(let d=0;d<w.length;d+=1){let[I,D,v,y,h,p,k,z,_]=w[d];c.add($(t,o,d===0?f:a,{name:I,x0:D,y0:v,x1:y,y1:h,z0:p,z1:k,thickness:z*1.3,bend:_,jitter:.18,phase:d*.9,pulse:.01,renderOrder:46+d}))}let g=q(t,o,["#0d0d0c","#0d0d0c","#016f3d","#9f2d4b","#4c3b2e"]);c.add(g);let x=J(t,o);c.add(x);let M=new t.Group;M.name="part-local-soft-value-lift";let P=new t.DirectionalLight("#fff8ed",1.15);P.position.set(-1.6,3.8,5.2);let A=new t.AmbientLight("#d8d5ca",.62);M.add(P,A),c.add(M);let m=[...Object.values(i),a,g.material,x.material];function C({elapsedSeconds:d=0,captureMode:I=!1,motionIntensity:D=1}={}){let v=I?0:d,y=Math.max(0,Math.min(1.4,D??1));for(let h of c.children){let p=h.userData?.base;if(!p)continue;let k=Math.sin(v*.42+p.phase)*p.pulse*y;h.position.x=p.x+k*.75,h.position.y=p.y+Math.sin(v*.31+p.phase*1.3)*p.pulse*.45*y,h.position.z=p.z+Math.sin(v*.27+p.phase)*p.pulse*.85*y,h.rotation.z=p.rz+k*.28;let z=1+k*.045;h.scale.x=z,h.scale.y=z}g.rotation.z=Math.sin(v*.2)*.006*y,x.rotation.z=Math.sin(v*.18+.5)*.01*y;for(let h of m)h.uniforms?.uTime&&(h.uniforms.uTime.value=v)}return{object:c,update:C,dispose(){K(c)}}}export{Q as createImmersiveWorldPart};
