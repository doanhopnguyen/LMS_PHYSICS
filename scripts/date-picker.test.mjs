import test from 'node:test';
import assert from 'node:assert/strict';
import { dateKey, parseDate, monthDays, dateDisabled, displayTemporal } from '../src/lib/datePicker.js';

test('calendar keeps local dates, Monday alignment and leap days', () => {
  assert.equal(dateKey(parseDate('2026-10-03')), '2026-10-03');
  assert.equal(parseDate('2026-02-29'), null);
  assert.equal(dateKey(parseDate('2024-02-29')), '2024-02-29');
  const days = monthDays(new Date(2026, 9, 1));
  assert.deepEqual(days.slice(0, 3), [null, null, null]);
  assert.equal(dateKey(days[3]), '2026-10-01');
  assert.equal(days.filter(Boolean).length, 31);
  assert.equal(days.length % 7, 0);
});

test('bounds and disabled dates accept local dates and predicates', () => {
  const day = parseDate('2026-10-03');
  assert.equal(dateDisabled(day, '2026-10-03', '2026-10-03'), false);
  assert.equal(dateDisabled(day, '2026-10-04'), true);
  assert.equal(dateDisabled(day, undefined, '2026-10-02'), true);
  assert.equal(dateDisabled(day, undefined, undefined, ['2026-10-03']), true);
  assert.equal(dateDisabled(day, undefined, undefined, [new Date(2026, 9, 3)]), true);
  assert.equal(
    dateDisabled(day, undefined, undefined, (date) => date.getDay() === 6),
    true
  );
});

test('friendly display preserves date/time values without UTC conversion', () => {
  assert.equal(displayTemporal('2026-10-03', 'date'), '03/10/2026');
  assert.equal(displayTemporal('2026-10-03T08:45', 'datetime-local'), '03/10/2026 · 08:45');
  assert.equal(displayTemporal('08:45', 'time'), '08:45');
  assert.equal(displayTemporal('2026-10', 'month'), 'Tháng 10, 2026');
  assert.equal(displayTemporal('', 'date'), '');
});
