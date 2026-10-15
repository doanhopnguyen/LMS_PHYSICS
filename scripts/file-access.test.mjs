import test from 'node:test';
import assert from 'node:assert/strict';
import { fileUrls, createFileReader } from '../src/lib/fileAccess.js';

const frontend = 'https://lms.example.test';
const backend = 'https://api.example.test';
const urls = fileUrls(backend, frontend);
const pdf = new Blob(['%PDF-1.4\nfile bytes'], { type: 'application/pdf' });

test('relative storage paths and legacy FE localhost links resolve to the configured BE', () => {
  for (const value of [
    '/api/v1/files/a.pdf',
    frontend + '/api/v1/files/a.pdf',
    'http://localhost:5173/api/v1/files/a.pdf',
    'http://127.0.0.1:5199/api/v1/files/a.pdf',
    'a.pdf',
  ])
    assert.equal(urls.resolve(value), backend + '/api/v1/files/a.pdf');
  assert.equal(urls.resolve('chunked/a.pdf'), backend + '/api/v1/files/chunked/a.pdf');
  assert.equal(
    fileUrls('', 'http://localhost:5173').resolve('/api/v1/files/a.pdf'),
    'http://localhost:5173/api/v1/files/a.pdf'
  );
});

test('stored URLs contain a BE path, never the frontend host or transient object URLs', () => {
  assert.equal(urls.persisted(frontend + '/api/v1/files/chunked/a.png'), '/api/v1/files/chunked/a.png');
  assert.equal(urls.persisted('https://images.example.test/a.png'), 'https://images.example.test/a.png');
  assert.equal(urls.persisted(''), '');
  for (const value of ['javascript:alert(1)', 'data:text/html,x', 'blob:https://lms.example.test/id'])
    assert.throws(() => urls.resolve(value));
});

test('external references and page anchors are not mistaken for private BE files', () => {
  assert.equal(urls.isBackend('/api/v1/files/a.pdf'), true);
  assert.equal(urls.isBackend('https://other.example.test/api/v1/files/a.pdf'), false);
  assert.equal(urls.isBackend('https://youtu.be/abcdefghijk'), false);
  assert.equal(urls.isBackend('#section'), false);
  assert.equal(urls.isBackend('course_detail.html'), false);
});

test('fileId requires a fresh signed download URL and preserves the original name', async () => {
  const calls = [];
  const reader = createFileReader({
    ...urls,
    request: async (path, options) => {
      calls.push({ path, options });
      return options.method === 'POST'
        ? { downloadUrl: '/api/v1/files/f1/download?token=signed&expires=123', fileName: 'Tài liệu gốc.pdf' }
        : pdf;
    },
  });
  const result = await reader.read({ fileId: 'f1', fileUrl: 'https://wrong.example.test/ignored.pdf' });
  assert.equal(result.blob, pdf);
  assert.equal(result.fileName, 'Tài liệu gốc.pdf');
  assert.deepEqual(
    calls.map((c) => c.path),
    ['/api/v1/files/f1/download-url', '/api/v1/files/f1/download?token=signed&expires=123']
  );
  assert.equal(calls[1].options.responseType, 'blob');
  await reader.read({ fileId: 'f1' });
  assert.equal(calls.filter((c) => c.options.method === 'POST').length, 2);
});

test('legacy materials without fileId use the authenticated API transport', async () => {
  const reader = createFileReader({
    ...urls,
    request: async (path, options) => {
      assert.equal(path, '/api/v1/files/old.pdf');
      assert.equal(options.responseType, 'blob');
      return pdf;
    },
    fetchFile: () => assert.fail('must not use bare fetch for BE files'),
  });
  assert.equal((await reader.read({ fileUrl: frontend + '/api/v1/files/old.pdf' })).blob, pdf);
});

test('permission refusal never falls back to the stored raw URL', async () => {
  const paths = [];
  const reader = createFileReader({
    ...urls,
    request: async (path) => {
      paths.push(path);
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    },
    fetchFile: () => assert.fail('no permission bypass'),
  });
  await assert.rejects(reader.read({ fileId: 'forbidden', fileUrl: '/api/v1/files/a.pdf' }), { status: 403 });
  assert.deepEqual(paths, ['/api/v1/files/forbidden/download-url']);
});

test('old signed links are renewed by file ID instead of reusing expired tokens', async () => {
  const calls = [];
  const reader = createFileReader({
    ...urls,
    request: async (path, options) => {
      calls.push(path);
      return options.method === 'POST'
        ? { downloadUrl: '/api/v1/files/f1/download?token=new', fileName: 'a.pdf' }
        : pdf;
    },
  });
  await reader.read('http://localhost:5173/api/v1/files/f1/download?token=expired&expires=1');
  assert.deepEqual(calls, ['/api/v1/files/f1/download-url', '/api/v1/files/f1/download?token=new']);
  assert.equal(
    urls.persisted(backend + '/api/v1/files/f1/download?token=expired&expires=1'),
    '/api/v1/files/f1/download'
  );
});

test('external files are fetched without authorization options', async () => {
  const reader = createFileReader({
    ...urls,
    request: () => assert.fail('not our backend'),
    fetchFile: async (url, options) => {
      assert.equal(url, 'https://cdn.example.test/lecture.pdf');
      assert.equal(options.headers, undefined);
      return new Response(pdf);
    },
  });
  assert.equal((await reader.read('https://cdn.example.test/lecture.pdf')).blob.type, 'application/pdf');
});

test('an accidental SPA HTML response cannot masquerade as a PDF download', async () => {
  const reader = createFileReader({
    ...urls,
    request: async () => new Blob(['<!doctype html><div id=root>'], { type: 'text/html' }),
  });
  await assert.rejects(reader.read('/api/v1/files/lecture.pdf'), /trang web thay vì tệp/);
  assert.equal((await reader.read('/api/v1/files/page.html')).blob.type, 'text/html');
});

test('empty responses are rejected before a download link or preview can be created', async () => {
  for (const reference of ['/api/v1/files/empty.pdf', 'https://cdn.example.test/empty.pdf']) {
    const reader = createFileReader({
      ...urls,
      request: async () => new Blob([]),
      fetchFile: async () => new Response(new Blob([])),
    });
    await assert.rejects(reader.download(reference), /0 byte/);
  }
});

test('signed downloads validate actual bytes against BE metadata', async () => {
  for (const bytes of [pdf.size - 1, pdf.size + 1, pdf.size]) {
    const reader = createFileReader({
      ...urls,
      request: async (path, options) => options.method === 'POST'
        ? { downloadUrl: '/api/v1/files/f1/download?token=x', fileName: 'a.pdf', fileSizeBytes: bytes }
        : pdf,
    });
    if (bytes === pdf.size) assert.equal((await reader.read({ fileId: 'f1' })).blob, pdf);
    else await assert.rejects(reader.read({ fileId: 'f1' }));
  }
});

test('legacy downloads retain size metadata when checking partial responses', async () => {
  const reader = createFileReader({ ...urls, request: async () => pdf });
  await assert.rejects(reader.read({ fileUrl: '/api/v1/files/a.pdf', fileSizeBytes: pdf.size + 1 }));
  assert.equal((await reader.read({ fileUrl: '/api/v1/files/a.pdf', fileSizeBytes: pdf.size })).blob, pdf);
});

test('abort signals propagate through both signed URL acquisition and file retrieval', async () => {
  const controller = new AbortController();
  const reader = createFileReader({
    ...urls,
    request: async (path, options) => {
      assert.equal(options.signal, controller.signal);
      return options.method === 'POST' ? { downloadUrl: '/api/v1/files/f1/download?token=x', fileName: 'a.pdf' } : pdf;
    },
  });
  await reader.read({ fileId: 'f1' }, { signal: controller.signal });
});

test('the API client supplies JWT headers to BE file reads and refreshes expired credentials', async () => {
  const { api } = await import('../src/lib/apiClient.js');
  const oldWindow = globalThis.window;
  const oldFetch = globalThis.fetch;
  let token = 'old-token';
  const calls = [];
  globalThis.window = {
    location: { origin: 'http://localhost:5173' },
    localStorage: {
      getItem: (key) => (key.includes('refresh') ? 'refresh-token' : token),
      setItem: (key, value) => {
        if (key.includes('access')) token = value;
      },
      removeItem: () => {},
    },
  };
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/users/refresh')) return Response.json({ data: { accessToken: 'new-token' } });
    if (options.headers.Authorization === 'Bearer old-token')
      return Response.json({ message: 'expired' }, { status: 401 });
    assert.equal(options.headers.Authorization, 'Bearer new-token');
    if (url.endsWith('/download-url'))
      return Response.json({ data: { downloadUrl: '/api/v1/files/f1/download?token=x', fileName: 'a.pdf' } });
    return new Response(pdf);
  };
  try {
    assert.equal((await api.files.read({ fileId: 'f1' })).blob.type, 'application/pdf');
    assert.equal(calls.filter((c) => c.url.endsWith('/users/refresh')).length, 1);
    assert.equal(calls.at(-1).url, 'http://localhost:5173/api/v1/files/f1/download?token=x');
  } finally {
    globalThis.window = oldWindow;
    globalThis.fetch = oldFetch;
  }
});
