import React, { useEffect, useState } from 'react';
import { useAdaptiveCorners } from './hooks/useAdaptiveCorners.js';
import { getCleanRoute, getPageFile } from './lib/routes.js';
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
};

function App() {
  useAdaptiveCorners();
  const [file, setFile] = useState(() => getPageFile());
  const [locationKey, setLocationKey] = useState(() => window.location.href);

  useEffect(() => {
    const cleanPath = getCleanRoute();
    if (cleanPath !== window.location.pathname) {
      window.history.replaceState({}, '', `${cleanPath}${window.location.search}${window.location.hash}`);
    }

    const onPopState = () => {
      setFile(getPageFile());
      setLocationKey(window.location.href);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const Page = pageComponents[file] ?? pageComponents['dashboard.html'];
  return <Page key={locationKey} />;
}

export default App;
