import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { validateCloIds } from '../src/lib/cloSelection.js';

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
globalThis.window = { location: { origin: 'https://lms.example' }, localStorage: { getItem: () => null } };

test('CLO toggle uses PATCH and explicitly transmits false in the query', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/v1/clos/c1/toggle-status');
    assert.equal(new URL(url).searchParams.get('isActive'), 'false');
    assert.equal(options.method, 'PATCH');
    assert.equal(options.body, undefined);
    return Response.json({ data: { cloId: 'c1', isActive: false } });
  };
  assert.equal((await api.clos.toggleStatus('c1', false)).isActive, false);
});
test('CLO assignments send a raw UUID array and an empty array removes links', async () => {
  const sent = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/v1/questions/q1/clos');
    assert.equal(options.method, 'PUT');
    sent.push(JSON.parse(options.body));
    return Response.json({ data: { questionId: 'q1' } });
  };
  await api.questions.assignClos('q1', ['c1', 'c2']);
  await api.questions.assignClos('q1', []);
  assert.deepEqual(sent, [['c1', 'c2'], []]);
});
test('CLO lookup includes inactive rows so editing never silently drops existing links', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url).pathname, '/api/v1/subjects/s1/clos');
    assert.equal(new URL(url).searchParams.get('activeOnly'), 'false');
    return Response.json({ data: [{ cloId: 'c1', isActive: false }] });
  };
  assert.equal((await api.clos.list('s1'))[0].isActive, false);
});
test('CLO validation rejects foreign, missing and inactive IDs; empty selection is allowed', () => {
  const rows = [
    { cloId: 'c1', subjectId: 's1', cloCode: 'CLO1', isActive: true },
    { cloId: 'c2', subjectId: 's2', isActive: true },
    { cloId: 'c3', subjectId: 's1', cloCode: 'CLO3', isActive: false },
  ];
  assert.equal(validateCloIds([], rows, 's1'), '');
  assert.equal(validateCloIds(['c1'], rows, 's1'), '');
  assert.match(validateCloIds(['c2'], rows, 's1'), /không thuộc/);
  assert.match(validateCloIds(['missing'], rows, 's1'), /không thuộc/);
  assert.match(validateCloIds(['c3'], rows, 's1'), /ngừng hoạt động/);
});
test('Backend rejection of a linked CLO deletion remains an error', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Không thể xóa CLO đang được liên kết' }, { status: 409 });
  await assert.rejects(api.clos.remove('c1'), (error) => error.status === 409 && error.message.includes('liên kết'));
});
