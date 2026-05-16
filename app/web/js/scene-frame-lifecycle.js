function resolveCallback(callback, label) {
  if (typeof callback !== 'function') {
    throw new TypeError(`${label} must be a function.`);
  }
  return callback;
}

function resolveTimerDelay(timeoutMs, fallback = 2500) {
  const delay = Number(timeoutMs);
  return Number.isFinite(delay) && delay >= 0 ? delay : fallback;
}

function createNoopResizeAdapter() {
  return {
    connect() {
      return () => {};
    },
    disconnect() {}
  };
}

export function createBrowserTimingAdapter(target = globalThis) {
  const setTimeoutFn = typeof target?.setTimeout === 'function'
    ? target.setTimeout.bind(target)
    : globalThis.setTimeout.bind(globalThis);
  const clearTimeoutFn = typeof target?.clearTimeout === 'function'
    ? target.clearTimeout.bind(target)
    : globalThis.clearTimeout.bind(globalThis);
  const requestAnimationFrameFn = typeof target?.requestAnimationFrame === 'function'
    ? target.requestAnimationFrame.bind(target)
    : (callback) => setTimeoutFn(() => callback(Date.now()), 16);
  const cancelAnimationFrameFn = typeof target?.cancelAnimationFrame === 'function'
    ? target.cancelAnimationFrame.bind(target)
    : clearTimeoutFn;

  return {
    requestAnimationFrame: requestAnimationFrameFn,
    cancelAnimationFrame: cancelAnimationFrameFn,
    setTimeout: setTimeoutFn,
    clearTimeout: clearTimeoutFn
  };
}

export function createBrowserResizeAdapter({
  canvas = null,
  target = globalThis,
  resizeObserverCtor = target?.ResizeObserver
} = {}) {
  let resizeHandler = null;
  let observer = null;

  const adapter = {
    connect(onResize) {
      adapter.disconnect();
      resizeHandler = () => onResize();

      if (typeof target?.addEventListener === 'function') {
        target.addEventListener('resize', resizeHandler);
      }

      if (typeof resizeObserverCtor === 'function' && canvas) {
        observer = new resizeObserverCtor(resizeHandler);
        observer.observe(canvas);
        if (canvas.parentElement) observer.observe(canvas.parentElement);
      }

      return () => adapter.disconnect();
    },

    disconnect() {
      if (resizeHandler && typeof target?.removeEventListener === 'function') {
        target.removeEventListener('resize', resizeHandler);
      }
      resizeHandler = null;

      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }
  };

  return adapter;
}

export function createRendererAnimationLoopAdapter(renderer) {
  return {
    setAnimationLoop(callback) {
      if (typeof renderer?.setAnimationLoop !== 'function') return false;
      renderer.setAnimationLoop(callback);
      return true;
    },
    disconnect() {
      if (typeof renderer?.setAnimationLoop === 'function') renderer.setAnimationLoop(null);
    }
  };
}

export class SceneFrameLifecycle {
  constructor({
    onResize,
    onFrame,
    timing = createBrowserTimingAdapter(),
    resizeAdapter = createNoopResizeAdapter(),
    animationLoopAdapter = null
  } = {}) {
    this.onResize = resolveCallback(onResize, 'onResize');
    this.onFrame = resolveCallback(onFrame, 'onFrame');
    this.timing = timing;
    this.resizeAdapter = resizeAdapter || createNoopResizeAdapter();
    this.animationLoopAdapter = animationLoopAdapter;

    this.frameCount = 0;
    this.frameWaiters = [];
    this.running = false;
    this.disposed = false;
    this.animationFrameId = null;
    this.usingAnimationLoop = false;
    this.resizeCleanup = null;

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
  }

  start() {
    if (this.disposed) {
      throw new Error('Cannot start a disposed scene frame lifecycle.');
    }
    if (this.running) return;

    this.running = true;
    this.resizeCleanup = this.resizeAdapter.connect?.(this.resize) || null;
    this.resize();
    if (this.animationLoopAdapter?.setAnimationLoop?.(this.animate)) {
      this.usingAnimationLoop = true;
    } else {
      this.scheduleNextFrame();
    }
  }

  scheduleNextFrame() {
    if (this.usingAnimationLoop) return;
    if (!this.running || this.animationFrameId != null) return;
    this.animationFrameId = this.timing.requestAnimationFrame(this.animate);
  }

  animate(timestamp) {
    if (!this.running) return;
    if (!this.usingAnimationLoop) this.animationFrameId = null;
    this.onFrame({ timestamp, frameCount: this.frameCount });
    this.markFrameRendered();
    this.scheduleNextFrame();
  }

  resize() {
    return this.onResize();
  }

  waitForRenderedFrame(timeoutMs = 2500) {
    const targetFrame = this.frameCount + 1;
    const delay = resolveTimerDelay(timeoutMs);

    return new Promise((resolve, reject) => {
      const waiter = {
        targetFrame,
        settled: false,
        timeoutId: null,
        resolve: () => {
          if (waiter.settled) return;
          waiter.settled = true;
          this.timing.clearTimeout(waiter.timeoutId);
          resolve(targetFrame);
        },
        reject: (error) => {
          if (waiter.settled) return;
          waiter.settled = true;
          this.timing.clearTimeout(waiter.timeoutId);
          reject(error);
        }
      };

      waiter.timeoutId = this.timing.setTimeout(() => {
        this.frameWaiters = this.frameWaiters.filter((entry) => entry !== waiter);
        waiter.reject(new Error('Timed out while waiting for rendered frame.'));
      }, delay);

      this.frameWaiters.push(waiter);
    });
  }

  markFrameRendered() {
    this.frameCount += 1;
    if (!this.frameWaiters.length) return;

    const dueWaiters = this.frameWaiters.filter((waiter) => this.frameCount >= waiter.targetFrame);
    this.frameWaiters = this.frameWaiters.filter((waiter) => this.frameCount < waiter.targetFrame);
    dueWaiters.forEach((waiter) => waiter.resolve());
  }

  stop({ rejectWaiters = true } = {}) {
    this.running = false;

    if (this.usingAnimationLoop) {
      const cleared = this.animationLoopAdapter?.setAnimationLoop?.(null);
      if (!cleared) this.animationLoopAdapter?.disconnect?.();
      this.usingAnimationLoop = false;
    } else if (this.animationFrameId != null) {
      this.timing.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.resizeCleanup) {
      this.resizeCleanup();
      this.resizeCleanup = null;
    } else {
      this.resizeAdapter.disconnect?.();
    }

    if (rejectWaiters && this.frameWaiters.length) {
      const pending = this.frameWaiters;
      this.frameWaiters = [];
      const error = new Error('Scene frame lifecycle stopped before rendering another frame.');
      pending.forEach((waiter) => waiter.reject(error));
    }
  }

  dispose() {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
  }

  getFrameCount() {
    return this.frameCount;
  }

  getPendingWaiters() {
    return this.frameWaiters;
  }

  getPendingWaiterCount() {
    return this.frameWaiters.length;
  }

  getFacts() {
    return {
      frameCount: this.frameCount,
      pendingWaiters: this.frameWaiters.length,
      running: this.running,
      disposed: this.disposed,
      usingAnimationLoop: this.usingAnimationLoop,
      scheduledAnimationFrame: this.animationFrameId != null
    };
  }
}

export function createSceneFrameLifecycle(options = {}) {
  return new SceneFrameLifecycle(options);
}
