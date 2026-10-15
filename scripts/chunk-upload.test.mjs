import test from 'node:test';
import assert from 'node:assert/strict';
import {
  uploadFileInChunks,
  validateChunkFile,
  MAX_UPLOAD_SIZE,
  UPLOAD_CHUNK_SIZE,
  UPLOAD_CONCURRENCY,
} from '../src/lib/chunkUpload.js';

const makeFile = (size) =>
  new File([Uint8Array.from({ length: size }, (_, i) => i % 251)], 'kiểm-tra.pdf', { type: 'application/pdf' });
function server(file, hook) {
  const parts = new Map();
  const calls = [];
  let active = 0;
  let peak = 0;
  let uploadId;
  let mergeCount = 0;
  const request = async (path, options) => {
    calls.push({ path, options });
    if (path.endsWith('/status')) {
      const intercepted = await hook?.({ status: true, parts, uploadId });
      if (intercepted) return intercepted;
      return {
        uploadId,
        status: 'UPLOADING',
        totalChunks: Math.ceil(file.size / UPLOAD_CHUNK_SIZE),
        uploadedChunks: [...parts.keys()],
        missingChunks: Array.from({ length: Math.ceil(file.size / UPLOAD_CHUNK_SIZE) }, (_, i) => i).filter(
          (i) => !parts.has(i)
        ),
      };
    }
    if (path.endsWith('/merge')) {
      mergeCount++;
      assert.equal(active, 0, 'merge waits for all chunk responses');
      const intercepted = await hook?.({ merge: true, parts, count: mergeCount, uploadId });
      if (intercepted) return intercepted;
      assert.deepEqual(
        Buffer.concat([...parts.entries()].sort(([a], [b]) => a - b).map(([, bytes]) => bytes)),
        Buffer.from(await file.arrayBuffer())
      );
      return {
        uploadId,
        fileId: 'saved-file',
        fileUrl: 'chunked/saved.pdf',
        status: 'COMPLETED',
        fileSize: file.size,
        totalChunks: parts.size,
      };
    }
    const data = options.formData;
    const index = Number(data.get('chunkIndex'));
    uploadId ??= data.get('uploadId');
    assert.equal(data.get('uploadId'), uploadId);
    assert.equal(data.get('fileName'), file.name);
    assert.equal(Number(data.get('totalChunks')), Math.ceil(file.size / UPLOAD_CHUNK_SIZE));
    active++;
    peak = Math.max(peak, active);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2));
      const intercepted = await hook?.({ index, parts, uploadId });
      if (intercepted) return intercepted;
      const bytes = Buffer.from(await data.get('chunk').arrayBuffer());
      assert.ok(bytes.length <= UPLOAD_CHUNK_SIZE);
      parts.set(index, bytes);
      return { uploaded: true, uploadId, chunkIndex: index, totalChunks: Math.ceil(file.size / UPLOAD_CHUNK_SIZE) };
    } finally {
      active--;
    }
  };
  return {
    request,
    calls,
    parts,
    get peak() {
      return peak;
    },
    get mergeCount() {
      return mergeCount;
    },
  };
}

test('100 KB slices preserve exact bytes and zero-based indices with at most ten requests', async () => {
  const file = makeFile(UPLOAD_CHUNK_SIZE * 23 + 17);
  const backend = server(file);
  const progress = [];
  const result = await uploadFileInChunks(file, backend.request, { onProgress: (value) => progress.push(value) });
  assert.equal(result.fileId, 'saved-file');
  assert.equal(backend.peak, UPLOAD_CONCURRENCY);
  assert.equal(backend.mergeCount, 1);
  assert.equal(backend.calls[0].options.formData.get('chunkIndex'), '0');
  assert.equal(backend.parts.get(23).length, 17);
  assert.ok(progress.slice(0, -1).every((value) => value.percent < 100));
  assert.equal(progress.at(-1).phase, 'completed');
  assert.equal(progress.at(-1).percent, 100);
});

test('files smaller than or exactly one chunk produce one chunk and one merge', async () => {
  for (const size of [1, UPLOAD_CHUNK_SIZE]) {
    const file = makeFile(size);
    const backend = server(file);
    await uploadFileInChunks(file, backend.request);
    assert.equal(backend.parts.size, 1);
    assert.equal(backend.mergeCount, 1);
  }
});

test('empty or invalid files fail before any network request', async () => {
  for (const file of [null, new Blob(['x']), makeFile(0)])
    await assert.rejects(uploadFileInChunks(file, () => assert.fail('no network')));
});

test('the default 50 MB limit uses totalChunks times 102400 exactly like BE', async () => {
  const file = makeFile(1);
  Object.defineProperty(file, 'size', { value: MAX_UPLOAD_SIZE, configurable: true });
  assert.equal(validateChunkFile(file), 512);
  Object.defineProperty(file, 'size', { value: MAX_UPLOAD_SIZE + 1 });
  await assert.rejects(
    uploadFileInChunks(file, () => assert.fail('no request for oversized file')),
    /50 MB/
  );
});

test('retry after failure queries status and resends only missing chunks with the original uploadId', async () => {
  const file = makeFile(UPLOAD_CHUNK_SIZE * 4);
  let deny = true;
  const backend = server(file, ({ index }) => {
    if (index === 1 && deny) throw Object.assign(new Error('temporary failure'), { status: 503 });
  });
  await assert.rejects(uploadFileInChunks(file, backend.request));
  assert.equal(backend.mergeCount, 0);
  const originalId = backend.calls[0].options.formData.get('uploadId');
  const alreadySaved = [...backend.parts.keys()];
  const previousCount = backend.calls.length;
  deny = false;
  const result = await uploadFileInChunks(file, backend.request);
  const resumed = backend.calls.slice(previousCount);
  assert.equal(resumed[0].path, `/api/v1/files/chunks/${originalId}/status`);
  assert.equal(result.uploadId, originalId);
  assert.deepEqual(
    resumed.filter((c) => c.options.formData).map((c) => Number(c.options.formData.get('chunkIndex'))),
    [1]
  );
  assert.ok(alreadySaved.includes(0));
});

test('a lost first response resumes the same UUID even if BE has not created the session', async () => {
  const file = makeFile(1);
  const calls = [];
  const backend = server(file);
  let offline = true;
  const request = async (path, options) => {
    calls.push({ path, options });
    if (offline) throw new TypeError('offline');
    if (path.endsWith('/status')) throw Object.assign(new Error('not created'), { status: 404 });
    return backend.request(path, options);
  };
  await assert.rejects(uploadFileInChunks(file, request));
  const originalId = calls[0].options.formData.get('uploadId');
  offline = false;
  const result = await uploadFileInChunks(file, request);
  assert.equal(result.uploadId, originalId);
  assert.ok(calls.some((c) => c.path === `/api/v1/files/chunks/${originalId}/status`));
});

test('parallel calls for the same file share a single upload and merge', async () => {
  const file = makeFile(UPLOAD_CHUNK_SIZE + 1);
  const backend = server(file);
  const [a, b] = await Promise.all([
    uploadFileInChunks(file, backend.request),
    uploadFileInChunks(file, backend.request),
  ]);
  assert.equal(a.uploadId, b.uploadId);
  assert.equal(backend.mergeCount, 1);
});

test('a transient chunk error retries the same upload and index', async () => {
  const file = makeFile(UPLOAD_CHUNK_SIZE + 1);
  let failed = false;
  const backend = server(file, ({ index }) => {
    if (index === 1 && !failed) {
      failed = true;
      throw Object.assign(new Error('temporary'), { status: 503 });
    }
  });
  await uploadFileInChunks(file, backend.request);
  assert.equal(backend.calls.filter((c) => c.options.formData?.get('chunkIndex') === '1').length, 2);
  assert.equal(backend.mergeCount, 1);
});

test('an unacknowledged or permanently rejected chunk never triggers merge', async () => {
  for (const ack of [false, true]) {
    const file = makeFile(UPLOAD_CHUNK_SIZE * 13);
    const backend = server(file, ({ index }) => {
      if (index === 1) {
        if (ack) return { uploaded: true, uploadId: 'wrong', chunkIndex: 1 };
        throw Object.assign(new Error('denied'), { status: 403 });
      }
    });
    await assert.rejects(uploadFileInChunks(file, backend.request));
    assert.equal(backend.mergeCount, 0);
    assert.ok(backend.calls.length < 14, 'queued work stops on failure');
  }
});

test('merge missing-chunk response resends only reported indices before merging again', async () => {
  const file = makeFile(UPLOAD_CHUNK_SIZE * 3);
  const backend = server(file, ({ merge, count }) => {
    if (merge && count === 1)
      throw Object.assign(new Error('missing'), { status: 409, data: { missingChunks: [1, 1] } });
  });
  await uploadFileInChunks(file, backend.request);
  const counts = [0, 1, 2].map(
    (index) => backend.calls.filter((c) => c.options.formData?.get('chunkIndex') === String(index)).length
  );
  assert.deepEqual(counts, [1, 2, 1]);
  assert.equal(backend.mergeCount, 2);
});

test('invalid missing indices do not cause arbitrary chunk requests', async () => {
  const file = makeFile(1);
  const backend = server(file, ({ merge }) => {
    if (merge) throw Object.assign(new Error('bad index'), { status: 409, data: { missingChunks: [-1, 100] } });
  });
  await assert.rejects(uploadFileInChunks(file, backend.request));
  assert.equal(backend.calls.length, 2);
});

test('merge size mismatch is not reported as a completed upload', async () => {
  const file = makeFile(3);
  const backend = server(
    file,
    ({ merge, uploadId }) =>
      merge && { uploadId, status: 'COMPLETED', fileId: 'f', fileUrl: 'x', fileSize: 2, totalChunks: 1 }
  );
  const progress = [];
  await assert.rejects(uploadFileInChunks(file, backend.request, { onProgress: (value) => progress.push(value) }));
  assert.ok(progress.every((value) => value.phase !== 'completed'));
});

test('cancelled upload does not start requests or merge', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    uploadFileInChunks(makeFile(1), () => assert.fail('no network'), { signal: controller.signal }),
    { name: 'AbortError' }
  );
});

test('independent uploads use distinct session identifiers', async () => {
  const file = makeFile(2);
  const backend = server(file);
  const other = server(file);
  const [a, b] = await Promise.all([
    uploadFileInChunks(file, backend.request),
    uploadFileInChunks(file, other.request),
  ]);
  assert.notEqual(a.uploadId, b.uploadId);
});

test('the public API file upload uses chunk/merge endpoints with authentication and keeps URL aliases', async () => {
  const { api } = await import('../src/lib/apiClient.js');
  const previousWindow = globalThis.window;
  const previousFetch = globalThis.fetch;
  globalThis.window = { location: { origin: 'http://localhost' }, localStorage: { getItem: () => 'access-token' } };
  const file = makeFile(UPLOAD_CHUNK_SIZE + 5);
  const backend = server(file);
  const paths = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer access-token');
    const path = new URL(url).pathname;
    paths.push(path);
    if (path.endsWith('/download-url'))
      return Response.json({ data: { downloadUrl: '/api/v1/files/verified/download?token=test', fileName: file.name } });
    if (path === '/api/v1/files/verified/download') return new Response(file);
    return Response.json(
      await backend.request(path, {
        ...options,
        ...(options.body instanceof FormData ? { formData: options.body } : { body: JSON.parse(options.body) }),
      })
    );
  };
  try {
    const form = new FormData();
    form.set('file', file);
    const result = await api.files.upload(form);
    assert.equal(result.url, result.fileUrl);
    assert.equal(result.size, file.size);
    assert.equal(result.contentType, file.type);
    assert.deepEqual(paths.slice(0, 3), ['/api/v1/files/chunks', '/api/v1/files/chunks', '/api/v1/files/chunks/merge']);
    assert.equal(paths.at(-2).endsWith('/download-url'), true);
    assert.equal(paths.at(-1), '/api/v1/files/verified/download');
  } finally {
    globalThis.window = previousWindow;
    globalThis.fetch = previousFetch;
  }
});
