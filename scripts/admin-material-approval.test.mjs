import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  entryPoints: ['src/lib/adminMaterialApproval.js'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  define: { 'import.meta.env.VITE_API_BASE_URL': '"https://api.example"' },
});
const { approveAdminMaterial } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

test('Admin saves a pending material directly as approved without submitting another review', async () => {
  const calls = [];
  const result = await approveAdminMaterial(
    'topic',
    { materialId: 'material', approvalStatus: 'PENDING' },
    {
      approve: async (...args) => {
        calls.push(args);
        return { materialId: 'material', approvalStatus: 'APPROVED' };
      },
    }
  );
  assert.equal(result.approvalStatus, 'APPROVED');
  assert.deepEqual(calls, [['topic', 'material']]);
});
test('already approved saves do not send duplicate approval requests', async () => {
  const material = { materialId: 'material', approvalStatus: 'APPROVED' };
  assert.equal(await approveAdminMaterial('topic', material, {}), material);
});
test('an empty approval response is confirmed by reading the saved material', async () => {
  const result = await approveAdminMaterial(
    'topic',
    { materialId: 'material' },
    {
      approve: async () => null,
      get: async (topic, id) => ({ topicId: topic, materialId: id, approvalStatus: 'APPROVED' }),
    }
  );
  assert.equal(result.approvalStatus, 'APPROVED');
});
test('failed approval can retry the persisted ID without creating another material', async () => {
  let attempts = 0;
  const material = { materialId: 'saved-material', approvalStatus: 'PENDING' };
  const client = {
    approve: async (topic, id) => {
      assert.equal(id, 'saved-material');
      if (++attempts === 1) throw new Error('Temporary API error');
      return { materialId: id, approvalStatus: 'APPROVED' };
    },
  };
  await assert.rejects(approveAdminMaterial('topic', material, client), /Temporary API error/);
  assert.equal((await approveAdminMaterial('topic', material, client)).approvalStatus, 'APPROVED');
  assert.equal(attempts, 2);
});
test('missing IDs and unconfirmed or mismatched approval responses are rejected', async () => {
  await assert.rejects(approveAdminMaterial('topic', {}, {}));
  await assert.rejects(
    approveAdminMaterial(
      'topic',
      { materialId: 'm' },
      { approve: async () => ({ materialId: 'm', approvalStatus: 'PENDING' }) }
    )
  );
  await assert.rejects(
    approveAdminMaterial(
      'topic',
      { materialId: 'm' },
      { approve: async () => ({ materialId: 'wrong', approvalStatus: 'APPROVED' }) }
    )
  );
});
