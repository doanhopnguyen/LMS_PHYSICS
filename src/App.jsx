import React, { Suspense, lazy, useEffect, useState } from 'react';

import { useAdaptiveCorners } from './hooks/useAdaptiveCorners.js';
import { getCleanRoute, getPageFile } from './lib/routes.js';

import { LoadingIndicator } from './components/LoadingIndicator.jsx';
import { canAccess, getDemoSession } from './lib/demoSession.js';

const LecturerExperimentGradingPage = lazy(() =>
  import('./pages/lecturers/LecturerExperimentGrading.jsx').then((module) => ({
    default: module.LecturerExperimentGradingPage,
  }))
);
const LoginPage = lazy(() => import('./pages/LoginPage.jsx').then((module) => ({ default: module.LoginPage })));
const AccountPage = lazy(() => import('./pages/AccountPage.jsx').then((module) => ({ default: module.AccountPage })));
const NotificationDetailPage = lazy(() =>
  import('./pages/NotificationDetailPage.jsx').then((module) => ({ default: module.NotificationDetailPage }))
);
const OperationsPage = lazy(() =>
  import('./pages/admin/OperationsPage.jsx').then((module) => ({ default: module.OperationsPage }))
);
const UsersPage = lazy(() => import('./pages/admin/UsersPage.jsx').then((module) => ({ default: module.UsersPage })));
const DashboardPage = lazy(() =>
  import('./pages/students/DashboardPage.jsx').then((module) => ({ default: module.DashboardPage }))
);
const CourseDetailPage = lazy(() =>
  import('./pages/students/CourseDetailPage.jsx').then((module) => ({ default: module.CourseDetailPage }))
);
const LearningModulePage = lazy(() =>
  import('./pages/students/LearningModulePage.jsx').then((module) => ({ default: module.LearningModulePage }))
);
const ExamPracticePage = lazy(() =>
  import('./pages/students/ExamPracticePage.jsx').then((module) => ({ default: module.ExamPracticePage }))
);
const ExamResultsPage = lazy(() =>
  import('./pages/students/ExamResultsPage.jsx').then((module) => ({ default: module.ExamResultsPage }))
);
const LabReportPage = lazy(() =>
  import('./pages/students/LabReportPage.jsx').then((module) => ({ default: module.LabReportPage }))
);
const LearningResultsPage = lazy(() =>
  import('./pages/students/LearningResultsPage.jsx').then((module) => ({ default: module.LearningResultsPage }))
);
const MyCoursesPage = lazy(() =>
  import('./pages/students/MyCoursesPage.jsx').then((module) => ({ default: module.MyCoursesPage }))
);
const VirtualLabPage = lazy(() =>
  import('./pages/students/VirtualLabPage.jsx').then((module) => ({ default: module.VirtualLabPage }))
);
const VoiceCitationsPage = lazy(() =>
  import('./pages/students/VoiceCitationsPage.jsx').then((module) => ({ default: module.VoiceCitationsPage }))
);
const WorkspacePage = lazy(() =>
  import('./pages/students/WorkspacePage.jsx').then((module) => ({ default: module.WorkspacePage }))
);
const AiTutorPage = lazy(() =>
  import('./pages/students/AiTutorPage.jsx').then((module) => ({ default: module.AiTutorPage }))
);
const DocumentViewerPage = lazy(() =>
  import('./pages/students/DocumentViewerPage.jsx').then((module) => ({ default: module.DocumentViewerPage }))
);
const ExamSessionPage = lazy(() =>
  import('./pages/students/ExamSessionPage.jsx').then((module) => ({ default: module.ExamSessionPage }))
);
const InteractiveLessonPage = lazy(() =>
  import('./pages/students/InteractiveLessonPage.jsx').then((module) => ({ default: module.InteractiveLessonPage }))
);
const MobileExperiencePage = lazy(() =>
  import('./pages/students/MobileExperiencePage.jsx').then((module) => ({ default: module.MobileExperiencePage }))
);
const LecturerAssessmentApiPage = lazy(() =>
  import('./pages/lecturers/LecturerApiWorkspace.jsx').then((module) => ({ default: module.LecturerAssessmentApiPage }))
);
const LecturerMatrixCreatePage = lazy(() =>
  import('./pages/lecturers/LecturerApiWorkspace.jsx').then((module) => ({ default: module.LecturerMatrixCreatePage }))
);
const LecturerDashboardApiPage = lazy(() =>
  import('./pages/lecturers/LecturerApiWorkspace.jsx').then((module) => ({ default: module.LecturerDashboardApiPage }))
);
const LecturerExperimentsApiPage = lazy(() =>
  import('./pages/lecturers/LecturerApiWorkspace.jsx').then((module) => ({
    default: module.LecturerExperimentsApiPage,
  }))
);
const LecturerGradingApiPage = lazy(() =>
  import('./pages/lecturers/LecturerApiWorkspace.jsx').then((module) => ({ default: module.LecturerGradingApiPage }))
);
const LecturerAuthoringApiPage = lazy(() =>
  import('./pages/lecturers/LecturerContent.jsx').then((module) => ({ default: module.LecturerAuthoringApiPage }))
);
const LecturerQuestionWorkspace = lazy(() =>
  import('./pages/lecturers/LecturerQuestionWorkspace.jsx').then((module) => ({
    default: module.LecturerQuestionWorkspace,
  }))
);
const LecturerClassesApiPage = lazy(() =>
  import('./pages/lecturers/LecturerClasses.jsx').then((module) => ({ default: module.LecturerClassesApiPage }))
);
const LecturerClassDetail = lazy(() =>
  import('./pages/lecturers/LecturerClasses.jsx').then((module) => ({ default: module.LecturerClassDetail }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminPages.jsx').then((module) => ({ default: module.AdminDashboardPage }))
);
const AdminSemestersPage = lazy(() =>
  import('./pages/admin/AdminAcademicManagement.jsx').then((module) => ({ default: module.AdminSemestersPage }))
);
const AdminSubjectsPage = lazy(() =>
  import('./pages/admin/AdminAcademicManagement.jsx').then((module) => ({ default: module.AdminSubjectsPage }))
);
const AdminSubjectDetailPage = lazy(() =>
  import('./pages/admin/AdminAcademicManagement.jsx').then((module) => ({ default: module.AdminSubjectDetailPage }))
);
const AdminClassesPage = lazy(() =>
  import('./pages/admin/AdminClassManagement.jsx').then((module) => ({ default: module.AdminClassesPage }))
);
const AdminClassDetailPage = lazy(() =>
  import('./pages/admin/AdminClassManagement.jsx').then((module) => ({ default: module.AdminClassDetailPage }))
);
const AdminClassCreatePage = lazy(() =>
  import('./pages/admin/AdminClassManagement.jsx').then((module) => ({ default: module.AdminClassCreatePage }))
);
const AdminAnalyticsPage = lazy(() =>
  import('./pages/admin/AdminAnalyticsPage.jsx').then((module) => ({ default: module.AdminAnalyticsPage }))
);
const AdminQuestionsApiPage = lazy(() =>
  import('./pages/admin/AdminQuestionsApiPage.jsx').then((module) => ({ default: module.AdminQuestionsApiPage }))
);
const AdminContentReviewPage = lazy(() =>
  import('./pages/admin/AdminContentReviewPage.jsx').then((module) => ({ default: module.AdminContentReviewPage }))
);
const AdminAssessmentsPage = lazy(() =>
  import('./pages/admin/AdminAssessmentsPage.jsx').then((module) => ({ default: module.AdminAssessmentsPage }))
);
const StudentEvidencePage = lazy(() =>
  import('./pages/students/StudentEvidencePage.jsx').then((module) => ({ default: module.StudentEvidencePage }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage.jsx').then((module) => ({ default: module.RegisterPage }))
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage.jsx').then((module) => ({ default: module.ResetPasswordPage }))
);
const TADashboardApiPage = lazy(() =>
  import('./pages/ta/TAPagesApi.jsx').then((module) => ({ default: module.TADashboardApiPage }))
);
const TAWorkQueueApiPage = lazy(() =>
  import('./pages/ta/TAPagesApi.jsx').then((module) => ({ default: module.TAWorkQueueApiPage }))
);
const TAClassSupportTabsPage = lazy(() =>
  import('./pages/ta/TAClassSupportTabsPage.jsx').then((module) => ({ default: module.TAClassSupportTabsPage }))
);
const RoleAccessPage = lazy(() =>
  import('./pages/RoleAccessPage.jsx').then((module) => ({ default: module.RoleAccessPage }))
);
const ErrorPage = lazy(() => import('./pages/ErrorPage.jsx').then((module) => ({ default: module.ErrorPage })));

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
  'lecturer_question_bank.html': LecturerQuestionWorkspace,
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
  'admin_dashboard.html': AdminDashboardPage,
  'admin_users.html': UsersPage,
  'admin_academics.html': AdminSemestersPage,
  'admin_subjects.html': AdminSubjectsPage,
  'admin_subject_detail.html': AdminSubjectDetailPage,
  'admin_classes.html': AdminClassesPage,
  'admin_class_detail.html': AdminClassDetailPage,
  'admin_class_create.html': AdminClassCreatePage,
  'admin_questions.html': AdminQuestionsApiPage,
  'admin_materials.html': AdminContentReviewPage,
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
    return (
      <Suspense fallback={<LoadingIndicator size="large" className="ptit-loading--page" />}>
        <RoleAccessPage session={session} requestedPage={file} />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<LoadingIndicator size="large" className="ptit-loading--page" />}>
      <Page key={locationKey} />
    </Suspense>
  );
}

export default App;
