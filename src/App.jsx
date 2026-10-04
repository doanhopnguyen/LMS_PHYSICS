import React, { useEffect, useState } from 'react';
import { LecturerExperimentGradingPage } from './pages/lecturers/LecturerExperimentGrading.jsx';
import { useAdaptiveCorners } from './hooks/useAdaptiveCorners.js';
import { getCleanRoute, getPageFile } from './lib/routes.js';
import { LoginPage } from './pages/LoginPage.jsx';
import { AccountPage } from './pages/AccountPage.jsx';
import { NotificationDetailPage } from './pages/NotificationDetailPage.jsx';
import { OperationsPage } from './pages/admin/OperationsPage.jsx';
import { UsersPage } from './pages/admin/UsersPage.jsx';
import { DashboardPage } from './pages/students/DashboardPage.jsx';
import { CourseDetailPage } from './pages/students/CourseDetailPage.jsx';
import { LearningModulePage } from './pages/students/LearningModulePage.jsx';
import { ExamPracticePage } from './pages/students/ExamPracticePage.jsx';
import { ExamResultsPage } from './pages/students/ExamResultsPage.jsx';
import { LabReportPage } from './pages/students/LabReportPage.jsx';
import { LearningResultsPage } from './pages/students/LearningResultsPage.jsx';
import { MyCoursesPage } from './pages/students/MyCoursesPage.jsx';
import { VirtualLabPage } from './pages/students/VirtualLabPage.jsx';
import { VoiceCitationsPage } from './pages/students/VoiceCitationsPage.jsx';
import { WorkspacePage } from './pages/students/WorkspacePage.jsx';
import { AiTutorPage } from './pages/students/AiTutorPage.jsx';
import { DocumentViewerPage } from './pages/students/DocumentViewerPage.jsx';
import { ExamSessionPage } from './pages/students/ExamSessionPage.jsx';
import { InteractiveLessonPage } from './pages/students/InteractiveLessonPage.jsx';
import { MobileExperiencePage } from './pages/students/MobileExperiencePage.jsx';
import {
  LecturerAnalyticsApiPage,
  LecturerAssessmentApiPage,
  LecturerMatrixCreatePage,
  LecturerDashboardApiPage,
  LecturerExperimentsApiPage,
  LecturerGradingApiPage,
} from './pages/lecturers/LecturerApiWorkspace.jsx';
import { LecturerAuthoringApiPage } from './pages/lecturers/LecturerContent.jsx';
import { LecturerClassesApiPage, LecturerClassDetail } from './pages/lecturers/LecturerClasses.jsx';
import { AdminDashboardPage } from './pages/admin/AdminPages.jsx';
import { AdminAcademicsApiPage } from './pages/admin/AdminAcademicsApiPage.jsx';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage.jsx';
import { AdminQuestionsApiPage } from './pages/admin/AdminQuestionsApiPage.jsx';
import { AdminMaterialsPage } from './pages/admin/AdminMaterialsPage.jsx';
import { AdminAssessmentsPage } from './pages/admin/AdminAssessmentsPage.jsx';
import { StudentEvidencePage } from './pages/students/StudentEvidencePage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ResetPasswordPage } from './pages/ResetPasswordPage.jsx';
import { TADashboardApiPage, TAWorkQueueApiPage } from './pages/ta/TAPagesApi.jsx';
import { TAClassSupportTabsPage } from './pages/ta/TAClassSupportTabsPage.jsx';
import { RoleAccessPage } from './pages/RoleAccessPage.jsx';
import { ErrorPage } from './pages/ErrorPage.jsx';
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
  'my_courses.html': MyCoursesPage,
  'profile_settings.html': AccountPage,
  'account.html': AccountPage,
  'notification_detail.html': NotificationDetailPage,
  'virtual_lab.html': VirtualLabPage,
  'voice_citations.html': VoiceCitationsPage,
  '3d_workspace.html': WorkspacePage,
  'ai_tutor.html': AiTutorPage,
  'document_viewer.html': DocumentViewerPage,
  'exam_session.html': ExamSessionPage,
  'interactive_lesson.html': InteractiveLessonPage,
  'mobile_experience.html': MobileExperiencePage,
  'lecturer_dashboard.html': LecturerDashboardApiPage,
  'lecturer_courses.html': LecturerClassesApiPage,
  'lecturer_course_detail.html': LecturerClassDetail,
  'lecturer_materials.html': () => <LecturerAuthoringApiPage kind="materials" />,
  'lecturer_question_bank.html': () => <LecturerAuthoringApiPage kind="questions" />,
  'lecturer_assessments.html': LecturerAssessmentApiPage,
  'lecturer_exam_create.html': () => <LecturerAssessmentApiPage createPage />,
  'lecturer_matrix_create.html': LecturerMatrixCreatePage,
  'lecturer_material_create.html': () => <LecturerAuthoringApiPage kind="materials" createPage />,
  'lecturer_assessment_results.html': LecturerAssessmentApiPage,
  'lecturer_attempt_detail.html': LecturerAssessmentApiPage,
  'lecturer_grading.html': LecturerGradingApiPage,
  'lecturer_labs.html': LecturerExperimentsApiPage,
  'lecturer_lab_assignment_detail.html': LecturerExperimentsApiPage,
  'lecturer_lab_submission_detail.html': LecturerExperimentGradingPage,
  'lecturer_lab_grading.html': LecturerExperimentGradingPage,
  'lecturer_ai_insights.html': LecturerAnalyticsApiPage,
  'lecturer_analytics.html': LecturerAnalyticsApiPage,
  'admin_dashboard.html': AdminDashboardPage,
  'admin_users.html': UsersPage,
  'admin_academics.html': AdminAcademicsApiPage,
  'admin_questions.html': AdminQuestionsApiPage,
  'admin_materials.html': AdminMaterialsPage,
  'admin_assessments.html': AdminAssessmentsPage,
  'admin_operations.html': OperationsPage,
  'admin_analytics.html': AdminAnalyticsPage,
  'ta_dashboard.html': TADashboardApiPage,
  'ta_work_queue.html': TAWorkQueueApiPage,
  'student_evidence.html': StudentEvidencePage,
  'auth_access.html': ResetPasswordPage,
  'register.html': RegisterPage,
  'reset_password.html': ResetPasswordPage,
  'ta_class_support.html': TAClassSupportTabsPage,
  '403.html': () => <ErrorPage status={403} session={getDemoSession()} />,
  '404.html': () => <ErrorPage status={404} session={getDemoSession()} />,
};

function App() {
  useAdaptiveCorners();
  const isRootEntry = () => ['/', '/index.html'].includes(window.location.pathname);
  const [file, setFile] = useState(() => {
    const session = getDemoSession();
    return isRootEntry() && session?.home ? session.home : getPageFile();
  });
  const [locationKey, setLocationKey] = useState(() => window.location.href);

  useEffect(() => {
    const session = getDemoSession();
    const cleanPath = isRootEntry() && session?.home ? getCleanRoute(`/${session.home}`) : getCleanRoute();
    if (cleanPath !== window.location.pathname) {
      window.history.replaceState(
        window.history.state,
        '',
        `${cleanPath}${window.location.search}${window.location.hash}`
      );
    }

    const onPopState = () => {
      setFile(getPageFile());
      setLocationKey(window.location.href);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const session = getDemoSession();
  const Page = pageComponents[file] ?? pageComponents['login.html'];
  if (
    !['login.html', 'auth_access.html', 'register.html', 'reset_password.html', '403.html', '404.html'].includes(
      file
    ) &&
    (!session || !canAccess(session.role, file))
  ) {
    return <RoleAccessPage session={session} requestedPage={file} />;
  }
  return <Page key={locationKey} />;
}

export default App;
