const finiteScore = (value) =>
  value === null || value === undefined || String(value).trim() === ''
    ? null
    : Number.isFinite(Number(value))
      ? Number(value)
      : null;
export const roundScore = (value) =>
  Math.round((Number(value) + Number.EPSILON * Math.max(1, Math.abs(Number(value)))) * 100) / 100;
export const questionWeight = (question) => (question?.scoreWeight == null ? 1 : finiteScore(question.scoreWeight));
export function examMaxScore(questions, expectedCount) {
  if (!Array.isArray(questions) || !questions.length) return null;
  if (expectedCount != null && Number(expectedCount) > 0 && questions.length !== Number(expectedCount)) return null;
  let total = 0;
  for (const question of questions) {
    const weight = questionWeight(question);
    if (weight === null || weight < 0) return null;
    total += weight;
  }
  return total > 0 ? Number(total.toFixed(8)) : null;
}
export function tenPointScore(rawScore, maxScore) {
  const score = finiteScore(rawScore);
  if (score === null || !Number.isFinite(maxScore) || maxScore <= 0 || score < 0 || score > maxScore + 0.000001)
    return null;
  return roundScore((score / maxScore) * 10);
}
export function rawScoreFromTen(value, maxScore) {
  const score = finiteScore(value);
  if (score === null || score < 0 || score > 10) throw new Error('Điểm phải là số từ 0 đến 10.');
  if (!Number.isFinite(maxScore) || maxScore <= 0) throw new Error('Chưa xác định được tổng trọng số của đề.');
  return Math.min(maxScore, roundScore((score * maxScore) / 10));
}
export function attemptScore(attempt, questions = attempt?.questions) {
  if (attempt && Object.hasOwn(attempt, 'scoreOnTen')) {
    const score = finiteScore(attempt.scoreOnTen);
    return attempt.status === 'GRADED' && score !== null && score >= 0 && score <= 10 ? score : null;
  }
  return attempt?.status === 'GRADED' ? tenPointScore(attempt.totalScore, attemptMaxScore(attempt, questions)) : null;
}
export function attemptMaxScore(attempt, questions) {
  if (attempt && Object.hasOwn(attempt, 'maxScore')) return finiteScore(attempt.maxScore);
  const snapshot = attempt?.questions?.length ? attempt.questions : questions;
  return examMaxScore(snapshot, attempt?.totalQuestions);
}
export function examScoringSummary(exam, questions) {
  const maxScore = examMaxScore(questions);
  const equal =
    questions?.length > 0 && questions.every((question) => questionWeight(question) === questionWeight(questions[0]));
  const matrix = Boolean(exam?.matrixId);
  return {
    maxScore,
    label: matrix ? 'Điểm theo ma trận' : equal ? 'Chia đều điểm' : 'Điểm theo trọng số',
    description: matrix
      ? 'Điểm từng câu dùng trọng số đã lưu trong đề từ ma trận; kết quả cuối cùng quy đổi về thang 10.'
      : equal
        ? `Đề không có ma trận: ${questions.length} câu được chia đều trên thang 10.`
        : 'Đề không có ma trận: tính theo trọng số riêng đã lưu cho từng câu và quy đổi về thang 10.',
  };
}
export function formatAttemptScore(attempt, questions = attempt?.questions) {
  if (attempt?.status !== 'GRADED' || finiteScore(attempt.totalScore) === null) return 'Chưa chấm';
  const score = attemptScore(attempt, questions);
  return score === null
    ? 'Chưa xác định thang điểm'
    : `${score.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}/10`;
}
