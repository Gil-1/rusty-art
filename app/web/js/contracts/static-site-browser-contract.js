export const STATIC_SITE_BUNDLE_EXPECTATIONS = Object.freeze({
  viteBase: './',
  webRoot: 'app/web',
  distDir: 'app/web-dist',
  manifestPath: 'data/manifest.json',
  latestPath: 'data/latest.json',
  publicDebugArchivePath: 'data/artworks-debug'
});

export const RUNTIME_DATA_COPY_CONTRACT = Object.freeze({
  dataDirName: 'data',
  cleanupActionId: 'cleanup-runtime-data',
  copyActionId: 'copy-runtime-data',
  cleanupOptions: Object.freeze({ recursive: true, force: true }),
  copyOptions: Object.freeze({ recursive: true })
});

export function getStaticSiteBundleExpectations() {
  return { ...STATIC_SITE_BUNDLE_EXPECTATIONS };
}

export function getRuntimeDataCopyContract() {
  return {
    dataDirName: RUNTIME_DATA_COPY_CONTRACT.dataDirName,
    cleanupActionId: RUNTIME_DATA_COPY_CONTRACT.cleanupActionId,
    copyActionId: RUNTIME_DATA_COPY_CONTRACT.copyActionId,
    cleanupOptions: { ...RUNTIME_DATA_COPY_CONTRACT.cleanupOptions },
    copyOptions: { ...RUNTIME_DATA_COPY_CONTRACT.copyOptions }
  };
}
