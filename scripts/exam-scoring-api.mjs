import assert from 'node:assert/strict';
import { examMaxScore, attemptScore, rawScoreFromTen } from '../src/lib/examScoring.js';

// All writes target the isolated H2 backend on port 18080.
const origin = 'http://127.0.0.1:18080';
let token;
async function request(path, method = 'GET', body) {
  const response = await fetch(origin + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json();
  assert.ok(response.ok, `${method} ${path}: ${response.status} ${result.message}`);
  return result.data;
}
const login = async username => (await request('/api/v1/users/signin', 'POST', { username, password: 'admin123456' })).accessToken;
token = await login('admin');
const adminToken = token;
const users = await request('/api/v1/users/admin/users?size=100');
const rows = Array.isArray(users) ? users : users.content;
const teacher = rows.find(user => user.username === 'gv_nguyen');
const student = rows.find(user => user.username === 'sv_an');
assert.ok(teacher && student);
const suffix = Date.now();
const subject = await request('/api/v1/subjects', 'POST', { subjectCode: `SCORE-${suffix}`, subjectName: 'Scoring QA' });
const chapter = await request(`/api/v1/subjects/${subject.subjectId}/chapters`, 'POST', { chapterCode: 'C1', chapterName: 'Scoring', orderIndex: 0, isActive: true });
const topic = await request(`/api/v1/subjects/${subject.subjectId}/topics`, 'POST', { topicName: 'Scoring', chapterId: chapter.chapterId, orderIndex: 0 });
const semester = await request('/api/v1/semesters', 'POST', { semesterCode: `SCORE-${suffix}`, semesterName: `Scoring QA ${suffix}`, academicYear: '2026-2027', startDate: '2026-01-01', endDate: '2027-12-31' });
const clazz = await request('/api/v1/classes', 'POST', { subjectId: subject.subjectId, semesterId: semester.semesterId, classCode: `SCORE-${suffix}`, instructorId: teacher.userId, maxStudents: 10 });
await request(`/api/v1/classes/${clazz.classId}/status`, 'PUT', { status: 'ACTIVE' });
await request(`/api/v1/classes/${clazz.classId}/enroll-bulk`, 'POST', { studentIds: [student.userId] });
const base = { subjectId: subject.subjectId, topicId: topic.topicId, difficultyLevel: 'EASY', approvalStatus: 'PENDING' };
const first = await request('/api/v1/questions', 'POST', { ...base, questionType: 'MCQ_SINGLE', content: 'Weighted MCQ', options: [{ content: 'Correct', isCorrect: true, orderIndex: 0 }, { content: 'Incorrect', isCorrect: false, orderIndex: 1 }] });
const second = await request('/api/v1/questions', 'POST', { ...base, questionType: 'FILL_BLANK', content: 'Weighted fill blank', acceptedAnswers: ['Newton'] });
for (const question of [first, second]) {
  if (question.approvalStatus !== 'PENDING') await request(`/api/v1/questions/${question.questionId}/submit-review`, 'PUT');
  await request(`/api/v1/questions/${question.questionId}/approve`, 'PUT');
}
token = await login('gv_nguyen');
const teacherToken = token;
const exam = await request('/api/v1/exams', 'POST', { classId: clazz.classId, title: 'Weighted scoring QA', examType: 'PRACTICE', durationMinutes: 30, startTime: new Date(Date.now() - 60000).toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), maxAttempts: 3, isPublished: true });
await request(`/api/v1/exams/${exam.examId}/questions`, 'POST', { questionId: first.questionId, scoreWeight: 2, orderIndex: 1 });
await request(`/api/v1/exams/${exam.examId}/questions`, 'POST', { questionId: second.questionId, scoreWeight: 3, orderIndex: 2 });
const definition = await request(`/api/v1/exams/${exam.examId}/questions`);
assert.equal(examMaxScore(definition), 5);
token = await login('sv_an');
const studentToken = token;
const attempt = await request(`/api/v1/exams/${exam.examId}/attempts`, 'POST');
const correctOption = first.options.find(option => option.isCorrect).optionId;
await request(`/api/v1/exams/attempts/${attempt.attemptId}/answers`, 'POST', { questionId: first.questionId, selectedOptionIds: [correctOption] });
await request(`/api/v1/exams/attempts/${attempt.attemptId}/answers`, 'POST', { questionId: second.questionId, answerText: 'Wrong' });
const submitted = await request(`/api/v1/exams/attempts/${attempt.attemptId}/submit`, 'POST');
assert.equal(submitted.totalScore, 2);
assert.equal(attemptScore(submitted), 4);
console.log('PASS Weighted automatic scoring converts 2/5 to 4/10');
token = teacherToken;
const graded = await request(`/api/v1/exams/attempts/${attempt.attemptId}/grade`, 'PUT', { totalScore: rawScoreFromTen(8, 5), feedback: 'Converted score: 8/10. Rechecked answers.' });
assert.equal(attemptScore(graded), 8);
console.log('PASS Manual grade 8/10 persists the correct weighted score');
token = studentToken;
const own = await request(`/api/v1/exams/${exam.examId}/my-attempts`);
assert.equal(attemptScore(own.find(row => row.attemptId === attempt.attemptId)), 8);
console.log('PASS Student reads the same normalized result');
token = teacherToken;
await request(`/api/v1/exams/attempts/${attempt.attemptId}/grade`, 'PUT', { totalScore: rawScoreFromTen(0, 5), feedback: 'Correction to zero.' });
token = studentToken;
const zero = (await request(`/api/v1/exams/${exam.examId}/my-attempts`)).find(row => row.attemptId === attempt.attemptId);
assert.equal(attemptScore(zero), 0);
console.log('PASS Zero stays a graded result on reload');
console.log('4 isolated exam scoring API scenarios passed.');
