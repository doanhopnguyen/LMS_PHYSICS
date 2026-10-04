export const adminUser = { name: 'Nguyễn Quang T.', role: 'Quản trị viên', detail: 'Quản trị hệ thống', initials: 'QT' };

export const adminNavigation = [
  ['admin_dashboard.html', 'dashboard', 'Tổng quan'],
  ['admin_users.html', 'manage_accounts', 'Người dùng & phân quyền'],
  ['admin_academics.html', 'account_tree', 'Học kỳ & học phần'],
  ['admin_questions.html', 'quiz', 'Ngân hàng câu hỏi'],
  ['admin_materials.html', 'fact_check', 'Duyệt học liệu'],
  ['admin_assessments.html', 'assignment', 'Ma trận đề & ghi danh'],
  ['admin_analytics.html', 'analytics', 'Phân tích học tập'],
  ['admin_operations.html', 'settings', 'Cấu hình & nhật ký'],
  ['account.html', 'manage_accounts', 'Tài khoản & bảo mật'],
];

export const adminMetrics = [
  { label: 'Tài khoản hoạt động', value: '1.248', detail: '96% tổng tài khoản', icon: 'groups', tone: 'success' },
  { label: 'Lớp đang mở', value: '32', detail: 'Học kỳ 1 · 2026–2027', icon: 'school', tone: 'primary' },
  { label: 'Học liệu chờ duyệt', value: '14', detail: 'Cần giảng viên xử lý', icon: 'pending_actions', tone: 'warning' },
  { label: 'Tác vụ cần rà soát', value: '3', detail: 'Cấu hình và an toàn', icon: 'policy', tone: 'primary' },
];

export const adminUsers = [
  { id: 'B23DCCN001', name: 'Nguyễn Văn A', email: 'vana@ptit.edu.vn', role: 'STUDENT', status: 'ACTIVE', lastSeen: 'Hôm nay, 09:20' },
  { id: 'GV001', name: 'TS. Nguyễn Văn B', email: 'nguyenvanb@ptit.edu.vn', role: 'INSTRUCTOR', status: 'ACTIVE', lastSeen: 'Hôm nay, 10:04' },
  { id: 'B23DCCN014', name: 'Trần Minh Anh', email: 'minhanh@ptit.edu.vn', role: 'TA', status: 'ACTIVE', lastSeen: 'Hôm qua, 18:35' },
  { id: 'B22DCCN082', name: 'Lê Hoàng Nam', email: 'hoangnam@ptit.edu.vn', role: 'STUDENT', status: 'LOCKED', lastSeen: '18/09/2026' },
];

export const semesters = [
  { code: '2026-2027-1', name: 'Học kỳ 1 · 2026–2027', status: 'CURRENT', dates: '01/09/2026 – 31/01/2027', classes: 32 },
  { code: '2025-2026-2', name: 'Học kỳ 2 · 2025–2026', status: 'CLOSED', dates: '03/02/2026 – 30/06/2026', classes: 29 },
];

export const subjects = [
  { code: 'BAS1201', name: 'Vật lý đại cương 1', status: 'ACTIVE', topics: 8, materials: 36 },
  { code: 'BAS1202', name: 'Vật lý đại cương 2', status: 'ACTIVE', topics: 7, materials: 31 },
  { code: 'BAS1203', name: 'Thực hành Vật lý', status: 'INACTIVE', topics: 5, materials: 18 },
];

export const adminActivity = [
  { time: '10:16', actor: 'TS. Nguyễn Văn B', action: 'Gửi duyệt học liệu', target: 'Slide Chương 3' },
  { time: '09:40', actor: 'Nguyễn Quang T.', action: 'Cập nhật cấu hình', target: 'Giới hạn upload: 50 MB' },
  { time: 'Hôm qua', actor: 'Hệ thống', action: 'Tổng hợp analytics', target: 'Học kỳ 1 · 2026–2027' },
];
