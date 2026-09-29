import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { api } from '../../lib/apiClient.js';
import { navigate } from '../../lib/navigation.js';

const rowsOf = (value) => Array.isArray(value) ? value : Array.isArray(value?.content) ? value.content : Array.isArray(value?.data) ? value.data : [];
const isFinished = (attempt) => Boolean(attempt?.submittedAt) || ['SUBMITTED', 'GRADED', 'COMPLETED'].includes(attempt?.status);
const statusText = (attempt) => isFinished(attempt) ? 'Đã nộp' : attempt ? 'Đang làm' : 'Chưa làm';
const hasActiveAttempt = (exam) => exam.attempts?.some((attempt) => !isFinished(attempt));
const examTypeText = (value) => value === 'PRACTICE' ? 'Luyện tập' : value === 'EXAM' ? 'Kỳ thi' : value || 'Đề kiểm tra';
const examProgress = (exam, latest, active) => {
  if (isFinished(latest)) return 100;
  const progress = exam.activeProgress || active;
  const direct = Number(progress?.progressPercent ?? progress?.completionPercent);
  if (Number.isFinite(direct)) return Math.min(100, Math.max(0, direct));
  const answered = Number(progress?.answeredQuestions);
  const total = Number(progress?.totalQuestions ?? exam.totalQuestions);
  return Number.isFinite(answered) && total > 0 ? Math.min(100, (answered / total) * 100) : 0;
};

export function ExamPracticePage() {
  const [examRows, setExamRows] = useState([]);
  const [classes, setClasses] = useState([]);
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
        const grouped = await Promise.all(classRows.map(async (classItem) => ({ classItem, exams: rowsOf(await api.exams.listForClass(classItem.classId).catch(() => [])), progress: rowsOf(await api.students.myProgress(classItem.classId).catch(() => [])) })));
        const transfers = rowsOf(await api.exams.myTransferredExams().catch(() => []));
        const classById = new Map(classRows.map((item) => [String(item.classId), item]));
        const unique = new Map();
        [...grouped.flatMap(({ classItem, exams }) => exams.map((exam) => ({ ...exam, classId: exam.classId || classItem.classId }))), ...transfers].forEach((exam) => unique.set(String(exam.examId), exam));
        const withAttempts = await Promise.all([...unique.values()].map(async (exam) => {
          const attempts = rowsOf(await api.exams.myAttempts(exam.examId).catch(() => []));
          const active = attempts.find((attempt) => !isFinished(attempt));
          return { ...exam, classLabel: classById.get(String(exam.classId))?.classCode || classById.get(String(exam.classId))?.className || exam.classLabel || 'Đề được chuyển', attempts, activeProgress: active?.attemptId ? await api.exams.attemptProgress(active.attemptId).catch(() => null) : null };
        }));
        if (!alive) return;
        setClasses(classRows.map((item) => ({ ...item, progressRows: rowsOf(grouped.find((group) => String(group.classItem.classId) === String(item.classId))?.progress) })));
        setExamRows(withAttempts);
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải danh sách đề luyện.');
      } finally { if (alive) setLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, [reloadKey]);

  const allAttempts = examRows.flatMap((exam) => rowsOf(exam.attempts));
  const completedAttempts = allAttempts.filter(isFinished);
  const scored = completedAttempts.filter((item) => Number.isFinite(Number(item.totalScore)));
  const averageScore = scored.length ? (scored.reduce((sum, item) => sum + Number(item.totalScore), 0) / scored.length).toFixed(1) : '—';
  const start = async (exam) => {
    if (!Number(exam.totalQuestions)) { setError('Đề thi chưa có câu hỏi nên chưa thể bắt đầu làm bài.'); return; }
    setStartingId(exam.examId); setError('');
    try {
      const attempt = await api.exams.startAttempt(exam.examId);
      navigate(`exam_session.html?examId=${encodeURIComponent(exam.examId)}${attempt?.attemptId ? `&attemptId=${encodeURIComponent(attempt.attemptId)}` : ''}&mode=take`);
    } catch (startError) { setError(startError?.message || 'Không thể bắt đầu lượt làm đề.'); } finally { setStartingId(''); }
  };
  const openExam = (exam) => {
    const activeAttempt = exam.attempts?.find((attempt) => !isFinished(attempt));
    if (activeAttempt?.attemptId) { navigate(`exam_session.html?examId=${encodeURIComponent(exam.examId)}&attemptId=${encodeURIComponent(activeAttempt.attemptId)}&mode=take`); return; }
    start(exam);
  };

  return <AppShell currentPage="exam_practice_center.html" title="Trung tâm ôn luyện · PTIT Physics 1" breadcrumbs={['Ôn luyện']} current="Trung tâm ôn luyện" filterActions={<Button variant="secondary" icon="refresh" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}>Tải lại</Button>}><PageContainer>
    <PageTitle eyebrow="LUYỆN TẬP CÁ NHÂN" title="Trung tâm ôn luyện" description="Chọn đề được cấp quyền, theo dõi lượt làm và tiếp tục ôn tập." />
    <MetricGrid items={[{ label: 'Đề được cấp quyền', value: examRows.length, detail: 'Theo lớp học và đề được chuyển', icon: 'quiz', tone: 'warning' }, { label: 'Lượt đã nộp', value: completedAttempts.length, detail: 'Từ lịch sử làm bài', icon: 'task_alt', tone: 'success' }, { label: 'Điểm trung bình', value: averageScore, detail: scored.length ? `${scored.length} lượt có điểm` : 'Chưa có lượt được chấm', icon: 'emoji_events', tone: 'primary' }, { label: 'Đề đang làm', value: examRows.filter(hasActiveAttempt).length, detail: 'Các đề có thể tiếp tục làm', icon: 'pending_actions', tone: 'warning' }]} />
    {loading ? <p className="py-10 text-center text-[#64748B]">Đang tải kỳ thi…</p> : error && !examRows.length ? <Card className="p-8 text-center"><p role="alert" className="text-primary">{error}</p><Button className="mt-4" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</Button></Card> : <>
      {error && <p role="alert" className="text-primary">{error}</p>}<p className="text-body-sm text-[#64748B]">Hiển thị {examRows.length} đề</p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">{examRows.map((exam, index) => { const latest = exam.attempts?.[0]; const active = exam.attempts?.find((item) => !isFinished(item)); const hasQuestions = Number(exam.totalQuestions) > 0; const progress = examProgress(exam, latest, active); return <StatCard key={exam.examId} label={exam.title || 'Đề không có tiêu đề'} value={`${Math.round(progress)}%`} detail={examTypeText(exam.examType)} icon="quiz" ribbonLabel={exam.classLabel || 'Đề kiểm tra'} ribbonPosition="bottom" accentColor={['#E52220', '#0284C7', '#7C3AED'][index % 3]} footer={<><div className="flex items-center justify-between gap-3 text-body-sm"><span className="truncate text-[#64748B]">{exam.classLabel}</span><span className="font-semibold text-[#334155]">{statusText(latest)}</span></div><div className="mt-2 grid grid-cols-2 gap-2 text-body-sm text-[#64748B]"><span>{exam.totalQuestions ?? '—'} câu hỏi</span><span>{exam.durationMinutes ? `${exam.durationMinutes} phút` : '—'}</span>{latest?.totalScore !== undefined && <span>Điểm: {latest.totalScore ?? '—'}</span>}{latest?.attemptNumber && <span>Lần làm: {latest.attemptNumber}</span>}</div>{!hasQuestions && <p className="mt-2 text-body-sm text-[#B45309]">Đề chưa có câu hỏi.</p>}<Button className="mt-3 w-full" icon={active ? 'play_arrow' : 'assignment'} disabled={startingId === exam.examId || (!active && !hasQuestions)} onClick={() => openExam(exam)}>{startingId === exam.examId ? 'Đang mở…' : active ? 'Tiếp tục làm' : hasQuestions ? 'Bắt đầu làm đề' : 'Chưa thể làm đề'}</Button></>} />; })}</div>
      {!examRows.length && <Card className="p-10 text-center text-[#64748B]">Không có đề phù hợp với bộ lọc hiện tại.</Card>}
    </>}
    <Card className="p-6"><div className="flex items-center justify-between"><div><h2 className="text-headline-md font-bold">Tiến độ theo học phần</h2><p className="mt-1 text-body-sm text-[#64748B]">Theo dõi tiến độ học liệu trong các học phần trước khi luyện đề.</p></div><a href="my_courses.html" className="text-body-sm font-semibold text-primary">Xem học phần</a></div><div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">{classes.slice(0, 3).map((item) => { const values = item.progressRows.map((progressItem) => Number(progressItem.progressPercent || 0)); const value = values.length ? values.reduce((sum, current) => sum + current, 0) / values.length : 0; return <Card as="div" key={item.classId} className="p-4"><strong>{item.subjectName || item.subjectCode || item.classCode}</strong><ProgressBar value={value} className="mt-3" /><span className="mt-2 block text-body-sm text-[#64748B]">{Math.round(value)}% tiến độ chủ đề</span></Card>; })}{!classes.length && <p className="text-body-sm text-[#64748B]">Chưa có học phần để thống kê tiến độ.</p>}</div></Card>
  </PageContainer></AppShell>;
}
