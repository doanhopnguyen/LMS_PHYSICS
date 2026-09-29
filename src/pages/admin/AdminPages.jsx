import React from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DashboardCalendar } from '../../components/DashboardCalendar.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { semesters, subjects } from '../../data/adminData.js';
import { listItems, useApiData } from '../../hooks/useApiData.js';


function statusTone(status) { return ['ACTIVE', 'CURRENT'].includes(status) ? 'success' : status === 'LOCKED' ? 'primary' : status === 'INACTIVE' ? 'warning' : 'neutral'; }
function statusLabel(status) { return ({ ACTIVE: 'Đang hoạt động', LOCKED: 'Đã khóa', CURRENT: 'Hiện hành', CLOSED: 'Đã kết thúc', INACTIVE: 'Tạm ngưng' })[status] ?? status; }

export function AdminDashboardPage() {
  const users = useApiData('/api/v1/users/admin/users?page=0&size=100&sort=username,asc');
  const semestersData = useApiData('/api/v1/semesters');
  const subjectsData = useApiData('/api/v1/subjects?page=0&size=1');
  const activityLogs = useApiData('/api/v1/admin/activity-logs?page=0&size=5&sort=createdAt,desc');
  const auditLogs = useApiData('/api/v1/admin/audit-logs?page=0&size=5&sort=createdAt,desc');
  const difficulty = useApiData('/api/v1/analytics/topic-difficulty');
  const resources = [users, semestersData, subjectsData, activityLogs, auditLogs, difficulty];
  const loading = resources.some((resource) => resource.loading);
  const error = resources.find((resource) => resource.error)?.error;
  const userRows = listItems(users.data);
  const usersById = new Map(userRows.map((user) => [user.userId, user]));
  const activityRows = listItems(activityLogs.data);
  const auditRows = listItems(auditLogs.data);
  const currentSemester = listItems(semestersData.data).find((item) => item.status === 'CURRENT' || item.isCurrent) || listItems(semestersData.data)[0];
  const metrics = [
    { label: 'Tổng người dùng', value: users.data?.totalElements ?? userRows.length, detail: 'Từ danh sách tài khoản', icon: 'groups', tone: 'success' },
    { label: 'Học kỳ', value: listItems(semestersData.data).length, detail: currentSemester?.name || 'Chưa thiết lập học kỳ', icon: 'calendar_month', tone: 'primary' },
    { label: 'Học phần', value: subjectsData.data?.totalElements ?? listItems(subjectsData.data).length, detail: 'Đang quản lý trong hệ thống', icon: 'menu_book', tone: 'primary' },
    { label: 'Chủ đề đã phân tích', value: listItems(difficulty.data).length, detail: 'Từ báo cáo độ khó chủ đề', icon: 'analytics', tone: 'warning' },
  ];
  const attentionItems = [
    { icon: 'lock_person', title: `${userRows.filter((user) => user.status === 'LOCKED').length} tài khoản đã khóa`, detail: 'Thống kê trong 100 tài khoản đầu tiên theo thứ tự username.', tone: 'warning' },
    { icon: 'history', title: `${activityLogs.data?.totalElements ?? activityRows.length} hoạt động hệ thống`, detail: 'Xem nhật ký hoạt động để theo dõi các thao tác gần đây.', tone: 'primary' },
    { icon: 'policy', title: `${auditLogs.data?.totalElements ?? auditRows.length} bản ghi kiểm toán`, detail: 'Theo dõi thay đổi dữ liệu và thao tác quản trị.', tone: 'primary' },
  ];
  const reload = () => resources.forEach((resource) => resource.reload());
  const formatTime = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—';
  const activityUser = (item) => {
    const user = usersById.get(item.userId);
    return item.fullName || item.username || item.userName || user?.fullName || user?.username || user?.email || 'Hệ thống';
  };
  const activityObject = (item) => {
    const label = item.objectName || item.objectTitle || item.materialTitle || item.title || item.entityName || item.details?.title;
    if (label) return label;
    return ({ LEARNING_MATERIAL: 'Học liệu', SUBJECT: 'Học phần', TOPIC: 'Chủ đề', QUESTION: 'Câu hỏi', CLASS: 'Lớp học' })[item.objectType || item.entity] || 'Đối tượng hệ thống';
  };
  return (
    <AdminPageShell currentPage="admin_dashboard.html" title="Tổng quan vận hành" description="Theo dõi dữ liệu tài khoản, học kỳ và vận hành từ hệ thống thực tế." pageTitleInHeader={false} actions={<Button variant="secondary" icon="refresh" disabled={loading} onClick={reload}>Làm mới dữ liệu</Button>}>
      {loading ? <Card className="mt-6 p-8" role="status">Đang tải dữ liệu dashboard…</Card> : error ? <Card className="mt-6 p-8" role="alert"><p>{error}</p><Button className="mt-4" variant="secondary" onClick={reload}>Thử lại</Button></Card> : <><div className="mt-6"><MetricGrid items={metrics} columns={4} /></div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 p-6">
          <SectionHeader icon="assignment_late" title="Tình trạng vận hành" />
          <div className="mt-5 space-y-3">
            {attentionItems.map((item) => <Card as="div" key={item.title} className="flex gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE2E2] text-primary"><span className="material-symbols-outlined">{item.icon}</span></span><div><div className="flex flex-wrap gap-2 items-center"><h2 className="font-bold">{item.title}</h2><StatusBadge tone={item.tone}>Dữ liệu thực</StatusBadge></div><p className="mt-1 text-body-sm text-[#64748B]">{item.detail}</p></div></Card>)}
          </div>
        </Card>
        <Card className="lg:col-span-2 p-6">
          <SectionHeader icon="history" title="Hoạt động gần đây" />
          <ol className="mt-4 space-y-4">{activityRows.length ? activityRows.map((item, index) => <li key={item.logId || `${item.createdAt}-${index}`}><p className="text-label-md font-bold text-primary">{formatTime(item.createdAt)}</p><p className="mt-1 text-body-sm font-semibold">{activityUser(item)} · {item.actionType || item.action || 'Hoạt động'}</p><p className="text-body-sm text-[#64748B]">{activityObject(item)}</p></li>) : <li className="text-body-sm text-[#64748B]">Chưa có hoạt động gần đây.</li>}</ol>
        </Card>
      </div>
      <div className="mt-6"><DashboardCalendar role="ADMIN" /></div></>}
    </AdminPageShell>
  );
}


export function AdminAcademicsPage() {
  return <AdminPageShell currentPage="admin_academics.html" title="Học kỳ, học phần và chủ đề" description="Thiết lập phạm vi giảng dạy trước khi lớp học, học liệu, ngân hàng câu hỏi và thí nghiệm được vận hành." actions={<><Button variant="secondary" icon="calendar_month">Tạo học kỳ</Button><Button icon="menu_book">Tạo học phần</Button></>}><div className="mt-6"><Tabs items={[{ id: 'SEMESTERS', label: 'Học kỳ' }, { id: 'SUBJECTS', label: 'Học phần' }, { id: 'FLOW', label: 'Luồng nội dung' }]}>{(tab) => tab === 'SEMESTERS' ? <Card className="mt-5 p-5"><DataTable columns={['Học kỳ', 'Thời gian', 'Lớp', 'Trạng thái', '']} rows={semesters} renderRow={(row) => <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-3"><strong>{row.name}</strong><span className="block text-[#64748B]">{row.code}</span></td><td className="px-3 py-3">{row.dates}</td><td className="px-3 py-3">{row.classes}</td><td className="px-3 py-3"><StatusBadge tone={statusTone(row.status)}>{statusLabel(row.status)}</StatusBadge></td><td className="px-3 py-3"><button className="font-semibold text-primary">Chỉnh sửa</button></td></tr>} /></Card> : tab === 'SUBJECTS' ? <Card className="mt-5 p-5"><DataTable columns={['Học phần', 'Chủ đề', 'Học liệu', 'Trạng thái', '']} rows={subjects} renderRow={(row) => <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-3"><strong>{row.name}</strong><span className="block text-[#64748B]">{row.code}</span></td><td className="px-3 py-3">{row.topics}</td><td className="px-3 py-3">{row.materials}</td><td className="px-3 py-3"><StatusBadge tone={statusTone(row.status)}>{statusLabel(row.status)}</StatusBadge></td><td className="px-3 py-3"><button className="font-semibold text-primary">Quản lý chủ đề</button></td></tr>} /></Card> : <Card className="mt-5 p-6"><div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">{[['Môn học', 'BAS1201'], ['Chủ đề', 'Động lực học'], ['Học liệu', 'Slide · Video · PDF'], ['Khai thác', 'Lớp · Câu hỏi · AI Tutor · Analytics']].map(([title, detail], index) => <React.Fragment key={title}><Card as="div" className="bg-[#F8FAFC] p-5"><span className="text-label-md font-bold text-primary">{index + 1}</span><h2 className="mt-2 font-bold">{title}</h2><p className="mt-1 text-body-sm text-[#64748B]">{detail}</p></Card>{index < 3 && <span className="hidden md:flex items-center justify-center material-symbols-outlined text-[#94A3B8]">arrow_forward</span>}</React.Fragment>)}</div></Card>}</Tabs></div></AdminPageShell>;
}
