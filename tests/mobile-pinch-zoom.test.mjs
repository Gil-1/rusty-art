import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('art canvas permits native mobile pinch zoom', async () => {
  const styles = await readFile(new URL('../app/web/styles.css', import.meta.url), 'utf8');
  const canvasRule = styles.match(/#art-canvas\s*{[^}]*}/);

  assert.ok(canvasRule, 'missing #art-canvas rule');
  assert.match(canvasRule[0], /touch-action:\s*pinch-zoom;/);
  assert.doesNotMatch(canvasRule[0], /touch-action:\s*none;/);
});

test('mobile viewport does not opt out of user scaling', async () => {
  const html = await readFile(new URL('../app/web/index.html', import.meta.url), 'utf8');
  const viewport = html.match(/<meta\s+name="viewport"\s+content="([^"]*)"\s*\/?>/);

  assert.ok(viewport, 'missing viewport meta tag');
  assert.doesNotMatch(viewport[1], /user-scalable\s*=\s*no/i);
  assert.doesNotMatch(viewport[1], /maximum-scale\s*=\s*1(?:\.0+)?/i);
});
