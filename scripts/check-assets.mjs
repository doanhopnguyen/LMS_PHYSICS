import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  }));
  return nested.flat();
}

// Audit repository assets, not images uploaded to the backend at runtime.
const sourceFiles = ['index.html', ...(await files('src'))];
const sources = await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')));
const tracked = new Set(execFileSync('git', ['ls-files', '-z', '--', 'public'], { encoding: 'utf8' }).split('\0'));
const assets = await files('public');
const unused = [];
for (const asset of assets) {
  const normalized = asset.replaceAll('\\', '/');
  assert.ok(tracked.has(normalized), `Source asset is missing from Git: ${normalized}`);
  const relative = normalized.slice('public/'.length);
  if (!sources.some((source) => source.includes(relative))) unused.push(normalized);
  if (process.argv.includes('--build')) {
    const built = await readFile(path.join('dist', relative));
    assert.ok(built.equals(await readFile(asset)), `Build asset differs from its source: ${relative}`);
  }
}
for (let index = 0; index < sources.length; index++) {
  assert.ok(!/["'`]\/?dist\//.test(sources[index]), `Runtime source points into dist: ${sourceFiles[index]}`);
  assert.ok(!/["'`]\/public\//.test(sources[index]), `Public URL incorrectly includes /public/: ${sourceFiles[index]}`);
}
console.log(`PASS: ${assets.length} public assets are tracked; runtime sources do not point into dist/ or /public/.`);
if (process.argv.includes('--build')) console.log('PASS: every public asset is present and identical in dist/.');
if (unused.length) console.log('No literal reference found in src/ or index.html (review before removing):\n' + unused.join('\n'));
