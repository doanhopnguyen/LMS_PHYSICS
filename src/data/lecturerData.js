import { rubricRows } from './lmsData.js';

export const lecturerUser = {
  name: 'TS. Nguyễn Văn B',
  role: 'Giảng viên',
  detail: 'Bộ môn Vật lý',
  initials: 'VB',
};

export const lecturerNavigation = [
  ['lecturer_dashboard.html', 'dashboard', 'Tổng quan'],
  ['lecturer_courses.html', 'menu_book', 'Học phần & lớp học'],
  ['lecturer_students.html', 'groups', 'Sinh viên'],
  ['lecturer_materials.html', 'folder_open', 'Kho học liệu'],
  ['lecturer_question_bank.html', 'quiz', 'Ngân hàng câu hỏi'],
  ['lecturer_assessments.html', 'assignment', 'Bài tập & kiểm tra'],
  ['lecturer_grading.html', 'grading', 'Chấm bài'],
  ['lecturer_labs.html', 'science', 'Thí nghiệm 3D'],
  ['lecturer_ai_insights.html', 'smart_toy', 'Phân tích trợ giảng AI'],
  ['lecturer_analytics.html', 'insights', 'Phân tích học tập'],
];

// Chưa có trang Lecturer riêng cho thông báo/cài đặt; không hiển thị liên kết giả.
export const lecturerUtilityNavigation = [];

export const lecturerCourses = [
  {
    id: 1,
    code: 'BAS1201',
    name: 'Vật lý đại cương 1',
    className: 'D23CQCN01-B',
    students: 42,
    progress: 72,
    averageScore: 7.8,
    labCompletion: 81,
    schedule: 'Thứ 2, 09:30',
    room: 'A2-304',
  },
  {
    id: 2,
    code: 'BAS1201',
    name: 'Vật lý đại cương 1',
    className: 'D23CQCN02-B',
    students: 39,
    progress: 68,
    averageScore: 7.3,
    labCompletion: 76,
    schedule: 'Thứ 4, 14:00',
    room: 'A3-201',
  },
  {
    id: 3,
    code: 'BAS1201',
    name: 'Vật lý đại cương 1',
    className: 'D23CQCN03-B',
    students: 45,
    progress: 74,
    averageScore: 7.6,
    labCompletion: 84,
    schedule: 'Thứ 6, 08:00',
    room: 'A2-405',
  },
];

export const lecturerDashboardTasks = [
  {
    id: 1,
    icon: 'lab_profile',
    title: '12 báo cáo thí nghiệm chờ chấm',
    description: 'Thí nghiệm 01: Khảo sát rơi tự do',
    meta: 'Lớp D23CQCN01-B',
    status: 'Khẩn cấp',
    tone: 'primary',
    action: 'Chấm bài',
    href: 'lecturer_labs.html',
  },
  {
    id: 2,
    icon: 'person_alert',
    title: '5 sinh viên chưa làm bài kiểm tra',
    description: 'Kiểm tra Chương 2',
    meta: 'Lớp D23CQCN01-B',
    status: 'Chờ xử lý',
    tone: 'warning',
    action: 'Xem danh sách',
    href: 'lecturer_assessment_results.html?assessment=ASM001',
  },
  {
    id: 3,
    icon: 'event_upcoming',
    title: 'Bài kiểm tra Chương 3 sắp bắt đầu',
    description: '08:00 · 24/09/2026',
    meta: 'Cả 3 lớp · 126 sinh viên',
    status: 'Sắp diễn ra',
    tone: 'neutral',
    action: 'Xem bài',
    href: 'lecturer_assessments.html',
  },
];

export const difficultTopics = [
  { label: 'Định luật II Newton', value: 32, tone: 'primary' },
  { label: 'Ma sát nghỉ và ma sát trượt', value: 28, tone: 'warning' },
  { label: 'Bảo toàn động lượng', value: 24, tone: 'neutral' },
];

export const lecturerRecentActivity = [
  { id: 1, time: '10:30', icon: 'lab_profile', text: '12 sinh viên nộp báo cáo Lab 01' },
  { id: 2, time: '09:45', icon: 'task_alt', text: 'Bài kiểm tra Chương 2 có thêm 18 lượt hoàn thành' },
  { id: 3, time: '08:30', icon: 'contact_support', text: 'Nguyễn Văn A gửi câu hỏi cần hỗ trợ' },
  { id: 4, time: 'Hôm qua', icon: 'event_available', text: 'Bài kiểm tra Chương 1 đã kết thúc' },
];

export const lecturerStudents = [
  {
    id: 'B23DCCN001',
    name: 'Nguyễn Văn A',
    className: 'D23CQCN01-B',
    progress: 82,
    score: 8.4,
    exams: '7/8',
    labs: '4/4',
    status: 'Đang học',
  },
  {
    id: 'B23DCCN014',
    name: 'Trần Minh Anh',
    className: 'D23CQCN01-B',
    progress: 92,
    score: 9.1,
    exams: '8/8',
    labs: '4/4',
    status: 'Đang học',
  },
  {
    id: 'B23DCCN027',
    name: 'Lê Hoàng Nam',
    className: 'D23CQCN01-B',
    progress: 43,
    score: 6.2,
    exams: '5/8',
    labs: '3/4',
    status: 'Cần chú ý',
  },
  {
    id: 'B23DCCN031',
    name: 'Phạm Thu Hà',
    className: 'D23CQCN01-B',
    progress: 66,
    score: 7.8,
    exams: '7/8',
    labs: '4/4',
    status: 'Đang học',
  },
  {
    id: 'B23DCCN038',
    name: 'Đỗ Đức Long',
    className: 'D23CQCN01-B',
    progress: 28,
    score: 5.4,
    exams: '4/8',
    labs: '2/4',
    status: 'Có bài quá hạn',
  },
  {
    id: 'B23DCCN042',
    name: 'Vũ Ngọc Linh',
    className: 'D23CQCN01-B',
    progress: 77,
    score: 8.0,
    exams: '7/8',
    labs: '4/4',
    status: 'Đang học',
  },
  {
    id: 'B23DCCN056',
    name: 'Bùi Quang Huy',
    className: 'D23CQCN02-B',
    progress: 59,
    score: 7.1,
    exams: '6/8',
    labs: '3/4',
    status: 'Cần chú ý',
  },
  {
    id: 'B23DCCN063',
    name: 'Hoàng Mai Phương',
    className: 'D23CQCN02-B',
    progress: 88,
    score: 8.8,
    exams: '8/8',
    labs: '4/4',
    status: 'Đang học',
  },
  {
    id: 'B23DCCN071',
    name: 'Đặng Quốc Bảo',
    className: 'D23CQCN03-B',
    progress: 51,
    score: 6.7,
    exams: '5/8',
    labs: '3/4',
    status: 'Có bài quá hạn',
  },
  {
    id: 'B23DCCN085',
    name: 'Ngô Minh Châu',
    className: 'D23CQCN03-B',
    progress: 73,
    score: 7.6,
    exams: '7/8',
    labs: '4/4',
    status: 'Đang học',
  },
  {
    id: 'B23DCCN093',
    name: 'Phan Đức Anh',
    className: 'D23CQCN03-B',
    progress: 64,
    score: 7.2,
    exams: '6/8',
    labs: '3/4',
    status: 'Cần chú ý',
  },
  {
    id: 'B23DCCN104',
    name: 'Lương Thảo Vy',
    className: 'D23CQCN03-B',
    progress: 80,
    score: 8.2,
    exams: '8/8',
    labs: '4/4',
    status: 'Đang học',
  },
  ...Array.from({ length: 36 }, (_, index) => ({
    id: `B23DCCN${String(105 + index).padStart(3, '0')}`,
    name: `Sinh viên lớp 01 số ${String(index + 7).padStart(2, '0')}`,
    className: 'D23CQCN01-B',
    progress: 48 + ((index * 7) % 49),
    score: Number((5.2 + ((index * 3) % 42) / 10).toFixed(1)),
    exams: `${5 + (index % 4)}/8`,
    labs: `${2 + (index % 3)}/4`,
    status: index % 9 === 0 ? 'Cần chú ý' : index % 13 === 0 ? 'Có bài quá hạn' : 'Đang học',
  })),
  ...Array.from({ length: 37 }, (_, index) => ({
    id: `B23DCCN${String(200 + index).padStart(3, '0')}`,
    name: `Sinh viên lớp 02 số ${String(index + 3).padStart(2, '0')}`,
    className: 'D23CQCN02-B',
    progress: 46 + ((index * 5) % 51),
    score: Number((5.1 + ((index * 4) % 44) / 10).toFixed(1)),
    exams: `${5 + (index % 4)}/8`,
    labs: `${2 + (index % 3)}/4`,
    status: index % 10 === 0 ? 'Cần chú ý' : 'Đang học',
  })),
  ...Array.from({ length: 41 }, (_, index) => ({
    id: `B23DCCN${String(300 + index).padStart(3, '0')}`,
    name: `Sinh viên lớp 03 số ${String(index + 5).padStart(2, '0')}`,
    className: 'D23CQCN03-B',
    progress: 49 + ((index * 6) % 48),
    score: Number((5.3 + ((index * 3) % 42) / 10).toFixed(1)),
    exams: `${5 + (index % 4)}/8`,
    labs: `${2 + (index % 3)}/4`,
    status: index % 11 === 0 ? 'Cần chú ý' : 'Đang học',
  })),
];

export const studentChapterProgress = [
  { label: 'Chương 1 · Động học chất điểm', value: 100 },
  { label: 'Chương 2 · Động lực học chất điểm', value: 88 },
  { label: 'Chương 3 · Công và năng lượng', value: 72 },
  { label: 'Chương 4 · Dao động và sóng', value: 54 },
];

export const studentRecentExams = [
  { id: 1, title: 'Kiểm tra Chương 2', date: '18/09/2026', score: '8.5/10', status: 'Đã hoàn thành' },
  { id: 2, title: 'Luyện tập Định luật Newton', date: '12/09/2026', score: '9.0/10', status: 'Đã hoàn thành' },
  { id: 3, title: 'Kiểm tra Chương 1', date: '05/09/2026', score: '7.8/10', status: 'Đã hoàn thành' },
];

export const studentLabs = [
  { id: 1, title: 'Khảo sát rơi tự do', submitted: '20/09/2026', score: '8.8/10', status: 'Đã chấm' },
  { id: 2, title: 'Chuyển động trên mặt phẳng nghiêng', submitted: '13/09/2026', score: '8.2/10', status: 'Đã chấm' },
  { id: 3, title: 'Va chạm đàn hồi', submitted: '06/09/2026', score: '—', status: 'Đã nộp' },
  { id: 4, title: 'Con lắc vật lý', submitted: '30/08/2026', score: '8.5/10', status: 'Đã chấm' },
];

export const studentLearningLog = [
  { id: 1, time: 'Hôm nay · 09:20', text: 'Hoàn thành bài học Định luật III Newton' },
  { id: 2, time: 'Hôm qua · 20:15', text: 'Làm bộ luyện tập Chương 2, đạt 17/20 câu đúng' },
  { id: 3, time: '19/09/2026 · 16:40', text: 'Nộp báo cáo thí nghiệm Khảo sát rơi tự do' },
];

export const studentDifficultTopics = [
  { label: 'Ma sát nghỉ và ma sát trượt', value: 36, tone: 'primary' },
  { label: 'Hệ quy chiếu phi quán tính', value: 29, tone: 'warning' },
  { label: 'Bảo toàn động lượng', value: 22, tone: 'neutral' },
];

export const materialTypeLabels = {
  TEXTBOOK: 'Giáo trình',
  SLIDE: 'Slide',
  VIDEO: 'Video',
  READING: 'Bài đọc',
  OTHER: 'Tài liệu khác',
};

export const materialChapterLabels = {
  ALL: 'Toàn bộ học phần',
  CHAPTER_1: 'Chương 1',
  CHAPTER_2: 'Chương 2',
  CHAPTER_3: 'Chương 3',
  CHAPTER_4: 'Chương 4',
  CHAPTER_5: 'Chương 5',
};

export const materialStatusMeta = {
  DRAFT: { label: 'Bản nháp', tone: 'neutral' },
  PENDING_APPROVAL: { label: 'Chờ phê duyệt', tone: 'warning' },
  APPROVED: { label: 'Đã phê duyệt', tone: 'success' },
  ARCHIVED: { label: 'Đã lưu trữ', tone: 'neutral' },
};

export const lecturerMaterials = [
  {
    id: 'MAT001',
    title: 'Giáo trình Vật lý đại cương 1',
    type: 'TEXTBOOK',
    chapter: 'ALL',
    description: 'Giáo trình chính thức dùng cho toàn bộ học phần Vật lý đại cương 1.',
    keywords: ['cơ học', 'vật lý', 'giáo trình'],
    source: 'Bộ môn Vật lý',
    status: 'APPROVED',
    fileName: 'vat-ly-dai-cuong-1.pdf',
    fileSize: '12.4 MB',
    createdAt: '2026-08-20',
    updatedAt: '2026-09-18',
  },
  {
    id: 'MAT002',
    title: 'Slide Chương 1 — Động học chất điểm',
    type: 'SLIDE',
    chapter: 'CHAPTER_1',
    description: 'Slide bài giảng về hệ quy chiếu, vận tốc và gia tốc.',
    keywords: ['động học', 'vận tốc', 'gia tốc'],
    source: 'TS. Nguyễn Văn B',
    status: 'APPROVED',
    fileName: 'chuong-1-dong-hoc.pptx',
    fileSize: '5.8 MB',
    createdAt: '2026-08-22',
    updatedAt: '2026-09-15',
  },
  {
    id: 'MAT003',
    title: 'Slide Chương 2 — Động lực học chất điểm',
    type: 'SLIDE',
    chapter: 'CHAPTER_2',
    description: 'Nội dung trọng tâm về lực và các định luật Newton.',
    keywords: ['newton', 'lực', 'động lực học'],
    source: 'TS. Nguyễn Văn B',
    status: 'APPROVED',
    fileName: 'chuong-2-dong-luc-hoc.pptx',
    fileSize: '6.2 MB',
    createdAt: '2026-08-25',
    updatedAt: '2026-09-17',
  },
  {
    id: 'MAT004',
    title: 'Video — Hệ quy chiếu và chuyển động',
    type: 'VIDEO',
    chapter: 'CHAPTER_1',
    description: 'Video minh họa cách lựa chọn hệ quy chiếu trong bài toán động học.',
    keywords: ['hệ quy chiếu', 'chuyển động'],
    source: 'PTIT Physics Team',
    status: 'APPROVED',
    fileName: 'he-quy-chieu.mp4',
    fileSize: '84 MB',
    createdAt: '2026-08-28',
    updatedAt: '2026-09-10',
  },
  {
    id: 'MAT005',
    title: 'Video — Định luật I Newton',
    type: 'VIDEO',
    chapter: 'CHAPTER_2',
    description: 'Ví dụ trực quan về quán tính và định luật I Newton.',
    keywords: ['newton', 'quán tính'],
    source: 'PTIT Physics Team',
    status: 'APPROVED',
    fileName: 'dinh-luat-1-newton.mp4',
    fileSize: '96 MB',
    createdAt: '2026-08-29',
    updatedAt: '2026-09-11',
  },
  {
    id: 'MAT006',
    title: 'Bài đọc — Chuyển động ném xiên',
    type: 'READING',
    chapter: 'CHAPTER_1',
    description: 'Tài liệu đọc bổ sung kèm ví dụ về chuyển động ném xiên.',
    keywords: ['ném xiên', 'quỹ đạo'],
    source: 'Bộ môn Vật lý',
    status: 'APPROVED',
    fileName: 'chuyen-dong-nem-xien.pdf',
    fileSize: '1.8 MB',
    createdAt: '2026-08-30',
    updatedAt: '2026-09-09',
  },
  {
    id: 'MAT007',
    title: 'Bài đọc — Các lực trong cơ học',
    type: 'READING',
    chapter: 'CHAPTER_2',
    description: 'Tổng hợp trọng lực, phản lực, lực căng và lực đàn hồi.',
    keywords: ['lực', 'cơ học', 'đàn hồi'],
    source: 'Bộ môn Vật lý',
    status: 'APPROVED',
    fileName: 'cac-luc-trong-co-hoc.pdf',
    fileSize: '2.1 MB',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-12',
  },
  {
    id: 'MAT008',
    title: 'Bảng công thức Động học',
    type: 'OTHER',
    chapter: 'CHAPTER_1',
    description: 'Bảng tóm tắt công thức và đơn vị thường dùng trong Chương 1.',
    keywords: ['công thức', 'động học'],
    source: 'PTIT Physics Team',
    status: 'APPROVED',
    fileName: 'cong-thuc-dong-hoc.pdf',
    fileSize: '860 KB',
    createdAt: '2026-09-02',
    updatedAt: '2026-09-13',
  },
  {
    id: 'MAT009',
    title: 'Slide Chương 3 — Công và năng lượng',
    type: 'SLIDE',
    chapter: 'CHAPTER_3',
    description: 'Slide về công, công suất, động năng và thế năng.',
    keywords: ['công', 'năng lượng', 'công suất'],
    source: 'TS. Nguyễn Văn B',
    status: 'APPROVED',
    fileName: 'chuong-3-cong-nang-luong.pptx',
    fileSize: '7.1 MB',
    createdAt: '2026-09-03',
    updatedAt: '2026-09-14',
  },
  {
    id: 'MAT010',
    title: 'Video — Định lý động năng',
    type: 'VIDEO',
    chapter: 'CHAPTER_3',
    description: 'Giải thích định lý động năng qua các tình huống cơ học.',
    keywords: ['động năng', 'công'],
    source: 'PTIT Physics Team',
    status: 'APPROVED',
    fileName: 'dinh-ly-dong-nang.mp4',
    fileSize: '112 MB',
    createdAt: '2026-09-04',
    updatedAt: '2026-09-14',
  },
  {
    id: 'MAT011',
    title: 'Bài đọc — Bảo toàn cơ năng',
    type: 'READING',
    chapter: 'CHAPTER_3',
    description: 'Các điều kiện áp dụng định luật bảo toàn cơ năng.',
    keywords: ['bảo toàn', 'cơ năng'],
    source: 'Bộ môn Vật lý',
    status: 'APPROVED',
    fileName: 'bao-toan-co-nang.pdf',
    fileSize: '2.4 MB',
    createdAt: '2026-09-05',
    updatedAt: '2026-09-14',
  },
  {
    id: 'MAT012',
    title: 'Slide Chương 4 — Động lượng',
    type: 'SLIDE',
    chapter: 'CHAPTER_4',
    description: 'Bài giảng về động lượng, xung lượng và va chạm.',
    keywords: ['động lượng', 'va chạm'],
    source: 'TS. Nguyễn Văn B',
    status: 'APPROVED',
    fileName: 'chuong-4-dong-luong.pptx',
    fileSize: '6.7 MB',
    createdAt: '2026-09-06',
    updatedAt: '2026-09-15',
  },
  {
    id: 'MAT013',
    title: 'Video — Va chạm đàn hồi',
    type: 'VIDEO',
    chapter: 'CHAPTER_4',
    description: 'Mô phỏng và phân tích va chạm đàn hồi một chiều.',
    keywords: ['va chạm', 'đàn hồi'],
    source: 'Virtual Lab',
    status: 'APPROVED',
    fileName: 'va-cham-dan-hoi.mp4',
    fileSize: '105 MB',
    createdAt: '2026-09-07',
    updatedAt: '2026-09-15',
  },
  {
    id: 'MAT014',
    title: 'Bài đọc — Bảo toàn động lượng',
    type: 'READING',
    chapter: 'CHAPTER_4',
    description: 'Hệ thống ví dụ về định luật bảo toàn động lượng.',
    keywords: ['bảo toàn', 'động lượng'],
    source: 'Bộ môn Vật lý',
    status: 'APPROVED',
    fileName: 'bao-toan-dong-luong.pdf',
    fileSize: '2.7 MB',
    createdAt: '2026-09-08',
    updatedAt: '2026-09-16',
  },
  {
    id: 'MAT015',
    title: 'Slide Chương 5 — Chuyển động quay',
    type: 'SLIDE',
    chapter: 'CHAPTER_5',
    description: 'Các đại lượng góc và động lực học vật rắn quay.',
    keywords: ['chuyển động quay', 'mô men'],
    source: 'TS. Nguyễn Văn B',
    status: 'APPROVED',
    fileName: 'chuong-5-chuyen-dong-quay.pptx',
    fileSize: '7.4 MB',
    createdAt: '2026-09-09',
    updatedAt: '2026-09-16',
  },
  {
    id: 'MAT016',
    title: 'Video — Mô men lực',
    type: 'VIDEO',
    chapter: 'CHAPTER_5',
    description: 'Minh họa tác dụng làm quay của lực.',
    keywords: ['mô men lực', 'vật rắn'],
    source: 'PTIT Physics Team',
    status: 'APPROVED',
    fileName: 'mo-men-luc.mp4',
    fileSize: '91 MB',
    createdAt: '2026-09-10',
    updatedAt: '2026-09-17',
  },
  {
    id: 'MAT017',
    title: 'Bài đọc — Mô men quán tính',
    type: 'READING',
    chapter: 'CHAPTER_5',
    description: 'Tài liệu bổ sung về mô men quán tính của các vật đồng chất.',
    keywords: ['mô men quán tính', 'vật rắn'],
    source: 'Bộ môn Vật lý',
    status: 'APPROVED',
    fileName: 'mo-men-quan-tinh.pdf',
    fileSize: '2.2 MB',
    createdAt: '2026-09-11',
    updatedAt: '2026-09-17',
  },
  {
    id: 'MAT018',
    title: 'Hướng dẫn sử dụng phòng Lab 3D',
    type: 'OTHER',
    chapter: 'ALL',
    description: 'Hướng dẫn thao tác và quy tắc ghi nhận số liệu trong phòng Lab 3D.',
    keywords: ['lab 3d', 'hướng dẫn'],
    source: 'Virtual Lab',
    status: 'APPROVED',
    fileName: 'huong-dan-lab-3d.pdf',
    fileSize: '3.5 MB',
    createdAt: '2026-08-21',
    updatedAt: '2026-09-18',
  },
  {
    id: 'MAT019',
    title: 'Video — Định luật II Newton',
    type: 'VIDEO',
    chapter: 'CHAPTER_2',
    description: 'Video minh họa mối quan hệ giữa hợp lực, khối lượng và gia tốc.',
    keywords: ['newton', 'gia tốc', 'hợp lực'],
    source: 'TS. Nguyễn Văn B',
    status: 'PENDING_APPROVAL',
    fileName: 'dinh-luat-2-newton.mp4',
    fileSize: '128 MB',
    createdAt: '2026-09-16',
    updatedAt: '2026-09-19',
  },
  {
    id: 'MAT020',
    title: 'Phiếu bài tập Chương 3',
    type: 'OTHER',
    chapter: 'CHAPTER_3',
    description: 'Bộ bài tập vận dụng công và bảo toàn năng lượng.',
    keywords: ['bài tập', 'năng lượng'],
    source: 'TS. Nguyễn Văn B',
    status: 'PENDING_APPROVAL',
    fileName: 'bai-tap-chuong-3.pdf',
    fileSize: '1.4 MB',
    createdAt: '2026-09-17',
    updatedAt: '2026-09-20',
  },
  {
    id: 'MAT021',
    title: 'Video — Bảo toàn động lượng',
    type: 'VIDEO',
    chapter: 'CHAPTER_4',
    description: 'Video bài giảng đang chờ tổ bộ môn phê duyệt.',
    keywords: ['động lượng', 'bảo toàn'],
    source: 'TS. Nguyễn Văn B',
    status: 'PENDING_APPROVAL',
    fileName: 'bao-toan-dong-luong.mp4',
    fileSize: '118 MB',
    createdAt: '2026-09-18',
    updatedAt: '2026-09-20',
  },
  {
    id: 'MAT022',
    title: 'Bài đọc — Chuyển động lăn',
    type: 'READING',
    chapter: 'CHAPTER_5',
    description: 'Tài liệu về chuyển động lăn không trượt của vật rắn.',
    keywords: ['chuyển động lăn', 'vật rắn'],
    source: 'Bộ môn Vật lý',
    status: 'PENDING_APPROVAL',
    fileName: 'chuyen-dong-lan.pdf',
    fileSize: '2.6 MB',
    createdAt: '2026-09-18',
    updatedAt: '2026-09-21',
  },
  {
    id: 'MAT023',
    title: 'Bài đọc — Lực ma sát',
    type: 'READING',
    chapter: 'CHAPTER_2',
    description: 'Bản thảo phân biệt ma sát nghỉ và ma sát trượt.',
    keywords: ['ma sát', 'lực'],
    source: 'TS. Nguyễn Văn B',
    status: 'DRAFT',
    fileName: 'luc-ma-sat.docx',
    fileSize: '740 KB',
    createdAt: '2026-09-20',
    updatedAt: '2026-09-21',
  },
  {
    id: 'MAT024',
    title: 'Bộ câu hỏi ôn tập Chương 5',
    type: 'OTHER',
    chapter: 'CHAPTER_5',
    description: 'Bộ câu hỏi ôn tập chuyển động quay đang biên soạn.',
    keywords: ['ôn tập', 'chuyển động quay'],
    source: 'TS. Nguyễn Văn B',
    status: 'DRAFT',
    fileName: 'on-tap-chuong-5.docx',
    fileSize: '920 KB',
    createdAt: '2026-09-21',
    updatedAt: '2026-09-21',
  },
];

export const questionTopics = [
  { id: 1, name: 'Động học chất điểm', questions: 85, easy: 32, medium: 38, hard: 15 },
  { id: 2, name: 'Động lực học chất điểm', questions: 120, easy: 42, medium: 53, hard: 25 },
  { id: 3, name: 'Công và năng lượng', questions: 74, easy: 27, medium: 34, hard: 13 },
  { id: 4, name: 'Dao động và sóng', questions: 68, easy: 24, medium: 31, hard: 13 },
];

export const questionChapterLabels = {
  CH1: 'Chương 1 — Động học chất điểm',
  CH2: 'Chương 2 — Động lực học chất điểm',
  CH3: 'Chương 3 — Công và năng lượng',
  CH4: 'Chương 4 — Động lượng',
  CH5: 'Chương 5 — Chuyển động quay',
};

export const cognitiveLevelLabels = {
  REMEMBER: 'Nhận biết',
  UNDERSTAND: 'Thông hiểu',
  APPLY: 'Vận dụng',
  HIGH_APPLY: 'Vận dụng cao',
};

export const questionTypeLabels = {
  SINGLE_CHOICE: 'Một đáp án đúng',
  MULTIPLE_CHOICE: 'Nhiều đáp án đúng',
};

export const questionBankStats = { total: 248, approved: 186, pending: 42, draft: 20 };

export const lecturerQuestions = [
  {
    id: 'Q-CH1-001',
    chapterId: 'CH1',
    topic: 'Vận tốc và gia tốc',
    cognitiveLevel: 'REMEMBER',
    clo: 'CLO1',
    type: 'SINGLE_CHOICE',
    content: 'Đại lượng nào mô tả mức độ thay đổi vận tốc theo thời gian?',
    keywords: ['gia tốc', 'vận tốc'],
    answers: [
      { id: 'A', content: 'Quãng đường', correct: false },
      { id: 'B', content: 'Gia tốc', correct: true },
      { id: 'C', content: 'Tọa độ', correct: false },
      { id: 'D', content: 'Khối lượng', correct: false },
    ],
    explanation: 'Gia tốc là đại lượng đặc trưng cho sự biến thiên của vận tốc theo thời gian.',
    sourceMaterialId: 'MAT001',
    sourcePage: '18',
    status: 'APPROVED',
    createdAt: '2026-08-25',
    updatedAt: '2026-09-10',
  },
  {
    id: 'Q-CH1-002',
    chapterId: 'CH1',
    topic: 'Chuyển động thẳng biến đổi đều',
    cognitiveLevel: 'APPLY',
    clo: 'CLO2',
    type: 'SINGLE_CHOICE',
    content: 'Một vật xuất phát từ nghỉ với gia tốc 2 m/s². Vận tốc sau 3 giây bằng bao nhiêu?',
    keywords: ['gia tốc', 'chuyển động thẳng'],
    answers: [
      { id: 'A', content: '2 m/s', correct: false },
      { id: 'B', content: '4 m/s', correct: false },
      { id: 'C', content: '6 m/s', correct: true },
      { id: 'D', content: '9 m/s', correct: false },
    ],
    explanation: 'Dùng v = v₀ + at = 0 + 2×3 = 6 m/s.',
    sourceMaterialId: 'MAT002',
    sourcePage: '24',
    status: 'APPROVED',
    createdAt: '2026-08-26',
    updatedAt: '2026-09-11',
  },
  {
    id: 'Q-CH1-003',
    chapterId: 'CH1',
    topic: 'Đồ thị chuyển động',
    cognitiveLevel: 'UNDERSTAND',
    clo: 'CLO1',
    type: 'MULTIPLE_CHOICE',
    content: 'Những phát biểu nào đúng về đồ thị vận tốc–thời gian?',
    keywords: ['đồ thị', 'vận tốc'],
    answers: [
      { id: 'A', content: 'Độ dốc biểu thị gia tốc', correct: true },
      { id: 'B', content: 'Diện tích có dấu biểu thị độ dời', correct: true },
      { id: 'C', content: 'Tung độ luôn biểu thị tọa độ', correct: false },
      { id: 'D', content: 'Đồ thị dưới trục thời gian biểu thị vận tốc âm', correct: true },
    ],
    explanation: 'Độ dốc của đồ thị v–t là gia tốc; diện tích có dấu là độ dời.',
    sourceMaterialId: 'MAT002',
    sourcePage: '31',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-16',
  },
  {
    id: 'Q-CH1-004',
    chapterId: 'CH1',
    topic: 'Chuyển động ném xiên',
    cognitiveLevel: 'HIGH_APPLY',
    clo: 'CLO3',
    type: 'SINGLE_CHOICE',
    content: 'Bỏ qua sức cản không khí, tại điểm cao nhất của quỹ đạo ném xiên, đại lượng nào bằng 0?',
    keywords: ['ném xiên', 'quỹ đạo'],
    answers: [
      { id: 'A', content: 'Vận tốc ngang', correct: false },
      { id: 'B', content: 'Vận tốc thẳng đứng', correct: true },
      { id: 'C', content: 'Gia tốc trọng trường', correct: false },
      { id: 'D', content: 'Tốc độ của vật', correct: false },
    ],
    explanation: 'Tại điểm cao nhất, thành phần vận tốc thẳng đứng bằng 0 nhưng thành phần ngang vẫn khác 0.',
    sourceMaterialId: 'MAT006',
    sourcePage: '7',
    status: 'DRAFT',
    createdAt: '2026-09-12',
    updatedAt: '2026-09-18',
  },
  {
    id: 'Q-CH2-001',
    chapterId: 'CH2',
    topic: 'Định luật II Newton',
    cognitiveLevel: 'APPLY',
    clo: 'CLO2',
    type: 'SINGLE_CHOICE',
    content:
      'Một vật có khối lượng 2 kg chịu tác dụng của lực không đổi 10 N. Bỏ qua ma sát. Gia tốc của vật bằng bao nhiêu?',
    keywords: ['newton', 'gia tốc', 'hợp lực'],
    answers: [
      { id: 'A', content: '2 m/s²', correct: false },
      { id: 'B', content: '5 m/s²', correct: true },
      { id: 'C', content: '10 m/s²', correct: false },
      { id: 'D', content: '20 m/s²', correct: false },
    ],
    explanation: 'Theo định luật II Newton: F = ma, suy ra a = F/m = 10/2 = 5 m/s². Đáp án đúng là B.',
    sourceMaterialId: 'MAT001',
    sourcePage: '52',
    status: 'APPROVED',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-18',
  },
  {
    id: 'Q-CH2-002',
    chapterId: 'CH2',
    topic: 'Định luật I Newton',
    cognitiveLevel: 'UNDERSTAND',
    clo: 'CLO1',
    type: 'SINGLE_CHOICE',
    content: 'Trong hệ quy chiếu quán tính, khi hợp lực tác dụng lên vật bằng 0 thì vật sẽ như thế nào?',
    keywords: ['quán tính', 'newton'],
    answers: [
      { id: 'A', content: 'Luôn đứng yên', correct: false },
      { id: 'B', content: 'Luôn chuyển động nhanh dần', correct: false },
      { id: 'C', content: 'Giữ trạng thái đứng yên hoặc chuyển động thẳng đều', correct: true },
      { id: 'D', content: 'Chuyển động tròn đều', correct: false },
    ],
    explanation: 'Đây là nội dung của định luật I Newton trong hệ quy chiếu quán tính.',
    sourceMaterialId: 'MAT003',
    sourcePage: '12',
    status: 'APPROVED',
    createdAt: '2026-09-02',
    updatedAt: '2026-09-18',
  },
  {
    id: 'Q-CH2-003',
    chapterId: 'CH2',
    topic: 'Lực ma sát',
    cognitiveLevel: 'UNDERSTAND',
    clo: 'CLO2',
    type: 'MULTIPLE_CHOICE',
    content: 'Những yếu tố nào ảnh hưởng trực tiếp đến độ lớn lực ma sát trượt trong mô hình cơ bản?',
    keywords: ['ma sát', 'phản lực'],
    answers: [
      { id: 'A', content: 'Hệ số ma sát trượt', correct: true },
      { id: 'B', content: 'Độ lớn phản lực pháp tuyến', correct: true },
      { id: 'C', content: 'Diện tích tiếp xúc biểu kiến', correct: false },
      { id: 'D', content: 'Màu sắc bề mặt', correct: false },
    ],
    explanation: 'Trong mô hình cơ bản, Fmst = μtN.',
    sourceMaterialId: 'MAT007',
    sourcePage: '9',
    status: 'APPROVED',
    createdAt: '2026-09-03',
    updatedAt: '2026-09-18',
  },
  {
    id: 'Q-CH2-004',
    chapterId: 'CH2',
    topic: 'Định luật III Newton',
    cognitiveLevel: 'REMEMBER',
    clo: 'CLO1',
    type: 'SINGLE_CHOICE',
    content: 'Cặp lực và phản lực trong định luật III Newton có đặc điểm nào?',
    keywords: ['lực', 'phản lực'],
    answers: [
      { id: 'A', content: 'Cùng tác dụng lên một vật', correct: false },
      { id: 'B', content: 'Cùng chiều', correct: false },
      { id: 'C', content: 'Cùng độ lớn, ngược chiều và tác dụng lên hai vật', correct: true },
      { id: 'D', content: 'Luôn triệt tiêu nhau', correct: false },
    ],
    explanation: 'Hai lực trực đối có cùng độ lớn, ngược chiều nhưng đặt lên hai vật khác nhau.',
    sourceMaterialId: 'MAT003',
    sourcePage: '28',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-09-05',
    updatedAt: '2026-09-19',
  },
  {
    id: 'Q-CH3-001',
    chapterId: 'CH3',
    topic: 'Công của lực',
    cognitiveLevel: 'APPLY',
    clo: 'CLO2',
    type: 'SINGLE_CHOICE',
    content: 'Lực 10 N cùng hướng với độ dời 3 m thực hiện công bằng bao nhiêu?',
    keywords: ['công', 'độ dời'],
    answers: [
      { id: 'A', content: '3 J', correct: false },
      { id: 'B', content: '10 J', correct: false },
      { id: 'C', content: '30 J', correct: true },
      { id: 'D', content: '300 J', correct: false },
    ],
    explanation: 'A = Fs cos0° = 10×3 = 30 J.',
    sourceMaterialId: 'MAT009',
    sourcePage: '8',
    status: 'APPROVED',
    createdAt: '2026-09-06',
    updatedAt: '2026-09-19',
  },
  {
    id: 'Q-CH3-002',
    chapterId: 'CH3',
    topic: 'Động năng',
    cognitiveLevel: 'APPLY',
    clo: 'CLO2',
    type: 'SINGLE_CHOICE',
    content: 'Một vật 2 kg chuyển động với tốc độ 3 m/s có động năng bằng bao nhiêu?',
    keywords: ['động năng', 'tốc độ'],
    answers: [
      { id: 'A', content: '3 J', correct: false },
      { id: 'B', content: '6 J', correct: false },
      { id: 'C', content: '9 J', correct: true },
      { id: 'D', content: '18 J', correct: false },
    ],
    explanation: 'Wđ = 1/2 mv² = 1/2×2×3² = 9 J.',
    sourceMaterialId: 'MAT009',
    sourcePage: '21',
    status: 'APPROVED',
    createdAt: '2026-09-07',
    updatedAt: '2026-09-19',
  },
  {
    id: 'Q-CH3-003',
    chapterId: 'CH3',
    topic: 'Bảo toàn cơ năng',
    cognitiveLevel: 'UNDERSTAND',
    clo: 'CLO3',
    type: 'MULTIPLE_CHOICE',
    content: 'Cơ năng được bảo toàn trong những trường hợp nào sau đây?',
    keywords: ['bảo toàn', 'cơ năng'],
    answers: [
      { id: 'A', content: 'Chỉ có trọng lực sinh công', correct: true },
      { id: 'B', content: 'Chỉ có lực đàn hồi sinh công', correct: true },
      { id: 'C', content: 'Ma sát trượt sinh công đáng kể', correct: false },
      { id: 'D', content: 'Có lực cản không khí lớn', correct: false },
    ],
    explanation: 'Cơ năng bảo toàn khi chỉ các lực thế sinh công.',
    sourceMaterialId: 'MAT011',
    sourcePage: '5',
    status: 'APPROVED',
    createdAt: '2026-09-08',
    updatedAt: '2026-09-19',
  },
  {
    id: 'Q-CH3-004',
    chapterId: 'CH3',
    topic: 'Công suất',
    cognitiveLevel: 'REMEMBER',
    clo: 'CLO1',
    type: 'SINGLE_CHOICE',
    content: 'Đơn vị SI của công suất là gì?',
    keywords: ['công suất', 'đơn vị'],
    answers: [
      { id: 'A', content: 'Joule', correct: false },
      { id: 'B', content: 'Newton', correct: false },
      { id: 'C', content: 'Watt', correct: true },
      { id: 'D', content: 'Pascal', correct: false },
    ],
    explanation: 'Đơn vị SI của công suất là watt (W).',
    sourceMaterialId: 'MAT009',
    sourcePage: '14',
    status: 'DRAFT',
    createdAt: '2026-09-15',
    updatedAt: '2026-09-20',
  },
  {
    id: 'Q-CH4-001',
    chapterId: 'CH4',
    topic: 'Động lượng',
    cognitiveLevel: 'REMEMBER',
    clo: 'CLO1',
    type: 'SINGLE_CHOICE',
    content: 'Động lượng của một vật được xác định bằng biểu thức nào?',
    keywords: ['động lượng', 'khối lượng'],
    answers: [
      { id: 'A', content: 'p = mv', correct: true },
      { id: 'B', content: 'p = ma', correct: false },
      { id: 'C', content: 'p = m/v', correct: false },
      { id: 'D', content: 'p = 1/2mv²', correct: false },
    ],
    explanation: 'Động lượng là đại lượng vectơ p = mv.',
    sourceMaterialId: 'MAT012',
    sourcePage: '7',
    status: 'APPROVED',
    createdAt: '2026-09-09',
    updatedAt: '2026-09-20',
  },
  {
    id: 'Q-CH4-002',
    chapterId: 'CH4',
    topic: 'Bảo toàn động lượng',
    cognitiveLevel: 'APPLY',
    clo: 'CLO3',
    type: 'SINGLE_CHOICE',
    content: 'Hai vật va chạm trong một hệ kín. Đại lượng nào được bảo toàn trong quá trình va chạm?',
    keywords: ['va chạm', 'bảo toàn'],
    answers: [
      { id: 'A', content: 'Động năng trong mọi trường hợp', correct: false },
      { id: 'B', content: 'Tổng động lượng', correct: true },
      { id: 'C', content: 'Vận tốc từng vật', correct: false },
      { id: 'D', content: 'Gia tốc từng vật', correct: false },
    ],
    explanation: 'Trong hệ kín, tổng động lượng của hệ được bảo toàn.',
    sourceMaterialId: 'MAT014',
    sourcePage: '11',
    status: 'APPROVED',
    createdAt: '2026-09-10',
    updatedAt: '2026-09-20',
  },
  {
    id: 'Q-CH4-003',
    chapterId: 'CH4',
    topic: 'Va chạm',
    cognitiveLevel: 'HIGH_APPLY',
    clo: 'CLO4',
    type: 'MULTIPLE_CHOICE',
    content: 'Trong va chạm đàn hồi lý tưởng của hệ kín, những đại lượng nào được bảo toàn?',
    keywords: ['va chạm đàn hồi', 'động lượng'],
    answers: [
      { id: 'A', content: 'Tổng động lượng', correct: true },
      { id: 'B', content: 'Tổng động năng', correct: true },
      { id: 'C', content: 'Vận tốc của từng vật', correct: false },
      { id: 'D', content: 'Khối lượng của hệ', correct: true },
    ],
    explanation: 'Va chạm đàn hồi bảo toàn động lượng và động năng; khối lượng hệ không đổi.',
    sourceMaterialId: 'MAT013',
    sourcePage: '—',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-09-12',
    updatedAt: '2026-09-20',
  },
  {
    id: 'Q-CH4-004',
    chapterId: 'CH4',
    topic: 'Xung lượng',
    cognitiveLevel: 'UNDERSTAND',
    clo: 'CLO2',
    type: 'SINGLE_CHOICE',
    content: 'Xung lượng của lực bằng độ biến thiên của đại lượng nào?',
    keywords: ['xung lượng', 'động lượng'],
    answers: [
      { id: 'A', content: 'Cơ năng', correct: false },
      { id: 'B', content: 'Động lượng', correct: true },
      { id: 'C', content: 'Công suất', correct: false },
      { id: 'D', content: 'Khối lượng', correct: false },
    ],
    explanation: 'Định lý xung lượng–động lượng: FΔt = Δp.',
    sourceMaterialId: 'MAT012',
    sourcePage: '16',
    status: 'ARCHIVED',
    createdAt: '2026-08-30',
    updatedAt: '2026-09-14',
  },
  {
    id: 'Q-CH5-001',
    chapterId: 'CH5',
    topic: 'Mô men lực',
    cognitiveLevel: 'APPLY',
    clo: 'CLO2',
    type: 'SINGLE_CHOICE',
    content: 'Lực 10 N có cánh tay đòn 0,3 m tạo mô men lực bằng bao nhiêu?',
    keywords: ['mô men lực', 'cánh tay đòn'],
    answers: [
      { id: 'A', content: '0,3 N·m', correct: false },
      { id: 'B', content: '3 N·m', correct: true },
      { id: 'C', content: '10 N·m', correct: false },
      { id: 'D', content: '30 N·m', correct: false },
    ],
    explanation: 'M = Fd = 10×0,3 = 3 N·m.',
    sourceMaterialId: 'MAT015',
    sourcePage: '13',
    status: 'APPROVED',
    createdAt: '2026-09-11',
    updatedAt: '2026-09-20',
  },
  {
    id: 'Q-CH5-002',
    chapterId: 'CH5',
    topic: 'Mô men quán tính',
    cognitiveLevel: 'UNDERSTAND',
    clo: 'CLO3',
    type: 'SINGLE_CHOICE',
    content: 'Mô men quán tính của vật rắn phụ thuộc vào yếu tố nào?',
    keywords: ['mô men quán tính', 'vật rắn'],
    answers: [
      { id: 'A', content: 'Chỉ khối lượng toàn phần', correct: false },
      { id: 'B', content: 'Khối lượng và sự phân bố khối lượng đối với trục quay', correct: true },
      { id: 'C', content: 'Chỉ vận tốc góc', correct: false },
      { id: 'D', content: 'Màu sắc vật', correct: false },
    ],
    explanation: 'Mô men quán tính phụ thuộc khối lượng và khoảng cách của các phần khối lượng đến trục.',
    sourceMaterialId: 'MAT017',
    sourcePage: '4',
    status: 'APPROVED',
    createdAt: '2026-09-12',
    updatedAt: '2026-09-20',
  },
  {
    id: 'Q-CH5-003',
    chapterId: 'CH5',
    topic: 'Động năng quay',
    cognitiveLevel: 'APPLY',
    clo: 'CLO3',
    type: 'SINGLE_CHOICE',
    content: 'Vật có mô men quán tính 0,5 kg·m² quay với tốc độ góc 4 rad/s có động năng quay bằng bao nhiêu?',
    keywords: ['động năng quay', 'tốc độ góc'],
    answers: [
      { id: 'A', content: '2 J', correct: false },
      { id: 'B', content: '4 J', correct: true },
      { id: 'C', content: '8 J', correct: false },
      { id: 'D', content: '16 J', correct: false },
    ],
    explanation: 'W = 1/2Iω² = 1/2×0,5×4² = 4 J.',
    sourceMaterialId: 'MAT015',
    sourcePage: '27',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-09-15',
    updatedAt: '2026-09-21',
  },
  {
    id: 'Q-CH5-004',
    chapterId: 'CH5',
    topic: 'Chuyển động quay',
    cognitiveLevel: 'HIGH_APPLY',
    clo: 'CLO4',
    type: 'MULTIPLE_CHOICE',
    content: 'Khi tổng mô men ngoại lực đối với trục quay bằng 0, những nhận định nào phù hợp?',
    keywords: ['mô men', 'quay'],
    answers: [
      { id: 'A', content: 'Gia tốc góc bằng 0', correct: true },
      { id: 'B', content: 'Vận tốc góc không đổi', correct: true },
      { id: 'C', content: 'Vật bắt buộc đứng yên', correct: false },
      { id: 'D', content: 'Vật có thể quay đều', correct: true },
    ],
    explanation: 'Theo ΣM = Iα, tổng mô men bằng 0 thì α = 0; vật có thể đứng yên hoặc quay đều.',
    sourceMaterialId: 'MAT015',
    sourcePage: '32',
    status: 'DRAFT',
    createdAt: '2026-09-18',
    updatedAt: '2026-09-21',
  },
];

export const assessmentTypeLabels = {
  PRACTICE: 'Bài luyện tập',
  REGULAR: 'Kiểm tra thường xuyên',
  MIDTERM: 'Kiểm tra giữa kỳ',
  FINAL: 'Kiểm tra cuối kỳ',
};

export const assessmentStatusMeta = {
  DRAFT: { label: 'Bản nháp', tone: 'neutral' },
  SCHEDULED: { label: 'Sắp diễn ra', tone: 'warning' },
  OPEN: { label: 'Đang mở', tone: 'success' },
  CLOSED: { label: 'Đã kết thúc', tone: 'neutral' },
};

export const assessmentStats = { total: 12, open: 4, scheduled: 3, closed: 5 };

const assessmentDefaults = {
  duration: 30,
  totalScore: 10,
  attemptsAllowed: 1,
  shuffleQuestions: true,
  shuffleAnswers: true,
  showScoreAfterSubmit: true,
  showAnswersAfterClose: true,
  showExplanationAfterSubmit: false,
};

export const assessments = [
  {
    ...assessmentDefaults,
    id: 'ASM001',
    title: 'Kiểm tra Chương 2',
    type: 'REGULAR',
    description: 'Đánh giá kiến thức về các định luật Newton và lực cơ học.',
    classIds: ['D23CQCN01-B'],
    chapters: ['CH2'],
    matrix: { CH2: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1, HIGH_APPLY: 0 } },
    questionIds: ['Q-CH2-001', 'Q-CH2-002', 'Q-CH2-003'],
    startAt: '2026-09-22T08:00',
    endAt: '2026-09-24T23:59',
    status: 'OPEN',
    completedCount: 35,
    totalStudents: 42,
  },
  {
    ...assessmentDefaults,
    id: 'ASM002',
    title: 'Luyện tập Động học chất điểm',
    type: 'PRACTICE',
    description: 'Bài luyện tập củng cố Chương 1.',
    classIds: ['D23CQCN02-B'],
    chapters: ['CH1'],
    matrix: { CH1: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1, HIGH_APPLY: 1 } },
    questionIds: ['Q-CH1-001', 'Q-CH1-002', 'Q-CH1-003', 'Q-CH1-004'],
    duration: 25,
    startAt: '2026-09-20T08:00',
    endAt: '2026-09-27T23:59',
    status: 'OPEN',
    completedCount: 24,
    totalStudents: 39,
  },
  {
    ...assessmentDefaults,
    id: 'ASM003',
    title: 'Kiểm tra Công và năng lượng',
    type: 'REGULAR',
    description: 'Kiểm tra cuối Chương 3.',
    classIds: ['D23CQCN03-B'],
    chapters: ['CH3'],
    matrix: { CH3: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 2, HIGH_APPLY: 0 } },
    questionIds: ['Q-CH3-001', 'Q-CH3-002', 'Q-CH3-003', 'Q-CH3-004'],
    startAt: '2026-09-21T13:00',
    endAt: '2026-09-25T22:00',
    status: 'OPEN',
    completedCount: 31,
    totalStudents: 45,
  },
  {
    ...assessmentDefaults,
    id: 'ASM004',
    title: 'Ôn tập tổng hợp Chương 1–2',
    type: 'PRACTICE',
    description: 'Bộ câu hỏi ôn tập trước kiểm tra giữa kỳ.',
    classIds: ['D23CQCN01-B', 'D23CQCN02-B'],
    chapters: ['CH1', 'CH2'],
    matrix: {
      CH1: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1, HIGH_APPLY: 0 },
      CH2: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1, HIGH_APPLY: 0 },
    },
    questionIds: ['Q-CH1-001', 'Q-CH1-002', 'Q-CH1-003', 'Q-CH2-001', 'Q-CH2-002', 'Q-CH2-003'],
    duration: 45,
    startAt: '2026-09-19T08:00',
    endAt: '2026-09-26T23:59',
    status: 'OPEN',
    completedCount: 52,
    totalStudents: 81,
  },
  {
    ...assessmentDefaults,
    id: 'ASM005',
    title: 'Kiểm tra Động lượng',
    type: 'REGULAR',
    description: 'Bài kiểm tra Chương 4.',
    classIds: ['D23CQCN01-B'],
    chapters: ['CH4'],
    matrix: { CH4: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1, HIGH_APPLY: 1 } },
    questionIds: ['Q-CH4-001', 'Q-CH4-002', 'Q-CH4-003', 'Q-CH4-004'],
    duration: 35,
    startAt: '2026-09-25T08:00',
    endAt: '2026-09-26T23:59',
    status: 'SCHEDULED',
    completedCount: 0,
    totalStudents: 42,
  },
  {
    ...assessmentDefaults,
    id: 'ASM006',
    title: 'Kiểm tra giữa kỳ Vật lý 1',
    type: 'MIDTERM',
    description: 'Đánh giá tổng hợp Chương 1, 2 và 3.',
    classIds: ['D23CQCN01-B', 'D23CQCN02-B', 'D23CQCN03-B'],
    chapters: ['CH1', 'CH2', 'CH3'],
    matrix: {
      CH1: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1, HIGH_APPLY: 0 },
      CH2: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1, HIGH_APPLY: 0 },
      CH3: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1, HIGH_APPLY: 0 },
    },
    questionIds: ['Q-CH1-001', 'Q-CH1-002', 'Q-CH2-001', 'Q-CH2-002', 'Q-CH3-001', 'Q-CH3-002'],
    duration: 60,
    startAt: '2026-09-30T08:00',
    endAt: '2026-09-30T09:00',
    status: 'SCHEDULED',
    completedCount: 0,
    totalStudents: 126,
  },
  {
    ...assessmentDefaults,
    id: 'ASM007',
    title: 'Luyện tập Chuyển động quay',
    type: 'PRACTICE',
    description: 'Luyện tập Chương 5 trước giờ học.',
    classIds: ['D23CQCN03-B'],
    chapters: ['CH5'],
    matrix: { CH5: { REMEMBER: 0, UNDERSTAND: 1, APPLY: 2, HIGH_APPLY: 1 } },
    questionIds: ['Q-CH5-001', 'Q-CH5-002', 'Q-CH5-003', 'Q-CH5-004'],
    duration: 30,
    startAt: '2026-10-01T08:00',
    endAt: '2026-10-05T23:59',
    status: 'SCHEDULED',
    completedCount: 0,
    totalStudents: 45,
  },
  {
    ...assessmentDefaults,
    id: 'ASM008',
    title: 'Kiểm tra Chương 1',
    type: 'REGULAR',
    description: 'Kiểm tra kiến thức Động học chất điểm.',
    classIds: ['D23CQCN01-B'],
    chapters: ['CH1'],
    matrix: { CH1: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1, HIGH_APPLY: 1 } },
    questionIds: ['Q-CH1-001', 'Q-CH1-002', 'Q-CH1-003', 'Q-CH1-004'],
    startAt: '2026-09-05T08:00',
    endAt: '2026-09-07T23:59',
    status: 'CLOSED',
    completedCount: 42,
    totalStudents: 42,
  },
  {
    ...assessmentDefaults,
    id: 'ASM009',
    title: 'Luyện tập Định luật Newton',
    type: 'PRACTICE',
    description: 'Bộ câu hỏi luyện tập Chương 2.',
    classIds: ['D23CQCN02-B'],
    chapters: ['CH2'],
    matrix: { CH2: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1, HIGH_APPLY: 0 } },
    questionIds: ['Q-CH2-001', 'Q-CH2-002', 'Q-CH2-003'],
    startAt: '2026-09-08T08:00',
    endAt: '2026-09-12T23:59',
    status: 'CLOSED',
    completedCount: 38,
    totalStudents: 39,
  },
  {
    ...assessmentDefaults,
    id: 'ASM010',
    title: 'Kiểm tra Bảo toàn cơ năng',
    type: 'REGULAR',
    description: 'Đánh giá nội dung bảo toàn cơ năng.',
    classIds: ['D23CQCN03-B'],
    chapters: ['CH3'],
    matrix: { CH3: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 2, HIGH_APPLY: 0 } },
    questionIds: ['Q-CH3-001', 'Q-CH3-002', 'Q-CH3-003', 'Q-CH3-004'],
    startAt: '2026-09-10T13:00',
    endAt: '2026-09-12T23:59',
    status: 'CLOSED',
    completedCount: 44,
    totalStudents: 45,
  },
  {
    ...assessmentDefaults,
    id: 'ASM011',
    title: 'Bài kiểm tra Động lượng',
    type: 'REGULAR',
    description: 'Kiểm tra ngắn Chương 4.',
    classIds: ['D23CQCN01-B'],
    chapters: ['CH4'],
    matrix: { CH4: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1, HIGH_APPLY: 0 } },
    questionIds: ['Q-CH4-001', 'Q-CH4-002', 'Q-CH4-003'],
    startAt: '2026-09-14T08:00',
    endAt: '2026-09-15T23:59',
    status: 'CLOSED',
    completedCount: 40,
    totalStudents: 42,
  },
  {
    ...assessmentDefaults,
    id: 'ASM012',
    title: 'Ôn tập Cơ học',
    type: 'PRACTICE',
    description: 'Ôn tập tổng hợp kiến thức cơ học.',
    classIds: ['D23CQCN02-B'],
    chapters: ['CH1', 'CH2', 'CH3'],
    matrix: {
      CH1: { REMEMBER: 1, UNDERSTAND: 0, APPLY: 1, HIGH_APPLY: 0 },
      CH2: { REMEMBER: 1, UNDERSTAND: 0, APPLY: 1, HIGH_APPLY: 0 },
      CH3: { REMEMBER: 1, UNDERSTAND: 0, APPLY: 1, HIGH_APPLY: 0 },
    },
    questionIds: ['Q-CH1-001', 'Q-CH1-002', 'Q-CH2-001', 'Q-CH2-002', 'Q-CH3-001', 'Q-CH3-002'],
    duration: 45,
    startAt: '2026-09-01T08:00',
    endAt: '2026-09-04T23:59',
    status: 'CLOSED',
    completedCount: 39,
    totalStudents: 39,
  },
];

export const attemptStatusMeta = {
  NOT_STARTED: { label: 'Chưa bắt đầu', tone: 'neutral' },
  IN_PROGRESS: { label: 'Đang làm', tone: 'warning' },
  SUBMITTED: { label: 'Đã nộp', tone: 'success' },
  LATE: { label: 'Nộp muộn', tone: 'primary' },
};

export const answersAreEqual = (selected = [], correct = []) =>
  selected.length === correct.length &&
  [...selected].sort().every((value, index) => value === [...correct].sort()[index]);

const createAttempt = ({ assessment, student, studentIndex, status, datePrefix }) => {
  const questions = assessment.questionIds
    .map((id) => lecturerQuestions.find((question) => question.id === id))
    .filter(Boolean);
  const answers = questions.map((question, questionIndex) => {
    const correctIds = question.answers.filter((answer) => answer.correct).map((answer) => answer.id);
    const shouldBeCorrect = (studentIndex + questionIndex * 2) % 5 !== 0;
    const fallback = question.answers.find((answer) => !answer.correct)?.id;
    return {
      questionId: question.id,
      selectedAnswerIds: shouldBeCorrect
        ? correctIds
        : question.type === 'MULTIPLE_CHOICE'
          ? correctIds.slice(0, 1)
          : [fallback],
    };
  });
  const correctCount = answers.filter((answer) => {
    const question = questions.find((item) => item.id === answer.questionId);
    return answersAreEqual(
      answer.selectedAnswerIds,
      question.answers.filter((item) => item.correct).map((item) => item.id)
    );
  }).length;
  const startMinute = 8 + (studentIndex % 18);
  const duration = 18 + (studentIndex % 11);
  const startedAt = `${datePrefix}T08:${String(startMinute).padStart(2, '0')}`;

  return {
    id: `ATT-${assessment.id}-${String(studentIndex + 1).padStart(3, '0')}`,
    assessmentId: assessment.id,
    studentId: student.id,
    status,
    startedAt,
    submittedAt:
      status === 'IN_PROGRESS' ? null : `${datePrefix}T08:${String(startMinute + duration).padStart(2, '0')}`,
    answers: status === 'IN_PROGRESS' ? answers.slice(0, Math.max(1, Math.ceil(answers.length / 2))) : answers,
    autoScore:
      status === 'IN_PROGRESS' ? null : Number(((correctCount / questions.length) * assessment.totalScore).toFixed(2)),
    adjustedScore: null,
    adjustmentReason: '',
    lecturerComment: '',
  };
};

const class01Students = lecturerStudents.filter((student) => student.className === 'D23CQCN01-B');
const openAssessment = assessments.find((assessment) => assessment.id === 'ASM001');
const closedAssessment = assessments.find((assessment) => assessment.id === 'ASM008');

export const assessmentAttempts = [
  ...class01Students.slice(0, 35).map((student, index) =>
    createAttempt({
      assessment: openAssessment,
      student,
      studentIndex: index,
      status: index >= 33 ? 'LATE' : 'SUBMITTED',
      datePrefix: index >= 33 ? '2026-09-25' : '2026-09-22',
    })
  ),
  ...class01Students.slice(35, 38).map((student, index) =>
    createAttempt({
      assessment: openAssessment,
      student,
      studentIndex: index + 35,
      status: 'IN_PROGRESS',
      datePrefix: '2026-09-22',
    })
  ),
  ...class01Students.map((student, index) =>
    createAttempt({
      assessment: closedAssessment,
      student,
      studentIndex: index,
      status: index >= 39 ? 'LATE' : 'SUBMITTED',
      datePrefix: index >= 39 ? '2026-09-08' : '2026-09-05',
    })
  ),
];

export const gradingQueue = [
  {
    id: 1,
    student: 'Nguyễn Văn A',
    assignment: 'Bài tập Công và năng lượng',
    className: 'D23CQCN01-B',
    submitted: '20/09 · 21:14',
    status: 'Chờ chấm',
  },
  {
    id: 2,
    student: 'Trần Minh Anh',
    assignment: 'Bài tập Công và năng lượng',
    className: 'D23CQCN01-B',
    submitted: '20/09 · 20:48',
    status: 'Chờ chấm',
  },
  {
    id: 3,
    student: 'Phạm Thu Hà',
    assignment: 'Kiểm tra Chương 2',
    className: 'D23CQCN01-B',
    submitted: '20/09 · 18:22',
    status: 'Cần xem lại',
  },
  {
    id: 4,
    student: 'Lê Hoàng Nam',
    assignment: 'Bài tập Chương 1',
    className: 'D23CQCN02-B',
    submitted: '19/09 · 22:05',
    status: 'Đã chấm',
  },
];

export const lecturerLabs = [
  {
    id: 1,
    code: 'TN01',
    title: 'Khảo sát chuyển động thẳng biến đổi đều',
    classes: 3,
    sessions: 6,
    completion: 88,
    status: 'Đang hoạt động',
  },
  {
    id: 2,
    code: 'TN02',
    title: 'Lực ma sát trên mặt phẳng nghiêng',
    classes: 2,
    sessions: 4,
    completion: 64,
    status: 'Đang hoạt động',
  },
  {
    id: 3,
    code: 'TN03',
    title: 'Va chạm đàn hồi và không đàn hồi',
    classes: 3,
    sessions: 5,
    completion: 35,
    status: 'Đang chuẩn bị',
  },
];

export const labReports = [
  {
    id: 1,
    student: 'Nguyễn Văn A',
    lab: 'TN01 · Chuyển động thẳng',
    className: 'D23CQCN01-B',
    submitted: '20/09/2026',
    score: '—',
    status: 'Chờ chấm',
  },
  {
    id: 2,
    student: 'Trần Minh Anh',
    lab: 'TN01 · Chuyển động thẳng',
    className: 'D23CQCN01-B',
    submitted: '20/09/2026',
    score: '9.0',
    status: 'Đã chấm',
  },
  {
    id: 3,
    student: 'Phạm Thu Hà',
    lab: 'TN02 · Mặt phẳng nghiêng',
    className: 'D23CQCN01-B',
    submitted: '19/09/2026',
    score: '—',
    status: 'Cần bổ sung',
  },
];

export const lecturerLabMetadata = {
  LAB001: {
    chapter: 'Chương 1 · Động học chất điểm',
    objective: 'Quan sát và ghi nhận dữ liệu của chuyển động thẳng biến đổi đều.',
    description: 'Thực hành theo mô phỏng chuyển động thẳng biến đổi đều hiện có trong Phòng thí nghiệm 3D.',
    duration: 45,
    instructions: [
      'Thiết lập mô phỏng theo hướng dẫn.',
      'Thực hiện nhiều lần đo.',
      'Lưu bảng số liệu và viết kết luận.',
    ],
    measurements: ['Quãng đường', 'Thời gian', 'Vận tốc', 'Gia tốc'],
    parameters: ['Điều kiện chuyển động', 'Thời gian quan sát'],
  },
  LAB002: {
    chapter: 'Chương 2 · Động lực học chất điểm',
    objective: 'Khảo sát lực ma sát và chuyển động của vật trên mặt phẳng nghiêng.',
    description: 'Sử dụng mô phỏng mặt phẳng nghiêng hiện có để thu thập và đối chiếu số liệu.',
    duration: 50,
    instructions: [
      'Thiết lập góc dốc ban đầu.',
      'Đo thời gian chuyển động.',
      'Thay đổi góc nghiêng.',
      'Thu thập số liệu.',
      'Viết kết luận.',
    ],
    measurements: ['Quãng đường', 'Thời gian', 'Vận tốc', 'Gia tốc'],
    parameters: ['Góc nghiêng', 'Hệ số ma sát', 'Khối lượng vật'],
  },
  LAB003: {
    chapter: 'Chương 4 · Động lượng',
    objective: 'Quan sát các trường hợp va chạm đàn hồi và không đàn hồi trong mô phỏng hiện có.',
    description: 'Thực hiện các phiên mô phỏng va chạm và ghi nhận dữ liệu trước, sau va chạm.',
    duration: 50,
    instructions: [
      'Thiết lập trạng thái ban đầu.',
      'Chạy mô phỏng va chạm.',
      'Lưu dữ liệu quan sát.',
      'Nhận xét kết quả.',
    ],
    measurements: ['Vận tốc trước va chạm', 'Vận tốc sau va chạm', 'Khối lượng'],
    parameters: ['Loại va chạm', 'Trạng thái ban đầu'],
  },
  LAB004: {
    chapter: 'Chương 5 · Chuyển động quay',
    objective: 'Quan sát chuyển động của con lắc vật lý thuận nghịch Kater trong mô phỏng hiện có.',
    description: 'Thực hiện quy trình đo của thí nghiệm con lắc vật lý thuận nghịch Kater.',
    duration: 60,
    instructions: ['Thiết lập con lắc.', 'Tiến hành các lần đo.', 'Lưu bảng số liệu.', 'Nhận xét và kết luận.'],
    measurements: ['Thời gian', 'Chu kỳ', 'Số lần dao động'],
    parameters: ['Cấu hình con lắc', 'Thời gian quan sát'],
  },
};

export const labAssignmentStatusMeta = {
  DRAFT: { label: 'Bản nháp', tone: 'neutral' },
  SCHEDULED: { label: 'Sắp diễn ra', tone: 'warning' },
  OPEN: { label: 'Đang mở', tone: 'success' },
  CLOSED: { label: 'Đã kết thúc', tone: 'neutral' },
};

export const labSubmissionStatusMeta = {
  NOT_STARTED: { label: 'Chưa bắt đầu', tone: 'neutral' },
  IN_PROGRESS: { label: 'Đang thực hiện', tone: 'warning' },
  SUBMITTED: { label: 'Đã nộp', tone: 'success' },
  LATE: { label: 'Nộp muộn', tone: 'primary' },
  GRADED: { label: 'Đã chấm', tone: 'success' },
};

export const labEvidenceLabels = {
  REPORT: 'Báo cáo thí nghiệm',
  SCREENSHOT: 'Ảnh chụp kết quả mô phỏng',
  MEASUREMENT_DATA: 'Bảng số liệu đo',
  CHART: 'Biểu đồ kết quả',
  CONCLUSION: 'Nhận xét và kết luận',
};

export const labAssignments = [
  {
    id: 'LABASM001',
    labId: 'LAB001',
    classIds: ['D23CQCN01-B'],
    title: 'Bài TN 01 · Khảo sát chuyển động thẳng biến đổi đều',
    instructions: 'Thực hiện mô phỏng tối thiểu ba lần, lưu bảng số liệu và nộp báo cáo.',
    startAt: '2026-09-20T08:00',
    dueAt: '2026-09-25T23:59',
    requiredEvidence: ['REPORT', 'SCREENSHOT', 'MEASUREMENT_DATA', 'CHART', 'CONCLUSION'],
    attemptsAllowed: 3,
    rubricId: 'DEFAULT_LAB_RUBRIC',
    status: 'OPEN',
  },
  {
    id: 'LABASM002',
    labId: 'LAB002',
    classIds: ['D23CQCN01-B'],
    title: 'Bài TN 02 · Khảo sát lực ma sát và chuyển động trên mặt phẳng nghiêng',
    instructions: 'Thay đổi góc nghiêng, thực hiện các lần đo và giải thích số liệu quan sát được.',
    startAt: '2026-09-10T08:00',
    dueAt: '2026-09-18T23:59',
    requiredEvidence: ['REPORT', 'SCREENSHOT', 'MEASUREMENT_DATA', 'CONCLUSION'],
    attemptsAllowed: 'UNLIMITED',
    rubricId: 'DEFAULT_LAB_RUBRIC',
    status: 'CLOSED',
  },
  {
    id: 'LABASM003',
    labId: 'LAB003',
    classIds: ['D23CQCN03-B'],
    title: 'Bài TN 03 · Va chạm đàn hồi và không đàn hồi',
    instructions: 'Chuẩn bị các trường hợp mô phỏng theo hướng dẫn trước khi phiên thực hành mở.',
    startAt: '2026-09-27T08:00',
    dueAt: '2026-10-03T23:59',
    requiredEvidence: ['REPORT', 'MEASUREMENT_DATA', 'CONCLUSION'],
    attemptsAllowed: 2,
    rubricId: 'DEFAULT_LAB_RUBRIC',
    status: 'SCHEDULED',
  },
  {
    id: 'LABASM004',
    labId: 'LAB004',
    classIds: ['D23CQCN02-B'],
    title: 'Bài TN 04 · Con lắc vật lý thuận nghịch Kater',
    instructions: 'Bản nháp phân công thí nghiệm, chưa phát hành cho lớp.',
    startAt: '2026-10-05T08:00',
    dueAt: '2026-10-10T23:59',
    requiredEvidence: ['REPORT', 'MEASUREMENT_DATA', 'CHART', 'CONCLUSION'],
    attemptsAllowed: 3,
    rubricId: 'DEFAULT_LAB_RUBRIC',
    status: 'DRAFT',
  },
];

const createLabSubmission = ({ assignmentId, student, index, status, labId }) => ({
  id: `LABSUB-${assignmentId}-${String(index + 1).padStart(3, '0')}`,
  assignmentId,
  studentId: student.id,
  status,
  startedAt: `2026-09-${labId === 'LAB002' ? '12' : '21'}T08:${String(10 + (index % 30)).padStart(2, '0')}`,
  submittedAt: ['SUBMITTED', 'LATE', 'GRADED'].includes(status)
    ? `2026-09-${status === 'LATE' ? '26' : labId === 'LAB002' ? '12' : '21'}T${String(9 + (index % 3)).padStart(2, '0')}:${String(12 + (index % 30)).padStart(2, '0')}`
    : null,
  attemptCount: 1 + (index % 3),
  gradingStatus: 'PENDING',
  evidence: {
    report: ['SUBMITTED', 'LATE', 'GRADED'].includes(status)
      ? {
          fileName: `bao-cao-${student.id.toLowerCase()}.pdf`,
          fileType: 'PDF',
          fileSize: `${1.2 + (index % 5) * 0.3} MB`,
          uploadedAt: `2026-09-21T${String(9 + (index % 3)).padStart(2, '0')}:20`,
          demoOnly: true,
        }
      : null,
    screenshots: ['SUBMITTED', 'LATE', 'GRADED'].includes(status)
      ? [{ id: `IMG-${index + 1}`, label: 'Ảnh kết quả mô phỏng', url: null }]
      : [],
    measurements:
      labId === 'LAB002'
        ? [
            { trial: 1, distance: '0.50 m', time: '0.46 s', velocity: '1.09 m/s', acceleration: '4.74 m/s²' },
            { trial: 2, distance: '0.50 m', time: '0.45 s', velocity: '1.11 m/s', acceleration: '4.92 m/s²' },
            { trial: 3, distance: '0.50 m', time: '0.44 s', velocity: '1.14 m/s', acceleration: '5.04 m/s²' },
          ]
        : [
            { trial: 1, distance: '0.50 m', time: '0.46 s' },
            { trial: 2, distance: '0.50 m', time: '0.45 s' },
            { trial: 3, distance: '0.50 m', time: '0.44 s' },
          ],
    conclusion: ['SUBMITTED', 'LATE', 'GRADED'].includes(status)
      ? 'Dữ liệu được ghi nhận qua ba lần thực hiện. Kết quả và nhận xét chi tiết được trình bày trong báo cáo đính kèm.'
      : '',
  },
});

const class03Students = lecturerStudents.filter((student) => student.className === 'D23CQCN03-B');

export const labSubmissions = [
  ...class01Students.slice(0, 35).map((student, index) =>
    createLabSubmission({
      assignmentId: 'LABASM001',
      student,
      index,
      status: index >= 32 ? 'LATE' : 'SUBMITTED',
      labId: 'LAB001',
    })
  ),
  ...class01Students.slice(35, 38).map((student, index) =>
    createLabSubmission({
      assignmentId: 'LABASM001',
      student,
      index: index + 35,
      status: 'IN_PROGRESS',
      labId: 'LAB001',
    })
  ),
  ...class01Students.slice(0, 40).map((student, index) =>
    createLabSubmission({
      assignmentId: 'LABASM002',
      student,
      index,
      status: index >= 37 ? 'LATE' : 'SUBMITTED',
      labId: 'LAB002',
    })
  ),
  ...class03Students
    .slice(0, 2)
    .map((student, index) =>
      createLabSubmission({ assignmentId: 'LABASM003', student, index, status: 'IN_PROGRESS', labId: 'LAB003' })
    ),
];

export const labGradingStatusMeta = {
  UNGRADED: { label: 'Chưa chấm', tone: 'neutral' },
  GRADING: { label: 'Đang chấm', tone: 'warning' },
  GRADED: { label: 'Chờ xác nhận', tone: 'primary' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'success' },
  PUBLISHED: { label: 'Đã công bố', tone: 'success' },
};

export const labRubrics = [
  {
    id: 'DEFAULT_LAB_RUBRIC',
    title: 'Rubric đánh giá báo cáo thí nghiệm',
    description:
      'Rubric minh họa frontend, kế thừa thang điểm đang hiển thị trên trang báo cáo Student; chưa phải cấu hình phê duyệt chính thức của Bộ môn.',
    maxScore: 10,
    scoreStep: 0.5,
    criteria: rubricRows.map(([name, maxScore, description], index) => ({
      id: `LAB-CRITERION-${String(index + 1).padStart(2, '0')}`,
      name,
      description,
      maxScore: Number(maxScore),
    })),
  },
];

const initialGradedSubmissions = labSubmissions
  .filter((submission) => ['SUBMITTED', 'LATE', 'GRADED'].includes(submission.status))
  .slice(0, 12);

export const labGradingResults = initialGradedSubmissions.map((submission, index) => {
  const status = index < 3 ? 'PUBLISHED' : index < 7 ? 'CONFIRMED' : index < 10 ? 'GRADED' : 'GRADING';
  const criteriaScores = labRubrics[0].criteria.map((criterion, criterionIndex) => ({
    criterionId: criterion.id,
    score: Math.max(0, criterion.maxScore - ((index + criterionIndex) % 3) * 0.5),
    comment: criterionIndex === 0 ? 'Đã thực hiện các bước chính và có ghi nhận quá trình.' : '',
  }));
  const totalScore = Number(criteriaScores.reduce((sum, item) => sum + item.score, 0).toFixed(2));
  return {
    id: `LABGRADE${String(index + 1).padStart(3, '0')}`,
    submissionId: submission.id,
    rubricId: 'DEFAULT_LAB_RUBRIC',
    status,
    criteriaScores,
    totalScore: status === 'GRADING' ? null : totalScore,
    lecturerComment:
      status === 'GRADING'
        ? 'Đang hoàn thiện nhận xét cho báo cáo.'
        : 'Báo cáo đáp ứng các yêu cầu chính của rubric minh họa.',
    gradedBy: lecturerUser.name,
    confirmedBy: ['CONFIRMED', 'PUBLISHED'].includes(status) ? lecturerUser.name : null,
    confirmedAt: ['CONFIRMED', 'PUBLISHED'].includes(status) ? '2026-09-21T15:15' : null,
    publishedAt: status === 'PUBLISHED' ? '2026-09-21T16:00' : null,
    history: [
      {
        id: `HISTORY-${index + 1}`,
        occurredAt: '2026-09-21T15:00',
        actor: lecturerUser.name,
        action: status === 'GRADING' ? 'Lưu bản nháp' : 'Dữ liệu chấm mẫu',
        fromStatus: 'UNGRADED',
        toStatus: status,
        previousScore: null,
        nextScore: status === 'GRADING' ? null : totalScore,
        reason: '',
      },
    ],
  };
});

const pendingLabReports = labSubmissions.filter(
  (submission) =>
    ['SUBMITTED', 'LATE'].includes(submission.status) &&
    !['CONFIRMED', 'PUBLISHED'].includes(
      labGradingResults.find((grading) => grading.submissionId === submission.id)?.status
    )
).length;
lecturerDashboardTasks[0].title = `${pendingLabReports} báo cáo thí nghiệm chờ chấm`;

export const labActivities = [
  {
    id: 'LABACT001',
    submissionId: 'LABSUB-LABASM001-001',
    type: 'STARTED',
    occurredAt: '2026-09-21T08:10',
    label: 'Bắt đầu thực hiện thí nghiệm',
  },
  {
    id: 'LABACT002',
    submissionId: 'LABSUB-LABASM001-001',
    type: 'SAVED',
    occurredAt: '2026-09-21T09:04',
    label: 'Lưu bảng số liệu lần cuối',
  },
  {
    id: 'LABACT003',
    submissionId: 'LABSUB-LABASM001-001',
    type: 'SUBMITTED',
    occurredAt: '2026-09-21T09:12',
    label: 'Nộp báo cáo và minh chứng',
  },
];

export const aiInsights = [
  {
    id: 1,
    icon: 'warning',
    title: 'Nhóm sinh viên có nguy cơ hụt tiến độ',
    description: '8 sinh viên có tiến độ dưới 40% trong hai tuần liên tiếp.',
    action: 'Xem danh sách',
    tone: 'warning',
  },
  {
    id: 2,
    icon: 'psychology',
    title: 'Chủ đề gây nhiều nhầm lẫn',
    description: 'Lực ma sát nghỉ có tỷ lệ trả lời sai 47%, cao nhất trong Chương 2.',
    action: 'Xem phân tích',
    tone: 'primary',
  },
  {
    id: 3,
    icon: 'auto_awesome',
    title: 'Đề xuất học liệu bổ trợ',
    description: 'AI đề xuất chia sẻ video minh họa định luật II Newton cho lớp D23CQCN02-B.',
    action: 'Xem đề xuất',
    tone: 'success',
  },
];

export const aiInsightTopics = [
  {
    id: 'TOPIC-NEWTON-2',
    name: 'Định luật II Newton',
    chapterId: 'CH2',
    materialIds: ['MAT001', 'MAT003'],
    frequentQuestionGroups: [
      'Cách xác định hợp lực tác dụng lên vật',
      'Cách tính gia tốc từ lực và khối lượng',
      'Cách phân tích lực trên mặt phẳng nghiêng',
      'Điều kiện áp dụng định luật II Newton',
    ],
  },
  {
    id: 'TOPIC-FRICTION',
    name: 'Lực ma sát',
    chapterId: 'CH2',
    materialIds: ['MAT003', 'MAT007'],
    frequentQuestionGroups: [
      'Phân biệt ma sát nghỉ và ma sát trượt',
      'Cách xác định phản lực pháp tuyến',
      'Điều kiện vật bắt đầu trượt',
      'Lực ma sát lăn trong mô hình thực tế',
    ],
  },
  {
    id: 'TOPIC-PROJECTILE',
    name: 'Chuyển động ném xiên',
    chapterId: 'CH1',
    materialIds: ['MAT002', 'MAT006'],
    frequentQuestionGroups: [
      'Phân tích vận tốc theo hai phương',
      'Xác định thời gian bay',
      'Tìm tầm xa và độ cao cực đại',
    ],
  },
  {
    id: 'TOPIC-ENERGY',
    name: 'Bảo toàn cơ năng',
    chapterId: 'CH3',
    materialIds: ['MAT009', 'MAT011'],
    frequentQuestionGroups: ['Điều kiện bảo toàn cơ năng', 'Chọn mốc thế năng', 'Bài toán có lực không bảo toàn'],
  },
  {
    id: 'TOPIC-MOMENTUM',
    name: 'Bảo toàn động lượng',
    chapterId: 'CH4',
    materialIds: ['MAT012', 'MAT014'],
    frequentQuestionGroups: [
      'Xác định hệ kín',
      'Phân biệt va chạm đàn hồi và không đàn hồi',
      'Chiếu phương trình động lượng',
    ],
  },
  {
    id: 'TOPIC-TORQUE',
    name: 'Mô men lực',
    chapterId: 'CH5',
    materialIds: ['MAT015'],
    frequentQuestionGroups: ['Xác định cánh tay đòn', 'Quy ước chiều mô men', 'Điều kiện cân bằng vật rắn'],
  },
];

const aiActivityClasses = lecturerCourses.map((course) => course.className);
const aiActivityDates = Array.from({ length: 42 }, (_, index) => {
  const date = new Date('2026-09-22T12:00:00');
  date.setDate(date.getDate() - index);
  return date.toISOString().slice(0, 10);
});

export const aiActivityAggregates = aiActivityDates.flatMap((date, dateIndex) =>
  aiInsightTopics.slice(0, 3 + (dateIndex % 4)).map((topic, topicIndex) => {
    const classId = aiActivityClasses[(dateIndex + topicIndex) % aiActivityClasses.length];
    const classStudents = lecturerStudents.filter((student) => student.className === classId);
    const uniqueCount = Math.min(classStudents.length, 4 + ((dateIndex + topicIndex * 3) % 11));
    const start = (dateIndex * 3 + topicIndex * 5) % Math.max(1, classStudents.length - uniqueCount + 1);
    const studentIds = classStudents.slice(start, start + uniqueCount).map((student) => student.id);
    const questionCount = uniqueCount + 3 + ((dateIndex * 2 + topicIndex) % 9);
    const insufficientEvidenceCount =
      topic.id === 'TOPIC-FRICTION' || topic.id === 'TOPIC-TORQUE'
        ? (dateIndex + topicIndex) % 4
        : (dateIndex + topicIndex) % 2;
    const errorCount = (dateIndex + topicIndex) % 13 === 0 ? 1 : 0;
    const citedResponseCount = Math.max(
      0,
      questionCount - insufficientEvidenceCount - errorCount - ((dateIndex + topicIndex) % 3)
    );
    const voiceCount = (dateIndex + topicIndex) % 4;
    return {
      id: `AIAGG-${date.replaceAll('-', '')}-${topicIndex + 1}`,
      courseId: 'BAS1201',
      classId,
      chapterId: topic.chapterId,
      topicId: topic.id,
      date,
      questionCount,
      studentIds,
      responseCount: questionCount,
      citedResponseCount,
      insufficientEvidenceCount,
      errorCount,
      textCount: questionCount - voiceCount,
      voiceCount,
      materialIds: topic.materialIds,
    };
  })
);

export const aiInsufficientEvidenceReasons = {
  'TOPIC-FRICTION': 'Một số nhóm câu hỏi chuyên sâu chưa có đủ học liệu đã phê duyệt để làm căn cứ trả lời.',
  'TOPIC-TORQUE': 'Nguồn đã phê duyệt liên quan còn ít so với phạm vi câu hỏi được tổng hợp.',
  DEFAULT: 'Không tìm thấy đủ học liệu đã phê duyệt phù hợp với phạm vi câu hỏi.',
};

export const aiImprovementSuggestions = [
  {
    id: 'AISUG001',
    topicId: 'TOPIC-FRICTION',
    reason: 'Có nhiều lượt hỏi và từ chối ở các câu hỏi chuyên sâu về lực ma sát.',
    status: 'NEW',
  },
  {
    id: 'AISUG002',
    topicId: 'TOPIC-TORQUE',
    reason: 'Chủ đề có ít học liệu đã phê duyệt liên quan so với hoạt động hỏi đáp.',
    status: 'REVIEWING',
  },
  {
    id: 'AISUG003',
    topicId: 'TOPIC-NEWTON-2',
    reason: 'Lượt hỏi cao; cần xem xét mức độ bao phủ của học liệu hiện tại.',
    status: 'RESOLVED',
  },
];

export const weeklyEngagement = [62, 68, 71, 66, 78, 81, 84, 79];
