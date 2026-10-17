import { routeFiles } from './routes.js';

export const examListHref = (workspace = 'exam') =>
  workspace === 'practice' ? 'exam_practice_center.html?tab=teacher' : 'exam_session.html';

export function examResultsHref(examId, attemptId, workspace = 'exam') {
  const query = new URLSearchParams({ examId, attemptId, workspace });
  return `exam_results.html?${query}`;
}

export function examBackHref(previous, workspace, origin) {
  const fallback = examListHref(workspace);
  if (typeof previous !== 'string' || !previous.startsWith('/') || previous.startsWith('//')) return fallback;
  try {
    const url = new URL(previous, origin);
    const route = url.pathname.slice(1);
    const page = route.endsWith('.html') ? route : `${route}.html`;
    if (
      url.origin !== origin ||
      !routeFiles.includes(page) ||
      ['login.html', 'register.html', 'reset_password.html', 'auth_access.html'].includes(page)
    )
      return fallback;
    // A result for the same exam is a valid return destination. A taking or
    // waiting route would reopen the session or create a redirect loop.
    if (
      ['exam_session.html', 'exam_practice_center.html'].includes(page) &&
      (url.searchParams.has('examId') || url.searchParams.has('practiceSessionId'))
    )
      return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
