var B="art-direction-packet-3627abb3e097",I="3627abb3e097cc1099a7eaeab0983d80",A="artist-mark-field";function _(t){let r=String(t??"lee-krasner-brussels-artist-mark-field"),s=2166136261;for(let e=0;e<r.length;e+=1)s^=r.charCodeAt(e),s=Math.imul(s,16777619);return s>>>0}function O(t,r,s){if(t&&typeof t.createSeededRandom=="function")return t.createSeededRandom(r,s);let e=(_(r)^_(s))>>>0;return function(){e=e+1831565813>>>0;let n=e;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}}function U(t){t.traverse(r=>{r.geometry&&typeof r.geometry.dispose=="function"&&r.geometry.dispose();let s=Array.isArray(r.material)?r.material:[r.material].filter(Boolean);for(let e of s)e&&typeof e.dispose=="function"&&e.dispose()})}function S(t,r){return t.castShadow=!1,t.receiveShadow=!1,t.frustumCulled=!1,t.renderOrder=r,t}function w(t,r,s={}){let e=s.opacity??1,o=s.transparent??e<.99,n=s.depthWrite??e>.96,c=s.grain??.075,a=s.scrape??.055,i=s.edgeDarken??.14;return new t.ShaderMaterial({name:s.name||"krasner_matte_cut_paper_paint",side:s.side||t.DoubleSide,transparent:o,depthWrite:n,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uColor:{value:new t.Color(r)},uOpacity:{value:e},uGrain:{value:c},uScrape:{value:a},uEdgeDarken:{value:i},uTime:{value:0}},vertexShader:`
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
      uniform float uScrape;
      uniform float uEdgeDarken;
      uniform float uTime;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 34.45);
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
        float broad = noise2(vUv * 8.0 + vec2(3.2, 7.1));
        float paper = noise2(vUv * 33.0 + vec2(8.1, 1.7));
        float fleck = noise2(vUv * 114.0 + vec2(0.4, 6.3));
        float diagonalScrape = smoothstep(0.82, 1.0, abs(sin((vUv.x * 0.82 + vUv.y * 0.34) * 72.0)));
        float verticalDrag = smoothstep(0.73, 1.0, abs(sin((vUv.x + paper * 0.08) * 44.0)));
        float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float wornEdge = 1.0 - smoothstep(0.0, 0.12, edge);
        float pigment = 0.92 + (broad - 0.5) * uGrain + (fleck - 0.5) * uGrain * 1.15;
        pigment -= diagonalScrape * uScrape;
        pigment -= verticalDrag * uScrape * 0.38;
        pigment -= wornEdge * uEdgeDarken * (0.45 + fleck * 0.55);
        vec3 color = max(uColor * pigment, vec3(0.0));
        gl_FragColor = vec4(color, uOpacity);
      }
    `})}function F(t,r){let s=1/0,e=1/0,o=-1/0,n=-1/0;for(let u of r)s=Math.min(s,u[0]),o=Math.max(o,u[0]),e=Math.min(e,u[1]),n=Math.max(n,u[1]);let c=Math.max(.001,o-s),a=Math.max(.001,n-e),i=[],p=[];for(let u=1;u<r.length-1;u+=1){let m=[r[0],r[u],r[u+1]];for(let h of m)i.push(h[0],h[1],0),p.push((h[0]-s)/c,(h[1]-e)/a)}let l=new t.BufferGeometry;return l.setAttribute("position",new t.Float32BufferAttribute(i,3)),l.setAttribute("uv",new t.Float32BufferAttribute(p,2)),l.computeVertexNormals(),l.computeBoundingSphere(),l}function L(t,r,s,e,o=0){let n=r*.5,c=s*.5,a=[],i=Math.max(2,Math.floor(e/4));for(let p=0;p<4;p+=1)for(let l=0;l<i;l+=1){let u=l/i,m=0,h=0;p===0?(m=-n+u*r,h=c):p===1?(m=n,h=c-u*s):p===2?(m=n-u*r,h=-c):(m=-n,h=-c+u*s),m+=h*o+(t()-.5)*r*.09,h+=(t()-.5)*s*.12,a.push([m,h])}return a}function W(t,r,s,e,o,n,c=.12){let a=[[Math.cos(o)*r*c,Math.sin(o)*s*c]];for(let i=0;i<=e;i+=1){let p=i/e,l=o+n*p,u=1+(t()-.5)*.24+Math.sin(p*Math.PI*3)*.08;a.push([Math.cos(l)*r*u,Math.sin(l)*s*u])}return a}function G(t,r,s,e){let o=new t.Mesh(F(t,s),r);return o.name=e.name,o.position.set(e.position[0],e.position[1],e.position[2]),o.rotation.set(e.rotation?.[0]||0,e.rotation?.[1]||0,e.rotation?.[2]||0),o.scale.set(e.scale?.[0]||1,e.scale?.[1]||1,e.scale?.[2]||1),S(o,e.renderOrder||0),o.userData.base={x:o.position.x,y:o.position.y,z:o.position.z,rx:o.rotation.x,ry:o.rotation.y,rz:o.rotation.z,sx:o.scale.x,sy:o.scale.y,sz:o.scale.z,phase:e.phase||0,pulse:e.pulse||.012,depthPulse:e.depthPulse||.01},o}function j(t,r,s,e){let o=[],n=e.count||112;for(let p=0;p<n;p+=1){let l=p/n,u=Math.PI*2*l,m=1+Math.sin(u*e.freqA+e.phase)*e.wobble,h=(r()-.5)*e.noise;o.push(new t.Vector3(Math.cos(u)*e.radiusX*(m+h),Math.sin(u)*e.radiusY*(1+Math.cos(u*e.freqB+e.phase)*e.wobble*.72),(r()-.5)*.035))}let c=new t.CatmullRomCurve3(o,!0,"catmullrom",.42),a=new t.TubeGeometry(c,n,e.thickness,6,!0),i=new t.Mesh(a,s);return i.name=e.name,i.position.set(e.position[0],e.position[1],e.position[2]),i.rotation.set(e.rotation?.[0]||0,e.rotation?.[1]||0,e.rotation?.[2]||0),i.scale.set(e.scale?.[0]||1,e.scale?.[1]||1,e.scale?.[2]||1),S(i,e.renderOrder||40),i.userData.base={x:i.position.x,y:i.position.y,z:i.position.z,rx:i.rotation.x,ry:i.rotation.y,rz:i.rotation.z,sx:i.scale.x,sy:i.scale.y,sz:i.scale.z,phase:e.phase||0,pulse:e.pulse||.012,depthPulse:e.depthPulse||.006},i}function V(t,r,s,e){let o=[],n=e.count||24;for(let p=0;p<n;p+=1){let l=p/(n-1),u=Math.sin(l*Math.PI)*e.bend,m=Math.sin(l*Math.PI*6+e.phase)*e.jitter*.22;o.push(new t.Vector3(e.from[0]+(e.to[0]-e.from[0])*l+u+(r()-.5)*e.jitter,e.from[1]+(e.to[1]-e.from[1])*l+m+(r()-.5)*e.jitter,e.from[2]+(e.to[2]-e.from[2])*l))}let c=new t.CatmullRomCurve3(o,!1,"catmullrom",.38),a=new t.TubeGeometry(c,n*3,e.thickness,6,!1),i=new t.Mesh(a,s);return i.name=e.name,S(i,e.renderOrder||44),i.userData.base={x:0,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1,phase:e.phase||0,pulse:e.pulse||.008,depthPulse:e.depthPulse||.004},i}function N(t,r){let e=new Float32Array(948),o=new Float32Array(316*3),n=[new t.Color("#0d0d0c"),new t.Color("#0d0d0c"),new t.Color("#4c3b2e"),new t.Color("#016f3d"),new t.Color("#9f2d4b"),new t.Color("#c0c0bf")];for(let p=0;p<158;p+=1){let l=p%4,u=l===0?-1:l===1?1:0,m=u===0?(r()-.5)*9:u*(2.2+r()*4.4),h=(r()-.5)*5.8+(l===3?.8:0),C=-2.7-r()*10.8,x=.65+r()*2.9,f=-1.25+r()*2.55,y=(r()-.5)*.34,g=p*6;e[g]=m,e[g+1]=h,e[g+2]=C,e[g+3]=m+Math.cos(f)*x,e[g+4]=h+Math.sin(f)*x+y,e[g+5]=C-r()*.45;let v=n[p%n.length];o[g]=v.r,o[g+1]=v.g,o[g+2]=v.b,o[g+3]=v.r,o[g+4]=v.g,o[g+5]=v.b}let c=new t.BufferGeometry;c.setAttribute("position",new t.BufferAttribute(e,3)),c.setAttribute("color",new t.BufferAttribute(o,3));let a=new t.LineBasicMaterial({name:"krasner_wiry_contour_hatching_for_mark_field",vertexColors:!0,transparent:!0,opacity:.68,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),i=new t.LineSegments(c,a);return i.name="all-over-wiry-contour-hatching-between-brussels-and-rand",S(i,62),i.userData.baseSpin=r()*Math.PI*2,i}function X(t,r){let e=new Float32Array(1260),o=new Float32Array(420*3),n=new Float32Array(420),c=[new t.Color("#0d0d0c"),new t.Color("#9f2d4b"),new t.Color("#9e2243"),new t.Color("#016f3d"),new t.Color("#bfb091"),new t.Color("#d0cfcf")];for(let l=0;l<420;l+=1){let u=l<270,m=l%2===0?-1:1,h=u?m*(2.4+r()*1.6):(r()-.5)*11,C=u?(r()-.5)*2.2:(r()-.5)*6.4,x=u?Math.pow(r(),1.65)*2.4:r()*5.6,f=r()*Math.PI*2;e[l*3]=h+Math.cos(f)*x,e[l*3+1]=C+Math.sin(f)*x*.72,e[l*3+2]=-2.4-r()*13;let y=c[l%c.length];o[l*3]=y.r,o[l*3+1]=y.g,o[l*3+2]=y.b,n[l]=.08+r()*.24}let a=new t.BufferGeometry;a.setAttribute("position",new t.BufferAttribute(e,3)),a.setAttribute("color",new t.BufferAttribute(o,3)),a.setAttribute("size",new t.BufferAttribute(n,1));let i=new t.ShaderMaterial({name:"krasner_scraped_pigment_scale_marks",transparent:!0,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uOpacity:{value:.72},uTime:{value:0}},vertexShader:`
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vSeed;
      void main() {
        vColor = color;
        vSeed = size;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * 520.0 / max(1.0, -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vColor;
      varying float vSeed;
      uniform float uOpacity;
      void main() {
        vec2 p = gl_PointCoord - vec2(0.5);
        float blade = max(abs(p.x) * 1.25, abs(p.y + p.x * 0.25) * 0.84);
        float alpha = 1.0 - smoothstep(0.31, 0.5, blade);
        float chip = step(0.12, abs(p.x * 0.7 - p.y * 0.4 + vSeed));
        gl_FragColor = vec4(vColor * (0.78 + chip * 0.22), alpha * uOpacity);
      }
    `}),p=new t.Points(a,i);return p.name="dense-scraped-pigment-fleck-field",S(p,58),p}function Y({THREE:t,part:r,world:s,seed:e,utilities:o}){let n=O(o,e,`${I}:${A}`),c=new t.Group;c.name="lee-krasner-brussels-artist-mark-field",c.scale.set(1.22,1.18,1),c.userData={partId:A,role:r?.role||"artist-style-system",packetId:B,packetHash:I,selectedNews:"VDAB and Actiris connect Brussels talent with Rand vacancies",artist:"Lee Krasner",visualTarget:"all-over artist mark field carrying non-literal fracture pressure"};let a={paper:w(t,"#fefefe",{grain:.052,scrape:.045,edgeDarken:.11}),warmGrey:w(t,"#d0cfcf",{grain:.07,scrape:.05,edgeDarken:.12}),coolGrey:w(t,"#b0b0b2",{grain:.08,scrape:.06,edgeDarken:.13}),lightGrey:w(t,"#c0c0bf",{grain:.075,scrape:.055,edgeDarken:.13}),mutedPaper:w(t,"#ccc5bf",{opacity:.82,transparent:!0,depthWrite:!1,grain:.09,scrape:.07,edgeDarken:.12}),black:w(t,"#0d0d0c",{grain:.035,scrape:.034,edgeDarken:.08}),green:w(t,"#016f3d",{grain:.085,scrape:.07,edgeDarken:.18}),deepGreen:w(t,"#2f3020",{grain:.055,scrape:.045,edgeDarken:.1}),pink:w(t,"#9f2d4b",{grain:.085,scrape:.072,edgeDarken:.17}),redPink:w(t,"#9e2243",{grain:.08,scrape:.066,edgeDarken:.16}),ochre:w(t,"#bfb091",{grain:.09,scrape:.07,edgeDarken:.14}),brown:w(t,"#4c3b2e",{grain:.055,scrape:.04,edgeDarken:.09})},i=[["left-pale-paper-employment-field",a.mutedPaper,[-5.7,1.72,-11.4],[.02,.26,-.08],[1.55,1.16,1],4.5,2.4,-.08],["right-grey-rand-vacancy-wall",a.warmGrey,[4.9,-1.85,-12],[.01,-.22,.12],[1.42,1.05,1],4.7,2.05,.1],["upper-light-grey-unstable-counterfield",a.coolGrey,[1.2,2.72,-10.1],[.03,-.06,.24],[1.18,.86,1],4.1,1.35,-.02],["low-paper-route-strip",a.paper,[-.6,-2.8,-8.6],[.02,.03,-.16],[1.38,.68,1],5.4,.88,0]];for(let f=0;f<i.length;f+=1){let[y,g,v,k,b,d,M,P]=i[f];c.add(G(t,g,L(n,d,M,18,P),{name:y,position:v,rotation:k,scale:b,renderOrder:8+f,phase:f*.62,pulse:.012,depthPulse:.012}))}let p=[["left-heavy-black-petal-mark",a.black,[-5.35,-.35,-5.2],[.02,.18,-.32],[1.18,1.08,1],1.35,2.45,16,2.25,Math.PI*1.06],["right-black-hook-mark",a.black,[4.2,.65,-5.8],[0,-.24,.22],[1.08,1,1],1.75,.92,16,-.1,Math.PI*1.28],["near-left-black-grounding-blade",a.black,[-6.1,-2.1,-3.8],[.02,.12,-.18],[1.08,.92,1],1.75,.76,12,3,Math.PI*.85],["central-thin-black-vertical-suture",a.black,[0,.4,-3.4],[0,.01,.03],[1,1,1],.3,3.15,8,1.6,Math.PI*.82],["brussels-green-talented-knot-wedge",a.green,[-2.95,-1.05,-4.25],[.02,.04,.28],[1.04,1.08,1],1.2,2.15,14,1.76,Math.PI*.76],["rand-green-vacancy-oval-pressure",a.green,[3.05,-.92,-4.95],[.02,-.12,-.12],[1.14,1,1],1.52,.74,18,-.3,Math.PI*1.74],["left-pink-contour-soft-lobe",a.pink,[-1.78,.22,-4],[.02,.08,-.56],[1.08,1,1],1.44,.92,18,2.7,Math.PI*1.5],["upper-right-pink-paper-block",a.redPink,[4.65,2.25,-7],[.02,-.18,.2],[1.2,.92,1],1.92,1.06,9,.15,Math.PI*.88],["low-red-pink-bridge-strip",a.redPink,[.6,-2.72,-4.15],[0,.02,.04],[1.35,.72,1],2.2,.42,8,-.12,Math.PI*.96],["left-white-cut-counterform",a.paper,[-4,1.06,-4.95],[.02,.12,-.22],[1.2,.82,1],2.02,.66,16,.2,Math.PI*1.18],["right-white-blade-counterform",a.paper,[2.75,1.34,-4.3],[0,-.08,.2],[1.22,.72,1],1.92,.56,14,-.15,Math.PI*1.14],["central-grey-unresolved-depth-plane",a.lightGrey,[.65,-.56,-6.85],[.03,-.08,.34],[1.16,.88,1],2.45,1.12,10,2.75,Math.PI*.78],["olive-small-pressure-stop",a.deepGreen,[1.35,.18,-3.2],[0,.04,.58],[1,1,1],.78,.44,9,0,Math.PI*1],["ochre-muted-linking-tab",a.ochre,[-.72,-1.36,-4.75],[0,.02,-.18],[1,.82,1],.92,.42,8,0,Math.PI*.95]];for(let f=0;f<p.length;f+=1){let[y,g,v,k,b,d,M,P,z,D]=p[f];c.add(G(t,g,W(n,d*1.3,M*1.3,P,z,D),{name:y,position:v,rotation:k,scale:b,renderOrder:18+f,phase:f*.73,pulse:.01+f%5*.003,depthPulse:.008}))}let l=[["left-black-loop-around-brussels-talent-knot",a.black,[-2.85,.1,-3.15],[.02,.06,-.12],[1,1,1],2.35,1.34,.052,3,4],["right-black-loop-around-rand-vacancy-gap",a.black,[2.7,.03,-3.75],[.02,-.08,.26],[1,1,1],2.85,1.22,.055,4,5],["wide-front-all-over-contour-orbit",a.black,[.05,-.35,-2.55],[.01,0,-.05],[1,1,1],4.95,2.35,.032,5,3],["far-brown-labour-route-loop",a.brown,[-.8,.9,-8.1],[.02,0,.18],[1,1,1],5.4,1.72,.026,3,6],["upper-thin-black-restless-eye-path",a.black,[-.15,1.95,-5.9],[.02,0,.32],[1,.68,1],5.9,1.15,.022,6,4],["low-green-brown-route-loop",a.brown,[.35,-1.92,-5.3],[.02,0,-.18],[1,.74,1],4.75,1.08,.022,4,3]];for(let f=0;f<l.length;f+=1){let[y,g,v,k,b,d,M,P,z,D]=l[f];c.add(j(t,n,g,{name:y,position:v,rotation:k,scale:b,radiusX:d,radiusY:M,thickness:P*1.3,freqA:z,freqB:D,wobble:.075,noise:.05,phase:f*1.15,renderOrder:42+f,pulse:.009+f*.002,depthPulse:.006}))}let u=[["central-agency-suture-heavy-line",a.black,[-.36,3.25,-2.7],[.06,-3.25,-3.35],.082,.14],["left-to-right-thin-employment-link",a.brown,[-5.7,.92,-3.5],[5.2,-.52,-6],.034,.28],["upper-crossing-wiry-pressure-line",a.black,[-5,2.75,-4.2],[4.9,1.15,-7.2],.028,-.18],["low-crossing-route-line",a.black,[-4.8,-2.25,-3.35],[5.45,-1.18,-7.4],.035,.16],["right-hook-descending-vacancy-line",a.brown,[5.4,2.1,-3.6],[2.85,-2.8,-5.8],.044,.28],["left-blade-rising-talent-line",a.brown,[-5.6,-2.55,-3.7],[-2.1,2.72,-5.9],.04,-.22],["thin-distant-grid-pulse-scar",a.black,[-6.6,.12,-9.6],[6.6,.48,-10.3],.02,.12]];for(let f=0;f<u.length;f+=1){let[y,g,v,k,b,d]=u[f];c.add(V(t,n,g,{name:y,from:v,to:k,thickness:b*1.3,bend:d,jitter:.13,phase:f*.84,renderOrder:50+f,pulse:.007+f*.001,depthPulse:.004}))}let m=N(t,n),h=X(t,n);c.add(m),c.add(h);let C=[...Object.values(a),m.material,h.material];function x({elapsedSeconds:f=0,captureMode:y=!1,motionIntensity:g=1}={}){let v=y?0:Number(f)||0,k=Math.max(0,Math.min(1.4,Number(g??1)));for(let b of c.children){let d=b.userData?.base;if(!d)continue;let M=Math.sin(v*.36+d.phase)*d.pulse*k,P=Math.sin(v*.18+d.phase*.7)*k;b.position.x=d.x+M*.95,b.position.y=d.y+Math.cos(v*.29+d.phase)*d.pulse*.55*k,b.position.z=d.z+P*d.depthPulse,b.rotation.x=d.rx+M*.05,b.rotation.y=d.ry+M*.06,b.rotation.z=d.rz+M*.26,b.scale.set(d.sx*(1+M*.045),d.sy*(1+Math.cos(v*.31+d.phase)*d.pulse*.026*k),d.sz)}m.rotation.z=Math.sin(v*.17+m.userData.baseSpin)*.007*k,h.rotation.z=Math.sin(v*.19+.4)*.012*k;for(let b of C)b.uniforms?.uTime&&(b.uniforms.uTime.value=v)}return x({captureMode:!0,elapsedSeconds:0}),{object:c,update:x,dispose(){U(c)}}}export{Y as createImmersiveWorldPart};
