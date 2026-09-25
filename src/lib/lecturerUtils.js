export const itemsOf = (data) => (Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []);
export const displayName = (row) =>
  row?.fullName ||
  row?.studentName ||
  row?.username ||
  row?.classCode ||
  row?.subjectName ||
  row?.semesterName ||
  row?.topicName ||
  row?.title ||
  'Chưa có tên';
export function queryPath(path, query = {}) {
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== '' && value != null));
  return `${path}${params.size ? `?${params}` : ''}`;
}
export async function loadAllPages(request, path) {
  const url = new URL(path, 'http://local');
  url.searchParams.set('size', '100');
  const rows = [];
  for (let page = 0; ; page += 1) {
    url.searchParams.set('page', String(page));
    const data = await request(`${url.pathname}${url.search}`);
    const batch = itemsOf(data);
    rows.push(...batch);
    if (
      Array.isArray(data) ||
      data?.last === true ||
      (Number.isFinite(data?.totalPages) && page + 1 >= data.totalPages) ||
      !batch.length
    )
      return rows;
    if (!Number.isFinite(data?.totalPages) && data?.last !== false) return rows;
    if (page > 9999) throw new Error('Không thể đọc hết danh sách: phân trang API không hợp lệ.');
  }
}
export function validateOptions(type, options) {
  if (options.length < 2 || options.some((o) => !o.content?.trim())) return 'Cần ít nhất hai đáp án có nội dung.';
  if (new Set(options.map((o) => o.content.trim().toLocaleLowerCase())).size !== options.length)
    return 'Nội dung các đáp án không được trùng nhau.';
  const correct = options.filter((o) => o.isCorrect).length;
  if (type === 'MCQ_SINGLE' && correct !== 1) return 'Câu hỏi một đáp án phải có đúng một đáp án đúng.';
  if (type === 'MCQ_MULTIPLE' && correct < 1) return 'Chọn ít nhất một đáp án đúng.';
  return '';
}
export function safeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value, typeof window === 'undefined' ? 'http://local' : window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export const labels = {
  DRAFT: 'Bản nháp',
  ACTIVE: 'Đang hoạt động',
  COMPLETED: 'Đã hoàn thành',
  ARCHIVED: 'Đã lưu trữ',
  DROPPED: 'Đã rút',
  APPROVED: 'Đã duyệt',
  PENDING: 'Chờ duyệt',
  REJECTED: 'Từ chối',
  INSTRUCTOR: 'Giảng viên',
  TA: 'Trợ giảng',
  MCQ_SINGLE: 'Một đáp án',
  MCQ_MULTIPLE: 'Nhiều đáp án',
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
  PRACTICE: 'Luyện tập',
  MIDTERM: 'Giữa kỳ',
  FINAL: 'Cuối kỳ',
  NOT_STARTED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang thực hiện',
  SUBMITTED: 'Đã nộp',
  GRADED: 'Đã chấm',
  EXPERIMENT: 'Thí nghiệm',
  PDF: 'PDF',
  VIDEO: 'Video',
  TEXT: 'Văn bản',
  MARKDOWN: 'Markdown',
};
export const labelOf = (value) => labels[value] || value || '—';
