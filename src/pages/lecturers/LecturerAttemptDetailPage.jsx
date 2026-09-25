import React, { useMemo, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { LecturerNotFoundState } from '../../components/LecturerNotFoundState.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  answersAreEqual,
  assessmentAttempts,
  assessments,
  attemptStatusMeta,
  lecturerMaterials,
  lecturerQuestions,
  lecturerStudents,
  materialChapterLabels,
} from '../../data/lecturerData.js';

const formatDateTime = (value) =>
  value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const formatNumber = (value) =>
  Number(value)
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1');
const getDuration = (attempt) =>
  attempt.submittedAt ? Math.round((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 60000) : null;
const getCorrectIds = (question) => question.answers.filter((answer) => answer.correct).map((answer) => answer.id);

export function LecturerAttemptDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const assessmentId = params.get('assessment') ?? 'ASM001';
  const requestedAssessment = assessments.find((item) => item.id === assessmentId);
  const assessment = requestedAssessment ?? assessments[0];
  const assessmentAttemptList = assessmentAttempts.filter((item) => item.assessmentId === assessment.id);
  const requestedAttemptId = params.get('attempt');
  const attempt = requestedAssessment
    ? assessmentAttemptList.find((item) => item.id === requestedAttemptId)
    : undefined;
  const student = lecturerStudents.find((item) => item.id === attempt?.studentId);
  const questions = useMemo(
    () => assessment.questionIds.map((id) => lecturerQuestions.find((item) => item.id === id)).filter(Boolean),
    [assessment]
  );
  const correctCount = questions.filter((question) => {
    const answer = attempt?.answers.find((item) => item.questionId === question.id);
    return answersAreEqual(answer?.selectedAnswerIds ?? [], getCorrectIds(question));
  }).length;
  const [adjustedScore, setAdjustedScore] = useState(attempt?.adjustedScore ?? '');
  const [reason, setReason] = useState(attempt?.adjustmentReason ?? '');
  const [comment, setComment] = useState(attempt?.lecturerComment ?? '');
  const [savedAdjustment, setSavedAdjustment] = useState(attempt?.adjustedScore ?? null);
  const [savedComment, setSavedComment] = useState(attempt?.lecturerComment ?? '');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  if (!requestedAssessment || !attempt || !student)
    return (
      <LecturerPageShell
        currentPage="lecturer_assessments.html"
        title="Không tìm thấy bài làm"
        eyebrow="CHI TIẾT BÀI LÀM"
        description="Lượt làm được yêu cầu không tồn tại trong dữ liệu hiện tại."
      >
        <LecturerNotFoundState
          message="Bài kiểm tra, lượt làm hoặc sinh viên tương ứng không tồn tại trong dữ liệu hiện tại."
          backHref={
            requestedAssessment
              ? `lecturer_assessment_results.html?assessment=${assessment.id}`
              : 'lecturer_assessments.html'
          }
          backLabel={requestedAssessment ? 'Quay lại kết quả' : 'Quay lại danh sách bài kiểm tra'}
        />
      </LecturerPageShell>
    );

  const submitted = ['SUBMITTED', 'LATE'].includes(attempt.status);
  const officialScore =
    savedAdjustment === null || savedAdjustment === '' ? attempt.autoScore : Number(savedAdjustment);
  const statusMeta = attemptStatusMeta[attempt.status];
  const saveAdjustment = () => {
    const value = Number(adjustedScore);
    if (adjustedScore === '' || Number.isNaN(value) || value < 0 || value > assessment.totalScore) {
      setError(`Điểm phải nằm trong khoảng 0 đến ${assessment.totalScore}.`);
      return;
    }
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do điều chỉnh.');
      return;
    }
    setSavedAdjustment(value);
    setError('');
    setFeedback('Đã lưu điều chỉnh điểm trên giao diện.');
  };
  const saveComment = () => {
    setSavedComment(comment);
    setFeedback('Đã lưu nhận xét trên giao diện.');
  };
  const scrollToQuestion = (index) =>
    document.getElementById(`attempt-question-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <LecturerPageShell
      currentPage="lecturer_assessments.html"
      title={student.name}
      eyebrow="CHI TIẾT BÀI LÀM"
      description={`${student.id} · ${student.className} · ${assessment.title}`}
    >
      {feedback && (
        <div
          className="mt-5 rounded-xl border border-[#86EFAC] bg-[#DCFCE7] px-4 py-3 text-body-sm font-semibold text-[#15803D]"
          role="status"
        >
          {feedback}
        </div>
      )}
      <Card className="mt-5 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-label-md font-bold text-primary">{attempt.id}</p>
            <h2 className="mt-1 text-headline-md font-bold">{assessment.title}</h2>
            <p className="mt-1 text-body-sm text-[#64748B]">
              Bắt đầu {formatDateTime(attempt.startedAt)} · Nộp {formatDateTime(attempt.submittedAt)}
            </p>
          </div>
          <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
        </div>
      </Card>
      <div className="mt-5">
        <MetricGrid
          items={[
            {
              label: 'Điểm chính thức',
              value: officialScore === null ? '—' : formatNumber(officialScore),
              detail: `/ ${assessment.totalScore}`,
              icon: 'grade',
            },
            {
              label: 'Trả lời đúng',
              value: submitted ? String(correctCount) : '—',
              detail: `/ ${questions.length} câu`,
              icon: 'task_alt',
              tone: 'success',
            },
            {
              label: 'Thời gian làm',
              value: getDuration(attempt) === null ? 'Đang làm' : String(getDuration(attempt)),
              detail: getDuration(attempt) === null ? '' : 'phút',
              icon: 'timer',
              tone: 'warning',
            },
            {
              label: 'Nộp bài',
              value: attempt.submittedAt
                ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(
                    new Date(attempt.submittedAt)
                  )
                : '—',
              detail: attempt.submittedAt ? new Intl.DateTimeFormat('vi-VN').format(new Date(attempt.submittedAt)) : '',
              icon: 'event_available',
            },
          ]}
        />
      </div>
      <Card className="mt-5 p-5 md:p-6">
        <SectionHeader
          title="Điều hướng câu hỏi"
          description="Chọn số câu để chuyển nhanh đến câu trả lời tương ứng."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {questions.map((question, index) => {
            const answer = attempt.answers.find((item) => item.questionId === question.id);
            const correct = answersAreEqual(answer?.selectedAnswerIds ?? [], getCorrectIds(question));
            return (
              <button
                key={question.id}
                type="button"
                onClick={() => scrollToQuestion(index)}
                aria-label={`Đi đến câu ${index + 1}, ${correct ? 'chính xác' : 'chưa chính xác'}`}
                className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-body-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary ${correct ? 'border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]' : 'border-[#FECACA] bg-[#FEE2E2] text-primary'}`}
              >
                {index + 1} {correct ? '✓' : '✕'}
              </button>
            );
          })}
        </div>
      </Card>
      <section className="mt-5 space-y-5" aria-label="Danh sách câu trả lời">
        {questions.map((question, index) => {
          const studentAnswer = attempt.answers.find((item) => item.questionId === question.id);
          const selectedIds = studentAnswer?.selectedAnswerIds ?? [];
          const correctIds = getCorrectIds(question);
          const correct = answersAreEqual(selectedIds, correctIds);
          const source = lecturerMaterials.find((material) => material.id === question.sourceMaterialId);
          return (
            <Card key={question.id} className="scroll-mt-24 p-5 md:p-6" as="article" id={`attempt-question-${index}`}>
              <div id={`attempt-question-${index}`} className="scroll-mt-24">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-headline-sm font-bold">
                    Câu {index + 1} <span className="ml-2 font-mono text-label-md text-[#64748B]">{question.id}</span>
                  </h2>
                  <StatusBadge tone={correct ? 'success' : 'primary'}>
                    {correct ? '✓ Chính xác' : '✕ Chưa chính xác'}
                  </StatusBadge>
                </div>
                <p className="mt-4 text-body-md font-semibold leading-relaxed">{question.content}</p>
                <div className="mt-4 space-y-2">
                  {question.answers.map((answer) => {
                    const selected = selectedIds.includes(answer.id);
                    return (
                      <Card as="div"
                        key={answer.id}
                        className={`border p-3 text-body-sm ${answer.correct ? 'border-[#86EFAC] bg-[#F0FDF4]' : selected ? 'border-[#FECACA] bg-[#FEF2F2]' : 'border-[#E2E8F0]'}`}
                      >
                        <span className="font-bold">{answer.id}.</span> {answer.content}
                        {selected && <span className="ml-2 font-semibold">— Sinh viên chọn</span>}
                        {answer.correct && <span className="ml-2 font-semibold text-[#15803D]">— Đáp án đúng</span>}
                      </Card>
                    );
                  })}
                </div>
                <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
                  <div>
                    <dt className="text-[#64748B]">Sinh viên chọn</dt>
                    <dd className="mt-1 font-semibold">
                      {selectedIds.length ? selectedIds.join(', ') : 'Chưa trả lời'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#64748B]">Đáp án đúng</dt>
                    <dd className="mt-1 font-semibold">{correctIds.join(', ')}</dd>
                  </div>
                </dl>
                {question.explanation && (
                  <details className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <summary className="cursor-pointer font-semibold text-primary">Xem lời giải</summary>
                    <p className="mt-3 whitespace-pre-line text-body-sm leading-relaxed">{question.explanation}</p>
                    {source && (
                      <div className="mt-4 border-t border-[#E2E8F0] pt-3 text-body-sm text-[#64748B]">
                        <strong className="text-[#121C2A]">Nguồn:</strong> {source.title} ·{' '}
                        {materialChapterLabels[source.chapter]} · Trang {question.sourcePage}
                      </div>
                    )}
                  </details>
                )}
              </div>
            </Card>
          );
        })}
      </section>
      {submitted && (
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card className="p-5 md:p-6">
            <SectionHeader title="Điều chỉnh điểm" description="Điểm tự động luôn được giữ lại để đối chiếu." />
            <Card as="div" className="mt-4 bg-[#F8FAFC] p-4 text-body-sm">
              <p>
                Điểm tự động: <strong>{formatNumber(attempt.autoScore)}</strong>
              </p>
              {savedAdjustment !== null && (
                <p className="mt-1">
                  Điểm sau điều chỉnh: <strong>{formatNumber(savedAdjustment)}</strong>
                </p>
              )}
            </Card>
            <label className="mt-4 block text-body-sm font-semibold">
              Điểm cuối cùng
              <input
                type="number"
                min="0"
                max={assessment.totalScore}
                step="0.1"
                value={adjustedScore}
                onChange={(event) => setAdjustedScore(event.target.value)}
                className="mt-2 w-full border border-[#CBD5E1] px-4"
              />
            </label>
            <label className="mt-4 block text-body-sm font-semibold">
              Lý do điều chỉnh
              <textarea
                rows="3"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-2 w-full border border-[#CBD5E1] p-3"
              />
            </label>
            {error && (
              <p className="mt-2 text-body-sm font-semibold text-primary" role="alert">
                {error}
              </p>
            )}
            <Button className="mt-4" onClick={saveAdjustment}>
              Lưu điều chỉnh
            </Button>
          </Card>
          <Card className="p-5 md:p-6">
            <SectionHeader title="Nhận xét" description="Nhận xét được lưu cục bộ trong phiên giao diện hiện tại." />
            <label className="mt-4 block text-body-sm font-semibold">
              Nhận xét của giảng viên
              <textarea
                rows="7"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Nhập nhận xét dựa trên dữ liệu bài làm..."
                className="mt-2 w-full border border-[#CBD5E1] p-3"
              />
            </label>
            {savedComment && (
              <p className="mt-3 rounded-xl bg-[#F8FAFC] p-3 text-body-sm">
                <strong>Đã lưu:</strong> {savedComment}
              </p>
            )}
            <Button className="mt-4" onClick={saveComment}>
              Lưu nhận xét
            </Button>
          </Card>
        </div>
      )}
    </LecturerPageShell>
  );
}
