import React, { useMemo, useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import { adminActivity, adminMetrics, adminUsers, semesters, subjects } from '../../data/adminData.js';

const roleLabel = { STUDENT: 'Sinh viên', INSTRUCTOR: 'Giảng viên', TA: 'Trợ giảng', ADMIN: 'Quản trị viên' };

function statusTone(status) { return ['ACTIVE', 'CURRENT'].includes(status) ? 'success' : status === 'LOCKED' ? 'primary' : status === 'INACTIVE' ? 'warning' : 'neutral'; }
function statusLabel(status) { return ({ ACTIVE: 'Đang hoạt động', LOCKED: 'Đã khóa', CURRENT: 'Hiện hành', CLOSED: 'Đã kết thúc', INACTIVE: 'Tạm ngưng' })[status] ?? status; }

export function AdminDashboardPage() {
  return (
    <AdminPageShell currentPage="admin_dashboard.html" title="Tổng quan vận hành" description="Theo dõi tài khoản, hoạt động học kỳ và các nội dung cần quản trị.">
      <div className="mt-6"><MetricGrid items={adminMetrics} /></div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 p-6">
          <SectionHeader icon="assignment_late" title="Việc cần xử lý" />
          <div className="mt-5 space-y-3">
            {[
              ['pending_actions', '14 học liệu đang chờ phê duyệt', 'Kiểm tra tính phù hợp trước khi công bố cho sinh viên.', 'Học liệu'],
              ['person_off', '4 yêu cầu mở khóa tài khoản', 'Cần xác minh lý do và trạng thái học tập.', 'Người dùng'],
              ['analytics', 'Snapshot analytics chưa đồng bộ', 'Tổng hợp dữ liệu học tập kỳ hiện hành.', 'Vận hành'],
            ].map(([icon, title, detail, scope]) => <div key={title} className="flex gap-3 rounded-xl border border-[#E2E8F0] p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE2E2] text-primary"><span className="material-symbols-outlined">{icon}</span></span><div><div className="flex flex-wrap gap-2 items-center"><h2 className="font-bold">{title}</h2><StatusBadge tone="warning">{scope}</StatusBadge></div><p className="mt-1 text-body-sm text-[#64748B]">{detail}</p></div></div>)}
          </div>
        </Card>
        <Card className="lg:col-span-2 p-6">
          <SectionHeader icon="history" title="Hoạt động gần đây" />
          <ol className="mt-4 space-y-4">{adminActivity.map((item) => <li key={`${item.time}-${item.action}`}><p className="text-label-md font-bold text-primary">{item.time}</p><p className="mt-1 text-body-sm font-semibold">{item.actor} · {item.action}</p><p className="text-body-sm text-[#64748B]">{item.target}</p></li>)}</ol>
        </Card>
      </div>
    </AdminPageShell>
  );
}

export function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('ALL');
  const rows = useMemo(() => adminUsers.filter((user) => (role === 'ALL' || user.role === role) && `${user.id} ${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())), [query, role]);
  const pagination = usePagination(rows, [query, role]);
  return (
    <AdminPageShell currentPage="admin_users.html" title="Người dùng và phân quyền" description="Tạo tài khoản, gán vai trò, khóa hoặc mở khóa theo chính sách hệ thống." actions={<Button icon="person_add">Tạo tài khoản</Button>}>
      <Card className="mt-6 p-5">
        <div className="flex flex-col gap-3 lg:flex-row"><label className="sr-only" htmlFor="user-search">Tìm người dùng</label><input id="user-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mã, họ tên hoặc email" className="h-11 flex-1 rounded-xl border border-[#CBD5E1] px-4" /><select value={role} onChange={(event) => setRole(event.target.value)} className="h-11 rounded-xl border border-[#CBD5E1] px-3"><option value="ALL">Tất cả vai trò</option>{Object.entries(roleLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        <div className="mt-5"><DataTable columns={['Người dùng', 'Vai trò', 'Trạng thái', 'Hoạt động gần nhất', '']} rows={pagination.pageItems} renderRow={(user) => <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-3"><strong className="block">{user.name}</strong><span className="text-[#64748B]">{user.id} · {user.email}</span></td><td className="px-3 py-3">{roleLabel[user.role]}</td><td className="px-3 py-3"><StatusBadge tone={statusTone(user.status)}>{statusLabel(user.status)}</StatusBadge></td><td className="px-3 py-3 text-[#64748B]">{user.lastSeen}</td><td className="px-3 py-3"><button type="button" className="font-semibold text-primary">Quản lý</button></td></tr>} /><Pagination currentPage={pagination.currentPage} pageSize={pagination.pageSize} totalItems={rows.length} onPageChange={pagination.setCurrentPage} onPageSizeChange={pagination.setPageSize} /></div>
      </Card>
      <Card className="mt-6 p-5"><SectionHeader icon="admin_panel_settings" title="Rule phân quyền được phản ánh trên giao diện" /><div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-body-sm">{[['Sinh viên', 'Học liệu, tiến độ cá nhân, thi, nộp thí nghiệm, AI Tutor.'], ['Giảng viên', 'Quản lý lớp/nội dung, đề thi, giao và xác nhận thí nghiệm, analytics.'], ['Trợ giảng', 'Xem phạm vi lớp được phân công; chấm thí nghiệm và hỗ trợ kỳ thi.'], ['Quản trị viên', 'Người dùng, học kỳ, môn học, cài đặt, nhật ký và tổng hợp analytics.']].map(([title, detail]) => <div key={title} className="rounded-xl bg-[#F8FAFC] p-4"><strong>{title}</strong><p className="mt-1 text-[#64748B]">{detail}</p></div>)}</div></Card>
    </AdminPageShell>
  );
}

export function AdminAcademicsPage() {
  return <AdminPageShell currentPage="admin_academics.html" title="Học kỳ, học phần và chủ đề" description="Thiết lập phạm vi giảng dạy trước khi lớp học, học liệu, ngân hàng câu hỏi và thí nghiệm được vận hành." actions={<><Button variant="secondary" icon="calendar_month">Tạo học kỳ</Button><Button icon="menu_book">Tạo học phần</Button></>}><div className="mt-6"><Tabs items={[{ id: 'SEMESTERS', label: 'Học kỳ' }, { id: 'SUBJECTS', label: 'Học phần' }, { id: 'FLOW', label: 'Luồng nội dung' }]}>{(tab) => tab === 'SEMESTERS' ? <Card className="mt-5 p-5"><DataTable columns={['Học kỳ', 'Thời gian', 'Lớp', 'Trạng thái', '']} rows={semesters} renderRow={(row) => <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-3"><strong>{row.name}</strong><span className="block text-[#64748B]">{row.code}</span></td><td className="px-3 py-3">{row.dates}</td><td className="px-3 py-3">{row.classes}</td><td className="px-3 py-3"><StatusBadge tone={statusTone(row.status)}>{statusLabel(row.status)}</StatusBadge></td><td className="px-3 py-3"><button className="font-semibold text-primary">Chỉnh sửa</button></td></tr>} /></Card> : tab === 'SUBJECTS' ? <Card className="mt-5 p-5"><DataTable columns={['Học phần', 'Chủ đề', 'Học liệu', 'Trạng thái', '']} rows={subjects} renderRow={(row) => <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-3"><strong>{row.name}</strong><span className="block text-[#64748B]">{row.code}</span></td><td className="px-3 py-3">{row.topics}</td><td className="px-3 py-3">{row.materials}</td><td className="px-3 py-3"><StatusBadge tone={statusTone(row.status)}>{statusLabel(row.status)}</StatusBadge></td><td className="px-3 py-3"><button className="font-semibold text-primary">Quản lý chủ đề</button></td></tr>} /></Card> : <Card className="mt-5 p-6"><div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">{[['Môn học', 'BAS1201'], ['Chủ đề', 'Động lực học'], ['Học liệu', 'Slide · Video · PDF'], ['Khai thác', 'Lớp · Câu hỏi · AI Tutor · Analytics']].map(([title, detail], index) => <React.Fragment key={title}><div className="rounded-xl bg-[#F8FAFC] p-5"><span className="text-label-md font-bold text-primary">{index + 1}</span><h2 className="mt-2 font-bold">{title}</h2><p className="mt-1 text-body-sm text-[#64748B]">{detail}</p></div>{index < 3 && <span className="hidden md:flex items-center justify-center material-symbols-outlined text-[#94A3B8]">arrow_forward</span>}</React.Fragment>)}</div></Card>}</Tabs></div></AdminPageShell>;
}

export function AdminContentPage() {
  const [tab, setTab] = useState('MATERIALS');
  const [approved, setApproved] = useState([]);
  const rows = tab === 'MATERIALS' ? [
    { id: 'MAT-042', title: 'Video minh họa lực ma sát', owner: 'TS. Nguyễn Văn B', topic: 'Động lực học', type: 'Học liệu' },
    { id: 'MAT-043', title: 'Phiếu bài tập công và năng lượng', owner: 'TS. Lê Minh K.', topic: 'Công và năng lượng', type: 'Học liệu' },
  ] : [
    { id: 'Q-118', title: 'Một vật trượt trên mặt phẳng nghiêng…', owner: 'TS. Nguyễn Văn B', topic: 'Lực ma sát', type: 'Câu hỏi' },
    { id: 'Q-119', title: 'Chọn phát biểu đúng về động lượng…', owner: 'TS. Lê Minh K.', topic: 'Bảo toàn động lượng', type: 'Câu hỏi' },
  ];
  return <AdminPageShell currentPage="admin_content.html" title="Duyệt học liệu và câu hỏi" description="Nội dung chỉ được dùng trong lớp học, đề thi và AI Tutor sau khi được phê duyệt."><Card className="mt-6 p-5"><div className="flex gap-2 border-b border-[#E2E8F0] pb-4"><Button variant={tab === 'MATERIALS' ? 'primary' : 'secondary'} onClick={() => setTab('MATERIALS')}>Học liệu chờ duyệt</Button><Button variant={tab === 'QUESTIONS' ? 'primary' : 'secondary'} onClick={() => setTab('QUESTIONS')}>Câu hỏi chờ duyệt</Button></div><div className="mt-5"><DataTable columns={['Nội dung', 'Người tạo', 'Chủ đề', 'Trạng thái', '']} rows={rows} renderRow={(row) => <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-3"><strong>{row.title}</strong><span className="block text-body-sm text-[#64748B]">{row.id} · {row.type}</span></td><td className="px-3 py-3">{row.owner}</td><td className="px-3 py-3">{row.topic}</td><td className="px-3 py-3">{approved.includes(row.id) ? <StatusBadge tone="success">Đã phê duyệt</StatusBadge> : <StatusBadge tone="warning">Chờ phê duyệt</StatusBadge>}</td><td className="px-3 py-3">{approved.includes(row.id) ? <span className="text-body-sm text-[#64748B]">Đã xử lý</span> : <div className="flex gap-2"><button onClick={() => setApproved((current) => [...current, row.id])} className="font-semibold text-[#15803D]">Phê duyệt</button><button className="font-semibold text-primary">Trả lại</button></div>}</td></tr>} /></div></Card><Card className="mt-6 p-5"><p className="text-body-sm text-[#64748B]">Học liệu đã duyệt được hiển thị theo quyền người xem. Câu hỏi chỉ được dùng chính thức sau khi được quản trị viên phê duyệt.</p></Card></AdminPageShell>;
}

export function AdminOperationsPage() {
  return <AdminPageShell currentPage="admin_operations.html" title="Cấu hình và nhật ký vận hành" description="Quản lý thiết lập hệ thống, kiểm tra audit log và kích hoạt tổng hợp dữ liệu." actions={<Button icon="sync">Chạy tổng hợp analytics</Button>}><div className="mt-6"><Tabs items={[{ id: 'SETTINGS', label: 'Cấu hình' }, { id: 'ACTIVITY', label: 'Activity log' }, { id: 'AUDIT', label: 'Audit log' }]}>{(tab) => tab === 'SETTINGS' ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">{[['Giới hạn tải tệp', '50 MB', 'Học liệu và minh chứng thí nghiệm'], ['CORS origins', 'Môi trường phát triển', 'Kiểm soát domain frontend được phép'], ['Lịch analytics', '01:00 hằng ngày', 'Tổng hợp dashboard và phân tích'], ['Trạng thái lưu trữ', 'MinIO / local fallback', 'Kho tệp dùng URL nội bộ']].map(([label, value, note]) => <Card key={label} className="p-5"><p className="text-body-sm text-[#64748B]">{label}</p><h2 className="mt-1 text-headline-sm font-bold">{value}</h2><p className="mt-2 text-body-sm text-[#64748B]">{note}</p><button className="mt-4 font-semibold text-primary">Chỉnh sửa</button></Card>)}</div> : <Card className="mt-5 p-5"><DataTable columns={['Thời gian', 'Người thực hiện', 'Hành động', 'Đối tượng']} rows={adminActivity} renderRow={(item) => <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-3">{item.time}</td><td className="px-3 py-3">{tab === 'AUDIT' ? 'System audit' : item.actor}</td><td className="px-3 py-3">{item.action}</td><td className="px-3 py-3 text-[#64748B]">{item.target}</td></tr>} /></Card>}</Tabs></div></AdminPageShell>;
}
