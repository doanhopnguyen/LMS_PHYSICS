export const routeFiles = [
  'login.html',
  'dashboard.html',
  'course_detail.html',
  'learning_module.html',
  'exam_practice_center.html',
  'exam_results.html',
  'lab_report_rubric.html',
  'learning_results.html',
  'library.html',
  'my_courses.html',
  'notifications_help.html',
  'profile_settings.html',
  'virtual_lab.html',
  'voice_citations.html',
  '3d_workspace.html',
  'ai_tutor.html',
  'document_viewer.html',
  'exam_session.html',
  'interactive_lesson.html',
  'mobile_experience.html',
];

export function getPageFile(pathname = window.location.pathname) {
  const file = pathname.split('/').filter(Boolean).pop();
  if (!file || file === 'index.html') return 'login.html';
  return routeFiles.includes(file) ? file : 'dashboard.html';
}
