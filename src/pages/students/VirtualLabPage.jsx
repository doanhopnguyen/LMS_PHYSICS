import { PaginatedList } from '../../components/Pagination.jsx';
import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { api } from '../../lib/apiClient.js';

const gradients = ['from-[#E52220] to-[#F59E0B]', 'from-[#1E3A8A] to-[#0F766E]', 'from-[#334155] to-[#7C3AED]', 'from-[#14532D] to-[#0F766E]'];
const rowsOf = (value) => Array.isArray(value) ? value : value?.content || value?.data || [];

export function VirtualLabPage() {
  const [experiments, setExperiments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const selectedClass = classes.find((item) => String(item.classId) === String(classId));

  useEffect(() => {
    let alive = true;
    api.students.myClasses().then((data) => { if (!alive) return; const items = rowsOf(data); setClasses(items); if (!items.length) setLoading(false); }).catch((loadError) => { if (alive) { setError(loadError.message || 'Không thể tải học phần.'); setLoading(false); } });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!classes.length) return;
    let alive = true; setLoading(true); setError('');
    const subjectIds = [...new Set((selectedClass ? [selectedClass] : classes).map((item) => item.subjectId).filter(Boolean))];
    Promise.all(subjectIds.map((id) => api.experiments.list(id))).then((groups) => { if (alive) { const unique = new Map(); groups.flatMap(rowsOf).forEach((item) => unique.set(String(item.experimentId), item)); setExperiments([...unique.values()]); } }).catch((loadError) => { if (alive) setError(loadError.message || 'Không thể tải danh sách thí nghiệm.'); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [classId, classes]);

  return <AppShell currentPage="virtual_lab.html" title="Phòng thí nghiệm 3D · PTIT Physics 1" breadcrumbs={['Phòng thí nghiệm 3D']} current="Danh sách thí nghiệm"><PageContainer>
    <PageTitle eyebrow="PHÒNG THÍ NGHIỆM 3D" title="Thí nghiệm trực tuyến" description="Chọn học phần để mở mô phỏng, đọc hướng dẫn và lập báo cáo thực hành." actions={<><label className="text-body-sm font-semibold">Học phần<select value={classId} onChange={(event) => setClassId(event.target.value)} className="mt-2 block rounded-xl border border-[#CBD5E1] bg-white p-3 font-normal"><option value="">Tất cả học phần</option>{classes.map((item) => <option key={item.classId} value={item.classId}>{item.subjectName || item.subjectCode || item.classCode}</option>)}</select></label><a href="student_evidence.html"><Button icon="history">Minh chứng của tôi</Button></a></>} />
    {loading ? <p className="py-10 text-center text-body-md text-[#64748B]">Đang tải danh sách thí nghiệm…</p> : error ? <Card className="p-8 text-center"><p role="alert" className="text-primary">{error}</p></Card> : !classes.length ? <Card className="p-10 text-center text-[#64748B]">Bạn chưa được ghi danh vào học phần nào.</Card> : !experiments.length ? <Card className="p-10 text-center text-[#64748B]">Không có bài thí nghiệm phù hợp.</Card> : <PaginatedList className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{experiments.map((experiment, index) => { const query = `experimentId=${encodeURIComponent(experiment.experimentId)}${selectedClass ? `&classId=${encodeURIComponent(selectedClass.classId)}` : ''}`; return <Card key={experiment.experimentId} className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md"><div className={`flex h-36 items-center justify-center bg-gradient-to-br ${gradients[index % gradients.length]} text-white`}><span className="material-symbols-outlined text-6xl opacity-70">science</span></div><div className="p-5"><span className="text-label-md text-[#64748B]">THÍ NGHIỆM {String(experiment.orderIndex || index + 1).padStart(2, '0')}</span><h2 className="mt-3 min-h-[52px] text-headline-sm font-bold">{experiment.title || 'Thí nghiệm không có tiêu đề'}</h2>{experiment.description && <p className="mt-1 line-clamp-2 text-body-sm text-[#64748B]">{experiment.description}</p>}<div className="mt-5 flex gap-2"><a href={`3d_workspace.html?${query}`} className="flex-1"><Button className="w-full" icon="play_arrow">Mở mô phỏng</Button></a><a href={`lab_report_rubric.html?${query}${experiment.assignmentId ? `&assignmentId=${encodeURIComponent(experiment.assignmentId)}` : ''}`}><button className="h-10 w-10 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:border-primary hover:text-primary" aria-label="Mở báo cáo"><span className="material-symbols-outlined">description</span></button></a></div></div></Card>; })}</PaginatedList>}
  </PageContainer></AppShell>;
}
