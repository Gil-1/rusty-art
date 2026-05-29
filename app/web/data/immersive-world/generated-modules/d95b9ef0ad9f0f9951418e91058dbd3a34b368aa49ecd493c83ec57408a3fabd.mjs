var Z="art-direction-packet-cc542c69d2aa",j="cc542c69d2aa779e6b2189f26f92f7a6";function te(e){let a=String(e??"world-environment-rothko-brussels"),i=2166136261;for(let t=0;t<a.length;t+=1)i^=a.charCodeAt(t),i=Math.imul(i,16777619);return i>>>0}function re(e,a,i){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(a,i);let t=(te(a)^te(i))>>>0;return function(){t=t+1831565813>>>0;let r=t;return r=Math.imul(r^r>>>15,r|1),r^=r+Math.imul(r^r>>>7,r|61),((r^r>>>14)>>>0)/4294967296}}function D(e){return Math.max(0,Math.min(1,e))}function z(e,a){return e.castShadow=!1,e.receiveShadow=!1,e.frustumCulled=!1,e.renderOrder=a,e}function ae(e){e.traverse(a=>{a.geometry&&typeof a.geometry.dispose=="function"&&a.geometry.dispose();let i=Array.isArray(a.material)?a.material:[a.material].filter(Boolean);for(let t of i)t.map&&typeof t.map.dispose=="function"&&t.map.dispose(),t.alphaMap&&t.alphaMap!==t.map&&typeof t.alphaMap.dispose=="function"&&t.alphaMap.dispose(),typeof t.dispose=="function"&&t.dispose()})}function ne(e){let a=Number(e?.environment?.skyboxRadius||e?.environment?.radius);return Number.isFinite(a)&&a>0?Math.max(56,Math.min(110,a)):86}function se(e,a,i){let t=new e.Group;t.name="single-rothko-brussels-pressure-skybox-shell",t.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,environmentGeometryKind:"box",environmentRadius:a};let s=new e.BoxGeometry(2/Math.sqrt(3),2/Math.sqrt(3),2/Math.sqrt(3),1,1,1),r=new e.Mesh(s,i);return r.name="rothko-position-space-stacked-field-shell-mesh",r.scale.setScalar(a),z(r,-1e3),t.add(r),t.mesh=r,t.object=t,t.geometry=s,t.material=i,t.dispose=function(){s.dispose(),i.dispose()},t}function ie(e){return new e.ShaderMaterial({name:"single-rothko-brussels-thunder-pressure-skybox-material",side:e.BackSide,depthWrite:!1,depthTest:!1,transparent:!1,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uBloom:{value:0}},vertexShader:`
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      uniform float uTime;
      uniform float uBloom;
      varying vec3 vLocalPosition;

      float sat(float v) { return clamp(v, 0.0, 1.0); }

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
          mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amp * noise(p);
          p = mat2(1.63, 1.12, -1.12, 1.63) * p + vec2(17.0, 9.0);
          amp *= 0.52;
        }
        return value;
      }

      float band(float y, float center, float halfHeight, float feather) {
        float lower = smoothstep(center - halfHeight - feather, center - halfHeight + feather, y);
        float upper = 1.0 - smoothstep(center + halfHeight - feather, center + halfHeight + feather, y);
        return lower * upper;
      }

      void main() {
        vec3 dir = normalize(vLocalPosition);
        float y = dir.y * 0.5 + 0.5;
        vec2 domain = vec2(atan(dir.x, -dir.z) / 6.2831853, y);
        vec2 flatDomain = vec2(dir.x * 1.35 + dir.z * 0.18, y * 2.2);
        float warp = fbm(flatDomain * 2.2 + vec2(0.0, uTime * 0.012));
        float grain = fbm(flatDomain * 13.0 + warp * 3.0);
        float cloud = fbm(flatDomain * 4.2 + vec2(warp * 1.7, -uTime * 0.018));

        vec3 charcoal = vec3(0.045, 0.039, 0.035);
        vec3 smoke = vec3(0.12, 0.13, 0.105);
        vec3 ochre = vec3(0.73, 0.42, 0.13);
        vec3 burntOchre = vec3(0.55, 0.23, 0.11);
        vec3 burgundy = vec3(0.23, 0.075, 0.085);
        vec3 umber = vec3(0.16, 0.085, 0.065);
        vec3 teal = vec3(0.025, 0.32, 0.34);
        vec3 cobalt = vec3(0.03, 0.18, 0.78);
        vec3 greyGreen = vec3(0.24, 0.28, 0.24);

        float lowerWeight = band(y + (warp - 0.5) * 0.035, 0.18, 0.115, 0.065);
        float blueWeight = band(y + (warp - 0.5) * 0.025, 0.315, 0.043, 0.03);
        float darkMiddle = band(y + (cloud - 0.5) * 0.03, 0.47, 0.155, 0.07);
        float rustHeart = band(y + (warp - 0.5) * 0.04, 0.555, 0.07, 0.055);
        float upperOchre = band(y + (cloud - 0.5) * 0.045, 0.74, 0.13, 0.08);
        float topStorm = smoothstep(0.81, 0.98, y);
        float bottomDark = 1.0 - smoothstep(0.05, 0.23, y);

        vec3 color = mix(charcoal, smoke, y * 0.28);
        color = mix(color, greyGreen, lowerWeight * 0.72);
        color = mix(color, mix(teal, cobalt, 0.35 + 0.42 * cloud), blueWeight * (0.78 + 0.35 * grain));
        color = mix(color, burgundy, darkMiddle * (0.9 + 0.25 * cloud));
        color = mix(color, burntOchre, rustHeart * 0.58);
        color = mix(color, ochre, upperOchre * (0.82 + 0.24 * grain));
        color = mix(color, charcoal, topStorm * (0.72 + 0.2 * cloud));
        color = mix(color, vec3(0.025, 0.02, 0.018), bottomDark * 0.58);

        float sidePressure = smoothstep(0.35, 0.92, abs(dir.x)) + smoothstep(0.42, 0.95, dir.z);
        float cornerSmoke = sat(sidePressure * 0.65 + pow(abs(dir.x), 4.0) * 0.55);
        color = mix(color, charcoal, cornerSmoke * (0.56 + 0.16 * grain));

        float seamY = abs(y - (0.365 + (warp - 0.5) * 0.018));
        float coldSeam = smoothstep(0.035, 0.0, seamY) * (0.45 + 0.45 * cloud);
        color += vec3(0.0, 0.065, 0.08) * coldSeam;

        float pressureCenter = exp(-dir.x * dir.x * 5.5 - (y - 0.35) * (y - 0.35) * 70.0);
        color += vec3(0.02, 0.18, 0.20) * pressureCenter * (0.75 + uBloom * 0.2);

        float verticalWash = pow(abs(sin((domain.x + grain * 0.045) * 118.0)), 18.0);
        verticalWash *= smoothstep(0.48, 0.86, y) * (1.0 - smoothstep(0.91, 0.99, y));
        color = mix(color, charcoal, verticalWash * 0.12);

        float fracture = pow(1.0 - sat(abs(dir.x + (noise(vec2(y * 8.0, 3.1)) - 0.5) * 0.08) / 0.055), 2.2);
        fracture *= smoothstep(0.22, 0.72, y) * (1.0 - smoothstep(0.77, 0.98, y));
        color = mix(color, vec3(0.08, 0.02, 0.018), fracture * 0.32);
        color += vec3(0.11, 0.22, 0.24) * fracture * 0.08;

        float weaveX = sin((dir.x * 0.72 + dir.z * 0.36) * 360.0);
        float weaveY = sin(y * 520.0 + warp * 2.0);
        float weave = (weaveX + weaveY) * 0.5;
        color *= 0.93 + 0.12 * grain + weave * 0.018;
        color = pow(max(color, vec3(0.0)), vec3(0.92));
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function le(e,a,i,t={}){let s=t.width||192,r=t.height||80,n=t.edgeFeather??.18,g=t.alphaScale??1,M=t.streak??.12,w=new e.Color(i),y=new Uint8Array(s*r*4),v=new Float32Array(s);for(let d=0;d<s;d+=1)v[d]=.78+a()*.28+Math.sin(d*.09+a()*2)*.04;for(let d=0;d<r;d+=1)for(let h=0;h<s;h+=1){let S=h/(s-1),O=d/(r-1),P=Math.min(S,1-S,O,1-O),X=D(P/n),G=Math.sin(h*.37+d*.06)*M+Math.sin(h*.071-d*.18)*.06,I=(h%9===0?-.035:0)+(d%8===0?-.03:0),k=(a()-.5)*.15,x=D(.82+v[h]*.14+G+I+k),L=D(X*(.7+a()*.25+Math.sin((h+d)*.19)*.045)*g),F=(d*s+h)*4;y[F]=Math.round(D(w.r*x*1.2)*255),y[F+1]=Math.round(D(w.g*x*1.2)*255),y[F+2]=Math.round(D(w.b*x*1.2)*255),y[F+3]=Math.round(L*255)}let c=new e.DataTexture(y,s,r,e.RGBAFormat);return c.needsUpdate=!0,c.wrapS=e.ClampToEdgeWrapping,c.wrapT=e.ClampToEdgeWrapping,c.minFilter=e.LinearFilter,c.magFilter=e.LinearFilter,c.generateMipmaps=!1,e.SRGBColorSpace&&(c.colorSpace=e.SRGBColorSpace),c}function ce(e){let t=new Uint8Array(16384);for(let r=0;r<64;r+=1)for(let n=0;n<64;n+=1){let g=Math.hypot(n-31.5,r-31.5)/29.44,M=D(1-g),w=M*M*(3-2*M),y=(r*64+n)*4;t[y]=255,t[y+1]=255,t[y+2]=255,t[y+3]=Math.round(w*255)}let s=new e.DataTexture(t,64,64,e.RGBAFormat);return s.needsUpdate=!0,s.wrapS=e.ClampToEdgeWrapping,s.wrapT=e.ClampToEdgeWrapping,s.minFilter=e.LinearFilter,s.magFilter=e.LinearFilter,s.generateMipmaps=!1,e.SRGBColorSpace&&(s.colorSpace=e.SRGBColorSpace),s}function de(e,a,i,t,s){let r=new e.Mesh(a,i);return r.name=t.name,r.position.set(t.position[0],t.position[1],t.position[2]),r.rotation.set(t.rotation[0],t.rotation[1],t.rotation[2]),r.scale.set(t.scale[0],t.scale[1],1),r.userData.baseY=r.position.y,r.userData.baseOpacity=t.opacity,r.userData.phase=s()*Math.PI*2,r.userData.floatAmount=t.floatAmount??.018,z(r,t.renderOrder),r}function ue({THREE:e,part:a,world:i,seed:t,camera:s,utilities:r}={}){let n=re(r,t||a?.id||"world-environment","rothko-brussels-20km-thunder-pressure"),g=new e.Group;g.name="world-environment-rothko-brussels-20km-thunder-pressure",g.userData={partId:"world-environment",role:a?.role||"world-environment",packetId:Z,packetHash:j,selectedNews:"Nearly 50,000 people to run 20 km through Brussels on Sunday, thunderstorms forecast",artist:"Mark Rothko",shellCountIntent:1};let M=ne(i),w=ie(e),y=r&&typeof r.createSkyboxShell=="function"?r.createSkyboxShell({radius:M,name:"single-rothko-brussels-pressure-skybox-shell",geometryKind:"box",color:"#100b0b",opacity:1,cameraPinned:!0,userData:{partId:"world-environment",role:"world-environment",packetId:Z,packetHash:j,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,singleShellReview:"dominant Mark Rothko stacked color-field environment"}}):se(e,M,w),v=y.object||y,c=y.mesh||v.mesh||v.children.find(o=>o&&o.isMesh);c&&(c.material&&c.material!==w&&typeof c.material.dispose=="function"&&c.material.dispose(),c.name="rothko-position-space-stacked-field-shell-mesh",c.material=w,c.scale.setScalar(M),z(c,-1e3)),v.name="single-rothko-brussels-pressure-skybox-shell",v.userData={...v.userData,partId:"world-environment",role:"world-environment",packetId:Z,packetHash:j,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,environmentRadius:M},v.onBeforeRender=function(m,l,u){u&&u.position&&(v.position.copy(u.position),v.updateMatrixWorld(!0))},g.add(v);let d=[],h=[w],S=[],O=new e.PlaneGeometry(1,1,1,1);S.push(O);let P=new e.Group;P.name="ordinary-depth-stacked-rothko-pressure-fields";let X=[{name:"front-upper-ochre-thunder-lit-field",color:"#a6601e",opacity:.46,position:[0,3.2,-10.8],rotation:[-.02,0,.004],scale:[42,6.4],renderOrder:-72,edgeFeather:.22},{name:"front-dark-maroon-runner-pressure-block",color:"#3b1212",opacity:.58,position:[0,.82,-9.7],rotation:[.012,0,-.006],scale:[44,5.3],renderOrder:-70,edgeFeather:.18},{name:"front-rust-brussels-concentrated-spread",color:"#73301d",opacity:.54,position:[0,-.62,-8.8],rotation:[.016,0,.008],scale:[40,3.3],renderOrder:-68,edgeFeather:.2},{name:"front-blue-green-20km-weather-seam",color:"#075760",opacity:.74,position:[0,-1.42,-7.9],rotation:[.012,0,-.003],scale:[38,.86],renderOrder:-64,edgeFeather:.28,floatAmount:.01},{name:"front-cobalt-low-high-chroma-strip",color:"#063dc7",opacity:.44,position:[-2.2,-1.68,-7.6],rotation:[.012,.016,-.008],scale:[24,.42],renderOrder:-63,edgeFeather:.32,floatAmount:.008},{name:"near-black-horizontal-fracture-anchor",color:"#0b0808",opacity:.82,position:[0,-.12,-7.1],rotation:[.01,0,.002],scale:[41,.78],renderOrder:-60,edgeFeather:.24,floatAmount:.006},{name:"left-smoked-brussels-side-pressure",color:"#211018",opacity:.36,position:[-15.6,.2,-3.2],rotation:[0,1.08,-.03],scale:[21,6.2],renderOrder:-58,edgeFeather:.16},{name:"right-teal-storm-side-pressure",color:"#0a3435",opacity:.34,position:[15.6,.15,-3.4],rotation:[0,-1.08,.03],scale:[21,6.1],renderOrder:-57,edgeFeather:.16},{name:"low-foreground-smoky-umber-field",color:"#302018",opacity:.3,position:[0,-3.8,2.8],rotation:[.18,0,0],scale:[40,4.4],renderOrder:-50,edgeFeather:.18}];for(let o of X){let m=le(e,n,o.color,{edgeFeather:o.edgeFeather,alphaScale:.94,streak:o.name.includes("fracture")?.2:.12});d.push(m);let l=new e.MeshBasicMaterial({name:`${o.name}-matte-stain-material`,map:m,transparent:!0,opacity:o.opacity,depthWrite:!1,depthTest:!0,side:e.DoubleSide,fog:!1,toneMapped:!1});h.push(l),P.add(de(e,O,l,o,n))}g.add(P);let G=new e.BufferGeometry;S.push(G);let I=96,k=new Float32Array(I*2*3),x=new Float32Array(I*2*3),L=[new e.Color("#0b0808"),new e.Color("#7d2c18"),new e.Color("#0a4d51"),new e.Color("#244a42"),new e.Color("#b07122")];for(let o=0;o<I;o+=1){let m=o%4===0,l=m?(n()-.5)*2.2:-19+n()*38,u=m?-.44+(n()-.5)*.9:-3.2+n()*6.7,p=-3.4-n()*11.5,f=m?.3+n()*.9:1.2+n()*4.8,C=(n()-.5)*.38,b=o*6;k[b]=l,k[b+1]=u,k[b+2]=p,k[b+3]=l+f,k[b+4]=u+C,k[b+5]=p-n()*.55;let W=L[o%L.length];x[b]=W.r,x[b+1]=W.g,x[b+2]=W.b,x[b+3]=W.r,x[b+4]=W.g,x[b+5]=W.b}G.setAttribute("position",new e.BufferAttribute(k,3)),G.setAttribute("color",new e.BufferAttribute(x,3));let F=new e.LineBasicMaterial({name:"ragged-brussels-fracture-pressure-seams",vertexColors:!0,transparent:!0,opacity:.46,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});h.push(F);let N=new e.LineSegments(G,F);N.name="ragged-fracture-pressure-seams-through-stacked-fields",z(N,-42),g.add(N);let $=ce(e);d.push($);let Y=new e.BufferGeometry;S.push(Y);let J=420,K=new Float32Array(J*3),U=new Float32Array(J*3),T=[new e.Color("#063dc7"),new e.Color("#0a4d51"),new e.Color("#7d2c18"),new e.Color("#b07122"),new e.Color("#101010")];for(let o=0;o<J;o+=1){let m=o%5===0,l=n()*Math.PI*2,u=m?2.4+n()*6.2:5.5+n()*12.5;K[o*3]=Math.sin(l)*u,K[o*3+1]=m?-1.7+(n()-.5)*.72:-3.1+n()*6.2,K[o*3+2]=Math.cos(l)*u-4.8-n()*5.8;let p=T[o%T.length];U[o*3]=p.r,U[o*3+1]=p.g,U[o*3+2]=p.b}Y.setAttribute("position",new e.BufferAttribute(K,3)),Y.setAttribute("color",new e.BufferAttribute(U,3));let R=new e.PointsMaterial({name:"soft-pigment-grains-for-fifty-thousand-pressure",map:$,alphaMap:$,size:.32,transparent:!0,opacity:.46,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1,alphaTest:.02});h.push(R);let _=new e.Points(Y,R);_.name="concentrated-soft-pigment-crowd-pressure-field",z(_,-38),g.add(_);let q=new e.BufferGeometry;S.push(q);let Q=54,A=new Float32Array(Q*2*3),B=new Float32Array(Q*2*3),H=[new e.Color("#202421"),new e.Color("#2c3430"),new e.Color("#0b454d")];for(let o=0;o<Q;o+=1){let m=-22+n()*44,l=4.4+n()*1.5,u=1.3+n()*3.6,p=-9.5-n()*16,f=o*6;A[f]=m,A[f+1]=l,A[f+2]=p,A[f+3]=m+(n()-.5)*.35,A[f+4]=l-u,A[f+5]=p-n()*.7;let C=H[o%H.length];B[f]=C.r,B[f+1]=C.g,B[f+2]=C.b,B[f+3]=C.r,B[f+4]=C.g,B[f+5]=C.b}q.setAttribute("position",new e.BufferAttribute(A,3)),q.setAttribute("color",new e.BufferAttribute(B,3));let E=new e.LineBasicMaterial({name:"muted-thunderstorm-wash-curtains",vertexColors:!0,transparent:!0,opacity:.28,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1});h.push(E);let V=new e.LineSegments(q,E);V.name="muted-overhead-thunderstorm-wash-curtains",z(V,-44),g.add(V);function ee(o={}){let m=o.captureMode?0:Number(o.elapsedSeconds??o.time??0),l=Number.isFinite(m)?m:0;w.uniforms.uTime.value=l,w.uniforms.uBloom.value=.5+Math.sin(l*.08)*.5;let u=Number.isFinite(o.motionIntensity)?o.motionIntensity:1;for(let p of P.children){let f=Math.sin(l*.075+p.userData.phase)*p.userData.floatAmount*u;p.position.y=p.userData.baseY+f,p.material.opacity=p.userData.baseOpacity*(.965+Math.sin(l*.11+p.userData.phase)*.025*u)}N.rotation.z=Math.sin(l*.035)*.006*u,_.rotation.y=Math.sin(l*.028)*.026*u,V.position.y=Math.sin(l*.05)*.035*u,o.camera&&s&&s.position&&(v.position.copy(o.camera.position),v.updateMatrixWorld(!0))}function oe(){ae(g);for(let o of d)o.dispose?.();for(let o of S)o.dispose?.();for(let o of h)o.dispose?.()}return ee({captureMode:!0,elapsedSeconds:0}),{object:g,update:ee,dispose:oe}}export{ue as createImmersiveWorldPart};
