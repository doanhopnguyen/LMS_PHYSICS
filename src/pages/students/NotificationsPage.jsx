import { PaginatedList } from "../../components/Pagination.jsx";
import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Card } from '../../components/Card.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { api } from '../../lib/apiClient.js';

export function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const reload = () => { setError(''); return Promise.all([api.notifications.list(), api.notifications.summary().catch(() => null)]).then(([data, nextSummary]) => { setItems(Array.isArray(data) ? data : data?.content || []); setSummary(nextSummary); }).catch((err) => setError(err.message || 'Không thể tải thông báo.')); };
  useEffect(() => { reload(); }, []);
  const unread = (item) => !item.isRead;
  const markRead = async (item) => { if (item.isRead) return; try { await api.notifications.markRead(item.notificationId); setItems((rows) => rows.map((row) => row.notificationId === item.notificationId ? { ...row, isRead: true } : row)); } catch (err) { setError(err.message); } };
  const markAllRead = async () => { try { await api.notifications.markAllRead(); setItems((rows) => rows.map((row) => ({ ...row, isRead: true }))); } catch (err) { setError(err.message); } };
  const remove = async (event, item) => { event.stopPropagation(); setBusy(true); try { await api.notifications.remove(item.notificationId); setItems((rows) => rows.filter((row) => row.notificationId !== item.notificationId)); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const generateReminders = async () => { setBusy(true); setError(''); try { await api.notifications.generateReminders(); await reload(); } catch (err) { setError(err.message || 'Không thể tạo thông báo nhắc lịch.'); } finally { setBusy(false); } };
  return (
    <AppShell
      currentPage="notifications_help.html"
      title="Thông báo & hỗ trợ · PTIT Physics 1"
      breadcrumbs={['Trợ giúp']}
      current="Thông báo & hỗ trợ"
    >
      <PageContainer>
        <PageTitle
          eyebrow="TRUNG TÂM HỖ TRỢ"
          title="Thông báo & hỗ trợ"
          description="Cập nhật học tập, hướng dẫn sử dụng và các kênh liên hệ với đội ngũ PTIT Physics."
          actions={
            <div className="flex items-center gap-3"><button onClick={generateReminders} disabled={busy} className="text-body-sm font-semibold text-primary hover:underline">Tạo nhắc lịch</button><button onClick={markAllRead} disabled={!items.some(unread)} className="text-body-sm font-semibold text-primary hover:underline">Đánh dấu đã đọc</button></div>
          }
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7 p-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <h2 className="text-headline-md font-bold">Thông báo mới</h2>
              <StatusBadge tone="primary">{summary?.unreadCount ?? items.filter(unread).length} chưa đọc</StatusBadge>
            </div>
            {error && <p role="alert" className="py-3 text-primary">{error}</p>}
            {!items.length && <p className="py-8 text-center text-body-sm text-[#64748B]">Chưa có thông báo mới.</p>}
            <PaginatedList className="divide-y divide-[#E2E8F0]">
              {items.map((item) => (
                <div
                  key={item.notificationId}
                  onClick={() => markRead(item)}
                  onKeyDown={(event) => event.key === 'Enter' && markRead(item)}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left flex gap-4 py-5 ${unread(item) ? 'bg-[#FFFBFB]' : ''}`}
                >
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'EXAM_NEW' ? 'bg-[#DCFCE7] text-[#15803D]' : item.type === 'ANNOUNCEMENT' ? 'bg-[#FEE2E2] text-primary' : 'bg-[#F1F5F9] text-[#475569]'}`}
                  >
                    <span className="material-symbols-outlined">task_alt</span>
                  </span>
                  <span className="flex-1">
                    <strong className="text-body-md text-on-surface">{item.title}</strong>
                    <span className="block text-body-sm text-[#64748B] mt-1">{item.content}</span>
                    <span className="block text-label-sm text-[#94A3B8] mt-2">{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                  </span>
                  {unread(item) && <span className="w-2.5 h-2.5 rounded-full bg-primary-container mt-2" />}
                  <span role="button" tabIndex={0} onClick={(event) => remove(event, item)} onKeyDown={(event) => event.key === 'Enter' && remove(event, item)} className="material-symbols-outlined mt-1 text-[#94A3B8] hover:text-primary" aria-label={`Xóa thông báo ${item.title}`}>delete</span>
                </div>
              ))}
            </PaginatedList>
          </Card>
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6">
              <h2 className="text-headline-md font-bold">Câu hỏi thường gặp</h2>
              <div className="space-y-2 mt-4">
                {[
                  'Làm thế nào để nộp báo cáo thí nghiệm?',
                  'Cách xem lại đáp án sau khi thi?',
                  'Tôi quên mật khẩu tài khoản PTIT?',
                  'Cách liên hệ giảng viên học phần?',
                ].map((question) => (
                  <details key={question} className="group border-b border-[#E2E8F0] py-3">
                    <summary className="cursor-pointer text-body-md font-semibold list-none flex items-center justify-between">
                      {question}
                      <span className="material-symbols-outlined text-[#94A3B8] group-open:rotate-180 transition-transform">
                        expand_more
                      </span>
                    </summary>
                    <p className="text-body-sm text-[#64748B] mt-2">
                      Bạn có thể xem hướng dẫn chi tiết trong Trung tâm trợ giúp hoặc gửi yêu cầu hỗ trợ cho đội ngũ
                      quản trị.
                    </p>
                  </details>
                ))}
              </div>
            </Card>
            <Card className="p-6 bg-[#FEF2F2] border-[#FECACA]">
              <span className="material-symbols-outlined text-primary text-3xl">support_agent</span>
              <h2 className="text-headline-sm font-bold mt-3">Cần hỗ trợ thêm?</h2>
              <p className="text-body-sm text-[#64748B] mt-1">Đội ngũ hỗ trợ phản hồi trong vòng 24 giờ.</p>
              <button className="mt-4 px-4 py-2 rounded-xl bg-primary-container text-white text-body-md font-semibold">
                Gửi yêu cầu hỗ trợ
              </button>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
