import { dateKey, parseDate } from './datePicker.js';

export function calendarDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const length = Math.max(35, Math.ceil((offset + count) / 7) * 7);
  return Array.from({ length }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1));
}
export function normalizeCalendarEvent(event) {
  const date = parseDate(event.date);
  const startValue = event.start || (date && event.startTime ? `${dateKey(date)}T${event.startTime}` : event.date);
  const start =
    startValue instanceof Date
      ? new Date(startValue)
      : date && !event.startTime && !event.start
        ? date
        : new Date(startValue);
  if (Number.isNaN(start.getTime())) return null;
  const endValue = event.end || (date && event.endTime ? `${dateKey(date)}T${event.endTime}` : null);
  const end = endValue ? new Date(endValue) : null;
  return {
    ...event,
    start,
    end: end && !Number.isNaN(end.getTime()) && end > start ? end : null,
    allDay: event.allDay ?? (!event.start && !event.startTime),
  };
}
export function eventsForDay(events, day) {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  return events
    .filter((event) => event.start < end && (event.end ? event.end > start : dateKey(event.start) === dateKey(day)))
    .sort((a, b) => a.start - b.start || String(a.id).localeCompare(String(b.id)));
}
export function calendarStatus(event, now = new Date()) {
  if (event.status === 'CANCELLED' || event.status === 'DRAFT') return event.status;
  if (['UPCOMING', 'ONGOING', 'COMPLETED'].includes(event.status)) return event.status;
  if (event.allDay) return null;
  return event.start > now ? 'UPCOMING' : event.end && event.end <= now ? 'COMPLETED' : event.end ? 'ONGOING' : null;
}
export function examCalendarEvent(exam, classItem, role) {
  const start = new Date(exam.startTime || exam.startAt);
  if (Number.isNaN(start.getTime())) return null;
  const suppliedEnd = new Date(exam.endTime || exam.endAt);
  const end =
    !Number.isNaN(suppliedEnd.getTime()) && suppliedEnd > start
      ? suppliedEnd
      : new Date(start.getTime() + (Number(exam.durationMinutes) || 60) * 60000);
  const page = {
    STUDENT: 'exam_practice_center.html',
    INSTRUCTOR: 'lecturer_assessments.html',
    TA: 'ta_class_support.html',
    ADMIN: 'admin_academics.html',
  }[role];
  return {
    id: `${classItem.classId}-${exam.examId || start.toISOString() + exam.title}`,
    title: exam.title || exam.examName || 'Kỳ thi',
    type: 'EXAM',
    status: exam.isPublished === false ? 'DRAFT' : undefined,
    start,
    end,
    allDay: false,
    className: classItem.className || classItem.classCode,
    subjectName: classItem.subjectName || classItem.subjectCode,
    examType: exam.examType,
    durationMinutes: exam.durationMinutes,
    totalQuestions: exam.totalQuestions,
    href: page ? `${page}?classId=${encodeURIComponent(classItem.classId)}` : undefined,
    detailLabel: 'Mở trang kỳ thi',
  };
}
