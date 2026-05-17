var U="art-direction-packet-ee8329216073",W="ee8329216073e1ff73a3dda6a05abb66";function V(e){let t=String(e??"clyfford-still-vienna-fracture-pressure"),c=2166136261;for(let s=0;s<t.length;s+=1)c^=t.charCodeAt(s),c=Math.imul(c,16777619);return c>>>0}function L(e,t,c){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(t,c);let s=(V(t)^V(c))>>>0;return function(){s=s+1831565813>>>0;let n=s;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}}function X(e){return e*e*(3-2*e)}function Y(e){e.traverse?.(t=>{t.geometry&&typeof t.geometry.dispose=="function"&&t.geometry.dispose();let c=Array.isArray(t.material)?t.material:[t.material].filter(Boolean);for(let s of c)if(s){for(let g of["map","alphaMap"])s[g]&&typeof s[g].dispose=="function"&&s[g].dispose();typeof s.dispose=="function"&&s.dispose()}})}function j(e,t=96){let c=new Uint8Array(t*t*4),s=(t-1)*.5,g=t*.44;for(let a=0;a<t;a+=1)for(let r=0;r<t;r+=1){let o=Math.hypot(r-s,a-s),v=X(Math.max(0,Math.min(1,(g-o)/(t*.18)))),u=(a*t+r)*4;c[u]=255,c[u+1]=255,c[u+2]=255,c[u+3]=Math.round(v*255)}let n=new e.DataTexture(c,t,t,e.RGBAFormat);return n.needsUpdate=!0,n.wrapS=e.ClampToEdgeWrapping,n.wrapT=e.ClampToEdgeWrapping,n.minFilter=e.LinearFilter,n.magFilter=e.LinearFilter,n.generateMipmaps=!1,n}function k(e,{color:t,scrape:c="#e6dcc1",opacity:s=1,grain:g=.095,scrapeStrength:n=.24,edgeDarken:a=.1,transparent:r=!1,depthWrite:o=!0}){return new e.ShaderMaterial({name:"still-matte-scraped-impasto-plane",side:e.DoubleSide,transparent:r||s<1,depthWrite:o&&s>.92,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uColor:{value:new e.Color(t)},uScrape:{value:new e.Color(c)},uOpacity:{value:s},uTime:{value:0},uGrain:{value:g},uScrapeStrength:{value:n},uEdgeDarken:{value:a}},vertexShader:`
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
      uniform vec3 uScrape;
      uniform float uOpacity;
      uniform float uTime;
      uniform float uGrain;
      uniform float uScrapeStrength;
      uniform float uEdgeDarken;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
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

      float fbm2(vec2 p) {
        float value = 0.0;
        float amp = 0.54;
        for (int i = 0; i < 5; i++) {
          value += amp * noise2(p);
          p = p * 2.08 + vec2(4.7, 9.2);
          amp *= 0.5;
        }
        return value;
      }

      void main() {
        float broad = fbm2(vUv * vec2(9.0, 5.4) + vec2(1.7, 4.3));
        float dry = fbm2(vUv * vec2(42.0, 31.0) + vec2(7.1, 2.4));
        float grit = noise2(vUv * 180.0 + vec2(11.0, 3.0));
        float vertical = pow(abs(sin((vUv.x * 45.0 + broad * 2.5) * 3.14159265)), 18.0);
        vertical *= smoothstep(0.45, 0.86, fbm2(vec2(vUv.x * 7.0, vUv.y * 30.0)));
        float exposed = clamp(vertical * uScrapeStrength + smoothstep(0.78, 0.96, dry) * 0.08, 0.0, 0.42);
        float edge = 1.0 - min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 2.0;
        vec3 color = mix(uColor, uScrape, exposed);
        color *= 0.91 + broad * uGrain + (grit - 0.5) * uGrain * 0.72;
        color = mix(color, vec3(0.02, 0.018, 0.014), edge * uEdgeDarken);
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
      }
    `})}function C(e,{random:t,rows:c=84,yMin:s=-5,yMax:g=5,left:n,right:a,roughness:r=.18,zRipple:o=.035}){let v=[],u=[],m=[],b=t()*6.28,M=t()*6.28;for(let p=0;p<=c;p+=1){let l=p/c,d=s+(g-s)*l,x=Math.sin(l*Math.PI*3+b)*r,S=Math.sin(l*Math.PI*11+M)*r*.36,P=(t()-.5)*r*.74,I=x+S+P,B=n(l,d)-I*.45,D=a(l,d)+I,F=Math.sin(l*Math.PI*7+M)*o;v.push(B,d,F,D,d,-F),u.push(0,l,1,l)}for(let p=0;p<c;p+=1){let l=p*2,d=l+1,x=l+2,S=l+3;m.push(l,x,d,d,x,S)}let f=new e.BufferGeometry;return f.setAttribute("position",new e.Float32BufferAttribute(v,3)),f.setAttribute("uv",new e.Float32BufferAttribute(u,2)),f.setIndex(m),f.computeVertexNormals(),f.computeBoundingSphere(),f}function Z(e,{random:t,columns:c=96,xMin:s=-7,xMax:g=7,bottom:n,top:a,roughness:r=.16,zRipple:o=.03}){let v=[],u=[],m=[],b=t()*6.28,M=t()*6.28;for(let p=0;p<=c;p+=1){let l=p/c,d=s+(g-s)*l,x=Math.sin(l*Math.PI*2.7+b)*r,S=Math.sin(l*Math.PI*13+M)*r*.44,P=(t()-.5)*r*.82,I=n(l,d)-x*.22-P*.18,B=a(l,d)+x+S+P,D=Math.sin(l*Math.PI*8+b)*o;v.push(d,I,D,d,B,-D),u.push(l,0,l,1)}for(let p=0;p<c;p+=1){let l=p*2,d=l+1,x=l+2,S=l+3;m.push(l,x,d,d,x,S)}let f=new e.BufferGeometry;return f.setAttribute("position",new e.Float32BufferAttribute(v,3)),f.setAttribute("uv",new e.Float32BufferAttribute(u,2)),f.setIndex(m),f.computeVertexNormals(),f.computeBoundingSphere(),f}function K(e,{radius:t=2,width:c=.045,start:s=0,end:g=Math.PI,segments:n=64,wobble:a=.08}){let r=[],o=[],v=[];for(let m=0;m<=n;m+=1){let b=m/n,M=s+(g-s)*b,f=Math.sin(b*Math.PI*5+t)*a+Math.sin(b*Math.PI*13)*a*.22,p=t-c*.5+f,l=t+c*.5+f*.65,d=Math.cos(M)*p,x=Math.sin(M)*p,S=Math.cos(M)*l,P=Math.sin(M)*l;r.push(d,x,0,S,P,0),o.push(b,0,b,1)}for(let m=0;m<n;m+=1){let b=m*2,M=b+1,f=b+2,p=b+3;v.push(b,f,M,M,f,p)}let u=new e.BufferGeometry;return u.setAttribute("position",new e.Float32BufferAttribute(r,3)),u.setAttribute("uv",new e.Float32BufferAttribute(o,2)),u.setIndex(v),u.computeVertexNormals(),u.computeBoundingSphere(),u}function $(e,t,c){let s=[],g=[],n=[],a=0;for(let o of c)for(let v=0;v<o.count;v+=1){let u=o.x[0]+(o.x[1]-o.x[0])*t(),m=o.y[0]+(o.y[1]-o.y[0])*t(),b=o.z+(t()-.5)*.08,M=o.width[0]+(o.width[1]-o.width[0])*t(),f=o.height[0]+(o.height[1]-o.height[0])*t(),p=(t()-.5)*o.tilt,l=Math.cos(p),d=Math.sin(p),x=[[-M*.5,-f*.5,0,0],[M*.5,-f*.5,1,0],[M*.5,f*.5,1,1],[-M*.5,f*.5,0,1]];for(let[S,P,I,B]of x){let D=(t()-.5)*.035;s.push(u+S*l-P*d+D,m+S*d+P*l,b),g.push(I,B)}n.push(a,a+1,a+2,a,a+2,a+3),a+=4}let r=new e.BufferGeometry;return r.setAttribute("position",new e.Float32BufferAttribute(s,3)),r.setAttribute("uv",new e.Float32BufferAttribute(g,2)),r.setIndex(n),r.computeVertexNormals(),r.computeBoundingSphere(),r}function z(e,t,c=.055){let s=[],g=[],n=[],a=0;for(let o=0;o<t.length;o+=1){let v=t[Math.max(0,o-1)],u=t[o],m=t[Math.min(t.length-1,o+1)],b=m[0]-v[0],M=m[1]-v[1],f=Math.max(1e-4,Math.hypot(b,M)),p=-M/f,l=b/f;o>0&&(a+=Math.hypot(u[0]-v[0],u[1]-v[1])),s.push(u[0]+p*c,u[1]+l*c,u[2]||0),s.push(u[0]-p*c,u[1]-l*c,u[2]||0),g.push(a,0,a,1)}for(let o=0;o<t.length-1;o+=1){let v=o*2,u=v+1,m=v+2,b=v+3;n.push(v,m,u,u,m,b)}let r=new e.BufferGeometry;return r.setAttribute("position",new e.Float32BufferAttribute(s,3)),r.setAttribute("uv",new e.Float32BufferAttribute(g,2)),r.setIndex(n),r.computeVertexNormals(),r.computeBoundingSphere(),r}function q(e,t,c){let g=new Float32Array(1290),n=new Float32Array(430*3),a=new Float32Array(430),r=[new e.Color("#e6dcc1"),new e.Color("#c98514"),new e.Color("#5b0717"),new e.Color("#1e6b70"),new e.Color("#111018")];for(let m=0;m<430;m+=1){let b=t(),M,f,p;if(b<.72)M=-1.2+Math.pow(t(),.82)*5.2+(t()-.5)*.75,f=-3.65+(t()-.5)*2.5+Math.sin(t()*Math.PI*2)*.25,p=-4.7-t()*2.6;else if(b<.9)M=1.2+(t()-.5)*2.4,f=-.8+(t()-.5)*3.9,p=-4.2-t()*2.1;else{let x=t()*Math.PI*2,S=2.2+t()*2.5;M=Math.cos(x)*S+1.1,f=Math.sin(x)*S*.58-.6,p=-5.4-t()*1.6}g[m*3]=M,g[m*3+1]=f,g[m*3+2]=p;let l=r[Math.floor(t()*r.length)],d=.58+t()*.44;n[m*3]=l.r*d,n[m*3+1]=l.g*d,n[m*3+2]=l.b*d,a[m]=20+t()*34}let o=new e.BufferGeometry;o.setAttribute("position",new e.BufferAttribute(g,3)),o.setAttribute("color",new e.BufferAttribute(n,3)),o.setAttribute("aSize",new e.BufferAttribute(a,1));let v=new e.ShaderMaterial({name:"still-soft-pigment-crowd-pressure-points",transparent:!0,depthWrite:!1,depthTest:!0,blending:e.NormalBlending,toneMapped:!1,uniforms:{uSprite:{value:c},uOpacity:{value:.72},uTime:{value:0}},vertexShader:`
      attribute float aSize;
      varying vec3 vColor;
      uniform float uTime;
      void main() {
        vColor = color;
        vec3 pos = position;
        pos.x += sin(uTime * 0.18 + position.y * 1.7) * 0.025;
        pos.y += cos(uTime * 0.14 + position.x * 1.2) * 0.018;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (300.0 / max(120.0, -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vColor;
      uniform sampler2D uSprite;
      uniform float uOpacity;
      void main() {
        float alpha = texture2D(uSprite, gl_PointCoord).a;
        if (alpha < 0.03) discard;
        gl_FragColor = vec4(vColor, alpha * uOpacity);
      }
    `,vertexColors:!0}),u=new e.Points(o,v);return u.name="concentrated-low-pressure-pigment-crowd-field",u.renderOrder=42,u.frustumCulled=!1,u}function A(e,t,c,s,g,n,a={}){let r=new t.Mesh(s,g);return r.name=c,r.position.set(n.position[0],n.position[1],n.position[2]),r.rotation.set(n.rotation?.[0]||0,n.rotation?.[1]||0,n.rotation?.[2]||0),r.scale.set(n.scale?.[0]||1,n.scale?.[1]||1,n.scale?.[2]||1),r.renderOrder=n.renderOrder||0,r.frustumCulled=!1,r.castShadow=!1,r.receiveShadow=!1,r.userData={...a,baseX:r.position.x,baseY:r.position.y,baseZ:r.position.z,baseRotationZ:r.rotation.z,baseRotationY:r.rotation.y},e.add(r),r}function J(e,t,c,s,g,n=0){let a=[];for(let r=0;r<=g;r+=1){let o=r/g,v=c+(s-c)*o,u=Math.sin(o*Math.PI*9)*.22+(e()-.5)*.22;a.push([t(o,v)+u,v,n])}return a}function Q({THREE:e,part:t,world:c,seed:s,camera:g,utilities:n}={}){let a=L(n,s||t?.id||"non-literal-fracture-pressure","still-fracture-pressure-vienna"),r=new e.Group;r.name="non-literal-fracture-pressure-clyfford-still-vienna",r.userData={partId:"non-literal-fracture-pressure",role:"primary-news-signal",packetId:U,packetHash:W,newsSignal:"vienna-protest-eurovision-participation-final-pressure",skybox:!1,immersiveWorldEnvironmentShell:!1};let o={black:k(e,{color:"#080909",scrape:"#302a22",grain:.12,scrapeStrength:.17,edgeDarken:.02}),bone:k(e,{color:"#e1d5b7",scrape:"#fff4d0",grain:.13,scrapeStrength:.34,edgeDarken:.18}),ochre:k(e,{color:"#c98514",scrape:"#f1d180",grain:.11,scrapeStrength:.24,edgeDarken:.16}),burgundy:k(e,{color:"#4f0615",scrape:"#8c3119",grain:.11,scrapeStrength:.18,edgeDarken:.1}),teal:k(e,{color:"#1b686f",scrape:"#6db5ad",grain:.1,scrapeStrength:.2,edgeDarken:.12}),ash:k(e,{color:"#b8ad9b",scrape:"#e6dcc1",opacity:.78,grain:.1,scrapeStrength:.24,edgeDarken:.14,transparent:!0,depthWrite:!1}),faintBone:k(e,{color:"#e6dcc1",scrape:"#fff2cd",opacity:.62,grain:.16,scrapeStrength:.4,edgeDarken:.2,transparent:!0,depthWrite:!1}),faintBlack:k(e,{color:"#090909",scrape:"#1b1713",opacity:.5,grain:.08,scrapeStrength:.14,edgeDarken:.04,transparent:!0,depthWrite:!1})},v=(i,h)=>-1.15+Math.sin(i*Math.PI*2+.4)*.7+Math.sin(i*Math.PI*7)*.28+h*-.06;A(r,e,"heavy-left-charred-pressure-slab",C(e,{random:a,yMin:-5.4,yMax:5.8,left:(i,h)=>-8.9+Math.sin(i*6)*.12,right:v,roughness:.36,zRipple:.045}),o.black,{position:[.1,.15,-6.4],rotation:[0,-.08,.012],scale:[1.08,1.04,1],renderOrder:12},{pressureRole:"dominant-black-field-bearing-down"}),A(r,e,"exposed-bone-torn-fissure-field",C(e,{random:a,yMin:-5.15,yMax:4.3,left:(i,h)=>-1.52+Math.sin(i*Math.PI*4.1+1.2)*.34+h*.05,right:(i,h)=>2.68+Math.sin(i*Math.PI*3.3)*.38-h*.08,roughness:.42,zRipple:.04}),o.bone,{position:[.15,-.26,-5.72],rotation:[0,.045,-.025],scale:[1.05,1.09,1],renderOrder:20},{pressureRole:"exposed-light-rupture-between-masses"}),A(r,e,"mustard-finale-flare-slab",C(e,{random:a,yMin:-5.25,yMax:5.35,left:(i,h)=>2.2+Math.sin(i*Math.PI*5.4)*.22+h*.025,right:(i,h)=>4.55+Math.sin(i*Math.PI*3.1+.6)*.36-h*.045,roughness:.3,zRipple:.035}),o.ochre,{position:[.28,.52,-5.38],rotation:[0,.05,-.015],scale:[1.03,1.05,1],renderOrder:24},{pressureRole:"restrained-finale-pressure-flare"}),A(r,e,"low-burgundy-protest-pressure-mass",Z(e,{random:a,xMin:-7.9,xMax:7.7,bottom:()=>-5.9,top:(i,h)=>-3.18+Math.sin(i*Math.PI*3.2+.5)*.46+Math.sin(i*Math.PI*10)*.13+h*.035,roughness:.3,zRipple:.04}),o.burgundy,{position:[0,-.1,-5.2],rotation:[0,.02,.018],scale:[1.08,1.07,1],renderOrder:18},{pressureRole:"concentrated-low-spread-protest-mass"}),A(r,e,"cool-teal-counterpoint-fissure",C(e,{random:a,rows:58,yMin:-4.6,yMax:.9,left:(i,h)=>.45+Math.sin(i*18)*.1+h*.03,right:(i,h)=>1.22+Math.sin(i*12+.8)*.14+h*-.02,roughness:.18,zRipple:.02}),o.teal,{position:[.18,-.05,-4.86],rotation:[0,-.03,.035],scale:[1.12,1.18,1],renderOrder:30},{pressureRole:"cool-mineral-fissure-accent"}),A(r,e,"ash-gray-scraped-support-plane",C(e,{random:a,rows:66,yMin:-4.8,yMax:4.9,left:(i,h)=>4.55+Math.sin(i*10)*.2,right:(i,h)=>7.65+Math.sin(i*8+1.4)*.26-h*.02,roughness:.28,zRipple:.035}),o.ash,{position:[-.05,.12,-6],rotation:[0,.11,.018],scale:[1,1.06,1],renderOrder:16},{pressureRole:"right-weighted-muted-scraped-support"});let b=J(a,v,-5.1,5.35,72,0);A(r,e,"cream-ragged-border-where-field-breaks",z(e,b,.085),o.faintBone,{position:[.22,.18,-4.58],rotation:[0,-.04,.01],scale:[1.09,1.06,1],renderOrder:38},{pressureRole:"readable-torn-border-eye-path"});let M=[];for(let i=0;i<=56;i+=1){let h=i/56,w=-4.3+8.4*h,y=2.24+Math.sin(h*Math.PI*5.2)*.28-w*.035;M.push([y,w,0])}A(r,e,"black-scar-inside-ochre-final-pressure",z(e,M,.095),o.faintBlack,{position:[.35,.38,-4.42],rotation:[0,.02,-.01],scale:[1,1,1],renderOrder:40},{pressureRole:"small-dark-rupture-through-final-flare"});let f=$(e,a,[{count:82,x:[-7.4,-1.2],y:[-4.8,5.1],z:-4.35,width:[.025,.12],height:[.35,1.65],tilt:.28},{count:78,x:[-1.4,4.7],y:[-4.4,4.5],z:-4.22,width:[.025,.15],height:[.25,1.25],tilt:.34},{count:36,x:[4.5,7.3],y:[-3.6,4.6],z:-4.55,width:[.02,.1],height:[.3,1.4],tilt:.22}]);A(r,e,"dry-vertical-scrape-hatching-across-pressure-fields",f,o.faintBone,{position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],renderOrder:44},{pressureRole:"matte-canvas-scrape-density"});let p=k(e,{color:"#d69a16",scrape:"#f1d180",opacity:.64,grain:.13,scrapeStrength:.25,edgeDarken:.2,transparent:!0,depthWrite:!1}),l=k(e,{color:"#180d0d",scrape:"#5b0717",opacity:.52,grain:.08,scrapeStrength:.12,edgeDarken:.08,transparent:!0,depthWrite:!1}),d=new e.Group;d.name="restrained-finale-pressure-radial-cue",d.position.set(1.35,-.62,-4.18),d.rotation.set(0,.02,-.08),d.renderOrder=48,d.userData={pressureRole:"finale-trend-cue-inside-protest-event"};let x=[{radius:1.25,width:.075,start:-.18*Math.PI,end:1.06*Math.PI,material:p},{radius:1.88,width:.06,start:.18*Math.PI,end:1.42*Math.PI,material:l},{radius:2.52,width:.055,start:-.48*Math.PI,end:.62*Math.PI,material:p}];for(let i=0;i<x.length;i+=1){let h=x[i],w=new e.Mesh(K(e,h),h.material);w.name=`partial-pressure-ring-${i+1}`,w.frustumCulled=!1,w.castShadow=!1,w.receiveShadow=!1,w.renderOrder=48+i,d.add(w)}r.add(d);let S=k(e,{color:"#e6dcc1",scrape:"#fff1c9",opacity:.54,grain:.11,scrapeStrength:.2,edgeDarken:.18,transparent:!0,depthWrite:!1});for(let i=0;i<7;i+=1){let h=-.7+i*.42+(a()-.5)*.1,w=1.85+a()*1,y=.35+a()*.2,O=[Math.cos(h)*y,Math.sin(h)*y,.02],_=[Math.cos(h)*w,Math.sin(h)*w,.02],G=new e.Mesh(z(e,[O,_],.035+a()*.025),S);G.name=`muted-finale-pressure-spoke-${i+1}`,G.frustumCulled=!1,G.renderOrder=52,d.add(G)}let P=j(e,96),I=q(e,a,P);r.add(I);let B=k(e,{color:"#0b0b0a",scrape:"#2a1614",opacity:.28,grain:.06,scrapeStrength:.08,edgeDarken:.03,transparent:!0,depthWrite:!1});A(r,e,"close-charcoal-pressure-veil-not-a-shell",C(e,{random:a,rows:34,yMin:-4.4,yMax:4.2,left:()=>-5.3,right:(i,h)=>-3.7+Math.sin(i*8)*.22,roughness:.18,zRipple:.02}),B,{position:[0,0,-2.35],rotation:[0,-.18,.025],scale:[1.02,1,1],renderOrder:8},{pressureRole:"near-viewer-compression-veil-non-enclosing"});let D=[o.black,o.bone,o.ochre,o.burgundy,o.teal,o.ash,o.faintBone,o.faintBlack,p,l,S,B,I.material];function F(i={}){let h=i.captureMode?0:Number(i.elapsedSeconds??i.time??0),w=Number.isFinite(h)?h:0;for(let y of D)y?.uniforms?.uTime&&(y.uniforms.uTime.value=w);r.traverse(y=>{if(!y.userData||y.userData.baseX==null)return;let O=y.userData.pressureRole==="restrained-finale-pressure-flare"?.016:.01;y.position.x=y.userData.baseX+Math.sin(w*.07+y.userData.baseY)*O,y.position.y=y.userData.baseY+Math.cos(w*.055+y.userData.baseX)*O*.7,y.rotation.z=y.userData.baseRotationZ+Math.sin(w*.045+y.userData.baseZ)*.003,y.rotation.y=y.userData.baseRotationY+Math.sin(w*.035+y.userData.baseX)*.0025}),d.rotation.z=-.08+Math.sin(w*.05)*.006}function N(){Y(r),P.dispose()}return F({captureMode:!0,elapsedSeconds:0,camera:g}),{object:r,update:F,dispose:N,userData:{partId:"non-literal-fracture-pressure",moduleId:"non-literal-fracture-pressure-clyfford-still-vienna",packetId:U,packetHash:W}}}export{Q as createImmersiveWorldPart};
