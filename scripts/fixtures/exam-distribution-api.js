localStorage.setItem('ptit-physics-demo-session', JSON.stringify({ role: 'INSTRUCTOR', userId: 'teacher' }));
localStorage.setItem('ptit-physics-access-token', 'isolated-test-token');
window.testCalls = [];
window.testClasses = [
  {
    classId: 'c1',
    classCode: 'PHY-01',
    subjectId: 's1',
    subjectName: 'Vật lý 1',
    instructorId: 'teacher',
    semesterId: 'sem1',
    status: 'ACTIVE',
  },
  {
    classId: 'c2',
    classCode: 'PHY-02',
    subjectId: 's1',
    subjectName: 'Vật lý 1',
    instructorId: 'teacher',
    semesterId: 'sem1',
    status: 'ACTIVE',
  },
  {
    classId: 'c3',
    classCode: 'MATH-01',
    subjectId: 's2',
    subjectName: 'Toán',
    instructorId: 'teacher',
    semesterId: 'sem1',
    status: 'ACTIVE',
  },
];
const sourceQuestions = [
  {
    questionId: 'q1',
    content: 'Câu hỏi thứ nhất',
    scoreWeight: 2,
    orderIndex: 2,
    approvalStatus: 'APPROVED',
    questionType: 'MCQ_SINGLE',
  },
  {
    questionId: 'q2',
    content: 'Câu hỏi thứ hai',
    scoreWeight: 3,
    orderIndex: 1,
    approvalStatus: 'APPROVED',
    questionType: 'MCQ_SINGLE',
  },
];
window.testExams = [
  {
    examId: 'source',
    classId: 'c1',
    title: 'Đề nguồn',
    examType: 'QUIZ',
    durationMinutes: 30,
    maxAttempts: 2,
    matrixId: 'matrix1',
    isPublished: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    totalQuestions: 2,
    startTime: new Date(Date.now() + 3600000).toISOString(),
    endTime: new Date(Date.now() + 7200000).toISOString(),
  },
];
window.testQuestions = { source: structuredClone(sourceQuestions) };
window.testBankQuestions = [
  ...sourceQuestions,
  {
    questionId: 'q3',
    content: 'Câu hỏi cần xác nhận trước khi thêm',
    scoreWeight: 1,
    approvalStatus: 'APPROVED',
    difficultyLevel: 'EASY',
    questionType: 'MCQ_SINGLE',
  },
];
window.testOriginal = JSON.stringify(testExams[0]);
window.failQuestionClass = null;
window.failSourceRead = false;
let nextExam = 0;
window.fetch = async (input, options = {}) => {
  const url = new URL(input, location.origin),
    path = url.pathname,
    method = options.method || 'GET';
  const body = typeof options.body === 'string' ? JSON.parse(options.body) : null;
  testCalls.push({ path, method, body });
  if (path === '/api/v1/instructor/classes' && location.search.includes('classCatalogError=true'))
    return Response.json({ message: 'Không tải được danh sách lớp' }, { status: 503 });
  let data = [];
  const paged = (rows) => ({ content: rows, totalElements: rows.length, totalPages: 1, last: true });
  if (path === '/api/v1/users/me') data = { userId: 'teacher', role: 'INSTRUCTOR', fullName: 'Giảng viên' };
  if (path === '/api/v1/instructor/classes' || path === '/api/v1/classes') data = paged(testClasses);
  if (
    (path.startsWith('/api/v1/classes/') || path.startsWith('/api/v1/instructor/classes/')) &&
    testClasses.some((item) => path.endsWith('/' + item.classId))
  )
    data = testClasses.find((item) => path.endsWith('/' + item.classId));
  if (path === '/api/v1/subjects')
    data = paged([
      { subjectId: 's1', subjectName: 'Vật lý 1' },
      { subjectId: 's2', subjectName: 'Toán' },
    ]);
  if (path === '/api/v1/semesters')
    data = [{ semesterId: 'sem1', semesterName: 'Học kỳ 1', academicYear: '2026', isCurrent: true }];
  if (path === '/api/v1/exam-matrices') data = [{ matrixId: 'matrix1', matrixName: 'Ma trận Vật lý', subjectId: 's1' }];
  if (path.startsWith('/api/v1/exams/class/'))
    data = testExams.filter((item) => item.classId === path.split('/').at(-1));
  if (path === '/api/v1/exams' && method === 'POST') {
    data = { ...body, examId: `new-${++nextExam}`, totalQuestions: body.matrixId ? sourceQuestions.length : 0 };
    testExams.push(data);
    testQuestions[data.examId] = body.matrixId ? structuredClone(sourceQuestions) : [];
  }
  const segments = path.split('/');
  const match =
    segments[1] === 'api' && segments[2] === 'v1' && segments[3] === 'exams' && segments.length <= 6
      ? [null, segments[4], segments[5]]
      : null;
  if (match) {
    const id = match[1],
      part = match[2],
      exam = testExams.find((item) => item.examId === id);
    if (exam) {
      if (id === 'source' && window.failSourceRead && part === 'questions')
        return Response.json({ message: 'Không thể tải câu hỏi nguồn' }, { status: 503 });
      if (!part) {
        if (method === 'PUT' && window.testFailSave)
          return Response.json({ message: 'Không thể lưu lịch thi thử nghiệm' }, { status: 503 });
        if (method === 'PUT') Object.assign(exam, body);
        data = exam;
        if (method === 'GET' && location.search.includes('missingClass=true')) {
          const { classId, ...details } = exam;
          data = details;
        }
      }
      if (part === 'questions') {
        if (method === 'POST') {
          if (window.testFailAdd)
            return Response.json({ message: 'Không thể thêm câu hỏi thử nghiệm' }, { status: 503 });
          if (window.failQuestionClass === exam.classId && body.questionId === 'q2') {
            window.failQuestionClass = null;
            return Response.json({ message: 'Lỗi thử nghiệm khi sao chép câu hỏi' }, { status: 503 });
          }
          if (testQuestions[id].some((question) => question.questionId === body.questionId))
            return Response.json({ message: 'Câu hỏi bị trùng' }, { status: 409 });
          testQuestions[id].push({
            ...body,
            content: sourceQuestions.find((question) => question.questionId === body.questionId)?.content,
          });
          exam.totalQuestions = testQuestions[id].length;
        }
        data = testQuestions[id];
      }
      if (part === 'attempts') {
        if (window.testHoldAttempts) await new Promise((resolve) => { window.finishAttemptCheck = resolve; });
        if (window.testFailAttempts) return Response.json({ message: 'Attempt list unavailable' }, { status: 503 });
        data = id === 'source' && window.testSourceHasAttempts ? [{ attemptId: 'taken', status: 'SUBMITTED' }] : [];
      }
      if (part === 'roster') data = { officialStudents: [], transferredStudents: [] };
      if (part === 'generate-questions' && method === 'POST') data = sourceQuestions.length;
    }
  }
  if (path === '/api/v1/questions') data = paged(testBankQuestions);
  if (path === '/api/v1/questions' && location.search.includes('largeBank=true')) {
    data = paged([...testBankQuestions, ...Array.from({ length: 18 }, (_, index) => ({
      questionId: `bank-${index}`, content: `Bank question ${index + 1}`, approvalStatus: 'APPROVED', difficultyLevel: 'MEDIUM', questionType: 'MCQ_SINGLE',
    }))]);
  }
  if (/^\/api\/v1\/questions\/[^/]+$/.test(path)) {
    const question = testBankQuestions.find((item) => item.questionId === path.split('/').at(-1));
    data = question ? {
      ...question,
      subjectId: 's1',
      questionType: question.questionId === 'q3' ? 'SHORT_ANSWER' : 'MCQ_SINGLE',
      options: question.questionId === 'q3' ? [] : [
        { optionId: 'a', content: 'Correct option from API', isCorrect: true, explanation: 'Option explanation from API' },
        { optionId: 'b', content: 'Incorrect option from API', isCorrect: false },
      ],
      acceptedAnswers: question.questionId === 'q3' ? ['9.8', '9,8'] : [],
      explanation: 'Question explanation from API',
    } : null;
  }
  return Response.json({ status: 200, data });
};
