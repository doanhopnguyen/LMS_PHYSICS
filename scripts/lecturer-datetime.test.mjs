import test from 'node:test';
import assert from 'node:assert/strict';
import { localDateTimeInput } from '../src/lib/lecturerUtils.js';

test('Editing an exam converts UTC to Vietnam local input and round-trips without shifting the schedule', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'Asia/Ho_Chi_Minh';
  try {
    const value = localDateTimeInput('2026-10-19T01:30:00Z');
    assert.equal(value, '2026-10-19T08:30');
    assert.equal(new Date(value).toISOString(), '2026-10-19T01:30:00.000Z');
    assert.equal(localDateTimeInput('invalid'), '');
    assert.equal(localDateTimeInput(null), '');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
