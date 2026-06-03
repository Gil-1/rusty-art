var B="art-direction-packet-cb8fd8bab6d4",z="cb8fd8bab6d49b41c317911479a092cb";function A(e){let o=2166136261,c=String(e??"non-literal-flow-pressure");for(let i=0;i<c.length;i+=1)o^=c.charCodeAt(i),o=Math.imul(o,16777619);return o>>>0}function F(e,o,c){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(o,c);let i=(A(o)^A(c))>>>0;return function(){i=i+1831565813>>>0;let a=i;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}function C(e){return Math.max(0,Math.min(1,e))}function O(e){let c=new Uint8Array(36864);for(let d=0;d<96;d+=1)for(let a=0;a<96;a+=1){let p=(a+.5)/96*2-1,u=(d+.5)/96*2-1,m=Math.sqrt(p*p+u*u),b=.86+.12*Math.sin(a*.91)+.08*Math.sin(d*1.37+a*.22),r=C((1-m)/.34),s=(d*96+a)*4;c[s]=255,c[s+1]=250,c[s+2]=226,c[s+3]=Math.round(255*r*r*C(b))}let i=new e.DataTexture(c,96,96,e.RGBAFormat);return i.needsUpdate=!0,i.wrapS=e.ClampToEdgeWrapping,i.wrapT=e.ClampToEdgeWrapping,i.minFilter=e.LinearFilter,i.magFilter=e.LinearFilter,e.SRGBColorSpace&&(i.colorSpace=e.SRGBColorSpace),i}function k(e,o){return new e.ShaderMaterial({name:o.name,transparent:!0,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uColorA:{value:new e.Color(o.colorA)},uColorB:{value:new e.Color(o.colorB)},uAccent:{value:new e.Color(o.accent)},uOpacity:{value:o.opacity},uFlow:{value:o.flow??.5},uSeed:{value:o.seed??.23},uBand:{value:o.band??.42},uEdge:{value:o.edge??.16},uAccentStrength:{value:o.accentStrength??.32}},vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uAccent;
      uniform float uOpacity;
      uniform float uFlow;
      uniform float uSeed;
      uniform float uBand;
      uniform float uEdge;
      uniform float uAccentStrength;
      varying vec2 vUv;

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
        float amp = 0.5;
        for (int i = 0; i < 5; i += 1) {
          value += noise(p) * amp;
          p = p * 2.04 + vec2(7.1, 4.7);
          amp *= 0.52;
        }
        return value;
      }

      void main() {
        vec2 centered = vUv * 2.0 - 1.0;
        vec2 flowDir = normalize(vec2(cos(uFlow), sin(uFlow)));
        float along = dot(centered, flowDir);
        float cross = dot(centered, vec2(-flowDir.y, flowDir.x));
        float paper = fbm(vUv * 5.6 + vec2(uSeed, uTime * 0.012));
        float tooth = fbm(vUv * 31.0 + vec2(uSeed * 9.0, 1.7));
        float stain = fbm(vec2(along * 2.1, cross * 3.2) + vec2(uSeed * 2.2, uTime * 0.018));
        float diagonalBand = 1.0 - smoothstep(uBand, uBand + 0.34, abs(cross + (paper - 0.5) * 0.46));
        float field = smoothstep(0.14, 0.96, paper * 0.72 + stain * 0.72);
        vec3 color = mix(uColorA, uColorB, field);
        float accent = smoothstep(0.68, 0.95, stain + tooth * 0.34) * diagonalBand;
        color = mix(color, uAccent, accent * uAccentStrength);
        color *= 0.88 + 0.25 * tooth;

        float featherX = smoothstep(0.0, uEdge, vUv.x) * smoothstep(0.0, uEdge, 1.0 - vUv.x);
        float featherY = smoothstep(0.0, uEdge, vUv.y) * smoothstep(0.0, uEdge, 1.0 - vUv.y);
        float ragged = 0.68 + paper * 0.52 + tooth * 0.16;
        float alpha = uOpacity * featherX * featherY * mix(0.48, 1.0, diagonalBand) * ragged;
        alpha *= smoothstep(0.05, 0.36, field + diagonalBand * 0.35);
        if (alpha < 0.018) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `})}function x(e,o,c,i,d,a){let p=[],u=[];for(let s=0;s<o.length;s+=1){let y=o[Math.max(0,s-1)],g=o[s],f=o[Math.min(o.length-1,s+1)],v=f[0]-y[0],t=f[1]-y[1],w=Math.max(1e-4,Math.sqrt(v*v+t*t)),n=.62+.38*Math.sin(s/Math.max(1,o.length-1)*Math.PI),l=-t/w*c*n,M=v/w*c*n;if(p.push(g[0]+l,g[1]+M,g[2]),p.push(g[0]-l,g[1]-M,g[2]),s<o.length-1){let h=s*2;u.push(h,h+1,h+2,h+1,h+3,h+2)}}let m=new e.BufferGeometry;m.setAttribute("position",new e.Float32BufferAttribute(p,3)),m.setIndex(u),m.computeVertexNormals();let b=new e.MeshBasicMaterial({name:`${a}-material`,color:i,transparent:!0,opacity:d,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1}),r=new e.Mesh(m,b);return r.name=a,r.castShadow=!1,r.receiveShadow=!1,r.frustumCulled=!1,{object:r,geometry:m,material:b}}function D(e,o,c,i,d,a,p,u,m,b){let r=[];for(let s=0;s<u;s+=1){let y=s/Math.max(1,u-1),g=a+(p-a)*y,f=(b()-.5)*m;r.push([e+Math.cos(g)*(i+f),o+Math.sin(g)*(d+f*.6),c])}return r}function P(e,o,c){let d=new Float32Array(1260),a=new Float32Array(420*3),p=[new e.Color("#f0d79b"),new e.Color("#d88b38"),new e.Color("#b50b12"),new e.Color("#2b7a84"),new e.Color("#25517c"),new e.Color("#e6dcc4"),new e.Color("#c7ce46")];for(let r=0;r<420;r+=1){let s=r/420,y=-14.6+s*30.4+(o()-.5)*3.4,g=Math.sin(s*Math.PI);d[r*3]=y,d[r*3+1]=-2.42+g*3.72+(o()-.5)*4.2,d[r*3+2]=-5.8-o()*13.2-g*4.2;let f=p[r%p.length],v=.82+o()*.24;a[r*3]=f.r*v,a[r*3+1]=f.g*v,a[r*3+2]=f.b*v}let u=new e.BufferGeometry;u.setAttribute("position",new e.BufferAttribute(d,3)),u.setAttribute("color",new e.BufferAttribute(a,3));let m=new e.PointsMaterial({name:"wallonie-public-spread-pigment-points",size:.32,map:c,alphaMap:c,vertexColors:!0,transparent:!0,opacity:.68,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1}),b=new e.Points(u,m);return b.name="low-pressure-public-spread-pigment-field",b.frustumCulled=!1,b.renderOrder=14,{object:b,geometry:u,material:m}}function U({THREE:e,part:o,seed:c,utilities:i}){let d=F(i,c||o?.id||"non-literal-flow-pressure","emily-mason-wallonie-pressure"),a=new e.Group;a.name="non-literal-flow-pressure-emily-mason-wallonie",a.userData={partId:o?.id||"non-literal-flow-pressure",role:o?.role||"primary-news-signal",packetId:B,packetHash:z,artist:"Emily Mason",selectedNewsSignal:"Ben Oliver surprise lead and Arnaud De Lie sixth on Tour de Wallonie",subjectMode:"abstract-no-subject"};let p=[],u=[],m=[],b=[];function r(t){let w=new e.PlaneGeometry(t.width,t.height,1,1),n=k(e,{...t,seed:d()}),l=new e.Mesh(w,n);l.name=t.name,l.position.set(t.position[0],t.position[1],t.position[2]),l.rotation.set(t.rotation[0],t.rotation[1],t.rotation[2]),l.renderOrder=t.renderOrder??0,l.castShadow=!1,l.receiveShadow=!1,l.frustumCulled=!1,a.add(l),p.push(w),u.push(n),b.push({mesh:l,material:n,baseX:l.position.x,baseY:l.position.y,baseRot:l.rotation.z,drift:t.drift??.05})}r({name:"active-negative-space-stained-wallonie-air",width:55,height:27,position:[.8,.25,-22],rotation:[0,.02,.03],colorA:"#152538",colorB:"#b8b08a",accent:"#5c918e",opacity:.36,flow:.18,band:1.05,edge:.09,accentStrength:.18,renderOrder:-2,drift:.035}),r({name:"large-blue-teal-measured-pace-wash",width:38.5,height:14.8,position:[-5.2,-1.3,-10.8],rotation:[.06,-.08,-.1],colorA:"#1e5274",colorB:"#73aeb0",accent:"#e4d6ac",opacity:.78,flow:-.18,band:.82,edge:.13,accentStrength:.28,renderOrder:2,drift:.06}),r({name:"upper-right-green-ochre-stained-public-field",width:42,height:17.6,position:[5.6,2.88,-16.1],rotation:[-.02,.1,.08],colorA:"#7fa59a",colorB:"#d3b774",accent:"#f0c15a",opacity:.58,flow:.56,band:.72,edge:.16,accentStrength:.22,renderOrder:1,drift:.04}),r({name:"ben-oliver-surprise-red-pressure-band",width:33,height:6.4,position:[-3.6,1.72,-7],rotation:[.04,-.04,-.3],colorA:"#8f1917",colorB:"#ef2b16",accent:"#eaa13a",opacity:.86,flow:-.4,band:.38,edge:.11,accentStrength:.44,renderOrder:8,drift:.035}),r({name:"low-dark-blue-blackened-drag-pressure",width:37,height:4.8,position:[2.4,-2.18,-5.8],rotation:[.03,.03,-.08],colorA:"#10131b",colorB:"#173b5a",accent:"#602236",opacity:.9,flow:-.12,band:.46,edge:.1,accentStrength:.25,renderOrder:9,drift:.025}),r({name:"peach-amber-sixth-place-counterweight-veil",width:29,height:8.2,position:[5.2,.06,-9.8],rotation:[.01,.08,.16],colorA:"#d49a72",colorB:"#ead8b6",accent:"#d4d645",opacity:.44,flow:.34,band:.58,edge:.18,accentStrength:.24,renderOrder:5,drift:.05});let s=[x(e,D(-.4,.36,-4.9,7.9,2.15,3.02,6.22,34,.18,d),.028,"#090d10",.88,"long-black-contour-arc-carrying-low-pressure"),x(e,[[-7.9,-.62,-5.2],[-4.3,-.08,-5.2],[-1.4,.42,-5.2],[2.1,.08,-5.2],[6.8,-.34,-5.2]],.046,"#10151b",.82,"dry-horizontal-tour-wallonie-flow-line"),x(e,[[-5.1,2.1,-6.7],[-2.7,1.22,-6.7],[-.6,.68,-6.7],[1.8,.22,-6.7],[5,-.44,-6.7]],.035,"#234d83",.66,"cool-blue-diagonal-measured-pace-trace"),x(e,[[-2.6,1.52,-4.8],[-1.65,1.28,-4.8],[-.84,1.01,-4.8],[.12,.88,-4.8],[1.36,.66,-4.8]],.06,"#b80c12",.78,"compact-red-surprise-lead-scribble")];for(let t of s)t.object.renderOrder=18,a.add(t.object),p.push(t.geometry),u.push(t.material);let y=new e.MeshBasicMaterial({name:"offset-radial-pressure-symbol-material",color:"#c7ce46",transparent:!0,opacity:.42,depthWrite:!1,depthTest:!0,side:e.DoubleSide,toneMapped:!1});u.push(y);for(let t=0;t<3;t+=1){let w=new e.RingGeometry(.42+t*.2,.47+t*.2,72),n=new e.Mesh(w,y);n.name=`right-edge-wallonie-radial-counterweight-${t+1}`,n.position.set(5.3+t*.18,.72-t*.34,-8.7-t*.8),n.rotation.set(.07,-.08,.45+t*.08),n.renderOrder=16,n.castShadow=!1,n.receiveShadow=!1,n.frustumCulled=!1,a.add(n),p.push(w)}let g=O(e);m.push(g);let f=P(e,d,g);a.add(f.object),p.push(f.geometry),u.push(f.material);function v(t={}){let w=t.captureMode?0:Number(t.elapsedSeconds??t.time??0),n=Number.isFinite(w)?w:0,l=Number.isFinite(t.motionIntensity)?t.motionIntensity:1;for(let M=0;M<b.length;M+=1){let h=b[M],S=M*1.73;h.material.uniforms.uTime.value=n,h.mesh.position.x=h.baseX+Math.sin(n*.045+S)*h.drift*l,h.mesh.position.y=h.baseY+Math.cos(n*.038+S)*h.drift*.72*l,h.mesh.rotation.z=h.baseRot+Math.sin(n*.032+S)*.012*l}f.object.rotation.y=Math.sin(n*.025)*.028*l,f.object.rotation.z=Math.sin(n*.018)*.018*l,f.material.opacity=.58+Math.sin(n*.21)*.035*l}return v({captureMode:!0,elapsedSeconds:0}),{object:a,update:v,dispose(){for(let t of p)t?.dispose?.();for(let t of u)t?.dispose?.();for(let t of m)t?.dispose?.()}}}export{U as createImmersiveWorldPart};
