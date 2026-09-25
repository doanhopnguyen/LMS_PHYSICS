import { getCleanRoute, getPageFile, routeFiles } from './routes.js';
import { canAccess, getDemoSession } from './demoSession.js';
import { academicHref } from './academicScope.js';

export const navigationByLabel = [
  ['Tổng quan', 'dashboard.html'],
  ['Học phần của tôi', 'my_courses.html'],
  ['Kho học liệu', 'library.html'],
  ['Trợ giảng AI', 'ai_tutor.html'],
  ['Ôn luyện', 'exam_practice_center.html'],
  ['Kiểm tra', 'exam_session.html'],
  ['Phòng thí nghiệm 3D', 'virtual_lab.html'],
  ['Kết quả học tập', 'learning_results.html'],
  ['Trợ giúp', 'notifications_help.html'],
  ['Cài đặt', 'profile_settings.html'],
];

export function navigate(file) {
  const next = `/${getCleanRoute(academicHref(file))}`;
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) {
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState({ ptitPrevious: current }, '', next);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

export function goBack(fallback = 'dashboard.html') {
  const previous = window.history.state?.ptitPrevious;
  const session = getDemoSession();
  if (typeof previous === 'string' && previous.startsWith('/') && !previous.startsWith('//')) {
    const file = getPageFile(new URL(previous, window.location.origin).pathname);
    if (!['login.html', 'register.html', 'reset_password.html', 'auth_access.html'].includes(file) && canAccess(session?.role, file)) {
      window.history.back();
      return;
    }
  }
  navigate(fallback);
}

export function routeFromLink(link) {
  const href = link.getAttribute('href') || '';
  const route = href.split('?')[0].split('#')[0];
  if (routeFiles.includes(route)) return href;
  if (href === '#' || href.startsWith('#')) {
    const text = link.textContent.replace(/\s+/g, ' ').trim();
    const match = navigationByLabel.find(([label]) => text.startsWith(label));
    return match?.[1] ?? null;
  }
  return null;
}
