import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExperimentSubmission } from '../src/lib/experimentSubmission.js';
import { formatJson, previewType, readEvidenceFiles } from '../src/lib/evidencePreview.js';

test('lecturers can read generated ZIP reports with JSON, Unicode names and original evidence bytes', async () => {
  const report = { measurements: [{ timeS: 0.32 }], notes: 'Nhận xét' };
  const bytes = new Uint8Array([0, 255, 128, 42]);
  const form = await buildExperimentSubmission({ report, file: new File([bytes], 'Ảnh minh chứng.png') });
  const entries = await readEvidenceFiles(form.get('file'));
  assert.deepEqual(entries.map((entry) => entry.name), ['so-lieu.json', 'minh-chung/Ảnh minh chứng.png']);
  assert.deepEqual(JSON.parse(await entries[0].blob.text()), report);
  assert.equal(entries[0].blob.type, 'application/json');
  assert.equal(entries[1].blob.type, 'image/png');
  assert.deepEqual(new Uint8Array(await entries[1].blob.arrayBuffer()), bytes);
});

test('direct JSON and evidence files retain their content and preview types', async () => {
  const form = await buildExperimentSubmission({ report: { heightM: 0.5 } });
  const entries = await readEvidenceFiles(form.get('file'), form.get('file').name);
  assert.deepEqual(JSON.parse(await entries[0].blob.text()), { heightM: 0.5 });
  for (const [name, type] of [['photo.jpg', 'image'], ['report.pdf', 'pdf'], ['clip.mp4', 'video'], ['record.mp3', 'audio'], ['data.csv', 'text'], ['report.json', 'json'], ['report.docx', 'download'], ['page.html', 'download'], ['image.svg', 'download']]) {
    assert.equal(previewType(name), type);
  }
  assert.equal(previewType('opaque-id', 'application/pdf'), 'pdf');
  assert.equal(previewType('opaque-id', 'text/html'), 'download');
  assert.equal(formatJson('{"value":1}'), '{\n  "value": 1\n}');
  assert.equal(formatJson('invalid JSON'), 'invalid JSON');
});

test('broken, compressed and encrypted ZIPs fail with readable errors', async () => {
  const form = await buildExperimentSubmission({ report: { value: 1 }, file: new File(['abc'], 'evidence.txt') });
  const bytes = new Uint8Array(await form.get('file').arrayBuffer());
  await assert.rejects(readEvidenceFiles(new Blob([bytes.subarray(0, 10)])), /không hợp lệ/);
  const footer = new DataView(bytes.buffer, bytes.length - 22);
  const central = footer.getUint32(16, true);
  const compressed = bytes.slice();
  new DataView(compressed.buffer).setUint16(central + 10, 8, true);
  await assert.rejects(readEvidenceFiles(new Blob([compressed])), /nén chưa hỗ trợ/);
  const encrypted = bytes.slice();
  new DataView(encrypted.buffer).setUint16(central + 8, 1, true);
  await assert.rejects(readEvidenceFiles(new Blob([encrypted])), /mã hóa/);
  const broken = bytes.slice();
  new DataView(broken.buffer).setUint32(central + 20, bytes.length + 1, true);
  await assert.rejects(readEvidenceFiles(new Blob([broken])), /không hợp lệ/);
});
