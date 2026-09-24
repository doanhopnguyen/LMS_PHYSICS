import React, { useEffect, useState } from 'react';
import { useAdaptiveCorners } from './hooks/useAdaptiveCorners.js';
import { getPageFile } from './lib/routes.js';
import { LoginPage } from './pages/LoginPage.jsx';
import { DashboardPage } from './pages/students/DashboardPage.jsx';
import { CourseDetailPage } from './pages/students/CourseDetailPage.jsx';
import { LearningModulePage } from './pages/students/LearningModulePage.jsx';
import { ExamPracticePage } from './pages/students/ExamPracticePage.jsx';
import { ExamResultsPage } from './pages/students/ExamResultsPage.jsx';
import { LabReportPage } from './pages/students/LabReportPage.jsx';
import { LearningResultsPage } from './pages/students/LearningResultsPage.jsx';
import { LibraryPage } from './pages/students/LibraryPage.jsx';
import { MyCoursesPage } from './pages/students/MyCoursesPage.jsx';
import { NotificationsPage } from './pages/students/NotificationsPage.jsx';
import { ProfileSettingsPage } from './pages/students/ProfileSettingsPage.jsx';
import { VirtualLabPage } from './pages/students/VirtualLabPage.jsx';
import { VoiceCitationsPage } from './pages/students/VoiceCitationsPage.jsx';
import { WorkspacePage } from './pages/students/WorkspacePage.jsx';
import { AiTutorPage } from './pages/students/AiTutorPage.jsx';
import { DocumentViewerPage } from './pages/students/DocumentViewerPage.jsx';
import { ExamSessionPage } from './pages/students/ExamSessionPage.jsx';
import { InteractiveLessonPage } from './pages/students/InteractiveLessonPage.jsx';
import { MobileExperiencePage } from './pages/students/MobileExperiencePage.jsx';
import { LecturerDashboardPage } from './pages/lecturers/LecturerDashboardPage.jsx';
import { LecturerCoursesPage } from './pages/lecturers/LecturerCoursesPage.jsx';
import { LecturerCourseDetailPage } from './pages/lecturers/LecturerCourseDetailPage.jsx';
import { LecturerStudentsPage } from './pages/lecturers/LecturerStudentsPage.jsx';
import { LecturerStudentDetailPage } from './pages/lecturers/LecturerStudentDetailPage.jsx';
import { LecturerMaterialsPage } from './pages/lecturers/LecturerMaterialsPage.jsx';
import { LecturerQuestionBankPage } from './pages/lecturers/LecturerQuestionBankPage.jsx';
import { LecturerAssessmentsPage } from './pages/lecturers/LecturerAssessmentsPage.jsx';
import { LecturerAssessmentResultsPage } from './pages/lecturers/LecturerAssessmentResultsPage.jsx';
import { LecturerAttemptDetailPage } from './pages/lecturers/LecturerAttemptDetailPage.jsx';
import { LecturerGradingPage } from './pages/lecturers/LecturerGradingPage.jsx';
import { LecturerLabsPage } from './pages/lecturers/LecturerLabsPage.jsx';
import { LecturerLabAssignmentDetailPage } from './pages/lecturers/LecturerLabAssignmentDetailPage.jsx';
import { LecturerLabSubmissionDetailPage } from './pages/lecturers/LecturerLabSubmissionDetailPage.jsx';
import { LecturerLabGradingPage } from './pages/lecturers/LecturerLabGradingPage.jsx';
import { LecturerAiInsightsPage } from './pages/lecturers/LecturerAiInsightsPage.jsx';
import { LecturerLearningAnalyticsPage } from './pages/lecturers/LecturerLearningAnalyticsPage.jsx';
import { AdminAcademicsPage, AdminContentPage, AdminDashboardPage, AdminOperationsPage, AdminUsersPage } from './pages/admin/AdminPages.jsx';
import { StudentEvidencePage } from './pages/students/StudentEvidencePage.jsx';
import { LecturerClassOperationsPage } from './pages/lecturers/LecturerClassOperationsPage.jsx';
import { AuthAccessPage } from './pages/AuthAccessPage.jsx';
import { TAClassSupportPage, TADashboardPage, TAWorkQueuePage } from './pages/ta/TAPages.jsx';
import { RoleAccessPage } from './pages/RoleAccessPage.jsx';
import { canAccess, getDemoSession } from './lib/demoSession.js';

const pageComponents = {
  'login.html': LoginPage,
  'dashboard.html': DashboardPage,
  'course_detail.html': CourseDetailPage,
  'learning_module.html': LearningModulePage,
  'exam_practice_center.html': ExamPracticePage,
  'exam_results.html': ExamResultsPage,
  'lab_report_rubric.html': LabReportPage,
  'learning_results.html': LearningResultsPage,
  'library.html': LibraryPage,
  'my_courses.html': MyCoursesPage,
  'notifications_help.html': NotificationsPage,
  'profile_settings.html': ProfileSettingsPage,
  'virtual_lab.html': VirtualLabPage,
  'voice_citations.html': VoiceCitationsPage,
  '3d_workspace.html': WorkspacePage,
  'ai_tutor.html': AiTutorPage,
  'document_viewer.html': DocumentViewerPage,
  'exam_session.html': ExamSessionPage,
  'interactive_lesson.html': InteractiveLessonPage,
  'mobile_experience.html': MobileExperiencePage,
  'lecturer_dashboard.html': LecturerDashboardPage,
  'lecturer_courses.html': LecturerCoursesPage,
  'lecturer_course_detail.html': LecturerCourseDetailPage,
  'lecturer_students.html': LecturerStudentsPage,
  'lecturer_student_detail.html': LecturerStudentDetailPage,
  'lecturer_materials.html': LecturerMaterialsPage,
  'lecturer_question_bank.html': LecturerQuestionBankPage,
  'lecturer_assessments.html': LecturerAssessmentsPage,
  'lecturer_assessment_results.html': LecturerAssessmentResultsPage,
  'lecturer_attempt_detail.html': LecturerAttemptDetailPage,
  'lecturer_grading.html': LecturerGradingPage,
  'lecturer_labs.html': LecturerLabsPage,
  'lecturer_lab_assignment_detail.html': LecturerLabAssignmentDetailPage,
  'lecturer_lab_submission_detail.html': LecturerLabSubmissionDetailPage,
  'lecturer_lab_grading.html': LecturerLabGradingPage,
  'lecturer_ai_insights.html': LecturerAiInsightsPage,
  'lecturer_analytics.html': LecturerLearningAnalyticsPage,
  'admin_dashboard.html': AdminDashboardPage,
  'admin_users.html': AdminUsersPage,
  'admin_academics.html': AdminAcademicsPage,
  'admin_operations.html': AdminOperationsPage,
  'ta_dashboard.html': TADashboardPage,
  'ta_work_queue.html': TAWorkQueuePage,
  'admin_content.html': AdminContentPage,
  'student_evidence.html': StudentEvidencePage,
  'lecturer_class_operations.html': LecturerClassOperationsPage,
  'auth_access.html': AuthAccessPage,
  'ta_class_support.html': TAClassSupportPage,
};

function App() {
  useAdaptiveCorners();
  const [file, setFile] = useState(() => getPageFile());
  const [locationKey, setLocationKey] = useState(() => window.location.href);

  useEffect(() => {
    const onPopState = () => {
      setFile(getPageFile());
      setLocationKey(window.location.href);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const session = getDemoSession();
  const Page = pageComponents[file] ?? pageComponents['login.html'];
  if (!['login.html', 'auth_access.html'].includes(file) && (!session || !canAccess(session.role, file))) {
    return <RoleAccessPage session={session} requestedPage={file} />;
  }
  return <Page key={locationKey} />;
}

export default App;
