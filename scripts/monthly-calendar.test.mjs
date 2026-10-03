import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calendarDays,
  normalizeCalendarEvent,
  eventsForDay,
  calendarStatus,
  examCalendarEvent,
} from '../src/lib/monthlyCalendar.js';
import { dateKey } from '../src/lib/datePicker.js';

test('monthly grid keeps Monday start, outside days and five or six equal weeks', () => {
  for (let month = 0; month < 12; month++) {
    const days = calendarDays(new Date(2026, month, 1));
    assert.ok([35, 42].includes(days.length));
    assert.equal(days[0].getDay(), 1);
    assert.equal(days.at(-1).getDay(), 0);
    assert.equal(days.filter((day) => day.getMonth() === month).length, new Date(2026, month + 1, 0).getDate());
  }
  assert.equal(dateKey(calendarDays(new Date(2026, 9, 1))[0]), '2026-09-28');
});
test('events span local dates, stop at midnight and retain exact minutes', () => {
  const event = normalizeCalendarEvent({ id: 'one', date: '2026-10-03', startTime: '08:15', endTime: '10:45' });
  assert.equal(event.start.getMinutes(), 15);
  assert.equal(eventsForDay([event], new Date(2026, 9, 3)).length, 1);
  const overnight = normalizeCalendarEvent({
    id: 'night',
    start: new Date(2026, 9, 3, 23),
    end: new Date(2026, 9, 5, 0),
  });
  assert.equal(eventsForDay([overnight], new Date(2026, 9, 4)).length, 1);
  assert.equal(eventsForDay([overnight], new Date(2026, 9, 5)).length, 0);
  const allDay = normalizeCalendarEvent({ id: 'all', date: '2026-10-03' });
  assert.equal(allDay.allDay, true);
  assert.equal(calendarStatus(allDay), null);
  assert.equal(normalizeCalendarEvent({ date: 'broken' }), null);
});
test('status uses event timing and keeps draft/cancelled; backend adapter preserves role scope', () => {
  const exam = {
    examId: 'exam',
    title: 'Quiz',
    startTime: '2026-10-03T08:15:00',
    durationMinutes: 45,
    examType: 'QUIZ',
  };
  const row = { classId: 'class/one', className: 'Physics' };
  const event = examCalendarEvent(exam, row, 'STUDENT');
  assert.equal(event.end - event.start, 45 * 60000);
  assert.equal(calendarStatus(event, new Date(2026, 9, 3, 7)), 'UPCOMING');
  assert.equal(calendarStatus(event, new Date(2026, 9, 3, 8, 30)), 'ONGOING');
  assert.equal(calendarStatus(event, new Date(2026, 9, 3, 9)), 'COMPLETED');
  assert.equal(calendarStatus({ ...event, status: 'CANCELLED' }), 'CANCELLED');
  assert.equal(examCalendarEvent({ ...exam, isPublished: false }, row, 'INSTRUCTOR').status, 'DRAFT');
  assert.ok(event.href.startsWith('exam_practice_center.html?classId=class%2Fone'));
  assert.equal(examCalendarEvent({ title: 'Unscheduled' }, row, 'STUDENT'), null);
});
