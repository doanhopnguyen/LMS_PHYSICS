import test from 'node:test';
import assert from 'node:assert/strict';
import { basicSettings, settingsPayload } from '../src/lib/basicSettings.js';

test('only known basic settings are displayed in a stable order', () => {
  const fields = basicSettings([
    { settingKey: 'analytics.cron_expression', settingValue: '0 0 1 * * *' },
    { settingKey: 'exam.max_attempts', settingValue: '3' },
    { settingKey: 'internal.secret', settingValue: 'hidden' },
    { settingKey: 'exam.late_penalty_percent', settingValue: '0' },
  ]);
  assert.deepEqual(fields.map((field) => field.key), ['exam.late_penalty_percent', 'exam.max_attempts']);
  assert.equal(fields[0].value, '0');
  assert.equal(fields[0].max, 100);
  assert.equal(fields[1].min, 1);
  assert.deepEqual(basicSettings([]), []);
});

test('save only includes displayed keys and preserves zero as a string', () => {
  const fields = basicSettings([{ settingKey: 'exam.late_penalty_percent', settingValue: '10' }]);
  assert.deepEqual(settingsPayload(fields, { 'exam.late_penalty_percent': 0, 'analytics.cron_expression': 'changed' }), {
    'exam.late_penalty_percent': '0',
  });
});
