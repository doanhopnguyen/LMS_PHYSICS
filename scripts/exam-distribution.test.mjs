import test from 'node:test';
import assert from 'node:assert/strict';
import { validateExamTargets, prepareExamDistribution, runExamDistribution } from '../src/lib/examDistribution.js';

const classes = [
  { classId: 'a', subjectId: 'physics' },
  { classId: 'b', subjectId: 'physics' },
  { classId: 'c', subjectId: 'math' },
];
const payload = {
  title: 'Kiểm tra',
  examType: 'QUIZ',
  durationMinutes: 30,
  maxAttempts: 2,
  isPublished: true,
  shuffleOptions: true,
};
const source = [
  { questionId: 'q1', scoreWeight: 2, orderIndex: 3 },
  { questionId: 'q2', scoreWeight: 0, orderIndex: 1 },
];

function backend() {
  const calls = [];
  const records = new Map();
  let count = 0;
  let failure;
  return {
    calls,
    records,
    failOnce(when) {
      failure = when;
    },
    create: async (body) => {
      const exam = { ...body, examId: `exam-${++count}` };
      calls.push({ method: 'create', body: { ...body }, id: exam.examId });
      records.set(exam.examId, { exam, questions: body.matrixId ? structuredClone(source) : [] });
      return { ...exam };
    },
    questions: async (id) => structuredClone(records.get(id).questions),
    addQuestion: async (id, body) => {
      calls.push({ method: 'add', id, body: { ...body } });
      if (failure?.(id, body)) {
        failure = null;
        throw new Error('Request failed');
      }
      records.get(id).questions.push({ ...body });
    },
    update: async (id, body) => {
      calls.push({ method: 'update', id, body: { ...body }, questionCount: records.get(id).questions.length });
      Object.assign(records.get(id).exam, body);
      return { ...records.get(id).exam };
    },
  };
}

test('only managed classes of the same subject can receive the exam', () => {
  assert.deepEqual(validateExamTargets(classes, 'a', ['b', 'a', 'b']), ['a', 'b']);
  assert.throws(() => validateExamTargets(classes, 'a', ['c']), /cùng môn/);
  assert.throws(() => validateExamTargets(classes, 'a', ['foreign']), /quản lý/);
  assert.throws(() => validateExamTargets(classes, 'c', [], 'physics'), /cùng môn/);
  assert.throws(() => validateExamTargets(classes, 'ALL'), /chọn lớp/);
  assert.throws(() => validateExamTargets([{ classId: 'a' }, { classId: 'b' }], 'a', ['b']), /cùng môn/);
});

test('copies preserve exact questions, zero weights and order without copying attempts', async () => {
  const api = backend();
  const job = prepareExamDistribution(payload, ['a', 'b'], source);
  const result = await runExamDistribution(job, api);
  assert.equal(result.length, 2);
  assert.notEqual(result[0].examId, result[1].examId);
  assert.deepEqual(
    [...api.records.values()].map((item) => item.questions),
    [source, source]
  );
  assert.deepEqual(source, [
    { questionId: 'q1', scoreWeight: 2, orderIndex: 3 },
    { questionId: 'q2', scoreWeight: 0, orderIndex: 1 },
  ]);
  for (const call of api.calls.filter((item) => item.method === 'create')) assert.equal(call.body.isPublished, false);
  for (const call of api.calls.filter((item) => item.method === 'update')) {
    assert.equal(call.body.isPublished, true);
    assert.equal(call.questionCount, 2);
    assert.equal(call.body.maxAttempts, 2);
    assert.equal(call.body.shuffleOptions, true);
  }
});

test('a matrix is generated once and the exact generated questions are reused for other classes', async () => {
  const api = backend();
  const job = prepareExamDistribution({ ...payload, matrixId: 'matrix-1' }, ['a', 'b']);
  await runExamDistribution(job, api);
  const creates = api.calls.filter((item) => item.method === 'create');
  assert.equal(creates[0].body.matrixId, 'matrix-1');
  assert.equal(creates[1].body.matrixId, undefined);
  assert.deepEqual(api.records.get('exam-1').questions, api.records.get('exam-2').questions);
  assert.equal(api.calls.filter((item) => item.method === 'add' && item.id === 'exam-1').length, 0);
});

test('a partial failure leaves the affected draft unpublished and resumes without duplicate exams or questions', async () => {
  const api = backend();
  api.failOnce((id, question) => id === 'exam-2' && question.questionId === 'q2');
  const job = prepareExamDistribution(payload, ['a', 'b'], source);
  await assert.rejects(runExamDistribution(job, api), /Request failed/);
  assert.equal(job.targets[0].complete, true);
  assert.equal(job.targets[1].complete, false);
  assert.equal(api.records.get('exam-2').exam.isPublished, false);
  await runExamDistribution(job, api);
  assert.equal(api.calls.filter((item) => item.method === 'create').length, 2);
  assert.equal(api.calls.filter((item) => item.method === 'update' && item.id === 'exam-1').length, 1);
  assert.deepEqual(api.records.get('exam-2').questions, source);
});

test('retry reconciles a question saved before its response was lost', async () => {
  const api = backend();
  const add = api.addQuestion;
  let loseResponse = true;
  api.addQuestion = async (id, body) => {
    await add(id, body);
    if (loseResponse) {
      loseResponse = false;
      throw new Error('Response lost');
    }
  };
  const job = prepareExamDistribution(payload, ['a'], source);
  await assert.rejects(runExamDistribution(job, api), /Response lost/);
  await runExamDistribution(job, api);
  assert.deepEqual(api.records.get('exam-1').questions, source);
  assert.equal(api.calls.filter((item) => item.method === 'create').length, 1);
});

test('malformed source questions fail before creating any target exam', () => {
  assert.throws(() => prepareExamDistribution(payload, ['a'], [{}]), /thiếu mã/);
});

test('an empty source remains empty even when it references a matrix', async () => {
  const api = backend();
  await runExamDistribution(
    prepareExamDistribution({ ...payload, matrixId: 'matrix-1', isPublished: false }, ['a'], []),
    api
  );
  assert.deepEqual(api.records.get('exam-1').questions, []);
  assert.equal(api.records.get('exam-1').exam.isPublished, false);
});
