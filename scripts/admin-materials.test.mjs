import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { canAccess } from '../src/lib/demoSession.js';
import { getPageFile } from '../src/lib/routes.js';

const bundle = await build({
  entryPoints: ['src/lib/adminMaterials.js', 'src/lib/apiClient.js'],
  bundle: true,
  outdir: 'unused',
  write: false,
  format: 'esm',
  platform: 'node',
  define: { 'import.meta.env.VITE_API_BASE_URL': '"https://api.example"' },
});
const modules = await Promise.all(
  bundle.outputFiles.map((file) => import(`data:text/javascript;base64,${Buffer.from(file.text).toString('base64')}`))
);
const { loadAdminMaterials } = modules.find((module) => module.loadAdminMaterials);
const { api } = modules.find((module) => module.api);

test('admin queue includes all subject and material pages with the correct topic scope', async () => {
  const calls = [];
  const result = await loadAdminMaterials(async (path) => {
    calls.push(path);
    const url = new URL(path, 'https://api.example');
    const page = Number(url.searchParams.get('page'));
    if (url.pathname === '/api/v1/subjects')
      return { content: [{ subjectId: `s${page}`, subjectName: `Subject ${page}` }], totalPages: 2 };
    if (url.pathname.endsWith('/topics'))
      return [{ topicId: url.pathname.includes('/s0/') ? 't0' : 't1', topicName: 'Topic' }];
    return { content: [{ materialId: `${url.pathname}-${page}`, approvalStatus: 'PENDING' }], totalPages: 2 };
  });
  assert.equal(result.subjects.length, 2);
  assert.equal(result.materials.length, 4);
  assert.equal(result.materials[0].topicId, 't0');
  assert.equal(result.materials[2].subjectId, 's1');
  assert.equal(calls.filter((path) => path.includes('/materials')).length, 4);
});

test('queue surfaces topic loading failures instead of displaying an incomplete queue', async () => {
  await assert.rejects(
    loadAdminMaterials(async (path) => {
      if (path.startsWith('/api/v1/subjects?')) return [{ subjectId: 's0' }];
      throw new Error('Không có quyền truy cập');
    }),
    /Không có quyền truy cập/
  );
});

test('admin materials route is registered and excludes other roles', () => {
  assert.equal(getPageFile('/admin_materials'), 'admin_materials.html');
  assert.equal(canAccess('ADMIN', 'admin_materials.html'), true);
  for (const role of ['STUDENT', 'INSTRUCTOR', 'TA']) assert.equal(canAccess(role, 'admin_materials.html'), false);
});

test('approval sends authenticated PUT and accepts empty success; failures remain errors', async () => {
  globalThis.window = { location: { origin: 'https://lms.example' }, localStorage: { getItem: () => 'admin-token' } };
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/v1/topics/t0/materials/m0/approve');
    assert.equal(options.method, 'PUT');
    assert.equal(options.headers.Authorization, 'Bearer admin-token');
    return new Response(null, { status: 204 });
  };
  assert.equal(await api.materials.approve('t0', 'm0'), null);
  globalThis.fetch = async () => Response.json({ message: 'Không được phép duyệt' }, { status: 403 });
  await assert.rejects(api.materials.approve('t0', 'm0'), /Không được phép duyệt/);
});

test('question approval transmits an encoded optional comment through the documented query', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/v1/questions/q1/approve');
    assert.equal(new URL(url).searchParams.get('comment'), 'Đúng & đủ');
    assert.equal(options.method, 'PUT');
    assert.equal(options.body, undefined);
    return Response.json({ data: { questionId: 'q1', approvalStatus: 'APPROVED' } });
  };
  assert.equal((await api.questions.approve('q1', ' Đúng & đủ ')).approvalStatus, 'APPROVED');
});

test('question rejection sends its mandatory reason in a JSON body and preserves API failures', async () => {
  const body = { rejectionReason: 'Sai đáp án', comment: 'Cần sửa' };
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/v1/questions/q1/reject');
    assert.equal(options.method, 'PUT');
    assert.deepEqual(JSON.parse(options.body), body);
    return Response.json({ data: { approvalStatus: 'REJECTED', rejectionReason: body.rejectionReason } });
  };
  assert.equal((await api.questions.reject('q1', body)).approvalStatus, 'REJECTED');
  globalThis.fetch = async () => Response.json({ message: 'Câu hỏi đã được duyệt' }, { status: 400 });
  await assert.rejects(api.questions.reject('q1', body), (error) => error.status === 400);
});

test('Admin submission sends PUT with an optional query comment and no body', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/v1/questions/q1/submit-review');
    assert.equal(new URL(url).searchParams.get('comment'), 'Đã sửa & bổ sung');
    assert.equal(options.method, 'PUT');
    assert.equal(options.body, undefined);
    return Response.json({ data: { questionId: 'q1', approvalStatus: 'PENDING' } });
  };
  assert.equal((await api.questions.submitReview('q1', ' Đã sửa & bổ sung ')).approvalStatus, 'PENDING');
});
