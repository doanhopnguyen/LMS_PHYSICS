import { Form, SubmitButton } from '../../components/Form.jsx';
import React, { useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { DashboardOverview } from '../../components/DashboardOverview.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { demoRoles } from '../../lib/demoSession.js';
import { taNavigation, taUtilityNavigation } from '../../data/taNavigation.js';
import { api } from '../../lib/apiClient.js';
import { listItems, useApiData } from '../../hooks/useApiData.js';

const user = { ...demoRoles.TA, role: demoRoles.TA.label };
function TAShell({ currentPage, title, description, children }) { return <AppShell currentPage={currentPage} title={`${title} · PTIT Physics LMS`} user={user} homeHref="ta_dashboard.html" navigationItems={taNavigation} utilityItems={taUtilityNavigation} showChatLauncher={false}><PageContainer><PageTitle eyebrow="KHU VỰC TRỢ GIẢNG" title={title} description={description} />{children}</PageContainer></AppShell>; }
const className = (item) => item.className || item.classCode || item.classId;
const status = (value) => <StatusBadge tone={value === 'ACTIVE' ? 'success' : 'neutral'}>{value || '—'}</StatusBadge>;
const classUrl = (id) => `ta_class_support.html?classId=${encodeURIComponent(id)}`;

function ClassList({ classes, loading, error, reload, actionLabel = 'Mở hỗ trợ' }) {
  if (loading) return <p role="status">Đang tải lớp được phân công…</p>;
  if (error) return <p role="alert">{error} <Button onClick={reload}>Thử lại</Button></p>;
  if (classes.length === 0 && !actionLabel) return null;
  return <DataTable columns={['Lớp học', 'Học phần', 'Trạng thái', '']} rows={classes} renderRow={(item) => <tr key={item.classId} className="border-t"><td className="p-3 font-medium">{className(item)}</td><td className="p-3">{item.subjectName || item.subjectCode || '—'}</td><td className="p-3">{status(item.status)}</td><td className="p-3"><a href={classUrl(item.classId)}><Button variant="secondary">{actionLabel}</Button></a></td></tr>} />;
}

export function TADashboardApiPage() {
  const classesResource = useApiData('/api/v1/classes?page=0&size=20');
  const classes = listItems(classesResource.data);
  const metrics = [{ label: 'Lớp được phân công', value: classesResource.data?.totalElements ?? classes.length, detail: 'Từ danh sách lớp được cấp quyền', icon: 'groups', tone: 'primary' }, { label: 'Lớp đang hoạt động', value: classes.filter((item) => item.status === 'ACTIVE').length, detail: 'Trong trang dữ liệu hiện tại', icon: 'school', tone: 'success' }];
  return <TAShell currentPage="ta_dashboard.html" title="Tổng quan trợ giảng" description="Theo dõi các lớp và công việc hỗ trợ được cấp quyền."><div className="mt-6"><DashboardOverview role="TA"><MetricGrid columns={2} items={metrics} /><Card className="col-span-full p-6"><SectionHeader icon="assignment_late" title="Công việc được phân công" action={<a href="ta_work_queue.html" className="font-semibold text-primary">Xem tất cả</a>} /><div className="mt-5 overflow-x-auto"><ClassList classes={classes.slice(0, 5)} loading={classesResource.loading} error={classesResource.error} reload={classesResource.reload} /></div></Card></DashboardOverview></div></TAShell>;
}

export function TAWorkQueueApiPage() {
  const classesResource = useApiData('/api/v1/classes?page=0&size=50');
  const classes = listItems(classesResource.data);
  return <TAShell currentPage="ta_work_queue.html" title="Lớp và công việc được phân công" description="Chọn lớp để xem sinh viên, nhân sự, kỳ thi và thực hiện chấm rubric."><Card className="mt-6 overflow-x-auto p-5"><ClassList classes={classes} loading={classesResource.loading} error={classesResource.error} reload={classesResource.reload} /></Card></TAShell>;
}

export function TAClassSupportApiPage() {
  const initialClassId = new URLSearchParams(window.location.search).get('classId') || '';
  const [classId, setClassId] = useState(initialClassId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const classesResource = useApiData('/api/v1/classes?page=0&size=50');
  const students = useApiData(classId ? `/api/v1/classes/${encodeURIComponent(classId)}/students?page=0&size=50` : null);
  const staff = useApiData(classId ? `/api/v1/classes/${encodeURIComponent(classId)}/staff` : null);
  const exams = useApiData(classId ? `/api/v1/exams/class/${encodeURIComponent(classId)}` : null);
  const classRows = listItems(classesResource.data);
  const selectedClass = classRows.find((item) => item.classId === classId);
  async function grade(event) {
    event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setMessage(''); setError('');
    try { await api.experiments.gradeSubmission(body.submissionId, { rubricId: body.rubricId, score: Number(body.score), feedback: body.feedback, comment: body.comment }); event.currentTarget.reset(); setMessage('Đã gửi điểm rubric cho bài nộp.'); }
    catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }
  return <TAShell currentPage="ta_class_support.html" title="Hỗ trợ lớp học" description="Tra cứu dữ liệu lớp được phân công và chấm rubric cho bài nộp thí nghiệm."><AuthAlert>{message}</AuthAlert><AuthAlert error>{error}</AuthAlert><Card className="mt-6 p-5"><label className="block text-body-sm font-semibold">Chọn lớp được phân công<select value={classId} onChange={(event) => setClassId(event.target.value)} className="mt-2 block w-full rounded-xl border p-3"> <option value="">Chọn lớp</option>{classRows.map((item) => <option key={item.classId} value={item.classId}>{className(item)}</option>)}</select></label></Card>{!classId ? <Card className="mt-5 p-6 text-[#64748B]">Chọn một lớp để xem dữ liệu được phân quyền.</Card> : <div className="mt-6"><Tabs items={[{ id: 'students', label: 'Sinh viên' }, { id: 'staff', label: 'Nhân sự' }, { id: 'exams', label: 'Kỳ thi' }, { id: 'grading', label: 'Chấm rubric' }]}>{(tab) => tab === 'students' ? <Card className="mt-5 overflow-x-auto p-5">{students.loading ? <p role="status">Đang tải sinh viên…</p> : students.error ? <p role="alert">{students.error}</p> : <ClassList classes={[]} loading={false} error="" reload={() => {}} actionLabel="" />}{!students.loading && !students.error && <DataTable columns={['Sinh viên', 'Email', 'Trạng thái']} rows={listItems(students.data)} renderRow={(item) => <tr key={item.studentId || item.userId} className="border-t"><td className="p-3 font-medium">{item.fullName || item.username || item.studentCode || item.userId}</td><td className="p-3">{item.email || '—'}</td><td className="p-3">{status(item.status)}</td></tr>} />}</Card> : tab === 'staff' ? <Card className="mt-5 overflow-x-auto p-5">{staff.loading ? <p role="status">Đang tải nhân sự…</p> : staff.error ? <p role="alert">{staff.error}</p> : <DataTable columns={['Nhân sự', 'Vai trò', 'Email']} rows={listItems(staff.data)} renderRow={(item) => <tr key={item.userId} className="border-t"><td className="p-3 font-medium">{item.fullName || item.username || item.userId}</td><td className="p-3">{item.role || '—'}</td><td className="p-3">{item.email || '—'}</td></tr>} />}</Card> : tab === 'exams' ? <Card className="mt-5 overflow-x-auto p-5">{exams.loading ? <p role="status">Đang tải kỳ thi…</p> : exams.error ? <p role="alert">{exams.error}</p> : <DataTable columns={['Kỳ thi', 'Thời gian', 'Trạng thái']} rows={listItems(exams.data)} renderRow={(item) => <tr key={item.examId} className="border-t"><td className="p-3 font-medium">{item.examName || item.title || item.examId}</td><td className="p-3">{item.startTime || item.startAt || '—'}</td><td className="p-3">{status(item.status)}</td></tr>} />}</Card> : <Card className="mt-5 p-5"><p className="text-body-sm text-[#64748B]">Nhập thông tin bài nộp và tiêu chí chấm được cung cấp.</p><Form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={grade}><label>UUID bài nộp<input name="submissionId" required className="mt-2 block w-full rounded-xl border p-3" /></label><label>UUID rubric<input name="rubricId" required className="mt-2 block w-full rounded-xl border p-3" /></label><label>Điểm<input name="score" type="number" step="0.1" min="0" required className="mt-2 block w-full rounded-xl border p-3" /></label><label>Nhận xét<input name="feedback" className="mt-2 block w-full rounded-xl border p-3" /></label><label className="md:col-span-2">Ghi chú<textarea name="comment" rows="3" className="mt-2 block w-full rounded-xl border p-3" /></label><div className="md:col-span-2"><SubmitButton type="submit" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi điểm rubric'}</SubmitButton></div></Form></Card>}</Tabs></div>}</TAShell>;
}
