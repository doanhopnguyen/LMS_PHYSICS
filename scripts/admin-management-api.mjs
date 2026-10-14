import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

const approvalBundle = await build({
  entryPoints: ['src/lib/adminQuestionApproval.js'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  define: { 'import.meta.env.VITE_API_BASE_URL': '"http://127.0.0.1:18080"' },
});
const { approveAdminQuestion, approveAdminImport } = await import(
  `data:text/javascript;base64,${Buffer.from(approvalBundle.outputFiles[0].text).toString('base64')}`
);

// This harness writes only to the isolated H2 test backend on port 18080.
const origin = 'http://127.0.0.1:18080';
const results = [];
let token;
async function request(path, method = 'GET', body) {
  const multipart = body instanceof FormData;
  const response = await fetch(origin + path, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!multipart && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  const payload = await response.json();
  assert.ok(response.ok, `${method} ${path}: ${response.status} ${payload.message}`);
  return payload.data;
}
async function check(label, action) {
  await action();
  results.push({ label, passed: true });
  console.log('PASS', label);
}
const items = (value) => (Array.isArray(value) ? value : value.content);
const login = await request('/api/v1/users/signin', 'POST', { username: 'admin', password: 'admin123456' });
token = login.accessToken;
assert.ok(token);
const suffix = Date.now();
let semester, subject, chapter, topic, material, classInfo, teacher, student;
await check('Creates semester and subject with documented payloads', async () => {
  semester = await request('/api/v1/semesters', 'POST', {
    semesterCode: `QA-${suffix}`,
    semesterName: `Học kỳ QA ${suffix}`,
    academicYear: '2026–2027',
    startDate: '2026-09-01',
    endDate: '2027-01-31',
  });
  subject = await request('/api/v1/subjects', 'POST', {
    subjectCode: `QA-${suffix}`,
    subjectName: 'Học phần QA',
    description: 'Kiểm thử cô lập',
  });
  assert.ok(semester.semesterId && subject.subjectId);
});
await check('Edits subject and toggles its status', async () => {
  await request(`/api/v1/subjects/${subject.subjectId}`, 'PUT', {
    subjectName: 'Học phần QA cập nhật',
    description: '',
  });
  await request(`/api/v1/subjects/${subject.subjectId}/toggle-status`, 'PUT');
  const detail = await request(`/api/v1/subjects/${subject.subjectId}`);
  assert.equal(detail.isActive, false);
  await request(`/api/v1/subjects/${subject.subjectId}/toggle-status`, 'PUT');
});
await check('Creates chapter, topic and shared text material; parent lists contain new entities', async () => {
  chapter = await request(`/api/v1/subjects/${subject.subjectId}/chapters`, 'POST', {
    chapterCode: 'C1',
    chapterName: 'Cơ học',
    orderIndex: 1,
    isActive: true,
  });
  topic = await request(`/api/v1/subjects/${subject.subjectId}/topics`, 'POST', {
    topicName: 'Động lực học',
    chapterId: chapter.chapterId,
    orderIndex: 1,
  });
  const form = new FormData();
  for (const [key, value] of Object.entries({
    title: 'Học liệu QA',
    type: 'TEXT',
    contentText: 'Nội dung thử nghiệm',
    scope: 'SHARED',
    topicId: topic.topicId,
  }))
    form.set(key, value);
  material = await request(`/api/v1/topics/${topic.topicId}/materials`, 'POST', form);
  assert.ok(
    items(await request(`/api/v1/chapters/${chapter.chapterId}/topics`)).some((t) => t.topicId === topic.topicId)
  );
  assert.ok(
    items(await request(`/api/v1/topics/${topic.topicId}/materials`)).some((m) => m.materialId === material.materialId)
  );
});
await check('Loads active instructors and creates a class with assigned instructor', async () => {
  const users = items(await request('/api/v1/users/admin/users?size=100'));
  teacher = users.find((user) => user.role === 'INSTRUCTOR' && user.status === 'ACTIVE');
  student = users.find((user) => user.role === 'STUDENT' && user.status === 'ACTIVE');
  assert.ok(teacher?.userId && student?.userId);
  classInfo = await request('/api/v1/classes', 'POST', {
    classCode: `QA-${suffix}`,
    semesterId: semester.semesterId,
    subjectId: subject.subjectId,
    instructorId: teacher.userId,
    maxStudents: 50,
  });
  assert.equal(classInfo.instructorId, teacher.userId);
  assert.ok(
    items(await request(`/api/v1/classes?semesterId=${semester.semesterId}&subjectId=${subject.subjectId}`)).some(
      (c) => c.classId === classInfo.classId
    )
  );
});
await check('Edits class, assigns instructor and changes class status', async () => {
  await request(`/api/v1/classes/${classInfo.classId}`, 'PUT', { classCode: `QA-EDIT-${suffix}`, maxStudents: 40 });
  await request(`/api/v1/classes/${classInfo.classId}/instructor`, 'PUT', { instructorId: teacher.userId });
  await request(`/api/v1/classes/${classInfo.classId}/status`, 'PUT', { status: 'ACTIVE' });
  assert.equal((await request(`/api/v1/classes/${classInfo.classId}`)).status, 'ACTIVE');
});
await check('Enrolls student, filters roster, changes enrollment status and removes student', async () => {
  await request(`/api/v1/classes/${classInfo.classId}/enroll-bulk`, 'POST', { studentIds: [student.userId] });
  assert.ok(
    items(await request(`/api/v1/classes/${classInfo.classId}/students?status=ACTIVE`)).some(
      (s) => s.studentId === student.userId
    )
  );
  await request(`/api/v1/classes/${classInfo.classId}/students/${student.userId}/status`, 'PUT', {
    status: 'COMPLETED',
  });
  assert.ok(
    items(await request(`/api/v1/classes/${classInfo.classId}/students?status=COMPLETED`)).some(
      (s) => s.studentId === student.userId
    )
  );
  await request(`/api/v1/classes/${classInfo.classId}/students/${student.userId}`, 'DELETE');
  assert.equal(items(await request(`/api/v1/classes/${classInfo.classId}/students`)).length, 0);
});
let cloOne, cloTwo, cloQuestion;
await check('Creates and edits subject CLOs; question payload round-trips multiple CLO IDs', async () => {
  cloOne = await request(`/api/v1/subjects/${subject.subjectId}/clos`, 'POST', {
    cloCode: 'CLO1',
    description: 'Vận dụng cơ học',
    orderIndex: 1,
    isActive: true,
  });
  cloTwo = await request(`/api/v1/subjects/${subject.subjectId}/clos`, 'POST', {
    cloCode: 'CLO2',
    description: 'Phân tích cơ học',
    orderIndex: 2,
    isActive: true,
  });
  await request(`/api/v1/clos/${cloTwo.cloId}`, 'PUT', {
    cloCode: 'CLO2',
    description: 'Mô tả cập nhật',
    orderIndex: 2,
    isActive: true,
  });
  cloQuestion = await request('/api/v1/questions', 'POST', {
    subjectId: subject.subjectId,
    topicId: topic.topicId,
    content: 'Câu hỏi kiểm thử CLO',
    questionType: 'MCQ_SINGLE',
    difficultyLevel: 'EASY',
    approvalStatus: 'DRAFT',
    cloIds: [cloOne.cloId, cloTwo.cloId],
    options: [
      { content: 'Đúng', isCorrect: true, orderIndex: 0 },
      { content: 'Sai', isCorrect: false, orderIndex: 1 },
    ],
  });
  assert.deepEqual(new Set(cloQuestion.cloIds), new Set([cloOne.cloId, cloTwo.cloId]));
});
async function expectStatus(path, method, body, status) {
  const response = await fetch(origin + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, status, `${method} ${path}`);
  await response.arrayBuffer();
}
await check('Inactive CLO assignment is rejected without losing existing links', async () => {
  await request(`/api/v1/clos/${cloOne.cloId}/toggle-status?isActive=false`, 'PATCH');
  await expectStatus(`/api/v1/questions/${cloQuestion.questionId}/clos`, 'PUT', [cloOne.cloId], 400);
  assert.equal((await request(`/api/v1/questions/${cloQuestion.questionId}`)).cloIds.length, 2);
  await request(`/api/v1/clos/${cloOne.cloId}/toggle-status?isActive=true`, 'PATCH');
});
await check('Foreign-subject CLO is rejected and linked CLO cannot be deleted', async () => {
  const foreignSubject = items(await request('/api/v1/subjects?size=100')).find(
    (row) => row.subjectId !== subject.subjectId && row.isActive
  );
  const foreignClo = await request(`/api/v1/subjects/${foreignSubject.subjectId}/clos`, 'POST', {
    cloCode: `QA-${suffix}`,
    description: 'CLO khác môn',
    orderIndex: 99,
    isActive: true,
  });
  await expectStatus(`/api/v1/questions/${cloQuestion.questionId}/clos`, 'PUT', [foreignClo.cloId], 400);
  await expectStatus(`/api/v1/clos/${cloTwo.cloId}`, 'DELETE', undefined, 409);
});
await check('Raw empty CLO assignment removes all links; unlinked CLO can be deleted', async () => {
  const cleared = await request(`/api/v1/questions/${cloQuestion.questionId}/clos`, 'PUT', []);
  assert.equal(cleared.cloIds.length, 0);
  await request(`/api/v1/clos/${cloTwo.cloId}`, 'DELETE');
  assert.ok(
    !items(await request(`/api/v1/subjects/${subject.subjectId}/clos?activeOnly=false`)).some(
      (row) => row.cloId === cloTwo.cloId
    )
  );
});
await check('Matrix detail stores an active CLO from the same subject', async () => {
  const matrix = await request('/api/v1/exam-matrices', 'POST', {
    subjectId: subject.subjectId,
    matrixName: 'Ma trận kiểm thử CLO',
    examType: 'QUIZ',
    totalPoints: 10,
    details: [
      { topicId: topic.topicId, cloId: cloOne.cloId, difficultyLevel: 'EASY', numQuestions: 1, weightPercent: 100 },
    ],
  });
  assert.equal(matrix.details[0].cloId, cloOne.cloId);
});
await check('Admin approves pending questions and rejects duplicate approval', async () => {
  if (cloQuestion.approvalStatus !== 'PENDING')
    await request(`/api/v1/questions/${cloQuestion.questionId}/submit-review`, 'PUT');
  const approved = await request(
    `/api/v1/questions/${cloQuestion.questionId}/approve?comment=${encodeURIComponent('Đã kiểm tra đáp án')}`,
    'PUT'
  );
  assert.equal(approved.approvalStatus, 'APPROVED');
  assert.ok(approved.reviewedBy && approved.reviewedAt);
  await expectStatus(`/api/v1/questions/${cloQuestion.questionId}/approve`, 'PUT', undefined, 409);
});
await check(
  'Admin rejects pending questions with a reason and cannot approve a rejected question directly',
  async () => {
    const question = await request('/api/v1/questions', 'POST', {
      subjectId: subject.subjectId,
      topicId: topic.topicId,
      questionType: 'MCQ_SINGLE',
      content: 'Câu hỏi kiểm thử từ chối',
      difficultyLevel: 'EASY',
      options: [
        { content: 'A', isCorrect: true, orderIndex: 0 },
        { content: 'B', isCorrect: false, orderIndex: 1 },
      ],
    });
    if (question.approvalStatus !== 'PENDING')
      await request(`/api/v1/questions/${question.questionId}/submit-review`, 'PUT');
    await expectStatus(`/api/v1/questions/${question.questionId}/reject`, 'PUT', { rejectionReason: ' ' }, 400);
    const rejected = await request(`/api/v1/questions/${question.questionId}/reject`, 'PUT', {
      rejectionReason: 'Cần làm rõ nội dung',
      comment: 'Kiểm thử',
    });
    assert.equal(rejected.approvalStatus, 'REJECTED');
    assert.equal(rejected.rejectionReason, 'Cần làm rõ nội dung');
    await expectStatus(`/api/v1/questions/${question.questionId}/approve`, 'PUT', undefined, 400);
  }
);
await check('Admin approves a pending learning material in its topic scope', async () => {
  const approved = await request(`/api/v1/topics/${topic.topicId}/materials/${material.materialId}/approve`, 'PUT');
  assert.equal(approved.approvalStatus, 'APPROVED');
  assert.equal(
    (await request(`/api/v1/topics/${topic.topicId}/materials/${material.materialId}`)).approvalStatus,
    'APPROVED'
  );
});
const approvalClient = {
  get: (id) => request(`/api/v1/questions/${id}`),
  submitReview: (id) => request(`/api/v1/questions/${id}/submit-review`, 'PUT'),
  approve: (id) => request(`/api/v1/questions/${id}/approve`, 'PUT'),
};
await check('Admin creation finishes in APPROVED through the frontend automatic approval workflow', async () => {
  const created = await request('/api/v1/questions', 'POST', {
    subjectId: subject.subjectId,
    topicId: topic.topicId,
    questionType: 'MCQ_SINGLE',
    content: 'Admin tạo và duyệt ngay',
    difficultyLevel: 'EASY',
    approvalStatus: 'PENDING',
    options: [
      { content: 'A', isCorrect: true, orderIndex: 0 },
      { content: 'B', isCorrect: false, orderIndex: 1 },
    ],
  });
  const approved = await approveAdminQuestion(created, approvalClient);
  assert.equal(approved.approvalStatus, 'APPROVED');
  assert.equal((await request(`/api/v1/questions/${created.questionId}`)).approvalStatus, 'APPROVED');
});
await check('Real Excel import automatically submits and approves all imported question IDs', async () => {
  const template = await fetch(`${origin}/api/v1/questions/import-excel/template`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.ok(template.ok);
  const form = new FormData();
  form.set('file', await template.blob(), 'cau-hoi.xlsx');
  const imported = await request(
    `/api/v1/questions/import-excel?subjectId=${subject.subjectId}&topicId=${topic.topicId}`,
    'POST',
    form
  );
  assert.ok(imported.totalImported > 0);
  const approved = await approveAdminImport(imported, approvalClient);
  assert.equal(approved.totalApproved, imported.totalImported);
  assert.equal(approved.approvalFailures.length, 0);
  for (const question of approved.questions)
    assert.equal((await request(`/api/v1/questions/${question.questionId}`)).approvalStatus, 'APPROVED');
});
await check('Admin manually submits a draft, rejects it, resubmits it and approves it', async () => {
  const question = await request('/api/v1/questions','POST',{
    subjectId:subject.subjectId,topicId:topic.topicId,questionType:'MCQ_SINGLE',content:'Luồng gửi duyệt thủ công',difficultyLevel:'EASY',approvalStatus:'DRAFT',
    options:[{content:'A',isCorrect:true,orderIndex:0},{content:'B',isCorrect:false,orderIndex:1}],
  });
  assert.equal(question.approvalStatus,'DRAFT');
  const pending = await request(`/api/v1/questions/${question.questionId}/submit-review?comment=${encodeURIComponent('Admin gửi duyệt')}`,'PUT');
  assert.equal(pending.approvalStatus,'PENDING');
  await request(`/api/v1/questions/${question.questionId}/reject`,'PUT',{rejectionReason:'Kiểm tra lại'});
  const resubmitted = await request(`/api/v1/questions/${question.questionId}/submit-review?comment=${encodeURIComponent('Đã kiểm tra lại')}`,'PUT');
  assert.equal(resubmitted.approvalStatus,'PENDING');
  assert.equal(resubmitted.rejectionReason,null);
  const approved = await request(`/api/v1/questions/${question.questionId}/approve`,'PUT');
  assert.equal(approved.approvalStatus,'APPROVED');
});
await mkdir('.tmp-admin-management', { recursive: true });
await writeFile('.tmp-admin-management/api-results.json', JSON.stringify(results, null, 2));
console.log(`${results.length} isolated API scenarios passed.`);
