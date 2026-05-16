export function createSceneElapsedTimer(three = null, {
  documentRef = typeof document !== 'undefined' ? document : null,
  now = () => globalThis.performance?.now?.() ?? Date.now()
} = {}) {
  if (typeof three?.Timer === 'function') {
    const timer = new three.Timer();
    if (documentRef && typeof timer.connect === 'function') timer.connect(documentRef);
    timer.update();
    return {
      update() {
        timer.update();
        return this;
      },
      getElapsedTime() {
        return timer.getElapsed();
      },
      dispose() {
        timer.dispose?.();
      }
    };
  }

  const startTime = now();
  let elapsedSeconds = 0;

  return {
    update(timestamp) {
      const currentTime = Number.isFinite(timestamp) ? timestamp : now();
      elapsedSeconds = Math.max(0, (currentTime - startTime) / 1000);
      return this;
    },
    getElapsedTime() {
      return elapsedSeconds;
    },
    dispose() {}
  };
}
