import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialAnswerOptions,
  validateQuestionAnswers,
  questionAnswerPayload,
  answerPayload,
} from '../src/lib/questionTypes.js';
import { attemptScore, attemptMaxScore } from '../src/lib/examScoring.js';

test('answer keys enforce single, multi, binary and short answer contracts', () => {
  const options = [
    { content: 'A', isCorrect: true },
    { content: 'B', isCorrect: false },
  ];
  assert.equal(validateQuestionAnswers('MCQ_SINGLE', options), '');
  assert.ok(validateQuestionAnswers('MCQ_MULTI', options));
  const multi = options.map((row) => ({ ...row, isCorrect: true }));
  assert.equal(validateQuestionAnswers('MCQ_MULTI', multi), '');
  assert.ok(validateQuestionAnswers('MCQ_SINGLE', multi));
  assert.ok(validateQuestionAnswers('MCQ_SINGLE', [{ ...options[0] }, { ...options[1], content: ' a ' }]));
  const binary = initialAnswerOptions({}, 'TRUE_FALSE');
  assert.deepEqual(
    binary.map((row) => row.content),
    ['Đúng', 'Sai']
  );
  assert.ok(validateQuestionAnswers('TRUE_FALSE', binary));
  binary[1].isCorrect = true;
  assert.equal(validateQuestionAnswers('TRUE_FALSE', binary), '');
  for (const type of ['SHORT_ANSWER', 'FILL_BLANK']) {
    assert.ok(validateQuestionAnswers(type, [], ' \n'));
    assert.equal(validateQuestionAnswers(type, [], '9.8 m/s²'), '');
    assert.deepEqual(questionAnswerPayload(type, options, ' 9.8 \n9,8\n9.8\n'), {
      options: [],
      acceptedAnswers: ['9.8', '9,8'],
    });
  }
});

test('student requests contain responses only and discard fields of a different type', () => {
  const question = {
    questionId: 'q',
    questionType: 'SHORT_ANSWER',
    options: [{ isCorrect: true }],
    acceptedAnswers: ['secret'],
  };
  assert.deepEqual(answerPayload(question, { answerText: '9.8', selectedOptionIds: ['stale'] }), {
    questionId: 'q',
    answerText: '9.8',
    selectedOptionIds: [],
  });
  assert.deepEqual(
    answerPayload(
      { ...question, questionType: 'MCQ_MULTI' },
      { answerText: 'stale', selectedOptionIds: ['a', 'b', 'a'] }
    ),
    { questionId: 'q', answerText: null, selectedOptionIds: ['a', 'b'] }
  );
});

test('backend score takes precedence over frontend weights and raw totals', () => {
  const attempt = {
    status: 'GRADED',
    totalScore: 100,
    maxScore: 200,
    scoreOnTen: 7.25,
    questions: [{ scoreWeight: 1 }],
  };
  assert.equal(attemptScore(attempt), 7.25);
  assert.equal(attemptMaxScore(attempt), 200);
  assert.equal(attemptScore({ ...attempt, scoreOnTen: null }), null);
  assert.equal(attemptScore({ ...attempt, status: 'IN_PROGRESS' }), null);
});
