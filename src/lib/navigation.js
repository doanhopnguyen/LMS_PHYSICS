import { getCleanRoute, getPageFile, routeFiles } from './routes.js';
import { canAccess, getDemoSession } from './demoSession.js';
import { academicHref } from './academicScope.js';

export const navigationByLabel = [
  ['Tổng quan', 'dashboard.html'],
  ['Học phần của tôi', 'my_courses.html'],
  ['Trợ giảng AI', 'ai_tutor.html'],
  ['Ôn luyện', 'exam_practice_center.html'],
  ['Kiểm tra', 'exam_session.html'],
  ['Phòng thí nghiệm 3D', 'virtual_lab.html'],
  ['Kết quả học tập', 'learning_results.html'],
  ['Cài đặt', 'profile_settings.html'],
];

export function navigate(file) {
  const url = new URL(file, window.location.href);
  if (url.origin !== window.location.origin) return;
  const scoped = new URL(academicHref(`${url.pathname.slice(1)}${url.search}${url.hash}`), window.location.origin);
  const next = `${getCleanRoute(scoped.pathname)}${scoped.search}${scoped.hash}`;
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
    if (
      !['login.html', 'register.html', 'reset_password.html', 'auth_access.html'].includes(file) &&
      canAccess(session?.role, file)
    ) {
      window.history.back();
      return;
    }
  }
  navigate(fallback);
}

export function routeFromLink(link) {
  const href = link.getAttribute('href') || '';
  if (link.hasAttribute('download') || (link.target && link.target !== '_self')) return null;
  if (href && !href.startsWith('#')) {
    let url;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return null;
    }
    if (url.origin !== window.location.origin) return null;
    const route = url.pathname.replace(/^\//, '');
    const file = route.endsWith('.html') ? route : `${route}.html`;
    if (routeFiles.includes(file)) return `${url.pathname}${url.search}${url.hash}`;
  }
  if (href === '#' || href.startsWith('#')) {
    const text = link.textContent.replace(/\s+/g, ' ').trim();
    const match = navigationByLabel.find(([label]) => text.startsWith(label));
    return match?.[1] ?? null;
  }
  return null;
}
