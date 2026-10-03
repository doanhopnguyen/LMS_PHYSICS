const encoder = new TextEncoder();
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  return value >>> 0;
});

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = (value >>> 8) ^ crcTable[(value ^ byte) & 0xff];
  return (value ^ 0xffffffff) >>> 0;
}

// The existing API accepts one file. A standard, uncompressed ZIP keeps both
// the generated JSON and the user's evidence without requiring backend changes.
async function reportArchive(reportFile, evidenceFile) {
  const evidenceName = evidenceFile.name.replace(/[\\/<>:"|?*\u0000-\u001f]/g, '_').trim() || 'minh-chung';
  const entries = [
    { name: 'so-lieu.json', file: reportFile },
    { name: `minh-chung/${evidenceName}`, file: evidenceFile },
  ];
  const body = [];
  const directory = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = new Uint8Array(await entry.file.arrayBuffer());
    if (data.length > 0xffffffff || offset + data.length > 0xffffffff || name.length > 0xffff) {
      throw new Error('Tệp minh chứng quá lớn để tạo báo cáo. Vui lòng chọn tệp nhỏ hơn.');
    }
    const checksum = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const header = new DataView(local.buffer);
    header.setUint32(0, 0x04034b50, true);
    header.setUint16(4, 20, true);
    header.setUint16(6, 0x0800, true); // UTF-8 filenames.
    header.setUint16(12, 33, true); // 1980-01-01, valid DOS date.
    header.setUint32(14, checksum, true);
    header.setUint32(18, data.length, true);
    header.setUint32(22, data.length, true);
    header.setUint16(26, name.length, true);
    local.set(name, 30);
    body.push(local, data);

    const central = new Uint8Array(46 + name.length);
    const record = new DataView(central.buffer);
    record.setUint32(0, 0x02014b50, true);
    record.setUint16(4, 20, true);
    record.setUint16(6, 20, true);
    record.setUint16(8, 0x0800, true);
    record.setUint16(14, 33, true);
    record.setUint32(16, checksum, true);
    record.setUint32(20, data.length, true);
    record.setUint32(24, data.length, true);
    record.setUint16(28, name.length, true);
    record.setUint32(42, offset, true);
    central.set(name, 46);
    directory.push(central);
    offset += local.length + data.length;
  }
  const directorySize = directory.reduce((size, record) => size + record.length, 0);
  const end = new Uint8Array(22);
  const footer = new DataView(end.buffer);
  footer.setUint32(0, 0x06054b50, true);
  footer.setUint16(8, entries.length, true);
  footer.setUint16(10, entries.length, true);
  footer.setUint32(12, directorySize, true);
  footer.setUint32(16, offset, true);
  return new File([...body, ...directory, end], 'bao-cao-thi-nghiem.zip', { type: 'application/zip' });
}

export async function buildExperimentSubmission({ report, file, evidenceUrl = '' }) {
  const form = new FormData();
  const url = evidenceUrl.trim();
  const data = report ? { ...report, ...(url ? { evidenceUrl: url } : {}) } : file && url ? { evidenceUrl: url } : null;
  const reportFile = data ? new File([JSON.stringify(data, null, 2)], 'so-lieu-thi-nghiem.json', { type: 'application/json' }) : null;
  const upload = reportFile && file ? await reportArchive(reportFile, file) : reportFile || file;
  if (upload) form.append('file', upload);
  // The backend replaces evidenceUrl with its stored file URL when uploading
  // a file. Keep the supplied link inside the report so it is not discarded.
  if (url) form.append('evidenceUrl', url);
  if (!upload && !url) throw new Error('Cần có số liệu, tệp hoặc liên kết minh chứng trước khi nộp bài.');
  return form;
}
