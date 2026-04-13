const PULSE_PROFILES = {
  balanced: { amp: 0.034, freq: 0.5 },
  musical: { amp: 0.046, freq: 0.58 },
  retinal: { amp: 0.055, freq: 0.92 },
  meditative: { amp: 0.026, freq: 0.28 },
  ascending: { amp: 0.032, freq: 0.44 },
  playful: { amp: 0.046, freq: 0.7 },
  rotational: { amp: 0.04, freq: 0.62 },
  minimal: { amp: 0.012, freq: 0.22 },
  ticking: { amp: 0.032, freq: 0.78 }
};

function pulseWaveByFamily(family, phase) {
  if (family === 'musical') {
    return Math.sin(phase) * 0.66 + Math.sin(phase * 2.01 + 0.8) * 0.34;
  }
  if (family === 'retinal') {
    return Math.sin(phase) * 0.52 + Math.sin(phase * 2.7) * 0.48;
  }
  if (family === 'meditative') {
    return Math.sin(phase) * 0.78 + Math.sin(phase * 0.45 + 1.2) * 0.22;
  }
  if (family === 'ascending') {
    const cyc = (phase / (Math.PI * 2)) % 1;
    return cyc * 2 - 1;
  }
  if (family === 'playful') {
    return Math.sin(phase + Math.sin(phase * 0.5) * 0.5);
  }
  if (family === 'rotational') {
    return Math.cos(phase * 1.15 + Math.sin(phase * 0.37) * 0.35);
  }
  if (family === 'minimal') {
    const cyc = (phase / (Math.PI * 2)) % 1;
    return cyc < 0.88 ? -0.42 : 0.92;
  }
  if (family === 'ticking') {
    const step = Math.floor(((phase / (Math.PI * 2)) % 1) * 8);
    return (step % 2 === 0 ? 1 : -1) * 0.8;
  }
  return Math.sin(phase);
}

export function applyPrimitiveAnimations({ animations = [], motionT, speed, motion, styleFingerprint = {} } = {}) {
  animations.forEach(({ obj, animation, baseTransform = null, seedPhase = 0 }) => {
    const base = baseTransform || {
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
      scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z }
    };
    const phase = motionT + seedPhase;

    obj.rotation.set(base.rotation.x, base.rotation.y, base.rotation.z);
    obj.position.set(base.position.x, base.position.y, base.position.z);
    obj.scale.set(base.scale.x, base.scale.y, base.scale.z);

    if (animation.rotationZ) obj.rotation.z = base.rotation.z + phase * speed * 20 * animation.rotationZ;
    if (animation.wobbleX) obj.rotation.x = base.rotation.x + Math.sin(phase * 0.22) * animation.wobbleX * motion;
    if (animation.wobbleY) obj.rotation.y = base.rotation.y + Math.cos(phase * 0.17) * animation.wobbleY * motion;
    if (animation.pulse) {
      const family = styleFingerprint.pulseFamily;
      const profile = PULSE_PROFILES[family] || PULSE_PROFILES.balanced;
      const cadenceBias = styleFingerprint.cadenceBias || 0;
      const edgeSoftness = styleFingerprint.edgeSoftness || 0.25;
      const baseFreq = (profile.freq + animation.pulse) * (1 + cadenceBias * 0.12);
      const pulsePhase = phase * baseFreq;
      const wave = pulseWaveByFamily(family, pulsePhase);
      const softnessDamping = 1 - Math.min(0.18, edgeSoftness * 0.12);
      const pulse = 1 + wave * profile.amp * softnessDamping * motion;
      obj.scale.set(base.scale.x * pulse, base.scale.y * pulse, base.scale.z * pulse);
    }
    if (animation.drift) {
      obj.position.x = base.position.x + Math.sin(phase * animation.drift * 0.3) * 0.2 * motion;
      obj.position.y = base.position.y + Math.cos(phase * animation.drift * 0.22) * 0.14 * motion;
    }
  });
}
