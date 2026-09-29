import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { api } from '../../lib/apiClient.js';
import { navigate } from '../../lib/navigation.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const finished = (attempt) =>
  Boolean(attempt?.submittedAt) || ['SUBMITTED', 'GRADED', 'COMPLETED'].includes(attempt?.status);
const formatDate = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

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
        if (alive) setExams([...unique.values()]);
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
        `exam_session.html?examId=${encodeURIComponent(exam.examId)}${attempt?.attemptId ? `&attemptId=${encodeURIComponent(attempt.attemptId)}` : ''}`
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
            {exams.map((exam) => (
              <Card key={exam.examId} className="flex flex-col p-6">
                <StatusBadge tone="neutral">{exam.examType === 'PRACTICE' ? 'Luyện tập' : 'Kiểm tra'}</StatusBadge>
                <h2 className="mt-4 text-headline-sm font-bold">{exam.title || 'Đề không có tiêu đề'}</h2>
                <p className="mt-1 text-body-sm text-[#64748B]">{exam.classLabel || 'Đề được chuyển'}</p>
                <p className="mt-5 text-body-sm text-[#64748B]">
                  {exam.totalQuestions ?? '—'} câu hỏi ·{' '}
                  {exam.durationMinutes ? `${exam.durationMinutes} phút` : 'Không giới hạn thời gian'}
                </p>
                <Button
                  className="mt-6 w-full"
                  icon="play_arrow"
                  disabled={startingId === exam.examId}
                  onClick={() => start(exam)}
                >
                  {startingId === exam.examId ? 'Đang mở…' : 'Bắt đầu làm bài'}
                </Button>
              </Card>
            ))}
          </div>
        )}
        {!loading && !error && !exams.length && (
          <Card className="p-10 text-center text-[#64748B]">Chưa có đề kiểm tra được cấp quyền.</Card>
        )}
      </PageContainer>
    </AppShell>
  );
}

function AttemptSession({ examId, attemptId }) {
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
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
  const start = async () => {
    setStarting(true);
    setError('');
    try {
      const created = await api.exams.startAttempt(examId);
      setAttempt(created);
      const url = new URL(window.location.href);
      if (created?.attemptId) url.searchParams.set('attemptId', created.attemptId);
      window.history.replaceState(window.history.state, '', url);
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
      toolbar={
        <DetailToolbar
          title={title}
          subtitle={
            attempt
              ? `Lượt làm ${attempt.attemptNumber || '—'} · ${isCompleted ? 'Đã nộp' : 'Đang làm'}`
              : 'Sẵn sàng bắt đầu'
          }
          backHref="exam_practice_center.html"
          backLabel="Về ôn luyện"
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
            <Card className="overflow-hidden p-0">
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
            </Card>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <Card className="p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined rounded-xl bg-[#EEF2FF] p-2 text-primary" aria-hidden="true">assignment</span>
                  <div>
                    <h2 className="text-headline-sm font-bold">Khu vực làm bài</h2>
                    <p className="mt-1 text-body-sm text-[#64748B]">Theo dõi trạng thái và tiếp tục lượt làm của bạn.</p>
                  </div>
                </div>
                {!attempt && (
                  <Card as="div" className="mt-6 border-[#BFDBFE] bg-[#EFF6FF] p-5">
                    <h3 className="font-bold text-[#1E3A8A]">Sẵn sàng bắt đầu</h3>
                    <p className="mt-2 text-body-sm text-[#1D4ED8]">Nhấn “Bắt đầu làm bài” để tạo một lượt làm mới cho đề này.</p>
                  </Card>
                )}
                {attempt && !isCompleted && (
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
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}

export function ExamSessionPage() {
  const params = new URLSearchParams(window.location.search);
  const examId = params.get('examId');
  return examId ? <AttemptSession examId={examId} attemptId={params.get('attemptId')} /> : <ExamSelection />;
}
