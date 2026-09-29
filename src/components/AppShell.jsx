import { Card } from './Card.jsx';
import React, { useEffect, useState } from 'react';
import { Footer } from './Footer.jsx';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { ChatLauncher } from './ChatLauncher.jsx';
import { DetailToolbar } from './DetailToolbar.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { navigate, routeFromLink } from '../lib/navigation.js';
import { PageHeaderProvider } from './PageHeaderContext.jsx';
import { AcademicFilters } from './AcademicFilters.jsx';
import { academicPages, readAcademicScope } from '../lib/academicScope.js';
import { getPageFile } from '../lib/routes.js';

export function AppShell({
  children,
  currentPage,
  title,
  bodyClass,
  breadcrumbs,
  current,
  footer = true,
  contentClass = '',
  showChatLauncher = true,
  showChrome = true,
  toolbar,
  user,
  homeHref,
  navigationItems,
  utilityItems,
  filterActions,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const actualPage = getPageFile();
  const detailPages = [
    'ai_tutor.html',
    'exam_results.html',
    'interactive_lesson.html',
    'course_detail.html',
    'learning_module.html',
  ];
  const reportPage = title?.includes('Rubric');
  const chromeVisible = showChrome && !detailPages.includes(currentPage) && !reportPage;
  const detailToolbar =
    !chromeVisible &&
    (currentPage === 'ai_tutor.html' ||
      currentPage === 'interactive_lesson.html' ||
      currentPage === 'course_detail.html' ||
      currentPage === 'learning_module.html') ? (
      currentPage === 'ai_tutor.html' ? (
        <DetailToolbar
          title="Trợ giảng AI"
          subtitle="PTIT Tutor · Hỗ trợ học tập Vật lý 1"
          backHref="dashboard.html"
          backLabel="Về trang chủ"
        />
      ) : currentPage === 'interactive_lesson.html' ? (
        <DetailToolbar
          title="Bài học tương tác"
          subtitle="Vật lý đại cương 1 · Chương 2"
          backHref="course_detail.html"
          backLabel="Về học phần"
        />
      ) : (
        <DetailToolbar
          title="Vật lý đại cương 1"
          subtitle="Chọn chương và bài học để tiếp tục"
          backHref="my_courses.html"
          backLabel="Về học phần của tôi"
        />
      )
    ) : reportPage ? (
      <DetailToolbar
        title="Báo cáo thí nghiệm"
        subtitle="Rubric đánh giá · Vật lý 1"
        backHref="virtual_lab.html"
        backLabel="Về phòng thí nghiệm"
      />
    ) : null;
  useDocumentMeta({ title, bodyClass: `${bodyClass ?? ''} app-body` });

  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && setSidebarOpen(false);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <PageHeaderProvider>
      <div
        className="app-shell app-shell-white min-h-screen flex flex-col"
        onClick={(event) => {
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          const link = event.target.closest('a');
          const target = link && routeFromLink(link);
          if (target) {
            event.preventDefault();
            navigate(target);
          }
        }}
      >
        {chromeVisible && (
          <Header onMenuClick={() => setSidebarOpen((open) => !open)} user={user} homeHref={homeHref} />
        )}
        {chromeVisible && (
          <Sidebar
            currentPage={currentPage}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            items={navigationItems}
            utilityItems={utilityItems}
          />
        )}
        {chromeVisible && sidebarOpen && (
          <button
            className="sidebar-backdrop"
            aria-label="Đóng thanh điều hướng"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={`app-shell-content ${!chromeVisible ? 'app-shell-content-no-chrome' : ''} flex-1 ${contentClass}`}
        >
          {toolbar ??
            detailToolbar ??
            (!chromeVisible && (
              <DetailToolbar
                title={title}
                backHref={actualPage === 'exam_results.html' ? 'exam_session.html' : (homeHref ?? 'dashboard.html')}
                backLabel={actualPage === 'exam_results.html' ? 'Về danh sách bài kiểm tra' : 'Về trang chính'}
              />
            ))}
          <AcademicFilters page={actualPage} actions={filterActions} />
          {academicPages[actualPage] && !readAcademicScope().available ? (
            <main className="mx-auto w-full max-w-[1440px] p-6">
              <Card as="div" className="p-10 text-center" role="status">
                <h1 className="text-headline-sm font-bold">Chưa có dữ liệu trong phạm vi đã chọn</h1>
                <p className="mt-2 text-[#64748B]">Chọn học kỳ hoặc môn học khác.</p>
              </Card>
            </main>
          ) : (
            children
          )}
        </div>
        {footer && <Footer />}
        {showChatLauncher && <ChatLauncher />}
      </div>
    </PageHeaderProvider>
  );
}
