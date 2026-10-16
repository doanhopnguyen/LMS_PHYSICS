import { LoadingIndicator } from '../../components/LoadingIndicator.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ExamHistoryDialog } from '../../components/ExamHistoryDialog.jsx';
import { api } from '../../lib/apiClient.js';
import { navigate } from '../../lib/navigation.js';
import { studentExamAvailability } from '../../lib/studentExamAvailability.js';
import '../../styles/exam-waiting.css';

const formatDate = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');
async function loadExam(examId) {
  const [exam, policy, data] = await Promise.all([
    api.exams.get(examId),
    api.exams.attemptPolicy(examId),
    api.exams.myAttempts(examId),
  ]);
  return { ...exam, policy, attempts: Array.isArray(data) ? data : data?.content || data?.data || [] };
}

export function ExamWaitingRoom({ examId, workspace = 'exam' }) {
  const [exam, setExam] = useState(null);
  const [now, setNow] = useState(Date.now);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [verifiedAt, setVerifiedAt] = useState(0);
  const startingRef = useRef(false);
  const page =
    workspace === 'practice' || exam?.examType === 'PRACTICE' ? 'exam_practice_center.html' : 'exam_session.html';
  const startTime = Date.parse(exam?.policy?.startTime || exam?.startTime);
  const seconds = Number.isFinite(startTime) ? Math.max(0, Math.ceil((startTime - now) / 1000)) : 0;
  const opened = Boolean(exam) && seconds === 0;
  const availability = studentExamAvailability(exam || {}, now);
  const canEnter = availability.canOpen && !error && verifiedAt >= (Number.isFinite(startTime) ? startTime : 0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let alive = true;
    let inFlight = false;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const current = await loadExam(examId);
        if (alive) {
          setExam(current);
          setError('');
          setVerifiedAt(Date.now());
        }
      } catch (requestError) {
        if (alive) setError(requestError.message || 'Không thể cập nhật trạng thái đề thi.');
      } finally {
        inFlight = false;
        if (alive) setLoading(false);
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [examId, reloadKey, opened]);

  const start = async () => {
    if (startingRef.current || !canEnter) return;
    startingRef.current = true;
    setStarting(true);
    try {
      const current = await loadExam(examId);
      setExam(current);
      const access = studentExamAvailability(current);
      if (!access.canOpen) return;
      const attempt = access.activeAttempt || (await api.exams.startAttempt(examId));
      if (!attempt?.attemptId) throw new Error('Chưa xác định được lượt làm bài. Vui lòng thử lại.');
      navigate(
        `${page}?examId=${encodeURIComponent(examId)}&attemptId=${encodeURIComponent(attempt.attemptId)}&mode=take`
      );
    } catch (requestError) {
      setError(requestError.message || 'Không thể bắt đầu làm bài.');
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  };
  const countdown = [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');

  return (
    <AppShell
      currentPage={page}
      title="Sảnh chờ bài thi · PTIT Physics LMS"
      contentClass="exam-waiting-page"
      showAcademicFilters={false}
    >
      <PageContainer className="exam-waiting-container">
        <PageTitle
          eyebrow={page === 'exam_practice_center.html' ? 'ÔN LUYỆN' : 'KIỂM TRA'}
          title="Sảnh chờ bài thi"
          actions={
            <>
              <Button
                variant="secondary"
                icon="refresh"
                disabled={starting}
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Cập nhật trạng thái
              </Button>
              {exam && (
                <Button variant="secondary" icon="history" onClick={() => setHistoryOpen(true)}>
                  Lịch sử bài thi
                </Button>
              )}
            </>
          }
        />
        <AuthAlert error>{error}</AuthAlert>
        {loading ? (
          <LoadingIndicator className="p-6">Đang tải thông tin bài thi…</LoadingIndicator>
        ) : exam ? (
          <div className="exam-waiting-layout">
            <Card className="exam-waiting-main">
              <SectionHeader icon="quiz" title={exam.title || 'Đề thi'} />
              <p className="exam-waiting-intro">
                Chuẩn bị sẵn sàng trước giờ thi. Bạn có thể bắt đầu khi đề mở và được phép làm bài.
              </p>
              <div className={`exam-waiting-countdown ${canEnter ? 'is-ready' : ''}`}>
                <StatusBadge tone={seconds > 0 ? 'warning' : canEnter ? 'success' : 'neutral'}>
                  {seconds > 0 ? 'Chưa đến giờ thi' : canEnter ? 'Đề thi đã mở' : 'Chưa thể vào làm bài'}
                </StatusBadge>
                <p className="mt-4 text-body-sm text-[#64748B]">
                  {seconds > 0 ? 'Thời gian còn lại đến giờ mở đề' : 'Đã đến giờ mở đề'}
                </p>
                <p role="timer" aria-label="Đếm ngược đến giờ thi" className="exam-waiting-clock">
                  {countdown}
                </p>
                <p role="status" className="mt-3 text-body-sm text-[#64748B]">
                  {canEnter
                    ? 'Đề đã sẵn sàng. Nhấn nút bên dưới để vào làm bài.'
                    : availability.reason || 'Đang kiểm tra quyền làm bài…'}
                </p>
              </div>
              <p className="exam-waiting-note">
                {availability.activeAttempt
                  ? 'Lượt làm bài đã bắt đầu trước đó; thời gian của lượt làm vẫn tiếp tục được tính.'
                  : 'Thời gian làm bài chỉ bắt đầu khi bạn nhấn bắt đầu.'}{' '}
                Trạng thái đề được cập nhật tự động trong lúc chờ.
              </p>
              <Button
                className="w-full"
                icon={canEnter ? 'play_arrow' : 'lock'}
                disabled={loading || starting || !canEnter}
                onClick={start}
              >
                {starting ? 'Đang mở…' : seconds > 0 ? 'Chờ đến giờ thi' : availability.actionLabel}
              </Button>
            </Card>
            <Card className="exam-waiting-details">
              <SectionHeader icon="event_note" title="Thông tin bài thi" />
              <dl>
                {[
                  ['Giờ mở đề', formatDate(exam.policy?.startTime || exam.startTime)],
                  ['Hạn kết thúc', formatDate(exam.policy?.endTime || exam.endTime)],
                  ['Thời lượng', exam.durationMinutes ? `${exam.durationMinutes} phút` : 'Không giới hạn'],
                  ['Số câu hỏi', exam.totalQuestions ?? '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-body-sm text-[#64748B]">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        ) : null}
        {historyOpen && exam && <ExamHistoryDialog exam={exam} onClose={() => setHistoryOpen(false)} />}
      </PageContainer>
    </AppShell>
  );
}
