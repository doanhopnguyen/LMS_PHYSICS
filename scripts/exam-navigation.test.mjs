import test from 'node:test';
import assert from 'node:assert/strict';
import { examBackHref, examListHref, examResultsHref } from '../src/lib/examNavigation.js';

const origin = 'https://lms.example';
test('back from a new attempt can return to results for the same exam', () => {
  const previous = '/exam_results?examId=e1&attemptId=old&workspace=practice&class=c1#answers';
  assert.equal(examBackHref(previous, 'practice', origin), previous);
  assert.equal(
    examBackHref('/exam_practice_center?tab=suggestions&class=ALL', 'exam', origin),
    '/exam_practice_center?tab=suggestions&class=ALL'
  );
});
test('back skips taking and waiting routes and falls back to the matching workspace', () => {
  for (const previous of [
    undefined,
    '/exam_session?examId=e1&mode=waiting',
    '/exam_practice_center?examId=e1&mode=take',
    '/exam_practice_center?practiceSessionId=p1',
  ]) {
    assert.equal(examBackHref(previous, 'practice', origin), 'exam_practice_center.html?tab=teacher');
    assert.equal(examBackHref(previous, 'exam', origin), 'exam_session.html');
  }
});
test('return destinations exclude external, authentication and unknown routes', () => {
  for (const previous of ['//outside.example/exam_results', 'https://outside.example', '/login', '/unknown-page']) {
    assert.equal(examBackHref(previous, 'practice', origin), examListHref('practice'));
  }
});
test('result links preserve their workspace and encode identifiers', () => {
  const url = new URL(examResultsHref('exam /1', 'attempt&1', 'practice'), origin);
  assert.equal(url.searchParams.get('examId'), 'exam /1');
  assert.equal(url.searchParams.get('attemptId'), 'attempt&1');
  assert.equal(url.searchParams.get('workspace'), 'practice');
});
