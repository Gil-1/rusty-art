var A="world-environment.pollock-hantavirus-pressure-skybox.v1";function k(e){let n=String(e??"pollock-hantavirus-static-environment"),o=2166136261;for(let r=0;r<n.length;r+=1)o^=n.charCodeAt(r),o=Math.imul(o,16777619);return o>>>0}function W(e,n,o){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(n,o);let r=(k(n)^k(o))>>>0;return function(){r=r+1831565813>>>0;let t=r;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function z(e){e.traverse(n=>{n.geometry&&typeof n.geometry.dispose=="function"&&n.geometry.dispose();let o=Array.isArray(n.material)?n.material:[n.material].filter(Boolean);for(let r of o)r&&typeof r.dispose=="function"&&r.dispose()})}function C(e){return Math.max(0,Math.min(1,e))}function F(e,n,o,r={}){let h=r.width||384,t=r.height||288,l=r.edgeFeather??.18,p=r.alphaScale??1,i=new e.Color(o),s=new Uint8Array(h*t*4);for(let c=0;c<t;c+=1)for(let a=0;a<h;a+=1){let y=a/Math.max(1,h-1),x=c/Math.max(1,t-1),g=Math.min(y,1-y,x,1-x),M=C(g/l),d=.72+n()*.32+Math.sin(a*.17+c*.11+n())*.04,m=.84+Math.sin(c*.19+n()*2.2)*.07,v=255*p*M*(.58+n()*.36),f=(c*h+a)*4;s[f]=Math.round(C(i.r*d*m*1.3)*255),s[f+1]=Math.round(C(i.g*d*m*1.3)*255),s[f+2]=Math.round(C(i.b*d*m*1.3)*255),s[f+3]=Math.round(C(v/255)*255)}let u=new e.DataTexture(s,h,t,e.RGBAFormat);return u.needsUpdate=!0,u.wrapS=e.ClampToEdgeWrapping,u.wrapT=e.ClampToEdgeWrapping,e.SRGBColorSpace&&(u.colorSpace=e.SRGBColorSpace),u}function G(e){return new e.ShaderMaterial({name:"pollock_hantavirus_static_position_space_environment",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uDeep:{value:new e.Color("#07101b")},uBlue:{value:new e.Color("#173a4b")},uTeal:{value:new e.Color("#1aa39c")},uOchre:{value:new e.Color("#c59c29")},uWarmWhite:{value:new e.Color("#e7e2d2")},uBlack:{value:new e.Color("#060607")},uRust:{value:new e.Color("#a84424")}},vertexShader:`
      varying vec3 vShellPosition;
      void main() {
        vShellPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vShellPosition;
      uniform float uTime;
      uniform vec3 uDeep;
      uniform vec3 uBlue;
      uniform vec3 uTeal;
      uniform vec3 uOchre;
      uniform vec3 uWarmWhite;
      uniform vec3 uBlack;
      uniform vec3 uRust;

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
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amp * noise3(p);
          p = p * 2.04 + vec3(5.7, 9.2, 3.4);
          amp *= 0.5;
        }
        return value;
      }

      float softBand(float value, float center, float halfSize, float feather) {
        return 1.0 - smoothstep(halfSize, halfSize + feather, abs(value - center));
      }

      void main() {
        vec3 dir = normalize(vShellPosition);
        float x = dir.x;
        float y = dir.y;
        float z = dir.z;
        float slow = uTime * 0.014;
        float poleFade = 1.0 - smoothstep(0.76, 0.97, abs(y));
        float poleWash = smoothstep(0.82, 0.985, abs(y));
        vec3 domain = vec3(x * 1.22, y * 1.08, z * 1.22);
        float broad = fbm3(domain * 1.8 + vec3(slow, -slow * 0.35, slow * 0.21));
        float fiber = fbm3(domain * 13.5 + vec3(-slow, slow * 1.8, 0.0));
        float sweep = sin((x * 2.4 - z * 1.6 + y * 0.7) + broad * 1.8 + uTime * 0.018);

        vec3 cool = mix(uDeep, uBlue, 0.35 + broad * 0.55);
        vec3 pressure = mix(uTeal, uOchre, smoothstep(-0.18, 0.38, y + sweep * 0.1));
        vec3 color = mix(cool, pressure, 0.18 + 0.32 * smoothstep(-0.65, 0.42, -z));
        color = mix(color, uRust, softBand(y + sweep * 0.08, -0.28, 0.11, 0.22) * 0.18 * poleFade);
        color = mix(color, uBlack, softBand(y + broad * 0.16, 0.02, 0.035, 0.12) * 0.3 * poleFade);
        color = mix(color, uWarmWhite, softBand(length(vec2(x * 0.9, y + 0.02)), 0.38, 0.08, 0.13) * 0.08 * poleFade);
        color += (broad - 0.5) * 0.16 + (fiber - 0.5) * 0.055 * (0.35 + 0.65 * poleFade);
        color += vec3(0.035, 0.025, 0.012) * smoothstep(0.2, 0.86, -z);
        vec3 quietPole = mix(uDeep, mix(uBlue, uOchre, 0.22), smoothstep(-0.4, 0.65, y)) + (broad - 0.5) * 0.05;
        color = mix(color, quietPole, poleWash * 0.72);
        gl_FragColor = vec4(pow(max(color, vec3(0.0)), vec3(1.02)), 1.0);
      }
    `})}function B(e,n){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=n,e}function O(e,n,o,r,h){let t=new e.PlaneGeometry(1,1,1,1),l=new e.Group;l.name="pollock-hantavirus-separated-depth-fields";let p=[{color:"#e8e1cd",opacity:.22,position:[-4.8,1.9,-16],scale:[18,6,1],rotation:[.04,.28,-.08]},{color:"#050506",opacity:.28,position:[4.9,1.15,-18.6],scale:[16,4.8,1],rotation:[.02,-.35,.1]},{color:"#c59c29",opacity:.2,position:[-2.7,-1.65,-15.3],scale:[20,4.4,1],rotation:[.12,.05,.04]},{color:"#1aa39c",opacity:.19,position:[5.7,-.85,-22.2],scale:[14.5,4.6,1],rotation:[.08,-.46,-.06]},{color:"#a84424",opacity:.18,position:[.6,-3,-24.5],scale:[24,5.4,1],rotation:[.1,-.04,.02]}];for(let i=0;i<p.length;i+=1){let s=p[i],u=F(e,o,s.color,{alphaScale:1,edgeFeather:.2});r.push(u);let c=new e.MeshBasicMaterial({map:u,transparent:!0,opacity:s.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});h.push(c);let a=new e.Mesh(t,c);a.name=`separated-soft-pollock-depth-field-${i+1}`,a.position.set(s.position[0],s.position[1],s.position[2]),a.rotation.set(s.rotation[0],s.rotation[1],s.rotation[2]),a.scale.set(s.scale[0],s.scale[1],s.scale[2]),a.userData.baseY=a.position.y,a.userData.baseOpacity=s.opacity,a.userData.phase=o()*Math.PI*2,a.userData.float=.012+o()*.02,B(a,-62+i),l.add(a)}return n.add(l),{group:l,geometry:t}}function I(e,n,o){let r=new e.Group;r.name="two-clear-negative-pressure-windows";let h=new e.MeshBasicMaterial({color:"#e8e1cd",transparent:!0,opacity:.34,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});o.push(h);for(let t=0;t<2;t+=1){let l=new e.Mesh(new e.RingGeometry(.72,.92,56),h);l.name=`clear-negative-pressure-window-${t+1}`,l.position.set(t===0?-2.1:2.1,.52,-10.5),l.rotation.set(.05,t===0?-.12:.12,0),l.userData.phase=t*Math.PI,B(l,-28+t),r.add(l)}return n.add(r),r}function P(e,n,o){let r=Math.sin(o);return[e*r*Math.sin(n),e*Math.cos(o),e*r*Math.cos(n)]}function _(e,n,o,r,h){let t=[new e.Color("#e8e1cd"),new e.Color("#070707"),new e.Color("#1aa39c"),new e.Color("#c59c29"),new e.Color("#a84424")],l=150,p=new Float32Array(l*2*3),i=new Float32Array(l*2*3);for(let a=0;a<l;a+=1){let x=o()<.72?(o()-.5)*1.9:o()*Math.PI*2,g=Math.PI*(.18+o()*.68),M=30+o()*36,d=P(M,x,g),m=P(M+(o()-.5)*2.2,x+(o()-.5)*.08,g+(o()-.5)*.11),v=t[a%t.length],f=a*6;p[f]=d[0],p[f+1]=d[1],p[f+2]=d[2],p[f+3]=m[0],p[f+4]=m[1],p[f+5]=m[2],i[f]=v.r,i[f+1]=v.g,i[f+2]=v.b,i[f+3]=v.r,i[f+4]=v.g,i[f+5]=v.b}let s=new e.BufferGeometry;s.setAttribute("position",new e.BufferAttribute(p,3)),s.setAttribute("color",new e.BufferAttribute(i,3)),h.push(s);let u=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:.62,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});r.push(u);let c=new e.LineSegments(s,u);return c.name="separated-pollock-pressure-drip-line-field",B(c,-18),n.add(c),c}function L(e,n,o,r,h){let l=new Float32Array(1260),p=new Float32Array(420*3),i=[new e.Color("#e8e1cd"),new e.Color("#070707"),new e.Color("#1aa39c"),new e.Color("#c59c29"),new e.Color("#a84424"),new e.Color("#173a4b")];for(let a=0;a<420;a+=1){let x=o()<.7?(o()-.5)*2.2:o()*Math.PI*2,g=Math.PI*(.16+o()*.72),M=18+o()*48,d=P(M,x,g);l[a*3]=d[0],l[a*3+1]=d[1],l[a*3+2]=d[2];let m=i[a%i.length];p[a*3]=m.r,p[a*3+1]=m.g,p[a*3+2]=m.b}let s=new e.BufferGeometry;s.setAttribute("position",new e.BufferAttribute(l,3)),s.setAttribute("color",new e.BufferAttribute(p,3)),h.push(s);let u=new e.PointsMaterial({size:.24,transparent:!0,opacity:.72,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1});r.push(u);let c=new e.Points(s,u);return c.name="separated-pollock-pigment-fleck-field",B(c,-16),n.add(c),c}function N({THREE:e,part:n,world:o,seed:r,utilities:h}){let t=new e.Group;t.name=A,t.userData={partId:n?.id||"world-environment",role:n?.role||"world-environment",staticOriginEnvironment:!0,avoidsCameraPinnedSkyboxUtility:!0,nonTileableTextureRemoved:!0};let l=W(h,r||n?.id||"world-environment","pollock-hantavirus-static-position-space"),p=Math.max(72,Math.min(112,Number(o?.environment?.skyboxRadius||o?.environment?.radius||96))),i=[],s=[],u=[],c=new e.SphereGeometry(p,160,80);u.push(c);let a=G(e);i.push(a);let y=new e.Mesh(c,a);y.name="static-origin-pollock-position-space-environment",y.userData={staticOriginEnvironmentShell:!0,cameraPinned:!1,projection:"position-space-procedural",sourceTextureTiling:"none"},B(y,-1e3),t.add(y);let{group:x,geometry:g}=O(e,t,l,s,i);u.push(g);let M=I(e,t,i),d=_(e,t,l,i,u),m=L(e,t,l,i,u);function v(w={}){let D=typeof w=="number"?w:Number(w.elapsedSeconds??w.time??0),S=Number.isFinite(D)?D:0;a.uniforms.uTime.value=S;for(let b of x.children)b.position.y=b.userData.baseY+Math.sin(S*.075+b.userData.phase)*b.userData.float,b.material.opacity=b.userData.baseOpacity*(.96+Math.sin(S*.11+b.userData.phase)*.035);M.rotation.z=Math.sin(S*.0012)*.025,d.rotation.y=Math.sin(S*.015)*.012,m.rotation.y=Math.sin(S*.018)*.018}function f(){z(t);for(let w of s)w.dispose?.();for(let w of u)w.dispose?.();for(let w of i)w.dispose?.()}return{object:t,update:v,dispose:f}}export{N as createImmersiveWorldPart};
