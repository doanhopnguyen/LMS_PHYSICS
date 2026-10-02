import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell.jsx';
import { PageContainer } from '../components/PageContainer.jsx';
import { PageTitle } from '../components/PageTitle.jsx';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { AuthAlert } from '../components/AuthLayout.jsx';
import { studentNavItems, studentFooterItems } from '../components/Sidebar.jsx';
import { lecturerNavigation, lecturerUtilityNavigation } from '../data/lecturerData.js';
import { adminNavigation } from '../data/adminData.js';
import { taNavigation, taUtilityNavigation } from '../data/taNavigation.js';
import { getDemoSession } from '../lib/demoSession.js';
import { goBack } from '../lib/navigation.js';
import { api } from '../lib/apiClient.js';
import { findOwnNotification } from '../lib/notificationDetails.js';
import { useNotifications } from '../hooks/useNotifications.js';

const navigationByRole = {
  STUDENT: [studentNavItems, studentFooterItems],
  INSTRUCTOR: [lecturerNavigation, lecturerUtilityNavigation],
  ADMIN: [adminNavigation, []],
  TA: [taNavigation, taUtilityNavigation],
};

export function NotificationDetailPage() {
  const id = new URLSearchParams(window.location.search).get('notificationId');
  const session = getDemoSession();
  const [items, utility] = navigationByRole[session?.role] || navigationByRole.STUDENT;
  const { refresh } = useNotifications();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    setError('');
    setReadError('');
    setNotification(null);
    (async () => {
      try {
        const item = await findOwnNotification(id, () => alive);
        if (!alive) return;
        setNotification(item);
        setLoading(false);
        if (item && !item.isRead) {
          try {
            await api.notifications.markRead(item.notificationId);
            if (alive) setNotification({ ...item, isRead: true });
            await refresh();
          } catch (readFailure) {
            if (alive) setReadError(readFailure.message || 'Chưa thể đánh dấu đã đọc.');
          }
        }
      } catch (failure) {
        if (alive) {
          setError(failure.message || 'Không thể tải thông báo.');
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, version, refresh]);
  const createdAt = new Date(notification?.createdAt);
  const validDate = notification?.createdAt && !Number.isNaN(createdAt.getTime());
  return (
    <AppShell
      currentPage="notification_detail.html"
      title="Chi tiết thông báo · PTIT Physics LMS"
      homeHref={session?.home}
      navigationItems={items}
      utilityItems={utility}
      showChatLauncher={false}
    >
      <PageContainer>
        <PageTitle title="Chi tiết thông báo" />
        <Button variant="secondary" icon="arrow_back" onClick={() => goBack(session?.home || 'dashboard.html')}>
          Quay lại
        </Button>
        {loading ? (
          <Card className="p-6" role="status">
            Đang tải thông báo…
          </Card>
        ) : error ? (
          <Card className="p-6">
            <AuthAlert error>{error}</AuthAlert>
            <Button variant="secondary" onClick={() => setVersion((value) => value + 1)}>
              Thử lại
            </Button>
          </Card>
        ) : !notification ? (
          <Card className="p-6" role="status">
            {id ? 'Thông báo không tồn tại hoặc đã bị xóa.' : 'Chưa chọn thông báo để đọc.'}
          </Card>
        ) : (
          <Card as="article" className="notification-detail mx-auto w-full max-w-4xl p-5 md:p-8">
            <h2 className="break-words text-headline-md font-semibold">{notification.title || 'Thông báo'}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-body-sm text-slate-500">
              {validDate && <time dateTime={createdAt.toISOString()}>{createdAt.toLocaleString('vi-VN')}</time>}
              <StatusBadge tone={notification.isRead ? 'success' : 'warning'}>
                {notification.isRead ? 'Đã đọc' : 'Chưa đọc'}
              </StatusBadge>
            </div>
            {readError && (
              <div className="mt-4">
                <AuthAlert error>{readError}</AuthAlert>
                <Button variant="secondary" onClick={() => setVersion((value) => value + 1)}>
                  Thử đánh dấu đã đọc
                </Button>
              </div>
            )}
            <div className="mt-5 whitespace-pre-wrap break-words border-t border-slate-200 pt-5 text-body-md leading-7 text-slate-700">
              {notification.content || 'Thông báo không có nội dung.'}
            </div>
          </Card>
        )}
      </PageContainer>
    </AppShell>
  );
}
