import React from 'react';
import { getDemoSession } from '../lib/demoSession.js';
import { tokenStore } from '../lib/apiClient.js';
import { ErrorPage } from '../pages/ErrorPage.jsx';
import { useLoad, LoadState, all, apiRequest } from '../features/shared/LmsUi.jsx';
export function RequireRole({ roles, children }) {
  const session = getDemoSession();
  if (!session?.userId || !tokenStore.getAccessToken() || !roles.includes(session.role)) return <ErrorPage status={403} session={session} />;
  return children;
}
export function RequireClass({ route, children }) {
  const value = useLoad(async () => {
    const path = route.area === 'teacher' ? '/api/v1/instructor/classes' : '/api/v1/students/me/classes';
    const list = await all(path);
    if (!list.some(row => row.classId === route.id && !['DROPPED', 'ARCHIVED'].includes(row.status))) return null;
    return apiRequest(`/api/v1/${route.area === 'teacher' ? 'instructor/' : ''}classes/${encodeURIComponent(route.id)}`);
  }, `${route.area}:${route.id}`);
  return <LoadState value={value}>{data => data ? children(data) : <ErrorPage status={403} session={getDemoSession()} />}</LoadState>;
}
