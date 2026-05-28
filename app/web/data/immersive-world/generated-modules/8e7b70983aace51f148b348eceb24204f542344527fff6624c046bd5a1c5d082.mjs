var d="art-direction-packet-3627abb3e097",p="3627abb3e097cc1099a7eaeab0983d80";function m(a){let e=String(a??"world-environment"),o=2166136261;for(let n=0;n<e.length;n+=1)o^=e.charCodeAt(n),o=Math.imul(o,16777619);return o>>>0}function C(a,e,o){if(a&&typeof a.createSeededRandom=="function")return a.createSeededRandom(e,o);let n=(m(e)^m(o))>>>0;return function(){n=n+1831565813>>>0;let s=n;return s=Math.imul(s^s>>>15,s|1),s^=s+Math.imul(s^s>>>7,s|61),((s^s>>>14)>>>0)/4294967296}}function v(a){let e=Number(a[0])||0,o=Number(a[1])||0,n=Number(a[2])||-1,c=Math.hypot(e,o,n)||1;return[e/c,o/c,n/c]}function w(a){a.traverse(e=>{e.geometry&&typeof e.geometry.dispose=="function"&&e.geometry.dispose();let o=Array.isArray(e.material)?e.material:[e.material].filter(Boolean);for(let n of o)n&&typeof n.dispose=="function"&&n.dispose()})}function b(a,e){let o=[{center:[-.14,.04,-1],radius:.56,color:"#0D0D0C",kind:1,angle:-.18,aspect:.72},{center:[.42,.24,-.9],radius:.44,color:"#C0C0BF",kind:0,angle:.62,aspect:1.42},{center:[-.48,-.2,-.86],radius:.42,color:"#016F3D",kind:3,angle:-.92,aspect:.72},{center:[.18,-.36,-.94],radius:.38,color:"#9F2D4B",kind:2,angle:.36,aspect:1.08},{center:[.72,-.08,-.64],radius:.46,color:"#0D0D0C",kind:1,angle:1.08,aspect:.64},{center:[-.74,.28,-.56],radius:.48,color:"#D0CFCF",kind:0,angle:-.42,aspect:1.34},{center:[.9,.14,-.28],radius:.34,color:"#9E2243",kind:2,angle:-.78,aspect:1},{center:[-.92,-.18,-.26],radius:.42,color:"#2F3020",kind:3,angle:.88,aspect:.7},{center:[.42,.58,-.58],radius:.32,color:"#BFB091",kind:0,angle:.18,aspect:1.52},{center:[-.18,.66,-.72],radius:.3,color:"#0D0D0C",kind:1,angle:-.34,aspect:.54},{center:[.06,-.72,-.68],radius:.36,color:"#016F3D",kind:3,angle:.54,aspect:1.2},{center:[.2,.16,.96],radius:.46,color:"#C0C0BF",kind:0,angle:-.72,aspect:1.5},{center:[-.55,.02,.82],radius:.42,color:"#0D0D0C",kind:1,angle:.24,aspect:.68},{center:[.68,-.24,.7],radius:.38,color:"#9F2D4B",kind:2,angle:.94,aspect:1.08},{center:[-.22,-.58,.78],radius:.34,color:"#016F3D",kind:3,angle:-.28,aspect:.78},{center:[.94,.28,.12],radius:.38,color:"#D0CFCF",kind:0,angle:-1.1,aspect:1.22},{center:[-.86,.42,.22],radius:.34,color:"#9E2243",kind:2,angle:.7,aspect:.96},{center:[.1,.88,.46],radius:.28,color:"#2F3020",kind:1,angle:-.52,aspect:.58}],n=[{center:[.02,.02,-1],radius:.86,width:.022,phase:.1,freq:2.5},{center:[-.38,-.1,-.92],radius:.72,width:.018,phase:1.4,freq:3.1},{center:[.48,.16,-.86],radius:.64,width:.024,phase:2.1,freq:2.2},{center:[-.76,.24,-.58],radius:.7,width:.018,phase:.7,freq:3.6},{center:[.78,-.18,-.6],radius:.68,width:.02,phase:2.9,freq:2.8},{center:[.12,-.7,-.7],radius:.58,width:.018,phase:1.8,freq:3.8},{center:[-.12,.68,-.72],radius:.58,width:.019,phase:2.5,freq:3.2},{center:[.18,.1,.98],radius:.72,width:.022,phase:.4,freq:2.7},{center:[-.52,-.04,.86],radius:.62,width:.02,phase:1.2,freq:3.4},{center:[.68,-.2,.72],radius:.6,width:.019,phase:2.6,freq:3},{center:[-.9,.18,.34],radius:.58,width:.018,phase:1,freq:4},{center:[.9,.26,.22],radius:.56,width:.019,phase:2,freq:3.5},{center:[.24,.82,.52],radius:.46,width:.017,phase:.6,freq:4.2},{center:[-.16,-.84,.52],radius:.5,width:.018,phase:2.8,freq:3.7}],c=[],s=[],u=[];for(let r of o){let i=v([r.center[0]+(e()-.5)*.08,r.center[1]+(e()-.5)*.06,r.center[2]+(e()-.5)*.08]);c.push(new a.Vector4(i[0],i[1],i[2],r.radius*(.94+e()*.18))),s.push(new a.Color(r.color)),u.push(new a.Vector4(r.kind,r.angle+(e()-.5)*.3,r.aspect,e()*8))}let l=[],t=[];for(let r of n){let i=v([r.center[0]+(e()-.5)*.08,r.center[1]+(e()-.5)*.08,r.center[2]+(e()-.5)*.08]);l.push(new a.Vector4(i[0],i[1],i[2],r.radius*(.92+e()*.16))),t.push(new a.Vector4(r.width,r.phase+e()*.7,r.freq,e()*6.28318530718))}return new a.ShaderMaterial({name:"lee-krasner-brussels-fracture-pressure-shell",side:a.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uPulse:{value:0},uCream:{value:new a.Color("#EFEADF")},uPaper:{value:new a.Color("#D0CFCF")},uGrey:{value:new a.Color("#B0B0B2")},uTan:{value:new a.Color("#BFB091")},uInk:{value:new a.Color("#0D0D0C")},uGreen:{value:new a.Color("#016F3D")},uPink:{value:new a.Color("#9F2D4B")},uPatches:{value:c},uPatchColors:{value:s},uPatchData:{value:u},uCurves:{value:l},uCurveData:{value:t}},vertexShader:`
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      #define PATCH_COUNT 18
      #define CURVE_COUNT 14
      uniform float uTime;
      uniform float uPulse;
      uniform vec3 uCream;
      uniform vec3 uPaper;
      uniform vec3 uGrey;
      uniform vec3 uTan;
      uniform vec3 uInk;
      uniform vec3 uGreen;
      uniform vec3 uPink;
      uniform vec4 uPatches[PATCH_COUNT];
      uniform vec3 uPatchColors[PATCH_COUNT];
      uniform vec4 uPatchData[PATCH_COUNT];
      uniform vec4 uCurves[CURVE_COUNT];
      uniform vec4 uCurveData[CURVE_COUNT];
      varying vec3 vLocalPosition;

      float saturate(float value) {
        return clamp(value, 0.0, 1.0);
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
        return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
      }

      float fbm(vec3 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          value += noise3(p) * amp;
          p = p * 2.03 + vec3(7.1, 2.7, 4.3);
          amp *= 0.5;
        }
        return value;
      }

      mat2 rotate2(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      vec2 localOnShell(vec3 dir, vec3 center) {
        vec3 helper = abs(center.y) > 0.86 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 right = normalize(cross(helper, center));
        vec3 up = normalize(cross(center, right));
        vec3 delta = dir - center;
        return vec2(dot(delta, right), dot(delta, up));
      }

      float patchShape(vec2 q, float kind, float seed) {
        float radial = length(q);
        float torn = (fbm(vec3(q * 5.8, seed + uPulse * 0.06)) - 0.5) * 0.22;
        float mask = 1.0 - smoothstep(0.94 + torn, 1.08 + torn, radial);
        if (kind > 0.5 && kind < 1.5) {
          float blade = smoothstep(-0.95, 0.3, q.y + abs(q.x) * 0.48);
          mask *= blade;
        } else if (kind > 1.5 && kind < 2.5) {
          float lobe = 1.0 - smoothstep(0.8 + torn, 1.06 + torn, length(q * vec2(0.86, 1.16)));
          mask = max(mask * 0.82, lobe);
        } else if (kind > 2.5) {
          float wedge = smoothstep(-0.82, 0.18, q.y + q.x * 0.35) * (1.0 - smoothstep(0.76, 1.05, abs(q.x)));
          mask *= wedge;
        }
        return saturate(mask);
      }

      float scratchMask(vec3 dir) {
        float scratch = 0.0;
        scratch += 1.0 - smoothstep(0.006, 0.018, abs(sin((dir.x * 8.0 + dir.y * 2.5 - dir.z * 3.0) * 5.0)));
        scratch += 1.0 - smoothstep(0.005, 0.016, abs(sin((dir.z * 7.0 - dir.y * 3.0 + dir.x * 1.5) * 4.0)));
        scratch *= 0.11 + 0.08 * fbm(dir * 18.0);
        return saturate(scratch);
      }

      void main() {
        vec3 dir = normalize(vLocalPosition);
        float paperNoise = fbm(dir * 8.5 + vec3(1.0, 3.0, 2.0));
        float fiber = fbm(dir * 33.0 + vec3(4.0, 1.0, 8.0));
        float verticalBands = smoothstep(0.18, 0.92, 0.5 + 0.5 * sin(dir.x * 7.2 + dir.z * 3.3 + paperNoise * 2.5));
        float paleRectangles = smoothstep(0.3, 0.78, 0.5 + 0.5 * sin(dir.y * 8.0 - dir.z * 2.0 + dir.x * 1.4));
        vec3 color = mix(uCream, uPaper, 0.48 * verticalBands);
        color = mix(color, uGrey, 0.18 * paleRectangles);
        color = mix(color, uTan, 0.16 * paperNoise);
        color *= 0.9 + 0.18 * fiber;

        float paintRelief = 0.0;
        float darkMass = 0.0;
        float greenSignal = 0.0;
        float pinkSignal = 0.0;

        for (int i = 0; i < PATCH_COUNT; i++) {
          vec4 patch = uPatches[i];
          vec3 center = normalize(patch.xyz);
          vec4 data = uPatchData[i];
          vec2 q = localOnShell(dir, center) / max(patch.w, 0.001);
          q = rotate2(data.y) * q;
          q.x /= max(data.z, 0.15);
          float mask = patchShape(q, data.x, data.w);
          float dragged = 0.72 + 0.28 * fbm(vec3(q * 13.0, data.w));
          float underpaint = mask * dragged;
          color = mix(color, uPatchColors[i] * (0.78 + 0.22 * dragged), underpaint * 0.84);
          float edge = (1.0 - smoothstep(0.026, 0.068, abs(length(q) - 0.94))) * mask;
          paintRelief += edge * 0.34;
          darkMass += underpaint * step(0.5, data.x) * step(data.x, 1.5);
          greenSignal += underpaint * step(2.5, data.x);
          pinkSignal += underpaint * step(1.5, data.x) * step(data.x, 2.5);
        }

        float contours = 0.0;
        for (int i = 0; i < CURVE_COUNT; i++) {
          vec4 curve = uCurves[i];
          vec3 center = normalize(curve.xyz);
          vec4 data = uCurveData[i];
          vec2 q = localOnShell(dir, center) / max(curve.w, 0.001);
          q = rotate2(data.w) * q;
          float extent = 1.0 - smoothstep(0.76, 1.12, abs(q.x));
          float wave = sin(q.x * data.z + data.y + fbm(vec3(q * 3.0, data.y)) * 0.8) * 0.34;
          float line = 1.0 - smoothstep(data.x, data.x + 0.03, abs(q.y - wave));
          float loop = 1.0 - smoothstep(data.x * 0.9, data.x * 2.4, abs(length(q * vec2(0.82, 1.22)) - 0.72));
          contours += max(line * extent, loop * 0.46);
        }

        float brusselsKnot = smoothstep(0.38, 0.82, darkMass + greenSignal * 0.78 + pinkSignal * 0.64);
        float pressureGrid = 1.0 - smoothstep(0.012, 0.028, abs(sin((dir.x * 5.0 - dir.z * 4.0 + dir.y * 1.2) * 3.14159)));
        pressureGrid *= 0.08 + 0.08 * (0.5 + 0.5 * sin(uPulse * 6.28318));

        color = mix(color, uInk, saturate(contours * 0.82 + paintRelief * 0.3 + scratchMask(dir) * 0.55));
        color = mix(color, uInk, saturate(darkMass * 0.38));
        color = mix(color, uGreen, saturate(greenSignal * 0.16));
        color = mix(color, uPink, saturate(pinkSignal * 0.12));
        color = mix(color, uInk, pressureGrid * (0.18 + brusselsKnot * 0.12));

        float valuePulse = 0.98 + 0.025 * sin(uPulse * 6.28318 + dir.x * 3.0);
        float shallowDepth = 0.94 + 0.08 * smoothstep(-0.55, 0.75, dir.y) + 0.04 * fbm(dir * 5.0 + uPulse);
        color *= valuePulse * shallowDepth;
        color = pow(max(color, vec3(0.0)), vec3(0.94));
        gl_FragColor = vec4(color, 1.0);
      }
    `})}function y({THREE:a,part:e,world:o,seed:n,utilities:c}){let s=C(c,n||e?.id||"world-environment","lee-krasner-brussels-environment"),u=Math.max(60,Number(o?.environment?.skyboxRadius||o?.environment?.radius)||110),l=b(a,s),t;if(c&&typeof c.createSkyboxShell=="function")t=c.createSkyboxShell({name:"world-environment-lee-krasner-fracture-pressure-shell",radius:u,material:l,geometryKind:"box",cameraPinned:!0,userData:{partId:"world-environment",role:e?.role||"world-environment",packetId:d,packetHash:p,artist:"Lee Krasner",newsCue:"Brussels talent and Rand vacancies held as concentrated abstract pressure"}});else{t=new a.Group,t.name="world-environment-lee-krasner-fracture-pressure-shell",t.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,environmentRadius:u,partId:"world-environment",role:e?.role||"world-environment",packetId:d,packetHash:p};let r=new a.BoxGeometry(2/Math.sqrt(3),2/Math.sqrt(3),2/Math.sqrt(3),1,1,1),i=new a.Mesh(r,l);i.name="world-environment-lee-krasner-fracture-pressure-shell-mesh",i.scale.setScalar(u),i.frustumCulled=!1,i.renderOrder=-1e3,t.add(i),t.mesh=i,t.geometry=r,t.material=l}return t.name="world-environment-lee-krasner-brussels-surround",t.renderOrder=-1e3,t.userData={...t.userData,partId:"world-environment",role:e?.role||"world-environment",packetId:d,packetHash:p,immersiveWorldEnvironmentShell:!0,skybox:!0,visualSystem:"single position-space collage-paper shell with black contour arcs, torn planes, green-pink pressure knots"},{object:t,update({elapsedSeconds:r=0,time:i=0,captureMode:x=!1,motionIntensity:k=1,camera:f}={}){let h=x?0:Number(r||i||0),g=(Math.sin(h*.34*k)+1)*.5;l.uniforms.uTime.value=h,l.uniforms.uPulse.value=g,t.userData?.cameraPinned&&f&&!c?.createSkyboxShell&&(t.position.copy(f.position),t.updateMatrixWorld(!0))},dispose(){w(t)}}}export{y as createImmersiveWorldPart};
