import { StudentClassPage } from '../features/classes/StudentClassPage.jsx';
import { ClassList } from '../features/classes/ClassList.jsx';
import { CreateClassWizard } from '../features/classes/CreateClassWizard.jsx';
import { AdminClassDetail } from '../features/classes/AdminClassDetail.jsx';
import { CatalogPage } from '../features/subjects/CatalogPage.jsx';
import { SubjectPage } from '../features/subjects/SubjectPage.jsx';
import React from 'react';
import { RequireRole, RequireClass } from './RequireRole.jsx';
import { LmsShell, LoadState, useList, Table } from '../features/shared/LmsUi.jsx';
import { ErrorPage } from '../pages/ErrorPage.jsx';
import { UsersPage } from '../pages/admin/UsersPage.jsx';
function RoutedPage({ route }) {
  if (!route.valid) return <ErrorPage status={404} />;
  if (route.collection === 'subjects') return route.id ? <SubjectPage route={route} /> : <CatalogPage kind="subjects" />;
  if (route.collection === 'semesters') return <CatalogPage kind="semesters" />;
  if (route.collection === 'users') return <UsersPage />;
  if (route.area === 'admin' && route.collection === 'classes' && route.id) return route.id === 'new' ? <CreateClassWizard /> : <AdminClassDetail route={route} />;
  if (route.collection === 'classes' && !route.id) return <ClassList route={route} />;
  if (route.collection === 'classes' && route.id !== 'new' && route.area !== 'admin') return <RequireClass route={route}>{data => route.area === 'student' ? <StudentClassPage route={route} cls={data} /> : <LmsShell title={data.classCode} />}</RequireClass>;
  return <LmsShell title={route.collection === 'subjects' ? 'Môn học' : route.collection === 'semesters' ? 'Học kỳ' : 'Đóng góp'} />;
}
export function LmsRoutes({ route }) { return <RequireRole roles={[route.role]}><RoutedPage route={route} /></RequireRole>; }
