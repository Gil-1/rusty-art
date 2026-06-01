var y="art-direction-packet-80c3a4e62946",M="80c3a4e62946a149336361ed2f37e851";function S(e){let t=2166136261,n=String(e??"gorky-world-environment");for(let o=0;o<n.length;o+=1)t^=n.charCodeAt(o),t=Math.imul(t,16777619);return t>>>0}function U(e,t,n){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(t,n);let o=(S(t)^S(n))>>>0;return function(){o=o+1831565813>>>0;let a=o;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}function C(e,t){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=t,e}function B(e,t=64){let n=new Uint8Array(t*t*4),o=(t-1)*.5;for(let a=0;a<t;a+=1)for(let s=0;s<t;s+=1){let u=(s-o)/o,p=(a-o)/o,c=Math.sqrt(u*u+p*p),d=.88+.09*Math.sin(s*.71)+.07*Math.sin(a*1.17+s*.19),f=Math.max(0,Math.min(1,(1-c)/.34)),v=(a*t+s)*4;n[v]=255,n[v+1]=248,n[v+2]=226,n[v+3]=Math.round(255*f*f*d)}let r=new e.DataTexture(n,t,t,e.RGBAFormat);return r.needsUpdate=!0,r.wrapS=e.ClampToEdgeWrapping,r.wrapT=e.ClampToEdgeWrapping,r.minFilter=e.LinearFilter,r.magFilter=e.LinearFilter,r.generateMipmaps=!1,e.SRGBColorSpace&&(r.colorSpace=e.SRGBColorSpace),r}function P(e){return new e.ShaderMaterial({name:"gorky_again_position_space_wash_pressure_shell",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uPaper:{value:new e.Color("#eadcbc")},uPaperShadow:{value:new e.Color("#b99662")},uOcher:{value:new e.Color("#ba8731")},uBurntOrange:{value:new e.Color("#b95422")},uBrown:{value:new e.Color("#442b24")},uInk:{value:new e.Color("#111013")},uSmoke:{value:new e.Color("#777a82")},uGreen:{value:new e.Color("#2f8a59")},uOlive:{value:new e.Color("#788f47")},uBlue:{value:new e.Color("#116da1")},uViolet:{value:new e.Color("#64538b")},uRed:{value:new e.Color("#a8231a")},uYellow:{value:new e.Color("#d9a51c")}},vertexShader:`
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;

      uniform float uTime;
      uniform vec3 uPaper;
      uniform vec3 uPaperShadow;
      uniform vec3 uOcher;
      uniform vec3 uBurntOrange;
      uniform vec3 uBrown;
      uniform vec3 uInk;
      uniform vec3 uSmoke;
      uniform vec3 uGreen;
      uniform vec3 uOlive;
      uniform vec3 uBlue;
      uniform vec3 uViolet;
      uniform vec3 uRed;
      uniform vec3 uYellow;
      varying vec3 vLocalPosition;

      float saturate(float v) {
        return clamp(v, 0.0, 1.0);
      }

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
        float nx00 = mix(n000, n100, f.x);
        float nx10 = mix(n010, n110, f.x);
        float nx01 = mix(n001, n101, f.x);
        float nx11 = mix(n011, n111, f.x);
        float nxy0 = mix(nx00, nx10, f.y);
        float nxy1 = mix(nx01, nx11, f.y);
        return mix(nxy0, nxy1, f.z);
      }

      float fbm(vec3 p) {
        float total = 0.0;
        float amp = 0.54;
        for (int i = 0; i < 5; i += 1) {
          total += noise3(p) * amp;
          p = p * 2.03 + vec3(8.7, 3.1, 12.4);
          amp *= 0.5;
        }
        return total;
      }

      float segmentMask(vec2 p, vec2 a, vec2 b, float width) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
        float d = length(pa - ba * h);
        return 1.0 - smoothstep(width, width * 1.85, d);
      }

      float ellipseMask(vec2 p, vec2 center, vec2 scale, float feather) {
        vec2 q = (p - center) / scale;
        float d = length(q);
        return 1.0 - smoothstep(1.0, 1.0 + feather, d);
      }

      float ellipseBand(vec2 p, vec2 center, vec2 scale, float radius, float width) {
        vec2 q = (p - center) / scale;
        float d = abs(length(q) - radius);
        return 1.0 - smoothstep(width, width * 1.8, d);
      }

      float triangleMask(vec2 p, vec2 a, vec2 b, vec2 c, float feather) {
        float s1 = (a.x - c.x) * (p.y - c.y) - (a.y - c.y) * (p.x - c.x);
        float s2 = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
        float s3 = (c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x);
        float inside = min(min(s1, s2), s3);
        float outside = max(max(s1, s2), s3);
        float same = step(0.0, inside) + step(outside, 0.0);
        float edge = min(min(abs(s1), abs(s2)), abs(s3));
        return step(0.5, same) * smoothstep(0.0, feather, edge);
      }

      float triangleEdge(vec2 p, vec2 a, vec2 b, vec2 c, float width) {
        float e = segmentMask(p, a, b, width);
        e += segmentMask(p, b, c, width);
        e += segmentMask(p, c, a, width);
        return saturate(e);
      }

      float dotChain(vec2 p, vec2 a, vec2 b, float count, float radius) {
        vec2 ba = b - a;
        float h = clamp(dot(p - a, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
        vec2 q = a + ba * h;
        float cell = abs(fract(h * count) - 0.5);
        float d = length(p - q);
        float dotGate = 1.0 - smoothstep(0.16, 0.28, cell);
        return (1.0 - smoothstep(radius, radius * 1.8, d)) * dotGate;
      }

      float hatchField(vec2 p, float angle, float spacing, float width) {
        vec2 axis = vec2(cos(angle), sin(angle));
        float stripe = abs(fract(dot(p, axis) / spacing) - 0.5);
        return 1.0 - smoothstep(width, width * 2.15, stripe);
      }

      void main() {
        vec3 raw = vLocalPosition;
        vec3 dir = normalize(raw);
        vec3 p = dir * 3.2 + raw * 0.18;
        float poleFade = 1.0 - smoothstep(0.76, 0.96, abs(dir.y));
        float poleBlend = smoothstep(0.86, 0.985, abs(dir.y));
        float front = smoothstep(-0.25, 0.86, -dir.z);
        float back = smoothstep(-0.30, 0.82, dir.z);
        float side = smoothstep(0.12, 0.94, abs(dir.x));

        vec2 frontUv = vec2(dir.x / (0.62 + max(0.0, -dir.z) * 0.70), dir.y);
        vec2 sideUv = vec2(dir.z * sign(dir.x) / (0.62 + abs(dir.x) * 0.56), dir.y);
        vec2 backUv = vec2(-dir.x / (0.62 + max(0.0, dir.z) * 0.68), dir.y);

        float paper = fbm(p * 2.15 + vec3(0.0, uTime * 0.012, 0.0));
        float tooth = fbm(p * 13.0 + vec3(4.0, 9.0, 2.0));
        float rubbed = fbm(p * 5.4 + vec3(13.0, 1.0, 6.0));
        vec3 color = mix(uPaperShadow, uPaper, smoothstep(-0.82, 0.78, dir.y));
        color *= 0.86 + 0.20 * paper + 0.08 * tooth;

        float lowOchre = smoothstep(-0.92, -0.18, -dir.y) * (0.35 + 0.48 * fbm(p * 1.1));
        color = mix(color, uOcher * (0.92 + 0.14 * tooth), lowOchre * 0.36);

        float orangeWash = ellipseMask(frontUv, vec2(-0.18, -0.06), vec2(0.78, 0.50), 0.28) * front;
        orangeWash += ellipseMask(backUv, vec2(0.24, -0.16), vec2(0.68, 0.45), 0.32) * back * 0.78;
        orangeWash += ellipseMask(sideUv, vec2(-0.18, 0.04), vec2(0.55, 0.48), 0.38) * side * 0.58;
        color = mix(color, uBurntOrange * (0.80 + 0.20 * rubbed), saturate(orangeWash) * 0.34);

        float smokyOval = ellipseMask(frontUv, vec2(0.22, 0.02), vec2(0.29, 0.46), 0.18) * front;
        smokyOval += ellipseMask(backUv, vec2(-0.34, 0.10), vec2(0.23, 0.34), 0.2) * back * 0.8;
        color = mix(color, mix(uSmoke, uBrown, 0.28), smokyOval * 0.38);

        float ocherTriangle = triangleMask(frontUv, vec2(-0.18, -0.52), vec2(0.03, -0.07), vec2(0.22, -0.53), 0.018) * front;
        float blackTriangle = triangleMask(frontUv, vec2(0.00, 0.08), vec2(0.34, 0.72), vec2(0.47, -0.03), 0.018) * front;
        float greenTriangle = triangleMask(sideUv, vec2(0.28, -0.36), vec2(0.56, 0.20), vec2(0.76, -0.30), 0.018) * side;
        float violetPlane = triangleMask(backUv, vec2(-0.54, 0.32), vec2(-0.14, 0.08), vec2(-0.50, -0.08), 0.018) * back;
        color = mix(color, uYellow * (0.84 + 0.13 * tooth), ocherTriangle * 0.78);
        color = mix(color, uInk, blackTriangle * 0.92);
        color = mix(color, uGreen * (0.82 + 0.16 * tooth), greenTriangle * 0.72);
        color = mix(color, uViolet * (0.78 + 0.15 * tooth), violetPlane * 0.64);

        float redSignal = triangleMask(frontUv, vec2(0.38, -0.06), vec2(0.74, 0.08), vec2(0.46, 0.16), 0.012) * front;
        redSignal += ellipseMask(sideUv, vec2(-0.58, 0.18), vec2(0.07, 0.10), 0.06) * side;
        float blueSignal = triangleMask(frontUv, vec2(-0.54, -0.06), vec2(-0.37, 0.18), vec2(-0.31, -0.18), 0.014) * front;
        blueSignal += triangleMask(backUv, vec2(0.42, -0.38), vec2(0.68, 0.08), vec2(0.79, -0.42), 0.016) * back;
        color = mix(color, uRed * (0.88 + 0.12 * tooth), redSignal * 0.86);
        color = mix(color, uBlue * (0.82 + 0.14 * tooth), blueSignal * 0.82);

        float contours = 0.0;
        contours += ellipseBand(frontUv, vec2(-0.52, 0.10), vec2(0.30, 0.52), 0.86, 0.040) * front;
        contours += ellipseBand(frontUv, vec2(0.27, 0.00), vec2(0.31, 0.51), 0.94, 0.030) * front;
        contours += ellipseBand(backUv, vec2(-0.32, 0.10), vec2(0.26, 0.38), 0.92, 0.035) * back;
        contours += triangleEdge(frontUv, vec2(-0.18, -0.52), vec2(0.03, -0.07), vec2(0.22, -0.53), 0.014) * front;
        contours += triangleEdge(frontUv, vec2(0.00, 0.08), vec2(0.34, 0.72), vec2(0.47, -0.03), 0.017) * front;
        contours += segmentMask(frontUv, vec2(-0.88, -0.34), vec2(-0.16, -0.18), 0.021) * front;
        contours += segmentMask(frontUv, vec2(-0.78, 0.34), vec2(0.05, 0.56), 0.017) * front;
        contours += segmentMask(frontUv, vec2(0.06, -0.54), vec2(0.78, -0.30), 0.018) * front;
        contours += segmentMask(sideUv, vec2(-0.76, 0.50), vec2(0.68, 0.18), 0.016) * side;
        contours += segmentMask(backUv, vec2(-0.72, -0.46), vec2(0.54, -0.16), 0.018) * back;
        color = mix(color, uInk, saturate(contours * poleFade) * 0.88);

        float dots = 0.0;
        dots += dotChain(frontUv, vec2(-0.72, 0.48), vec2(0.34, 0.33), 13.0, 0.029) * front;
        dots += dotChain(frontUv, vec2(-0.20, -0.42), vec2(0.72, -0.30), 11.0, 0.025) * front;
        dots += dotChain(sideUv, vec2(-0.70, -0.10), vec2(0.66, 0.30), 12.0, 0.028) * side;
        dots += dotChain(backUv, vec2(-0.58, 0.42), vec2(0.62, 0.58), 10.0, 0.025) * back;
        color = mix(color, uInk, saturate(dots * poleFade) * 0.80);

        float hatching = 0.0;
        hatching += hatchField(frontUv + vec2(0.04 * paper, 0.0), 2.35, 0.052, 0.078) * smokyOval * 0.74;
        hatching += hatchField(frontUv + vec2(0.02 * rubbed, 0.0), -0.55, 0.064, 0.055) * orangeWash * 0.17;
        hatching += hatchField(sideUv, 1.48, 0.048, 0.064) * side * smoothstep(0.42, 0.88, abs(sideUv.x)) * 0.18;
        hatching += smoothstep(0.78, 0.98, noise3(p * 39.0 + vec3(1.0, 3.0, 9.0))) * 0.06;
        color = mix(color, uInk, saturate(hatching * poleFade) * 0.46);

        float measuredPressure = smoothstep(-0.18, 0.72, -dir.z) * (0.11 + 0.05 * sin(uTime * 0.55));
        color = mix(color, uBrown, measuredPressure * (0.20 + 0.22 * (1.0 - abs(dir.y))));

        vec3 poleColor = mix(uPaperShadow, uPaper, smoothstep(-0.95, 0.95, dir.y)) * (0.94 + 0.08 * paper);
        color = mix(color, poleColor, poleBlend);
        color = pow(max(color, vec3(0.0)), vec3(0.93));
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function F(e,t,n){let o=new e.Group;o.name="single-gorky-again-fallback-skybox-shell",o.userData={partId:"world-environment",role:"world-environment",packetId:y,packetHash:M,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,environmentGeometryKind:"box",environmentRadius:t};let r=new e.BoxGeometry(2/Math.sqrt(3),2/Math.sqrt(3),2/Math.sqrt(3),1,1,1),a=new e.Mesh(r,n);return a.name="gorky-position-space-paper-pressure-shell-mesh",a.scale.setScalar(t),a.onBeforeRender=function(u,p,c){c&&c.position&&(o.position.copy(c.position),o.updateMatrixWorld(!0))},C(a,-1e3),o.renderOrder=-1e3,o.frustumCulled=!1,o.add(a),o.mesh=a,o.geometry=r,o.material=n,o}function I(e,t,n){let o=e.object||e,r=e.mesh||o.mesh||o.children?.find(a=>a&&a.isMesh);return o.name="single-gorky-again-pressure-skybox-shell",o.userData={...o.userData,partId:"world-environment",role:"world-environment",packetId:y,packetHash:M,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,environmentGeometryKind:"box",environmentRadius:n,singleShellReview:"dominant Gorky paper wash, black contour pressure, and accent signals live in this one enclosing shell"},o.renderOrder=-1e3,o.frustumCulled=!1,r&&(r.material&&r.material!==t&&typeof r.material.dispose=="function"&&r.material.dispose(),r.name="gorky-position-space-paper-pressure-shell-mesh",r.material=t,r.scale.setScalar(n),C(r,-1e3)),o}function A(e,t){let o=new Float32Array(552),r=new Float32Array(552),a=[new e.Color("#111013"),new e.Color("#111013"),new e.Color("#5d4f3f"),new e.Color("#a8231a"),new e.Color("#2f6f55"),new e.Color("#116da1")];for(let c=0;c<92;c+=1){let d=c%2===0?-1:1,f=-.95+t()*1.9,v=5+t()*11.8,b=-3.4-t()*15,k=Math.sin(f)*v+d*(c%7===0?3.6+t()*4.2:0),g=-3+t()*6.3,x=.8+t()*3.4,m=k+d*x*(.55+t()*.55),i=g+(t()-.5)*1.1+Math.sin(c*.73)*.28,w=b-t()*1.7,l=c*6;o[l]=k,o[l+1]=g,o[l+2]=b,o[l+3]=m,o[l+4]=i,o[l+5]=w;let h=a[c%a.length];r[l]=h.r,r[l+1]=h.g,r[l+2]=h.b,r[l+3]=h.r,r[l+4]=h.g,r[l+5]=h.b}let s=new e.BufferGeometry;s.setAttribute("position",new e.BufferAttribute(o,3)),s.setAttribute("color",new e.BufferAttribute(r,3));let u=new e.LineBasicMaterial({name:"dry-black-muted-color-contour-pressure-lines",vertexColors:!0,transparent:!0,opacity:.54,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}),p=new e.LineSegments(s,u);return p.name="ordinary-depth-gorky-erratic-contour-field",C(p,-42),{object:p,geometry:s,material:u}}function G(e,t,n){let r=new Float32Array(720),a=new Float32Array(720),s=[new e.Color("#111013"),new e.Color("#a8231a"),new e.Color("#2f8a59"),new e.Color("#116da1"),new e.Color("#d9a51c"),new e.Color("#eadcbc")];for(let d=0;d<240;d+=1){let f=Math.floor(d/12),v=d%12/11,k=(f%2===0?-1:1)*(2.2+f%5*.8)+Math.sin(v*Math.PI*1.3+f)*2.3,g=-2.8+f*.71%5.6+Math.sin(v*Math.PI)*.55,x=-4.5-f%9*1.45-t()*.6,m=d*3;r[m]=k+(t()-.5)*.18,r[m+1]=g+(t()-.5)*.16,r[m+2]=x-v*(1.2+t()*1.6);let i=s[(f+d)%s.length];a[m]=i.r,a[m+1]=i.g,a[m+2]=i.b}let u=new e.BufferGeometry;u.setAttribute("position",new e.BufferAttribute(r,3)),u.setAttribute("color",new e.BufferAttribute(a,3));let p=new e.PointsMaterial({name:"matte-gorky-dotted-chain-pigment",size:.34,map:n,alphaMap:n,vertexColors:!0,transparent:!0,opacity:.58,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1}),c=new e.Points(u,p);return c.name="ordinary-depth-again-dotted-chain-pressure",C(c,-36),{object:c,geometry:u,material:p}}function O({THREE:e,part:t,world:n,seed:o,utilities:r}){let a=new e.Group;a.name="world-environment-gorky-again-fracture-pressure",a.userData={partId:"world-environment",role:t?.role||"world-environment",packetId:y,packetHash:M,artist:"Arshile Gorky",selectedNews:'"The risk for Lukashenko would be enormous": why it seems unlikely that Russia will attack Ukraine (again) via Belarus',shellCountIntent:1};let s=[],u=[],p=[],c=U(r,o||t?.id||"world-environment","gorky-again-world-environment"),d=Number(n?.environment?.skyboxRadius||n?.environment?.radius),f=Number.isFinite(d)&&d>0?Math.max(58,Math.min(120,d)):88,v=P(e);u.push(v);let b;r&&typeof r.createSkyboxShell=="function"?b=r.createSkyboxShell({radius:f,name:"single-gorky-again-pressure-skybox-shell",geometryKind:"box",color:"#eadcbc",opacity:1,cameraPinned:!0,userData:{partId:"world-environment",role:"world-environment",packetId:y,packetHash:M,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0}}):(b=F(e,f,v),b.geometry&&s.push(b.geometry)),a.add(I(b,v,f));let k=B(e);p.push(k);let g=A(e,c);s.push(g.geometry),u.push(g.material),a.add(g.object);let x=G(e,c,k);s.push(x.geometry),u.push(x.material),a.add(x.object);function m(i={}){let w=i.captureMode?0:Number(i.elapsedSeconds??i.time??0),l=Number.isFinite(w)?w:0,h=Number.isFinite(i.motionIntensity)?i.motionIntensity:1;v.uniforms.uTime.value=l,g.object.rotation.y=Math.sin(l*.031)*.022*h,g.object.rotation.z=Math.sin(l*.047)*.01*h,x.object.rotation.y=Math.sin(l*.025)*.028*h,x.material.opacity=.54+Math.sin(l*.19)*.035*h}return m({captureMode:!0,elapsedSeconds:0}),{object:a,update:m,dispose(){for(let i of s)i?.dispose?.();for(let i of u)i?.dispose?.();for(let i of p)i?.dispose?.()}}}export{O as createImmersiveWorldPart};
