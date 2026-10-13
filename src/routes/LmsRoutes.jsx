import React from 'react';
import { RequireRole, RequireClass } from './RequireRole.jsx';
import { LmsShell, LoadState, useList, Table } from '../features/shared/LmsUi.jsx';
import { ErrorPage } from '../pages/ErrorPage.jsx';
import { UsersPage } from '../pages/admin/UsersPage.jsx';
function ClassList({ route }) {
  const path = route.area === 'admin' ? '/api/v1/classes' : route.area === 'teacher' ? '/api/v1/instructor/classes' : '/api/v1/students/me/classes';
  const list = useList(path);
  return <LmsShell title="Lớp học"><LoadState value={list}>{rows => <Table columns={['Lớp', 'Trạng thái']} rows={rows} cells={row => [<a className="text-primary" href={`/${route.area}/classes/${row.classId}`}>{row.classCode}</a>, row.status]} />}</LoadState></LmsShell>;
}
function RoutedPage({ route }) {
  if (!route.valid) return <ErrorPage status={404} />;
  if (route.collection === 'users') return <UsersPage />;
  if (route.collection === 'classes' && !route.id) return <ClassList route={route} />;
  if (route.collection === 'classes' && route.id !== 'new' && route.area !== 'admin') return <RequireClass route={route}>{data => <LmsShell title={data.classCode} />}</RequireClass>;
  return <LmsShell title={route.collection === 'subjects' ? 'Môn học' : route.collection === 'semesters' ? 'Học kỳ' : 'Đóng góp'} />;
}
export function LmsRoutes({ route }) { return <RequireRole roles={[route.role]}><RoutedPage route={route} /></RequireRole>; }
