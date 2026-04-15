export function bindOrbitInput(scene) {
  scene.canvas.addEventListener('pointerdown', (event) => {
    if (event.isPrimary === false) return;
    scene.orbit.dragging = true;
    scene.orbit.userControlLocked = true;
    scene.orbit.lastX = event.clientX;
    scene.orbit.lastY = event.clientY;
    if (event.pointerType === 'touch') event.preventDefault();
    scene.canvas.setPointerCapture?.(event.pointerId);
  }, { passive: false });

  scene.canvas.addEventListener('pointermove', (event) => {
    if (!scene.orbit.dragging) return;
    if (event.pointerType === 'touch') event.preventDefault();
    const dx = event.clientX - scene.orbit.lastX;
    const dy = event.clientY - scene.orbit.lastY;
    scene.orbit.lastX = event.clientX;
    scene.orbit.lastY = event.clientY;
    scene.orbit.thetaVel -= dx * 0.0036;
    scene.orbit.phiVel -= dy * 0.0028;
  }, { passive: false });

  const endDrag = (event) => {
    scene.orbit.dragging = false;
    if (event?.pointerId != null) scene.canvas.releasePointerCapture?.(event.pointerId);
  };
  scene.canvas.addEventListener('pointerup', endDrag);
  scene.canvas.addEventListener('pointercancel', endDrag);
  scene.canvas.addEventListener('pointerleave', endDrag);

  scene.canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    scene.orbit.userControlLocked = true;
    const zoom = Math.exp((event.deltaY > 0 ? 1 : -1) * 0.08);
    scene.orbit.radius = Math.min(
      scene.controls.maxDistance,
      Math.max(scene.controls.minDistance, scene.orbit.radius * zoom)
    );
  }, { passive: false });
}

export function updateCameraFromOrbit(scene) {
  const eps = 0.0001;
  scene.orbit.phi = Math.min(Math.PI - eps, Math.max(eps, scene.orbit.phi));
  const radius = scene.orbit.radius;
  const sinPhi = Math.sin(scene.orbit.phi);
  scene.camera.position.set(
    scene.orbit.target.x + radius * sinPhi * Math.sin(scene.orbit.theta),
    scene.orbit.target.y + radius * Math.cos(scene.orbit.phi),
    scene.orbit.target.z + radius * sinPhi * Math.cos(scene.orbit.theta)
  );
  scene.camera.lookAt(scene.orbit.target);
}

function sampleCameraRail(cameraBeats, phase, cameraCycleSeconds) {
  if (!Array.isArray(cameraBeats) || cameraBeats.length < 2) return null;
  const p = Math.max(0, Math.min(1, phase));
  let i = 0;
  while (i < cameraBeats.length - 1 && p > cameraBeats[i + 1].t) i += 1;
  const a = cameraBeats[i];
  const b = cameraBeats[Math.min(i + 1, cameraBeats.length - 1)];
  const span = Math.max(0.0001, b.t - a.t);
  let local = (p - a.t) / span;
  local = local * local * (3 - 2 * local);

  const holdA = Math.min(0.3, (a.hold || 0) / Math.max(0.1, cameraCycleSeconds));
  const holdB = Math.min(0.3, (b.hold || 0) / Math.max(0.1, cameraCycleSeconds));
  if (local < holdA) local = 0;
  else if (local > 1 - holdB) local = 1;
  else local = (local - holdA) / Math.max(0.0001, 1 - holdA - holdB);

  return {
    radius: a.radius + (b.radius - a.radius) * local,
    theta: a.theta + (b.theta - a.theta) * local,
    phi: a.phi + (b.phi - a.phi) * local
  };
}

export function updateOrbitForFrame(scene, { t, motionT, speed, motion }) {
  if (scene.captureMode) {
    updateCameraFromOrbit(scene);
    return;
  }

  const canAutoMoveCamera = !scene.orbit.dragging && !scene.orbit.userControlLocked;
  const viewportFrame = scene.viewportOrbitFrame || { radiusMultiplier: 1, phiOffset: 0 };
  const radiusMultiplier = Number.isFinite(viewportFrame.radiusMultiplier) ? viewportFrame.radiusMultiplier : 1;
  const phiOffset = Number.isFinite(viewportFrame.phiOffset) ? viewportFrame.phiOffset : 0;
  if (scene.cameraMotionEnabled && scene.cameraBeats && canAutoMoveCamera) {
    const cycleSeconds = Math.max(0.1, scene.cameraCycleSeconds || 24);
    const phase = (t % cycleSeconds) / cycleSeconds;
    const sampled = sampleCameraRail(scene.cameraBeats, phase, cycleSeconds);
    if (sampled) {
      const sway = scene.styleFingerprint.cameraSway || 0;
      scene.orbit.radius = Math.min(
        scene.controls.maxDistance,
        Math.max(scene.controls.minDistance, sampled.radius * radiusMultiplier)
      );
      scene.orbit.theta = sampled.theta + Math.sin(motionT * 0.07) * sway * 0.06 * motion;
      scene.orbit.phi = sampled.phi + phiOffset + Math.cos(motionT * 0.05) * sway * 0.03 * motion;
    }
  } else {
    if (scene.controls.autoRotate && canAutoMoveCamera) {
      scene.orbit.theta += speed * scene.controls.autoRotateSpeed * 4 * motion;
    }
    scene.orbit.theta += scene.orbit.thetaVel;
    scene.orbit.phi += scene.orbit.phiVel;
    scene.orbit.thetaVel *= 1 - scene.controls.dampingFactor;
    scene.orbit.phiVel *= 1 - scene.controls.dampingFactor;
  }

  updateCameraFromOrbit(scene);
}
