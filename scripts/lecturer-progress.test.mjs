import test from 'node:test';
import assert from 'node:assert/strict';
import { groupStudentProgress } from '../src/lib/lecturerProgress.js';

const students = [
  { studentId: 'a', fullName: 'Sinh viên A' },
  { userId: 'b', fullName: 'Sinh viên B' },
];
const topics = [
  { topicId: 'one', topicName: 'Chương 1' },
  { topicId: 'two', topicName: 'Chương 2' },
];

test('progress groups each student once and includes students and chapters with no activity', () => {
  const rows = groupStudentProgress(students, topics, [{ studentId: 'a', topicId: 'one', progressPercent: 100 }]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].progressPercent, 50);
  assert.equal(rows[0].completedChapters, 1);
  assert.equal(rows[0].chapters[1].progressPercent, 0);
  assert.equal(rows[1].progressPercent, 0);
  assert.equal(rows[1].chapters.length, 2);
});

test('chapter detail isolates student IDs and retains the latest access per student', () => {
  const rows = groupStudentProgress(students, topics, [
    { userId: 'b', topicId: 'one', progressPercent: 25, lastAccessedAt: '2026-10-02' },
    { studentId: 'a', topicId: 'two', progressPercent: 80, lastAccessedAt: '2026-10-03' },
    { studentId: 'a', topicId: 'one', progressPercent: 100, lastAccessedAt: '2026-10-01' },
  ]);
  assert.deepEqual(
    rows[0].chapters.map((row) => row.progressPercent),
    [100, 80]
  );
  assert.deepEqual(
    rows[1].chapters.map((row) => row.progressPercent),
    [25, 0]
  );
  assert.equal(rows[0].lastAccessedAt, '2026-10-03');
  assert.equal(rows[1].lastAccessedAt, '2026-10-02');
});

test('duplicate records count a chapter once and newly added chapters reduce total progress', () => {
  const progress = [
    { studentId: 'a', topicId: 'one', progressPercent: 30, lastAccessedAt: '2026-10-01' },
    { studentId: 'a', topicId: 'one', progressPercent: 100, lastAccessedAt: '2026-10-02' },
  ];
  assert.equal(groupStudentProgress(students, topics.slice(0, 1), progress)[0].progressPercent, 100);
  assert.equal(groupStudentProgress(students, topics, progress)[0].progressPercent, 50);
});

test('progress records remain visible when a student or chapter is absent from lookups', () => {
  const rows = groupStudentProgress([], [], [{ studentId: 7, topicId: 2, progressPercent: 100 }]);
  assert.equal(rows[0].studentId, '7');
  assert.equal(rows[0].chapters[0].topicId, 2);
  assert.equal(rows[0].completedChapters, 1);
});
