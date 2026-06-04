const TOUCH_DRAG_SENSITIVITY = 0.2;
export const CANONICAL_VIEWER_CAMERA = Object.freeze({
  target: Object.freeze([0, 0, 0]),
  pose: Object.freeze({
    radius: 12,
    theta: 0,
    phi: Math.PI / 2.2
  })
});
export const FULL_FRAME_SURFACE_CAMERA = Object.freeze({
  target: Object.freeze([0, 0, 0]),
  pose: Object.freeze({
    radius: 7.2,
    theta: 0,
    phi: Math.PI / 2
  })
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function bindOrbitInput(scene) {
  const bindings = [];
  const activePointers = new Map();
  const touchTarget = scene.canvas.ownerDocument?.defaultView || scene.canvas;
  let lastPointerPinchDistance = null;
  let touchPinchActive = false;
  let lastTouchPinchDistance = null;
  let lastGestureScale = null;
  const on = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    bindings.push({ target, type, handler, options });
  };

  const rememberPointer = (event) => {
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };

  const getDistance = (points) => {
    if (points.length < 2) return null;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };

  const getPointerPinchDistance = () => getDistance(Array.from(activePointers.values()));

  const getTouchPinchDistance = (touches) => getDistance(Array.from(touches, (touch) => ({
    x: touch.clientX,
    y: touch.clientY
  })));

  const applyDistanceZoom = (previousDistance, nextDistance) => {
    if (!(previousDistance > 0) || !(nextDistance > 0)) return;
    scene.orbit.radius = clamp(
      scene.orbit.radius * (previousDistance / nextDistance),
      scene.controls.minDistance,
      scene.controls.maxDistance
    );
    scene.orbit.userControlLocked = true;
    scene.orbit.dragging = false;
  };

  const applyPointerPinchZoom = () => {
    const pinchDistance = getPointerPinchDistance();
    if (pinchDistance == null) return false;
    applyDistanceZoom(lastPointerPinchDistance, pinchDistance);
    lastPointerPinchDistance = pinchDistance;
    return true;
  };

  const beginTouchPinch = (event) => {
    if (event.touches.length < 2) return;
    event.preventDefault();
    touchPinchActive = true;
    activePointers.clear();
    lastPointerPinchDistance = null;
    lastTouchPinchDistance = getTouchPinchDistance(event.touches);
    scene.orbit.userControlLocked = true;
    scene.orbit.dragging = false;
  };

  const updateTouchPinch = (event) => {
    if (event.touches.length < 2) return;
    event.preventDefault();
    const pinchDistance = getTouchPinchDistance(event.touches);
    applyDistanceZoom(lastTouchPinchDistance, pinchDistance);
    lastTouchPinchDistance = pinchDistance;
    touchPinchActive = true;
  };

  const endTouchPinch = (event) => {
    if (event.touches.length > 1) {
      lastTouchPinchDistance = getTouchPinchDistance(event.touches);
      return;
    }
    touchPinchActive = false;
    lastTouchPinchDistance = null;
    lastGestureScale = null;
    activePointers.clear();
    lastPointerPinchDistance = null;
    scene.orbit.dragging = false;
  };

  const preventGestureZoom = (event) => {
    event.preventDefault();
    scene.orbit.userControlLocked = true;
    scene.orbit.dragging = false;
  };

  on(scene.canvas, 'pointerdown', (event) => {
    if (event.pointerType === 'touch') {
      event.preventDefault();
      if (touchPinchActive) return;
      rememberPointer(event);
      scene.orbit.userControlLocked = true;
      scene.canvas.setPointerCapture?.(event.pointerId);
      if (activePointers.size > 1) {
        applyPointerPinchZoom();
        return;
      }
    } else if (event.isPrimary === false) {
      return;
    }
    scene.orbit.dragging = true;
    scene.orbit.userControlLocked = true;
    scene.orbit.lastX = event.clientX;
    scene.orbit.lastY = event.clientY;
    scene.canvas.setPointerCapture?.(event.pointerId);
  }, { passive: false });

  on(scene.canvas, 'pointermove', (event) => {
    const isTouch = event.pointerType === 'touch';
    if (isTouch) {
      event.preventDefault();
      if (touchPinchActive) return;
      if (!activePointers.has(event.pointerId)) return;
      rememberPointer(event);
      if (activePointers.size > 1) {
        applyPointerPinchZoom();
        return;
      }
    }
    if (!scene.orbit.dragging) return;
    const dx = event.clientX - scene.orbit.lastX;
    const dy = event.clientY - scene.orbit.lastY;
    const sensitivity = isTouch ? TOUCH_DRAG_SENSITIVITY : 1;
    scene.orbit.lastX = event.clientX;
    scene.orbit.lastY = event.clientY;
    scene.orbit.thetaVel -= dx * 0.0036 * sensitivity;
    scene.orbit.phiVel -= dy * 0.0028 * sensitivity;
  }, { passive: false });

  const endDrag = (event) => {
    if (event?.pointerType === 'touch') {
      activePointers.delete(event.pointerId);
      lastPointerPinchDistance = activePointers.size > 1 ? getPointerPinchDistance() : null;
      if (activePointers.size === 1 && !touchPinchActive) {
        const remainingTouch = activePointers.values().next().value;
        scene.orbit.dragging = true;
        scene.orbit.lastX = remainingTouch.x;
        scene.orbit.lastY = remainingTouch.y;
      } else {
        scene.orbit.dragging = false;
      }
    } else {
      scene.orbit.dragging = false;
    }
    if (event?.pointerId != null) scene.canvas.releasePointerCapture?.(event.pointerId);
  };
  on(scene.canvas, 'pointerup', endDrag);
  on(scene.canvas, 'pointercancel', endDrag);
  on(scene.canvas, 'pointerleave', endDrag);

  on(scene.canvas, 'wheel', (event) => {
    event.preventDefault();
    scene.orbit.userControlLocked = true;
    const zoom = Math.exp((event.deltaY > 0 ? 1 : -1) * 0.08);
    scene.orbit.radius = Math.min(
      scene.controls.maxDistance,
      Math.max(scene.controls.minDistance, scene.orbit.radius * zoom)
    );
  }, { passive: false });

  on(touchTarget, 'touchstart', beginTouchPinch, { passive: false, capture: true });
  on(touchTarget, 'touchmove', updateTouchPinch, { passive: false, capture: true });
  on(touchTarget, 'touchend', endTouchPinch, { passive: false, capture: true });
  on(touchTarget, 'touchcancel', endTouchPinch, { passive: false, capture: true });
  on(touchTarget, 'gesturestart', (event) => {
    preventGestureZoom(event);
    lastGestureScale = event.scale || 1;
  }, { passive: false, capture: true });
  on(touchTarget, 'gesturechange', (event) => {
    preventGestureZoom(event);
    if (touchPinchActive) return;
    const nextScale = event.scale || 1;
    if (lastGestureScale > 0 && nextScale > 0) {
      scene.orbit.radius = clamp(
        scene.orbit.radius * (lastGestureScale / nextScale),
        scene.controls.minDistance,
        scene.controls.maxDistance
      );
    }
    lastGestureScale = nextScale;
  }, { passive: false, capture: true });
  on(touchTarget, 'gestureend', (event) => {
    preventGestureZoom(event);
    lastGestureScale = null;
  }, { passive: false, capture: true });

  return () => {
    for (const binding of bindings) {
      binding.target.removeEventListener?.(binding.type, binding.handler, binding.options);
    }
  };
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
    resetCameraForArtwork(scene, scene.currentArtworkCameraConfig || {});
    updateCameraFromOrbit(scene);
    scene.canonicalFirstViewEstablished = true;
    return;
  }

  if (scene.canonicalFirstViewEstablished !== true) {
    updateCameraFromOrbit(scene);
    scene.canonicalFirstViewEstablished = true;
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

export function computeViewportOrbitFrame(aspect = 1) {
  const portraitInfluence = clamp((1 - aspect) / 0.44, 0, 1);
  if (portraitInfluence === 0) {
    return { radiusMultiplier: 1, phiOffset: 0, targetYOffset: 0 };
  }
  return {
    radiusMultiplier: 1 - portraitInfluence * 0.1,
    phiOffset: -portraitInfluence * 0.05,
    targetYOffset: -portraitInfluence * 0.24
  };
}

export function applyViewportOrbitFrame(scene, { resetOrbit = false } = {}) {
  const previous = scene.viewportOrbitFrame || { radiusMultiplier: 1, phiOffset: 0, targetYOffset: 0 };
  const next = computeViewportOrbitFrame(scene.camera.aspect || 1);
  scene.viewportOrbitFrame = next;

  scene.orbit.target.set(
    scene.baseOrbitTarget.x,
    scene.baseOrbitTarget.y + next.targetYOffset,
    scene.baseOrbitTarget.z
  );

  if (resetOrbit) {
    scene.orbit.radius = scene.baseOrbitPose.radius * next.radiusMultiplier;
    scene.orbit.theta = scene.baseOrbitPose.theta;
    scene.orbit.phi = scene.baseOrbitPose.phi + next.phiOffset;
    updateCameraFromOrbit(scene);
    return;
  }

  const prevRadiusMultiplier = Math.max(0.01, previous.radiusMultiplier || 1);
  const radiusRatio = next.radiusMultiplier / prevRadiusMultiplier;
  scene.orbit.radius = clamp(
    scene.orbit.radius * radiusRatio,
    scene.controls.minDistance,
    scene.controls.maxDistance
  );
  scene.orbit.phi += next.phiOffset - (previous.phiOffset || 0);
  updateCameraFromOrbit(scene);
}

export function resetCameraForArtwork(scene, camCfg = {}) {
  const sourceCfg = camCfg && typeof camCfg === 'object' && !Array.isArray(camCfg) ? camCfg : {};
  scene.currentArtworkCameraConfig = sourceCfg;
  const framing = sourceCfg.materializationFraming && typeof sourceCfg.materializationFraming === 'object' && !Array.isArray(sourceCfg.materializationFraming)
    ? sourceCfg.materializationFraming
    : null;
  const fullFrameSurface = framing?.fullFrameSurface === true || framing?.mode === 'full-frame-surface';
  const cameraProfile = fullFrameSurface ? FULL_FRAME_SURFACE_CAMERA : CANONICAL_VIEWER_CAMERA;

  scene.baseOrbitPose.radius = cameraProfile.pose.radius;
  scene.baseOrbitPose.theta = cameraProfile.pose.theta;
  scene.baseOrbitPose.phi = cameraProfile.pose.phi;

  scene.baseOrbitTarget.set(
    cameraProfile.target[0],
    cameraProfile.target[1],
    cameraProfile.target[2]
  );

  scene.orbit.radius = scene.baseOrbitPose.radius;
  scene.orbit.theta = scene.baseOrbitPose.theta;
  scene.orbit.phi = scene.baseOrbitPose.phi;
  scene.orbit.thetaVel = 0;
  scene.orbit.phiVel = 0;
  scene.orbit.dragging = false;
  scene.orbit.userControlLocked = false;
  scene.canonicalFirstViewEstablished = false;
  applyViewportOrbitFrame(scene, { resetOrbit: true });
}

export function createSceneCameraInteraction(scene) {
  let inputTeardown = null;

  return Object.freeze({
    bindInput() {
      inputTeardown?.();
      inputTeardown = bindOrbitInput(scene);
      return inputTeardown;
    },
    dispose() {
      inputTeardown?.();
      inputTeardown = null;
    },
    updateCamera() {
      return updateCameraFromOrbit(scene);
    },
    resetForArtwork(camCfg = {}) {
      return resetCameraForArtwork(scene, camCfg);
    },
    computeViewportFrame(aspect = scene.camera.aspect || 1) {
      return computeViewportOrbitFrame(aspect);
    },
    applyViewportFrame(options = {}) {
      return applyViewportOrbitFrame(scene, options);
    },
    updateForFrame(frameFacts) {
      return updateOrbitForFrame(scene, frameFacts);
    }
  });
}
