import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { canAccess } from '../src/lib/demoSession.js';

const bundle = await build({ entryPoints: ['src/lib/notificationDetails.js'], bundle: true, write: false,
  format: 'esm', platform: 'node', define: { 'import.meta.env.VITE_API_BASE_URL': '"https://api.example"' } });
const { findOwnNotification } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
globalThis.window = { location: { origin: 'https://lms.example' }, localStorage: { getItem: () => null }, dispatchEvent() {} };

test('notification details find older entries using only the documented paged list', async () => {
  const calls = [];
  globalThis.fetch = async (url) => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, '/api/v1/notifications');
    calls.push(parsed.searchParams.get('page'));
    return Response.json({ data: { content: [{ notificationId: calls.length === 1 ? 'recent' : 'older', content: 'Nội dung đầy đủ' }], totalPages: 2, last: calls.length === 2 } });
  };
  assert.equal((await findOwnNotification('older')).content, 'Nội dung đầy đủ');
  assert.deepEqual(calls, ['0', '1']);
});

test('missing notifications stop at the last page and failed requests are surfaced', async () => {
  globalThis.fetch = async () => Response.json({ data: { content: [], last: true } });
  assert.equal(await findOwnNotification('missing'), null);
  globalThis.fetch = async () => Response.json({ message: 'Không thể tải thông báo' }, { status: 500 });
  await assert.rejects(findOwnNotification('missing'), /Không thể tải thông báo/);
});

test('cancelled detail lookups do not fetch further pages', async () => {
  let alive = true;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; alive = false; return Response.json({ data: { content: [{ notificationId: 'one' }], last: false } }); };
  assert.equal(await findOwnNotification('older', () => alive), null);
  assert.equal(calls, 1);
});

test('all authenticated roles can open notification details, anonymous users cannot', () => {
  for (const role of ['STUDENT', 'INSTRUCTOR', 'TA', 'ADMIN']) assert.equal(canAccess(role, 'notification_detail.html'), true);
  assert.equal(canAccess(null, 'notification_detail.html'), false);
});
