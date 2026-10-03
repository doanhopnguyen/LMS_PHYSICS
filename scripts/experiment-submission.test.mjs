import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildExperimentSubmission } from '../src/lib/experimentSubmission.js';

const report = { schemaVersion: 1, experimentType: 'FREE_FALL_3D', units: { heightM: 'm', timeS: 's' }, measurements: [{ trial: 1, heightM: 0.5, timeS: 0.32 }], notes: 'Nhận xét tiếng Việt' };

test('structured report is sent as JSON file, without the unsupported rawDataJson field', async () => {
  const form = await buildExperimentSubmission({ report, evidenceUrl: ' https://example.test/report ' });
  assert.deepEqual([...form.keys()], ['file', 'evidenceUrl']);
  assert.equal(form.has('rawDataJson'), false);
  assert.equal(form.get('file').name, 'so-lieu-thi-nghiem.json');
  assert.equal(form.get('file').type, 'application/json');
  assert.deepEqual(JSON.parse(await form.get('file').text()), { ...report, evidenceUrl: 'https://example.test/report' });
});

test('file-only and URL-only submissions keep the existing backend contract', async () => {
  const file = new File(['Evidence bytes'], 'report.csv', { type: 'text/csv' });
  const form = await buildExperimentSubmission({ file });
  assert.equal(form.get('file'), file);
  assert.equal(form.has('rawDataJson'), false);
  const url = await buildExperimentSubmission({ evidenceUrl: ' https://example.test/result ' });
  assert.deepEqual([...url.keys()], ['evidenceUrl']);
  assert.equal(url.get('evidenceUrl'), 'https://example.test/result');
});

test('ZIP opens with Python zipfile, preserves CRC, Vietnamese filenames, JSON and original bytes', async () => {
  const bytes = new Uint8Array([0, 255, 32, 13, 10, 128, 42]);
  const form = await buildExperimentSubmission({ report, file: new File([bytes], 'Minh chứng.bin'), evidenceUrl: 'https://example.test/result' });
  assert.deepEqual([...form.keys()], ['file', 'evidenceUrl']);
  const file = form.get('file');
  assert.equal(file.type, 'application/zip');
  const folder = await mkdtemp(join(tmpdir(), 'physics-report-'));
  const path = join(folder, 'report.zip');
  try {
    await writeFile(path, Buffer.from(await file.arrayBuffer()));
    const actual = JSON.parse(execFileSync('python', ['-c', 'import sys,json,zipfile,base64; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print(json.dumps({n:base64.b64encode(z.read(n)).decode() for n in z.namelist()}))', path], { encoding: 'utf8' }));
    assert.deepEqual(Object.keys(actual), ['so-lieu.json', 'minh-chung/Minh chứng.bin']);
    assert.deepEqual(JSON.parse(Buffer.from(actual['so-lieu.json'], 'base64').toString('utf8')), { ...report, evidenceUrl: 'https://example.test/result' });
    assert.deepEqual(Buffer.from(actual['minh-chung/Minh chứng.bin'], 'base64'), Buffer.from(bytes));
  } finally {
    await unlink(path).catch(() => {});
    await rmdir(folder);
  }
});

test('a supplied link is kept inside the upload even for custom file-only reports', async () => {
  const form = await buildExperimentSubmission({ file: new File(['Report'], 'report.txt'), evidenceUrl: 'https://example.test/result' });
  assert.equal(form.get('file').type, 'application/zip');
  assert.equal(form.get('evidenceUrl'), 'https://example.test/result');
});

test('empty reports are rejected in FE before sending a request', async () => {
  await assert.rejects(buildExperimentSubmission({ evidenceUrl: '  ' }), /Cần có số liệu/);
});
