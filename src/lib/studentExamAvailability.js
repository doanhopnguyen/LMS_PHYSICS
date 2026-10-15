export const isFinishedAttempt = (attempt) =>
  Boolean(attempt?.submittedAt) || ['SUBMITTED', 'GRADED', 'COMPLETED'].includes(attempt?.status);

export function studentExamAvailability(exam, now = Date.now()) {
  const policy = exam.policy;
  const attempts = exam.attempts || [];
  const activeAttempt =
    attempts.find((attempt) => attempt.attemptId && !isFinishedAttempt(attempt)) ||
    (policy?.hasInProgressAttempt && policy.inProgressAttemptId ? { attemptId: policy.inProgressAttemptId } : null);
  const completed = attempts.some(isFinishedAttempt);
  const statusLabel = activeAttempt
    ? 'Đang làm'
    : completed
      ? 'Đã làm'
      : exam.attempts === null
        ? 'Chưa tải được trạng thái'
        : 'Chưa làm';
  const tone = activeAttempt ? 'warning' : completed ? 'success' : 'neutral';
  const blocked = (actionLabel, reason) => ({ activeAttempt, statusLabel, tone, canOpen: false, actionLabel, reason });

  if (exam.isPublished === false) return blocked('Chưa mở đề', 'Đề chưa được công bố.');
  if (policy?.ended || policy?.isEnded || Date.parse(policy?.endTime || exam.endTime) <= now)
    return blocked('Đã hết thời gian', 'Đã hết thời gian làm đề.');
  if (Date.parse(policy?.startTime || exam.startTime) > now)
    return { ...blocked('Chưa đến giờ làm', 'Đề chưa đến thời gian mở.'), canWait: true };
  if (activeAttempt)
    return { activeAttempt, statusLabel, tone, canOpen: true, actionLabel: 'Tiếp tục làm bài', reason: '' };
  if (!(Number(exam.totalQuestions) > 0)) return blocked('Chưa thể làm đề', 'Đề chưa có câu hỏi.');
  if (!policy || exam.attempts === null)
    return blocked('Chưa thể làm đề', 'Chưa xác định được quyền làm bài. Vui lòng tải lại danh sách.');

  const remaining =
    policy.remainingAttempts ??
    (policy.maxAttempts != null && policy.usedAttempts != null
      ? Number(policy.maxAttempts) - Number(policy.usedAttempts)
      : null);
  if (remaining !== null && Number(remaining) <= 0)
    return blocked('Đã hết lượt làm', 'Bạn đã sử dụng hết số lượt làm bài cho đề này.');
  if ((policy.canStartAttempt ?? policy.canStart) !== true)
    return blocked('Chưa được phép làm', policy.reason || 'Hiện bạn chưa được phép bắt đầu lượt làm bài mới.');

  return {
    activeAttempt,
    statusLabel,
    tone,
    canOpen: true,
    actionLabel: completed ? 'Làm lại đề' : 'Bắt đầu làm bài',
    reason: '',
  };
}
