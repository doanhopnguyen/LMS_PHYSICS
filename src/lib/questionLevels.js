// DifficultyLevel.java and ExcelQuestionParserServiceImpl.parseCognitiveLevel.
export const difficultyLevels = [
  ['EASY', 'Dễ'],
  ['MEDIUM', 'Trung bình'],
  ['HARD', 'Khó'],
];

export const cognitiveLevels = [
  ['NHAN_BIET', 'Nhận biết'],
  ['THONG_HIEU', 'Thông hiểu'],
  ['VAN_DUNG', 'Vận dụng'],
  ['VAN_DUNG_CAO', 'Vận dụng cao'],
];

export function canonicalCognitiveLevel(value) {
  if (!value?.trim()) return '';
  const original = value.trim();
  const clean = original
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ');
  if (clean.includes('van dung cao') || clean.includes('high application')) return 'VAN_DUNG_CAO';
  if (clean.includes('van dung') || clean.includes('application')) return 'VAN_DUNG';
  if (clean.includes('nhan biet') || clean.includes('knowledge') || clean.includes('remember')) return 'NHAN_BIET';
  if (clean.includes('thong hieu') || clean.includes('comprehension') || clean.includes('understand'))
    return 'THONG_HIEU';
  // Keep an unrecognized stored value visible when editing; never silently overwrite it.
  return original;
}
