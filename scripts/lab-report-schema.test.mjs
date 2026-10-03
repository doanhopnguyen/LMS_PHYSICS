import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLabReport, emptyLabTrial, getLabReportSchema, labReportSchemas } from '../src/lib/labReportSchema.js';

const filledRows = (schema) => Array.from({ length: 3 }, () => Object.fromEntries(schema.fields.map(f => [f.key, f.integer ? '20' : '1.25'])));

test('all four seeded experiment types produce numeric reports with explicit units and preserved notes', () => {
  for (const [type, schema] of Object.entries(labReportSchemas)) {
    assert.equal(getLabReportSchema({ sceneAssetsJson: { type } }), schema);
    const report = buildLabReport(schema, filledRows(schema), 'Nhận xét "ổn định"\nLần đo thứ hai.');
    assert.deepEqual(report.errors, {});
    const data = JSON.parse(JSON.stringify(report.data));
    assert.equal(data.schemaVersion, 1);
    assert.equal(data.experimentType, type);
    assert.equal(data.measurements.length, 3);
    assert.equal(data.notes, 'Nhận xét "ổn định"\nLần đo thứ hai.');
    data.measurements.forEach((row, index) => {
      assert.equal(row.trial, index + 1);
      for (const field of schema.fields) {
        assert.equal(typeof row[field.key], 'number');
        assert.equal(data.units[field.key], field.unit);
      }
    });
  }
});

test('a pendulum title mentioning falling gravity selects pendulum, and custom labs keep free text', () => {
  assert.equal(getLabReportSchema({ title: 'Khảo sát con lắc đơn và gia tốc rơi tự do' }).type, 'SIMPLE_PENDULUM_3D');
  assert.equal(getLabReportSchema({ title: 'Bài tùy chỉnh', orderIndex: 1 }), null);
  assert.deepEqual(buildLabReport(null, [], 'Số liệu bình thường').data, { notes: 'Số liệu bình thường' });
  assert.equal(buildLabReport(null, [], '  ').data, null);
});

test('blank, zero/negative positive quantities and non-finite values cannot become a report', () => {
  const schema = labReportSchemas.FREE_FALL_3D;
  for (const value of ['', ' ', '0', '-1', 'abc', 'Infinity', 'NaN']) {
    const rows = filledRows(schema); rows[1].heightM = value;
    const report = buildLabReport(schema, rows);
    assert.equal(report.data, null);
    assert.ok(report.errors['1.heightM']);
  }
  assert.deepEqual(emptyLabTrial(schema), { heightM: '', timeS: '' });
});

test('oscillation counts must be positive integers and signed collision velocities retain zero', () => {
  const pendulum = labReportSchemas.SIMPLE_PENDULUM_3D;
  for (const value of ['1.5', '0', '-2', '9007199254740992']) {
    const rows = filledRows(pendulum); rows[0].oscillations = value;
    assert.ok(buildLabReport(pendulum, rows).errors['0.oscillations']);
  }
  const collision = labReportSchemas.AIR_TRACK_COLLISION_3D;
  const rows = filledRows(collision); rows[0].velocity1BeforeMS = '-0.35'; rows[0].velocity2BeforeMS = '0';
  const report = buildLabReport(collision, rows);
  assert.deepEqual(report.errors, {});
  assert.equal(report.data.measurements[0].velocity1BeforeMS, -0.35);
  assert.equal(report.data.measurements[0].velocity2BeforeMS, 0);
});

test('trial counts are bounded and reports contain only configured measurement fields', () => {
  const schema = labReportSchemas.FREE_FALL_3D;
  assert.ok(buildLabReport(schema, filledRows(schema).slice(0, 2)).errors.rows);
  assert.ok(buildLabReport(schema, Array.from({ length: 21 }, () => filledRows(schema)[0])).errors.rows);
  const rows = filledRows(schema); rows[0].unexpected = 'do not send';
  assert.equal(buildLabReport(schema, rows).data.measurements[0].unexpected, undefined);
});
