import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLogValue } from '../src/lib/logValues.js';

test('formats structured audit values as readable JSON text', () => {
  const value = { subjectName: 'Vật lý', isActive: false, nested: { count: 0 } };
  assert.equal(formatLogValue(value), JSON.stringify(value, null, 2));
  assert.equal(formatLogValue(JSON.stringify(value)), JSON.stringify(value, null, 2));
  assert.equal(formatLogValue([1, { name: 'Chủ đề' }]), '[\n  1,\n  {\n    "name": "Chủ đề"\n  }\n]');
});

test('preserves false, zero and plain strings', () => {
  assert.equal(formatLogValue(false), 'false');
  assert.equal(formatLogValue(0), '0');
  assert.equal(formatLogValue('Nội dung nhật ký'), 'Nội dung nhật ký');
});

test('handles missing old and new values', () => {
  for (const value of [null, undefined, '']) assert.equal(formatLogValue(value, 'Không có dữ liệu.'), 'Không có dữ liệu.');
});
