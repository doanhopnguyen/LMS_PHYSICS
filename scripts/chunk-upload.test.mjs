import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle = await build({
  entryPoints: ['src/lib/chunkUpload.js'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  define: { 'import.meta.env.VITE_API_BASE_URL': '""' },
});
const { CHUNK_SIZE, fileFingerprint, uploadInChunks } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);
const missing = () =>
  Object.assign(Error('Missing chunks'), { status: 409, data: { status: 'INCOMPLETE', missingChunks: [1] } });
const notFound = () => Object.assign(Error('Unknown upload'), { status: 404 });
test('chunk boundaries and missing-chunk retry preserve bytes and upload ID', async () => {
  const file = new File([new Uint8Array(CHUNK_SIZE * 2 + 7).fill(42)], 'lesson.pdf');
  const sent = [];
  const progress = [];
  let merges = 0;
  const result = await uploadInChunks(file, {
    ownerId: 'u1',
    uploadId: 'id1',
    onProgress: (event) => progress.push(event),
    service: {
      chunkStatus: async () => {
        throw notFound();
      },
      chunk: async (form) => {
        sent.push([Number(form.get('chunkIndex')), form.get('chunk').size, form.get('uploadId')]);
        assert.equal(new Uint8Array(await form.get('chunk').arrayBuffer())[0], 42);
      },
      merge: async () => {
        if (++merges === 1) throw missing();
        return { status: 'COMPLETED', fileId: 'f1' };
      },
    },
  });
  assert.equal(result.fileId, 'f1');
  assert.deepEqual(sent, [
    [0, 102400, 'id1'],
    [1, 102400, 'id1'],
    [2, 7, 'id1'],
    [1, 102400, 'id1'],
  ]);
  assert.equal(progress.at(-1).phase, 'completed');
  assert.ok(progress.some((row) => row.percent === 100 && row.phase === 'merging'));
});
test('resume sends only chunks the server has not acknowledged', async () => {
  const file = new File([new Uint8Array(CHUNK_SIZE + 4)], 'file.bin');
  const sent = [];
  await uploadInChunks(file, {
    ownerId: 'u1',
    uploadId: 'id1',
    service: {
      chunkStatus: async () => ({ uploadedChunks: [0], status: 'UPLOADING' }),
      chunk: async (form) => sent.push(Number(form.get('chunkIndex'))),
      merge: async () => ({ status: 'COMPLETED', fileId: 'f1' }),
    },
  });
  assert.deepEqual(sent, [1]);
});
test('content conflicts stop without retry or reporting completion', async () => {
  let calls = 0;
  const phases = [];
  await assert.rejects(
    uploadInChunks(new File(['bytes'], 'file.txt'), {
      ownerId: 'u1',
      onProgress: (row) => phases.push(row.phase),
      service: {
        chunkStatus: async () => {
          throw notFound();
        },
        chunk: async () => {
          calls++;
          throw Object.assign(Error('Chunk content conflict'), { status: 409 });
        },
        merge: async () => {
          throw Error('must not merge');
        },
      },
    }),
    /Chunk content conflict/
  );
  assert.equal(calls, 1);
  assert.ok(!phases.includes('completed'));
});
test('fingerprint detects changed middle bytes even with identical names and sizes', async () => {
  const original = new Uint8Array(CHUNK_SIZE * 3);
  const changed = original.slice();
  changed[CHUNK_SIZE + 4] = 1;
  assert.notEqual(
    await fileFingerprint(new File([original], 'same.bin')),
    await fileFingerprint(new File([changed], 'same.bin'))
  );
});
test('completed resume retrieves merge result without resending chunks', async () => {
  let chunks = 0;
  const result = await uploadInChunks(new File(['same file'], 'file.bin'), {
    ownerId: 'u1',
    uploadId: 'id1',
    service: {
      chunkStatus: async () => ({ status: 'COMPLETED', uploadedChunks: [0] }),
      chunk: async () => {
        chunks++;
      },
      merge: async () => ({ status: 'COMPLETED', fileId: 'f1' }),
    },
  });
  assert.equal(result.fileId, 'f1');
  assert.equal(chunks, 0);
});
