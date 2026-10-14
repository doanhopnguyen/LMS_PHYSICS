import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  entryPoints: ['src/lib/adminQuestionApproval.js'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  define: { 'import.meta.env.VITE_API_BASE_URL': '"https://api.example"' },
});
const { approveAdminQuestion, approveAdminImport } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

test('Admin automatically submits draft imports then approves them', async () => {
  const calls = [];
  const client = {
    get: async (id) => {
      calls.push('get');
      return { questionId: id, approvalStatus: 'DRAFT' };
    },
    submitReview: async (id) => {
      calls.push('submit');
      return { questionId: id, approvalStatus: 'PENDING' };
    },
    approve: async (id) => {
      calls.push('approve');
      return { questionId: id, approvalStatus: 'APPROVED' };
    },
  };
  assert.equal((await approveAdminQuestion({ questionId: 'q1' }, client)).approvalStatus, 'APPROVED');
  assert.deepEqual(calls, ['get', 'submit', 'approve']);
});
test('Pending creations go straight to approval without a second submission', async () => {
  const client = {
    get: async () => ({ approvalStatus: 'PENDING' }),
    submitReview: () => assert.fail('must not submit'),
    approve: async () => ({ approvalStatus: 'APPROVED' }),
  };
  assert.equal((await approveAdminQuestion({ questionId: 'q1' }, client)).approvalStatus, 'APPROVED');
});
test('Retry after an uncertain response observes approved status and never approves twice', async () => {
  const client = {
    get: async () => ({ approvalStatus: 'APPROVED' }),
    approve: () => assert.fail('must not approve twice'),
  };
  assert.equal((await approveAdminQuestion({ questionId: 'q1' }, client)).approvalStatus, 'APPROVED');
});
test('Failed submission or approval remains a failure, never false success', async () => {
  await assert.rejects(
    approveAdminQuestion(
      { questionId: 'q1' },
      {
        get: async () => ({ approvalStatus: 'DRAFT' }),
        submitReview: async () => {
          throw Error('Không thể gửi duyệt');
        },
        approve: () => assert.fail('must not approve'),
      }
    ),
    /Không thể gửi duyệt/
  );
  await assert.rejects(
    approveAdminQuestion(
      { questionId: 'q1' },
      { get: async () => ({ approvalStatus: 'PENDING' }), approve: async () => ({ approvalStatus: 'PENDING' }) }
    ),
    /chưa xác nhận/
  );
});
test('Partial import approval keeps created IDs and retries only failed questions without uploading again', async () => {
  const calls = [];
  let fail = true;
  const client = {
    get: async (id) => {
      calls.push(id);
      return { questionId: id, approvalStatus: 'PENDING' };
    },
    approve: async (id) => {
      if (id === 'q2' && fail) throw Error('Tạm lỗi');
      return { questionId: id, approvalStatus: 'APPROVED' };
    },
  };
  const result = {
    totalParsed: 2,
    totalImported: 2,
    questions: [{ questionId: 'q1' }, { questionId: 'q2' }],
    warnings: ['Một dòng bị bỏ qua'],
  };
  const partial = await approveAdminImport(result, client);
  assert.equal(partial.totalApproved, 1);
  assert.equal(partial.approvalFailures[0].question.questionId, 'q2');
  fail = false;
  const retried = await approveAdminImport(partial, client);
  assert.equal(retried.totalApproved, 2);
  assert.equal(retried.approvalFailures.length, 0);
  assert.deepEqual(calls, ['q1', 'q2', 'q2']);
  assert.deepEqual(retried.warnings, result.warnings);
});
test('Missing import IDs are counted instead of silently claiming approval', async () => {
  const result = await approveAdminImport({ totalImported: 2, questions: [] }, {});
  assert.equal(result.totalApproved, 0);
  assert.equal(result.missingQuestions, 2);
});
