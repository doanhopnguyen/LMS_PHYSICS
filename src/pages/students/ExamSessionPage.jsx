import { LoadingIndicator } from '../../components/LoadingIndicator.jsx';
import { QuestionResponse } from '../../components/QuestionResponse.jsx';
import { answerPayload, isTextQuestion } from '../../lib/questionTypes.js';
import React, { useEffect, useRef, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { api } from '../../lib/apiClient.js';
import { labelOf } from '../../lib/lecturerUtils.js';
import { navigate } from '../../lib/navigation.js';
import { studentExamAvailability } from '../../lib/studentExamAvailability.js';
import { ExamHistoryDialog } from '../../components/ExamHistoryDialog.jsx';
import { ExamWaitingRoom } from './ExamWaitingRoom.jsx';
import { FileImage } from '../../components/FileImage.jsx';
import '../../styles/exam-session.css';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const finished = (attempt) =>
  Boolean(attempt?.submittedAt) || ['SUBMITTED', 'GRADED', 'COMPLETED'].includes(attempt?.status);
const formatDate = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');
const formatRemaining = (value) => {
  const seconds = Math.max(0, Number(value) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds].map((part) => String(part).padStart(2, '0')).join(':');
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
  const [reloadKey, setReloadKey] = useState(0);
  const [historyExam, setHistoryExam] = useState(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
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
        const withAttempts = await Promise.all(
          [...unique.values()].map(async (exam) => {
            const [attemptData, policy] = await Promise.all([
              api.exams.myAttempts(exam.examId).catch(() => null),
              api.exams.attemptPolicy(exam.examId).catch(() => null),
            ]);
            const attempts = rowsOf(attemptData);
            const active = attempts.find((attempt) => !finished(attempt));
            return {
              ...exam,
              attempts: attemptData === null ? null : attempts,
              policy,
              activeProgress: active?.attemptId
                ? await api.exams.attemptProgress(active.attemptId).catch(() => null)
                : null,
            };
          })
        );
        if (alive) setExams(withAttempts.filter((exam) => exam.examType !== 'PRACTICE'));
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải danh sách đề kiểm tra.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);
  const start = async (exam) => {
    const availability = studentExamAvailability(exam);
    if (startingId || !availability.canOpen) return;
    if (availability.activeAttempt?.attemptId) {
      navigate(
        `exam_session.html?examId=${encodeURIComponent(exam.examId)}&attemptId=${encodeURIComponent(availability.activeAttempt.attemptId)}&mode=take`
      );
      return;
    }
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
    <AppShell
      currentPage="exam_session.html"
      title="Kiểm tra · PTIT Physics LMS"
      filterActions={
        <Button
          variant="secondary"
          icon="refresh"
          disabled={loading}
          onClick={() => setReloadKey((value) => value + 1)}
        >
          Tải lại
        </Button>
      }
    >
      <PageContainer>
        <PageTitle
          eyebrow="KIỂM TRA"
          title="Chọn đề kiểm tra"
          description="Chọn đề kiểm tra để bắt đầu hoặc tiếp tục làm bài."
        />
        {loading ? (
          <LoadingIndicator className="py-10 text-center text-[#64748B]">Đang tải đề kiểm tra…</LoadingIndicator>
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
              const availability = studentExamAvailability(exam, now);
              const active = availability.activeAttempt;
              const progress = selectionProgress(exam, latest, active);
              return (
                <StatCard
                  key={exam.examId}
                  label={exam.title || 'Đề không có tiêu đề'}
                  value={`${Math.round(progress)}%`}
                  detail={exam.examType ? labelOf(exam.examType) : 'Kiểm tra'}
                  icon="quiz"
                  ribbonLabel={exam.classLabel || 'Đề kiểm tra'}
                  ribbonPosition="bottom"
                  accentColor={['#E52220', '#0284C7', '#7C3AED'][index % 3]}
                  footer={
                    <>
                      <div className="flex items-center justify-between gap-3 text-body-sm">
                        <span className="truncate text-[#64748B]">{exam.classLabel || 'Đề được chuyển'}</span>
                        <StatusBadge tone={availability.tone}>{availability.statusLabel}</StatusBadge>
                      </div>
                      <p className="mt-2 text-body-sm text-[#64748B]">
                        {exam.totalQuestions ?? '—'} câu hỏi ·{' '}
                        {exam.durationMinutes ? `${exam.durationMinutes} phút` : 'Không giới hạn thời gian'}
                      </p>
                      {exam.policy && (
                        <p className="mt-2 text-body-sm text-[#64748B]">
                          Lượt: {exam.policy.usedAttempts ?? exam.attempts?.length ?? 0}/
                          {exam.policy.maxAttempts ?? exam.maxAttempts ?? '—'}
                        </p>
                      )}
                      {availability.reason && <p className="mt-2 text-body-sm text-[#B45309]">{availability.reason}</p>}
                      <Button
                        className="mt-3 w-full"
                        icon={availability.canOpen ? 'play_arrow' : 'lock'}
                        disabled={Boolean(startingId) || !availability.canOpen}
                        onClick={() => start(exam)}
                      >
                        {startingId === exam.examId ? 'Đang mở…' : availability.actionLabel}
                      </Button>
                      {availability.canWait && (
                        <Button
                          variant="secondary"
                          icon="hourglass_top"
                          className="mt-2 w-full"
                          onClick={() =>
                            navigate(`exam_session.html?examId=${encodeURIComponent(exam.examId)}&mode=waiting`)
                          }
                        >
                          Vào sảnh chờ
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        icon="history"
                        className="mt-2 w-full"
                        onClick={() => setHistoryExam(exam)}
                      >
                        Lịch sử bài thi
                      </Button>
                    </>
                  }
                />
              );
            })}
          </div>
        )}
        {!loading && !error && !exams.length && (
          <Card className="p-10 text-center text-[#64748B]">Chưa có đề kiểm tra nào.</Card>
        )}
        {historyExam && <ExamHistoryDialog exam={historyExam} onClose={() => setHistoryExam(null)} />}
      </PageContainer>
    </AppShell>
  );
}

export function AttemptSession({ examId, attemptId, workspace = 'exam' }) {
  const practiceWorkspace = workspace === 'practice';
  const sessionPage = practiceWorkspace ? 'exam_practice_center.html' : 'exam_session.html';
  const listPage = sessionPage;
  const previousPage = useRef(window.history.state?.ptitPrevious);
  const openingAttempt = useRef(null);
  const [exam, setExam] = useState(null);
  const [policy, setPolicy] = useState(null);
  const waitingForStart = studentExamAvailability({ ...exam, policy }).canWait;
  const takeMode = !waitingForStart;
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [savingQuestions, setSavingQuestions] = useState([]);
  const answerDrafts = useRef(new Map());
  const answerSaves = useRef(new Map());
  const submissionStarted = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [layout, setLayout] = useState('single');
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const canLeaveAttempt = useRef(false);
  const autoSubmitStarted = useRef(false);
  useEffect(() => {
    const navigator = document.querySelector('.exam-taking-navigator');
    const page = navigator?.closest('.exam-taking-page');
    if (!navigator || !page) return undefined;
    const resize = () => page.style.setProperty('--exam-dock-height', `${navigator.getBoundingClientRect().height}px`);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(navigator);
    return () => {
      observer.disconnect();
      page.style.removeProperty('--exam-dock-height');
    };
  }, [loading, attempt?.attemptId, attempt?.status, error]);
  useEffect(() => {
    const strip = document.querySelector('.exam-taking-question-grid');
    const selected = strip?.querySelector('[aria-current="step"]');
    if (!strip || !selected) return;
    const stripBounds = strip.getBoundingClientRect();
    const selectedBounds = selected.getBoundingClientRect();
    if (selectedBounds.left < stripBounds.left || selectedBounds.right > stripBounds.right)
      strip.scrollTo({
        left:
          strip.scrollLeft + selectedBounds.left - stripBounds.left - (strip.clientWidth - selectedBounds.width) / 2,
      });
  }, [activeQuestion, allQuestions.length]);
  useEffect(() => {
    if (takeMode && attempt?.attemptId && !finished(attempt)) canLeaveAttempt.current = false;
  }, [attempt?.attemptId, attempt?.status, attempt?.submittedAt, takeMode]);
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [examData, attemptData, policyData] = await Promise.all([
          api.exams.get(examId),
          attemptId ? api.exams.getAttempt(attemptId) : api.exams.myAttempt(examId).catch(() => null),
          api.exams.attemptPolicy(examId).catch(() => null),
        ]);
        if (!alive) return;
        setExam(examData);
        setPolicy(policyData);
        const existingAttempt = attemptData?.attemptId ? attemptData : null;
        if (attemptId && !existingAttempt)
          throw new Error('Không tìm thấy lượt làm bài. Vui lòng mở lại từ danh sách đề.');
        if (finished(existingAttempt)) {
          canLeaveAttempt.current = true;
          navigate(
            `exam_results.html?examId=${encodeURIComponent(examId)}&attemptId=${encodeURIComponent(attemptData.attemptId)}`
          );
          return;
        }
        let currentAttempt = existingAttempt;
        const access = studentExamAvailability({
          ...examData,
          policy: policyData,
          attempts: existingAttempt ? [existingAttempt] : [],
        });
        if (!currentAttempt && access.canOpen && (practiceWorkspace || examData.examType !== 'PRACTICE')) {
          if (openingAttempt.current?.examId !== examId) {
            openingAttempt.current = {
              examId,
              promise: access.activeAttempt?.attemptId
                ? api.exams.getAttempt(access.activeAttempt.attemptId)
                : api.exams.startAttempt(examId),
            };
          }
          currentAttempt = await openingAttempt.current.promise;
          if (!currentAttempt?.attemptId) throw new Error('Chưa xác định được lượt làm bài. Vui lòng thử lại.');
        }
        if (alive) setAttempt(currentAttempt);
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
    if (!practiceWorkspace && exam?.examType === 'PRACTICE') {
      navigate(
        `exam_practice_center.html?examId=${encodeURIComponent(examId)}${attemptId ? `&attemptId=${encodeURIComponent(attemptId)}` : ''}${takeMode ? '&mode=take' : ''}`
      );
    }
  }, [attemptId, exam?.examType, examId, practiceWorkspace, takeMode]);
  useEffect(() => {
    if (!takeMode || !attempt?.attemptId || finished(attempt)) {
      setQuestions([]);
      setAllQuestions([]);
      setProgress(null);
      return;
    }
    let alive = true;
    Promise.all([api.exams.attemptQuestions(attempt.attemptId), api.exams.attemptProgress(attempt.attemptId)])
      .then(([questionRows, progressData]) => {
        if (alive) {
          const rows = rowsOf(questionRows);
          setQuestions(rows);
          setAllQuestions(rows);
          setProgress(progressData);
        }
      })
      .catch((loadError) => {
        if (alive) setError(loadError?.message || 'Không thể tải câu hỏi của lượt làm bài.');
      });
    return () => {
      alive = false;
    };
  }, [attempt, takeMode]);
  useEffect(() => {
    setQuestions(
      layout === 'single' ? (allQuestions[activeQuestion] ? [allQuestions[activeQuestion]] : []) : allQuestions
    );
  }, [activeQuestion, allQuestions, layout]);
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
  const updateAnswer = (question, patch) => {
    if (submissionStarted.current) return;
    const latest = { ...question, ...answerDrafts.current.get(question.questionId) };
    const next = { ...latest, ...(typeof patch === 'function' ? patch(latest) : patch) };
    const body = answerPayload(next);
    answerDrafts.current.set(question.questionId, body);
    setAllQuestions((rows) => rows.map((row) => row.questionId === question.questionId ? { ...row, ...body } : row));
    if (!isTextQuestion(question.questionType)) saveAnswer(next);
  };
  const saveAnswer = (question) => {
    if (!attempt?.attemptId || submissionStarted.current) return;
    const id = question.questionId;
    const body = answerDrafts.current.get(id) || answerPayload(question);
    setSavingQuestions((ids) => [...new Set([...ids, id])]);
    setError('');
    const previous = answerSaves.current.get(id) || Promise.resolve();
    const task = previous.catch(() => {}).then(async () => {
      await api.exams.saveAnswer(attempt.attemptId, body);
      const updated = await api.exams.attemptProgress(attempt.attemptId);
      setProgress(updated);
    }).catch((saveError) => {
      setError(saveError?.message || 'Không thể lưu câu trả lời. Bài làm vẫn được giữ trên trang để gửi lại khi nộp.');
    }).finally(() => {
      if (answerSaves.current.get(id) === task) {
        answerSaves.current.delete(id);
        setSavingQuestions((ids) => ids.filter((value) => value !== id));
      }
    });
    answerSaves.current.set(id, task);
    return task;
  };
  const submitAttempt = async ({ automatic = false } = {}) => {
    if (submissionStarted.current || !attempt?.attemptId || (!automatic && !window.confirm('Nộp bài và kết thúc lượt làm này?'))) return;
    submissionStarted.current = true;
    setSubmitting(true);
    setError('');
    try {
      await Promise.all([...answerSaves.current.values()]);
      await api.exams.autosave(attempt.attemptId, {
        answers: allQuestions.map((item) => answerDrafts.current.get(item.questionId) || answerPayload(item)),
      });
      const result = await api.exams.submit(attempt.attemptId);
      const actual = await api.exams.getAttempt(attempt.attemptId).catch(() => null);
      const completed = actual || result;
      setAttempt(completed || { ...attempt, status: 'SUBMITTED', submittedAt: new Date().toISOString() });
      if (completed?.attemptId) {
        canLeaveAttempt.current = true;
        navigate(
          `exam_results.html?examId=${encodeURIComponent(examId)}&attemptId=${encodeURIComponent(attempt.attemptId)}`
        );
      }
    } catch (submitError) {
      setError(submitError?.message || 'Không thể nộp bài.');
    } finally {
      submissionStarted.current = false;
      setSubmitting(false);
    }
  };
  useEffect(() => {
    if (
      !takeMode ||
      remainingSeconds === null ||
      remainingSeconds > 0 ||
      !attempt?.attemptId ||
      finished(attempt) ||
      autoSubmitStarted.current
    )
      return;
    autoSubmitStarted.current = true;
    submitAttempt({ automatic: true });
  }, [attempt?.attemptId, attempt?.status, attempt?.submittedAt, remainingSeconds, takeMode]);
  const returnToPrevious = () => {
    if (attempt && !finished(attempt) && !window.confirm('Về trang trước? Các câu trả lời đã lưu vẫn được giữ lại.'))
      return;
    canLeaveAttempt.current = true;
    let destination = listPage;
    if (
      typeof previousPage.current === 'string' &&
      previousPage.current.startsWith('/') &&
      !previousPage.current.startsWith('//')
    ) {
      const previous = new URL(previousPage.current, window.location.origin);
      if (previous.origin === window.location.origin && previous.searchParams.get('examId') !== examId)
        destination = `${previous.pathname}${previous.search}${previous.hash}`;
    }
    navigate(destination);
  };
  const title = exam?.title || 'Phiên kiểm tra';
  const isCompleted = finished(attempt);
  const availability = studentExamAvailability({ ...exam, policy, attempts: attempt ? [attempt] : [] });
  if (!loading && exam && waitingForStart) return <ExamWaitingRoom examId={examId} workspace={workspace} />;
  return (
    <AppShell
      currentPage={sessionPage}
      title={`${title} · PTIT Physics LMS`}
      footer={false}
      showChrome={!takeMode}
      showAcademicFilters={false}
      showChatLauncher={!takeMode}
      contentClass={takeMode ? 'exam-taking-page' : ''}
      toolbar={
        <DetailToolbar
          title={title}
          subtitle={
            attempt
              ? `Lượt làm ${attempt.attemptNumber || '—'} · ${isCompleted ? 'Đã nộp' : 'Đang làm'}`
              : 'Sẵn sàng bắt đầu'
          }
          backHref={listPage}
          backLabel="Về trang trước"
          onBack={returnToPrevious}
          showBack
          actions={
            takeMode && attempt && !isCompleted ? (
              <div className="exam-taking-actions">
                <div
                  className={`exam-taking-timer ${remainingSeconds !== null && remainingSeconds <= 300 ? 'is-urgent' : ''}`}
                  role="timer"
                  aria-label="Thời gian còn lại"
                >
                  <span className="block text-xs text-white/80">Thời gian còn lại</span>
                  <strong className="text-sm text-white">
                    {remainingSeconds === null ? 'Đang đồng bộ…' : formatRemaining(remainingSeconds)}
                  </strong>
                </div>
                <Button icon="send" disabled={submitting} onClick={submitAttempt}>
                  {submitting ? 'Đang nộp…' : 'Nộp bài'}
                </Button>
              </div>
            ) : null
          }
        />
      }
    >
      <PageContainer>
        {loading ? (
          <LoadingIndicator className="py-10 text-center text-[#64748B]">Đang tải phiên kiểm tra…</LoadingIndicator>
        ) : error ? (
          <Card className="p-8 text-center">
            <p role="alert" className="text-primary">
              {error}
            </p>
            <a href={listPage} className="mt-4 inline-block">
              <Button>Quay lại danh sách đề</Button>
            </a>
          </Card>
        ) : (
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="exam-taking-layout">
              <Card className="exam-taking-workspace">
                {!attempt && (
                  <p role="status" className="text-body-sm text-[#64748B]">
                    {availability.reason || 'Đang mở bài thi…'}
                  </p>
                )}
                {attempt && !isCompleted && questions.length > 0 && (
                  <div className="space-y-5">
                    {questions.map((question, index) => (
                      <Card
                        as="section"
                        id={`exam-question-${question.questionId}`}
                        key={question.questionId}
                        className="exam-taking-question"
                      >
                        <div className="exam-taking-question-heading">
                          <h3>
                            <span className="exam-taking-question-number">
                              Câu {question.orderIndex || (layout === 'single' ? activeQuestion + 1 : index + 1)}
                            </span>
                            <span>{question.content}</span>
                          </h3>
                          <Button
                            variant="secondary"
                            icon={flaggedQuestions.includes(question.questionId) ? 'outlined_flag' : 'flag'}
                            aria-pressed={flaggedQuestions.includes(question.questionId)}
                            onClick={() =>
                              setFlaggedQuestions((rows) =>
                                rows.includes(question.questionId)
                                  ? rows.filter((id) => id !== question.questionId)
                                  : [...rows, question.questionId]
                              )
                            }
                          >
                            {flaggedQuestions.includes(question.questionId) ? 'Bỏ cờ' : 'Cờ'}
                          </Button>
                        </div>
                        {question.mediaUrl && (
                          <FileImage
                            src={question.mediaUrl}
                            alt="Nội dung minh họa"
                            className="mt-3 max-h-64 rounded-lg"
                          />
                        )}
                        <QuestionResponse question={question} disabled={submitting} saving={savingQuestions.includes(question.questionId)}
                          onChange={(patch) => updateAnswer(question, patch)} onSave={() => saveAnswer(question)} />
                      </Card>
                    ))}
                  </div>
                )}
                {attempt && !isCompleted && layout === 'single' && allQuestions[activeQuestion] && (
                  <nav aria-label="Chuyển câu hỏi" className="exam-taking-pagination">
                    <Button
                      variant="secondary"
                      disabled={activeQuestion === 0}
                      onClick={() => setActiveQuestion((value) => value - 1)}
                      icon="chevron_left"
                    >
                      Câu trước
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={activeQuestion >= allQuestions.length - 1}
                      onClick={() => setActiveQuestion((value) => value + 1)}
                      icon="chevron_right"
                    >
                      Câu sau
                    </Button>
                  </nav>
                )}
                {false && attempt && !isCompleted && (
                  <Card as="div" className="mt-6 border-[#FDE68A] bg-[#FFFBEB] p-5">
                    <span className="material-symbols-outlined text-[#B45309]" aria-hidden="true">
                      info
                    </span>
                    <h3 className="mt-2 font-bold text-[#92400E]">Chưa thể tải câu hỏi của bài thi</h3>
                    <p className="mt-2 text-body-sm text-[#92400E]">
                      Chưa thể tải nội dung bài thi. Vui lòng thử lại sau hoặc liên hệ giảng viên.
                    </p>
                  </Card>
                )}
                {isCompleted && (
                  <Card as="div" className="mt-6 border-[#A7F3D0] bg-[#ECFDF5] p-5">
                    <h3 className="font-bold text-[#065F46]">Bạn đã hoàn thành lượt làm bài</h3>
                  </Card>
                )}
              </Card>
              <aside className="exam-taking-sidebar">
                <Card className="exam-taking-info">
                  <h2 className="text-headline-sm font-bold">Thông tin đề</h2>
                  <dl className="mt-5 space-y-4 text-body-sm">
                    <div className="border-b border-[#E2E8F0] pb-3">
                      <dt className="text-[#64748B]">Loại đề</dt>
                      <dd className="mt-1 font-semibold">{labelOf(exam?.examType)}</dd>
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
              </aside>
            </div>
            {attempt && !isCompleted && (
              <Card as="nav" aria-label="Chọn câu hỏi" className="exam-taking-navigator">
                <h2 className="text-headline-sm font-bold">Chọn câu</h2>
                <div className="exam-taking-view-toggle">
                  <Button
                    variant={layout === 'single' ? 'primary' : 'secondary'}
                    aria-pressed={layout === 'single'}
                    onClick={() => setLayout('single')}
                  >
                    Từng câu
                  </Button>
                  <Button
                    variant={layout === 'all' ? 'primary' : 'secondary'}
                    aria-pressed={layout === 'all'}
                    onClick={() => setLayout('all')}
                  >
                    Theo thứ tự
                  </Button>
                </div>
                <div className="exam-taking-question-grid">
                  {allQuestions.map((question, index) => {
                    const answered = Boolean((question.selectedOptionIds || []).length || question.answerText);
                    const flagged = flaggedQuestions.includes(question.questionId);
                    return (
                      <button
                        type="button"
                        key={question.questionId}
                        aria-label={`Câu ${index + 1}${answered ? ', đã trả lời' : ', chưa trả lời'}${flagged ? ', đã đánh dấu' : ''}`}
                        aria-current={index === activeQuestion ? 'step' : undefined}
                        onClick={() => {
                          setActiveQuestion(index);
                          if (layout === 'all') {
                            document
                              .getElementById(`exam-question-${question.questionId}`)
                              ?.scrollIntoView({
                                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                                  ? 'instant'
                                  : 'smooth',
                                block: 'start',
                              });
                          }
                        }}
                        className={`rounded-lg border p-2 text-sm font-bold ${flagged ? 'border-amber-300 bg-amber-100 text-amber-800' : index === activeQuestion ? 'border-primary bg-[#FEE2E2] text-primary' : answered ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-[#CBD5E1]'}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-body-sm text-[#64748B]">
                  Đã trả lời{' '}
                  {progress?.answeredQuestions ??
                    allQuestions.filter((item) => (item.selectedOptionIds || []).length || item.answerText).length}
                  /{progress?.totalQuestions ?? allQuestions.length} câu.
                </p>
              </Card>
            )}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}

export function ExamSessionPage() {
  const params = new URLSearchParams(window.location.search);
  const examId = params.get('examId');
  if (examId && params.get('mode') === 'waiting') return <ExamWaitingRoom key={examId} examId={examId} />;
  return examId ? <AttemptSession examId={examId} attemptId={params.get('attemptId')} /> : <ExamSelection />;
}
