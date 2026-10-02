import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

// Compile only the existing service module; no server or real mutations are used.
const bundle = await build({
  entryPoints: ['src/lib/apiClient.js'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  define: { 'import.meta.env.VITE_API_BASE_URL': '"https://api.example"' },
});
const { api } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);
globalThis.window = { location: { origin: 'https://lms.example' }, localStorage: { getItem: () => null }, dispatchEvent() {} };

test('material create sends multipart with file and topic, without a JSON Content-Type', async () => {
  const form = new FormData();
  form.set('topicId', 'topic-one');
  form.set('title', 'Bài giảng');
  form.set('type', 'PDF');
  form.set('file', new Blob(['pdf-content'], { type: 'application/pdf' }), 'bai-giang.pdf');
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/v1/topics/topic-one/materials');
    assert.equal(options.method, 'POST');
    assert.equal(options.body, form);
    assert.equal(options.body.get('file').name, 'bai-giang.pdf');
    assert.equal(options.headers['Content-Type'], undefined);
    return Response.json({ data: { materialId: 'new-material' } });
  };
  assert.equal((await api.materials.create('topic-one', form)).materialId, 'new-material');
});
test('Excel import sends file plus required subject and topic query parameters', async () => {
  const form = new FormData();
  form.set('file', new Blob(['excel-content']), 'questions.xlsx');
  globalThis.fetch = async (url, options) => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, '/api/v1/questions/import-excel');
    assert.equal(parsed.searchParams.get('subjectId'), 'subject-one');
    assert.equal(parsed.searchParams.get('topicId'), 'topic-one');
    assert.equal(options.method, 'POST');
    assert.equal(options.body, form);
    assert.equal(options.headers['Content-Type'], undefined);
    return Response.json({ data: { totalParsed: 3, totalImported: 2, warnings: ['Dòng 3 không hợp lệ'] } });
  };
  const result = await api.questions.importExcel(form, { subjectId: 'subject-one', topicId: 'topic-one' });
  assert.equal(result.totalImported, 2);
  assert.equal(result.warnings.length, 1);
});
test('API rejection is surfaced to the form instead of reporting success', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Tệp không đúng mẫu' }, { status: 400 });
  await assert.rejects(
    api.questions.importExcel(new FormData(), { subjectId: 'subject-one', topicId: 'topic-one' }),
    /Tệp không đúng mẫu/
  );
});
test('successful empty response is accepted', async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await api.materials.create('topic-one', new FormData()), null);
});

test('Excel import summary uses the shared alert instead of a page card', async () => {
  const source = readFileSync('src/pages/lecturers/LecturerContent.jsx', 'utf8');
  assert.doesNotMatch(source, /importResult/);
  assert.match(source, /action\.setNotice\(/);
  assert.match(source, /Đã đọc \$\{imported\.totalParsed/);
});
