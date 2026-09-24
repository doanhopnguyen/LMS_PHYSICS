import { lecturerUser } from '../data/lecturerData.js';

const STORAGE_KEY = 'ptit-lecturer-participants-v1';
const initialParticipantRecords = [
  { id: 'PART-ASM001-B23DCCN027', activityType: 'ASSESSMENT', assignmentId: 'ASM001', sessionId: 'ASM001-SESSION-01', studentId: 'B23DCCN027', assignmentType: 'CLASS', status: 'ABSENT', assignedAt: '2026-09-22T08:00:00', assignedBy: 'LECTURER001', history: [] },
  { id: 'PART-LABASM001-B23DCCN027', activityType: 'LAB', assignmentId: 'LABASM001', sessionId: 'LABASM001-SESSION-01', studentId: 'B23DCCN027', assignmentType: 'CLASS', status: 'ABSENT', assignedAt: '2026-09-20T08:00:00', assignedBy: 'LECTURER001', history: [] },
];
export const assignmentTypeMeta = {
  CLASS: { label: 'Theo lớp', tone: 'neutral' },
  MANUAL: { label: 'Bổ sung thủ công', tone: 'primary' },
  TRANSFER: { label: 'Chuyển ca', tone: 'warning' },
  MAKEUP: { label: 'Ca bù', tone: 'success' },
};
export const participantStatusMeta = {
  ASSIGNED: { label: 'Đã phân công', tone: 'neutral' },
  STARTED: { label: 'Đã bắt đầu', tone: 'warning' },
  SUBMITTED: { label: 'Đã nộp', tone: 'success' },
  COMPLETED: { label: 'Đã hoàn tất', tone: 'success' },
  ABSENT: { label: 'Vắng ca', tone: 'primary' },
  CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
  TRANSFERRED: { label: 'Đã chuyển ca', tone: 'warning' },
};

export function loadParticipantRecords() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : initialParticipantRecords;
  } catch {
    return initialParticipantRecords;
  }
}

export function getAssignmentSessions(assignment, activityType) {
  const start = assignment.startAt ?? assignment.dueAt;
  const base = start ? new Date(start) : new Date('2026-09-22T08:00:00');
  return [0, 1, 2].map((offset) => {
    const sessionStart = new Date(base);
    sessionStart.setHours(base.getHours() + offset * 3);
    return { id: `${assignment.id}-SESSION-0${offset + 1}`, assignmentId: assignment.id, activityType, name: `Ca ${offset + 1}`, startAt: sessionStart.toISOString().slice(0, 16) };
  });
}

export function saveParticipantRecords(records) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return records;
}

export function getParticipants({ activityType, assignment, students, attempts = [], submissions = [], records }) {
  const primarySessionId = `${assignment.id}-SESSION-01`;
  const storedForAssignment = records.filter((record) => record.activityType === activityType && record.assignmentId === assignment.id);
  const storedIds = new Set(storedForAssignment.map((record) => record.id));
  const base = students
    .filter((student) => assignment.classIds.includes(student.className))
    .map((student) => {
      const attempt = attempts.find((item) => item.studentId === student.id);
      const submission = submissions.find((item) => item.studentId === student.id);
      const status = attempt
        ? ['SUBMITTED', 'LATE'].includes(attempt.status) ? 'SUBMITTED' : 'STARTED'
        : submission
          ? ['SUBMITTED', 'LATE', 'GRADED'].includes(submission.status) ? 'SUBMITTED' : 'STARTED'
          : 'ASSIGNED';
      return {
        id: `PART-${assignment.id}-${student.id}`,
        activityType,
        assignmentId: assignment.id,
        sessionId: primarySessionId,
        studentId: student.id,
        assignmentType: 'CLASS',
        status,
        assignedAt: assignment.startAt,
        assignedBy: 'LECTURER001',
      };
    })
    .filter((record) => !storedIds.has(record.id));
  return [...base, ...storedForAssignment];
}

export function addManualParticipants(records, { activityType, assignmentId, sessionId, studentIds }) {
  const existing = new Set(records.filter((item) => item.assignmentId === assignmentId && item.status !== 'CANCELLED').map((item) => `${item.sessionId}:${item.studentId}`));
  const now = new Date().toISOString();
  const additions = studentIds
    .filter((studentId) => !existing.has(`${sessionId}:${studentId}`))
    .map((studentId) => ({ id: `PART-${assignmentId}-MANUAL-${studentId}-${Date.now()}`, activityType, assignmentId, sessionId, studentId, assignmentType: 'MANUAL', status: 'ASSIGNED', assignedAt: now, assignedBy: 'LECTURER001', history: [{ at: now, action: 'Thêm thủ công', toSessionId: sessionId, reason: 'Bổ sung thủ công', by: lecturerUser.name }] }));
  return { records: saveParticipantRecords([...records, ...additions]), added: additions.length };
}

export function canTransferParticipant(participant, hasActivityData) {
  if (hasActivityData || ['STARTED', 'SUBMITTED', 'COMPLETED'].includes(participant.status)) return { allowed: false, reason: 'Sinh viên đã phát sinh bài làm, báo cáo hoặc kết quả ở ca hiện tại. Không thể chuyển ca trực tiếp.' };
  if (['TRANSFERRED', 'CANCELLED'].includes(participant.status)) return { allowed: false, reason: 'Phân công này không còn hiệu lực.' };
  return { allowed: true, reason: '' };
}

export function transferParticipant(records, participant, targetSessionId, reason) {
  const duplicate = records.some((item) => item.assignmentId === participant.assignmentId && item.studentId === participant.studentId && item.sessionId === targetSessionId && !['CANCELLED', 'TRANSFERRED'].includes(item.status));
  if (duplicate) return { records, error: 'Sinh viên đã có trong ca đích.' };
  const now = new Date().toISOString();
  const oldRecord = { ...participant, status: 'TRANSFERRED', transferredToSessionId: targetSessionId, history: [...(participant.history ?? []), { at: now, action: 'Chuyển ca', fromSessionId: participant.sessionId, toSessionId: targetSessionId, reason, by: lecturerUser.name }] };
  const next = { id: `PART-${participant.assignmentId}-TRANSFER-${participant.studentId}-${Date.now()}`, activityType: participant.activityType, assignmentId: participant.assignmentId, sessionId: targetSessionId, studentId: participant.studentId, assignmentType: 'TRANSFER', status: 'ASSIGNED', transferredFromSessionId: participant.sessionId, reason, assignedAt: now, assignedBy: 'LECTURER001', history: oldRecord.history };
  const withoutCurrent = records.filter((item) => item.id !== participant.id);
  return { records: saveParticipantRecords([...withoutCurrent, oldRecord, next]), participant: next };
}

export function assignMakeupSession(records, participant, targetSessionId, reason) {
  if (participant.status !== 'ABSENT') return { records, error: 'Chỉ có thể bố trí ca bù khi phân công trước được ghi nhận vắng ca.' };
  const duplicate = records.some((item) => item.assignmentId === participant.assignmentId && item.studentId === participant.studentId && item.sessionId === targetSessionId && !['CANCELLED', 'TRANSFERRED'].includes(item.status));
  if (duplicate) return { records, error: 'Sinh viên đã có trong ca bù đã chọn.' };
  const now = new Date().toISOString();
  const next = { id: `PART-${participant.assignmentId}-MAKEUP-${participant.studentId}-${Date.now()}`, activityType: participant.activityType, assignmentId: participant.assignmentId, sessionId: targetSessionId, studentId: participant.studentId, assignmentType: 'MAKEUP', status: 'ASSIGNED', makeupForSessionId: participant.sessionId, reason, assignedAt: now, assignedBy: 'LECTURER001', history: [...(participant.history ?? []), { at: now, action: participant.activityType === 'LAB' ? 'Bố trí thực hành bù' : 'Bố trí thi bù', fromSessionId: participant.sessionId, toSessionId: targetSessionId, reason, by: lecturerUser.name }] };
  return { records: saveParticipantRecords([...records, next]), participant: next };
}

export function getAssignmentHistory(records, studentId) {
  const uniqueEntries = new Map();
  records
    .flatMap((record) => (record.studentId === studentId ? record.history ?? [] : []))
    .forEach((entry) => {
      const key = [entry.at, entry.action, entry.fromSessionId, entry.toSessionId, entry.reason].join('|');
      uniqueEntries.set(key, entry);
    });
  return [...uniqueEntries.values()].sort((a, b) => new Date(b.at) - new Date(a.at));
}
