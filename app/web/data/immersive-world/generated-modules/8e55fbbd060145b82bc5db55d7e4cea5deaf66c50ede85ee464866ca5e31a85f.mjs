var p="art-direction-packet-2c55d585e542",u="2c55d585e542560ab11a84a2b1dc8a79";function m(e,r){let a=`${String(e??"world-environment")}::${r}`,o=2166136261;for(let t=0;t<a.length;t+=1)o^=a.charCodeAt(t),o=Math.imul(o,16777619);return(o>>>0)/4294967295}function g(e,r,a){let o=new e.Group,t=new e.SphereGeometry(1,96,48),i=new e.Mesh(t,a);return o.add(i),o.object=o,o.mesh=i,o.material=a,o.geometry=t,o.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,environmentRadius:r},o.dispose=()=>{t.dispose(),a.dispose()},o}function w(e){let r=[e?.environment?.skyboxRadius,e?.environment?.radius,e?.skyboxRadius];for(let a of r){let o=Number(a);if(Number.isFinite(o)&&o>0)return o}return 96}function S({THREE:e,part:r,world:a,seed:o,utilities:t}={}){if(!e)throw new Error("world-environment requires THREE.");let i=w(a),h=m(o,`${u}:phase`),v=m(o,`${u}:breath`),x=m(o,`${u}:seam`),d={uTime:{value:0},uSeed:{value:h},uBreath:{value:v},uSeam:{value:x},uUpperPurple:{value:new e.Color("#211633")},uUpperMaroon:{value:new e.Color("#681d28")},uLowerBlack:{value:new e.Color("#08060b")},uLowerEarth:{value:new e.Color("#8b3f20")},uOchre:{value:new e.Color("#b57a2b")},uTeal:{value:new e.Color("#0f665c")},uCobalt:{value:new e.Color("#174aab")},uRed:{value:new e.Color("#ba281e")}},f=new e.ShaderMaterial({uniforms:d,side:e.BackSide,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,transparent:!1,vertexShader:`
      varying vec3 vLocalPosition;
      varying vec3 vDirection;

      void main() {
        vLocalPosition = position;
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;

      uniform float uTime;
      uniform float uSeed;
      uniform float uBreath;
      uniform float uSeam;
      uniform vec3 uUpperPurple;
      uniform vec3 uUpperMaroon;
      uniform vec3 uLowerBlack;
      uniform vec3 uLowerEarth;
      uniform vec3 uOchre;
      uniform vec3 uTeal;
      uniform vec3 uCobalt;
      uniform vec3 uRed;

      varying vec3 vLocalPosition;
      varying vec3 vDirection;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float valueNoise(vec3 p) {
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
        float sum = 0.0;
        float amp = 0.52;
        for (int octave = 0; octave < 5; octave += 1) {
          sum += valueNoise(p) * amp;
          p = p * 2.03 + vec3(7.7, 3.1, 5.9);
          amp *= 0.5;
        }
        return sum;
      }

      float softBand(float y, float center, float halfWidth, float feather) {
        return smoothstep(halfWidth + feather, halfWidth - feather, abs(y - center));
      }

      void main() {
        vec3 dir = normalize(vDirection);
        float t = uTime * 0.045;
        float angle = atan(dir.x, -dir.z);
        float front = smoothstep(-0.62, 0.82, -dir.z);
        float sideVignette = smoothstep(1.0, 0.18, abs(dir.x));

        vec3 grainPoint = dir * 3.4 + vec3(uSeed * 19.0, t, uBreath * 11.0);
        float lowCloud = fbm(grainPoint);
        float fineCloud = fbm(dir * 18.0 + vec3(uSeam * 6.0, -t * 1.7, uSeed * 9.0));
        float canvas = fbm(vec3(dir.x * 42.0, dir.y * 9.0, dir.z * 42.0) + uSeed);
        float tremor = (lowCloud - 0.5) * 0.105 + (fineCloud - 0.5) * 0.038;

        float upperGate = smoothstep(-0.17 + tremor, 0.18 + tremor, dir.y);
        float lowerWeight = smoothstep(0.08 + tremor, -0.34 + tremor, dir.y);
        float centralHinge = softBand(dir.y + tremor * 0.35, -0.095, 0.115, 0.082);
        float tealSeam = softBand(dir.y - tremor * 0.2, -0.005, 0.061, 0.065);
        float ochreRise = softBand(dir.y + tremor * 0.55, -0.39, 0.22, 0.24);

        vec3 upper = mix(uUpperPurple, uUpperMaroon, 0.28 + 0.42 * lowCloud);
        vec3 lower = mix(uLowerBlack, uLowerEarth, 0.34 + 0.46 * lowCloud);
        lower = mix(lower, uOchre, ochreRise * 0.42);
        vec3 color = mix(lower, upper, upperGate);

        float frontalRectangle = front * smoothstep(0.99, 0.22, abs(dir.x)) * smoothstep(0.92, 0.08, abs(dir.y - 0.03));
        color = mix(color, upper * 1.16, frontalRectangle * upperGate * 0.18);
        color = mix(color, lower * 0.78, lowerWeight * (0.42 + 0.18 * sideVignette));
        color = mix(color, uTeal * (0.52 + 0.24 * lowCloud), tealSeam * (0.46 + front * 0.24));
        color = mix(color, uLowerBlack, centralHinge * (0.46 + 0.18 * front));

        float leftFan = smoothstep(0.62, 0.2, abs(angle + 0.82)) * softBand(dir.y, -0.035 + tremor, 0.24, 0.2);
        float rightFan = smoothstep(0.62, 0.2, abs(angle - 0.82)) * softBand(dir.y, -0.035 - tremor, 0.24, 0.2);
        float pressureOverlap = min(leftFan + rightFan, 1.0) * (0.18 + 0.17 * front);
        color = mix(color, mix(uUpperMaroon, uTeal, rightFan * 0.62), pressureOverlap);

        float cobaltPulse = smoothstep(0.965, 1.0, sin(angle * 4.0 + uSeed * 6.283) * 0.5 + 0.5);
        cobaltPulse *= softBand(dir.y + tremor, 0.02, 0.05, 0.055) * (0.25 + 0.55 * front);
        float redPulse = smoothstep(0.972, 1.0, sin(angle * 5.0 - uBreath * 6.283) * 0.5 + 0.5);
        redPulse *= softBand(dir.y - tremor, -0.17, 0.07, 0.07) * (0.18 + 0.38 * sideVignette);
        color = mix(color, uCobalt, cobaltPulse * 0.68);
        color = mix(color, uRed, redPulse * 0.5);

        float edgeDeposit = smoothstep(0.41, 0.94, abs(tremor) * 6.0 + centralHinge * 0.5 + tealSeam * 0.22);
        color *= 0.82 + edgeDeposit * 0.18;
        color += (fineCloud - 0.5) * 0.055;
        color *= 0.98 + canvas * 0.14;
        color *= 0.88 + 0.18 * sideVignette + 0.08 * front;

        float matte = 1.0 - smoothstep(0.72, 1.0, length(color));
        color = mix(color, color * 0.91, matte * 0.15);
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    `}),s=t?.createSkyboxShell?t.createSkyboxShell({name:"world-environment-rothko-finale-pressure-shell",radius:i,material:f,widthSegments:112,heightSegments:56,userData:{partId:r?.id||"world-environment",role:r?.role||"world-environment",packetId:p,packetHash:u,messagePurpose:"Finale pressure as surrounding Rothko color-field atmosphere."}}):g(e,i,f),l=s.object||s,c=s.mesh||l.mesh||l.children?.find(n=>n?.isMesh);return l.name="world-environment.rothko-finale-pressure.v1",l.userData={...l.userData,partId:r?.id||"world-environment",role:r?.role||"world-environment",immersiveWorldEnvironmentShell:!0,skybox:!0,environmentRadius:i,packetId:p,packetHash:u},c&&(c.name="skybox-scale-horizontal-pressure-field",c.castShadow=!1,c.receiveShadow=!1,c.frustumCulled=!1),t?.applySkyboxDefaults&&t.applySkyboxDefaults(l,{radius:i,cameraPinned:!0}),{object:l,update(n={}){let b=Number.isFinite(n.elapsedSeconds)?n.elapsedSeconds:Number.isFinite(n.time)?n.time:0,y=Math.max(0,Math.min(1,Number(n.motionIntensity??1)));d.uTime.value=n.captureMode?1.234:b*y,n.camera?.position&&l.position?.copy&&l.position.copy(n.camera.position)},dispose(){typeof s.dispose=="function"?s.dispose():f.dispose()}}}export{S as createImmersiveWorldPart};
