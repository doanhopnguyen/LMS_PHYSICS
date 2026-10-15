import test from 'node:test';
import assert from 'node:assert/strict';
import { examUpdatePayload } from '../src/lib/examEditing.js';
import { localDateTimeInput } from '../src/lib/lecturerUtils.js';

const original = {
  examId: 'exam-1',
  classId: 'class-1',
  title: 'Đề kiểm tra',
  examType: 'QUIZ',
  durationMinutes: 30,
  matrixId: 'matrix-1',
  startTime: '2026-10-19T01:30:35Z',
  endTime: '2026-10-19T02:30:45Z',
};
const fields = (exam) => ({
  title: exam.title,
  examType: exam.examType,
  durationMinutes: '30',
  maxAttempts: '1',
  startTime: localDateTimeInput(exam.startTime),
  endTime: localDateTimeInput(exam.endTime),
});

test('a title-only edit preserves schedule seconds and does not resend structure or unknown settings', () => {
  assert.deepEqual(examUpdatePayload(original, { ...fields(original), title: 'Đề đổi tên' }), { title: 'Đề đổi tên' });
});
test('unchanged local inputs produce no updates', () => {
  assert.deepEqual(examUpdatePayload(original, fields(original)), {});
});
test('schedule changes are sent in UTC without depending on class metadata', () => {
  const exam = { ...original, classId: undefined };
  const endTime = localDateTimeInput('2026-10-19T03:30:00Z');
  assert.deepEqual(examUpdatePayload(exam, { ...fields(exam), endTime }), { endTime: '2026-10-19T03:30:00.000Z' });
});
test('a disabled matrix picker and unchanged final-exam type do not change exam structure', () => {
  const exam = { ...original, examType: 'FINAL' };
  const values = { ...fields(exam), title: 'Đổi lịch thi cuối kỳ' };
  delete values.examType;
  assert.deepEqual(examUpdatePayload(exam, values), { title: 'Đổi lịch thi cuối kỳ' });
});
test('explicitly changed configuration is retained, including turning publication off', () => {
  const exam = { ...original, isPublished: true, maxAttempts: 2, shuffleOptions: true };
  assert.deepEqual(examUpdatePayload(exam, { ...fields(exam), maxAttempts: '3' }), {
    maxAttempts: 3,
    shuffleOptions: false,
    isPublished: false,
  });
});
