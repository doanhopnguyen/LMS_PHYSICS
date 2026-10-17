import { LoadingIndicator } from '../../components/LoadingIndicator.jsx';
import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { ExamHistoryDialog } from '../../components/ExamHistoryDialog.jsx';
import { ExamWaitingRoom } from './ExamWaitingRoom.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { api } from '../../lib/apiClient.js';
import { attemptScore, formatAttemptScore } from '../../lib/examScoring.js';
import { navigate } from '../../lib/navigation.js';
import { AttemptSession } from './ExamSessionPage.jsx';
import { studentExamAvailability } from '../../lib/studentExamAvailability.js';
import { Tabs } from '../../components/Tabs.jsx';
import { AdaptivePracticePanel } from '../../components/AdaptivePracticePanel.jsx';
import { AdaptivePracticeSession } from './AdaptivePracticeSession.jsx';

const rowsOf = (value) =>
  Array.isArray(value)
    ? value
    : Array.isArray(value?.content)
      ? value.content
      : Array.isArray(value?.data)
        ? value.data
        : [];
const isFinished = (attempt) =>
  Boolean(attempt?.submittedAt) || ['SUBMITTED', 'GRADED', 'COMPLETED'].includes(attempt?.status);
const hasActiveAttempt = (exam) => exam.attempts?.some((attempt) => !isFinished(attempt));
const examTypeText = (value) =>
  ({ PRACTICE: 'Luyện tập', QUIZ: 'Kiểm tra ngắn', MIDTERM: 'Kiểm tra giữa kỳ', FINAL: 'Thi cuối kỳ' })[value] ||
  value ||
  'Đề kiểm tra';
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
  const params = new URLSearchParams(window.location.search);
  const practiceSessionId = params.get('practiceSessionId');
  if (practiceSessionId) return <AdaptivePracticeSession key={practiceSessionId} sessionId={practiceSessionId} />;
  const examId = params.get('examId');
  if (examId && params.get('mode') === 'waiting')
    return <ExamWaitingRoom key={examId} examId={examId} workspace="practice" />;
  if (examId) {
    return <AttemptSession examId={examId} attemptId={params.get('attemptId')} workspace="practice" />;
  }
  return <PracticeCenter />;
}

function TeacherPracticePanel() {
  const [examRows, setExamRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [historyExam, setHistoryExam] = useState(null);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const scope = new URLSearchParams(window.location.search);
        const scoped = scope.get('semester') || (scope.get('class') && scope.get('class') !== 'ALL');
        const classRows = rowsOf(await api.students.myClasses()).filter(
          (item) =>
            (!scope.get('semester') || String(item.semesterId) === scope.get('semester')) &&
            (!scope.get('class') || scope.get('class') === 'ALL' || String(item.classId) === scope.get('class'))
        );
        const grouped = await Promise.all(
          classRows.map(async (classItem) => ({
            classItem,
            exams: rowsOf(await api.exams.listForClass(classItem.classId).catch(() => [])),
            progress: rowsOf(await api.students.myProgress(classItem.classId).catch(() => [])),
          }))
        );
        const transfers = rowsOf(await api.exams.myTransferredExams().catch(() => [])).filter(
          (exam) => !scoped || classRows.some((item) => String(item.classId) === String(exam.classId))
        );
        const classById = new Map(classRows.map((item) => [String(item.classId), item]));
        const unique = new Map();
        [
          ...grouped.flatMap(({ classItem, exams }) =>
            exams.map((exam) => ({ ...exam, classId: exam.classId || classItem.classId }))
          ),
          ...transfers,
        ].forEach((exam) => unique.set(String(exam.examId), exam));
        const withAttempts = await Promise.all(
          [...unique.values()].map(async (exam) => {
            const [attemptData, policy] = await Promise.all([
              api.exams.myAttempts(exam.examId).catch(() => null),
              api.exams.attemptPolicy(exam.examId).catch(() => null),
            ]);
            const attempts = rowsOf(attemptData);
            const active = attempts.find((attempt) => !isFinished(attempt));
            const graded = attempts.find((attempt) => attempt.status === 'GRADED' && attempt.totalScore != null);
            const scoringQuestions = graded?.questions?.length
              ? graded.questions
              : graded?.attemptId
                ? rowsOf(await api.exams.attemptQuestions(graded.attemptId).catch(() => []))
                : [];
            return {
              ...exam,
              classLabel:
                classById.get(String(exam.classId))?.classCode ||
                classById.get(String(exam.classId))?.className ||
                exam.classLabel ||
                'Đề được chuyển',
              attempts: attemptData === null ? null : attempts,
              policy,
              scoringQuestions,
              activeProgress: active?.attemptId
                ? await api.exams.attemptProgress(active.attemptId).catch(() => null)
                : null,
            };
          })
        );
        if (!alive) return;
        setClasses(
          classRows.map((item) => ({
            ...item,
            progressRows: rowsOf(
              grouped.find((group) => String(group.classItem.classId) === String(item.classId))?.progress
            ),
          }))
        );
        setExamRows(withAttempts);
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải danh sách đề luyện.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const allAttempts = examRows.flatMap((exam) =>
    rowsOf(exam.attempts).map((attempt) => ({
      ...attempt,
      questions: attempt.questions?.length ? attempt.questions : exam.scoringQuestions,
    }))
  );
  const completedAttempts = allAttempts.filter(isFinished);
  const scored = completedAttempts.filter((item) => Number.isFinite(attemptScore(item)));
  const averageScore = scored.length
    ? (scored.reduce((sum, item) => sum + attemptScore(item), 0) / scored.length).toFixed(1)
    : '—';
  const displayedExamRows = examRows.filter((exam) => exam.examType === 'PRACTICE');
  const start = async (exam) => {
    const availability = studentExamAvailability(exam);
    if (startingId || !availability.canOpen) {
      setNotice(availability.reason);
      return;
    }
    setStartingId(exam.examId);
    setError('');
    try {
      const attempt = await api.exams.startAttempt(exam.examId);
      navigate(
        `exam_practice_center.html?examId=${encodeURIComponent(exam.examId)}${attempt?.attemptId ? `&attemptId=${encodeURIComponent(attempt.attemptId)}` : ''}&mode=take`
      );
    } catch (startError) {
      setError(startError?.message || 'Không thể bắt đầu lượt làm đề.');
    } finally {
      setStartingId('');
    }
  };
  const openExam = (exam) => {
    const { activeAttempt, canOpen, reason } = studentExamAvailability(exam);
    if (startingId || !canOpen) {
      setNotice(reason);
      return;
    }
    if (activeAttempt?.attemptId) {
      navigate(
        `exam_practice_center.html?examId=${encodeURIComponent(exam.examId)}&attemptId=${encodeURIComponent(activeAttempt.attemptId)}&mode=take`
      );
      return;
    }
    start(exam);
  };

  return (
    <div className="space-y-6">
      <AuthAlert>{notice}</AuthAlert>
      <MetricGrid
        items={[
          {
            label: 'Đề luyện tập',
            value: examRows.length,
            detail: 'Theo lớp học và đề được chuyển',
            icon: 'quiz',
            tone: 'warning',
          },
          {
            label: 'Lượt đã nộp',
            value: completedAttempts.length,
            detail: 'Từ lịch sử làm bài',
            icon: 'task_alt',
            tone: 'success',
          },
          {
            label: 'Điểm trung bình',
            value: averageScore,
            detail: scored.length ? `${scored.length} lượt có điểm · thang 10` : 'Chưa có điểm hợp lệ',
            icon: 'emoji_events',
            tone: 'primary',
          },
          {
            label: 'Đề đang làm',
            value: examRows.filter(hasActiveAttempt).length,
            detail: 'Các đề có thể tiếp tục làm',
            icon: 'pending_actions',
            tone: 'warning',
          },
        ]}
      />
      {loading ? (
        <LoadingIndicator className="py-10 text-center text-[#64748B]">Đang tải kỳ thi…</LoadingIndicator>
      ) : error && !examRows.length ? (
        <Card className="p-8 text-center">
          <p role="alert" className="text-primary">
            {error}
          </p>
          <Button className="mt-4" onClick={() => setReloadKey((value) => value + 1)}>
            Thử lại
          </Button>
        </Card>
      ) : (
        <>
          {error && (
            <p role="alert" className="text-primary">
              {error}
            </p>
          )}
          <p className="mt-5 text-body-sm text-[#64748B]">
            Các đề dưới đây dành riêng cho ôn luyện. Hiển thị {displayedExamRows.length} đề.
          </p>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {displayedExamRows.map((exam, index) => {
              const latest = exam.attempts?.[0];
              const availability = studentExamAvailability(exam, now);
              const policy = exam.policy;
              return (
                <StatCard
                  key={exam.examId}
                  label={exam.title || 'Đề không có tiêu đề'}
                  value="Ôn luyện"
                  detail={examTypeText(exam.examType)}
                  icon="quiz"
                  ribbonLabel={exam.classLabel || 'Đề kiểm tra'}
                  ribbonPosition="bottom"
                  accentColor={['#E52220', '#0284C7', '#7C3AED'][index % 3]}
                  footer={
                    <>
                      <div className="flex items-center justify-between gap-3 text-body-sm">
                        <span className="truncate text-[#64748B]">{exam.classLabel}</span>
                        <StatusBadge tone={availability.tone}>{availability.statusLabel}</StatusBadge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-body-sm text-[#64748B]">
                        <span>{exam.totalQuestions ?? '—'} câu hỏi</span>
                        <span>{exam.durationMinutes ? `${exam.durationMinutes} phút` : '—'}</span>
                        {policy && (
                          <span>
                            Lượt: {policy.usedAttempts ?? 0}/{policy.maxAttempts ?? '—'}
                          </span>
                        )}
                        {latest?.status === 'GRADED' && (
                          <span>Điểm: {formatAttemptScore(latest, exam.scoringQuestions)}</span>
                        )}
                        {latest?.attemptNumber && <span>Lần làm: {latest.attemptNumber}</span>}
                      </div>
                      {availability.reason && <p className="mt-2 text-body-sm text-[#B45309]">{availability.reason}</p>}
                      <Button
                        className="mt-3 w-full"
                        icon={availability.canOpen ? 'play_arrow' : 'lock'}
                        disabled={Boolean(startingId) || !availability.canOpen}
                        onClick={() => openExam(exam)}
                      >
                        {startingId === exam.examId ? 'Đang mở…' : availability.actionLabel}
                      </Button>
                      {availability.canWait && (
                        <Button
                          variant="secondary"
                          icon="hourglass_top"
                          className="mt-2 w-full"
                          onClick={() =>
                            navigate(`exam_practice_center.html?examId=${encodeURIComponent(exam.examId)}&mode=waiting`)
                          }
                        >
                          Vào sảnh chờ
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        className="mt-2 w-full"
                        icon="history"
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
          {!displayedExamRows.length && (
            <Card className="p-10 text-center text-[#64748B]">Chưa có đề ôn luyện phù hợp.</Card>
          )}
        </>
      )}
      {historyExam && <ExamHistoryDialog exam={historyExam} onClose={() => setHistoryExam(null)} />}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-headline-md font-bold">Tiến độ theo học phần</h2>
            <p className="mt-1 text-body-sm text-[#64748B]">
              Theo dõi tiến độ học liệu trong các học phần trước khi luyện đề.
            </p>
          </div>
          <a href="my_courses.html" className="text-body-sm font-semibold text-primary">
            Xem học phần
          </a>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {classes.slice(0, 3).map((item) => {
            const values = item.progressRows.map((progressItem) => Number(progressItem.progressPercent || 0));
            const value = values.length ? values.reduce((sum, current) => sum + current, 0) / values.length : 0;
            return (
              <Card as="div" key={item.classId} className="p-4">
                <strong>{item.subjectName || item.subjectCode || item.classCode}</strong>
                <ProgressBar value={value} className="mt-3" />
                <span className="mt-2 block text-body-sm text-[#64748B]">{Math.round(value)}% tiến độ chủ đề</span>
              </Card>
            );
          })}
          {!classes.length && <p className="text-body-sm text-[#64748B]">Chưa có học phần để thống kê tiến độ.</p>}
        </div>
      </Card>
    </div>
  );
}

function PracticeCenter() {
  const params = new URLSearchParams(window.location.search);
  const activeTab =
    params.get('tab') === 'suggestions' || (!params.has('tab') && params.has('recommendClassId'))
      ? 'suggestions'
      : 'teacher';
  const changeTab = (tab) => {
    const query = new URLSearchParams(window.location.search);
    query.set('tab', tab);
    navigate(`exam_practice_center.html?${query}`);
  };
  return (
    <AppShell
      currentPage="exam_practice_center.html"
      title="Trung tâm ôn luyện · PTIT Physics 1"
      breadcrumbs={['Ôn luyện']}
      current="Trung tâm ôn luyện"
    >
      <PageContainer>
        <PageTitle
          eyebrow="LUYỆN TẬP CÁ NHÂN"
          title="Trung tâm ôn luyện"
          description="Luyện đề của giảng viên hoặc củng cố kiến thức từ những câu đã trả lời sai."
        />
        <Tabs
          activeId={activeTab}
          onChange={changeTab}
          items={[
            { id: 'teacher', label: 'Đề luyện của giảng viên' },
            { id: 'suggestions', label: 'Gợi ý luyện tập' },
          ]}
        >
          {(tab) => (
            <section
              role="tabpanel"
              aria-label={tab === 'teacher' ? 'Đề luyện của giảng viên' : 'Gợi ý luyện tập'}
              className="pt-6"
            >
              {tab === 'teacher' ? <TeacherPracticePanel /> : <AdaptivePracticePanel />}
            </section>
          )}
        </Tabs>
      </PageContainer>
    </AppShell>
  );
}
