import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { FormDialog } from '../../components/FormDialog.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { api } from '../../lib/apiClient.js';
import { navigate } from '../../lib/navigation.js';
import { AttemptSession } from './ExamSessionPage.jsx';

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
const statusText = (attempt) => (isFinished(attempt) ? 'Đã nộp' : attempt ? 'Đang làm' : 'Chưa làm');
const hasActiveAttempt = (exam) => exam.attempts?.some((attempt) => !isFinished(attempt));
const examTypeText = (value) =>
  ({ PRACTICE: 'Luyện tập', QUIZ: 'Kiểm tra ngắn', MIDTERM: 'Kiểm tra giữa kỳ', FINAL: 'Thi cuối kỳ' }[value] || value || 'Đề kiểm tra');
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
  const examId = params.get('examId');
  if (examId) {
    return <AttemptSession examId={examId} attemptId={params.get('attemptId')} takeMode={params.get('mode') === 'take'} workspace="practice" />;
  }
  return <PracticeCenter />;
}

function PracticeCenter() {
  const [examRows, setExamRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [historyExam, setHistoryExam] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const classRows = rowsOf(await api.students.myClasses());
        const grouped = await Promise.all(
          classRows.map(async (classItem) => ({
            classItem,
            exams: rowsOf(await api.exams.listForClass(classItem.classId).catch(() => [])),
            progress: rowsOf(await api.students.myProgress(classItem.classId).catch(() => [])),
          }))
        );
        const transfers = rowsOf(await api.exams.myTransferredExams().catch(() => []));
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
              api.exams.myAttempts(exam.examId).catch(() => []),
              api.exams.attemptPolicy(exam.examId).catch(() => null),
            ]);
            const attempts = rowsOf(attemptData);
            const active = attempts.find((attempt) => !isFinished(attempt));
            return {
              ...exam,
              classLabel:
                classById.get(String(exam.classId))?.classCode ||
                classById.get(String(exam.classId))?.className ||
                exam.classLabel ||
                'Đề được chuyển',
              attempts,
              policy,
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

  const allAttempts = examRows.flatMap((exam) => rowsOf(exam.attempts));
  const completedAttempts = allAttempts.filter(isFinished);
  const scored = completedAttempts.filter((item) => Number.isFinite(Number(item.totalScore)));
  const averageScore = scored.length
    ? (scored.reduce((sum, item) => sum + Number(item.totalScore), 0) / scored.length).toFixed(1)
    : '—';
  const displayedExamRows = examRows.filter((exam) => exam.examType === 'PRACTICE');
  const start = async (exam) => {
    const policy = exam.policy;
    const ended = Boolean(policy?.ended || policy?.isEnded || (policy?.endTime && new Date(policy.endTime).getTime() <= Date.now()));
    if (ended) {
      setNotice('Đề thi đã hết thời gian làm bài, bạn không thể bắt đầu lượt mới.');
      return;
    }
    if (policy && !policy.canStartAttempt) {
      setNotice(policy.remainingAttempts <= 0 ? 'Bạn đã sử dụng hết số lượt làm bài cho đề này.' : 'Hiện không thể bắt đầu lượt làm bài mới theo chính sách của đề.');
      return;
    }
    if (!Number(exam.totalQuestions)) {
      setError('Đề thi chưa có câu hỏi nên chưa thể bắt đầu làm bài.');
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
    const activeAttempt = exam.attempts?.find((attempt) => !isFinished(attempt));
    if (activeAttempt?.attemptId) {
      navigate(
        `exam_practice_center.html?examId=${encodeURIComponent(exam.examId)}&attemptId=${encodeURIComponent(activeAttempt.attemptId)}&mode=take`
      );
      return;
    }
    start(exam);
  };

  return (
    <AppShell
      currentPage="exam_practice_center.html"
      title="Trung tâm ôn luyện · PTIT Physics 1"
      breadcrumbs={['Ôn luyện']}
      current="Trung tâm ôn luyện"
      filterActions={
        <Button
          variant="secondary"
          icon="refresh"
          onClick={() => setReloadKey((value) => value + 1)}
          disabled={loading}
        >
          Tải lại
        </Button>
      }
    >
      <PageContainer>
        <PageTitle
          eyebrow="LUYỆN TẬP CÁ NHÂN"
          title="Trung tâm ôn luyện"
          description="Chọn đề được cấp quyền, theo dõi lượt làm và tiếp tục ôn tập."
        />
        <AuthAlert>{notice}</AuthAlert>
        <MetricGrid
          items={[
            {
              label: 'Đề được cấp quyền',
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
              detail: scored.length ? `${scored.length} lượt có điểm` : 'Chưa có lượt được chấm',
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
          <p className="py-10 text-center text-[#64748B]">Đang tải kỳ thi…</p>
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
            <p className="mt-5 text-body-sm text-[#64748B]">Các đề dưới đây dành riêng cho ôn luyện. Hiển thị {displayedExamRows.length} đề.</p>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {displayedExamRows.map((exam, index) => {
                const latest = exam.attempts?.[0];
                const active = exam.attempts?.find((item) => !isFinished(item));
                const policy = exam.policy;
                const ended = Boolean(policy?.ended || policy?.isEnded || (policy?.endTime && new Date(policy.endTime).getTime() <= Date.now()));
                const hasQuestions = Number(exam.totalQuestions) > 0;
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
                          <span className="font-semibold text-[#334155]">{statusText(latest)}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-body-sm text-[#64748B]">
                          <span>{exam.totalQuestions ?? '—'} câu hỏi</span>
                          <span>{exam.durationMinutes ? `${exam.durationMinutes} phút` : '—'}</span>
                          {policy && <span>Lượt: {policy.usedAttempts ?? 0}/{policy.maxAttempts ?? '—'}</span>}
                          {latest?.status === 'GRADED' && <span>Điểm: {latest.totalScore ?? '—'}</span>}
                          {latest?.attemptNumber && <span>Lần làm: {latest.attemptNumber}</span>}
                        </div>
                        {!hasQuestions && <p className="mt-2 text-body-sm text-[#B45309]">Đề chưa có câu hỏi.</p>}
                        <Button
                          className="mt-3 w-full"
                          icon={active ? 'play_arrow' : 'assignment'}
                          disabled={startingId === exam.examId || (!active && !hasQuestions)}
                          onClick={() => openExam(exam)}
                        >
                          {startingId === exam.examId
                            ? 'Đang mở…'
                            : active
                              ? 'Tiếp tục làm'
                              : hasQuestions
                                ? ended ? 'Đã hết thời gian' : policy?.canStartAttempt === false ? (policy?.remainingAttempts <= 0 ? 'Đã hết lượt làm' : 'Chưa thể bắt đầu') : 'Bắt đầu ôn luyện'
                                : 'Chưa thể làm đề'}
                        </Button>
                        <Button variant="secondary" className="mt-2 w-full" icon="history" onClick={() => setHistoryExam(exam)}>Lịch sử lần thi</Button>
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
        {historyExam && (
          <FormDialog title={`Lịch sử làm bài · ${historyExam.title || 'Đề thi'}`} onClose={() => setHistoryExam(null)} wide>
            <p className="mb-4 text-body-sm text-[#64748B]">Các lượt làm bài của bạn cho đề này. Điểm chỉ hiển thị sau khi giảng viên hoặc hệ thống hoàn tất chấm.</p>
            <DataTable
              paginate={false}
              columns={['Lần làm', 'Bắt đầu', 'Nộp bài', 'Trạng thái', 'Điểm', '']}
              rows={historyExam.attempts || []}
              renderRow={(attempt) => {
                const graded = attempt.status === 'GRADED' && attempt.totalScore !== null && attempt.totalScore !== undefined;
                return <tr className="border-t border-[#E2E8F0]" key={attempt.attemptId}><td className="p-3">{attempt.attemptNumber || '—'}</td><td className="p-3">{attempt.startedAt ? new Date(attempt.startedAt).toLocaleString('vi-VN') : '—'}</td><td className="p-3">{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('vi-VN') : 'Chưa nộp'}</td><td className="p-3"><StatusBadge tone={graded ? 'success' : isFinished(attempt) ? 'warning' : 'neutral'}>{graded ? 'Đã chấm' : isFinished(attempt) ? 'Chờ chấm' : 'Đang làm'}</StatusBadge></td><td className="p-3">{graded ? attempt.totalScore : '—'}</td><td className="p-3">{isFinished(attempt) && <a href={`exam_results.html?examId=${encodeURIComponent(historyExam.examId)}&attemptId=${encodeURIComponent(attempt.attemptId)}`}><Button variant="secondary">Xem</Button></a>}</td></tr>;
              }}
            />
            {!historyExam.attempts?.length && <p className="py-6 text-center text-[#64748B]">Bạn chưa có lượt làm bài nào cho đề này.</p>}
          </FormDialog>
        )}
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
      </PageContainer>
    </AppShell>
  );
}
