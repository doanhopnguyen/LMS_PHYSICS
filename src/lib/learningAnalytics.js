import { answersAreEqual } from '../data/lecturerData.js';

export function getAnalyticsRange(range, customStart, customEnd) {
  const end = range === 'CUSTOM' && customEnd ? new Date(`${customEnd}T23:59:59`) : new Date('2026-09-22T23:59:59');
  const start =
    range === '7D'
      ? new Date('2026-09-16T00:00:00')
      : range === '30D'
        ? new Date('2026-08-24T00:00:00')
        : range === 'SEMESTER'
          ? new Date('2026-08-01T00:00:00')
          : customStart
            ? new Date(`${customStart}T00:00:00`)
            : null;
  return { start, end };
}

export function inAnalyticsRange(value, range) {
  if (!value) return false;
  const date = new Date(value);
  return (!range.start || date >= range.start) && (!range.end || date <= range.end);
}

export function isQuestionAnswerCorrect(question, answer) {
  const correctIds = question.answers.filter((item) => item.correct).map((item) => item.id);
  return answersAreEqual(answer?.selectedAnswerIds ?? [], correctIds);
}

export function getAssessmentPerformance({ assessments, attempts, students, classId, chapterId, range }) {
  const studentIds = new Set(
    students.filter((student) => classId === 'ALL' || student.className === classId).map((student) => student.id)
  );
  const scopedAssessments = assessments.filter(
    (assessment) =>
      (classId === 'ALL' || assessment.classIds.includes(classId)) &&
      (chapterId === 'ALL' || assessment.chapters.includes(chapterId)) &&
      (inAnalyticsRange(assessment.endAt, range) || inAnalyticsRange(assessment.startAt, range))
  );
  const assessmentIds = new Set(scopedAssessments.map((item) => item.id));
  const validAttempts = attempts.filter(
    (attempt) =>
      assessmentIds.has(attempt.assessmentId) &&
      studentIds.has(attempt.studentId) &&
      ['SUBMITTED', 'LATE'].includes(attempt.status) &&
      inAnalyticsRange(attempt.submittedAt, range)
  );
  const normalizedScores = validAttempts
    .map((attempt) => {
      const assessment = scopedAssessments.find((item) => item.id === attempt.assessmentId);
      const score = attempt.adjustedScore ?? attempt.autoScore;
      return assessment?.totalScore && score !== null ? (score / assessment.totalScore) * 10 : null;
    })
    .filter((value) => value !== null);
  const opportunities = scopedAssessments.reduce(
    (sum, assessment) =>
      sum +
      students.filter(
        (student) =>
          assessment.classIds.includes(student.className) && (classId === 'ALL' || student.className === classId)
      ).length,
    0
  );
  return {
    assessments: scopedAssessments,
    attempts: validAttempts,
    total: scopedAssessments.length,
    closed: scopedAssessments.filter((item) => item.status === 'CLOSED').length,
    submitted: validAttempts.length,
    average: normalizedScores.length
      ? normalizedScores.reduce((sum, value) => sum + value, 0) / normalizedScores.length
      : null,
    highest: normalizedScores.length ? Math.max(...normalizedScores) : null,
    lowest: normalizedScores.length ? Math.min(...normalizedScores) : null,
    completionRate: opportunities ? (validAttempts.length / opportunities) * 100 : null,
    normalizedScores,
  };
}

export function getChapterPerformance({ attempts, assessments, questions, chapterLabels }) {
  return Object.keys(chapterLabels)
    .map((chapterId) => {
      let answered = 0;
      let correct = 0;
      let totalScore = 0;
      let scoreCount = 0;
      attempts.forEach((attempt) => {
        const assessment = assessments.find((item) => item.id === attempt.assessmentId);
        if (!assessment) return;
        attempt.answers.forEach((answer) => {
          const question = questions.find((item) => item.id === answer.questionId);
          if (!question || question.chapterId !== chapterId) return;
          answered += 1;
          if (isQuestionAnswerCorrect(question, answer)) correct += 1;
        });
        if (assessment.chapters.includes(chapterId)) {
          const score = attempt.adjustedScore ?? attempt.autoScore;
          if (score !== null) {
            totalScore += (score / assessment.totalScore) * 10;
            scoreCount += 1;
          }
        }
      });
      return {
        id: chapterId,
        answered,
        correct,
        incorrect: answered - correct,
        rate: answered ? (correct / answered) * 100 : null,
        average: scoreCount ? totalScore / scoreCount : null,
      };
    })
    .filter((item) => item.answered > 0);
}

export function getCLOPerformance({ attempts, questions }) {
  const clos = [...new Set(questions.map((question) => question.clo).filter(Boolean))];
  return clos.map((clo) => {
    const mappedQuestions = questions.filter((question) => question.clo === clo);
    let answers = 0;
    let correct = 0;
    attempts.forEach((attempt) =>
      attempt.answers.forEach((answer) => {
        const question = mappedQuestions.find((item) => item.id === answer.questionId);
        if (!question) return;
        answers += 1;
        if (isQuestionAnswerCorrect(question, answer)) correct += 1;
      })
    );
    return {
      id: clo,
      questionCount: mappedQuestions.length,
      answers,
      correct,
      rate: answers ? (correct / answers) * 100 : null,
      earned: correct,
      possible: answers,
    };
  });
}

export function getLabPerformance({
  labs,
  assignments,
  submissions,
  gradings,
  students,
  classId,
  chapterId,
  range,
  labMetadata,
}) {
  return labs.map((lab, index) => {
    const labId = `LAB${String(index + 1).padStart(3, '0')}`;
    const metadata = labMetadata[labId];
    const labChapter = metadata?.chapter?.match(/Chương (\d+)/)?.[1];
    const scopedAssignments = assignments.filter(
      (assignment) =>
        assignment.labId === labId &&
        (classId === 'ALL' || assignment.classIds.includes(classId)) &&
        (chapterId === 'ALL' || chapterId === `CH${labChapter}`) &&
        (inAnalyticsRange(assignment.dueAt, range) || inAnalyticsRange(assignment.startAt, range))
    );
    const ids = new Set(scopedAssignments.map((item) => item.id));
    const scopedSubmissions = submissions.filter(
      (submission) =>
        ids.has(submission.assignmentId) &&
        ['SUBMITTED', 'LATE'].includes(submission.status) &&
        inAnalyticsRange(submission.submittedAt, range) &&
        students.some(
          (student) => student.id === submission.studentId && (classId === 'ALL' || student.className === classId)
        )
    );
    const assigned = scopedAssignments.reduce(
      (sum, assignment) =>
        sum +
        students.filter(
          (student) =>
            assignment.classIds.includes(student.className) && (classId === 'ALL' || student.className === classId)
        ).length,
      0
    );
    const confirmed = gradings.filter(
      (grading) =>
        scopedSubmissions.some((submission) => submission.id === grading.submissionId) &&
        ['CONFIRMED', 'PUBLISHED'].includes(grading.status)
    );
    const scores = confirmed.map((grading) => grading.totalScore).filter((score) => score !== null);
    const pending = scopedSubmissions.filter(
      (submission) =>
        !['CONFIRMED', 'PUBLISHED'].includes(gradings.find((grading) => grading.submissionId === submission.id)?.status)
    ).length;
    return {
      id: labId,
      title: lab.title,
      assignmentIds: scopedAssignments.map((item) => item.id),
      assigned,
      submitted: scopedSubmissions.length,
      pending,
      confirmed: confirmed.length,
      average: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
    };
  });
}

export function getStudentLearningSummary({
  students,
  assessments,
  attempts,
  labAssignments,
  labSubmissions,
  gradings,
}) {
  return students.map((student) => {
    const studentAttempts = attempts.filter(
      (attempt) => attempt.studentId === student.id && ['SUBMITTED', 'LATE'].includes(attempt.status)
    );
    const examScores = studentAttempts
      .map((attempt) => {
        const assessment = assessments.find((item) => item.id === attempt.assessmentId);
        const score = attempt.adjustedScore ?? attempt.autoScore;
        return assessment?.totalScore && score !== null ? (score / assessment.totalScore) * 10 : null;
      })
      .filter((score) => score !== null);
    const assignedLabs = labAssignments.filter((assignment) => assignment.classIds.includes(student.className));
    const submissions = labSubmissions.filter(
      (submission) => submission.studentId === student.id && ['SUBMITTED', 'LATE'].includes(submission.status)
    );
    const confirmedScores = submissions
      .map((submission) => gradings.find((grading) => grading.submissionId === submission.id))
      .filter((grading) => ['CONFIRMED', 'PUBLISHED'].includes(grading?.status) && grading.totalScore !== null)
      .map((grading) => grading.totalScore);
    return {
      ...student,
      examCompleted: studentAttempts.length,
      examAssigned: assessments.filter((assessment) => assessment.classIds.includes(student.className)).length,
      examAverage: examScores.length ? examScores.reduce((sum, score) => sum + score, 0) / examScores.length : null,
      labCompleted: submissions.length,
      labAssigned: assignedLabs.length,
      labAverage: confirmedScores.length
        ? confirmedScores.reduce((sum, score) => sum + score, 0) / confirmedScores.length
        : null,
    };
  });
}
