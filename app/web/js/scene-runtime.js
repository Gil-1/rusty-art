let elementRuntimePromise = null;

export async function loadElementRuntime() {
  if (!elementRuntimePromise) {
    elementRuntimePromise = import('./scene-elements-runtime.js');
  }
  return elementRuntimePromise;
}

export function disposeObjectTree(obj) {
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
      else child.material.dispose();
    }
  });
}
