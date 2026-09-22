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
import { labs } from '../../data/lmsData.js';
import {
  labAssignments,
  labAssignmentStatusMeta,
  labEvidenceLabels,
  labGradingStatusMeta,
  labSubmissions,
  labSubmissionStatusMeta,
  lecturerCourses,
  lecturerLabMetadata,
  lecturerStudents,
} from '../../data/lecturerData.js';
import { loadLabGradings } from '../../lib/labGradingState.js';

const formatDateTime = (value) =>
  value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const getLab = (labId) => {
  const index = Number(labId.replace('LAB', '')) - 1;
  return { ...labs[index], id: labId, ...lecturerLabMetadata[labId] };
};

export function LecturerLabAssignmentDetailPage() {
  const id = new URLSearchParams(window.location.search).get('assignment') ?? 'LABASM001';
  const requestedAssignment = labAssignments.find((item) => item.id === id);
  const assignment = requestedAssignment ?? labAssignments[0];
  const lab = getLab(assignment.labId);
  const submissions = labSubmissions.filter((item) => item.assignmentId === assignment.id);
  const gradings = loadLabGradings();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const students = useMemo(
    () =>
      lecturerStudents
        .filter((student) => assignment.classIds.includes(student.className))
        .map((student) => {
          const submission = submissions.find((item) => item.studentId === student.id);
          return { ...student, submission, labStatus: submission?.status ?? 'NOT_STARTED' };
        }),
    [assignment, submissions]
  );
  const visible = useMemo(
    () =>
      students.filter((student) => {
        const keyword = query.trim().toLocaleLowerCase('vi');
        return (
          (!keyword || `${student.id} ${student.name}`.toLocaleLowerCase('vi').includes(keyword)) &&
          (statusFilter === 'ALL' || student.labStatus === statusFilter) &&
          (classFilter === 'ALL' || student.className === classFilter)
        );
      }),
    [students, query, statusFilter, classFilter]
  );
  const performed = submissions.length;
  const submitted = submissions.filter((item) => ['SUBMITTED', 'LATE'].includes(item.status)).length;
  const pending = submissions.filter(
    (item) =>
      ['SUBMITTED', 'LATE'].includes(item.status) &&
      !['CONFIRMED', 'PUBLISHED'].includes(gradings.find((grading) => grading.submissionId === item.id)?.status)
  ).length;
  const completion = students.length ? Math.round((submitted / students.length) * 100) : 0;

  if (!requestedAssignment) {
    return (
      <LecturerPageShell
        currentPage="lecturer_labs.html"
        title="Không tìm thấy bài thí nghiệm"
        eyebrow="THÍ NGHIỆM ẢO 3D"
        description="Mã bài giao thí nghiệm trong liên kết không tồn tại trong dữ liệu hiện tại."
      >
        <LecturerNotFoundState
          message={`Không có bài giao thí nghiệm mang mã ${id}.`}
          backHref="lecturer_labs.html"
          backLabel="Quay lại danh sách thí nghiệm"
        />
      </LecturerPageShell>
    );
  }
  const reset = () => {
    setQuery('');
    setStatusFilter('ALL');
    setClassFilter('ALL');
  };
  return (
    <LecturerPageShell
      currentPage="lecturer_labs.html"
      title={lab.title}
      eyebrow="THEO DÕI THÍ NGHIỆM"
      description={`${assignment.classIds.join(', ')} · ${assignment.id}`}
    >
      <Breadcrumbs items={['Thí nghiệm ảo 3D']} current={assignment.title} />
      <Card className="mt-5 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-label-md font-bold text-primary">{lab.code}</p>
            <h2 className="mt-1 text-headline-md font-bold">{assignment.title}</h2>
            <p className="mt-2 text-body-sm text-[#64748B]">
              Bắt đầu {formatDateTime(assignment.startAt)} · Hạn nộp {formatDateTime(assignment.dueAt)}
            </p>
          </div>
          <StatusBadge tone={labAssignmentStatusMeta[assignment.status].tone}>
            {labAssignmentStatusMeta[assignment.status].label}
          </StatusBadge>
        </div>
        <p className="mt-5 whitespace-pre-line text-body-md text-[#64748B]">{assignment.instructions}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {assignment.requiredEvidence.map((item) => (
            <StatusBadge key={item} tone="neutral">
              {labEvidenceLabels[item]}
            </StatusBadge>
          ))}
        </div>
      </Card>
      <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Tổng sinh viên" value={String(students.length)} icon="groups" />
        <StatCard label="Đã thực hiện" value={String(performed)} icon="play_circle" />
        <StatCard label="Đã nộp" value={String(submitted)} icon="task_alt" tone="success" />
        <StatCard label="Chưa nộp" value={String(students.length - submitted)} icon="pending_actions" />
        <StatCard label="Chờ chấm" value={String(pending)} icon="grading" tone="warning" />
      </section>
      <Card className="mt-5 p-5 md:p-6">
        <SectionHeader title="Tiến độ nộp báo cáo" description={`${submitted}/${students.length} sinh viên đã nộp`} />
        <ProgressBar value={completion} label={`${completion}% hoàn thành`} className="mt-5" />
      </Card>
      <Card className="mt-5 p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <label className="text-body-sm font-semibold">
            Tìm sinh viên
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm sinh viên theo tên hoặc mã..."
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
              {Object.entries(labSubmissionStatusMeta).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-body-sm font-semibold">
            Lớp
            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
            >
              <option value="ALL">Tất cả</option>
              {assignment.classIds.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        {visible.length ? (
          <DataTable
            columns={[
              'Mã sinh viên',
              'Họ tên',
              'Trạng thái thực hiện',
              'Bắt đầu',
              'Nộp bài',
              'Số lần',
              'Minh chứng',
              'Hành động',
            ]}
            rows={visible}
            renderRow={(student) => {
              const meta = labSubmissionStatusMeta[student.labStatus];
              return (
                <tr className="border-t border-[#E2E8F0]">
                  <td className="px-3 py-3 font-mono">{student.id}</td>
                  <td className="px-3 py-3 font-semibold whitespace-nowrap">{student.name}</td>
                  <td className="px-3 py-3">
                    <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(student.submission?.startedAt)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(student.submission?.submittedAt)}</td>
                  <td className="px-3 py-3">{student.submission?.attemptCount ?? '—'}</td>
                  <td className="px-3 py-3">
                    {student.submission?.evidence.report ? 'Có báo cáo' : 'Chưa có báo cáo'}
                  </td>
                  <td className="px-3 py-3">
                    {student.submission?.evidence.report ? (
                      <div className="space-y-1">
                        <a
                          href={`lecturer_lab_submission_detail.html?submission=${student.submission.id}`}
                          className="block font-semibold text-primary whitespace-nowrap"
                        >
                          Xem báo cáo
                        </a>
                        {(() => {
                          const grading = gradings.find((item) => item.submissionId === student.submission.id);
                          const gradingStatus = grading?.status ?? 'UNGRADED';
                          return (
                            <a
                              href={`lecturer_lab_grading.html?submission=${student.submission.id}`}
                              className="block text-body-sm font-semibold text-[#475569]"
                            >
                              {labGradingStatusMeta[gradingStatus].label}
                            </a>
                          );
                        })()}
                      </div>
                    ) : (
                      <span className="text-body-sm text-[#64748B]">Chưa có báo cáo</span>
                    )}
                  </td>
                </tr>
              );
            }}
          />
        ) : (
          <div className="py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-[#94A3B8]">search_off</span>
            <h2 className="mt-3 text-headline-sm font-bold">Không tìm thấy sinh viên</h2>
            <Button variant="secondary" className="mt-4" onClick={reset}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </Card>
    </LecturerPageShell>
  );
}
