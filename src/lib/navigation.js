import { getCleanRoute, routeFiles } from './routes.js';
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
    window.history.pushState({}, '', next);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
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
