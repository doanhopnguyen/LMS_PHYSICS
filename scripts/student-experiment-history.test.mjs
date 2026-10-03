import test from 'node:test';
import assert from 'node:assert/strict';
import { submissionGrade, loadStudentExperimentHistory } from '../src/lib/studentExperimentHistory.js';

test('history passes only the assignment filter and preserves every returned attempt', async () => {
  const api = {
    experiments: {
      submissions: async (query) => {
        assert.deepEqual(query, { assignmentId: 'a1' });
        return [{ submissionId: 'old' }, { submissionId: 'new' }, { submissionId: 'new' }];
      },
      getSubmission: async (id) => ({ submissionId: id }),
      rubricSummary: async () => ({ status: 'PENDING' }),
    },
  };
  const rows = await loadStudentExperimentHistory(api, {
    assignmentId: 'a1',
    recentSubmission: { submissionId: 'new' },
  });
  assert.deepEqual(rows.map((row) => row.submissionId).sort(), ['new', 'old']);
});

test('pending zero is not a grade; graded and confirmed zeros remain visible', () => {
  const pending = { status: 'PENDING', totalScore: 0, totalMaxScore: 10, rubrics: [{ isGraded: false, score: null }] };
  assert.equal(submissionGrade({}, pending).score, null);
  const partial = {
    ...pending,
    status: 'GRADED',
    rubrics: [
      { isGraded: true, score: 0 },
      { isGraded: false, score: null },
    ],
  };
  assert.equal(submissionGrade({}, partial).score, 0);
  assert.equal(submissionGrade({}, partial).label, 'Điểm tạm tính');
  assert.equal(submissionGrade({}, { ...partial, status: 'CONFIRMED' }).label, 'Đã chốt điểm');
  assert.equal(submissionGrade({ status: 'GRADED', totalScore: 0 }).score, 0);
});

test('loads server-scoped history, newest first, while retaining reports with unavailable grades', async () => {
  const calls = [];
  const api = {
    experiments: {
      submissions: async (query) => {
        assert.deepEqual(query, {});
        return [{ submissionId: 'old' }, { submissionId: 'new' }];
      },
      getSubmission: async (id) => {
        calls.push(id);
        return {
          submissionId: id,
          assignmentId: 'a1',
          submittedAt: id === 'new' ? '2026-10-03T00:00:00Z' : '2026-10-02T00:00:00Z',
        };
      },
      rubricSummary: async (id) => {
        if (id === 'new') throw new Error('Điểm chưa khả dụng');
        return { status: 'CONFIRMED', totalScore: 0 };
      },
    },
  };
  const result = await loadStudentExperimentHistory(api);
  assert.deepEqual(calls.sort(), ['new', 'old']);
  assert.deepEqual(
    result.map((row) => row.submissionId),
    ['new', 'old']
  );
  assert.equal(result[0].scoreError, 'Điểm chưa khả dụng');
  assert.equal(result[0].detailError, '');
  assert.equal(result[1].summary.totalScore, 0);
});

test('own endpoint failure is surfaced instead of displaying a false empty history', async () => {
  await assert.rejects(
    loadStudentExperimentHistory({
      experiments: {
        submissions: async () => {
          throw new Error('Không tải được bài nộp');
        },
      },
    }),
    /Không tải được bài nộp/
  );
});
