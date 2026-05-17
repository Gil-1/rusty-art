function readClockNow(now) {
  const value = Number(now?.());
  return Number.isFinite(value) ? value : Date.now();
}

export function createSceneElapsedTimer(_three = null, {
  now = () => globalThis.performance?.now?.() ?? Date.now()
} = {}) {
  const startTime = readClockNow(now);
  let lastTime = startTime;
  let elapsedSeconds = 0;

  return {
    update(timestamp) {
      const currentTime = Number.isFinite(timestamp) ? timestamp : readClockNow(now);
      const monotonicTime = Math.max(lastTime, currentTime);
      elapsedSeconds = Math.max(0, (monotonicTime - startTime) / 1000);
      lastTime = monotonicTime;
      return this;
    },
    getElapsedTime() {
      return elapsedSeconds;
    },
    dispose() {}
  };
}
