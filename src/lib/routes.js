export const routeFiles = [
  'login.html',
  'account.html',
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
  'lecturer_dashboard.html',
  'lecturer_courses.html',
  'lecturer_course_detail.html',
  'lecturer_students.html',
  'lecturer_student_detail.html',
  'lecturer_materials.html',
  'lecturer_question_bank.html',
  'lecturer_assessments.html',
  'lecturer_assessment_results.html',
  'lecturer_attempt_detail.html',
  'lecturer_grading.html',
  'lecturer_labs.html',
  'lecturer_lab_assignment_detail.html',
  'lecturer_lab_submission_detail.html',
  'lecturer_lab_grading.html',
  'lecturer_ai_insights.html',
  'lecturer_analytics.html',
  'admin_dashboard.html',
  'admin_users.html',
  'admin_academics.html',
  'admin_operations.html',
  'ta_dashboard.html',
  'ta_work_queue.html',
  'admin_analytics.html',
  'student_evidence.html',
  'lecturer_class_operations.html',
  'auth_access.html',
  'register.html',
  'reset_password.html',
  'ta_class_support.html',
];

export function getPageFile(pathname = window.location.pathname) {
  const route = pathname.split('/').filter(Boolean).pop();
  if (!route || route === 'index.html') return 'login.html';
  const file = route.endsWith('.html') ? route : `${route}.html`;
  return routeFiles.includes(file) ? file : 'dashboard.html';
}

export function getCleanRoute(path = window.location.pathname) {
  return path.replace(/\.html(?=[/?#]|$)/, '');
}
