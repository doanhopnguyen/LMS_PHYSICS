import React, { useMemo, useState } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { LecturerNotFoundState } from '../../components/LecturerNotFoundState.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import {
  answersAreEqual,
  assessmentAttempts,
  assessments,
  assessmentStatusMeta,
  attemptStatusMeta,
  lecturerQuestions,
  lecturerStudents,
} from '../../data/lecturerData.js';

const formatDateTime = (value) =>
  value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const formatScore = (value, total) =>
  value === null || value === undefined ? '—' : `${Number(value).toFixed(2).replace(/\.00$/, '')} / ${total}`;
const getFinalScore = (attempt) => attempt?.adjustedScore ?? attempt?.autoScore ?? null;
const getDuration = (attempt) => {
  if (!attempt?.startedAt) return '—';
  const end = attempt.submittedAt ? new Date(attempt.submittedAt) : new Date('2026-09-22T09:38');
  return `${Math.max(0, Math.round((end - new Date(attempt.startedAt)) / 60000))} phút`;
};
const isCorrect = (question, answer) =>
  answersAreEqual(
    answer?.selectedAnswerIds ?? [],
    question.answers.filter((item) => item.correct).map((item) => item.id)
  );

function EmptyState({ filtered, onReset }) {
  return (
    <Card className="p-10 text-center">
      <span className="material-symbols-outlined text-4xl text-[#94A3B8]">{filtered ? 'search_off' : 'inbox'}</span>
      <h2 className="mt-3 text-headline-sm font-bold">{filtered ? 'Không tìm thấy sinh viên' : 'Chưa có bài nộp'}</h2>
      <p className="mt-1 text-body-md text-[#64748B]">
        {filtered
          ? 'Không có sinh viên phù hợp với bộ lọc hiện tại.'
          : 'Kết quả sẽ xuất hiện khi sinh viên hoàn thành bài kiểm tra.'}
      </p>
      {filtered && (
        <Button variant="secondary" className="mt-5" onClick={onReset}>
          Xóa bộ lọc
        </Button>
      )}
    </Card>
  );
}

function SummaryPanel({ assessment, rows, submittedAttempts, counts }) {
  const scores = submittedAttempts.map(getFinalScore).filter((score) => score !== null);
  const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  const passed = scores.filter((score) => score >= assessment.totalScore / 2).length;
  const completion = rows.length ? (counts.submitted / rows.length) * 100 : 0;
  return (
    <div className="space-y-5 pt-5">
      <Card className={`p-5 md:p-6 ${assessment.status === 'OPEN' ? 'bg-[#F0FDF4]' : 'bg-[#F8FAFC]'}`}>
        <div className="flex items-start gap-3">
          <span
            className={`material-symbols-outlined ${assessment.status === 'OPEN' ? 'text-[#15803D]' : 'text-[#475569]'}`}
          >
            {assessment.status === 'OPEN' ? 'sensors' : 'task_alt'}
          </span>
          <div>
            <h2 className="text-headline-sm font-bold">
              {assessment.status === 'OPEN' ? 'Bài kiểm tra đang diễn ra' : 'Bài kiểm tra đã kết thúc'}
            </h2>
            <p className="mt-1 text-body-md text-[#64748B]">
              {counts.submitted}/{rows.length} sinh viên đã nộp. {counts.inProgress} sinh viên đang làm.{' '}
              {counts.notStarted} sinh viên chưa bắt đầu.
            </p>
          </div>
        </div>
      </Card>
      <Card className="p-5 md:p-6">
        <SectionHeader title="Tóm tắt kết quả" description="Các chỉ số được tính từ những lượt làm đã nộp." />
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            ['Điểm trung bình', scores.length ? average.toFixed(1) : '—'],
            ['Điểm cao nhất', scores.length ? Math.max(...scores).toFixed(1) : '—'],
            ['Điểm thấp nhất', scores.length ? Math.min(...scores).toFixed(1) : '—'],
            ['Tỷ lệ hoàn thành', `${completion.toFixed(1)}%`],
            ['Tỷ lệ đạt ≥ 5', scores.length ? `${((passed / scores.length) * 100).toFixed(1)}%` : '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <span className="text-body-sm text-[#64748B]">{label}</span>
              <strong className="mt-1 block text-headline-sm">{value}</strong>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function LecturerAssessmentResultsPage() {
  const params = new URLSearchParams(window.location.search);
  const assessmentId = params.get('assessment') ?? 'ASM001';
  const requestedAssessment = assessments.find((item) => item.id === assessmentId);
  const assessment = requestedAssessment ?? assessments[0];
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [scoreFilter, setScoreFilter] = useState('ALL');

  const questions = useMemo(
    () => assessment.questionIds.map((id) => lecturerQuestions.find((item) => item.id === id)).filter(Boolean),
    [assessment]
  );
  const attempts = useMemo(
    () => assessmentAttempts.filter((attempt) => attempt.assessmentId === assessment.id),
    [assessment]
  );
  const rows = useMemo(
    () =>
      lecturerStudents
        .filter((student) => assessment.classIds.includes(student.className))
        .map((student) => ({
          ...student,
          attempt: attempts.find((attempt) => attempt.studentId === student.id),
          attemptStatus: attempts.find((attempt) => attempt.studentId === student.id)?.status ?? 'NOT_STARTED',
        })),
    [assessment, attempts]
  );
  const submittedAttempts = attempts.filter((attempt) => ['SUBMITTED', 'LATE'].includes(attempt.status));
  const counts = {
    submitted: submittedAttempts.length,
    inProgress: attempts.filter((attempt) => attempt.status === 'IN_PROGRESS').length,
    notStarted: rows.filter((row) => row.attemptStatus === 'NOT_STARTED').length,
  };
  const completion = rows.length ? Math.round((counts.submitted / rows.length) * 100) : 0;
  const averageScore = submittedAttempts.length
    ? submittedAttempts.reduce((sum, item) => sum + getFinalScore(item), 0) / submittedAttempts.length
    : 0;

  if (!requestedAssessment) {
    return (
      <LecturerPageShell
        currentPage="lecturer_assessments.html"
        title="Không tìm thấy bài kiểm tra"
        eyebrow="BÀI TẬP & KIỂM TRA"
        description="Mã bài kiểm tra trong liên kết không tồn tại trong dữ liệu hiện tại."
      >
        <LecturerNotFoundState
          message={`Không có bài kiểm tra mang mã ${assessmentId}.`}
          backHref="lecturer_assessments.html"
          backLabel="Quay lại danh sách bài kiểm tra"
        />
      </LecturerPageShell>
    );
  }

  const visibleRows = useMemo(
    () =>
      rows.filter((row) => {
        const normalized = query.trim().toLocaleLowerCase('vi');
        const score = getFinalScore(row.attempt);
        const matchesQuery = !normalized || `${row.id} ${row.name}`.toLocaleLowerCase('vi').includes(normalized);
        const matchesStatus = statusFilter === 'ALL' || row.attemptStatus === statusFilter;
        const matchesScore =
          scoreFilter === 'ALL' ||
          (scoreFilter === 'GTE8' && score >= 8) ||
          (scoreFilter === '65_79' && score >= 6.5 && score < 8) ||
          (scoreFilter === '5_64' && score >= 5 && score < 6.5) ||
          (scoreFilter === 'LT5' && score !== null && score < 5);
        return matchesQuery && matchesStatus && matchesScore;
      }),
    [query, rows, scoreFilter, statusFilter]
  );

  const questionStats = questions.map((question) => {
    const correct = submittedAttempts.filter((attempt) =>
      isCorrect(
        question,
        attempt.answers.find((answer) => answer.questionId === question.id)
      )
    ).length;
    const total = submittedAttempts.length;
    return { ...question, correct, incorrect: total - correct, rate: total ? (correct / total) * 100 : 0 };
  });
  const resetFilters = () => {
    setQuery('');
    setStatusFilter('ALL');
    setScoreFilter('ALL');
  };
  const tabs = [
    { id: 'OVERVIEW', label: 'Tổng quan' },
    { id: 'STUDENTS', label: 'Sinh viên' },
    { id: 'QUESTIONS', label: 'Câu hỏi' },
    ...(assessment.status === 'CLOSED' ? [{ id: 'DISTRIBUTION', label: 'Phân bố điểm' }] : []),
  ];

  return (
    <LecturerPageShell
      currentPage="lecturer_assessments.html"
      title={assessment.title}
      eyebrow="THEO DÕI BÀI KIỂM TRA"
      description={`${assessment.classIds.join(', ')} · ${assessment.questionIds.length} câu · ${assessment.duration} phút · ${assessment.totalScore} điểm`}
    >
      <Breadcrumbs items={['Bài tập & kiểm tra']} current={assessment.title} />
      <Card className="mt-5 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-body-sm text-[#64748B]">Thời gian</p>
            <p className="mt-1 font-semibold">
              {formatDateTime(assessment.startAt)} → {formatDateTime(assessment.endAt)}
            </p>
          </div>
          <StatusBadge tone={assessmentStatusMeta[assessment.status].tone}>
            {assessmentStatusMeta[assessment.status].label}
          </StatusBadge>
        </div>
      </Card>
      <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Thống kê bài làm">
        <StatCard label="Được giao" value={String(rows.length)} detail="sinh viên" icon="groups" />
        <StatCard label="Đã nộp" value={String(counts.submitted)} icon="task_alt" tone="success" />
        {assessment.status === 'CLOSED' ? (
          <StatCard
            label="Điểm trung bình"
            value={submittedAttempts.length ? averageScore.toFixed(1) : '—'}
            detail={`/ ${assessment.totalScore}`}
            icon="analytics"
          />
        ) : (
          <StatCard label="Đang làm" value={String(counts.inProgress)} icon="pending_actions" tone="warning" />
        )}
        <StatCard label="Chưa làm" value={String(counts.notStarted)} icon="person_off" />
      </section>
      <Card className="mt-5 p-5 md:p-6">
        <SectionHeader
          title="Tiến độ hoàn thành"
          description={`${counts.submitted} / ${rows.length} sinh viên đã nộp`}
        />
        <ProgressBar value={completion} label={`${completion}% hoàn thành`} className="mt-5" />
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-body-sm text-[#64748B]">
          <span>
            <strong className="text-[#121C2A]">Đã nộp:</strong> {counts.submitted}
          </span>
          <span>
            <strong className="text-[#121C2A]">Đang làm:</strong> {counts.inProgress}
          </span>
          <span>
            <strong className="text-[#121C2A]">Chưa bắt đầu:</strong> {counts.notStarted}
          </span>
        </div>
      </Card>
      <Card className="mt-5 p-5 md:p-6">
        <Tabs items={tabs}>
          {(tab) => {
            if (tab === 'OVERVIEW')
              return (
                <SummaryPanel
                  assessment={assessment}
                  rows={rows}
                  submittedAttempts={submittedAttempts}
                  counts={counts}
                />
              );
            if (tab === 'STUDENTS')
              return (
                <div className="space-y-5 pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="text-body-sm font-semibold">
                      Tìm sinh viên
                      <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Tìm theo tên hoặc mã sinh viên..."
                        className="mt-2 w-full border border-[#CBD5E1] px-4"
                      />
                    </label>
                    <label className="text-body-sm font-semibold">
                      Trạng thái
                      <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
                      >
                        <option value="ALL">Tất cả</option>
                        {Object.entries(attemptStatusMeta).map(([value, meta]) => (
                          <option key={value} value={value}>
                            {meta.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-body-sm font-semibold">
                      Điểm
                      <select
                        value={scoreFilter}
                        onChange={(event) => setScoreFilter(event.target.value)}
                        className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
                      >
                        <option value="ALL">Tất cả</option>
                        <option value="GTE8">≥ 8</option>
                        <option value="65_79">6.5 – 7.9</option>
                        <option value="5_64">5 – 6.4</option>
                        <option value="LT5">&lt; 5</option>
                      </select>
                    </label>
                  </div>
                  {visibleRows.length ? (
                    <DataTable
                      columns={[
                        'Mã sinh viên',
                        'Họ và tên',
                        'Trạng thái',
                        'Bắt đầu',
                        'Nộp bài',
                        'Thời gian làm',
                        'Điểm',
                        'Hành động',
                      ]}
                      rows={visibleRows}
                      renderRow={(row) => {
                        const meta = attemptStatusMeta[row.attemptStatus];
                        return (
                          <tr className="border-t border-[#E2E8F0]">
                            <td className="px-3 py-3 font-mono">{row.id}</td>
                            <td className="px-3 py-3 font-semibold whitespace-nowrap">{row.name}</td>
                            <td className="px-3 py-3">
                              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(row.attempt?.startedAt)}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(row.attempt?.submittedAt)}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{getDuration(row.attempt)}</td>
                            <td className="px-3 py-3 font-semibold whitespace-nowrap">
                              {formatScore(getFinalScore(row.attempt), assessment.totalScore)}
                            </td>
                            <td className="px-3 py-3">
                              {row.attempt && (
                                <a
                                  className="font-semibold text-primary whitespace-nowrap"
                                  href={`lecturer_attempt_detail.html?assessment=${assessment.id}&attempt=${row.attempt.id}`}
                                >
                                  {row.attemptStatus === 'IN_PROGRESS' ? 'Xem trạng thái' : 'Xem bài'}
                                </a>
                              )}
                            </td>
                          </tr>
                        );
                      }}
                    />
                  ) : (
                    <EmptyState
                      filtered={Boolean(query || statusFilter !== 'ALL' || scoreFilter !== 'ALL')}
                      onReset={resetFilters}
                    />
                  )}
                </div>
              );
            if (tab === 'QUESTIONS')
              return submittedAttempts.length ? (
                <div className="space-y-6 pt-5">
                  <DataTable
                    columns={['Câu', 'Nội dung', 'Đúng', 'Sai', 'Tỷ lệ đúng']}
                    rows={questionStats}
                    renderRow={(row, index) => (
                      <tr className="border-t border-[#E2E8F0]">
                        <td className="px-3 py-3 font-semibold">
                          Q{index + 1}
                          <span className="mt-1 block font-mono text-label-sm text-[#64748B]">{row.id}</span>
                        </td>
                        <td className="max-w-md px-3 py-3">
                          <span className="line-clamp-2">{row.content}</span>
                        </td>
                        <td className="px-3 py-3">{row.correct}</td>
                        <td className="px-3 py-3">{row.incorrect}</td>
                        <td className="px-3 py-3 font-semibold">{row.rate.toFixed(1)}%</td>
                      </tr>
                    )}
                  />
                  <Card className="p-5">
                    <SectionHeader title="Câu hỏi có tỷ lệ sai cao" description="Số liệu quan sát từ các bài đã nộp." />
                    <div className="mt-4 space-y-3">
                      {[...questionStats]
                        .sort((a, b) => a.rate - b.rate)
                        .slice(0, 3)
                        .map((question) => (
                          <div
                            key={question.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] p-4"
                          >
                            <div>
                              <strong className="font-mono">{question.id}</strong>
                              <p className="mt-1 text-body-sm text-[#64748B]">{question.topic}</p>
                            </div>
                            <StatusBadge tone="warning">{(100 - question.rate).toFixed(1)}% trả lời sai</StatusBadge>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              ) : (
                <EmptyState />
              );
            const buckets = [
              { label: '0 – <5', count: submittedAttempts.filter((item) => getFinalScore(item) < 5).length },
              {
                label: '5 – <6.5',
                count: submittedAttempts.filter((item) => getFinalScore(item) >= 5 && getFinalScore(item) < 6.5).length,
              },
              {
                label: '6.5 – <8',
                count: submittedAttempts.filter((item) => getFinalScore(item) >= 6.5 && getFinalScore(item) < 8).length,
              },
              { label: '8 – 10', count: submittedAttempts.filter((item) => getFinalScore(item) >= 8).length },
            ];
            const max = Math.max(1, ...buckets.map((item) => item.count));
            return (
              <div className="pt-5">
                <Card className="p-5 md:p-6">
                  <SectionHeader title="Phân bố điểm" description="Phân bố điểm chính thức của các bài đã nộp." />
                  <div className="mt-5 space-y-4">
                    {buckets.map((bucket) => (
                      <div key={bucket.label} className="grid grid-cols-[72px_1fr_auto] items-center gap-3">
                        <span className="text-body-sm font-semibold">{bucket.label}</span>
                        <div className="h-3 overflow-hidden rounded-full bg-[#E2E8F0]">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(bucket.count / max) * 100}%` }}
                          />
                        </div>
                        <span className="text-body-sm text-[#64748B]">{bucket.count} sinh viên</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            );
          }}
        </Tabs>
      </Card>
    </LecturerPageShell>
  );
}
