const finiteScore = (value) =>
  value === null || value === undefined || String(value).trim() === ''
    ? null
    : Number.isFinite(Number(value))
      ? Number(value)
      : null;
export const roundScore = (value) =>
  Math.round((Number(value) + Number.EPSILON * Math.max(1, Math.abs(Number(value)))) * 100) / 100;
export function examMaxScore(questions) {
  if (!Array.isArray(questions) || !questions.length) return null;
  let total = 0;
  for (const question of questions) {
    const weight = question.scoreWeight == null ? 1 : finiteScore(question.scoreWeight);
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
  return attempt?.status === 'GRADED' ? tenPointScore(attempt.totalScore, examMaxScore(questions)) : null;
}
export function formatAttemptScore(attempt, questions = attempt?.questions) {
  if (attempt?.status !== 'GRADED' || finiteScore(attempt.totalScore) === null) return 'Chưa chấm';
  const score = attemptScore(attempt, questions);
  return score === null
    ? 'Chưa xác định thang điểm'
    : `${score.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}/10`;
}
