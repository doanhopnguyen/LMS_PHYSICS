import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { canAccess } from '../src/lib/demoSession.js';

const bundle = await build({ entryPoints: ['src/lib/apiClient.js'], bundle: true, write: false, format: 'esm', platform: 'node', define: { 'import.meta.env.VITE_API_BASE_URL': '"https://api.example"' } });
const { api, apiRequest } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
globalThis.window = { location: { origin: 'https://lms.example' }, localStorage: { getItem: () => null } };

test('instructors cannot open question authoring or matrix creation directly', () => {
  assert.equal(canAccess('INSTRUCTOR', 'lecturer_question_bank.html'), false);
  assert.equal(canAccess('INSTRUCTOR', 'lecturer_matrix_create.html'), false);
  assert.equal(canAccess('INSTRUCTOR', 'admin_questions.html'), false);
  assert.equal(canAccess('ADMIN', 'admin_questions.html'), true);
  assert.equal(canAccess('INSTRUCTOR', 'lecturer_materials.html'), true);
});
test('formatted backend validation survives unchanged with status and payload', async () => {
  const payload = { status: 400, message: 'title: Title is required; topicId: Topic ID is required', data: null };
  globalThis.fetch = async () => Response.json(payload, { status: 400 });
  await assert.rejects(apiRequest('/invalid'), (error) => error.message === payload.message && error.status === 400 && error.data.message === payload.message);
});
test('class material creation remains multipart and scoped', async () => {
  const form = new FormData(); form.set('scope', 'CLASS'); form.set('classId', 'c1');
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/v1/classes/c1/topics/t1/materials');
    assert.equal(options.body, form); assert.equal(options.headers['Content-Type'], undefined);
    return Response.json({ data: { materialId: 'm1', approvalStatus: 'PENDING' } });
  };
  assert.equal((await api.materials.createForClass('c1', 't1', form)).approvalStatus, 'PENDING');
});
test('adaptive session creation accepts direct DTO and saving accepts empty 200', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/v1/student/classes/c1/practice-recommendations');
    assert.deepEqual(JSON.parse(options.body), { questionCount: 8, allowExpandedSubjectTopics: false });
    return Response.json({ sessionId: 's1', status: 'IN_PROGRESS' });
  };
  assert.equal((await api.practice.create('c1', { questionCount: 8, allowExpandedSubjectTopics: false })).sessionId, 's1');
  globalThis.fetch = async () => new Response(null, { status: 200 });
  assert.equal(await api.practice.saveAnswer('s1', { questionId: 'q1', answerText: '2' }), null);
});
test('final provisioning and question rejection use the runtime contract', async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => { requests.push([new URL(url).pathname, options.method, JSON.parse(options.body)]); return Response.json({ data: {} }); };
  await api.adminExams.provisionFinal({ matrixId: 'm1', classIds: ['c1'] });
  await api.questions.reject('q1', { rejectionReason: 'Sai đơn vị' });
  assert.deepEqual(requests, [['/api/v1/admin/exams/bulk-provision-final', 'POST', { matrixId: 'm1', classIds: ['c1'] }], ['/api/v1/questions/q1/reject', 'PUT', { rejectionReason: 'Sai đơn vị' }]]);
});
test('missing chunks preserves structured conflict for retry', async () => {
  globalThis.fetch = async () => Response.json({ status: 'INCOMPLETE', message: 'Missing chunks', missingChunks: [2] }, { status: 409 });
  await assert.rejects(api.files.merge('u1'), (error) => error.status === 409 && error.data.missingChunks[0] === 2);
});
