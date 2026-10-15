export function validateExamTargets(classes, primaryClassId, additionalClassIds = [], subjectId) {
  const primary = classes.find((item) => item.classId === primaryClassId);
  if (!primary) throw new Error('Vui lòng chọn lớp nhận đề.');
  const expectedSubject = subjectId || primary.subjectId;
  const ids = [...new Set([primaryClassId, ...additionalClassIds])];
  const targets = ids.map((id) => classes.find((item) => item.classId === id));
  if (targets.some((item) => !item)) throw new Error('Có lớp nhận đề không thuộc danh sách lớp bạn được quản lý.');
  if ((ids.length > 1 || subjectId) && (!expectedSubject || targets.some((item) => item.subjectId !== expectedSubject)))
    throw new Error('Chỉ có thể giao hoặc sao chép đề cho các lớp cùng môn học.');
  return ids;
}

const rowsOf = (data) => (Array.isArray(data) ? data : data?.content || data?.data || []);
const questionPayloads = (data) =>
  rowsOf(data).map((question, index) => {
    if (!question.questionId) throw new Error('Câu hỏi trong đề nguồn thiếu mã, chưa thể sao chép.');
    return {
      questionId: question.questionId,
      scoreWeight: question.scoreWeight ?? 1,
      orderIndex: question.orderIndex ?? index + 1,
    };
  });

export function prepareExamDistribution(payload, classIds, sourceQuestions) {
  return {
    payload,
    questions: sourceQuestions === undefined ? null : questionPayloads(sourceQuestions),
    targets: classIds.map((classId) => ({ classId, exam: null, complete: false })),
  };
}

// Each class receives its own exam. Checkpoints let a failed distribution resume
// existing drafts instead of creating another exam or adding duplicate questions.
export async function runExamDistribution(job, exams, onProgress = () => {}) {
  const notify = () => onProgress({ ...job, targets: job.targets.map((target) => ({ ...target })) });
  for (const target of job.targets) {
    if (target.complete) continue;
    target.error = '';
    try {
      const firstOriginal = target === job.targets[0] && job.questions === null;
      if (!target.exam) {
        const { matrixId, ...payload } = job.payload;
        const created = await exams.create({
          ...payload,
          classId: target.classId,
          isPublished: false,
          ...(firstOriginal && matrixId ? { matrixId } : {}),
        });
        if (!created?.examId)
          throw new Error('Máy chủ chưa trả về mã đề mới. Kiểm tra danh sách đề trước khi thử lại.');
        target.exam = created;
        notify();
      }
      if (job.questions === null) {
        job.questions = questionPayloads(await exams.questions(target.exam.examId));
        notify();
      }
      const existing = rowsOf(await exams.questions(target.exam.examId));
      const existingIds = new Set(existing.map((question) => question.questionId));
      for (const question of job.questions) {
        if (existingIds.has(question.questionId)) continue;
        await exams.addQuestion(target.exam.examId, question);
        existingIds.add(question.questionId);
      }
      const saved = await exams.update(target.exam.examId, job.payload);
      target.exam = { ...target.exam, ...job.payload, ...saved, classId: target.classId };
      target.complete = true;
      notify();
    } catch (error) {
      target.error = error.message || 'Không thể lưu đề cho lớp này.';
      notify();
      throw error;
    }
  }
  return job.targets.map((target) => target.exam);
}
