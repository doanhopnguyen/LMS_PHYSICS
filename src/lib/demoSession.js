const key = 'ptit-physics-demo-session';

export const demoRoles = {
  STUDENT: { label: 'Sinh viên', home: 'dashboard.html', initials: 'VA', detail: 'B23DCCN001', name: 'Nguyễn Văn A' },
  INSTRUCTOR: { label: 'Giảng viên', home: 'lecturer_dashboard.html', initials: 'VB', detail: 'Bộ môn Vật lý', name: 'TS. Nguyễn Văn B' },
  TA: { label: 'Trợ giảng', home: 'ta_dashboard.html', initials: 'MA', detail: 'Lớp D23CQCN01-B', name: 'Trần Minh Anh' },
  ADMIN: { label: 'Quản trị viên', home: 'admin_dashboard.html', initials: 'QT', detail: 'Quản trị hệ thống', name: 'Nguyễn Quang T.' },
};

export function getDemoSession() {
  try {
    const stored = window.localStorage.getItem(key);
    const session = stored?.startsWith('{') ? JSON.parse(stored) : { role: stored };
    const base = demoRoles[session?.role];
    return base ? { ...base, ...session } : null;
  } catch {
    return null;
  }
}

export function setDemoSession(role) {
  window.localStorage.setItem(key, JSON.stringify({ role }));
  return { role, ...demoRoles[role] };
}

export function setAuthenticatedSession(user, profile = {}) {
  const role = user?.role;
  if (!demoRoles[role]) throw new Error('Vai trò tài khoản không được hỗ trợ.');
  const name = profile.fullName || user.username || demoRoles[role].name;
  const session = {
    role,
    userId: user.userId,
    username: user.username,
    email: user.email,
    name,
    detail: profile.studentCode || user.email || demoRoles[role].detail,
    initials: name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase() || demoRoles[role].initials,
  };
  window.localStorage.setItem(key, JSON.stringify(session));
  return { ...demoRoles[role], ...session };
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
