import React, { useEffect, useRef, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { api } from '../../lib/apiClient.js';
import { navigate } from '../../lib/navigation.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const finished = (attempt) =>
  Boolean(attempt?.submittedAt) || ['SUBMITTED', 'GRADED', 'COMPLETED'].includes(attempt?.status);
const formatDate = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');
const formatRemaining = (value) => {
  const seconds = Math.max(0, Number(value) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
};
const selectionProgress = (exam, latest, active) => {
  if (finished(latest)) return 100;
  const progress = exam.activeProgress || active;
  const direct = Number(progress?.progressPercent ?? progress?.completionPercent);
  if (Number.isFinite(direct)) return Math.min(100, Math.max(0, direct));
  const answered = Number(progress?.answeredQuestions);
  const total = Number(progress?.totalQuestions ?? exam.totalQuestions);
  return Number.isFinite(answered) && total > 0 ? Math.min(100, (answered / total) * 100) : 0;
};

function ExamSelection() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const classes = rowsOf(await api.students.myClasses());
        const grouped = await Promise.all(
          classes.map(async (item) => ({
            item,
            exams: rowsOf(await api.exams.listForClass(item.classId).catch(() => [])),
          }))
        );
        const transferred = rowsOf(await api.exams.myTransferredExams().catch(() => []));
        const unique = new Map();
        [
          ...grouped.flatMap(({ item, exams: examRows }) =>
            examRows.map((exam) => ({ ...exam, classLabel: item.classCode || item.className || item.subjectName }))
          ),
          ...transferred,
        ].forEach((exam) => unique.set(String(exam.examId), exam));
        const withAttempts = await Promise.all([...unique.values()].map(async (exam) => {
          const attempts = rowsOf(await api.exams.myAttempts(exam.examId).catch(() => []));
          const active = attempts.find((attempt) => !finished(attempt));
          return { ...exam, attempts, activeProgress: active?.attemptId ? await api.exams.attemptProgress(active.attemptId).catch(() => null) : null };
        }));
        if (alive) setExams(withAttempts);
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải danh sách đề kiểm tra.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  const start = async (exam) => {
    setStartingId(exam.examId);
    setError('');
    try {
      const attempt = await api.exams.startAttempt(exam.examId);
      navigate(
        `exam_session.html?examId=${encodeURIComponent(exam.examId)}${attempt?.attemptId ? `&attemptId=${encodeURIComponent(attempt.attemptId)}` : ''}&mode=take`
      );
    } catch (startError) {
      setError(startError?.message || 'Không thể bắt đầu lượt làm bài.');
    } finally {
      setStartingId('');
    }
  };
  return (
    <AppShell currentPage="exam_session.html" title="Kiểm tra · PTIT Physics LMS">
      <PageContainer>
        <PageTitle
          eyebrow="KIỂM TRA"
          title="Chọn đề kiểm tra"
          description="Chọn đề được cấp quyền để bắt đầu hoặc tiếp tục lượt làm."
        />
        {loading ? (
          <p className="py-10 text-center text-[#64748B]">Đang tải đề kiểm tra…</p>
        ) : error ? (
          <Card className="p-8 text-center">
            <p role="alert" className="text-primary">
              {error}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {exams.map((exam, index) => {
              const latest = exam.attempts?.[0];
              const active = exam.attempts?.find((attempt) => !finished(attempt));
              const progress = selectionProgress(exam, latest, active);
              return <StatCard key={exam.examId} label={exam.title || 'Đề không có tiêu đề'} value={`${Math.round(progress)}%`} detail={exam.examType === 'PRACTICE' ? 'Luyện tập' : 'Kiểm tra'} icon="quiz" ribbonLabel={exam.classLabel || 'Đề kiểm tra'} ribbonPosition="bottom" accentColor={['#E52220', '#0284C7', '#7C3AED'][index % 3]} footer={<><div className="flex items-center justify-between gap-3 text-body-sm"><span className="truncate text-[#64748B]">{exam.classLabel || 'Đề được chuyển'}</span><span className="font-semibold text-[#334155]">{finished(latest) ? 'Đã nộp' : active ? 'Đang làm' : 'Chưa làm'}</span></div><p className="mt-2 text-body-sm text-[#64748B]">{exam.totalQuestions ?? '—'} câu hỏi · {exam.durationMinutes ? `${exam.durationMinutes} phút` : 'Không giới hạn thời gian'}</p><Button className="mt-3 w-full" icon="play_arrow" disabled={startingId === exam.examId} onClick={() => active?.attemptId ? navigate(`exam_session.html?examId=${encodeURIComponent(exam.examId)}&attemptId=${encodeURIComponent(active.attemptId)}&mode=take`) : start(exam)}>{startingId === exam.examId ? 'Đang mở…' : active ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài'}</Button></>} />;
            })}
          </div>
        )}
        {!loading && !error && !exams.length && (
          <Card className="p-10 text-center text-[#64748B]">Chưa có đề kiểm tra được cấp quyền.</Card>
        )}
      </PageContainer>
    </AppShell>
  );
}

function AttemptSession({ examId, attemptId, takeMode }) {
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [savingQuestion, setSavingQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [layout, setLayout] = useState('single');
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const canLeaveAttempt = useRef(false);
  const autoSubmitStarted = useRef(false);
  useEffect(() => {
    if (takeMode && attempt?.attemptId && !finished(attempt)) canLeaveAttempt.current = false;
  }, [attempt?.attemptId, attempt?.status, attempt?.submittedAt, takeMode]);
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [examData, attemptData] = await Promise.all([
          api.exams.get(examId),
          attemptId ? api.exams.getAttempt(attemptId) : api.exams.myAttempt(examId).catch(() => null),
        ]);
        if (!alive) return;
        setExam(examData);
        setAttempt(attemptData);
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải phiên kiểm tra.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [examId, attemptId]);
  useEffect(() => {
    if (!takeMode || !attempt?.attemptId || finished(attempt)) { setQuestions([]); setAllQuestions([]); setProgress(null); return; }
    let alive = true;
    Promise.all([api.exams.attemptQuestions(attempt.attemptId), api.exams.attemptProgress(attempt.attemptId)]).then(([questionRows, progressData]) => {
      if (alive) { const rows = rowsOf(questionRows); setQuestions(rows); setAllQuestions(rows); setProgress(progressData); }
    }).catch((loadError) => { if (alive) setError(loadError?.message || 'Không thể tải câu hỏi của lượt làm bài.'); });
    return () => { alive = false; };
  }, [attempt, takeMode]);
  useEffect(() => { setQuestions(layout === 'single' ? (allQuestions[activeQuestion] ? [allQuestions[activeQuestion]] : []) : allQuestions); }, [activeQuestion, allQuestions, layout]);
  useEffect(() => {
    const apiRemaining = progress?.remainingSeconds;
    if (Number.isFinite(Number(apiRemaining))) {
      setRemainingSeconds(Number(apiRemaining));
      return;
    }
    if (exam?.durationMinutes && attempt?.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      setRemainingSeconds(Math.max(0, Number(exam.durationMinutes) * 60 - elapsed));
      return;
    }
    setRemainingSeconds(null);
  }, [attempt?.startedAt, exam?.durationMinutes, progress?.remainingSeconds]);
  useEffect(() => {
    if (!takeMode || remainingSeconds === null || remainingSeconds <= 0) return undefined;
    const timer = window.setInterval(() => setRemainingSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [takeMode, remainingSeconds === null, remainingSeconds <= 0]);
  useEffect(() => {
    if (!takeMode || !attempt?.attemptId || finished(attempt)) return undefined;
    const message = 'Bạn phải nộp bài và xác nhận kết thúc lượt làm trước khi rời khỏi trang này.';
    const blockUnload = (event) => {
      if (canLeaveAttempt.current) return undefined;
      event.preventDefault();
      event.returnValue = message;
      return message;
    };
    const blockLink = (event) => {
      if (canLeaveAttempt.current) return;
      const link = event.target.closest?.('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.href !== window.location.href) {
        event.preventDefault();
        window.alert(message);
      }
    };
    const blockHistoryBack = () => {
      if (canLeaveAttempt.current) return;
      window.history.pushState({ ...window.history.state, examSubmissionRequired: true }, '', window.location.href);
      window.alert(message);
    };
    window.history.pushState({ ...window.history.state, examSubmissionRequired: true }, '', window.location.href);
    window.addEventListener('beforeunload', blockUnload);
    window.addEventListener('popstate', blockHistoryBack);
    document.addEventListener('click', blockLink, true);
    return () => {
      window.removeEventListener('beforeunload', blockUnload);
      window.removeEventListener('popstate', blockHistoryBack);
      document.removeEventListener('click', blockLink, true);
    };
  }, [attempt?.attemptId, takeMode, attempt?.status, attempt?.submittedAt]);
  const saveAnswer = async (question, patch) => {
    if (!attempt?.attemptId) return;
    setSavingQuestion(question.questionId);
    setError('');
    const body = { questionId: question.questionId, selectedOptionIds: patch.selectedOptionIds || [], answerText: patch.answerText || null };
    try {
      await api.exams.saveAnswer(attempt.attemptId, body);
      setQuestions((rows) => rows.map((row) => row.questionId === question.questionId ? { ...row, ...body } : row));
      setAllQuestions((rows) => rows.map((row) => row.questionId === question.questionId ? { ...row, ...body } : row));
      setProgress(await api.exams.attemptProgress(attempt.attemptId));
    } catch (saveError) { setError(saveError?.message || 'Không thể lưu câu trả lời.'); }
    finally { setSavingQuestion(''); }
  };
  const submitAttempt = async ({ automatic = false } = {}) => {
    if (!attempt?.attemptId || (!automatic && !window.confirm('Nộp bài và kết thúc lượt làm này?'))) return;
    setSubmitting(true); setError('');
    try { await api.exams.autosave(attempt.attemptId, { answers: allQuestions.map((item) => ({ questionId: item.questionId, selectedOptionIds: item.selectedOptionIds || [], answerText: item.answerText || null })) }); const result = await api.exams.submit(attempt.attemptId); const actual = await api.exams.getAttempt(attempt.attemptId).catch(() => null); const completed = actual || result; setAttempt(completed || { ...attempt, status: 'SUBMITTED', submittedAt: new Date().toISOString() }); if (completed?.attemptId) { canLeaveAttempt.current = true; navigate(`exam_results.html?examId=${encodeURIComponent(examId)}&attemptId=${encodeURIComponent(attempt.attemptId)}`); } }
    catch (submitError) { setError(submitError?.message || 'Không thể nộp bài.'); }
    finally { setSubmitting(false); }
  };
  useEffect(() => {
    if (!takeMode || remainingSeconds === null || remainingSeconds > 0 || !attempt?.attemptId || finished(attempt) || autoSubmitStarted.current) return;
    autoSubmitStarted.current = true;
    submitAttempt({ automatic: true });
  }, [attempt?.attemptId, attempt?.status, attempt?.submittedAt, remainingSeconds, takeMode]);
  const returnToOverview = () => {
    if (!window.confirm('Quay về trang tổng quan đề? Các câu trả lời đã lưu vẫn được giữ lại.')) return;
    canLeaveAttempt.current = true;
    navigate(`exam_session.html?examId=${encodeURIComponent(examId)}${attempt?.attemptId ? `&attemptId=${encodeURIComponent(attempt.attemptId)}` : ''}`);
  };
  const start = async () => {
    setStarting(true);
    setError('');
    try {
      const created = await api.exams.startAttempt(examId);
      setAttempt(created);
      navigate(`exam_session.html?examId=${encodeURIComponent(examId)}${created?.attemptId ? `&attemptId=${encodeURIComponent(created.attemptId)}` : ''}&mode=take`);
    } catch (startError) {
      setError(startError?.message || 'Không thể bắt đầu lượt làm bài.');
    } finally {
      setStarting(false);
    }
  };
  const title = exam?.title || 'Phiên kiểm tra';
  const isCompleted = finished(attempt);
  const statusLabel = isCompleted ? 'Đã nộp bài' : attempt ? 'Phiên đang mở' : 'Chưa bắt đầu';
  const metrics = [
    {
      label: 'Số câu hỏi',
      value: exam?.totalQuestions ?? '—',
      detail: 'Theo cấu hình đề',
      icon: 'format_list_numbered',
      tone: 'primary',
    },
    {
      label: 'Thời lượng',
      value: exam?.durationMinutes ?? '—',
      detail: exam?.durationMinutes ? 'phút làm bài' : 'Không giới hạn',
      icon: 'schedule',
      tone: 'warning',
    },
    {
      label: 'Trạng thái',
      value: isCompleted ? 'Đã nộp' : attempt ? 'Đang làm' : 'Sẵn sàng',
      detail: attempt?.attemptNumber ? `Lượt làm ${attempt.attemptNumber}` : 'Chưa tạo lượt làm',
      icon: 'assignment_turned_in',
      tone: isCompleted ? 'success' : 'primary',
    },
    {
      label: 'Điểm số',
      value: attempt?.totalScore ?? '—',
      detail: isCompleted ? 'Kết quả lượt làm bài' : 'Có sau khi nộp bài',
      icon: 'emoji_events',
      tone: 'success',
    },
  ];
  return (
    <AppShell
      currentPage="exam_session.html"
      title={`${title} · PTIT Physics LMS`}
      footer={false}
      showChrome={!takeMode}
      toolbar={
        <DetailToolbar
          title={title}
          subtitle={
            attempt
              ? `Lượt làm ${attempt.attemptNumber || '—'} · ${isCompleted ? 'Đã nộp' : 'Đang làm'}`
              : 'Sẵn sàng bắt đầu'
          }
          backHref={takeMode ? `exam_session.html?examId=${encodeURIComponent(examId)}${attemptId ? `&attemptId=${encodeURIComponent(attemptId)}` : ''}` : 'exam_practice_center.html'}
          backLabel={takeMode ? 'Về tổng quan đề' : 'Về ôn luyện'}
          onBack={takeMode ? returnToOverview : undefined}
          showBack
          actions={takeMode && attempt && !isCompleted ? <div className="flex items-center gap-3"><div className="text-right"><span className="block text-xs text-white/80">Thời gian còn lại</span><strong className="text-sm text-white">{remainingSeconds === null ? 'Đang đồng bộ…' : formatRemaining(remainingSeconds)}</strong></div><Button icon="send" disabled={submitting} onClick={submitAttempt}>{submitting ? 'Đang nộp…' : 'Nộp bài'}</Button></div> : null}
        />
      }
    >
      <PageContainer>
        {loading ? (
          <p className="py-10 text-center text-[#64748B]">Đang tải phiên kiểm tra…</p>
        ) : error ? (
          <Card className="p-8 text-center">
            <p role="alert" className="text-primary">
              {error}
            </p>
            <a href="exam_practice_center.html" className="mt-4 inline-block">
              <Button>Quay lại ôn luyện</Button>
            </a>
          </Card>
        ) : (
          <div className="mx-auto max-w-6xl space-y-6">
            {!takeMode && <Card className="overflow-hidden p-0">
              <div className="bg-gradient-to-r from-primary to-[#4338CA] p-6 text-white md:p-8">
                <StatusBadge tone={isCompleted ? 'success' : 'neutral'}>{statusLabel}</StatusBadge>
                <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-body-sm text-white/80">Phiên kiểm tra của bạn</p>
                    <h1 className="mt-1 text-headline-md font-bold">{title}</h1>
                    {attempt?.startedAt && <p className="mt-2 text-body-sm text-white/80">Bắt đầu lúc {formatDate(attempt.startedAt)}</p>}
                  </div>
                  {!attempt && (
                    <Button icon="play_arrow" disabled={starting} onClick={start}>
                      {starting ? 'Đang bắt đầu…' : 'Bắt đầu làm bài'}
                    </Button>
                  )}
                  {attempt && !isCompleted && (
                    <a href={`exam_session.html?examId=${encodeURIComponent(examId)}&attemptId=${encodeURIComponent(attempt.attemptId)}&mode=take`}>
                      <Button icon="play_arrow">Vào làm bài</Button>
                    </a>
                  )}
                  {isCompleted && (
                    <a href={`exam_results.html?examId=${encodeURIComponent(examId)}&attemptId=${encodeURIComponent(attempt.attemptId)}`}>
                      <Button icon="visibility">Xem kết quả</Button>
                    </a>
                  )}
                </div>
              </div>
              <div className="p-5 md:p-6">
                <MetricGrid items={metrics} />
              </div>
            </Card>}

            {takeMode ? <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <Card className="p-6 md:p-8">
                {!attempt && (
                  <Card as="div" className="mt-6 border-[#BFDBFE] bg-[#EFF6FF] p-5">
                    <h3 className="font-bold text-[#1E3A8A]">Sẵn sàng bắt đầu</h3>
                    <p className="mt-2 text-body-sm text-[#1D4ED8]">Nhấn “Bắt đầu làm bài” để tạo một lượt làm mới cho đề này.</p>
                  </Card>
                )}
                {attempt && !isCompleted && questions.length > 0 && <div className="space-y-5">{questions.map((question, index) => <Card as="section" key={question.questionId} className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-bold">Câu {question.orderIndex || index + 1}. {question.content}</h3><Button variant="secondary" icon={flaggedQuestions.includes(question.questionId) ? 'outlined_flag' : 'flag'} onClick={() => setFlaggedQuestions((rows) => rows.includes(question.questionId) ? rows.filter((id) => id !== question.questionId) : [...rows, question.questionId])}>{flaggedQuestions.includes(question.questionId) ? 'Bỏ cờ' : 'Cờ'}</Button></div>{question.mediaUrl && <img src={question.mediaUrl} alt="Nội dung minh họa" className="mt-3 max-h-64 rounded-lg" />}{['SHORT_ANSWER'].includes(question.questionType) ? <textarea defaultValue={question.answerText || ''} onBlur={(event) => saveAnswer(question, { answerText: event.target.value })} className="mt-4 w-full rounded-xl border p-3" rows={3} placeholder="Nhập câu trả lời" disabled={savingQuestion === question.questionId} /> : <div className="mt-4 space-y-2">{(question.options || []).map((option) => { const checked = (question.selectedOptionIds || []).includes(option.optionId); return <label key={option.optionId} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3"><input type={question.questionType === 'MCQ_MULTI' ? 'checkbox' : 'radio'} name={`question-${question.questionId}`} checked={checked} disabled={savingQuestion === question.questionId} onChange={() => { const ids = question.questionType === 'MCQ_MULTI' ? (checked ? (question.selectedOptionIds || []).filter((id) => id !== option.optionId) : [...(question.selectedOptionIds || []), option.optionId]) : [option.optionId]; saveAnswer(question, { selectedOptionIds: ids }); }} />{option.content}</label>; })}</div>}</Card>)}</div>}
                {false && attempt && !isCompleted && (
                  <Card as="div" className="mt-6 border-[#FDE68A] bg-[#FFFBEB] p-5">
                    <span className="material-symbols-outlined text-[#B45309]" aria-hidden="true">info</span>
                    <h3 className="mt-2 font-bold text-[#92400E]">Chưa thể tải câu hỏi của bài thi</h3>
                    <p className="mt-2 text-body-sm text-[#92400E]">Backend hiện chưa có API Student trả câu hỏi và lựa chọn theo lượt làm. Vì vậy hệ thống chưa thể hiển thị hoặc gửi câu trả lời một cách an toàn.</p>
                  </Card>
                )}
                {isCompleted && (
                  <Card as="div" className="mt-6 border-[#A7F3D0] bg-[#ECFDF5] p-5">
                    <h3 className="font-bold text-[#065F46]">Bạn đã hoàn thành lượt làm bài</h3>
                    <p className="mt-2 text-body-sm text-[#047857]">Điểm số và chi tiết kết quả đã sẵn sàng để xem.</p>
                  </Card>
                )}
              </Card>
              <div className="space-y-6">
                {attempt && !isCompleted && <Card className="p-5"><h2 className="text-headline-sm font-bold">Chọn câu</h2><div className="mt-3 flex gap-2"><Button variant={layout === 'single' ? 'primary' : 'secondary'} onClick={() => setLayout('single')}>Từng câu</Button><Button variant={layout === 'all' ? 'primary' : 'secondary'} onClick={() => setLayout('all')}>Theo thứ tự</Button></div><div className="mt-4 grid grid-cols-5 gap-2">{allQuestions.map((question, index) => { const answered = Boolean((question.selectedOptionIds || []).length || question.answerText); const flagged = flaggedQuestions.includes(question.questionId); return <button type="button" key={question.questionId} onClick={() => { setActiveQuestion(index); setLayout('single'); }} className={`rounded-lg border p-2 text-sm font-bold ${flagged ? 'border-amber-300 bg-amber-100 text-amber-800' : index === activeQuestion && layout === 'single' ? 'border-primary bg-[#FEE2E2] text-primary' : answered ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-[#CBD5E1]'}`}>{index + 1}</button>; })}</div>{layout === 'single' && allQuestions[activeQuestion] && <div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" disabled={activeQuestion === 0} onClick={() => setActiveQuestion((value) => value - 1)}>Câu trước</Button><Button variant="secondary" disabled={activeQuestion >= allQuestions.length - 1} onClick={() => setActiveQuestion((value) => value + 1)}>Câu sau</Button></div>}<p className="mt-3 text-body-sm text-[#64748B]">Đã trả lời {progress?.answeredQuestions ?? allQuestions.filter((item) => (item.selectedOptionIds || []).length || item.answerText).length}/{progress?.totalQuestions ?? allQuestions.length} câu.</p></Card>}
                <Card className="p-6">
                  <h2 className="text-headline-sm font-bold">Thông tin đề</h2>
                  <dl className="mt-5 space-y-4 text-body-sm">
                    <div className="border-b border-[#E2E8F0] pb-3">
                      <dt className="text-[#64748B]">Loại đề</dt>
                      <dd className="mt-1 font-semibold">{exam?.examType === 'PRACTICE' ? 'Luyện tập' : exam?.examType || '—'}</dd>
                    </div>
                    <div className="border-b border-[#E2E8F0] pb-3">
                      <dt className="text-[#64748B]">Thời gian mở đề</dt>
                      <dd className="mt-1 font-semibold">{formatDate(exam?.startTime)}</dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B]">Hạn kết thúc</dt>
                      <dd className="mt-1 font-semibold">{formatDate(exam?.endTime)}</dd>
                    </div>
                  </dl>
                </Card>
                <Card className="border-[#DDD6FE] bg-[#F5F3FF] p-5">
                  <span className="material-symbols-outlined text-[#6D28D9]" aria-hidden="true">tips_and_updates</span>
                  <p className="mt-2 text-body-sm text-[#5B21B6]">Kiểm tra kỹ thời lượng và hạn kết thúc trước khi bắt đầu làm bài.</p>
                </Card>
              </div>
            </div> : <Card className="mx-auto max-w-3xl p-6 md:p-8">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined rounded-xl bg-[#EEF2FF] p-2 text-primary" aria-hidden="true">assignment</span>
                <div>
                  <h2 className="text-headline-sm font-bold">Sẵn sàng làm bài</h2>
                  <p className="mt-1 text-body-sm text-[#64748B]">Trang này là phần tổng quan. Khi đã sẵn sàng, hãy mở không gian làm bài riêng để bắt đầu trả lời câu hỏi.</p>
                </div>
              </div>
              {!attempt && <Button className="mt-6" icon="play_arrow" disabled={starting} onClick={start}>{starting ? 'Đang bắt đầu…' : 'Bắt đầu làm bài'}</Button>}
              {attempt && !isCompleted && <a className="mt-6 inline-block" href={`exam_session.html?examId=${encodeURIComponent(examId)}&attemptId=${encodeURIComponent(attempt.attemptId)}&mode=take`}><Button icon="play_arrow">Vào làm bài</Button></a>}
              {isCompleted && <a className="mt-6 inline-block" href={`exam_results.html?examId=${encodeURIComponent(examId)}&attemptId=${encodeURIComponent(attempt.attemptId)}`}><Button icon="visibility">Xem kết quả</Button></a>}
            </Card>}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}

export function ExamSessionPage() {
  const params = new URLSearchParams(window.location.search);
  const examId = params.get('examId');
  return examId ? <AttemptSession examId={examId} attemptId={params.get('attemptId')} takeMode={params.get('mode') === 'take'} /> : <ExamSelection />;
}
