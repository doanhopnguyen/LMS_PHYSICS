import test from 'node:test';
import assert from 'node:assert/strict';
import {
  examMaxScore,
  tenPointScore,
  rawScoreFromTen,
  attemptScore,
  formatAttemptScore,
} from '../src/lib/examScoring.js';

test('weighted totals, not correct-answer counts, determine the ten-point score', () => {
  const questions = [{ scoreWeight: 2 }, { scoreWeight: 3 }];
  assert.equal(examMaxScore(questions), 5);
  assert.equal(attemptScore({ status: 'GRADED', totalScore: 2, questions }), 4);
  assert.equal(attemptScore({ status: 'GRADED', totalScore: 3, questions }), 6);
});
test('missing weights use the backend default of one and floating sums remain stable', () => {
  assert.equal(examMaxScore([{}, { scoreWeight: null }, { scoreWeight: '2' }]), 4);
  assert.equal(examMaxScore([{ scoreWeight: 0.1 }, { scoreWeight: 0.2 }]), 0.3);
});
test('different exam sizes are comparable on the same scale', () => {
  assert.equal(tenPointScore(24, 30), 8);
  assert.equal(tenPointScore(4, 5), 8);
  assert.equal(tenPointScore(1, 3), 3.33);
});
test('a graded zero is retained while ungraded or missing scores are excluded', () => {
  const questions = [{ scoreWeight: 1 }];
  assert.equal(attemptScore({ status: 'GRADED', totalScore: 0, questions }), 0);
  for (const attempt of [
    { status: 'SUBMITTED', totalScore: 0 },
    { status: 'IN_PROGRESS', totalScore: 8 },
    { status: 'GRADED', totalScore: null },
    { status: 'GRADED', totalScore: '' },
  ]) {
    assert.equal(attemptScore(attempt, questions), null);
  }
});
test('empty, negative and invalid grading scales are not guessed from question count', () => {
  for (const questions of [[], [{ scoreWeight: 0 }], [{ scoreWeight: -1 }], [{ scoreWeight: 'bad' }]])
    assert.equal(examMaxScore(questions), null);
  for (const score of [null, '', -1, 11, Infinity]) assert.equal(tenPointScore(score, 10), null);
});
test('manual grades convert to the backend weighted score with valid boundaries', () => {
  assert.equal(rawScoreFromTen(8, 5), 4);
  assert.equal(rawScoreFromTen(0, 5), 0);
  assert.equal(rawScoreFromTen(10, 5), 5);
  assert.equal(rawScoreFromTen(7.5, 3), 2.25);
  for (const score of ['', null, 'bad', -1, 10.01, Infinity]) assert.throws(() => rawScoreFromTen(score, 5));
  assert.throws(() => rawScoreFromTen(8, 0));
});
test('manual precision reflects the persisted weighted precision without exceeding its maximum', () => {
  const raw = rawScoreFromTen(6.67, 5);
  assert.equal(raw, 3.34);
  assert.equal(tenPointScore(raw, 5), 6.68);
  assert.equal(rawScoreFromTen(10, 0.335), 0.335);
});
test('score text distinguishes pending grades, valid zeros and missing scale metadata', () => {
  assert.equal(formatAttemptScore({ status: 'SUBMITTED', totalScore: 0 }, [{}]), 'Chưa chấm');
  assert.equal(formatAttemptScore({ status: 'GRADED', totalScore: 0 }, [{}]), '0/10');
  assert.equal(formatAttemptScore({ status: 'GRADED', totalScore: 3 }, [{ scoreWeight: 5 }]), '6/10');
  assert.equal(formatAttemptScore({ status: 'GRADED', totalScore: 3 }, []), 'Chưa xác định thang điểm');
});
