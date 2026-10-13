import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle = await build({
  entryPoints: ['src/lib/materialDownloads.js'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  define: { 'import.meta.env.VITE_API_BASE_URL': '"https://backend.example"' },
});
const { fetchMaterialBlob, resolveMaterialDownload } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);
globalThis.location = { origin: 'https://lms.example' };
globalThis.window = { location, localStorage: { getItem: () => 'secret-test-token' } };
test('file IDs request a fresh signed URL and resolve backend-relative links', async () => {
  const calls = [];
  globalThis.fetch = async (url, opts) => {
    calls.push([url, opts]);
    return Response.json({ data: { downloadUrl: '/api/v1/files/f1/download?token=signed' } });
  };
  assert.equal(
    await resolveMaterialDownload({ fileId: 'f1' }),
    'https://backend.example/api/v1/files/f1/download?token=signed'
  );
  assert.equal(calls[0][1].method, 'POST');
  assert.equal(calls[0][1].headers.Authorization, 'Bearer secret-test-token');
});
test('legacy protected file fetch attaches JWT only to backend file routes', async () => {
  globalThis.fetch = async (url, opts) => {
    assert.equal(opts.headers.Authorization, 'Bearer secret-test-token');
    return new Response('file bytes');
  };
  assert.equal(await (await fetchMaterialBlob({ fileUrl: '/api/v1/files/legacy.pdf' })).blob.text(), 'file bytes');
});
test('third-party file fetch never forwards bearer credentials', async () => {
  globalThis.fetch = async (url, opts) => {
    assert.equal(String(url), 'https://third.example/lesson.pdf');
    assert.equal(opts.headers, undefined);
    return new Response('external file');
  };
  assert.equal(
    await (await fetchMaterialBlob({ fileUrl: 'https://third.example/lesson.pdf' })).blob.text(),
    'external file'
  );
});
test('download failures use backend formatted messages', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Bạn không có quyền tải học liệu này' }, { status: 403 });
  await assert.rejects(
    fetchMaterialBlob({ fileUrl: 'https://third.example/file' }),
    /Bạn không có quyền tải học liệu này/
  );
});
