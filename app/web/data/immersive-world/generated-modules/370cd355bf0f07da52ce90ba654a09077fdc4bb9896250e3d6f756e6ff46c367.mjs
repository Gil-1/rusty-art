var O="art-direction-packet-cb8fd8bab6d4",W="cb8fd8bab6d49b41c317911479a092cb";function U(e){let o=String(e??"artist-mark-field-emily-mason-wallonie"),n=2166136261;for(let i=0;i<o.length;i+=1)n^=o.charCodeAt(i),n=Math.imul(n,16777619);return n>>>0}function D(e,o,n){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(o,n);let i=(U(o)^U(n))>>>0;return function(){i=i+1831565813>>>0;let t=i;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function j(e){return Math.max(0,Math.min(1,e))}function F(e,o){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=o,e}function Y(e,o){return new e.ShaderMaterial({name:o.name,transparent:!0,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uColorA:{value:new e.Color(o.colorA)},uColorB:{value:new e.Color(o.colorB)},uAccent:{value:new e.Color(o.accent)},uOpacity:{value:o.opacity},uSeed:{value:o.seed},uFlow:{value:o.flow},uHardness:{value:o.hardness??.55},uBloom:{value:o.bloom??.45}},vertexShader:`
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
    `})}function I(e,o,n,i){let r=new e.PlaneGeometry(i.width,i.height,1,1),t=Y(e,i),a=new e.Mesh(r,t);return a.name=i.name,a.position.set(i.position[0],i.position[1],i.position[2]),a.rotation.set(i.rotation[0],i.rotation[1],i.rotation[2]),F(a,i.renderOrder??1),o.add(a),n.geometries.push(r),n.materials.push(t),n.animated.push({mesh:a,material:t,baseX:a.position.x,baseY:a.position.y,baseZ:a.position.z,baseRot:a.rotation.z,phase:i.seed,drift:i.drift??.05}),a}function M(e,o,n,i,r,t,a){let m=[],b=[],p=[],c=new e.Color(i);for(let f=0;f<o.length;f+=1){let v=o[Math.max(0,f-1)],s=o[f],h=o[Math.min(o.length-1,f+1)],l=h[0]-v[0],g=h[1]-v[1],C=Math.max(1e-4,Math.sqrt(l*l+g*g)),y=.42+.58*Math.sin(f/Math.max(1,o.length-1)*Math.PI),A=.82+.18*Math.sin(f*2.13),S=-g/C*n*y*A,k=l/C*n*y*A;m.push(s[0]+S,s[1]+k,s[2]),m.push(s[0]-S,s[1]-k,s[2]);let B=.72+.28*Math.sin(f*.9+n*31);if(p.push(c.r*B,c.g*B,c.b*B),p.push(c.r*(B+.12),c.g*(B+.12),c.b*(B+.12)),f<o.length-1){let P=f*2;b.push(P,P+1,P+2,P+1,P+3,P+2)}}let u=new e.BufferGeometry;u.setAttribute("position",new e.Float32BufferAttribute(m,3)),u.setAttribute("color",new e.Float32BufferAttribute(p,3)),u.setIndex(b),u.computeBoundingSphere();let d=new e.MeshBasicMaterial({name:`${t}-material`,vertexColors:!0,transparent:!0,opacity:r,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1}),w=new e.Mesh(u,d);return w.name=t,F(w,a),{object:w,geometry:u,material:d}}function G(e,o,n,i,r,t,a,m,b,p){let c=[];for(let u=0;u<m;u+=1){let d=u/Math.max(1,m-1),w=t+(a-t)*d,f=(p()-.5)*b+Math.sin(d*Math.PI*4)*b*.12;c.push([e+Math.cos(w)*(i+f),o+Math.sin(w)*(r+f*.66),n+Math.sin(d*Math.PI)*.12])}return c}function z(e,o,n,i,r,t,a,m){let b=[],p=Math.cos(r),c=Math.sin(r),u=-c,d=p;for(let w=0;w<t;w+=1){let f=w/Math.max(1,t-1),v=f-.5,s=Math.sin(f*Math.PI)*a,h=(m()-.5)*.18+Math.sin(f*18+e)*.07;b.push([e+p*i*v+u*(s+h),o+c*i*v+d*(s*.35+h*.7),n+v*.55])}return b}function x(e,o,n,i=!1,r=0){e.add(n.object),o.geometries.push(n.geometry),o.materials.push(n.material),i&&o.animated.push({mesh:n.object,material:null,baseX:n.object.position.x,baseY:n.object.position.y,baseZ:n.object.position.z,baseRot:n.object.rotation.z,phase:r,drift:.015})}function X(e,o){let n=[],i=[],r=[],t=[new e.Color("#e2d1a7"),new e.Color("#c58c45"),new e.Color("#2c6f76"),new e.Color("#11314f"),new e.Color("#a01f22"),new e.Color("#d2cf4a"),new e.Color("#f0e6cf")],a=360;for(let b=0;b<a;b+=1){let p=o(),c=Math.sin(p*Math.PI),u=-14.5+p*30+(o()-.5)*5.2,d=-2.8+c*3.9+(o()-.5)*4.5,w=-4.6-o()*12.5-c*2.4,f=-.18+c*.58+(o()-.5)*1.4,v=.18+o()*.72+c*.32,s=.012+o()*.05,h=Math.cos(f)*v,l=Math.sin(f)*v,g=-Math.sin(f)*s,C=Math.cos(f)*s,y=n.length/3;n.push(u-h-g,d-l-C,w),n.push(u-h+g,d-l+C,w),n.push(u+h+g,d+l+C,w),n.push(u+h-g,d+l-C,w),r.push(y,y+1,y+2,y,y+2,y+3);let A=t[b%t.length],S=.62+o()*.42;for(let k=0;k<4;k+=1)i.push(A.r*S,A.g*S,A.b*S)}let m=new e.BufferGeometry;return m.setAttribute("position",new e.Float32BufferAttribute(n,3)),m.setAttribute("color",new e.Float32BufferAttribute(i,3)),m.setIndex(r),m.computeBoundingSphere(),m}function Z(e){let n=new Uint8Array(36864);for(let r=0;r<96;r+=1)for(let t=0;t<96;t+=1){let a=(t+.5)/96*2-1,m=(r+.5)/96*2-1,b=Math.sqrt(a*a+m*m),p=.82+.13*Math.sin(t*.82)+.1*Math.sin(r*1.17+t*.19),c=j((1-b)/.42),u=(r*96+t)*4;n[u]=255,n[u+1]=247,n[u+2]=216,n[u+3]=Math.round(255*c*c*j(p))}let i=new e.DataTexture(n,96,96,e.RGBAFormat);return i.needsUpdate=!0,i.wrapS=e.ClampToEdgeWrapping,i.wrapT=e.ClampToEdgeWrapping,i.minFilter=e.LinearFilter,i.magFilter=e.LinearFilter,e.SRGBColorSpace&&(i.colorSpace=e.SRGBColorSpace),i}function _(e,o,n){let r=new Float32Array(1560),t=new Float32Array(520*3),a=[new e.Color("#e7d5a3"),new e.Color("#bf6f23"),new e.Color("#c31116"),new e.Color("#257d84"),new e.Color("#174176"),new e.Color("#cbd044"),new e.Color("#efe4cd")];for(let c=0;c<520;c+=1){let u=c/Math.max(1,519),d=Math.sin(u*Math.PI),w=-15.6+u*31.2+(o()-.5)*5.4,f=-2.15+d*4+(o()-.5)*4.4,v=-3.8-o()*15-d*2;r[c*3]=w,r[c*3+1]=f,r[c*3+2]=v;let s=a[c%a.length],h=.78+o()*.28;t[c*3]=s.r*h,t[c*3+1]=s.g*h,t[c*3+2]=s.b*h}let m=new e.BufferGeometry;m.setAttribute("position",new e.BufferAttribute(r,3)),m.setAttribute("color",new e.BufferAttribute(t,3));let b=new e.PointsMaterial({name:"artist-mark-field-floating-pigment-dust",size:.34,map:n,alphaMap:n,vertexColors:!0,transparent:!0,opacity:.78,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1}),p=new e.Points(m,b);return p.name="public-spread-pigment-notes-through-wallonie-pressure",F(p,23),{object:p,geometry:m,material:b}}function q({THREE:e,part:o,seed:n,utilities:i}={}){let r=D(i,n||o?.id||"artist-mark-field","emily-mason-mark-field-wallonie"),t=new e.Group;t.name="artist-mark-field-emily-mason-wallonie",t.userData={partId:o?.id||"artist-mark-field",role:o?.role||"artist-style-system",packetId:O,packetHash:W,artist:"Emily Mason",selectedNewsSignal:"Tour de Wallonie double blow: Ben Oliver surprise lead; Arnaud De Lie sixth",targetVisual:"visible artist-style-system carrying non-literal flow pressure",subjectMode:"abstract-no-subject"};let a={geometries:[],materials:[],textures:[],animated:[]};I(e,t,a,{name:"large-warm-earth-wash-left-counterweight",width:29.5,height:15.2,position:[-4.9,1.18,-12.8],rotation:[.02,-.08,.1],colorA:"#e9d5a8",colorB:"#bd7e34",accent:"#e59b63",opacity:.48,flow:.28,hardness:.82,bloom:.24,seed:r(),drift:.045,renderOrder:2}),I(e,t,a,{name:"cool-green-teal-counterwash-right-field",width:25.4,height:15.8,position:[5.8,1.62,-13.9],rotation:[-.02,.11,-.09],colorA:"#214461",colorB:"#2d8c88",accent:"#c9cc3e",opacity:.43,flow:2.26,hardness:.7,bloom:.38,seed:r(),drift:.04,renderOrder:3}),I(e,t,a,{name:"low-blue-gray-dragged-plane-public-spread",width:36.8,height:8.4,position:[1.2,-2.16,-7.6],rotation:[.04,-.03,-.075],colorA:"#0c1828",colorB:"#476e78",accent:"#a12b2d",opacity:.55,flow:-.14,hardness:.42,bloom:.2,seed:r(),drift:.025,renderOrder:8}),I(e,t,a,{name:"peach-amber-bloom-under-surprise-lead",width:18.2,height:9.2,position:[1.7,.42,-5.7],rotation:[.02,.04,-.18],colorA:"#d1a16f",colorB:"#e6c05a",accent:"#c50f13",opacity:.38,flow:.85,hardness:.54,bloom:.52,seed:r(),drift:.038,renderOrder:10});let m=X(e,r),b=new e.MeshBasicMaterial({name:"dry-scraped-scumble-quad-field-material",vertexColors:!0,transparent:!0,opacity:.7,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1}),p=new e.Mesh(m,b);p.name="dry-scumbled-edge-activity-and-scraped-residue",F(p,18),t.add(p),a.geometries.push(m),a.materials.push(b);let c=Z(e);a.textures.push(c);let u=_(e,r,c);t.add(u.object),a.geometries.push(u.geometry),a.materials.push(u.material),a.animated.push({mesh:u.object,material:null,baseX:0,baseY:0,baseZ:0,baseRot:0,phase:.4,drift:.025}),x(t,a,M(e,z(-1.7,.84,-4.2,26,-.24,84,.68,r),.18,"#b50910",.88,"dominant-crimson-surprise-lead-arc",32),!0,.1),x(t,a,M(e,z(2,-.72,-3.8,31.4,-.1,92,-.54,r),.13,"#071322",.84,"blackened-low-pressure-main-contour",34),!0,.7),x(t,a,M(e,z(-5.8,-1.94,-2.9,12.6,1.08,44,.38,r),.075,"#102541",.72,"left-rising-dark-blue-drawn-contour",36),!1,0),x(t,a,M(e,z(6.7,-.18,-4.6,13.5,.32,48,-.46,r),.075,"#151018",.68,"right-edge-black-dry-sweep",36),!1,0),x(t,a,M(e,z(.2,2.45,-8.5,22,-.32,64,.25,r),.06,"#183344",.48,"upper-threaded-pressure-route",22),!1,0),x(t,a,M(e,z(-7.2,.08,-6.2,9,.08,34,-.14,r),.05,"#355f7a",.62,"left-cobalt-skimming-mark",27),!1,0);let d=new e.Group;d.name="off-center-radial-symbols-surprise-and-sixth-place",d.position.set(4.65,.54,-4.3),F(d,38),t.add(d),a.animated.push({mesh:d,material:null,baseX:d.position.x,baseY:d.position.y,baseZ:d.position.z,baseRot:0,phase:1.7,drift:.018});let w=[{rx:.86,ry:.76,s:-.8,e:4.55,color:"#d6cc47",opacity:.82,width:.043,name:"yellow-green-lead-ring"},{rx:.55,ry:.49,s:.2,e:5.4,color:"#e5a33e",opacity:.74,width:.035,name:"amber-second-blow-ring"},{rx:.33,ry:.29,s:-1.6,e:3.25,color:"#f0e3c2",opacity:.62,width:.027,name:"chalk-inner-radial-note"}];for(let s of w)x(d,a,M(e,G(0,0,0,s.rx,s.ry,s.s,s.e,44,.05,r),s.width,s.color,s.opacity,s.name,39),!1,0);for(let s=0;s<8;s+=1){let h=s*Math.PI*.25+s%2*.12,l=1.32+s%3*.32,g=.38+s%2*.16;x(d,a,M(e,[[Math.cos(h)*g,Math.sin(h)*g,-.02],[Math.cos(h)*l,Math.sin(h)*l,-.03]],.018,s%2===0?"#c9ce42":"#e8d6a3",.5,`short-radial-scrape-${s}`,40),!1,0)}x(t,a,M(e,G(-4.4,-.1,-3.7,3.8,1.9,2.72,5.96,58,.15,r),.035,"#0b1424",.72,"lower-left-loose-emily-mason-contour-arc",37),!1,0),x(t,a,M(e,G(7.3,.2,-5.2,4.2,2.7,-.12,2.32,62,.13,r),.034,"#14161d",.68,"right-knot-drifting-black-contour",37),!1,0);for(let s=0;s<22;s+=1){let h=s%2===0?-1:1,l=h*(4.8+r()*8.2)+(r()-.5)*1.4,g=-1.8+r()*5.6,C=-3.2-r()*9.4,y=-.45+r()*1+h*.12,A=1.4+r()*4.3,S=.016+r()*.026,k=s%5===0?"#8a1f24":s%4===0?"#c9ce42":"#121b2a",B=s%4===0?.56:.45;x(t,a,M(e,z(l,g,C,A,y,18,(r()-.5)*.32,r),S,k,B,`edge-contour-hatch-${s}`,35),!1,0)}function f(s={}){let h=s.captureMode?0:Number(s.elapsedSeconds||s.time||0);for(let l of a.animated)l.material&&l.material.uniforms?.uTime&&(l.material.uniforms.uTime.value=h),l.mesh&&(l.mesh.position.x=l.baseX+Math.sin(h*.13+l.phase*5.2)*l.drift,l.mesh.position.y=l.baseY+Math.cos(h*.11+l.phase*3.7)*l.drift*.7,l.mesh.position.z=l.baseZ,l.mesh.rotation.z=l.baseRot+Math.sin(h*.09+l.phase*2.1)*l.drift*.24);d.scale.setScalar(1+Math.sin(h*.18+.7)*.018)}function v(){for(let s of a.geometries)s.dispose();for(let s of a.materials)s.dispose();for(let s of a.textures)s.dispose()}return{object:t,update:f,dispose:v}}export{q as createImmersiveWorldPart};
