import React, { useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { PaginatedCollection } from '../../components/Pagination.jsx';

const initialItems = [
  { id: 'EVD-001', title: 'Lab 01 · Khảo sát rơi tự do', submittedAt: '20/09/2026 · 14:20', files: 3, score: '8.8 / 10', status: 'CONFIRMED' },
  { id: 'EVD-002', title: 'Lab 02 · Mặt phẳng nghiêng', submittedAt: '23/09/2026 · 09:12', files: 2, score: 'Chờ chấm', status: 'SUBMITTED' },
  { id: 'EVD-003', title: 'Lab 03 · Va chạm đàn hồi', submittedAt: '—', files: 0, score: 'Chưa nộp', status: 'DRAFT' },
];
const meta = { CONFIRMED: ['Đã xác nhận', 'success'], SUBMITTED: ['Đã nộp', 'warning'], DRAFT: ['Chưa nộp', 'neutral'] };

export function StudentEvidencePage() {
  const [items, setItems] = useState(initialItems);
  return <AppShell currentPage="student_evidence.html" title="Minh chứng thí nghiệm · PTIT Physics 1"><PageContainer><PageTitle eyebrow="KHO MINH CHỨNG CÁ NHÂN" title="Báo cáo và minh chứng thí nghiệm" description="Theo dõi tệp số liệu, ảnh, đồ thị và trạng thái chấm của từng bài thí nghiệm." actions={<a href="virtual_lab.html"><Button icon="science">Mở danh sách lab</Button></a>} /><Card className="mt-6 p-5"><PaginatedCollection items={items} pageSize={10}>{(pageItems) => <DataTable columns={['Bài thí nghiệm', 'Thời điểm nộp', 'Minh chứng', 'Kết quả', 'Trạng thái', '']} rows={pageItems} renderRow={(item) => { const [label, tone] = meta[item.status]; return <tr key={item.id} className="border-t border-[#E2E8F0]"><td className="px-3 py-3"><strong>{item.title}</strong><span className="block text-body-sm text-[#64748B]">{item.id}</span></td><td className="px-3 py-3 text-[#64748B]">{item.submittedAt}</td><td className="px-3 py-3">{item.files ? `${item.files} tệp` : '—'}</td><td className="px-3 py-3 font-semibold">{item.score}</td><td className="px-3 py-3"><StatusBadge tone={tone}>{label}</StatusBadge></td><td className="px-3 py-3"><a href="lab_report_rubric.html" className="font-semibold text-primary">{item.status === 'DRAFT' ? 'Nộp bài' : 'Xem chi tiết'}</a></td></tr>; }} />}</PaginatedCollection></Card><Card className="mt-6 p-5"><h2 className="text-headline-sm font-bold">Quy trình nộp bài</h2><div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">{[['1', 'Thực hiện mô phỏng', 'Lab bên thứ ba tạo số liệu hoặc tệp kết quả.'], ['2', 'Nộp minh chứng', 'Đính kèm file, URL hoặc dữ liệu đo ở báo cáo.'], ['3', 'Chấm và xác nhận', 'TA/giảng viên chấm rubric; giảng viên xác nhận điểm cuối.']].map(([step, title, detail]) => <div key={step} className="rounded-xl bg-[#F8FAFC] p-4"><span className="text-label-md font-bold text-primary">{step}</span><h3 className="mt-2 font-bold">{title}</h3><p className="mt-1 text-body-sm text-[#64748B]">{detail}</p></div>)}</div></Card></PageContainer></AppShell>;
}
