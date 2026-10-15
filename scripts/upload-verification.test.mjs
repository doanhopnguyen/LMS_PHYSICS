import test from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest } from '../src/lib/apiClient.js';
import { verifyStoredUpload } from '../src/lib/fileAccess.js';
import { uploadFileInChunks } from '../src/lib/chunkUpload.js';

const source = new File(['%PDF original content'], 'lesson.pdf', { type: 'application/pdf' });

test('all multipart storage endpoints verify returned file bytes before success', async () => {
  const oldWindow = globalThis.window, oldFetch = globalThis.fetch;
  globalThis.window = { location: { origin: 'http://localhost' }, localStorage: { getItem: () => 'test-token' } };
  try {
    for (const path of [
      '/api/v1/topics/t1/materials',
      '/api/v1/topics/t1/materials/m1',
      '/api/v1/classes/c1/topics/t1/materials',
      '/api/v1/experiments/assignments/a1/submit',
      '/api/v1/files/upload',
    ]) {
      for (const stored of [new Blob([]), new Blob(['partial']), source]) {
        let writes = 0, reads = 0;
        globalThis.fetch = async (url, options) => {
          if (new URL(url).pathname === path) {
            writes++;
            return Response.json({ data: { fileUrl: '/api/v1/files/stored.pdf' } });
          }
          assert.equal(options.headers.Authorization, 'Bearer test-token');
          reads++;
          return new Response(stored);
        };
        const formData = new FormData();
        formData.set('file', source);
        const operation = apiRequest(path, { method: 'POST', formData });
        if (stored === source) assert.equal((await operation).fileUrl, '/api/v1/files/stored.pdf');
        else await assert.rejects(operation, { code: 'UPLOAD_VERIFICATION_FAILED' });
        assert.equal(writes, 1, 'never resubmit a business operation after failed verification');
        assert.equal(reads, 1);
      }
    }
  } finally {
    globalThis.window = oldWindow;
    globalThis.fetch = oldFetch;
  }
});

test('chunk upload never reports 100 percent before stored file verification', async () => {
  const progress = [];
  let verified = false;
  const request = async (path, options) => {
    if (path.endsWith('/merge')) return {
      uploadId: JSON.parse(JSON.stringify(options.body)).uploadId,
      status: 'COMPLETED', fileId: 'f1', fileUrl: '/api/v1/files/file.pdf',
      totalChunks: 1, fileSize: source.size,
    };
    const form = options.formData;
    return { uploaded: true, uploadId: form.get('uploadId'), chunkIndex: 0, totalChunks: 1 };
  };
  await assert.rejects(uploadFileInChunks(source, request, {
    onProgress: (value) => progress.push(value),
    verify: async () => {
      verified = true;
      assert.ok(progress.every((value) => value.percent < 100));
      await verifyStoredUpload(source, { fileUrl: '/api/v1/files/file.pdf' }, async () => ({ blob: new Blob([]) }));
    },
  }), { code: 'UPLOAD_VERIFICATION_FAILED' });
  assert.equal(verified, true);
  assert.ok(progress.every((value) => value.percent < 100));
});

test('verification does not invent a file URL when BE omits it', async () => {
  await assert.rejects(verifyStoredUpload(source, {}, () => assert.fail('no file to read')), {
    code: 'UPLOAD_VERIFICATION_FAILED',
  });
});
