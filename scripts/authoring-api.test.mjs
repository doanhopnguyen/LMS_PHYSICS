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

test('experiment submissions use documented class and global filters', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(options.method, 'GET');
    calls.push(new URL(url));
    return Response.json({ data: [{ submissionId: 'submission-one', status: 'PENDING' }] });
  };
  assert.equal((await api.experiments.classSubmissions('class-one', { status: 'PENDING', experimentId: 'lab-one' })).length, 1);
  await api.experiments.submissions({ myClassesOnly: true });
  assert.equal(calls[0].pathname, '/api/v1/classes/class-one/experiment-submissions');
  assert.equal(calls[0].searchParams.get('status'), 'PENDING');
  assert.equal(calls[0].searchParams.get('experimentId'), 'lab-one');
  assert.equal(calls[1].pathname, '/api/v1/experiments/submissions');
  assert.equal(calls[1].searchParams.get('myClassesOnly'), 'true');
});

test('experiment detail and rubric summary use submission IDs from selection', async () => {
  const calls = [];
  globalThis.fetch = async (url) => { calls.push(new URL(url).pathname); return Response.json({ data: { submissionId: 'submission-one' } }); };
  await api.experiments.getSubmission('submission-one');
  await api.experiments.submissionRubrics('submission-one');
  await api.experiments.rubricSummary('submission-one');
  assert.deepEqual(calls, [
    '/api/v1/experiments/submissions/submission-one',
    '/api/v1/experiments/submissions/submission-one/rubrics',
    '/api/v1/experiments/submissions/submission-one/rubric-summary',
  ]);
});

test('experiment rubric save preserves zero and confirmation sends the note', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ path: new URL(url).pathname, method: options.method, body: JSON.parse(options.body) });
    return new Response(null, { status: 204 });
  };
  await api.experiments.gradeSubmission('submission-one', { rubricId: 'criterion-one', score: 0, comment: 'Chưa đạt' });
  await api.experiments.confirmSubmission('submission-one', { note: 'Đã kiểm tra' });
  assert.deepEqual(calls, [
    { path: '/api/v1/experiments/submissions/submission-one/scores', method: 'POST', body: { rubricId: 'criterion-one', score: 0, comment: 'Chưa đạt' } },
    { path: '/api/v1/experiments/submissions/submission-one/confirmation', method: 'POST', body: { note: 'Đã kiểm tra' } },
  ]);
});

test('Excel import summary uses the shared alert instead of a page card', async () => {
  const source = readFileSync('src/pages/lecturers/LecturerContent.jsx', 'utf8');
  assert.doesNotMatch(source, /importResult/);
  assert.match(source, /action\.setNotice\(/);
  assert.match(source, /Đã đọc \$\{imported\.totalParsed/);
});
