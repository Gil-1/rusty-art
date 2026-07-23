import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8')
);

test('frontend declares the current pnpm runtime contract', () => {
  assert.equal(packageJson.packageManager, 'pnpm@11.16.0');
});
