const groups = {
  admin: { role: 'ADMIN', collections: ['subjects', 'semesters', 'classes', 'contributions', 'users'] },
  teacher: { role: 'INSTRUCTOR', collections: ['classes', 'contributions'] },
  student: { role: 'STUDENT', collections: ['classes'] },
};
export function resolveLmsRoute(pathname) {
  const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  const group = groups[parts[0]];
  if (!group) return null;
  const [area, collection, id, section, topicId] = parts;
  let valid = group.collections.includes(collection);
  if (collection !== 'classes' && collection !== 'subjects') valid &&= parts.length === 2;
  if (collection === 'subjects') valid &&= area === 'admin' && parts.length <= 4 && (!section || ['curriculum', 'banks', 'labs'].includes(section));
  if (collection === 'classes') {
    const sections = area === 'teacher' ? ['overview', 'students', 'curriculum', 'assignments', 'labs', 'grades', 'materials'] : area === 'student' ? ['learn', 'assignments', 'labs', 'grades'] : [];
    valid &&= (!section || sections.includes(section)) && parts.length <= (section === 'learn' ? 5 : 4);
    if (id === 'new') valid &&= area === 'admin' && parts.length === 3;
  }
  return { area, role: group.role, collection, id, section, topicId, valid };
}
export const menuByRole = {
  ADMIN: [['/admin/subjects', 'menu_book', 'Môn học'], ['/admin/semesters', 'event', 'Học kỳ'], ['/admin/classes', 'school', 'Lớp học'], ['/admin/contributions', 'fact_check', 'Duyệt đóng góp'], ['/admin/users', 'manage_accounts', 'Người dùng'], ['/admin_assessments', 'assignment', 'Ma trận & đề thi']],
  INSTRUCTOR: [['/teacher/classes', 'school', 'Lớp của tôi'], ['/teacher/contributions', 'upload_file', 'Đóng góp']],
  STUDENT: [['/student/classes', 'school', 'Lớp của tôi'], ['/exam_practice_center', 'fitness_center', 'Ôn luyện'], ['/account', 'manage_accounts', 'Tài khoản']],
};
