var m="art-direction-packet-f8f664cad7e0",f="f8f664cad7e0acf6e82f45e888bb7398",v="world-environment-emily-mason-flow-pressure";function x(e){return new e.ShaderMaterial({name:"emily-mason-position-space-flow-pressure-skybox",side:e.BackSide,transparent:!1,depthWrite:!1,depthTest:!0,fog:!1,toneMapped:!1,uniforms:{uTime:{value:0},uCoolDeep:{value:new e.Color("#092733")},uCoolTeal:{value:new e.Color("#2f7f78")},uAquaWash:{value:new e.Color("#8fbec1")},uBlueGray:{value:new e.Color("#526f78")},uOchre:{value:new e.Color("#c58d4c")},uAmber:{value:new e.Color("#d5a968")},uCream:{value:new e.Color("#ded3ad")},uPeach:{value:new e.Color("#d99572")},uBlackTeal:{value:new e.Color("#071419")},uBurgundy:{value:new e.Color("#551c2c")},uCrimson:{value:new e.Color("#b60f17")},uYellowGreen:{value:new e.Color("#b8bd35")},uBone:{value:new e.Color("#e2ded1")}},vertexShader:`
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;

      uniform float uTime;
      uniform vec3 uCoolDeep;
      uniform vec3 uCoolTeal;
      uniform vec3 uAquaWash;
      uniform vec3 uBlueGray;
      uniform vec3 uOchre;
      uniform vec3 uAmber;
      uniform vec3 uCream;
      uniform vec3 uPeach;
      uniform vec3 uBlackTeal;
      uniform vec3 uBurgundy;
      uniform vec3 uCrimson;
      uniform vec3 uYellowGreen;
      uniform vec3 uBone;

      varying vec3 vPosition;

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

        float x00 = mix(n000, n100, f.x);
        float x10 = mix(n010, n110, f.x);
        float x01 = mix(n001, n101, f.x);
        float x11 = mix(n011, n111, f.x);
        float y0 = mix(x00, x10, f.y);
        float y1 = mix(x01, x11, f.y);
        return mix(y0, y1, f.z);
      }

      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.52;
        for (int i = 0; i < 5; i++) {
          v += a * noise3(p);
          p = p * 2.03 + vec3(17.1, 9.2, 5.4);
          a *= 0.48;
        }
        return v;
      }

      float band(float x, float width) {
        return 1.0 - smoothstep(width * 0.55, width, abs(x));
      }

      float softBlob(vec2 p, vec2 center, vec2 scale) {
        vec2 q = (p - center) / scale;
        return 1.0 - smoothstep(0.72, 1.22, dot(q, q));
      }

      float arcLine(vec2 p, vec2 center, float radius, float width) {
        return 1.0 - smoothstep(width * 0.42, width, abs(length(p - center) - radius));
      }

      void main() {
        vec3 dir = normalize(vPosition);
        vec3 p = vPosition;
        float t = uTime * 0.035;
        float front = smoothstep(-0.35, 0.78, -dir.z);
        float back = smoothstep(-0.2, 0.85, dir.z);
        float poleDetail = 1.0 - smoothstep(0.78, 0.97, abs(dir.y));
        float poleBlend = smoothstep(0.84, 0.985, abs(dir.y));

        float broad = fbm(p * 1.24 + vec3(0.0, t, 2.0));
        float stain = fbm(p * 3.2 + vec3(4.0, 1.7, t));
        float scrape = fbm(vec3(p.x * 13.0, p.y * 1.35, p.z * 7.4));
        float fiber = fbm(vec3(p.x * 44.0, p.y * 5.0, p.z * 19.0));

        float vertical = smoothstep(-0.92, 0.82, dir.y);
        vec3 coolField = mix(uCoolDeep, uAquaWash, smoothstep(-0.55, 0.82, dir.y) * (0.66 + broad * 0.34));
        coolField = mix(coolField, uBlueGray, smoothstep(-0.45, 0.35, dir.y) * 0.38);
        vec3 warmField = mix(uPeach, uCream, smoothstep(-0.15, 0.82, dir.y));
        warmField = mix(warmField, uAmber, (1.0 - vertical) * 0.56 + broad * 0.16);

        float sideSplit = smoothstep(-0.16, 0.34, dir.x + 0.13 * broad - 0.06 * dir.y);
        vec3 color = mix(coolField, warmField, sideSplit);
        color = mix(color, uOchre, softBlob(dir.xy, vec2(0.44, -0.29), vec2(0.62, 0.40)) * front * 0.48);
        color = mix(color, uCoolTeal, softBlob(dir.xy, vec2(-0.70, 0.12), vec2(0.46, 0.64)) * 0.46);
        color = mix(color, uBlueGray, back * (0.30 + broad * 0.22));

        float diagonal = dir.y + 0.15 + dir.x * 0.22 - dir.z * 0.11 + (broad - 0.5) * 0.12;
        float darkSeam = band(diagonal, 0.055) * poleDetail;
        float redSeam = band(diagonal + 0.022, 0.033) * front * smoothstep(-0.38, 0.42, dir.x) * poleDetail;
        color = mix(color, uBlackTeal, darkSeam * 0.78);
        color = mix(color, uCrimson, redSeam * (0.70 + stain * 0.30));

        float cutBlade = band(dir.x * 0.82 + dir.y * 0.18 - 0.04 + (stain - 0.5) * 0.035, 0.035);
        cutBlade *= front * smoothstep(-0.12, 0.64, dir.y) * poleDetail;
        color = mix(color, uBone, cutBlade * 0.58);

        float redPool = softBlob(dir.xy, vec2(0.12, -0.28), vec2(0.42, 0.18)) * front;
        redPool *= smoothstep(0.33, 0.82, stain) * poleDetail;
        color = mix(color, uCrimson, redPool * 0.78);

        float blackWeight = softBlob(dir.xy, vec2(-0.58, -0.45), vec2(0.34, 0.22)) * (0.75 + front * 0.25);
        blackWeight += softBlob(vec2(dir.x, dir.y), vec2(0.58, 0.00), vec2(0.30, 0.24)) * 0.52;
        color = mix(color, uBlackTeal, clamp(blackWeight, 0.0, 1.0) * 0.62);

        vec2 q = dir.xy;
        float arcs = 0.0;
        arcs += arcLine(q, vec2(-0.34, -0.50), 0.52, 0.010);
        arcs += arcLine(q, vec2(-0.02, -0.56), 0.72, 0.008);
        arcs += arcLine(q, vec2(0.32, -0.46), 0.58, 0.007);
        arcs += arcLine(vec2(dir.z, dir.y), vec2(-0.16, -0.52), 0.64, 0.009) * 0.75;
        arcs *= poleDetail * (0.38 + front * 0.62);
        color = mix(color, uBlackTeal, clamp(arcs, 0.0, 1.0) * 0.55);

        float yellowAccent = softBlob(q, vec2(0.83, 0.11), vec2(0.12, 0.32)) * front * poleDetail;
        color = mix(color, uYellowGreen, yellowAccent * 0.42);

        float hatch = band(fract((dir.x * 18.0 + dir.y * 6.5 + stain * 1.7) * 0.5) - 0.5, 0.020);
        hatch *= smoothstep(-0.68, -0.18, dir.y) * smoothstep(0.08, 0.92, -dir.z) * poleDetail;
        color = mix(color, uBurgundy, hatch * 0.42);

        float dryBrush = smoothstep(0.50, 0.94, scrape) * smoothstep(0.36, 0.88, fiber);
        float rubbedLight = smoothstep(0.68, 0.98, stain) * (1.0 - smoothstep(0.72, 1.0, broad));
        color = mix(color, uCream, dryBrush * 0.22 * poleDetail);
        color = mix(color, uBone, rubbedLight * 0.15 * poleDetail);

        float vignette = 1.0 - 0.24 * smoothstep(0.34, 1.0, length(vec2(dir.x * 0.62, dir.y + 0.05)));
        float pressureShade = 0.88 + 0.24 * broad;
        color *= vignette * pressureShade;

        vec3 poleWash = mix(uAmber, uAquaWash, smoothstep(-0.85, 0.85, dir.y));
        poleWash = mix(poleWash, uCream, smoothstep(0.82, 1.0, abs(dir.y)) * 0.26);
        color = mix(color, poleWash, poleBlend);

        gl_FragColor = vec4(color, 1.0);
      }
    `})}function b(e,{radius:a,material:t,name:l}){let o=new e.Group;o.name=l,o.userData={immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,environmentGeometryKind:"box",environmentRadius:a,partId:"world-environment",packetId:m,packetHash:f};let c=2/Math.sqrt(3),i=new e.BoxGeometry(c,c,c,1,1,1),r=new e.Mesh(i,t);return r.name=`${l}-mesh`,r.scale.setScalar(a),r.castShadow=!1,r.receiveShadow=!1,r.frustumCulled=!1,r.renderOrder=-1e3,r.onBeforeRender=function(n,p,d){d&&d.position&&(o.position.copy(d.position),o.updateMatrixWorld(!0))},o.add(r),o.object=o,o.group=o,o.mesh=r,o.material=t,o.geometry=i,o.dispose=function(){i.dispose(),t.dispose()},o}function y(e){e.traverse(a=>{a.geometry&&typeof a.geometry.dispose=="function"&&a.geometry.dispose();let t=Array.isArray(a.material)?a.material:[a.material].filter(Boolean);for(let l of t)l&&typeof l.dispose=="function"&&l.dispose()})}function w({THREE:e,part:a,world:t,seed:l,utilities:o}){let c=Math.max(56,Math.min(120,Number(t?.environment?.skyboxRadius||t?.environment?.radius||86))),i=x(e),r=o?.createSkyboxShell?o.createSkyboxShell({name:"single-emily-mason-against-flow-pressure-skybox",radius:c,geometryKind:"box",material:i,userData:{partId:"world-environment",role:"world-environment",packetId:m,packetHash:f,moduleId:v,selectedNewsPressure:"southampton-appeal-rejected-middlesbrough-hull-playoff-spygate",seed:String(l||a?.id||"world-environment")}}):b(e,{radius:c,material:i,name:"single-emily-mason-against-flow-pressure-skybox"}),s=r.object||r.group||r,n=r.mesh||s.children?.find(u=>u?.isMesh)||null;s.name="world-environment-emily-mason-against-flow-pressure",s.userData={...s.userData,immersiveWorldEnvironmentShell:!0,skybox:!0,cameraPinned:!0,partId:"world-environment",role:"world-environment",packetId:m,packetHash:f,moduleId:v,shellCountIntent:1,messagePurpose:a?.messagePurpose||"Surrounding artist-derived atmosphere with non-literal flow pressure."},n&&(n.name="dominant-position-space-painted-pressure-field",n.castShadow=!1,n.receiveShadow=!1,n.frustumCulled=!1,n.renderOrder=-1e3,n.material=i);function p(u={}){let h=u.captureMode?0:Number(u.elapsedSeconds??u.time??0);i.uniforms.uTime.value=Number.isFinite(h)?h:0}function d(){if(typeof r.dispose=="function"){r.dispose();return}y(s)}return p({captureMode:!0,elapsedSeconds:0}),{object:s,update:p,dispose:d,userData:{partId:"world-environment",moduleId:v,packetId:m,packetHash:f}}}export{w as createImmersiveWorldPart};
