import { DashboardOverview } from '../../components/DashboardOverview.jsx';
import React, { useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { adminActivity, adminMetrics, semesters, subjects } from '../../data/adminData.js';


function statusTone(status) { return ['ACTIVE', 'CURRENT'].includes(status) ? 'success' : status === 'LOCKED' ? 'primary' : status === 'INACTIVE' ? 'warning' : 'neutral'; }
function statusLabel(status) { return ({ ACTIVE: 'Đang hoạt động', LOCKED: 'Đã khóa', CURRENT: 'Hiện hành', CLOSED: 'Đã kết thúc', INACTIVE: 'Tạm ngưng' })[status] ?? status; }

export function AdminDashboardPage() {
  return (
    <AdminPageShell currentPage="admin_dashboard.html" title="Tổng quan vận hành" description="Theo dõi tài khoản, hoạt động học kỳ và các nội dung cần quản trị.">
      <div className="mt-6"><DashboardOverview role="ADMIN"><MetricGrid items={adminMetrics} columns={2} /></DashboardOverview></div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 p-6">
          <SectionHeader icon="assignment_late" title="Việc cần xử lý" />
          <div className="mt-5 space-y-3">
            {[
              ['pending_actions', '14 học liệu đang chờ phê duyệt', 'Kiểm tra tính phù hợp trước khi công bố cho sinh viên.', 'Học liệu'],
              ['person_off', '4 yêu cầu mở khóa tài khoản', 'Cần xác minh lý do và trạng thái học tập.', 'Người dùng'],
              ['analytics', 'Snapshot analytics chưa đồng bộ', 'Tổng hợp dữ liệu học tập kỳ hiện hành.', 'Vận hành'],
            ].map(([icon, title, detail, scope]) => <Card as="div" key={title} className="flex gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE2E2] text-primary"><span className="material-symbols-outlined">{icon}</span></span><div><div className="flex flex-wrap gap-2 items-center"><h2 className="font-bold">{title}</h2><StatusBadge tone="warning">{scope}</StatusBadge></div><p className="mt-1 text-body-sm text-[#64748B]">{detail}</p></div></Card>)}
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


export function AdminAcademicsPage() {
  return <AdminPageShell currentPage="admin_academics.html" title="Học kỳ, học phần và chủ đề" description="Thiết lập phạm vi giảng dạy trước khi lớp học, học liệu, ngân hàng câu hỏi và thí nghiệm được vận hành." actions={<><Button variant="secondary" icon="calendar_month">Tạo học kỳ</Button><Button icon="menu_book">Tạo học phần</Button></>}><div className="mt-6"><Tabs items={[{ id: 'SEMESTERS', label: 'Học kỳ' }, { id: 'SUBJECTS', label: 'Học phần' }, { id: 'FLOW', label: 'Luồng nội dung' }]}>{(tab) => tab === 'SEMESTERS' ? <Card className="mt-5 p-5"><DataTable columns={['Học kỳ', 'Thời gian', 'Lớp', 'Trạng thái', '']} rows={semesters} renderRow={(row) => <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-3"><strong>{row.name}</strong><span className="block text-[#64748B]">{row.code}</span></td><td className="px-3 py-3">{row.dates}</td><td className="px-3 py-3">{row.classes}</td><td className="px-3 py-3"><StatusBadge tone={statusTone(row.status)}>{statusLabel(row.status)}</StatusBadge></td><td className="px-3 py-3"><button className="font-semibold text-primary">Chỉnh sửa</button></td></tr>} /></Card> : tab === 'SUBJECTS' ? <Card className="mt-5 p-5"><DataTable columns={['Học phần', 'Chủ đề', 'Học liệu', 'Trạng thái', '']} rows={subjects} renderRow={(row) => <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-3"><strong>{row.name}</strong><span className="block text-[#64748B]">{row.code}</span></td><td className="px-3 py-3">{row.topics}</td><td className="px-3 py-3">{row.materials}</td><td className="px-3 py-3"><StatusBadge tone={statusTone(row.status)}>{statusLabel(row.status)}</StatusBadge></td><td className="px-3 py-3"><button className="font-semibold text-primary">Quản lý chủ đề</button></td></tr>} /></Card> : <Card className="mt-5 p-6"><div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">{[['Môn học', 'BAS1201'], ['Chủ đề', 'Động lực học'], ['Học liệu', 'Slide · Video · PDF'], ['Khai thác', 'Lớp · Câu hỏi · AI Tutor · Analytics']].map(([title, detail], index) => <React.Fragment key={title}><Card as="div" className="bg-[#F8FAFC] p-5"><span className="text-label-md font-bold text-primary">{index + 1}</span><h2 className="mt-2 font-bold">{title}</h2><p className="mt-1 text-body-sm text-[#64748B]">{detail}</p></Card>{index < 3 && <span className="hidden md:flex items-center justify-center material-symbols-outlined text-[#94A3B8]">arrow_forward</span>}</React.Fragment>)}</div></Card>}</Tabs></div></AdminPageShell>;
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
  return <AdminPageShell currentPage="admin_content.html" title="Duyệt học liệu và câu hỏi" description="Nội dung chỉ được dùng trong lớp học, đề thi và AI Tutor sau khi được phê duyệt."><Card className="mt-6 p-5"><div className="flex gap-2 border-b border-[#E2E8F0] pb-4"><Button variant={tab === 'MATERIALS' ? 'primary' : 'secondary'} onClick={() => setTab('MATERIALS')}>Học liệu chờ duyệt</Button><Button variant={tab === 'QUESTIONS' ? 'primary' : 'secondary'} onClick={() => setTab('QUESTIONS')}>Câu hỏi chờ duyệt</Button></div><div className="mt-5"><DataTable columns={['Nội dung', 'Người tạo', 'Chủ đề', 'Trạng thái', '']} rows={rows} renderRow={(row) => <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-3"><strong>{row.title}</strong><span className="block text-body-sm text-[#64748B]">{row.id} · {row.type}</span></td><td className="px-3 py-3">{row.owner}</td><td className="px-3 py-3">{row.topic}</td><td className="px-3 py-3">{approved.includes(row.id) ? <StatusBadge tone="success">Đã phê duyệt</StatusBadge> : <StatusBadge tone="warning">Chờ phê duyệt</StatusBadge>}</td><td className="px-3 py-3">{approved.includes(row.id) ? <span className="text-body-sm text-[#64748B]">Đã xử lý</span> : <div className="flex gap-2"><button onClick={() => setApproved((current) => [...current, row.id])} className="font-semibold text-[#15803D]">Phê duyệt</button><button className="font-semibold text-primary">Trả lại</button></div>}</td></tr>} /></div></Card></AdminPageShell>;
}
