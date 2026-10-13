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
    const assigned = list.find(row => row.classId === route.id && row.status !== 'DROPPED');
    if (!assigned) return null;
    // GET /classes/{id} excludes STUDENT; the enrolled-class endpoint already returns ClassDTO.
    return route.area === 'student' ? assigned : apiRequest(`/api/v1/instructor/classes/${encodeURIComponent(route.id)}`);
  }, `${route.area}:${route.id}`);
  return <LoadState value={value}>{data => data ? children(data) : <ErrorPage status={403} session={getDemoSession()} />}</LoadState>;
}
