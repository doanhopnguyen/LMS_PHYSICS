import React, { useEffect, useState } from 'react';
import { useAdaptiveCorners } from './hooks/useAdaptiveCorners.js';
import { getPageFile } from './lib/routes.js';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { CourseDetailPage } from './pages/CourseDetailPage.jsx';
import { LearningModulePage } from './pages/LearningModulePage.jsx';
import { ExamPracticePage } from './pages/ExamPracticePage.jsx';
import { ExamResultsPage } from './pages/ExamResultsPage.jsx';
import { LabReportPage } from './pages/LabReportPage.jsx';
import { LearningResultsPage } from './pages/LearningResultsPage.jsx';
import { LibraryPage } from './pages/LibraryPage.jsx';
import { MyCoursesPage } from './pages/MyCoursesPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage.jsx';
import { VirtualLabPage } from './pages/VirtualLabPage.jsx';
import { VoiceCitationsPage } from './pages/VoiceCitationsPage.jsx';
import { WorkspacePage } from './pages/WorkspacePage.jsx';
import { AiTutorPage } from './pages/AiTutorPage.jsx';
import { DocumentViewerPage } from './pages/DocumentViewerPage.jsx';
import { ExamSessionPage } from './pages/ExamSessionPage.jsx';
import { InteractiveLessonPage } from './pages/InteractiveLessonPage.jsx';
import { MobileExperiencePage } from './pages/MobileExperiencePage.jsx';

const pageComponents = {
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
  'mobile_experience.html': MobileExperiencePage
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

  const Page = pageComponents[file] ?? pageComponents['dashboard.html'];
  return <Page key={locationKey} />;
}

export default App;
