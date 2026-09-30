import React, { useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { FormField } from '../../components/FormField.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { taNavigation, taUtilityNavigation } from '../../data/taNavigation.js';
import { listItems, useApiData } from '../../hooks/useApiData.js';
import { api } from '../../lib/apiClient.js';
import { demoRoles } from '../../lib/demoSession.js';

const user = { ...demoRoles.TA, role: demoRoles.TA.label };
const statusTone = (value) => ['ACTIVE', 'GRADED', 'COMPLETED', 'SUBMITTED'].includes(value) ? 'success' : value === 'IN_PROGRESS' ? 'primary' : 'neutral';
const badge = (entry) => <StatusBadge tone={statusTone(entry)}>{entry || '—'}</StatusBadge>;
const value = (item, ...keys) => keys.map((key) => item?.[key]).find((entry) => entry !== undefined && entry !== null && entry !== '') || '—';
const dateTime = (entry) => {
  if (!entry) return '—';
  const parsed = new Date(entry);
  return Number.isNaN(parsed.getTime()) ? entry : parsed.toLocaleString('vi-VN');
};

function ResourceTable({ resource, loadingLabel, emptyLabel, columns, renderRow }) {
  if (resource.loading) return <Card className="mt-5 p-5" role="status">{loadingLabel}</Card>;
  if (resource.error) return <Card className="mt-5 p-5" role="alert">{resource.error}</Card>;
  const rows = listItems(resource.data);
  if (!rows.length) return <Card className="mt-5 p-5 text-[#64748B]">{emptyLabel}</Card>;
  return <Card className="mt-5 overflow-x-auto p-5"><DataTable columns={columns} rows={rows} renderRow={renderRow} /></Card>;
}

export function TAClassSupportTabsPage() {
  const [classId, setClassId] = useState(() => new URLSearchParams(window.location.search).get('classId') || '');
  const [examId, setExamId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const classes = useApiData('/api/v1/classes?page=0&size=50');
  const classPath = classId ? `/api/v1/classes/${encodeURIComponent(classId)}` : null;
  const students = useApiData(classPath && `${classPath}/students?page=0&size=50`);
  const staff = useApiData(classPath && `${classPath}/staff`);
  const schedules = useApiData(classPath && `${classPath}/schedules`);
  const exams = useApiData(classId ? `/api/v1/exams/class/${encodeURIComponent(classId)}` : null);
  const attempts = useApiData(examId ? `/api/v1/exams/${encodeURIComponent(examId)}/attempts` : null);
  const roster = useApiData(examId ? `/api/v1/exams/${encodeURIComponent(examId)}/roster` : null);
  const options = listItems(classes.data);
  const examOptions = listItems(exams.data);

  function changeClass(nextClassId) {
    setClassId(nextClassId); setExamId(''); setMessage(''); setError('');
    const url = new URL(window.location.href);
    if (nextClassId) url.searchParams.set('classId', nextClassId); else url.searchParams.delete('classId');
    window.history.replaceState(window.history.state, '', url);
  }
  async function grade(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    const score = fields.score === '' ? undefined : Number(fields.score);
    setBusy(true); setMessage(''); setError('');
    try {
      await api.experiments.gradeSubmission(fields.submissionId, {
        ...(fields.rubricId && { rubricId: fields.rubricId }), ...(Number.isFinite(score) && { score }),
        ...(fields.feedback && { feedback: fields.feedback }), ...(fields.comment && { comment: fields.comment }),
      });
      form.reset(); setMessage('Đã gửi kết quả chấm bài nộp thí nghiệm.');
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }
  const selectClass = <SelectField label="Lớp" name="ta-class" value={classId} onChange={(event) => changeClass(event.target.value)} className="w-56"><option value="">Chọn lớp</option>{options.map((item) => <option key={item.classId} value={item.classId}>{value(item, 'className', 'classCode', 'classId')}</option>)}</SelectField>;
  const selectExam = <SelectField label="Kỳ thi" name="ta-exam" value={examId} onChange={(event) => setExamId(event.target.value)} className="w-64"><option value="">Chọn kỳ thi để xem lượt làm</option>{examOptions.map((item) => <option key={item.examId} value={item.examId}>{value(item, 'examName', 'title', 'examId')}</option>)}</SelectField>;

  return <AppShell currentPage="ta_class_support.html" title="Hỗ trợ lớp học · PTIT Physics LMS" user={user} homeHref="ta_dashboard.html" navigationItems={taNavigation} utilityItems={taUtilityNavigation} showChatLauncher={false}><PageContainer>
    <PageTitle eyebrow="KHU VỰC TRỢ GIẢNG" title="Hỗ trợ lớp học" description="Theo dõi lớp được phân công, kỳ thi và chấm bài nộp thí nghiệm trong đúng phạm vi quyền TA." />
    <AuthAlert>{message}</AuthAlert><AuthAlert error>{error}</AuthAlert>
    <div className="mt-6"><Tabs items={[{ id: 'students', label: 'Sinh viên' }, { id: 'staff', label: 'Nhân sự' }, { id: 'schedule', label: 'Lịch học' }, { id: 'exams', label: 'Kỳ thi' }, { id: 'grading', label: 'Chấm rubric' }]} actions={selectClass}>
      {(tab) => !classId ? <Card className="mt-5 p-6 text-[#64748B]">Chọn lớp được phân công để xem dữ liệu.</Card>
        : tab === 'students' ? <ResourceTable resource={students} loadingLabel="Đang tải sinh viên…" emptyLabel="Lớp chưa có sinh viên." columns={['Sinh viên', 'Email', 'Trạng thái']} renderRow={(item) => <tr key={value(item, 'studentId', 'userId')} className="border-t"><td className="p-3 font-medium">{value(item, 'fullName', 'username', 'studentCode', 'userId')}</td><td className="p-3">{value(item, 'email')}</td><td className="p-3">{badge(item.status)}</td></tr>} />
        : tab === 'staff' ? <ResourceTable resource={staff} loadingLabel="Đang tải nhân sự…" emptyLabel="Chưa có nhân sự trong lớp." columns={['Nhân sự', 'Vai trò', 'Email']} renderRow={(item) => <tr key={value(item, 'userId')} className="border-t"><td className="p-3 font-medium">{value(item, 'fullName', 'username', 'userId')}</td><td className="p-3">{value(item, 'roleInClass', 'role')}</td><td className="p-3">{value(item, 'email')}</td></tr>} />
        : tab === 'schedule' ? <ResourceTable resource={schedules} loadingLabel="Đang tải lịch học…" emptyLabel="Chưa có lịch học." columns={['Buổi học', 'Thời gian', 'Địa điểm', 'Loại']} renderRow={(item) => <tr key={value(item, 'scheduleId')} className="border-t"><td className="p-3 font-medium">{value(item, 'dayOfWeekText', 'dayOfWeek')}</td><td className="p-3">{value(item, 'startTime')} – {value(item, 'endTime')}</td><td className="p-3">{[item.building, item.room].filter(Boolean).join(' · ') || '—'}</td><td className="p-3">{badge(item.lessonType)}</td></tr>} />
        : tab === 'exams' ? <><ResourceTable resource={exams} loadingLabel="Đang tải kỳ thi…" emptyLabel="Lớp chưa có kỳ thi." columns={['Kỳ thi', 'Thời gian', 'Loại']} renderRow={(item) => <tr key={item.examId} className="border-t"><td className="p-3 font-medium">{value(item, 'examName', 'title', 'examId')}</td><td className="p-3">{dateTime(item.startTime || item.startAt)}</td><td className="p-3">{badge(item.examType || item.status)}</td></tr>} />{examOptions.length > 0 && <Card className="mt-5 p-5">{selectExam}{examId && <div className="mt-4 grid gap-5 xl:grid-cols-2"><ResourceTable resource={roster} loadingLabel="Đang tải danh sách thí sinh…" emptyLabel="Chưa có thí sinh." columns={['Thí sinh', 'Trạng thái']} renderRow={(item) => <tr key={value(item, 'studentId', 'userId')} className="border-t"><td className="p-3 font-medium">{value(item, 'fullName', 'studentName', 'studentCode', 'userId')}</td><td className="p-3">{badge(item.status)}</td></tr>} /><ResourceTable resource={attempts} loadingLabel="Đang tải lượt làm…" emptyLabel="Chưa có lượt làm bài." columns={['Thí sinh', 'Trạng thái', 'Điểm']} renderRow={(item) => <tr key={value(item, 'attemptId')} className="border-t"><td className="p-3 font-medium">{value(item, 'studentName', 'fullName', 'studentId')}</td><td className="p-3">{badge(item.status)}</td><td className="p-3">{value(item, 'totalScore', 'score')}</td></tr>} /></div>}</Card>}</>
        : <Card className="mt-5 p-5"><p className="text-body-sm text-[#64748B]">Nhập mã bài nộp do sinh viên hoặc giảng viên cung cấp. API không cung cấp danh sách bài nộp thí nghiệm cho TA, nên không hiển thị dữ liệu suy đoán ở đây.</p><Form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={grade} busy={busy}><FormField label="UUID bài nộp" name="submissionId" required /><FormField label="UUID rubric (nếu có)" name="rubricId" /><FormField label="Điểm" name="score" type="number" step="0.1" min="0" /><FormField label="Nhận xét ngắn" name="feedback" /><FormField label="Ghi chú" name="comment" multiline rows="3" className="md:col-span-2" /><div className="md:col-span-2"><SubmitButton busy={busy}>Gửi điểm rubric</SubmitButton></div></Form></Card>}
    </Tabs></div>
  </PageContainer></AppShell>;
}
