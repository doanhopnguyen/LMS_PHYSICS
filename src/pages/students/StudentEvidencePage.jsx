import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { PaginatedCollection } from '../../components/Pagination.jsx';
import { api } from '../../lib/apiClient.js';

const meta = { EXPERIMENT: ['Minh chứng thí nghiệm', 'success'], EXAM: ['Minh chứng bài thi', 'warning'], AI_CONVERSATION: ['Hoạt động AI', 'neutral'] };
const rowsOf = (value) => Array.isArray(value) ? value : value?.content || value?.data || [];
const dateText = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—';

export function StudentEvidencePage() {
  const [items, setItems] = useState([]); const [activity, setActivity] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const reload = async () => { setLoading(true); setError(''); try { const [evidence, logs] = await Promise.all([api.students.myEvidence(), api.students.myActivityLogs().catch(() => [])]); setItems(rowsOf(evidence)); setActivity(rowsOf(logs)); } catch (loadError) { setError(loadError.message || 'Không thể tải minh chứng.'); } finally { setLoading(false); } };
  useEffect(() => { reload(); }, []);
  return <AppShell currentPage="student_evidence.html" title="Minh chứng thí nghiệm · PTIT Physics 1"><PageContainer><PageTitle eyebrow="KHO MINH CHỨNG CÁ NHÂN" title="Báo cáo và minh chứng thí nghiệm" description="Theo dõi tệp số liệu, ảnh, đồ thị, trạng thái chấm và hoạt động học tập của bạn." actions={<><Button variant="secondary" icon="refresh" onClick={reload} disabled={loading}>Tải lại</Button><a href="virtual_lab.html"><Button icon="science">Mở danh sách lab</Button></a></>} />
    {loading && <p className="py-10 text-center text-body-md text-[#64748B]">Đang tải minh chứng…</p>}{error && <p role="alert" className="py-10 text-center text-body-md text-primary">{error}</p>}
    {!loading && !error && <><Card className="mt-6 p-5"><PaginatedCollection items={items} pageSize={10}>{(pageItems) => <DataTable paginate={false} columns={['Nguồn minh chứng', 'Thời điểm tạo', 'Tệp', 'Trạng thái']} rows={pageItems} renderRow={(item) => { const [label, tone] = meta[item.sourceType] || ['Minh chứng', 'neutral']; return <tr key={item.evidenceId} className="border-t border-[#E2E8F0]"><td className="px-3 py-3"><strong>{label}</strong></td><td className="px-3 py-3 text-[#64748B]">{dateText(item.createdAt)}</td><td className="px-3 py-3">{item.fileUrl ? <a href={item.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary">Mở tệp</a> : 'Không có tệp'}</td><td className="px-3 py-3"><StatusBadge tone={tone}>{label}</StatusBadge></td></tr>; }} />}</PaginatedCollection>{items.length === 0 && <p className="py-8 text-center text-[#64748B]">Chưa có minh chứng nào.</p>}</Card>
      <Card className="mt-6 p-5"><h2 className="text-headline-md font-bold">Nhật ký hoạt động học tập</h2><p className="mt-1 text-body-sm text-[#64748B]">Các hoạt động gần đây do hệ thống ghi nhận.</p><PaginatedCollection items={activity} pageSize={8}>{(pageItems) => <DataTable paginate={false} columns={['Hoạt động', 'Đối tượng', 'Thời điểm']} rows={pageItems} renderRow={(item, index) => <tr key={item.activityLogId || item.logId || `${item.createdAt}-${index}`} className="border-t border-[#E2E8F0]"><td className="px-3 py-3 font-medium">{item.actionType || item.action || 'Hoạt động học tập'}</td><td className="px-3 py-3 text-[#64748B]">{item.objectType || item.entityType || '—'}</td><td className="px-3 py-3 text-[#64748B]">{dateText(item.createdAt)}</td></tr>} />}</PaginatedCollection>{!activity.length && <p className="py-6 text-center text-[#64748B]">Chưa có hoạt động nào được ghi nhận.</p>}</Card></>}
  </PageContainer></AppShell>;
}
