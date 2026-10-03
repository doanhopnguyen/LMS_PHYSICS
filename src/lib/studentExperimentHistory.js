export const historyRows = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);

export function submissionGrade(submission, summary) {
  const data = summary || submission;
  const rubrics = data?.rubrics || [];
  const graded = rubrics.filter((row) => row.isGraded && row.score != null).length;
  const confirmed =
    data?.status === 'CONFIRMED' || submission?.status === 'CONFIRMED' || submission?.isConfirmed === true;
  const hasGrade = confirmed || (rubrics.length ? graded > 0 : data?.status === 'GRADED');
  const score = hasGrade ? data?.totalScore : null;
  return {
    score: score ?? null,
    maxScore: data?.totalMaxScore ?? null,
    label: confirmed ? 'Đã chốt điểm' : hasGrade ? 'Điểm tạm tính' : 'Chờ chấm',
    tone: confirmed ? 'success' : hasGrade ? 'primary' : 'warning',
    graded,
    total: rubrics.length,
  };
}

export async function loadStudentExperimentHistory(api, { assignmentId, recentSubmission } = {}) {
  // ExperimentServiceImpl.getSubmissions forces studentId to the authenticated
  // student on the server. No client-side student ID or teacher filters required.
  const submissions = await api.experiments.submissions(assignmentId ? { assignmentId } : {});
  const refs = [
    ...new Map(
      [...historyRows(submissions), ...(recentSubmission?.submissionId ? [recentSubmission] : [])]
        .filter((row) => row.submissionId)
        .map((row) => [String(row.submissionId), row])
    ).values(),
  ];
  const rows = await Promise.all(
    refs.map(async (reference) => {
      // A failed grade request must not hide a successfully loaded report.
      const [detail, summary] = await Promise.allSettled([
        api.experiments.getSubmission(reference.submissionId),
        api.experiments.rubricSummary(reference.submissionId),
      ]);
      const submission = { ...reference, ...(detail.status === 'fulfilled' ? detail.value : {}) };
      return {
        ...submission,
        summary: summary.status === 'fulfilled' ? summary.value : null,
        detailError: detail.status === 'rejected' ? detail.reason?.message || 'Không thể tải báo cáo.' : '',
        scoreError: summary.status === 'rejected' ? summary.reason?.message || 'Không thể tải điểm.' : '',
      };
    })
  );
  return rows.sort(
    (a, b) => (Date.parse(b.submittedAt || b.recordedAt) || 0) - (Date.parse(a.submittedAt || a.recordedAt) || 0)
  );
}
