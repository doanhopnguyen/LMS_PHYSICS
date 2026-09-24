import React from 'react';

export const studentNavItems = [
  ['dashboard.html', 'dashboard', 'Tổng quan'],
  ['my_courses.html', 'menu_book', 'Học phần của tôi'],
  ['library.html', 'folder_open', 'Kho học liệu'],
  ['ai_tutor.html', 'smart_toy', 'Trợ giảng AI', '24/7'],
  ['exam_practice_center.html', 'fitness_center', 'Ôn luyện'],
  ['exam_session.html', 'quiz', 'Kiểm tra'],
  ['virtual_lab.html', 'science', 'Phòng thí nghiệm 3D'],
  ['student_evidence.html', 'folder_shared', 'Minh chứng & báo cáo'],
  ['learning_results.html', 'insights', 'Kết quả học tập'],
];

export const studentFooterItems = [
  ['notifications_help.html', 'help', 'Trợ giúp'],
  ['profile_settings.html', 'settings', 'Cài đặt'],
];

export function Sidebar({
  currentPage = '',
  open = false,
  onClose,
  variant = 'drawer',
  className = '',
  children,
  ariaLabel,
  items = studentNavItems,
  utilityItems = studentFooterItems,
}) {
  if (variant === 'inline') {
    return (
      <aside className={`document-toc-sidebar ${className}`} aria-label={ariaLabel}>
        {children}
      </aside>
    );
  }

  const linkClass = (file) =>
    [
      'flex items-center gap-3 px-space-md py-2.5 rounded-full transition-all duration-150 group',
      file === currentPage
        ? 'bg-white/20 text-white font-body-md-medium text-body-md-medium'
        : 'text-white/85 font-body-md text-body-md hover:bg-white/10 hover:text-white hover:translate-x-0.5',
    ].join(' ');

  return (
    <aside
      className={`app-sidebar-drawer ${open ? 'is-open' : ''} ${className}`}
      onClick={(event) => {
        if (event.target.closest('a')) onClose?.();
      }}
    >
      <nav
        className="space-y-1.5 custom-scrollbar overflow-y-auto max-h-[calc(100vh-160px)] pr-1"
        aria-label="Điều hướng chính"
      >
        {items.map(([file, icon, label, badge]) => (
          <a
            key={file}
            className={linkClass(file)}
            href={file}
            aria-current={file === currentPage ? 'page' : undefined}
          >
            <span
              className={`material-symbols-outlined ${file === currentPage ? 'text-white' : 'text-white/70 group-hover:text-white'}`}
            >
              {icon}
            </span>
            <span>{label}</span>
            {badge && (
              <span className="ml-auto rounded-full border border-white/25 bg-white/15 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {badge}
              </span>
            )}
            {file === 'exam_session.html' && <span className="ml-auto h-2 w-2 rounded-full bg-primary-container" />}
          </a>
        ))}
      </nav>
      <nav className="space-y-1 border-t border-[#E2E8F0] pt-4" aria-label="Tiện ích">
        {utilityItems.map(([file, icon, label]) => (
          <a
            key={file}
            className={linkClass(file)}
            href={file}
            aria-current={file === currentPage ? 'page' : undefined}
          >
            <span
              className={`material-symbols-outlined ${file === currentPage ? 'text-white' : 'text-white/70 group-hover:text-white'}`}
            >
              {icon}
            </span>
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
