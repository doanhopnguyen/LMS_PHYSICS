import test from 'node:test';
import assert from 'node:assert/strict';
import { studentExamAvailability } from '../src/lib/studentExamAvailability.js';

const now = Date.parse('2026-10-15T08:00:00Z');
const base = { totalQuestions: 10, attempts: [], policy: { canStart: true, maxAttempts: 3, usedAttempts: 0 } };
const access = (changes = {}) => studentExamAvailability({ ...base, ...changes }, now);

test('new and completed exams show distinct states and allow permitted retries', () => {
  assert.equal(access().statusLabel, 'Chưa làm');
  assert.equal(access().canOpen, true);
  const done = access({ attempts: [{ status: 'SUBMITTED', submittedAt: '2026-10-14T08:00:00Z' }] });
  assert.equal(done.statusLabel, 'Đã làm');
  assert.equal(done.actionLabel, 'Làm lại đề');
  assert.equal(done.canOpen, true);
  assert.equal(access({ policy: { canStartAttempt: true } }).canOpen, true);
});

test('publication, question count, opening time and closing time lock the action', () => {
  for (const changes of [
    { isPublished: false },
    { totalQuestions: 0 },
    { totalQuestions: undefined },
    { startTime: '2026-10-15T08:00:01Z' },
    { endTime: '2026-10-15T08:00:00Z' },
    { policy: { canStart: true, ended: true } },
  ]) {
    const state = access(changes);
    assert.equal(state.canOpen, false, JSON.stringify(changes));
    assert.ok(state.reason);
  }
  assert.equal(access({ startTime: '2026-10-15T08:00:00Z' }).canOpen, true);
});

test('exhausted attempts and server refusal disable starting', () => {
  for (const policy of [
    { canStart: true, maxAttempts: 3, usedAttempts: 3 },
    { canStartAttempt: true, remainingAttempts: 0 },
    { canStart: false, reason: 'Không được phép' },
    { canStartAttempt: false },
  ])
    assert.equal(access({ policy }).canOpen, false);
  assert.equal(access({ policy: { canStart: false, reason: 'Không được phép' } }).reason, 'Không được phép');
});

test('an active attempt takes priority over submitted history and a ban on new attempts', () => {
  const state = access({
    attempts: [
      { attemptId: 'old', status: 'GRADED' },
      { attemptId: 'active', status: 'IN_PROGRESS' },
    ],
    policy: { canStart: false, maxAttempts: 2, usedAttempts: 2 },
  });
  assert.equal(state.statusLabel, 'Đang làm');
  assert.equal(state.canOpen, true);
  assert.equal(state.activeAttempt.attemptId, 'active');
  assert.equal(
    access({ policy: { canStart: false, hasInProgressAttempt: true, inProgressAttemptId: 'resume' } }).activeAttempt
      .attemptId,
    'resume'
  );
  assert.equal(
    access({ attempts: [{ attemptId: 'active', status: 'IN_PROGRESS' }], endTime: '2026-10-15T07:00:00Z' }).canOpen,
    false
  );
});

test('failed policy/history requests do not enable unverified new attempts', () => {
  assert.equal(access({ policy: null }).canOpen, false);
  assert.equal(access({ attempts: null }).canOpen, false);
  assert.equal(access({ attempts: null }).statusLabel, 'Chưa tải được trạng thái');
});

test('upcoming published exams offer a waiting room without allowing an early attempt', () => {
  const upcoming = { startTime: '2026-10-15T08:00:01Z', isPublished: true };
  assert.equal(access(upcoming).canWait, true);
  assert.equal(access(upcoming).canOpen, false);
  assert.equal(access({ ...upcoming, isPublished: false }).canWait, undefined);
  assert.equal(access({ ...upcoming, endTime: '2026-10-15T07:00:00Z' }).canWait, undefined);
  assert.equal(studentExamAvailability({ ...base, ...upcoming }, now + 1000).canOpen, true);
});
