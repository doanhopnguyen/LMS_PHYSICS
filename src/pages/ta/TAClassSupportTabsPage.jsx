import { Form, SubmitButton } from '../../components/Form.jsx';
import React, { useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { demoRoles } from '../../lib/demoSession.js';
import { taNavigation, taUtilityNavigation } from '../../data/taNavigation.js';
import { api } from '../../lib/apiClient.js';
import { listItems, useApiData } from '../../hooks/useApiData.js';

const user = { ...demoRoles.TA, role: demoRoles.TA.label };
const badge = (value) => <StatusBadge tone={value === 'ACTIVE' ? 'success' : 'neutral'}>{value || '—'}</StatusBadge>;

export function TAClassSupportTabsPage() {
  const [classId, setClassId] = useState(() => new URLSearchParams(window.location.search).get('classId') || '');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const classes = useApiData('/api/v1/classes?page=0&size=50');
  const students = useApiData(classId ? `/api/v1/classes/${encodeURIComponent(classId)}/students?page=0&size=50` : null);
  const staff = useApiData(classId ? `/api/v1/classes/${encodeURIComponent(classId)}/staff` : null);
  const exams = useApiData(classId ? `/api/v1/exams/class/${encodeURIComponent(classId)}` : null);
  const options = listItems(classes.data);
  async function grade(event) { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); setBusy(true); setMessage(''); setError(''); try { await api.experiments.gradeSubmission(body.submissionId, { rubricId: body.rubricId, score: Number(body.score), feedback: body.feedback, comment: body.comment }); event.currentTarget.reset(); setMessage('Đã gửi điểm rubric cho bài nộp.'); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } }
  const selectClass = <SelectField label="Lớp" name="ta-class" value={classId} onChange={(event) => setClassId(event.target.value)} className="w-56"><option value="">Chọn lớp</option>{options.map((item) => <option key={item.classId} value={item.classId}>{item.className || item.classCode || item.classId}</option>)}</SelectField>;
  const panel = (resource, loadingLabel, columns, renderRow) => resource.loading ? <Card className="mt-5 p-5" role="status">{loadingLabel}</Card> : resource.error ? <Card className="mt-5 p-5" role="alert">{resource.error}</Card> : <Card className="mt-5 overflow-x-auto p-5"><DataTable columns={columns} rows={listItems(resource.data)} renderRow={renderRow} /></Card>;
  return <AppShell currentPage="ta_class_support.html" title="Hỗ trợ lớp học · PTIT Physics LMS" user={user} homeHref="ta_dashboard.html" navigationItems={taNavigation} utilityItems={taUtilityNavigation} showChatLauncher={false}><PageContainer><PageTitle eyebrow="KHU VỰC TRỢ GIẢNG" title="Hỗ trợ lớp học" description="Tra cứu dữ liệu lớp được phân công và chấm rubric cho bài nộp thí nghiệm." /><AuthAlert>{message}</AuthAlert><AuthAlert error>{error}</AuthAlert><div className="mt-6"><Tabs items={[{ id: 'students', label: 'Sinh viên' }, { id: 'staff', label: 'Nhân sự' }, { id: 'exams', label: 'Kỳ thi' }, { id: 'grading', label: 'Chấm rubric' }]} actions={selectClass}>{(tab) => !classId ? <Card className="mt-5 p-6 text-[#64748B]">Chọn lớp được phân công để xem dữ liệu.</Card> : tab === 'students' ? panel(students, 'Đang tải sinh viên…', ['Sinh viên', 'Email', 'Trạng thái'], (item) => <tr key={item.studentId || item.userId} className="border-t"><td className="p-3 font-medium">{item.fullName || item.username || item.studentCode || item.userId}</td><td className="p-3">{item.email || '—'}</td><td className="p-3">{badge(item.status)}</td></tr>) : tab === 'staff' ? panel(staff, 'Đang tải nhân sự…', ['Nhân sự', 'Vai trò', 'Email'], (item) => <tr key={item.userId} className="border-t"><td className="p-3 font-medium">{item.fullName || item.username || item.userId}</td><td className="p-3">{item.role || '—'}</td><td className="p-3">{item.email || '—'}</td></tr>) : tab === 'exams' ? panel(exams, 'Đang tải kỳ thi…', ['Kỳ thi', 'Thời gian', 'Trạng thái'], (item) => <tr key={item.examId} className="border-t"><td className="p-3 font-medium">{item.examName || item.title || item.examId}</td><td className="p-3">{item.startTime || item.startAt || '—'}</td><td className="p-3">{badge(item.status)}</td></tr>) : <Card className="mt-5 p-5"><p className="text-body-sm text-[#64748B]">Nhập thông tin bài nộp và tiêu chí chấm được cung cấp.</p><Form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={grade}><input name="submissionId" required placeholder="UUID bài nộp" className="rounded-xl border p-3" /><input name="rubricId" required placeholder="UUID rubric" className="rounded-xl border p-3" /><input name="score" type="number" step="0.1" min="0" required placeholder="Điểm" className="rounded-xl border p-3" /><input name="feedback" placeholder="Nhận xét" className="rounded-xl border p-3" /><textarea name="comment" rows="3" placeholder="Ghi chú" className="rounded-xl border p-3 md:col-span-2" /><div className="md:col-span-2"><SubmitButton type="submit" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi điểm rubric'}</SubmitButton></div></Form></Card>}</Tabs></div></PageContainer></AppShell>;
}
