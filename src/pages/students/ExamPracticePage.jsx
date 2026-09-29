import React, { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { api } from '../../lib/apiClient.js';
import { navigate } from '../../lib/navigation.js';

const rowsOf = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};
const isFinished = (attempt) =>
  Boolean(attempt?.submittedAt) || ['SUBMITTED', 'GRADED', 'COMPLETED'].includes(attempt?.status);
const statusText = (attempt) => isFinished(attempt) ? 'Đã nộp' : attempt ? 'Đang làm' : 'Chưa làm';
const hasActiveAttempt = (exam) => exam.attempts?.some((attempt) => !isFinished(attempt));
const examTypeText = (value) => value === 'PRACTICE' ? 'Luyện tập' : value === 'EXAM' ? 'Kỳ thi' : value || 'Đề kiểm tra';

export function ExamPracticePage() {
  const [examRows, setExamRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const classRows = rowsOf(await api.students.myClasses());
        const grouped = await Promise.all(classRows.map(async (classItem) => ({
          classItem,
          exams: rowsOf(await api.exams.listForClass(classItem.classId).catch(() => [])),
          progress: rowsOf(await api.students.myProgress(classItem.classId).catch(() => [])),
        })));
        const transfers = rowsOf(await api.exams.myTransferredExams().catch(() => []));
        const classById = new Map(classRows.map((item) => [String(item.classId), item]));
        const unique = new Map();
        [...grouped.flatMap(({ classItem, exams }) => exams.map((exam) => ({ ...exam, classId: exam.classId || classItem.classId }))), ...transfers]
          .forEach((exam) => unique.set(String(exam.examId), exam));
        const withAttempts = await Promise.all([...unique.values()].map(async (exam) => ({
          ...exam,
          classLabel: classById.get(String(exam.classId))?.classCode || classById.get(String(exam.classId))?.className || exam.classLabel || 'Đề được chuyển',
          attempts: rowsOf(await api.exams.myAttempts(exam.examId).catch(() => [])),
        })));
        if (!alive) return;
        setClasses(classRows.map((item) => ({
          ...item,
          progressRows: rowsOf(grouped.find((group) => String(group.classItem.classId) === String(item.classId))?.progress),
        })));
        setExamRows(withAttempts);
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải danh sách đề luyện.');
      } finally { if (alive) setLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, [reloadKey]);

  const filtered = useMemo(() => examRows.filter((exam) => {
    const latest = exam.attempts?.[0];
    const matchesStatus = !status || (status === 'Đang làm' ? hasActiveAttempt(exam) : statusText(latest) === status);
    return (!classId || String(exam.classId) === String(classId)) && (!type || exam.examType === type) && matchesStatus;
  }), [examRows, classId, type, status]);
  const allAttempts = examRows.flatMap((exam) => rowsOf(exam.attempts));
  const completedAttempts = allAttempts.filter(isFinished);
  const scored = completedAttempts.filter((item) => Number.isFinite(Number(item.totalScore)));
  const averageScore = scored.length ? (scored.reduce((sum, item) => sum + Number(item.totalScore), 0) / scored.length).toFixed(1) : '—';

  const start = async (exam) => {
    setStartingId(exam.examId); setError('');
    try {
      const attempt = await api.exams.startAttempt(exam.examId);
      navigate(`exam_session.html?examId=${encodeURIComponent(exam.examId)}${attempt?.attemptId ? `&attemptId=${encodeURIComponent(attempt.attemptId)}` : ''}`);
    } catch (startError) { setError(startError?.message || 'Không thể bắt đầu lượt làm đề.'); }
    finally { setStartingId(''); }
  };

  const openExam = (exam) => {
    const activeAttempt = exam.attempts?.find((attempt) => !isFinished(attempt));
    if (activeAttempt?.attemptId) {
      navigate(`exam_session.html?examId=${encodeURIComponent(exam.examId)}&attemptId=${encodeURIComponent(activeAttempt.attemptId)}`);
      return;
    }
    start(exam);
  };

  return <AppShell currentPage="exam_practice_center.html" title="Trung tâm ôn luyện · PTIT Physics 1" breadcrumbs={['Ôn luyện']} current="Trung tâm ôn luyện"><PageContainer>
    <PageTitle eyebrow="LUYỆN TẬP CÁ NHÂN" title="Trung tâm ôn luyện" description="Chọn đề được cấp quyền, theo dõi lượt làm và tiếp tục ôn tập." actions={<Button variant="secondary" icon="refresh" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}>Tải lại</Button>} />
    <MetricGrid items={[
      { label: 'Đề được cấp quyền', value: examRows.length, detail: 'Theo lớp học và đề được chuyển', icon: 'quiz', tone: 'warning' },
      { label: 'Lượt đã nộp', value: completedAttempts.length, detail: 'Từ lịch sử làm bài', icon: 'task_alt', tone: 'success' },
      { label: 'Điểm trung bình', value: averageScore, detail: scored.length ? `${scored.length} lượt có điểm` : 'Chưa có lượt được chấm', icon: 'emoji_events', tone: 'primary' },
      {
        label: 'Đề đang làm',
        value: examRows.filter(hasActiveAttempt).length,
        detail: status === 'Đang làm' ? 'Đang lọc các đề có thể tiếp tục' : 'Nhấn để xem các đề có thể tiếp tục',
        icon: 'pending_actions',
        tone: 'warning',
        active: status === 'Đang làm',
        onClick: () => setStatus((current) => (current === 'Đang làm' ? '' : 'Đang làm')),
      },
    ]} />
    <Card className="p-5"><div className="grid gap-3 md:grid-cols-3"><label className="text-body-sm font-semibold">Lớp học<select value={classId} onChange={(event) => setClassId(event.target.value)} className="mt-2 block h-10 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 font-normal"><option value="">Tất cả lớp học</option>{classes.map((item) => <option key={item.classId} value={item.classId}>{item.classCode || item.className || item.subjectName}</option>)}</select></label><label className="text-body-sm font-semibold">Loại đề<select value={type} onChange={(event) => setType(event.target.value)} className="mt-2 block h-10 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 font-normal"><option value="">Tất cả loại đề</option>{[...new Set(examRows.map((item) => item.examType).filter(Boolean))].map((item) => <option key={item} value={item}>{examTypeText(item)}</option>)}</select></label><label className="text-body-sm font-semibold">Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 block h-10 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 font-normal"><option value="">Tất cả trạng thái</option><option value="Chưa làm">Chưa làm</option><option value="Đang làm">Đang làm</option><option value="Đã nộp">Đã nộp</option></select></label></div></Card>
    {loading ? <p className="py-10 text-center text-[#64748B]">Đang tải kỳ thi…</p> : error && !examRows.length ? <Card className="p-8 text-center"><p role="alert" className="text-primary">{error}</p><Button className="mt-4" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</Button></Card> : <>
      {error && <p role="alert" className="text-primary">{error}</p>}<p className="text-body-sm text-[#64748B]">Hiển thị {filtered.length} đề</p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">{filtered.map((exam) => { const latest = exam.attempts?.[0]; const active = exam.attempts?.find((item) => !isFinished(item)); return <Card key={exam.examId} variant="accent" className="flex flex-col p-6"><div className="flex items-center justify-between"><StatusBadge tone={isFinished(latest) ? 'success' : active ? 'warning' : 'neutral'}>{statusText(latest)}</StatusBadge><span className="text-body-sm text-[#64748B]">{examTypeText(exam.examType)}</span></div><h2 className="mt-5 text-headline-sm font-bold">{exam.title || 'Đề không có tiêu đề'}</h2><p className="mt-1 text-body-sm text-[#64748B]">{exam.classLabel}</p><div className="mt-5 grid grid-cols-2 gap-3 text-body-sm text-[#64748B]"><span><span className="material-symbols-outlined mr-1 text-sm">quiz</span>{exam.totalQuestions ?? '—'} câu hỏi</span><span><span className="material-symbols-outlined mr-1 text-sm">schedule</span>{exam.durationMinutes ? `${exam.durationMinutes} phút` : '—'}</span>{latest?.totalScore !== undefined && <span><span className="material-symbols-outlined mr-1 text-sm">grade</span>Điểm: {latest.totalScore ?? '—'}</span>}{latest?.attemptNumber && <span>Lần làm: {latest.attemptNumber}</span>}</div><Button className="mt-6 w-full" icon={active ? 'play_arrow' : 'assignment'} disabled={startingId === exam.examId} onClick={() => openExam(exam)}>{startingId === exam.examId ? 'Đang mở…' : active ? 'Tiếp tục làm' : 'Bắt đầu làm đề'}</Button></Card>; })}</div>
      {!filtered.length && <Card className="p-10 text-center text-[#64748B]">Không có đề phù hợp với bộ lọc hiện tại.</Card>}
    </>}
    <Card className="p-6"><div className="flex items-center justify-between"><div><h2 className="text-headline-md font-bold">Tiến độ theo học phần</h2><p className="mt-1 text-body-sm text-[#64748B]">Theo dõi tiến độ học liệu trong các học phần trước khi luyện đề.</p></div><a href="my_courses.html" className="text-body-sm font-semibold text-primary">Xem học phần</a></div><div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">{classes.slice(0, 3).map((item) => { const values = item.progressRows.map((progressItem) => Number(progressItem.progressPercent || 0)); const value = values.length ? values.reduce((sum, current) => sum + current, 0) / values.length : 0; return <Card as="div" key={item.classId} className="p-4"><strong>{item.subjectName || item.subjectCode || item.classCode}</strong><ProgressBar value={value} className="mt-3" /><span className="mt-2 block text-body-sm text-[#64748B]">{Math.round(value)}% tiến độ chủ đề</span></Card>; })}{!classes.length && <p className="text-body-sm text-[#64748B]">Chưa có học phần để thống kê tiến độ.</p>}</div></Card>
  </PageContainer></AppShell>;
}
