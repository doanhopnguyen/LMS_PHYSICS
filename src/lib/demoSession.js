const key = 'ptit-physics-demo-session';

export const demoRoles = {
  STUDENT: { label: 'Sinh viên', home: 'dashboard.html', initials: 'VA', detail: 'B23DCCN001', name: 'Nguyễn Văn A' },
  INSTRUCTOR: { label: 'Giảng viên', home: 'lecturer_dashboard.html', initials: 'VB', detail: 'Bộ môn Vật lý', name: 'TS. Nguyễn Văn B' },
  TA: { label: 'Trợ giảng', home: 'ta_dashboard.html', initials: 'MA', detail: 'Lớp D23CQCN01-B', name: 'Trần Minh Anh' },
  ADMIN: { label: 'Quản trị viên', home: 'admin_dashboard.html', initials: 'QT', detail: 'Quản trị hệ thống', name: 'Nguyễn Quang T.' },
};

export function getDemoSession() {
  try {
    const role = window.localStorage.getItem(key);
    return demoRoles[role] ? { role, ...demoRoles[role] } : null;
  } catch {
    return null;
  }
}

export function setDemoSession(role) {
  window.localStorage.setItem(key, role);
  return { role, ...demoRoles[role] };
}

export function clearDemoSession() {
  window.localStorage.removeItem(key);
}

export function canAccess(role, file) {
  if (['login.html', 'auth_access.html'].includes(file)) return true;
  if (role === 'STUDENT') return !file.startsWith('lecturer_') && !file.startsWith('admin_') && !file.startsWith('ta_');
  if (role === 'INSTRUCTOR') return file.startsWith('lecturer_');
  if (role === 'TA') return ['ta_dashboard.html', 'ta_work_queue.html', 'ta_class_support.html'].includes(file);
  if (role === 'ADMIN') return file.startsWith('admin_');
  return false;
}
