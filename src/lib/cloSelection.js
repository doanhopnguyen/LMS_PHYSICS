export function validateCloIds(ids, rows, subjectId) {
  for (const id of ids || []) {
    const clo = rows.find((row) => row.cloId === id);
    if (!clo || clo.subjectId !== subjectId)
      return 'CLO đã chọn không thuộc học phần này hoặc không còn tồn tại. Vui lòng chọn lại.';
    if (!clo.isActive) return `${clo.cloCode} đã ngừng hoạt động. Bỏ chọn CLO này hoặc kích hoạt lại trước khi lưu.`;
  }
  return '';
}
