import { getDemoSession } from './demoSession.js';
import { formatPercent } from './formatPercent.js';

export const weaknessLabels = {
  NEEDS_PRACTICE: 'Cần củng cố',
  IMPROVING: 'Đang tiến bộ',
  INSUFFICIENT_DATA: 'Chưa đủ dữ liệu',
  GOOD: 'Nắm vững',
};
export const accuracyText = (ratio) =>
  ratio == null || !Number.isFinite(Number(ratio)) ? '—' : formatPercent(Number(ratio) * 100);
export const practiceSessionHref = (id) =>
  `exam_practice_center.html?tab=suggestions&practiceSessionId=${encodeURIComponent(id)}`;
export const practiceHomeHref = (classId) =>
  `exam_practice_center.html?tab=suggestions${classId ? `&recommendClassId=${encodeURIComponent(classId)}` : ''}`;
const storageKey = (classId) => {
  const userId = getDemoSession()?.userId;
  return userId && classId ? `ptit-adaptive-practice:${userId}:${classId}` : null;
};
export function savedPractice(classId) {
  try {
    const key = storageKey(classId);
    const value = key && JSON.parse(localStorage.getItem(key));
    return typeof value?.sessionId === 'string' ? value : null;
  } catch {
    return null;
  }
}
export function rememberPractice(session) {
  try {
    const key = storageKey(session.classId);
    if (key && session.sessionId)
      localStorage.setItem(key, JSON.stringify({ sessionId: session.sessionId, status: session.status }));
  } catch {
    /* Resuming by URL remains available when storage is disabled. */
  }
}
