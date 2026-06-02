var z="art-direction-packet-b947f931d024",B="b947f931d024de6ad4194f1efcfa9c44";function P(e,t,u){if(e&&typeof e.createSeededRandom=="function")return e.createSeededRandom(t||"world-environment",u);let c=2166136261,o=`${t||"world-environment"}:${u||"hawkins"}`;for(let n=0;n<o.length;n+=1)c^=o.charCodeAt(n),c=Math.imul(c,16777619);return function(){c+=1831565813;let a=c;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}function A(e){return new e.ShaderMaterial({name:"hawkins-roland-garros-single-position-space-skybox-material",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0}},vertexShader:`
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      uniform float uTime;
      varying vec3 vLocalPosition;

      float hash13(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.17, 0.41, 0.73));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }

      float valueNoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
        float nx00 = mix(n000, n100, f.x);
        float nx10 = mix(n010, n110, f.x);
        float nx01 = mix(n001, n101, f.x);
        float nx11 = mix(n011, n111, f.x);
        float nxy0 = mix(nx00, nx10, f.y);
        float nxy1 = mix(nx01, nx11, f.y);
        return mix(nxy0, nxy1, f.z);
      }

      float fbm(vec3 p) {
        float sum = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i += 1) {
          sum += valueNoise(p) * amp;
          p = p * 2.03 + vec3(7.1, 3.7, 5.3);
          amp *= 0.5;
        }
        return sum;
      }

      float ellipse(vec2 p, vec2 center, vec2 radius) {
        vec2 q = (p - center) / radius;
        return smoothstep(1.0, 0.36, dot(q, q));
      }

      float stripe(float value, float center, float width) {
        return smoothstep(width, 0.0, abs(value - center));
      }

      void main() {
        vec3 dir = normalize(vLocalPosition);
        float height = dir.y * 0.5 + 0.5;
        float front = smoothstep(0.02, 0.74, -dir.z);
        float back = smoothstep(0.1, 0.82, dir.z);
        float side = 1.0 - abs(dir.z);
        float poleFade = 1.0 - smoothstep(0.82, 0.99, abs(dir.y));
        float drift = uTime * 0.018;

        float wash = fbm(dir * 4.2 + vec3(drift, -drift * 0.6, drift * 0.4));
        float fine = fbm(dir * 18.0 + vec3(1.7, drift, 4.1));
        float canvasWeave = (stripe(fract((dir.x + dir.z) * 46.0), 0.5, 0.045) + stripe(fract(dir.y * 58.0), 0.5, 0.038)) * 0.035;

        vec3 upperMist = vec3(0.68, 0.74, 0.69);
        vec3 tealHaze = vec3(0.36, 0.51, 0.50);
        vec3 violetShadow = vec3(0.19, 0.20, 0.24);
        vec3 clay = vec3(0.52, 0.31, 0.16);
        vec3 ocher = vec3(0.66, 0.52, 0.27);
        vec3 blackDrapery = vec3(0.045, 0.052, 0.052);
        vec3 ivory = vec3(0.78, 0.72, 0.57);
        vec3 mutedYellow = vec3(0.69, 0.61, 0.31);

        vec3 sky = mix(tealHaze, upperMist, smoothstep(0.24, 0.84, height));
        sky = mix(sky, violetShadow, smoothstep(0.1, 0.86, side) * 0.28);
        sky += (wash - 0.5) * vec3(0.11, 0.10, 0.07);

        float groundBand = smoothstep(0.45, 0.16, height);
        vec3 ground = mix(clay, ocher, smoothstep(0.08, 0.46, height) + wash * 0.2);
        vec3 color = mix(sky, ground, groundBand);

        float darkBody = ellipse(vec2(dir.x, dir.y), vec2(-0.05, -0.14), vec2(0.44, 0.66)) * front;
        float hairMass = ellipse(vec2(dir.x, dir.y), vec2(-0.36, 0.19), vec2(0.25, 0.34)) * front;
        float headGlow = ellipse(vec2(dir.x, dir.y), vec2(0.05, 0.31), vec2(0.18, 0.22)) * front;
        float handGlow = ellipse(vec2(dir.x, dir.y), vec2(0.18, -0.25), vec2(0.16, 0.12)) * front;
        color = mix(color, blackDrapery + vec3(fine * 0.035), clamp(darkBody * 0.88 + hairMass * 0.74, 0.0, 0.94));
        color = mix(color, vec3(0.67, 0.50, 0.38), headGlow * 0.62 + handGlow * 0.42);

        float clayCourt = front * groundBand;
        float courtLine = max(stripe(dir.x + sin(dir.y * 7.0) * 0.025, -0.26, 0.008), stripe(dir.x + sin(dir.y * 6.0) * 0.022, 0.31, 0.008));
        courtLine = max(courtLine, stripe(dir.y + dir.x * 0.08, -0.38, 0.007));
        color = mix(color, ivory, courtLine * clayCourt * 0.58);

        float waveA = stripe(dir.y + sin(dir.x * 5.8 + drift * 5.0) * 0.055, 0.30, 0.010);
        float waveB = stripe(dir.y + sin(dir.x * 5.4 + 1.3 + drift * 4.2) * 0.05, 0.37, 0.008);
        float waveC = stripe(dir.y + sin(dir.x * 6.1 - 0.7 + drift * 3.9) * 0.05, 0.44, 0.007);
        color = mix(color, mutedYellow, (waveA + waveB + waveC) * front * poleFade * 0.24);

        float sideBranch = smoothstep(0.68, 0.93, abs(dir.x)) * smoothstep(-0.22, 0.52, dir.y) * poleFade;
        float branchNoise = smoothstep(0.68, 0.88, fbm(dir * 13.0 + vec3(2.0, 0.0, drift)));
        color = mix(color, blackDrapery, sideBranch * branchNoise * 0.32);

        float flowerMists = smoothstep(0.64, 0.87, fbm(dir * 9.0 + vec3(8.0, 4.0, 0.0))) * smoothstep(-0.42, 0.26, dir.y) * (front + back * 0.48);
        color = mix(color, ivory, flowerMists * 0.11);
        color = mix(color, mutedYellow, flowerMists * 0.08);

        float vignette = smoothstep(0.92, 0.15, length(vec2(dir.x * 0.82, dir.y * 0.56)));
        color *= 0.86 + 0.22 * vignette;
        color += canvasWeave;
        color += (fine - 0.5) * 0.045;
        color = pow(max(color, vec3(0.0)), vec3(0.96));
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function I(e){let u=new Uint8Array(16384),c=63*.5;for(let n=0;n<64;n+=1)for(let a=0;a<64;a+=1){let r=(a-c)/c,i=(n-c)/c,d=Math.sqrt(r*r+i*i),s=Math.max(0,Math.min(1,(1-d)/.32)),m=s*s*(3-2*s),l=(n*64+a)*4;u[l]=255,u[l+1]=255,u[l+2]=255,u[l+3]=Math.round(m*255)}let o=new e.DataTexture(u,64,64,e.RGBAFormat);return o.name="hawkins-soft-flower-pigment-dab",o.wrapS=e.ClampToEdgeWrapping,o.wrapT=e.ClampToEdgeWrapping,o.minFilter=e.LinearFilter,o.magFilter=e.LinearFilter,o.generateMipmaps=!1,o.needsUpdate=!0,o}function v(e,t){return e.push(t),t}function F(e,t,u,c){if(t&&typeof t.createSkyboxShell=="function"){let r=t.createSkyboxShell({radius:u,name:"single-hawkins-roland-garros-enclosing-skybox-shell",geometryKind:"box",material:c,cameraPinned:!0,userData:{partId:"world-environment",role:"world-environment",packetId:z,packetHash:B,singleEnvironmentShell:!0}}),i=r.object||r,d=i.mesh||r.mesh||i.children?.find(s=>s&&s.isMesh);return d&&(d.name="hawkins-position-space-painted-skybox-mesh",d.material=c,d.renderOrder=-1e3,d.frustumCulled=!1,d.castShadow=!1,d.receiveShadow=!1),i.renderOrder=-1e3,i.frustumCulled=!1,{object:i,geometry:r.geometry||d?.geometry||null}}let o=new e.Group;o.name="single-hawkins-roland-garros-enclosing-skybox-shell",o.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",packetId:z,packetHash:B};let n=new e.BoxGeometry(2/Math.sqrt(3),2/Math.sqrt(3),2/Math.sqrt(3),1,1,1),a=new e.Mesh(n,c);return a.name="hawkins-position-space-painted-skybox-mesh",a.scale.setScalar(u),a.frustumCulled=!1,a.renderOrder=-1e3,a.castShadow=!1,a.receiveShadow=!1,o.add(a),o.mesh=a,o.geometry=n,o.material=c,o.onBeforeRender=function(i,d,s){s&&s.position&&(o.position.copy(s.position),o.updateMatrixWorld(!0))},{object:o,geometry:n}}function G(e,t,u,c,o,n){let a=new e.CatmullRomCurve3(t,!1,"catmullrom",.45),r=v(o.geometries,new e.TubeGeometry(a,72,u,7,!1)),i=new e.Mesh(r,c);return i.name=n,i.frustumCulled=!1,i.renderOrder=-8,i}function L(e,t,u,c){let o=new e.Group;o.name="black-contour-branch-silhouettes-around-hawkins-sky";let n=[],a=[{side:-1,baseX:-7.9,baseY:-2.4,baseZ:-6.7,lean:1.15},{side:1,baseX:8.4,baseY:-2.2,baseZ:-7.3,lean:-1.05},{side:-1,baseX:-9.7,baseY:-1.5,baseZ:-12.3,lean:.95},{side:1,baseX:10.6,baseY:-1.7,baseZ:-13.5,lean:-.9}];for(let r=0;r<a.length;r+=1){let i=a[r],d=5.5+t()*3.2,s=[];for(let l=0;l<7;l+=1){let b=l/6;s.push(new e.Vector3(i.baseX+i.lean*b*(2.2+t()*1.1)+Math.sin(b*7+r)*.45,i.baseY+b*d,i.baseZ-b*(.4+t()*1.2)))}let m=G(e,s,.035+t()*.035,u.branch,c,`side-black-contour-trunk-${r+1}`);m.userData.phase=t()*Math.PI*2,n.push(m),o.add(m);for(let l=0;l<4;l+=1){let b=2+Math.floor(t()*4),g=s[b].clone(),p=[g],h=i.side*(l%2===0?-1:1);for(let x=1;x<5;x+=1){let M=x/4;p.push(new e.Vector3(g.x+h*M*(1.5+t()*2.4),g.y+M*(.2+t()*1.2),g.z-M*(.2+t()*1.7)))}let f=G(e,p,.017+t()*.018,u.branchThin,c,`thin-branch-contour-pressure-${r+1}-${l+1}`);f.userData.phase=t()*Math.PI*2,n.push(f),o.add(f)}}return{group:o,branches:n}}function W(e,t,u,c,o,n){let a=new Float32Array((o+1)*3);for(let i=0;i<=o;i+=1){let d=i/o,s=u+c*d;a[i*3]=Math.cos(s)*t,a[i*3+1]=Math.sin(s)*t*n,a[i*3+2]=0}let r=new e.BufferGeometry;return r.setAttribute("position",new e.BufferAttribute(a,3)),r}function N(e,t,u,c){let o=new e.Group;o.name="roland-garros-racket-radial-symbols-and-clay-pressure-lines";let n=[];for(let s=0;s<7;s+=1){let m=v(c.geometries,W(e,1.45+s*.18,-Math.PI*.88+t()*.12,Math.PI*(1.2+t()*.28),96,.72)),l=new e.Line(m,s%3===0?u.racketGold:u.racketInk);l.name=`muted-racket-radial-symbol-pressure-arc-${s+1}`,l.position.set(-4.2+s*1.35,-.58-s*.05,-6.2-s*.62),l.rotation.set(.04,-.05+s*.018,-.42+s*.16),l.scale.set(1.3+s*.045,1.05,1),l.userData.phase=t()*Math.PI*2,l.userData.baseRotationZ=l.rotation.z,l.frustumCulled=!1,l.renderOrder=12,n.push(l),o.add(l)}let a=[],r=34;for(let s=0;s<r;s+=1){let m=-8.5+s%17*1,l=-2.88+Math.floor(s/17)*.56,b=-5.1-s%9*.68;a.push(m,l,b,m+.56+t()*.72,l+(t()-.5)*.08,b-.08-t()*.32)}let i=v(c.geometries,new e.BufferGeometry);i.setAttribute("position",new e.BufferAttribute(new Float32Array(a),3));let d=new e.LineSegments(i,u.courtLine);return d.name="broken-ivory-clay-court-flow-pressure-hatching",d.frustumCulled=!1,d.renderOrder=18,d.userData.phase=t()*Math.PI*2,n.push(d),o.add(d),{group:o,moving:n}}function Y(e){let t=new e.Shape,u=6;for(let c=0;c<=u*6;c+=1){let o=c/(u*6)*Math.PI*2,n=.52+Math.pow(Math.max(0,Math.cos(o*u*.5)),1.8)*.32,a=Math.cos(o)*n,r=Math.sin(o)*n*.72;c===0?t.moveTo(a,r):t.lineTo(a,r)}return new e.ShapeGeometry(t,20)}function Z(e,t,u,c){let o=new e.Group;o.name="ivory-datura-flower-veils-and-muted-yellow-centers";let n=[],a=v(c.geometries,Y(e)),r=v(c.geometries,new e.CircleGeometry(.12,24)),i=v(c.geometries,new e.CylinderGeometry(.015,.021,1,6,1)),d=[[-3.9,-1.55,-4.55,.72],[-5.7,-1.92,-5.7,.64],[2.55,-1.2,-4.95,.62],[4.62,-1.74,-6.15,.54],[6.6,.88,-9.8,.44],[-7.3,.36,-10.4,.38]];for(let s=0;s<d.length;s+=1){let[m,l,b,g]=d[s],p=new e.Mesh(a,u.flower);p.name=`pale-trumpet-flower-artist-veil-${s+1}`,p.position.set(m+(t()-.5)*.38,l+(t()-.5)*.22,b),p.rotation.set(.05+t()*.12,-.08+t()*.16,-.72+t()*1.45),p.scale.setScalar(g*1.32),p.frustumCulled=!1,p.renderOrder=34,p.userData.phase=t()*Math.PI*2,p.userData.baseY=p.position.y,p.userData.baseRotationZ=p.rotation.z,n.push(p),o.add(p);let h=new e.Mesh(r,u.flowerCenter);h.name=`muted-yellow-datura-throat-${s+1}`,h.position.copy(p.position),h.position.z+=.012,h.rotation.copy(p.rotation),h.scale.setScalar(g*1.05),h.frustumCulled=!1,h.renderOrder=35,h.userData.phase=p.userData.phase,h.userData.baseY=h.position.y,h.userData.baseRotationZ=h.rotation.z,n.push(h),o.add(h);let f=new e.Mesh(i,u.stem);f.name=`dark-green-bent-flower-stem-${s+1}`,f.position.set(p.position.x-.1,p.position.y-.62*g,p.position.z-.035),f.rotation.set(Math.PI*.55,.12+t()*.28,p.rotation.z+.28),f.scale.set(1,1.1*g,1),f.frustumCulled=!1,f.renderOrder=28,f.userData.phase=p.userData.phase,f.userData.baseY=f.position.y,n.push(f),o.add(f)}return{group:o,moving:n}}function O(e,t,u,c,o){let n=new e.Group;n.name="foreground-grass-hatching-and-soft-pigment-dabs";let a=[],r=[];for(let f=0;f<92;f+=1){let M=(t()<.5?-1:1)*(2.5+t()*6.6)+(t()-.5)*.6,w=-3.12+t()*.46,S=-3.9-t()*6.4,k=.38+t()*1.1;r.push(M,w,S,M+(t()-.5)*.25,w+k,S-t()*.18)}let i=v(o.geometries,new e.BufferGeometry);i.setAttribute("position",new e.BufferAttribute(new Float32Array(r),3));let d=new e.LineSegments(i,c.grass);d.name="dark-olive-foreground-grass-contour-hatching",d.frustumCulled=!1,d.renderOrder=26,d.userData.phase=t()*Math.PI*2,a.push(d),n.add(d);let s=180,m=new Float32Array(s*3),l=new Float32Array(s*3),b=["#d8cfb6","#b9b389","#70664a","#252a25","#9b7240","#7b8d83"].map(f=>new e.Color(f));for(let f=0;f<s;f+=1){let x=t()*Math.PI*2,M=4.2+t()*9.8;m[f*3]=Math.cos(x)*M,m[f*3+1]=-2.7+t()*5.2,m[f*3+2]=Math.sin(x)*M-4.2;let w=b[f%b.length];l[f*3]=w.r,l[f*3+1]=w.g,l[f*3+2]=w.b}let g=v(o.geometries,new e.BufferGeometry);g.setAttribute("position",new e.BufferAttribute(m,3)),g.setAttribute("color",new e.BufferAttribute(l,3));let p=v(o.materials,new e.PointsMaterial({name:"soft-matte-pigment-dust-not-neutral",map:u,alphaMap:u,size:.27,transparent:!0,opacity:.52,vertexColors:!0,depthWrite:!1,depthTest:!0,sizeAttenuation:!0,fog:!1,toneMapped:!1,alphaTest:.02})),h=new e.Points(g,p);return h.name="soft-pigment-dabs-in-atmospheric-compressed-depth",h.frustumCulled=!1,h.renderOrder=5,h.userData.phase=t()*Math.PI*2,a.push(h),n.add(h),{group:n,moving:a}}function j({THREE:e,part:t,world:u,seed:c,utilities:o}){let n=P(o,c||t?.id||"world-environment","hawkins-serena-roland-garros-world-environment"),a=new e.Group;a.name="world-environment-hawkins-serena-return-roland-garros",a.userData={partId:"world-environment",role:t?.role||"world-environment",packetId:z,packetHash:B,selectedNews:"Roland-Garros - Serena's return, Alcaraz and Djokovic injuries, McEnroe: She's coming back to win",artist:"Louis Welden Hawkins",environmentIntent:"single enclosing matte Symbolist skybox with dark central pressure, clay Roland Garros cues, natural contour motifs, and atmospheric drift"};let r={geometries:[],materials:[],textures:[]},i=Number(u?.environment?.skyboxRadius||u?.environment?.radius),d=Number.isFinite(i)&&i>0?Math.max(56,Math.min(120,i)):86,s=v(r.materials,A(e)),m=F(e,o,d,s);m.geometry&&v(r.geometries,m.geometry),a.add(m.object);let l=v(r.textures,I(e)),b={branch:v(r.materials,new e.MeshBasicMaterial({name:"matte-black-branch-contour",color:"#111514",transparent:!0,opacity:.82,depthWrite:!1,fog:!1,toneMapped:!1})),branchThin:v(r.materials,new e.MeshBasicMaterial({name:"thin-gray-black-branch-contour",color:"#20251f",transparent:!0,opacity:.72,depthWrite:!1,fog:!1,toneMapped:!1})),racketInk:v(r.materials,new e.LineBasicMaterial({name:"thin-racket-black-radial-line",color:"#161917",transparent:!0,opacity:.58,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})),racketGold:v(r.materials,new e.LineBasicMaterial({name:"muted-ochre-racket-radial-line",color:"#9c8248",transparent:!0,opacity:.55,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})),courtLine:v(r.materials,new e.LineBasicMaterial({name:"broken-ivory-clay-court-line",color:"#d8cfb4",transparent:!0,opacity:.52,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})),flower:v(r.materials,new e.MeshBasicMaterial({name:"matte-ivory-datura-petal",color:"#d5ccb0",transparent:!0,opacity:.78,side:e.DoubleSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})),flowerCenter:v(r.materials,new e.MeshBasicMaterial({name:"muted-yellow-flower-throat",color:"#b6a35c",transparent:!0,opacity:.7,side:e.DoubleSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})),stem:v(r.materials,new e.MeshBasicMaterial({name:"dark-green-thin-stem",color:"#263225",transparent:!0,opacity:.72,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1})),grass:v(r.materials,new e.LineBasicMaterial({name:"dark-olive-foreground-grass-hatching",color:"#31362b",transparent:!0,opacity:.63,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1}))},g=L(e,n,b,r),p=N(e,n,b,r),h=Z(e,n,b,r),f=O(e,n,l,b,r);a.add(g.group,p.group,h.group,f.group);function x(w={}){let S=w.captureMode?0:Number(w.elapsedSeconds??w.time??0),k=Number.isFinite(S)?S:0,D=Number.isFinite(Number(w.motionIntensity))?Number(w.motionIntensity):1;s.uniforms.uTime.value=k;for(let y of g.branches)y.rotation.z=Math.sin(k*.045+y.userData.phase)*.012*D;for(let y of p.moving)Number.isFinite(y.userData.baseRotationZ)?y.rotation.z=y.userData.baseRotationZ+Math.sin(k*.06+y.userData.phase)*.016*D:y.rotation.y=Math.sin(k*.035+y.userData.phase)*.016*D;for(let y of h.moving){let C=Math.sin(k*.08+y.userData.phase);Number.isFinite(y.userData.baseY)&&(y.position.y=y.userData.baseY+C*.035*D),Number.isFinite(y.userData.baseRotationZ)&&(y.rotation.z=y.userData.baseRotationZ+C*.018*D)}f.group.rotation.y=Math.sin(k*.025)*.018*D;for(let y of f.moving)y.isPoints&&(y.material.opacity=.48+Math.sin(k*.11+y.userData.phase)*.035*D)}function M(){for(let w of r.geometries)w?.dispose?.();for(let w of r.materials)w?.dispose?.();for(let w of r.textures)w?.dispose?.()}return x({captureMode:!0,elapsedSeconds:0}),{object:a,update:x,dispose:M}}export{j as createImmersiveWorldPart};
