import React, { useEffect, useState } from 'react';
import { Footer } from './Footer.jsx';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { ChatLauncher } from './ChatLauncher.jsx';
import { DetailToolbar } from './DetailToolbar.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { navigate, routeFromLink } from '../lib/navigation.js';

export function AppShell({ children, currentPage, title, bodyClass, breadcrumbs, current, footer = true, contentClass = '', showChatLauncher = true, showChrome = true, toolbar }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const detailPages = ['ai_tutor.html', 'exam_results.html', 'interactive_lesson.html', 'course_detail.html', 'learning_module.html'];
  const reportPage = title?.includes('Rubric');
  const chromeVisible = showChrome && !detailPages.includes(currentPage) && !reportPage;
  const detailToolbar = !chromeVisible && (currentPage === 'ai_tutor.html' || currentPage === 'interactive_lesson.html' || currentPage === 'course_detail.html' || currentPage === 'learning_module.html')
    ? currentPage === 'ai_tutor.html'
      ? <DetailToolbar title="Trợ giảng AI" subtitle="PTIT Tutor · Hỗ trợ học tập Vật lý 1" backHref="dashboard.html" backLabel="Về trang chủ" />
      : currentPage === 'interactive_lesson.html'
        ? <DetailToolbar title="Bài học tương tác" subtitle="Vật lý đại cương 1 · Chương 2" backHref="course_detail.html" backLabel="Về học phần" />
        : <DetailToolbar title="Vật lý đại cương 1" subtitle="Chọn chương và bài học để tiếp tục" backHref="my_courses.html" backLabel="Về học phần của tôi" />
    : reportPage
      ? <DetailToolbar title="Báo cáo thí nghiệm" subtitle="Rubric đánh giá · Vật lý 1" backHref="virtual_lab.html" backLabel="Về phòng thí nghiệm" />
      : null;
  useDocumentMeta({ title, bodyClass: `${bodyClass ?? ''} app-body` });

  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && setSidebarOpen(false);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <div
      className="app-shell app-shell-white min-h-screen flex flex-col"
      onClick={(event) => {
        const link = event.target.closest('a');
        const target = link && routeFromLink(link);
        if (target) {
          event.preventDefault();
          navigate(target);
        }
      }}
    >
      {chromeVisible && <Header onMenuClick={() => setSidebarOpen((open) => !open)} />}
      {chromeVisible && <Sidebar currentPage={currentPage} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      {chromeVisible && sidebarOpen && <button className="sidebar-backdrop" aria-label="Đóng thanh điều hướng" onClick={() => setSidebarOpen(false)} />}
      <div className={`app-shell-content ${!chromeVisible ? 'app-shell-content-no-chrome' : ''} flex-1 ${contentClass}`}>{toolbar ?? detailToolbar}{children}</div>
      {footer && <Footer />}
      {showChatLauncher && <ChatLauncher />}
    </div>
  );
}
