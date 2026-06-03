var j="art-direction-packet-cb8fd8bab6d4",W="cb8fd8bab6d49b41c317911479a092cb";function O(e){let o=String(e??"artist-mark-field-emily-mason-wallonie"),n=2166136261;for(let i=0;i<o.length;i+=1)n^=o.charCodeAt(i),n=Math.imul(n,16777619);return n>>>0}function D(e,o,n){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(o,n);let i=(O(o)^O(n))>>>0;return function(){i=i+1831565813>>>0;let t=i;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function U(e){return Math.max(0,Math.min(1,e))}function I(e,o){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=o,e}function Y(e,o){return new e.ShaderMaterial({name:o.name,transparent:!0,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uColorA:{value:new e.Color(o.colorA)},uColorB:{value:new e.Color(o.colorB)},uAccent:{value:new e.Color(o.accent)},uOpacity:{value:o.opacity},uSeed:{value:o.seed},uFlow:{value:o.flow},uHardness:{value:o.hardness??.55},uBloom:{value:o.bloom??.45}},vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;

      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uAccent;
      uniform float uOpacity;
      uniform float uSeed;
      uniform float uFlow;
      uniform float uHardness;
      uniform float uBloom;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.52;
        for (int i = 0; i < 5; i += 1) {
          value += noise(p) * amp;
          p = p * 2.03 + vec2(7.7, 3.1);
          amp *= 0.52;
        }
        return value;
      }

      void main() {
        vec2 centered = vUv * 2.0 - 1.0;
        vec2 flow = normalize(vec2(cos(uFlow), sin(uFlow)));
        float along = dot(centered, flow);
        float cross = dot(centered, vec2(-flow.y, flow.x));
        float t = uTime * 0.012;
        vec2 warped = vec2(along * 1.22, cross * 1.78);
        float wash = fbm(warped * 2.0 + vec2(uSeed * 4.1, t));
        float bloom = fbm(warped * 4.2 + vec2(uSeed * 9.2 + t, -uSeed));
        float tooth = fbm(vUv * 36.0 + vec2(uSeed, 3.2));
        float field = smoothstep(0.1, 0.94, wash * 0.8 + bloom * 0.38);
        vec3 color = mix(uColorA, uColorB, field);
        float accent = smoothstep(0.62, 0.96, bloom + tooth * 0.24);
        color = mix(color, uAccent, accent * uBloom);
        color *= 0.82 + tooth * 0.33;

        float featherX = smoothstep(0.0, 0.15, vUv.x) * smoothstep(0.0, 0.15, 1.0 - vUv.x);
        float featherY = smoothstep(0.0, 0.17, vUv.y) * smoothstep(0.0, 0.17, 1.0 - vUv.y);
        float pressureBand = 1.0 - smoothstep(uHardness, uHardness + 0.42, abs(cross + (wash - 0.5) * 0.42));
        float ragged = 0.54 + wash * 0.58 + tooth * 0.18;
        float alpha = uOpacity * featherX * featherY * ragged * mix(0.5, 1.0, pressureBand);
        alpha *= smoothstep(0.05, 0.34, field + pressureBand * 0.32);
        if (alpha < 0.016) discard;
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), alpha);
      }
    `})}function F(e,o,n,i){let s=new e.PlaneGeometry(i.width,i.height,1,1),t=Y(e,i),a=new e.Mesh(s,t);return a.name=i.name,a.position.set(i.position[0],i.position[1],i.position[2]),a.rotation.set(i.rotation[0],i.rotation[1],i.rotation[2]),I(a,i.renderOrder??1),o.add(a),n.geometries.push(s),n.materials.push(t),n.animated.push({mesh:a,material:t,baseX:a.position.x,baseY:a.position.y,baseZ:a.position.z,baseRot:a.rotation.z,phase:i.seed,drift:i.drift??.05}),a}function M(e,o,n,i,s,t,a){let m=[],b=[],p=[],c=new e.Color(i);for(let f=0;f<o.length;f+=1){let g=o[Math.max(0,f-1)],r=o[f],h=o[Math.min(o.length-1,f+1)],l=h[0]-g[0],v=h[1]-g[1],A=Math.max(1e-4,Math.sqrt(l*l+v*v)),y=.42+.58*Math.sin(f/Math.max(1,o.length-1)*Math.PI),C=.82+.18*Math.sin(f*2.13),S=-v/A*n*y*C,k=l/A*n*y*C;m.push(r[0]+S,r[1]+k,r[2]),m.push(r[0]-S,r[1]-k,r[2]);let B=.72+.28*Math.sin(f*.9+n*31);if(p.push(c.r*B,c.g*B,c.b*B),p.push(c.r*(B+.12),c.g*(B+.12),c.b*(B+.12)),f<o.length-1){let P=f*2;b.push(P,P+1,P+2,P+1,P+3,P+2)}}let d=new e.BufferGeometry;d.setAttribute("position",new e.Float32BufferAttribute(m,3)),d.setAttribute("color",new e.Float32BufferAttribute(p,3)),d.setIndex(b),d.computeBoundingSphere();let u=new e.MeshBasicMaterial({name:`${t}-material`,vertexColors:!0,transparent:!0,opacity:s,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1}),w=new e.Mesh(d,u);return w.name=t,I(w,a),{object:w,geometry:d,material:u}}function G(e,o,n,i,s,t,a,m,b,p){let c=[];for(let d=0;d<m;d+=1){let u=d/Math.max(1,m-1),w=t+(a-t)*u,f=(p()-.5)*b+Math.sin(u*Math.PI*4)*b*.12;c.push([e+Math.cos(w)*(i+f),o+Math.sin(w)*(s+f*.66),n+Math.sin(u*Math.PI)*.12])}return c}function z(e,o,n,i,s,t,a,m){let b=[],p=Math.cos(s),c=Math.sin(s),d=-c,u=p;for(let w=0;w<t;w+=1){let f=w/Math.max(1,t-1),g=f-.5,r=Math.sin(f*Math.PI)*a,h=(m()-.5)*.18+Math.sin(f*18+e)*.07;b.push([e+p*i*g+d*(r+h),o+c*i*g+u*(r*.35+h*.7),n+g*.55])}return b}function x(e,o,n,i=!1,s=0){e.add(n.object),o.geometries.push(n.geometry),o.materials.push(n.material),i&&o.animated.push({mesh:n.object,material:null,baseX:n.object.position.x,baseY:n.object.position.y,baseZ:n.object.position.z,baseRot:n.object.rotation.z,phase:s,drift:.015})}function X(e,o){let n=[],i=[],s=[],t=[new e.Color("#e2d1a7"),new e.Color("#c58c45"),new e.Color("#2c6f76"),new e.Color("#11314f"),new e.Color("#a01f22"),new e.Color("#d2cf4a"),new e.Color("#f0e6cf")],a=360;for(let b=0;b<a;b+=1){let p=o(),c=Math.sin(p*Math.PI),d=-14.5+p*30+(o()-.5)*5.2,u=-2.8+c*3.9+(o()-.5)*4.5,w=-4.6-o()*12.5-c*2.4,f=-.18+c*.58+(o()-.5)*1.4,g=.18+o()*.72+c*.32,r=.012+o()*.05,h=Math.cos(f)*g,l=Math.sin(f)*g,v=-Math.sin(f)*r,A=Math.cos(f)*r,y=n.length/3;n.push(d-h-v,u-l-A,w),n.push(d-h+v,u-l+A,w),n.push(d+h+v,u+l+A,w),n.push(d+h-v,u+l-A,w),s.push(y,y+1,y+2,y,y+2,y+3);let C=t[b%t.length],S=.62+o()*.42;for(let k=0;k<4;k+=1)i.push(C.r*S,C.g*S,C.b*S)}let m=new e.BufferGeometry;return m.setAttribute("position",new e.Float32BufferAttribute(n,3)),m.setAttribute("color",new e.Float32BufferAttribute(i,3)),m.setIndex(s),m.computeBoundingSphere(),m}function q(e){let n=new Uint8Array(36864);for(let s=0;s<96;s+=1)for(let t=0;t<96;t+=1){let a=(t+.5)/96*2-1,m=(s+.5)/96*2-1,b=Math.sqrt(a*a+m*m),p=.82+.13*Math.sin(t*.82)+.1*Math.sin(s*1.17+t*.19),c=U((1-b)/.42),d=(s*96+t)*4;n[d]=255,n[d+1]=247,n[d+2]=216,n[d+3]=Math.round(255*c*c*U(p))}let i=new e.DataTexture(n,96,96,e.RGBAFormat);return i.needsUpdate=!0,i.wrapS=e.ClampToEdgeWrapping,i.wrapT=e.ClampToEdgeWrapping,i.minFilter=e.LinearFilter,i.magFilter=e.LinearFilter,e.SRGBColorSpace&&(i.colorSpace=e.SRGBColorSpace),i}function Z(e,o,n){let s=new Float32Array(1560),t=new Float32Array(520*3),a=[new e.Color("#e7d5a3"),new e.Color("#bf6f23"),new e.Color("#c31116"),new e.Color("#257d84"),new e.Color("#174176"),new e.Color("#cbd044"),new e.Color("#efe4cd")];for(let c=0;c<520;c+=1){let d=c/Math.max(1,519),u=Math.sin(d*Math.PI),w=-15.6+d*31.2+(o()-.5)*5.4,f=-2.15+u*4+(o()-.5)*4.4,g=-3.8-o()*15-u*2;s[c*3]=w,s[c*3+1]=f,s[c*3+2]=g;let r=a[c%a.length],h=.78+o()*.28;t[c*3]=r.r*h,t[c*3+1]=r.g*h,t[c*3+2]=r.b*h}let m=new e.BufferGeometry;m.setAttribute("position",new e.BufferAttribute(s,3)),m.setAttribute("color",new e.BufferAttribute(t,3));let b=new e.PointsMaterial({name:"artist-mark-field-floating-pigment-dust",size:.34,map:n,alphaMap:n,vertexColors:!0,transparent:!0,opacity:.78,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1}),p=new e.Points(m,b);return p.name="public-spread-pigment-notes-through-wallonie-pressure",I(p,23),{object:p,geometry:m,material:b}}function _({THREE:e,part:o,seed:n,utilities:i}={}){let s=D(i,n||o?.id||"artist-mark-field","emily-mason-mark-field-wallonie"),t=new e.Group;t.name="artist-mark-field-emily-mason-wallonie",t.userData={partId:o?.id||"artist-mark-field",role:o?.role||"artist-style-system",packetId:j,packetHash:W,artist:"Emily Mason",selectedNewsSignal:"Tour de Wallonie double blow: Ben Oliver surprise lead; Arnaud De Lie sixth",targetVisual:"visible artist-style-system carrying non-literal flow pressure",subjectMode:"abstract-no-subject"};let a={geometries:[],materials:[],textures:[],animated:[]};F(e,t,a,{name:"large-warm-earth-wash-left-counterweight",width:37.8,height:19.4,position:[-4.2,1.22,-10.8],rotation:[.02,-.08,.1],colorA:"#e9d5a8",colorB:"#bd7e34",accent:"#e59b63",opacity:.62,flow:.28,hardness:.82,bloom:.24,seed:s(),drift:.045,renderOrder:2}),F(e,t,a,{name:"cool-green-teal-counterwash-right-field",width:32.4,height:19.8,position:[5.8,1.56,-11.8],rotation:[-.02,.11,-.09],colorA:"#214461",colorB:"#2d8c88",accent:"#c9cc3e",opacity:.58,flow:2.26,hardness:.7,bloom:.38,seed:s(),drift:.04,renderOrder:3}),F(e,t,a,{name:"low-blue-gray-dragged-plane-public-spread",width:43,height:10.8,position:[.9,-2.02,-6.8],rotation:[.04,-.03,-.075],colorA:"#0c1828",colorB:"#476e78",accent:"#a12b2d",opacity:.68,flow:-.14,hardness:.42,bloom:.2,seed:s(),drift:.025,renderOrder:8}),F(e,t,a,{name:"peach-amber-bloom-under-surprise-lead",width:24.2,height:11.4,position:[1.2,.4,-5.2],rotation:[.02,.04,-.18],colorA:"#d1a16f",colorB:"#e6c05a",accent:"#c50f13",opacity:.5,flow:.85,hardness:.54,bloom:.52,seed:s(),drift:.038,renderOrder:10}),F(e,t,a,{name:"left-cobalt-turquoise-submerged-field",width:20.6,height:12.6,position:[-8.1,-.9,-5.8],rotation:[.05,-.18,.05],colorA:"#0d2447",colorB:"#348a93",accent:"#e0c16e",opacity:.46,flow:.12,hardness:.58,bloom:.25,seed:s(),drift:.025,renderOrder:11}),F(e,t,a,{name:"right-edge-yellow-green-opaque-counterweight",width:4.4,height:9.4,position:[9.4,.15,-4.8],rotation:[.02,.05,-.02],colorA:"#a9b53b",colorB:"#d6d457",accent:"#e5d18a",opacity:.5,flow:1.9,hardness:.32,bloom:.42,seed:s(),drift:.018,renderOrder:12});let m=X(e,s),b=new e.MeshBasicMaterial({name:"dry-scraped-scumble-quad-field-material",vertexColors:!0,transparent:!0,opacity:.7,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1}),p=new e.Mesh(m,b);p.name="dry-scumbled-edge-activity-and-scraped-residue",I(p,18),t.add(p),a.geometries.push(m),a.materials.push(b);let c=q(e);a.textures.push(c);let d=Z(e,s,c);t.add(d.object),a.geometries.push(d.geometry),a.materials.push(d.material),a.animated.push({mesh:d.object,material:null,baseX:0,baseY:0,baseZ:0,baseRot:0,phase:.4,drift:.025}),x(t,a,M(e,z(-1.7,.84,-4.2,26,-.24,84,.68,s),.24,"#b50910",.88,"dominant-crimson-surprise-lead-arc",32),!0,.1),x(t,a,M(e,z(2,-.72,-3.8,31.4,-.1,92,-.54,s),.18,"#071322",.84,"blackened-low-pressure-main-contour",34),!0,.7),x(t,a,M(e,z(-5.8,-1.94,-2.9,12.6,1.08,44,.38,s),.1,"#102541",.72,"left-rising-dark-blue-drawn-contour",36),!1,0),x(t,a,M(e,z(6.7,-.18,-4.6,13.5,.32,48,-.46,s),.1,"#151018",.68,"right-edge-black-dry-sweep",36),!1,0),x(t,a,M(e,z(.2,2.45,-8.5,22,-.32,64,.25,s),.085,"#183344",.48,"upper-threaded-pressure-route",22),!1,0),x(t,a,M(e,z(-7.2,.08,-6.2,9,.08,34,-.14,s),.07,"#355f7a",.62,"left-cobalt-skimming-mark",27),!1,0);let u=new e.Group;u.name="off-center-radial-symbols-surprise-and-sixth-place",u.position.set(4.65,.54,-4.3),I(u,38),t.add(u),a.animated.push({mesh:u,material:null,baseX:u.position.x,baseY:u.position.y,baseZ:u.position.z,baseRot:0,phase:1.7,drift:.018});let w=[{rx:.86,ry:.76,s:-.8,e:4.55,color:"#d6cc47",opacity:.82,width:.043,name:"yellow-green-lead-ring"},{rx:.55,ry:.49,s:.2,e:5.4,color:"#e5a33e",opacity:.74,width:.035,name:"amber-second-blow-ring"},{rx:.33,ry:.29,s:-1.6,e:3.25,color:"#f0e3c2",opacity:.62,width:.027,name:"chalk-inner-radial-note"}];for(let r of w)x(u,a,M(e,G(0,0,0,r.rx,r.ry,r.s,r.e,44,.05,s),r.width,r.color,r.opacity,r.name,39),!1,0);for(let r=0;r<8;r+=1){let h=r*Math.PI*.25+r%2*.12,l=1.32+r%3*.32,v=.38+r%2*.16;x(u,a,M(e,[[Math.cos(h)*v,Math.sin(h)*v,-.02],[Math.cos(h)*l,Math.sin(h)*l,-.03]],.018,r%2===0?"#c9ce42":"#e8d6a3",.5,`short-radial-scrape-${r}`,40),!1,0)}x(t,a,M(e,G(-4.4,-.1,-3.7,3.8,1.9,2.72,5.96,58,.15,s),.035,"#0b1424",.72,"lower-left-loose-emily-mason-contour-arc",37),!1,0),x(t,a,M(e,G(7.3,.2,-5.2,4.2,2.7,-.12,2.32,62,.13,s),.034,"#14161d",.68,"right-knot-drifting-black-contour",37),!1,0);for(let r=0;r<22;r+=1){let h=r%2===0?-1:1,l=h*(4.8+s()*8.2)+(s()-.5)*1.4,v=-1.8+s()*5.6,A=-3.2-s()*9.4,y=-.45+s()*1+h*.12,C=1.4+s()*4.3,S=.016+s()*.026,k=r%5===0?"#8a1f24":r%4===0?"#c9ce42":"#121b2a",B=r%4===0?.56:.45;x(t,a,M(e,z(l,v,A,C,y,18,(s()-.5)*.32,s),S,k,B,`edge-contour-hatch-${r}`,35),!1,0)}function f(r={}){let h=r.captureMode?0:Number(r.elapsedSeconds||r.time||0);for(let l of a.animated)l.material&&l.material.uniforms?.uTime&&(l.material.uniforms.uTime.value=h),l.mesh&&(l.mesh.position.x=l.baseX+Math.sin(h*.13+l.phase*5.2)*l.drift,l.mesh.position.y=l.baseY+Math.cos(h*.11+l.phase*3.7)*l.drift*.7,l.mesh.position.z=l.baseZ,l.mesh.rotation.z=l.baseRot+Math.sin(h*.09+l.phase*2.1)*l.drift*.24);u.scale.setScalar(1+Math.sin(h*.18+.7)*.018)}function g(){for(let r of a.geometries)r.dispose();for(let r of a.materials)r.dispose();for(let r of a.textures)r.dispose()}return{object:t,update:f,dispose:g}}export{_ as createImmersiveWorldPart};
